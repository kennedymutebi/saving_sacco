// src/types/viewSavingsTypes.ts

export interface SavingsEntry {
  id: number;
  date: string;
  amount: number;
  comment: string;
}

export interface Member {
  id: number;
  name: string;
  membership_id: string;
  total_savings: number;
  savings?: SavingsEntry[];
}

export interface MemberSavingsDetail {
  member: Member;
  current_month_entries: SavingsEntry[];
  current_month_total: number;
  month: string;
}