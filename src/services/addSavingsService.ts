// src/services/addSavingsService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface Member {
  id: number;
  name: string;
  membership_id: string;
  total_savings: number;
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
  // Helper to get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Helper to make authenticated requests
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

    // For DELETE requests, 204 No Content is success
    if (method === 'DELETE' && response.status === 204) {
      console.log('DELETE request successful (204 No Content)');
      return null;
    }

    // Check if response is HTML → means server error / wrong URL
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        `Invalid response from server (HTML received). Check endpoint: ${endpoint}`
      );
    }

    const data = await response.json();

    console.log(`Add Savings API ${method} ${endpoint}:`, response.status, data);

    if (!response.ok) {
      // Log full error details
      console.error('API Error Details:', data);
      
      // Handle different error formats
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
        // If there are field-specific errors, extract them
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

  // Get all members with their total savings
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

  // Get active savings cycle
  async getActiveCycle(): Promise<SavingsCycle | null> {
    try {
      const data = await this.fetchWithAuth('/api/savings/cycles/?status=active');
      console.log('Active cycle fetched successfully');
      
      // Router returns paginated results
      const results = data.results || data;
      return Array.isArray(results) && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching active cycle:', error);
      throw error;
    }
  }

  // Create a new savings entry
  async createSavingsEntry(savingsData: CreateSavingsData): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(
        '/api/savings/savings/',
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

  // Update an existing savings entry
  async updateSavingsEntry(savingsId: number, savingsData: UpdateSavingsData): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(
        `/api/savings/savings/${savingsId}/`,
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

  // Delete a savings entry
  async deleteSavingsEntry(savingsId: number): Promise<void> {
    try {
      await this.fetchWithAuth(
        `/api/savings/savings/${savingsId}/`,
        'DELETE'
      );
      console.log('Savings entry deleted successfully');
    } catch (error) {
      console.error('Error deleting savings entry:', error);
      throw error;
    }
  }

  // Get a single savings entry by ID
  async getSavingsEntry(savingsId: number): Promise<SavingsEntry> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/savings/${savingsId}/`);
      console.log('Savings entry fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching savings entry:', error);
      throw error;
    }
  }

  // Get recent savings entries
  async getRecentSavings(limit: number = 10): Promise<SavingsEntry[]> {
    try {
      const data = await this.fetchWithAuth(`/api/savings/savings/?limit=${limit}`);
      console.log('Recent savings fetched successfully');
      
      // API returns array directly or paginated results
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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log('Checking add savings authentication, token:', token ? 'exists' : 'missing');
    return !!token;
  }
}

export const addSavingsService = new AddSavingsService();
export default addSavingsService;