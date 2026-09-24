// src/reports/pdf/CycleReportDocument.tsx
import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { brand, formatMoney ,formatDate} from '../../branding';
import { table } from '../../tableStyles';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';


export interface CycleMemberRow {
  membership_id: string;
  member_name: string;
  carry_forward: number;
  savings: number;
  withdrawals: number;
  closing_balance: number;
  returned_amount: number;
}

export interface CycleReportData {
  cycle_name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  members: CycleMemberRow[];
}

interface CycleCol {
  key: keyof CycleMemberRow;
  label: string;
  width: string;
  money?: boolean;
}

const COLS: CycleCol[] = [
  { key: 'membership_id', label: 'Membership ID', width: '14%' },
  { key: 'member_name', label: 'Member Name', width: '26%' },
  { key: 'carry_forward', label: 'Carry Fwd', width: '12%', money: true },
  { key: 'savings', label: 'Savings', width: '12%', money: true },
  { key: 'withdrawals', label: 'Withdrawals', width: '12%', money: true },
  { key: 'closing_balance', label: 'Closing Bal', width: '12%', money: true },
  { key: 'returned_amount', label: 'Returned', width: '12%', money: true },
];

export function CycleReportDocument({ data }: { data: CycleReportData }) {
  const totals = data.members.reduce(
    (acc, m) => ({
      savings: acc.savings + Number(m.savings),
      withdrawals: acc.withdrawals + Number(m.withdrawals),
      closing_balance: acc.closing_balance + Number(m.closing_balance),
      returned_amount: acc.returned_amount + Number(m.returned_amount),
    }),
    { savings: 0, withdrawals: 0, closing_balance: 0, returned_amount: 0 }
  );

  return (
    <Document title={`${data.cycle_name} - Cycle Report`}>
      <Page size="A4" style={table.page}>
        <ReportHeader
          title={`${data.cycle_name} — Cycle Report`}
          subtitle={`${formatDate(data.start_date)} to ${data.end_date ? formatDate(data.end_date) : 'ongoing'}  ·  Status: ${data.status}`}
          generatedAt={formatDate(new Date().toISOString())}
        />

        <View style={table.table}>
          <View style={table.headerRow}>
            {COLS.map((c) => (
              <Text key={c.key} style={[table.headerCell, { width: c.width }, c.money ? table.right : undefined]}>
                {c.label}
              </Text>
            ))}
          </View>

          {data.members.map((m, i) => (
            <View key={m.membership_id} style={[table.row, i % 2 === 1 ? table.rowAlt : undefined]} wrap={false}>
              {COLS.map((c) => (
                <Text key={c.key} style={[table.cell, { width: c.width }, c.money ? table.right : undefined]}>
                  {c.money ? formatMoney((m as any)[c.key]) : (m as any)[c.key]}
                </Text>
              ))}
            </View>
          ))}

          {data.members.length === 0 && (
            <Text style={table.emptyState}>No members recorded for this cycle.</Text>
          )}

          {data.members.length > 0 && (
            <View style={table.totalRow}>
              <Text style={[table.totalCell, { width: '40%' }]}>TOTAL</Text>
              <Text style={[table.totalCell, table.right, { width: '12%' }]} />
              <Text style={[table.totalCell, table.right, { width: '12%' }]}>{formatMoney(totals.savings)}</Text>
              <Text style={[table.totalCell, table.right, { width: '12%' }]}>{formatMoney(totals.withdrawals)}</Text>
              <Text style={[table.totalCell, table.right, { width: '12%' }]}>{formatMoney(totals.closing_balance)}</Text>
              <Text style={[table.totalCell, table.right, { width: '12%' }]}>{formatMoney(totals.returned_amount)}</Text>
            </View>
          )}
        </View>

        <ReportFooter />
      </Page>
    </Document>
  );
}