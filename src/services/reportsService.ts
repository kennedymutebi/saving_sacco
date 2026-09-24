// src/services/reportsService.ts
//
// Picker endpoints (getCycles/searchMembers/getCollectors) are unchanged.
// The old download* methods (which fetched pre-built PDF/Excel blobs) are
// replaced with getXReportData methods that fetch plain JSON — the actual
// PDF/Excel file is then built client-side (see ../reports/pdf and
// ../reports/excel) so backend and frontend can never disagree on a total.

import type { CycleReportData } from '../reports/pdf/components/CycleReportDocument';
import type { MemberStatementData } from '../reports/pdf/components/MemberStatementDocument';
import type { CollectorSummaryData } from '../reports/pdf/components/CollectorSummaryDocument';
import type { AllCollectorsData } from '../reports/excel/allCollectorsWorkbook';

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

  // ── Data for pickers ──────────────────────────────────────────────────

  async getCycles(): Promise<SavingsCycle[]> {
    const data = await this.getJson('/api/cycles/');
    return Array.isArray(data) ? data : data.results || [];
  }

  // Real endpoint: /api/members/?search=... (same one membersService.getAllMembers uses).
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

  // ── Report data (JSON — PDF/Excel are built client-side from these) ────
  // New backend endpoints, sibling to the old /api/savings/export/... ones.
  // See report_views.py for the Django side of these four.

  async getCycleReport(cycleId?: number): Promise<CycleReportData> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    return this.getJson(`/api/savings/report-data/cycle/${qs}`);
  }

  async getMemberStatement(memberId: number): Promise<MemberStatementData> {
    return this.getJson(`/api/savings/report-data/member/${memberId}/`);
  }

  async getCollectorSummary(collectorId: number, cycleId?: number): Promise<CollectorSummaryData> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    return this.getJson(`/api/savings/report-data/collector/${collectorId}/${qs}`);
  }

  async getAllCollectorsSummary(cycleId?: number): Promise<AllCollectorsData> {
    const qs = cycleId ? `?cycle_id=${cycleId}` : '';
    return this.getJson(`/api/savings/report-data/collectors/${qs}`);
  }
}

export const reportsService = new ReportsService();
export default reportsService;