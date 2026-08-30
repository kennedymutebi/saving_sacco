// src/services/membersService.ts

export interface Collector {
  id: number;
  name: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Member {
  id: number;
  membership_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  place_of_residence: string | null;
  date_joined: string;
  total_savings?: number;
  current_balance?: number;
  is_active_member?: boolean;
  collector_id: number | null;
  collector_name: string | null;
}

export interface CreateMemberData {
  first_name: string;
  last_name: string;
  phone_number?: string;
  place_of_residence?: string;
  collector: number; // required — id of the Collector this member belongs to
}

export interface UpdateMemberData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  place_of_residence?: string;
  is_active_member?: boolean;
}

export interface MembersListResponse {
  count: number;
  results: Member[];
}

const API_BASE_URL = 'http://84.247.171.71:8082';

class MembersService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
      const bodyData = options.body ? JSON.parse(options.body as string) : null;
      console.log(`🚀 ${options.method} ${endpoint}`);
      console.log('📤 Request Body:', JSON.stringify(bodyData, null, 2));
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');

    if (response.status === 204) {
      return null;
    }

    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('❌ HTML Response received:', htmlText.substring(0, 500));
      throw new Error(`Server error (${response.status}): Received HTML instead of JSON. Check endpoint: ${endpoint}`);
    }

    const data = await response.json();
    console.log(`📥 Response ${endpoint}:`, response.status, data);

    if (!response.ok) {
      console.error('❌ API Error:', data);

      const errorMessage =
        data.detail ||
        data.message ||
        data.error ||
        Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join(', ') ||
        'API request failed';

      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * Get all members with optional search and optional collector filter.
   * Results are ordered NEWEST FIRST by the backend (-created_at).
   */
  async getAllMembers(search?: string, collectorId?: number): Promise<Member[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (collectorId) params.set('collector', String(collectorId));
      const qs = params.toString();
      const endpoint = qs ? `/api/members/?${qs}` : '/api/members/';

      const data = await this.fetchWithAuth(endpoint);

      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      return [];
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  async getMember(id: number): Promise<Member> {
    try {
      return await this.fetchWithAuth(`/api/members/${id}/`);
    } catch (error) {
      console.error(`Error fetching member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new member. `collector` is REQUIRED by the backend —
   * use getCollectors() to populate the dropdown before calling this.
   */
  async createMember(memberData: CreateMemberData): Promise<Member> {
    try {
      console.log('Creating member with data:', memberData);
      const data = await this.fetchWithAuth('/api/members/', {
        method: 'POST',
        body: JSON.stringify(memberData),
      });
      console.log('Member created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  async updateMember(id: number, memberData: UpdateMemberData): Promise<Member> {
    try {
      const data = await this.fetchWithAuth(`/api/members/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(memberData),
      });
      return data;
    } catch (error) {
      console.error(`Error updating member ${id}:`, error);
      throw error;
    }
  }

  async partialUpdateMember(id: number, memberData: Partial<UpdateMemberData>): Promise<Member> {
    try {
      const data = await this.fetchWithAuth(`/api/members/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(memberData),
      });
      return data;
    } catch (error) {
      console.error(`Error partially updating member ${id}:`, error);
      throw error;
    }
  }

  async deleteMember(id: number): Promise<void> {
    try {
      await this.fetchWithAuth(`/api/members/${id}/`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting member ${id}:`, error);
      throw error;
    }
  }

  // ─── Collectors ───────────────────────────────────────────────────────────
  // Collectors live under /api/auth/collectors/ (admin-managed, no login).
  // Use these to populate the "Collector" dropdown when creating a member.

  async getCollectors(activeOnly: boolean = true): Promise<Collector[]> {
    try {
      const data = await this.fetchWithAuth(`/api/auth/collectors/?active_only=${activeOnly}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching collectors:', error);
      throw error;
    }
  }

  async createCollector(name: string, phoneNumber?: string): Promise<Collector> {
    try {
      return await this.fetchWithAuth('/api/auth/collectors/', {
        method: 'POST',
        body: JSON.stringify({ name, phone_number: phoneNumber || null }),
      });
    } catch (error) {
      console.error('Error creating collector:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const membersService = new MembersService();
export default membersService;