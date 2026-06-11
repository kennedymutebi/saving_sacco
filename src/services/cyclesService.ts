// src/services/cyclesService.ts

export interface SavingsCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  interest_rate?: number;
  total_savings?: number;
  total_profit?: number;
  member_count?: number;
}

// ✅ UPDATED: Full create/update payload — all fields optional except start_date
export interface CreateCycleData {
  start_date: string;
  name?: string;
  end_date?: string | null;
  status?: 'active' | 'upcoming' | 'closed';
  interest_rate?: number;
}

export interface CycleStatistics {
  active: number;
  upcoming: number;
  closed: number;
  total?: number;
}

const API_BASE_URL = 'http://84.247.171.71:8082';

class CyclesService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Invalid response from server (HTML received). Check endpoint: ${endpoint}`);
    }

    // 204 No Content (e.g. DELETE with no body)
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    console.log(`Cycles API ${endpoint}:`, response.status, data);

    if (!response.ok) {
      const errorMessage =
        data.detail ||
        data.message ||
        data.error ||
        Object.entries(data)
          .map(([key, value]) =>
            Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`
          )
          .join(', ') ||
        'API request failed';
      throw new Error(errorMessage);
    }

    return data;
  }

  async getAllCycles(): Promise<SavingsCycle[]> {
    const data = await this.fetchWithAuth('/api/cycles/cycles/');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data?.id) return [data];
    return [];
  }

  async getCycle(id: string): Promise<SavingsCycle> {
    return this.fetchWithAuth(`/api/cycles/cycles/${id}/`);
  }

  async getActiveCycle(): Promise<SavingsCycle> {
    return this.fetchWithAuth('/api/cycles/cycles/active/');
  }

  async createCycle(cycleData: CreateCycleData): Promise<SavingsCycle> {
    return this.fetchWithAuth('/api/cycles/cycles/', {
      method: 'POST',
      body: JSON.stringify(cycleData),
    });
  }

  async updateCycle(id: string, cycleData: CreateCycleData): Promise<SavingsCycle> {
    return this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(cycleData),
    });
  }

  async partialUpdateCycle(id: string, cycleData: Partial<CreateCycleData>): Promise<SavingsCycle> {
    return this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(cycleData),
    });
  }

  // ✅ DELETE — returns 200 with message or 204 No Content
  async deleteCycle(id: string): Promise<void> {
    await this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
      method: 'DELETE',
    });
  }

  // ✅ CLOSE — POST /api/cycles/{id}/close/
  async closeCycle(id: string): Promise<SavingsCycle> {
    return this.fetchWithAuth(`/api/cycles/cycles/${id}/close/`, {
      method: 'POST',
    });
  }

  // ✅ REOPEN — POST /api/cycles/{id}/reopen/
  async reopenCycle(id: string): Promise<SavingsCycle> {
    return this.fetchWithAuth(`/api/cycles/cycles/${id}/reopen/`, {
      method: 'POST',
    });
  }

  async getCycleStatistics(): Promise<CycleStatistics> {
    return this.fetchWithAuth('/api/cycles/cycles/statistics/');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const cyclesService = new CyclesService();
export default cyclesService;