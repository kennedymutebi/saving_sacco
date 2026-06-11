/**
 * theme.ts — Global Design Tokens
 *
 * Single source of truth for all visual styling in the
 * Harvest Haven SACCO system.
 *
 * Every colour, shadow, border radius, and font used across
 * the app is defined here. Pages and components import from
 * this file instead of defining their own local tokens.
 *
 * To restyle the entire app, only this file needs to change.
 */

export const tokens = {
  color: {
    // ── Backgrounds ──────────────────────────────────────────
    bg:           '#F2F6F3',   // main page background
    surface:      '#FFFFFF',   // card / panel background
    surfaceAlt:   '#F7FAF8',   // alternate row / section header

    // ── Borders ───────────────────────────────────────────────
    border:       '#DDE8E1',
    borderDark:   'rgba(255,255,255,0.08)', // borders on dark surfaces

    // ── Brand greens ─────────────────────────────────────────
    primary:      '#2D6A4F',   // main brand green
    primaryLight: '#52B788',   // lighter accent green
    primaryPale:  '#D8EFE3',   // very light green for hovers/chips
    secondary:    '#1B4F39',   // darker green for hover states
    accent:       '#40916C',   // mid green for gradients

    // ── Sidebar specific ─────────────────────────────────────
    sidebarBg:      '#1B2B24',
    sidebarHover:   '#243D31',
    sidebarActive:  '#2D6A4F',

    // ── Chart colours ────────────────────────────────────────
    chart1:       '#52B788',
    chart2:       '#74C69D',
    chart3:       '#2D6A4F',

    // ── Semantic colours ─────────────────────────────────────
    danger:       '#C0392B',
    dangerHover:  '#A93226',
    dangerPale:   '#FDECEA',
    success:      '#1A7F4B',
    successPale:  '#D4F0E2',
    warning:      '#D97706',
    warningPale:  '#FEF3C7',

    // ── Text ─────────────────────────────────────────────────
    textDark:     '#1B2B24',   // headings, primary text
    textMid:      '#4A6358',   // secondary text
    textMuted:    '#8FA99D',   // placeholders, labels
    textOnDark:   'rgba(255,255,255,0.92)',
    textMutedDark:'rgba(255,255,255,0.45)',

    // ── Leaderboard medals ───────────────────────────────────
    gold:         '#F59E0B',
    silver:       '#94A3B8',
    bronze:       '#B45309',
  },

  radius: {
    sm:  '8px',
    md:  '12px',
    lg:  '16px',
    xl:  '20px',
    xxl: '24px',
  },

  shadow: {
    card:     '0 2px 10px rgba(45,106,79,0.08)',
    elevated: '0 6px 24px rgba(45,106,79,0.14)',
    stat:     '0 4px 16px rgba(45,106,79,0.12)',
    sidebar:  '4px 0 24px rgba(0,0,0,0.18)',
  },

  font: {
    base: "'Inter', 'Segoe UI', sans-serif",
  },
} as const;

// ── Avatar colour palette ──────────────────────────────────────────────────────
// Cycles through greens when rendering member avatars
export const AVATAR_COLORS = [
  '#2D6A4F',
  '#52B788',
  '#1B5E20',
  '#388E3C',
  '#00796B',
];

export const avatarColor = (index: number): string =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];