// src/reports/pdf/CollectorSummaryDocument.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { brand, formatMoney } from '../../branding';
import { table } from '../../tableStyles';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';


export interface CollectorSummaryData {
  collector_name: string;
  cycle_name: string | null; // null = all-time
  member_count: number;
  total_savings: number;
  total_withdrawals: number;
  total_balance: number;
  amount_to_be_returned: number;
  amount_carried_forward: number;
}

const rows = (d: CollectorSummaryData) => [
  ['Member Count', String(d.member_count)],
  ['Total Savings', formatMoney(d.total_savings)],
  ['Total Withdrawals', formatMoney(d.total_withdrawals)],
  ['Total Balance', formatMoney(d.total_balance)],
  ['Amount to be Returned', formatMoney(d.amount_to_be_returned)],
  ['Amount Carried Forward', formatMoney(d.amount_carried_forward)],
];

const styles = StyleSheet.create({
  card: { marginTop: 8, borderWidth: 0.5, borderColor: brand.colors.hairline, borderRadius: 2 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: brand.colors.hairline },
  lastRow: { borderBottomWidth: 0 },
  label: {
    width: '55%',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: brand.colors.navy,
    backgroundColor: brand.colors.paleGreen,
  },
  value: { width: '45%', padding: 8, fontSize: 9.5, textAlign: 'right' },
});

export function CollectorSummaryDocument({ data }: { data: CollectorSummaryData }) {
  const r = rows(data);
  return (
    <Document title={`${data.collector_name} - Collector Summary`}>
      <Page size="A4" style={table.page}>
        <ReportHeader
          title="Collector Summary"
          subtitle={`${data.collector_name}  ·  ${data.cycle_name ?? 'All-time'}`}
          generatedAt={new Date().toLocaleDateString('en-GB')}
        />
        <View style={styles.card}>
          {r.map(([label, value], i) => (
            <View key={label} style={[styles.row, i === r.length - 1 ? styles.lastRow : undefined]}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
        <ReportFooter />
      </Page>
    </Document>
  );
}