export const brand = {
  colors: {
    navy: '#16294B',        // wordmark / primary headings
    navyMuted: '#3C4E6B',   // secondary text on light backgrounds
    forest: '#1F6B34',      // deep leaf green — table headers, rules
    leaf: '#5FA847',        // brighter leaf green — accents, chips
    paleGreen: '#EEF6EE',   // zebra-striping / soft fills
    hairline: '#DCE3DD',    // borders, dividers
    ink: '#1A1A1A',         // body text
    muted: '#6B7280',       // captions, footnotes
    white: '#FFFFFF',
  },
  org: {
    name: 'Twezimbe Development Group',
    tagline: 'Savings & Development Program',
  },
  // 400x400 PNG, embedded so PDF/Excel builders never depend on a network
  // fetch or a bundler asset path — swap this constant if the logo changes.
  logoBase64: 'data:image/png;base64,${B64}',
} as const;

export type Brand = typeof brand;

export function formatMoney(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}