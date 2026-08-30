// src/services/collectorsService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface Collector {
  id: number;
  name: string;
  phone_number?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface CreateCollectorData {
  name: string;
  phone_number?: string;
}

export interface UpdateCollectorData {
  name?: string;
  phone_number?: string;
  is_active?: boolean;
}

export interface MemberForReassign {
  id: number;
  membership_id: string;
  full_name: string;
  phone_number?: string | null;
  collector_id: number | null;
  collector_name: string | null;
}

class CollectorsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Invalid response from server (HTML received). Check endpoint: ${endpoint}`);
    }

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'API request failed';
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.detail) {
        errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors;
      } else {
        const fieldErrors = Object.keys(data)
          .filter((key) => Array.isArray(data[key]) || typeof data[key] === 'string')
          .map((key) => `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`)
          .join('; ');
        if (fieldErrors) errorMessage = fieldErrors;
      }
      throw new Error(errorMessage);
    }

    return data;
  }

  async getCollectors(activeOnly: boolean = true): Promise<Collector[]> {
    const data = await this.fetchWithAuth(`/api/auth/collectors/?active_only=${activeOnly}`);
    if (Array.isArray(data)) return data;
    return data.results || [];
  }

  async createCollector(payload: CreateCollectorData): Promise<Collector> {
    return this.fetchWithAuth('/api/auth/collectors/', 'POST', payload);
  }

  // CollectorViewSet is a plain ModelViewSet — only `create` was overridden,
  // so PATCH /api/auth/collectors/{id}/ already works with no backend changes.
  async updateCollector(collectorId: number, payload: UpdateCollectorData): Promise<Collector> {
    return this.fetchWithAuth(`/api/auth/collectors/${collectorId}/`, 'PATCH', payload);
  }

  // Assumes MemberViewSet is mounted at /api/members/ — adjust if your
  // urls.py registers it under a different prefix.
  async getAllMembers(search?: string): Promise<MemberForReassign[]> {
    const query = search ? `?all=true&search=${encodeURIComponent(search)}` : '?all=true';
    const data = await this.fetchWithAuth(`/api/members/${query}`);
    const list = data.results || data;
    return (Array.isArray(list) ? list : []).map((m: any) => ({
      id: m.id,
      membership_id: m.membership_id,
      full_name: m.full_name,
      phone_number: m.phone_number,
      collector_id: m.collector_id ?? null,
      collector_name: m.collector_name ?? null,
    }));
  }

  // Members currently attached to one specific collector — powers the
  // "move all members" bulk action.
  async getMembersByCollector(collectorId: number): Promise<MemberForReassign[]> {
    const data = await this.fetchWithAuth(`/api/members/?all=true&collector=${collectorId}`);
    const list = data.results || data;
    return (Array.isArray(list) ? list : []).map((m: any) => ({
      id: m.id,
      membership_id: m.membership_id,
      full_name: m.full_name,
      phone_number: m.phone_number,
      collector_id: m.collector_id ?? null,
      collector_name: m.collector_name ?? null,
    }));
  }

  async reassignMemberCollector(memberId: number, collectorId: number): Promise<MemberForReassign> {
    const data = await this.fetchWithAuth(`/api/members/${memberId}/`, 'PATCH', { collector: collectorId });
    return {
      id: data.id,
      membership_id: data.membership_id,
      full_name: data.full_name,
      phone_number: data.phone_number,
      collector_id: data.collector_id ?? null,
      collector_name: data.collector_name ?? null,
    };
  }

  // Moves every member currently attached to `fromCollectorId` over to
  // `toCollectorId`. No bulk endpoint exists server-side, so this issues
  // one PATCH per member. Returns how many succeeded and any failures.
  async bulkReassignCollector(
    fromCollectorId: number,
    toCollectorId: number
  ): Promise<{ movedCount: number; failed: { memberId: number; error: string }[] }> {
    const members = await this.getMembersByCollector(fromCollectorId);

    const results = await Promise.allSettled(
      members.map((m) => this.reassignMemberCollector(m.id, toCollectorId))
    );

    const failed: { memberId: number; error: string }[] = [];
    let movedCount = 0;

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        movedCount += 1;
      } else {
        failed.push({ memberId: members[idx].id, error: r.reason?.message || 'Failed to reassign' });
      }
    });

    return { movedCount, failed };
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const collectorsService = new CollectorsService();
export default collectorsService;