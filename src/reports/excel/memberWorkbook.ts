// src/reports/excel/memberWorkbook.ts
import ExcelJS from 'exceljs';
import { addMasthead, styleHeaderRow, styleDataRow, moneyFormat, triggerDownload } from './styleHelpers';
import type { MemberStatementData } from '../pdf/components/MemberStatementDocument';


const HEADERS = ['Cycle', 'Carry Fwd', 'Savings', 'Withdrawals', 'Closing Bal', 'Returned'];
// Note: matches build_member_statement_pdf's 6 columns exactly, including Returned.

export async function buildMemberWorkbook(data: MemberStatementData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Twezimbe Development Group';
  const sheet = workbook.addWorksheet('Statement');

  sheet.columns = [{ width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

  await addMasthead(sheet, workbook, HEADERS.length);

  sheet.mergeCells(4, 1, 4, HEADERS.length);
  const title = sheet.getCell(4, 1);
  title.value = `Member Savings Statement — ${data.member_name} (ID: ${data.membership_id})`;
  title.font = { bold: true, size: 11, color: { argb: 'FF16294B' } };
  sheet.getRow(5).height = 4;

  if (data.history.length === 0) {
    sheet.mergeCells(6, 1, 6, HEADERS.length);
    sheet.getCell(6, 1).value = 'No savings activity on record for this member.';
    await triggerDownload(workbook, `${data.member_name.replace(/\s+/g, '_')}_statement.xlsx`);
    return;
  }

  const headerRow = sheet.addRow(HEADERS);
  styleHeaderRow(headerRow);

  data.history.forEach((row, i) => {
    const r = sheet.addRow([
      row.cycle_name, row.carry_forward, row.savings, row.withdrawals, row.closing_balance, row.returned_amount,
    ]);
    [2, 3, 4, 5, 6].forEach((col) => (r.getCell(col).numFmt = moneyFormat()));
    styleDataRow(r, i % 2 === 1);
  });

  sheet.views = [{ state: 'frozen', ySplit: sheet.getRow(6).number }];

  await triggerDownload(workbook, `${data.member_name.replace(/\s+/g, '_')}_statement.xlsx`);
}