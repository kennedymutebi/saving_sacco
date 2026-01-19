// src/types/dashboard.ts

export interface DashboardStats {
  total_savings: number;
  total_profit: number;
  profit_margin: number;
  active_members: number;
  new_members_this_month: number;
  growth_percentage: number;
  current_cycle?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  };
}

export interface SavingsTrend {
  month: string;
  savings: number;
  profit: number;
}

export interface WeeklyDeposit {
  day: string;
  amount: number;
  deposits: number;
}

export interface RecentTransaction {
  member: {
    first_name: string;
    last_name: string;
  };
  type: string;
  amount: number;
  status: string;
  date: string;
  comment: string;
}

export interface TopSaver {
  rank: number;
  name: string;
  total_savings: number;
}

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
}

export interface AllDashboardData {
  stats: DashboardStats;
  trends: SavingsTrend[];
  weeklyDeposits: WeeklyDeposit[];
  transactions: RecentTransaction[];
  topSavers: TopSaver[];
}