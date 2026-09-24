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

/**
 * Shape returned by GET /api/savings/view-savings/members/{id}/
 * (MemberSavingsDetailView). Kept close to the real backend response —
 * see parseBalance() in WithdrawPage.tsx for which fields it actually
 * consumes, with legacy fallbacks for older field names.
 */
export interface MemberBalance {
  member: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    membership_id: string;
    initials?: string;
  };
  cycle?: {
    name: string;
    month: string;
  };

  total_lifetime: number;
  total_withdrawn_lifetime: number;
  net_balance_lifetime: number;

  // WithdrawPage.tsx reads this exact name — Total Balance, what the
  // withdrawal endpoint validates against.
  net_balance: number;

  total_this_month: number;
  total_withdrawn_this_month: number;
  balance_this_month: number;

  carry_forward: number;
  brought_forward: number;

  // What she's charged this cycle, and the raw amount it's based on.
  // Deliberately independent of any withdrawal — never changes because
  // money was withdrawn, only because the collected amount itself
  // crosses into a different tier.
  monthly_charge: number;
  collected_this_month: number;

  entries_count?: number;
  entries?: any[];
  withdrawals?: any[];
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

  // Full balance + monthly-charge detail for one member, matching exactly
  // what CreateWithdrawalSerializer checks server-side for the total, plus
  // the tiered charge for this cycle (see MemberBalance above).
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