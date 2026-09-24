import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { tokens } from '../config/theme';

/**
 * The three-number balance from the upgrade spec (Section 3):
 *   Brought Forward  = everything saved before this month (frozen)
 *   This Month       = deposits - withdrawals in the current month only
 *   Total Balance    = Brought Forward + This Month (the member's real balance)
 *
 * Use this on EVERY screen that shows a balance (dashboard, member detail,
 * withdrawal page, statements) so nobody ever sees one blended number.
 */

export const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);

interface BalanceBreakdownProps {
  broughtForward: number;
  thisMonth: number;
  /** Optional. If omitted it is computed as broughtForward + thisMonth. */
  total?: number;
  loading?: boolean;
  /** Smaller type, for use inside tables/drawers/withdraw form. */
  compact?: boolean;
}

const BalanceBreakdown = ({
  broughtForward,
  thisMonth,
  total,
  loading = false,
  compact = false,
}: BalanceBreakdownProps) => {
  const computedTotal = total ?? broughtForward + thisMonth;

  const parts = [
    { key: 'bf', label: 'Brought forward', value: broughtForward, hint: 'Saved before this month' },
    { key: 'tm', label: 'This month', value: thisMonth, hint: 'Deposits minus withdrawals' },
    { key: 'total', label: 'Total balance', value: computedTotal, hint: 'B/F + this month', strong: true },
  ];

  return (
    <Box
      role="group"
      aria-label="Balance breakdown"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr auto 1.2fr' },
        alignItems: 'stretch',
        gap: { xs: 1.5, sm: 0 },
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.xl,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}
    >
      {parts.map((p, i) => (
        <React.Fragment key={p.key}>
          {i > 0 && (
            <Box
              aria-hidden
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                px: 0.5,
                color: tokens.color.textMuted,
                fontWeight: 700,
                fontSize: compact ? '1rem' : '1.25rem',
              }}
            >
              {i === 1 ? '+' : '='}
            </Box>
          )}
          <Box
            sx={{
              p: compact ? 1.75 : 2.5,
              background: p.strong ? tokens.color.primaryPale : 'transparent',
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tokens.color.textMid }}>
              {p.label}
            </Typography>
            <Typography
              sx={{
                fontWeight: p.strong ? 800 : 700,
                fontSize: compact ? '1.05rem' : { xs: '1.35rem', sm: '1.6rem' },
                lineHeight: 1.15,
                my: 0.5,
                color: p.strong ? tokens.color.primary : tokens.color.textDark,
                wordBreak: 'break-word',
              }}
            >
              {loading ? <CircularProgress size={compact ? 16 : 22} sx={{ color: tokens.color.primary }} /> : formatUGX(p.value)}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted }}>{p.hint}</Typography>
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

export default BalanceBreakdown;