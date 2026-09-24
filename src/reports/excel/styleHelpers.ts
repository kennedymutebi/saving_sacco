// src/reports/excel/styleHelpers.ts
import ExcelJS from 'exceljs';
import { brand } from '../branding';

// exceljs wants ARGB (no leading '#', with a leading FF alpha channel)
const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase();

export const fill = {
  forest: argb(brand.colors.forest),
  paleGreen: argb(brand.colors.paleGreen),
  navy: argb(brand.colors.navy),
  white: argb(brand.colors.white),
};

/** Adds the logo + org name/tagline masthead to the top of a sheet, starting at row 1. */
export async function addMasthead(sheet: ExcelJS.Worksheet, workbook: ExcelJS.Workbook, lastCol: number) {
  const base64 = brand.logoBase64.split(',')[1];
  const imageId = workbook.addImage({ base64, extension: 'png' });
  sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 42, height: 42 } });

  sheet.mergeCells(1, 2, 1, lastCol);
  const nameCell = sheet.getCell(1, 2);
  nameCell.value = brand.org.name;
  nameCell.font = { bold: true, size: 13, color: { argb: fill.navy } };

  sheet.mergeCells(2, 2, 2, lastCol);
  const taglineCell = sheet.getCell(2, 2);
  taglineCell.value = brand.org.tagline;
  taglineCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } };

  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 16;
  sheet.getRow(3).height = 6; // spacer
}

/** Styles a header row: forest-green fill, white bold text, thin borders. */
export function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fill.white }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill.forest } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB9C6BC' } },
      bottom: { style: 'thin', color: { argb: 'FFB9C6BC' } },
      left: { style: 'thin', color: { argb: 'FFB9C6BC' } },
      right: { style: 'thin', color: { argb: 'FFB9C6BC' } },
    };
  });
  row.height = 20;
}

/** Zebra-stripes a data row and adds thin borders. */
export function styleDataRow(row: ExcelJS.Row, isAlt: boolean) {
  row.eachCell((cell) => {
    if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill.paleGreen } };
    cell.border = { bottom: { style: 'hair', color: { argb: 'FFE0E4E0' } } };
  });
}

/** Bolds a totals row with a heavier top border. */
export function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fill.navy } };
    cell.border = { top: { style: 'medium', color: { argb: fill.navy } } };
  });
}

export function moneyFormat() {
  return '#,##0.00';
}

export async function triggerDownload(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}