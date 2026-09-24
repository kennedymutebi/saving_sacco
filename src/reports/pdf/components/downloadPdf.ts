// src/reports/pdf/downloadPdf.ts
//
// react-pdf's `pdf()` helper types its argument as ReactElement<DocumentProps>,
// but any wrapper component (CycleReportDocument, etc.) is typed by its own
// props, not DocumentProps — TS can't see through the component to know it
// renders a <Document> internally. Accepting `any` here and letting the cast
// happen at the one call site that touches the react-pdf API is the standard
// workaround; every call site above (ReportsPage) still gets full type
// checking on its own JSX.
import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

export async function downloadPdf(document: ReactElement<any>, filename: string) {
  const blob = await pdf(document as ReactElement<DocumentProps>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}