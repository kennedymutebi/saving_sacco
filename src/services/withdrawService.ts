// src/services/withdrawService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface Member {
  id: number;
  name: string;
  membership_id: string;
  total_savings: number;
}

export interface WithdrawalAllocation {
  id: number;
  savings_entry: number;
  deposit_date: string;
  amount: string | number;
}

export interface Withdrawal {
  id: number;
  member: number;
  member_id?: string;
  member_name?: string;
  amount: string | number;
  date: string;
  reason: string;
  allocations: WithdrawalAllocation[];
  created_by?: number | null;
  created_at?: string;
}

export interface CreateWithdrawalData {
  member: number;
  amount: number;
  date: string;
  reason?: string;
}

export interface MemberBalance {
  member: {
    id: number;
    name: string;
    membership_id: string;
  };
  total_lifetime: number;
  total_withdrawn_lifetime: number;
  net_balance: number;
}

class WithdrawService {
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

    if (method === 'DELETE' && response.status === 204) {
      return null;
    }

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

  // Reuse the same members endpoint as Add Savings — any member, not collector-scoped
  async getMembers(): Promise<Member[]> {
    const data = await this.fetchWithAuth('/api/savings/view-savings/members/');
    const dataObj = data as any;
    return dataObj.members || dataObj.results || dataObj.data || [];
  }

  // Real available balance — lifetime deposits minus lifetime withdrawals,
  // matching exactly what CreateWithdrawalSerializer checks server-side.
  async getMemberBalance(memberId: number): Promise<MemberBalance> {
    return this.fetchWithAuth(`/api/savings/view-savings/members/${memberId}/`);
  }

  async getWithdrawals(memberId?: number): Promise<Withdrawal[]> {
    const query = memberId ? `?member=${memberId}` : '';
    const data = await this.fetchWithAuth(`/api/savings/withdrawals/${query}`);
    if (Array.isArray(data)) return data;
    return data.results || [];
  }

  async createWithdrawal(withdrawalData: CreateWithdrawalData): Promise<Withdrawal> {
    return this.fetchWithAuth('/api/savings/withdrawals/', 'POST', withdrawalData);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const withdrawService = new WithdrawService();
export default withdrawService;