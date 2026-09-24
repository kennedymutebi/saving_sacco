// src/reports/pdf/MemberStatementDocument.tsx
import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { brand, formatMoney } from '../../branding';
import { table } from '../../tableStyles';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';

export interface MemberCycleRow {
  cycle_name: string;
  carry_forward: number;
  savings: number;
  withdrawals: number;
  closing_balance: number;
  returned_amount: number;
}

export interface MemberStatementData {
  member_name: string;
  membership_id: string;
  history: MemberCycleRow[];
}

interface StatementCol {
  key: keyof MemberCycleRow;
  label: string;
  width: string;
  money?: boolean;
}

const COLS: StatementCol[] = [
  { key: 'cycle_name', label: 'Cycle', width: '24%' },
  { key: 'carry_forward', label: 'Carry Fwd', width: '15%', money: true },
  { key: 'savings', label: 'Savings', width: '15%', money: true },
  { key: 'withdrawals', label: 'Withdrawals', width: '15%', money: true },
  { key: 'closing_balance', label: 'Closing Bal', width: '15%', money: true },
  { key: 'returned_amount', label: 'Returned', width: '16%', money: true },
];

export function MemberStatementDocument({ data }: { data: MemberStatementData }) {
  return (
    <Document title={`${data.member_name} - Savings Statement`}>
      <Page size="A4" style={table.page}>
        <ReportHeader
          title="Member Savings Statement"
          subtitle={`${data.member_name}  ·  Membership ID: ${data.membership_id}`}
          generatedAt={new Date().toLocaleDateString('en-GB')}
        />

        {data.history.length === 0 ? (
          <Text style={table.emptyState}>No savings activity on record for this member.</Text>
        ) : (
          <View style={table.table}>
            <View style={table.headerRow}>
              {COLS.map((c) => (
                <Text key={c.key} style={[table.headerCell, { width: c.width }, c.money ? table.right : undefined]}>
                  {c.label}
                </Text>
              ))}
            </View>
            {data.history.map((row, i) => (
              <View key={`${row.cycle_name}-${i}`} style={[table.row, i % 2 === 1 ? table.rowAlt : undefined]} wrap={false}>
                {COLS.map((c) => (
                  <Text key={c.key} style={[table.cell, { width: c.width }, c.money ? table.right : undefined]}>
                    {c.money ? formatMoney((row as any)[c.key]) : (row as any)[c.key]}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        <ReportFooter />
      </Page>
    </Document>
  );
}