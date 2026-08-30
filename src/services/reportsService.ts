// src/services/reportsService.ts

const API_BASE_URL = 'http://84.247.171.71:8082';

export interface SavingsCycle {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'closed';
  interest_rate: number;
}

export interface MemberSearchResult {
  id: number;
  name: string;
  membership_id: string;
  collector: string | null;
}

export interface CollectorOption {
  id: number;
  name: string;
}

class ReportsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private authHeaders(): HeadersInit {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return { Authorization: `Bearer ${token}` };
  }

  private async getJson(endpoint: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.authHeaders(),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Invalid response from server (HTML received). Check endpoint: ${endpoint}`);
    }

    const data = await response.json();
    if (!response.ok) {
      const msg = data?.detail || data?.error || data?.message || 'Request failed';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data;
  }

  private async downloadFile(endpoint: string, fallbackFilename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      let message = `Export failed (${response.status})`;
      try {
        const data = await response.json();
        message = data?.error || data?.detail || message;
      } catch {
        // response wasn't JSON either — keep the generic message
      }
      throw new Error(message);
    }

    const disposition = response.headers.get('content-disposition');
    let filename = fallbackFilename;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // ── Data for pickers ──────────────────────────────────────────────────

  async getCycles(): Promise<SavingsCycle[]> {
    const data = await this.getJson('/api/cycles/');
    return Array.isArray(data) ? data : data.results || [];
  }

  // Real endpoint: /api/members/?search=... (same one membersService.getAllMembers uses).
  // Mapped here to {id, name, membership_id, collector} so ReportsPage doesn't
  // need to change regardless of which underlying field names the API returns.
  async searchMembers(query: string): Promise<MemberSearchResult[]> {
    if (!query.trim()) return [];
    const data = await this.getJson(`/api/members/?search=${encodeURIComponent(query)}`);
    const list = Array.isArray(data) ? data : data.results || [];
    return list.map((m: any) => ({
      id: m.id,
      name: m.full_name,
      membership_id: m.membership_id,
      collector: m.collector_name ?? null,
    }));
  }

  // Real endpoint: /api/auth/collectors/ (same one collectorsService.getCollectors uses).
  async getCollectors(activeOnly: boolean = true): Promise<CollectorOption[]> {
    const data = await this.getJson(`/api/auth/collectors/?active_only=${activeOnly}`);
    const list = Array.isArray(data) ? data : data.results || [];
    return list.map((c: any) => ({ id: c.id, name: c.name }));
  }

  // ── Cycle exports ─────────────────────────────────────────────────────

  async downloadCycleExcel(cycleId?: number): Promise<void> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    await this.downloadFile(`/api/savings/export/cycle/${qs}`, 'cycle_savings.xlsx');
  }

  async downloadCyclePdf(cycleId?: number): Promise<void> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    await this.downloadFile(`/api/savings/export/cycle/pdf/${qs}`, 'cycle_savings.pdf');
  }

  // ── Member exports ───────────────────────────────────────────────────

  async downloadMemberHistoryExcel(memberId: number): Promise<void> {
    await this.downloadFile(`/api/savings/export/member/${memberId}/`, 'member_history.xlsx');
  }

  async downloadMemberStatementPdf(memberId: number): Promise<void> {
    await this.downloadFile(`/api/savings/export/member/${memberId}/pdf/`, 'member_statement.pdf');
  }

  // ── Collector exports ────────────────────────────────────────────────

  async downloadCollectorExcel(collectorId: number, cycleId?: number): Promise<void> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    await this.downloadFile(`/api/savings/export/collector/${collectorId}/${qs}`, 'collector_summary.xlsx');
  }

  async downloadCollectorPdf(collectorId: number, cycleId?: number): Promise<void> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    await this.downloadFile(`/api/savings/export/collector/${collectorId}/pdf/${qs}`, 'collector_summary.pdf');
  }

  async downloadAllCollectorsExcel(cycleId?: number): Promise<void> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    await this.downloadFile(`/api/savings/export/collectors/${qs}`, 'all_collectors_summary.xlsx');
  }
}

export const reportsService = new ReportsService();
export default reportsService;