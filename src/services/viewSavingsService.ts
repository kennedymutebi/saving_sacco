// src/services/viewSavingsService.ts
import type { Member, SavingsEntry } from '../types/viewSavingsTypes';

const API_BASE_URL = 'http://84.247.171.71:8082';

class ViewSavingsService {
  // Helper to get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Helper to make authenticated requests
  private async fetchWithAuth(endpoint: string): Promise<any> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Check if response is HTML → means server error / wrong URL
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        `Invalid response from server (HTML received). Check endpoint: ${endpoint}`
      );
    }

    const data = await response.json();

    console.log(`View Savings API ${endpoint}:`, response.status, data);

    if (!response.ok) {
      throw new Error(data.detail || data.message || data.error || 'API request failed');
    }

    return data;
  }

  // Get all members with their total savings
  async getMembersWithSavings(): Promise<Member[]> {
    try {
      const data = await this.fetchWithAuth('/api/savings/view-savings/members/');
      console.log('Members with savings fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching members with savings:', error);
      throw error;
    }
  }

  // Get detailed savings for a specific member (current month)
  async getMemberSavingsDetail(memberId: number): Promise<{
    member: Member;
    current_month_entries: SavingsEntry[];
    current_month_total: number;
    month: string;
  }> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/view-savings/members/${memberId}/`);
      console.log('Member savings detail fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching member savings detail:', error);
      throw error;
    }
  }

  // Get full savings history for a member (all months)
  async getMemberSavingsHistory(memberId: number): Promise<SavingsEntry[]> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/view-savings/members/${memberId}/history/`);
      console.log('Member savings history fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching member savings history:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log('Checking view savings authentication, token:', token ? 'exists' : 'missing');
    return !!token;
  }
}

export const viewSavingsService = new ViewSavingsService();
export default viewSavingsService;