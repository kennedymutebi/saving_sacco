// src/reports/pdf/tableStyles.ts
import { StyleSheet, Font } from '@react-pdf/renderer';
import { brand } from './branding';


// Helvetica/Helvetica-Bold are built into react-pdf — no font registration
// or network fetch required, so PDFs render identically offline.
Font.registerHyphenationCallback((word) => [word]);

export const table = StyleSheet.create({
  page: { paddingTop: 32, paddingHorizontal: 32, paddingBottom: 48, fontSize: 9, color: brand.colors.ink },
  table: { display: 'flex', width: 'auto', marginTop: 6 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: brand.colors.forest,
    paddingVertical: 6,
  },
  headerCell: {
    color: brand.colors.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    paddingHorizontal: 6,
  },
  row: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: brand.colors.hairline },
  rowAlt: { backgroundColor: brand.colors.paleGreen },
  cell: { paddingHorizontal: 6, fontSize: 8.5 },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderTopWidth: 1.2,
    borderTopColor: brand.colors.navy,
    marginTop: 2,
  },
  totalCell: { paddingHorizontal: 6, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: brand.colors.navy },
  right: { textAlign: 'right' },
  emptyState: { fontSize: 9.5, color: brand.colors.muted, marginTop: 20, textAlign: 'center' },
});