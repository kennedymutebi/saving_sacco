// src/reports/excel/cycleWorkbook.ts
import ExcelJS from 'exceljs';
import { addMasthead, styleHeaderRow, styleDataRow, styleTotalRow, moneyFormat, triggerDownload } from './styleHelpers';
import type { CycleReportData } from '../pdf/components/CycleReportDocument';


const HEADERS = ['Membership ID', 'Member Name', 'Carry Fwd', 'Savings', 'Withdrawals', 'Closing Bal', 'Returned'];

export async function buildCycleWorkbook(data: CycleReportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Twezimbe Development Group';
  const sheet = workbook.addWorksheet('Cycle Report');

  sheet.columns = [
    { width: 16 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];

  await addMasthead(sheet, workbook, HEADERS.length);

  sheet.mergeCells(4, 1, 4, HEADERS.length);
  const title = sheet.getCell(4, 1);
  title.value = `${data.cycle_name} — Cycle Report  (${data.start_date} to ${data.end_date ?? 'ongoing'}, ${data.status})`;
  title.font = { bold: true, size: 11, color: { argb: 'FF16294B' } };
  sheet.getRow(5).height = 4; // spacer

  const headerRow = sheet.addRow(HEADERS);
  styleHeaderRow(headerRow);

  const totals = { savings: 0, withdrawals: 0, closing_balance: 0, returned_amount: 0 };

  data.members.forEach((m, i) => {
    const row = sheet.addRow([
      m.membership_id, m.member_name, m.carry_forward, m.savings, m.withdrawals, m.closing_balance, m.returned_amount,
    ]);
    [3, 4, 5, 6, 7].forEach((col) => (row.getCell(col).numFmt = moneyFormat()));
    styleDataRow(row, i % 2 === 1);
    totals.savings += Number(m.savings);
    totals.withdrawals += Number(m.withdrawals);
    totals.closing_balance += Number(m.closing_balance);
    totals.returned_amount += Number(m.returned_amount);
  });

  if (data.members.length > 0) {
    const totalRow = sheet.addRow(['', 'TOTAL', '', totals.savings, totals.withdrawals, totals.closing_balance, totals.returned_amount]);
    [4, 5, 6, 7].forEach((col) => (totalRow.getCell(col).numFmt = moneyFormat()));
    styleTotalRow(totalRow);
  } else {
    sheet.mergeCells(sheet.rowCount + 1, 1, sheet.rowCount + 1, HEADERS.length);
    sheet.getCell(sheet.rowCount, 1).value = 'No members recorded for this cycle.';
  }

  sheet.views = [{ state: 'frozen', ySplit: sheet.getRow(6).number }];

  await triggerDownload(workbook, `${data.cycle_name.replace(/\s+/g, '_')}_cycle_report.xlsx`);
}