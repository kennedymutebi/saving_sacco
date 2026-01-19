// src/services/cyclesService.ts

export interface SavingsCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'closed';
  created_at: string;
  total_savings?: number;
  total_profit?: number;
  member_count?: number;
}

export interface CreateCycleData {
  start_date: string;
}

export interface CycleStatistics {
  active: number;
  upcoming: number;
  closed: number;
}

const API_BASE_URL = 'http://84.247.171.71:8082';

class CyclesService {
  // Helper to get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Helper to make authenticated requests
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Check if response is HTML → means server error / wrong URL
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        `Invalid response from server (HTML received). Check endpoint: ${endpoint}`
      );
    }

    // Handle 204 No Content responses (e.g., DELETE)
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    console.log(`Cycles API ${endpoint}:`, response.status, data);

    if (!response.ok) {
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

  // Get all cycles
  async getAllCycles(): Promise<SavingsCycle[]> {
    try {
      const data = await this.fetchWithAuth('/api/cycles/cycles/');
      console.log('Raw API response:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // If API returns {cycles: "url"}, we need to fetch from that URL
        if (typeof data.cycles === 'string' && data.cycles.startsWith('http')) {
          console.log('Fetching cycles from nested URL:', data.cycles);
          const nestedResponse = await this.fetchWithAuth(data.cycles.replace(API_BASE_URL, ''));
          console.log('Nested API response:', nestedResponse);
          
          if (Array.isArray(nestedResponse)) {
            return nestedResponse;
          } else if (nestedResponse && Array.isArray(nestedResponse.results)) {
            return nestedResponse.results;
          }
        }
        
        // If API returns an object with a results key (paginated)
        if (Array.isArray(data.results)) {
          return data.results;
        }
        
        // If API returns a single object, wrap it in an array
        if (data.id) {
          return [data];
        }
      }
      
      // Fallback to empty array
      console.warn('Unexpected data format from API:', data);
      return [];
    } catch (error) {
      console.error('Error fetching cycles:', error);
      throw error;
    }
  }

  // Get a specific cycle by ID
  async getCycle(id: string): Promise<SavingsCycle> {
    try {
      const data = await this.fetchWithAuth(`/api/cycles/cycles/${id}/`);
      console.log('Cycle fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching cycle:', error);
      throw error;
    }
  }

  // Get active cycle
  async getActiveCycle(): Promise<SavingsCycle> {
    try {
      const data = await this.fetchWithAuth('/api/cycles/cycles/active/');
      console.log('Active cycle fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching active cycle:', error);
      throw error;
    }
  }

  // Create a new cycle
  async createCycle(cycleData: CreateCycleData): Promise<SavingsCycle> {
    try {
      console.log('Creating cycle with data:', cycleData);
      const data = await this.fetchWithAuth('/api/cycles/cycles/', {
        method: 'POST',
        body: JSON.stringify(cycleData),
      });
      console.log('Cycle created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating cycle:', error);
      throw error;
    }
  }

  // Update a cycle (full update)
  async updateCycle(id: string, cycleData: CreateCycleData): Promise<SavingsCycle> {
    try {
      const data = await this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(cycleData),
      });
      console.log('Cycle updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating cycle:', error);
      throw error;
    }
  }

  // Partial update a cycle
  async partialUpdateCycle(id: string, cycleData: Partial<CreateCycleData>): Promise<SavingsCycle> {
    try {
      const data = await this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(cycleData),
      });
      console.log('Cycle partially updated successfully');
      return data;
    } catch (error) {
      console.error('Error partially updating cycle:', error);
      throw error;
    }
  }

  // Delete a cycle
  async deleteCycle(id: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/api/cycles/cycles/${id}/`, {
        method: 'DELETE',
      });
      console.log('Cycle deleted successfully');
    } catch (error) {
      console.error('Error deleting cycle:', error);
      throw error;
    }
  }

  // Close a cycle
  async closeCycle(id: string): Promise<SavingsCycle> {
    try {
      const data = await this.fetchWithAuth(`/api/cycles/cycles/${id}/close/`, {
        method: 'POST',
      });
      console.log('Cycle closed successfully');
      return data;
    } catch (error) {
      console.error('Error closing cycle:', error);
      throw error;
    }
  }

  // Get cycle statistics
  async getCycleStatistics(): Promise<CycleStatistics> {
    try {
      const data = await this.fetchWithAuth('/api/cycles/cycles/statistics/');
      console.log('Cycle statistics fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching cycle statistics:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log('Checking cycles authentication, token:', token ? 'exists' : 'missing');
    return !!token;
  }
}

export const cyclesService = new CyclesService();
export default cyclesService;