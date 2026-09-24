// src/reports/excel/allCollectorsWorkbook.ts
import ExcelJS from 'exceljs';
import { addMasthead, styleHeaderRow, styleDataRow, moneyFormat, triggerDownload } from './styleHelpers';

export interface AllCollectorsRow {
  collector_name: string;
  member_count: number;
  total_savings: number;
  total_withdrawals: number;
  total_balance: number;
  amount_to_be_returned: number;
  amount_carried_forward: number;
}

export interface AllCollectorsData {
  cycle_name: string | null;
  collectors: AllCollectorsRow[];
}

const HEADERS = ['Collector', 'Members', 'Savings', 'Withdrawals', 'Balance', 'To Be Returned', 'Carried Fwd'];

export async function buildAllCollectorsWorkbook(data: AllCollectorsData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Twezimbe Development Group';
  const sheet = workbook.addWorksheet('All Collectors');

  sheet.columns = [{ width: 24 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 15 }, { width: 15 }];

  await addMasthead(sheet, workbook, HEADERS.length);

  sheet.mergeCells(4, 1, 4, HEADERS.length);
  sheet.getCell(4, 1).value = `All Collectors — Combined Summary (${data.cycle_name ?? 'All-time'})`;
  sheet.getCell(4, 1).font = { bold: true, size: 11, color: { argb: 'FF16294B' } };
  sheet.getRow(5).height = 4;

  const headerRow = sheet.addRow(HEADERS);
  styleHeaderRow(headerRow);

  data.collectors.forEach((c, i) => {
    const row = sheet.addRow([
      c.collector_name, c.member_count, c.total_savings, c.total_withdrawals,
      c.total_balance, c.amount_to_be_returned, c.amount_carried_forward,
    ]);
    [3, 4, 5, 6, 7].forEach((col) => (row.getCell(col).numFmt = moneyFormat()));
    styleDataRow(row, i % 2 === 1);
  });

  sheet.views = [{ state: 'frozen', ySplit: sheet.getRow(6).number }];

  await triggerDownload(workbook, `all_collectors_summary.xlsx`);
}