// src/services/collectorSummaryService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface Collector {
  id: number;
  name: string;
  phone_number?: string | null;
  is_active?: boolean;
}

export interface CollectorSummary {
  collector: { id: number; name: string };
  period: string;
  total_saved: number;
  total_withdrawn: number;
  net_balance: number;
  members_count: number;
  entries_count: number;
}

export type SummaryPeriod =
  | { type: 'today' }
  | { type: 'month'; month: string }   // YYYY-MM
  | { type: 'all_time' };

class CollectorSummaryService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(endpoint: string): Promise<any> {
    const token = this.getAuthToken();
    if (!token) throw new Error('No authentication token found. Please login again.');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Invalid response from server (HTML received). Check endpoint: ${endpoint}`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.message || data.error || 'API request failed');
    }
    return data;
  }

  async getCollectors(): Promise<Collector[]> {
    const data = await this.fetchWithAuth('/api/auth/collectors/?active_only=true');
    if (Array.isArray(data)) return data;
    return data.results || [];
  }

  async getCollectorSummary(collectorId: number, period: SummaryPeriod): Promise<CollectorSummary> {
    let query = '';
    if (period.type === 'today') {
      query = `?date=${new Date().toISOString().split('T')[0]}`;
    } else if (period.type === 'month') {
      query = `?month=${period.month}`;
    }
    // 'all_time' → no query params at all
    return this.fetchWithAuth(`/api/savings/collectors/${collectorId}/summary/${query}`);
  }

  // Fetches every collector's summary for the given period, plus an overall total
  async getAllCollectorsSummary(period: SummaryPeriod): Promise<{
    collectors: CollectorSummary[];
    overall: { total_saved: number; total_withdrawn: number; net_balance: number; members_count: number; entries_count: number };
  }> {
    const collectors = await this.getCollectors();

    const summaries = await Promise.all(
      collectors.map((c) =>
        this.getCollectorSummary(c.id, period).catch((err) => {
          console.error(`Failed to fetch summary for collector ${c.id}:`, err);
          return {
            collector: { id: c.id, name: c.name },
            period: 'error',
            total_saved: 0,
            total_withdrawn: 0,
            net_balance: 0,
            members_count: 0,
            entries_count: 0,
          } as CollectorSummary;
        })
      )
    );

    const overall = summaries.reduce(
      (acc, s) => ({
        total_saved: acc.total_saved + s.total_saved,
        total_withdrawn: acc.total_withdrawn + s.total_withdrawn,
        net_balance: acc.net_balance + s.net_balance,
        members_count: acc.members_count + s.members_count,
        entries_count: acc.entries_count + s.entries_count,
      }),
      { total_saved: 0, total_withdrawn: 0, net_balance: 0, members_count: 0, entries_count: 0 }
    );

    summaries.sort((a, b) => b.total_saved - a.total_saved); // highest collector first

    return { collectors: summaries, overall };
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const collectorSummaryService = new CollectorSummaryService();
export default collectorSummaryService;