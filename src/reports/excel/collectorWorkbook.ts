// src/reports/excel/collectorWorkbook.ts
import ExcelJS from 'exceljs';
import { addMasthead, styleHeaderRow, moneyFormat, triggerDownload, fill } from './styleHelpers';
import type { CollectorSummaryData } from '../pdf/components/CollectorSummaryDocument';


export async function buildCollectorWorkbook(data: CollectorSummaryData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Twezimbe Development Group';
  const sheet = workbook.addWorksheet('Collector Summary');

  sheet.columns = [{ width: 30 }, { width: 20 }];

  await addMasthead(sheet, workbook, 2);

  sheet.mergeCells(4, 1, 4, 2);
  const title = sheet.getCell(4, 1);
  title.value = `Collector Summary — ${data.collector_name}  (${data.cycle_name ?? 'All-time'})`;
  title.font = { bold: true, size: 11, color: { argb: 'FF16294B' } };
  sheet.getRow(5).height = 4;

  const headerRow = sheet.addRow(['Metric', 'Value']);
  styleHeaderRow(headerRow);

  const rows: [string, number | string][] = [
    ['Member Count', data.member_count],
    ['Total Savings', data.total_savings],
    ['Total Withdrawals', data.total_withdrawals],
    ['Total Balance', data.total_balance],
    ['Amount to be Returned', data.amount_to_be_returned],
    ['Amount Carried Forward', data.amount_carried_forward],
  ];

  rows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: fill.navy } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill.paleGreen } };
    if (typeof value === 'number' && label !== 'Member Count') row.getCell(2).numFmt = moneyFormat();
    row.getCell(2).alignment = { horizontal: 'right' };
  });

  await triggerDownload(workbook, `${data.collector_name.replace(/\s+/g, '_')}_collector_summary.xlsx`);
}