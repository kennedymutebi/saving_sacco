// src/services/dashboardService.ts
import type {
  DashboardStats,
  SavingsTrend,
  WeeklyDeposit,
  RecentTransaction,
  TopSaver,
} from '../types/dashboardtypes';

const API_BASE_URL = 'http://84.247.171.71:8082';

class DashboardService {
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

    console.log(`Dashboard API ${endpoint}:`, response.status, data);

    if (!response.ok) {
      throw new Error(data.detail || data.message || data.error || 'API request failed');
    }

    return data;
  }

  // ✅ FIXED — Correct endpoint for dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const data = await this.fetchWithAuth('/api/dashboard/stats/');
      console.log('Dashboard stats fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get savings and profit trends (last 7 months)
  async getSavingsTrends(): Promise<SavingsTrend[]> {
    try {
      const data = await this.fetchWithAuth('/api/dashboard/trends/');
      console.log('Savings trends fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching savings trends:', error);
      throw error;
    }
  }

  // Get weekly deposit activity
  async getWeeklyDeposits(): Promise<WeeklyDeposit[]> {
    try {
      const data = await this.fetchWithAuth('/api/dashboard/weekly-deposits/');
      console.log('Weekly deposits fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching weekly deposits:', error);
      throw error;
    }
  }

  // Get recent transactions (last 10)
  async getRecentTransactions(): Promise<RecentTransaction[]> {
    try {
      const data = await this.fetchWithAuth('/api/dashboard/transactions/recent/');
      console.log('Recent transactions fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  // Get top 5 savers
  async getTopSavers(): Promise<TopSaver[]> {
    try {
      const data = await this.fetchWithAuth('/api/dashboard/top-savers/');
      console.log('Top savers fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching top savers:', error);
      throw error;
    }
  }

  // Fetch all dashboard data at once
  async getAllDashboardData() {
    try {
      console.log('Fetching all dashboard data...');

      const [stats, trends, weeklyDeposits, transactions, topSavers] = await Promise.all([
        this.getDashboardStats(),
        this.getSavingsTrends(),
        this.getWeeklyDeposits(),
        this.getRecentTransactions(),
        this.getTopSavers(),
      ]);

      console.log('All dashboard data fetched successfully');

      return {
        stats,
        trends,
        weeklyDeposits,
        transactions,
        topSavers,
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  }

  // Check if user is authenticated (for dashboard access)
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    console.log('Checking dashboard authentication, token:', token ? 'exists' : 'missing');
    return !!token;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
