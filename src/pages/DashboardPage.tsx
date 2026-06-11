import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardStats, SavingsTrend,
  WeeklyDeposit, RecentTransaction, TopSaver,
} from '../types/dashboardtypes';
import { tokens, avatarColor } from '../config/theme';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { NotificationsNone, TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';

// ─── Shared Design Tokens (same as ViewSavingsPage) ──────────────────────────

// ─── Avatar palette cycling ───────────────────────────────────────────────────


const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// ─── Custom Tooltip for charts ────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        p: 1.5,
        boxShadow: tokens.shadow.card,
        minWidth: 140,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: tokens.color.textMuted, mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((entry: any, i: number) => (
        <Typography key={i} sx={{ fontSize: '0.82rem', fontWeight: 700, color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </Typography>
      ))}
    </Box>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
  gradient?: [string, string];
}
const StatCard = ({ label, value, sub, positive = true, gradient }: StatCardProps) => (
  <Card
    sx={{
      borderRadius: tokens.radius.xl,
      p: 3,
      boxShadow: tokens.shadow.stat,
      background: gradient
        ? `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
        : tokens.color.surface,
      color: gradient ? '#fff' : tokens.color.textDark,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* decorative blob */}
    <Box
      sx={{
        position: 'absolute',
        top: -24,
        right: -24,
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: gradient ? 'rgba(255,255,255,0.1)' : tokens.color.primaryPale,
        pointerEvents: 'none',
      }}
    />
    <Typography
      sx={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        mb: 1,
        opacity: gradient ? 0.85 : 1,
        color: gradient ? '#fff' : tokens.color.textMuted,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: { xs: '1.5rem', sm: '1.75rem' },
        lineHeight: 1.1,
        mb: 1,
        color: gradient ? '#fff' : tokens.color.textDark,
        wordBreak: 'break-word',
      }}
    >
      {value}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {positive ? (
        <TrendingUp sx={{ fontSize: '0.9rem', color: gradient ? 'rgba(255,255,255,0.8)' : tokens.color.success }} />
      ) : (
        <TrendingDown sx={{ fontSize: '0.9rem', color: gradient ? 'rgba(255,255,255,0.8)' : tokens.color.danger }} />
      )}
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: gradient
            ? 'rgba(255,255,255,0.85)'
            : positive
            ? tokens.color.success
            : tokens.color.danger,
        }}
      >
        {sub}
      </Typography>
    </Box>
  </Card>
);

// ─── Section Paper ────────────────────────────────────────────────────────────
const SectionPaper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Paper
    sx={{
      borderRadius: tokens.radius.xxl,
      boxShadow: tokens.shadow.card,
      overflow: 'hidden',
      background: tokens.color.surface,
    }}
  >
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: `1px solid ${tokens.color.border}`,
        background: tokens.color.surfaceAlt,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1rem',
          color: tokens.color.textDark,
          fontFamily: tokens.font.base,
        }}
      >
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
  </Paper>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SavingsDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [savingsTrendData, setSavingsTrendData] = useState<SavingsTrend[]>([]);
  const [weeklyDeposits, setWeeklyDeposits] = useState<WeeklyDeposit[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topSavers, setTopSavers] = useState<TopSaver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REPLACE with this ✅
// REPLACE with this ✅
useEffect(() => {
  fetchAllData();
}, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getAllDashboardData();
      setStats(data.stats);
      setSavingsTrendData(data.trends);
      setWeeklyDeposits(data.weeklyDeposits);
      setRecentTransactions(data.transactions);
      setTopSavers(data.topSavers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
          justifyContent: 'center',
          alignItems: 'center',
          background: tokens.color.bg,
        }}
      >
        <CircularProgress size={48} thickness={4} sx={{ color: tokens.color.primary }} />
        <Typography sx={{ mt: 2.5, color: tokens.color.textMid, fontWeight: 600, fontSize: '1rem' }}>
          Loading dashboard…
        </Typography>
      </Box>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 640, mx: 'auto', background: tokens.color.bg, minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: tokens.radius.md }}>
          <Typography fontWeight={700} mb={0.5}>Error</Typography>
          {error}
        </Alert>
        <Typography sx={{ color: tokens.color.textMid, mb: 2 }}>
          Make sure you're logged in and the API server is running.
        </Typography>
        <Button
          onClick={fetchAllData}
          startIcon={<Refresh />}
          sx={{
            bgcolor: tokens.color.primary,
            color: '#fff',
            px: 3,
            py: 1,
            borderRadius: tokens.radius.md,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: tokens.color.secondary },
            boxShadow: 'none',
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // ── No data ─────────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, background: tokens.color.bg, minHeight: '100vh' }}>
        <Alert severity="warning" sx={{ borderRadius: tokens.radius.md }}>
          No dashboard data available
        </Alert>
      </Box>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        background: tokens.color.bg,
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        fontFamily: tokens.font.base,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Top App Bar ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: tokens.color.surface,
          borderBottom: `1px solid ${tokens.color.border}`,
          px: { xs: 2, md: 4 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.15rem',
              color: tokens.color.textDark,
              lineHeight: 1.2,
            }}
          >
            Savings Overview
          </Typography>
          {stats.current_cycle && (
            <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted }}>
              {stats.current_cycle.name}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={fetchAllData}
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            size="small"
            sx={{
              color: tokens.color.primary,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderRadius: tokens.radius.md,
              '&:hover': { bgcolor: tokens.color.primaryPale },
            }}
          >
            Refresh
          </Button>
          <IconButton sx={{ color: tokens.color.textMid }}>
            <NotificationsNone />
          </IconButton>
        </Box>
      </Box>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >

        {/* ── Hero summary card ─────────────────────────────────────────── */}
        <Card
          sx={{
            borderRadius: tokens.radius.xl,
            background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
            p: 3,
            mb: 3,
            boxShadow: tokens.shadow.elevated,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <Chip
            label="Current Month"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.72rem', mb: 1.5 }}
          />
          <Typography sx={{ fontSize: '0.72rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
            Savings This Month
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '2.6rem' }, lineHeight: 1.05, mb: 0.5 }}>
            {formatCurrency(stats.total_savings)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {stats.growth_percentage >= 0
              ? <TrendingUp sx={{ fontSize: '1rem', opacity: 0.9 }} />
              : <TrendingDown sx={{ fontSize: '1rem', opacity: 0.9 }} />}
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
              {stats.growth_percentage >= 0 ? '+' : ''}{stats.growth_percentage}% vs last month
            </Typography>
          </Box>
        </Card>

        {/* ── Stat cards row ────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, sm: 2.5 },
            mb: 3,
          }}
        >
          <StatCard
            label="Total Savings"
            value={formatCurrency(stats.total_savings)}
            sub={`${Math.abs(stats.growth_percentage)}% growth`}
            positive={stats.growth_percentage >= 0}
            gradient={[tokens.color.primary, tokens.color.accent]}
          />
          <StatCard
            label="Total Profit"
            value={formatCurrency(stats.total_profit)}
            sub={`${stats.profit_margin}% profit margin`}
            positive
          />
          <StatCard
            label="Active Members"
            value={String(stats.active_members)}
            sub={`+${stats.new_members_this_month} new this month`}
            positive
          />
        </Box>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: { xs: 2, sm: 2.5 },
            mb: 3,
          }}
        >
          {/* Savings & Profit Trend */}
          <SectionPaper title="Savings & Profit Trend">
            {savingsTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={savingsTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.color.primary} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={tokens.color.primary} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.color.primaryLight} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={tokens.color.primaryLight} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke={tokens.color.textMuted}
                    tick={{ fontSize: 11, fill: tokens.color.textMuted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={tokens.color.textMuted}
                    tick={{ fontSize: 10, fill: tokens.color.textMuted }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '0.78rem', color: tokens.color.textMid, paddingTop: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke={tokens.color.primary}
                    strokeWidth={2.5}
                    fill="url(#gSavings)"
                    name="Total Savings"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={tokens.color.primaryLight}
                    strokeWidth={2.5}
                    fill="url(#gProfit)"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: tokens.color.textMuted }}>No trend data available</Typography>
              </Box>
            )}
          </SectionPaper>

          {/* Weekly Deposits */}
          <SectionPaper title="Weekly Deposit Activity">
            {weeklyDeposits.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyDeposits} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke={tokens.color.textMuted}
                    tick={{ fontSize: 11, fill: tokens.color.textMuted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={tokens.color.textMuted}
                    tick={{ fontSize: 10, fill: tokens.color.textMuted }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill={tokens.color.primaryLight}
                    radius={[8, 8, 0, 0]}
                    name="Deposits"
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: tokens.color.textMuted }}>No deposit data available</Typography>
              </Box>
            )}
          </SectionPaper>
        </Box>

        {/* ── Tables row ────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: { xs: 2, sm: 2.5 },
            mb: 3,
          }}
        >
          {/* Recent Transactions */}
          <SectionPaper title="Recent Transactions">
            {recentTransactions.length > 0 ? (
              <TableContainer sx={{ overflowX: 'hidden', width: '100%' }}>
                <Table sx={{ tableLayout: 'fixed', width: '100%' }} size="small">
                  <TableHead>
                    <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                      <TableCell
                        sx={{
                          width: '50%',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: tokens.color.textMuted,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.25,
                        }}
                      >
                        Member
                      </TableCell>
                      <TableCell
                        sx={{
                          width: '30%',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: tokens.color.textMuted,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.25,
                        }}
                      >
                        Amount
                      </TableCell>
                      <TableCell
                        sx={{
                          width: '20%',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: tokens.color.textMuted,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.25,
                          display: { xs: 'none', sm: 'table-cell' },
                        }}
                      >
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((tx, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                          '&:hover': { background: tokens.color.primaryPale },
                          transition: 'background 0.15s',
                        }}
                      >
                        <TableCell sx={{ py: 1.25, overflow: 'hidden' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                            <Avatar
                              sx={{
                                bgcolor: avatarColor(idx),
                                width: 30,
                                height: 30,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(`${tx.member.first_name} ${tx.member.last_name}`)}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: tokens.color.textDark,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {tx.member.first_name} {tx.member.last_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography
                            sx={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: tokens.color.success,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatCurrency(tx.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 1.25,
                            fontSize: '0.78rem',
                            color: tokens.color.textMuted,
                            display: { xs: 'none', sm: 'table-cell' },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDate(tx.date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: tokens.color.textMuted }}>No recent transactions</Typography>
              </Box>
            )}
          </SectionPaper>

          {/* Top Savers */}
          <SectionPaper title="Top Savers">
            {topSavers.length > 0 ? (
              <Box>
                {topSavers.map((saver, idx) => (
                  <Box key={idx}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.75,
                        px: 0.5,
                        borderRadius: tokens.radius.md,
                        '&:hover': { background: tokens.color.primaryPale },
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Left: rank badge + name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            bgcolor:
                              idx === 0
                                ? tokens.color.gold
                                : idx === 1
                                ? tokens.color.silver
                                : idx === 2
                                ? tokens.color.bronze
                                : tokens.color.primaryPale,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            color: idx < 3 ? '#fff' : tokens.color.primary,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: tokens.color.textDark,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {saver.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted }}>
                            Rank #{saver.rank}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right: savings amount */}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: tokens.color.primary,
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        {formatCurrency(saver.total_savings)}
                      </Typography>
                    </Box>
                    {idx < topSavers.length - 1 && (
                      <Divider sx={{ borderColor: tokens.color.border }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: tokens.color.textMuted }}>No top savers data</Typography>
              </Box>
            )}
          </SectionPaper>
        </Box>

      </Box>
    </Box>
  );
};

export default SavingsDashboard;