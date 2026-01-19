// src/services/membersService.ts

export interface Member {
  id: number;
  membership_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  place_of_residence: string;
  date_joined: string;
  total_savings?: number;
  is_active_member?: boolean;
}

export interface CreateMemberData {
  first_name: string;
  last_name: string;
  phone_number: string;
  place_of_residence: string;
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

    // Log request details for debugging
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
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Check if response is HTML (usually means server error)
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('❌ HTML Response received:', htmlText.substring(0, 500));
      throw new Error(`Server error (${response.status}): Received HTML instead of JSON. Check endpoint: ${endpoint}`);
    }

    // Parse JSON response
    const data = await response.json();
    console.log(`📥 Response ${endpoint}:`, response.status, data);

    if (!response.ok) {
      console.error('❌ API Error:', data);
      
      // Better error message extraction
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
   * Get all members with optional search
   */
  async getAllMembers(search?: string): Promise<Member[]> {
    try {
      const endpoint = search 
        ? `/api/members/?search=${encodeURIComponent(search)}`
        : '/api/members/';
      
      const data = await this.fetchWithAuth(endpoint);
      console.log('Members fetched successfully');

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Get a single member by ID
   */
  async getMember(id: number): Promise<Member> {
    try {
      const data = await this.fetchWithAuth(`/api/members/${id}/`);
      console.log('Member fetched successfully');
      return data;
    } catch (error) {
      console.error(`Error fetching member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new member
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

  /**
   * Update a member (full update)
   */
  async updateMember(id: number, memberData: UpdateMemberData): Promise<Member> {
    try {
      console.log(`Updating member ${id} with data:`, memberData);
      
      const data = await this.fetchWithAuth(`/api/members/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(memberData),
      });
      
      console.log('Member updated successfully:', data);
      return data;
    } catch (error) {
      console.error(`Error updating member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Partial update a member (only specified fields)
   */
  async partialUpdateMember(id: number, memberData: Partial<UpdateMemberData>): Promise<Member> {
    try {
      console.log(`Partially updating member ${id} with data:`, memberData);
      
      const data = await this.fetchWithAuth(`/api/members/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(memberData),
      });
      
      console.log('Member partially updated successfully:', data);
      return data;
    } catch (error) {
      console.error(`Error partially updating member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a member
   */
  async deleteMember(id: number): Promise<void> {
    try {
      await this.fetchWithAuth(`/api/members/${id}/`, {
        method: 'DELETE',
      });
      console.log(`Member ${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get member's savings transactions
   */
  async getMemberSavings(id: number, cycleId?: string): Promise<any[]> {
    try {
      const endpoint = cycleId
        ? `/api/members/${id}/savings/?cycle=${cycleId}`
        : `/api/members/${id}/savings/`;
      
      const data = await this.fetchWithAuth(endpoint);
      console.log(`Member ${id} savings fetched successfully`);
      return data;
    } catch (error) {
      console.error(`Error fetching savings for member ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }
}

export const membersService = new MembersService();
export default membersService;