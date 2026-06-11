/**
 * dashboardService.ts — Dashboard Data Service
 *
 * Fetches all data displayed on the admin dashboard:
 * - Summary statistics (total savings, profit, members)
 * - Savings & profit trends (last 7 months)
 * - Weekly deposit activity
 * - Recent transactions
 * - Top savers leaderboard
 *
 * Uses apiRequest() from apiClient.ts which automatically
 * handles token expiry by redirecting to /login on 401.
 *
 * Uses Promise.allSettled() so each section loads
 * independently — if one endpoint times out, the rest
 * of the dashboard still renders normally.
 */

import { apiRequest } from '../config/apiClient';
import type {
  DashboardStats,
  SavingsTrend,
  WeeklyDeposit,
  RecentTransaction,
  TopSaver,
} from '../types/dashboardtypes';

class DashboardService {

  /**
   * Fetches summary stats for the hero card and stat cards.
   * Endpoint: GET /api/dashboard/stats/
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiRequest('/api/dashboard/stats/');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Failed to fetch stats');
    return data;
  }

  /**
   * Fetches savings and profit trend data for the area chart.
   * Endpoint: GET /api/dashboard/trends/
   */
  async getSavingsTrends(): Promise<SavingsTrend[]> {
    const response = await apiRequest('/api/dashboard/trends/');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Failed to fetch trends');
    return data;
  }

  /**
   * Fetches weekly deposit totals for the bar chart.
   * Endpoint: GET /api/dashboard/weekly-deposits/
   */
  async getWeeklyDeposits(): Promise<WeeklyDeposit[]> {
    const response = await apiRequest('/api/dashboard/weekly-deposits/');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Failed to fetch weekly deposits');
    return data;
  }

  /**
   * Fetches the 10 most recent savings transactions.
   * Endpoint: GET /api/dashboard/transactions/recent/
   */
  async getRecentTransactions(): Promise<RecentTransaction[]> {
    const response = await apiRequest('/api/dashboard/transactions/recent/');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Failed to fetch transactions');
    return data;
  }

  /**
   * Fetches the top 5 savers ranked by total savings.
   * Endpoint: GET /api/dashboard/top-savers/
   */
  async getTopSavers(): Promise<TopSaver[]> {
    const response = await apiRequest('/api/dashboard/top-savers/');
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Failed to fetch top savers');
    return data;
  }

  /**
   * Fetches all dashboard sections in parallel.
   *
   * Uses Promise.allSettled() instead of Promise.all() so that
   * each section fails independently. If the trends endpoint times
   * out, stats, transactions and top savers still load normally.
   *
   * Each field falls back to null / empty array if its request fails.
   */
  async getAllDashboardData() {
    const [stats, trends, weeklyDeposits, transactions, topSavers] =
      await Promise.allSettled([
        this.getDashboardStats(),
        this.getSavingsTrends(),
        this.getWeeklyDeposits(),
        this.getRecentTransactions(),
        this.getTopSavers(),
      ]);

    // Stats is critical — if it fails we throw so the page shows the error state
    if (stats.status === 'rejected') {
      throw new Error(stats.reason?.message || 'Failed to load dashboard stats');
    }

    return {
      stats:          stats.value,
      trends:         trends.status          === 'fulfilled' ? trends.value         : [],
      weeklyDeposits: weeklyDeposits.status  === 'fulfilled' ? weeklyDeposits.value : [],
      transactions:   transactions.status    === 'fulfilled' ? transactions.value   : [],
      topSavers:      topSavers.status       === 'fulfilled' ? topSavers.value      : [],
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;