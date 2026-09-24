// src/services/addSavingsService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface Member {
  id: number;
  name: string;
  membership_id: string;
  total_savings: number;
  total_withdrawn?: number;
  brought_forward?: number;
  this_month?: number;
  total_balance?: number;
  collector_id?: number | null;
  collector_name?: string | null;
}

export interface SavingsEntry {
  id: number;
  member: number;
  member_id?: string;
  member_name?: string;
  cycle: number;
  cycle_name?: string;
  amount: string | number;
  date: string;
  comment: string;
  created_at?: string;
  updated_at?: string;
  is_adjustment?: boolean;
}

export interface CreateSavingsData {
  member: number;
  cycle: number;
  amount: number;
  date: string;
  comment?: string;
  send_sms?: boolean;
}

export interface UpdateSavingsData {
  amount?: number;
  date?: string;
  comment?: string;
  // NOTE: SavingsEntryViewSet.update() on the backend re-validates with
  // CreateSavingsEntrySerializer WITHOUT partial=True, so a PATCH that omits
  // required fields (e.g. member/cycle, if required on that serializer) can
  // 400. Sending these two along with the changed fields is a no-op if they
  // weren't required, and keeps edits working if they were — without
  // touching the backend.
  member?: number;
  cycle?: number;
}

export interface SavingsCycle {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'closed';
  interest_rate: number;
}

class AddSavingsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    console.log(`Add Savings API Request ${method} ${endpoint}:`, body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (method === 'DELETE' && response.status === 204) {
      console.log('DELETE request successful (204 No Content)');
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        `Invalid response from server (HTML received). Check endpoint: ${endpoint}`
      );
    }

    const data = await response.json();

    console.log(`Add Savings API ${method} ${endpoint}:`, response.status, data);

    if (!response.ok) {
      console.error('API Error Details:', data);

      let errorMessage = 'API request failed';

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.detail) {
        errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else {
        const fieldErrors = Object.keys(data)
          .filter(key => Array.isArray(data[key]) || typeof data[key] === 'string')
          .map(key => `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`)
          .join('; ');

        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  }

  async getMembers(): Promise<Member[]> {
    try {
      const data = await this.fetchWithAuth('/api/savings/view-savings/members/');
      console.log('Members fetched successfully');

      const dataObj = data as any;
      if (dataObj.error && dataObj.members && dataObj.members.length === 0) {
        throw new Error(dataObj.error + '. Please create an active savings cycle first.');
      }

      return dataObj.members || dataObj.results || dataObj.data || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  async getActiveCycle(): Promise<SavingsCycle | null> {
    try {
      const data = await this.fetchWithAuth('/api/cycles/active/');
      return data;
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('No active cycle')) {
        console.log('No active cycle currently set');
        return null;
      }
      console.error('Error fetching active cycle:', error);
      throw error;
    }
  }

  // FIXED: was '/api/savings/savings/' — savings/urls.py mounts
  // SavingsEntryViewSet at an EMPTY prefix ('') and that router is
  // already included under 'api/savings/' in the project's urls.py, so
  // the real endpoint is just '/api/savings/'. The doubled 'savings/'
  // matched no route SavingsEntryViewSet.create actually serves, hence
  // the 405.
  async createSavingsEntry(savingsData: CreateSavingsData): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(
        '/api/savings/',
        'POST',
        savingsData
      );
      console.log('Savings entry created successfully');
      return data;
    } catch (error) {
      console.error('Error creating savings entry:', error);
      throw error;
    }
  }

  // FIXED: same doubled-prefix bug — was '/api/savings/savings/{id}/'.
  // Backend's SavingsEntryViewSet.update() re-validates with
  // CreateSavingsEntrySerializer WITHOUT partial=True (see UpdateSavingsData
  // note above), so callers should include member/cycle alongside the
  // changed fields to avoid a 400 on required-field validation.
  async updateSavingsEntry(savingsId: number, savingsData: UpdateSavingsData): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(
        `/api/savings/${savingsId}/`,
        'PATCH',
        savingsData
      );
      console.log('Savings entry updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating savings entry:', error);
      throw error;
    }
  }

  // FIXED: same doubled-prefix bug. Backend guards against deleting an
  // entry a withdrawal has already drawn from — that comes back as a 400
  // with an `error` message, which fetchWithAuth surfaces via err.message.
  async deleteSavingsEntry(savingsId: number): Promise<void> {
    try {
      await this.fetchWithAuth(
        `/api/savings/${savingsId}/`,
        'DELETE'
      );
      console.log('Savings entry deleted successfully');
    } catch (error) {
      console.error('Error deleting savings entry:', error);
      throw error;
    }
  }

  // FIXED: same doubled-prefix bug.
  async getSavingsEntry(savingsId: number): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/${savingsId}/`);
      console.log('Savings entry fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching savings entry:', error);
      throw error;
    }
  }

  // FIXED: same doubled-prefix bug.
  async getRecentSavings(limit: number = 10): Promise<SavingsEntry[]> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/?limit=${limit}`);
      console.log('Recent savings fetched successfully');

      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return data.results || data.data || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching recent savings:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log('Checking add savings authentication, token:', token ? 'exists' : 'missing');
    return !!token;
  }
}

export const addSavingsService = new AddSavingsService();
export default addSavingsService;