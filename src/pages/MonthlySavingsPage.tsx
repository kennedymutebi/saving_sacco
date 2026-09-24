'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Tooltip, CircularProgress,
  Alert, Snackbar, MenuItem, InputAdornment, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as EndIcon,
  CheckCircle as ActiveIcon,
  Schedule as UpcomingIcon,
  Archive as ClosedIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Replay as ReopenIcon,
  NotificationsNone,
  TrendingUp,
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { cyclesService } from '../services/cyclesService';
import type { SavingsCycle, CreateCycleData, CycleClosePreview } from '../services/cyclesService';
import { tokens } from '../config/theme';
import { formatUGX } from '../components/BalanceBreakdown';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: tokens.radius.md,
    bgcolor: tokens.color.surface,
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: tokens.color.primary },
};

const safeFormatDate = (dateString: string | null | undefined, formatStr: string): string => {
  if (!dateString) return 'Ongoing';
  try {
    let date = parseISO(dateString);
    if (!isValid(date)) date = new Date(dateString);
    if (!isValid(date)) return '—';
    return format(date, formatStr);
  } catch {
    return '—';
  }
};

export default function MonthlySavingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [months, setMonths] = useState<SavingsCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'upcoming' | 'closed'>('active');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [stats, setStats] = useState({ active: 0, upcoming: 0, closed: 0 });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cycle: SavingsCycle | null }>({ open: false, cycle: null });

  // ── Month-end close flow ────────────────────────────────────────────────
  const [closeTarget, setCloseTarget] = useState<SavingsCycle | null>(null);
  const [preview, setPreview] = useState<CycleClosePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cashCounted, setCashCounted] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => { fetchCycles(); }, []);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cyclesService.getAllCycles();
      setMonths(data);
      calculateStatistics(data);
      try {
        const apiStats = await cyclesService.getCycleStatistics();
        setStats(apiStats);
      } catch { /* use calculated stats */ }
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch cycles';
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (cycles: SavingsCycle[]) => {
    setStats({
      active: cycles.filter((m) => m.status === 'active').length,
      upcoming: cycles.filter((m) => m.status === 'upcoming').length,
      closed: cycles.filter((m) => m.status === 'closed').length,
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const activeCycle = months.find((m) => m.status === 'active') ?? null;

  const nextMonthName = (c: SavingsCycle | null) => {
    if (!c) return 'the next month';
    const d = parseISO(c.start_date);
    if (!isValid(d)) return 'the next month';
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return format(next, 'MMMM yyyy');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (!customName && date) setCustomName(format(new Date(date), 'MMMM yyyy'));
  };

  const handleCreateMonth = async () => {
    if (!selectedDate) { showSnackbar('Please select a start date.', 'error'); return; }
    try {
      setSubmitting(true);
      const cycleData: CreateCycleData = {
        start_date: selectedDate,
        ...(customName && { name: customName }),
        status: selectedStatus,
        ...(endDate && { end_date: endDate }),
      };
      const result = await cyclesService.createCycle(cycleData);
      showSnackbar(`Cycle "${result.name}" created.`, 'success');
      handleCloseDialog();
      await fetchCycles();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to create cycle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate('');
    setCustomName('');
    setSelectedStatus('active');
    setEndDate('');
  };

  const handleStartMonth = async (id: string) => {
    try {
      await cyclesService.partialUpdateCycle(id, { status: 'active' });
      showSnackbar('Cycle started.', 'success');
      await fetchCycles();
    } catch (err: any) { showSnackbar(err.message || 'Failed to start cycle', 'error'); }
  };

  // ── Close month: load preview, then confirm ───────────────────────────
  const openCloseFlow = async (cycle: SavingsCycle) => {
    setCloseTarget(cycle);
    setPreview(null);
    setPreviewError(null);
    setCashCounted('');
    setPreviewLoading(true);
    try {
      setPreview(await cyclesService.getClosePreview(cycle.id));
    } catch (err: any) {
      setPreviewError(err.message || 'Could not load the month-end summary.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const dismissCloseFlow = () => {
    if (closing) return;
    setCloseTarget(null);
    setPreview(null);
    setPreviewError(null);
  };

  const cashDifference =
    preview && cashCounted !== '' && !isNaN(parseFloat(cashCounted))
      ? parseFloat(cashCounted) - preview.closing_balance
      : null;

  const handleConfirmClose = async () => {
    if (!closeTarget || !preview) return;
    try {
      setClosing(true);
      await cyclesService.closeCycle(closeTarget.id);
      showSnackbar(
        `${closeTarget.name} closed. ${nextMonthName(closeTarget)} will show ${formatUGX(preview.closing_balance)} brought forward.`,
        'success'
      );
      setCloseTarget(null);
      setPreview(null);
      await fetchCycles();
      window.dispatchEvent(new Event('savings-updated'));
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to close the month.');
    } finally {
      setClosing(false);
    }
  };

  const handleReopenMonth = async (cycle: SavingsCycle) => {
    if (!window.confirm(`Reopen "${cycle.name}"?`)) return;
    try {
      await cyclesService.reopenCycle(cycle.id);
      showSnackbar('Cycle reopened.', 'success');
      await fetchCycles();
    } catch (err: any) { showSnackbar(err.message || 'Failed to reopen cycle', 'error'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.cycle) return;
    const { id, name } = deleteDialog.cycle;
    setDeleteDialog({ open: false, cycle: null });
    try {
      await cyclesService.deleteCycle(id);
      showSnackbar(`"${name}" deleted.`, 'success');
      await fetchCycles();
    } catch (err: any) {
      // Server now guards this: "X has savings or withdrawals recorded
      // and cannot be deleted." Show that message as-is rather than a
      // generic one, since it explains exactly why it failed.
      showSnackbar(err.message || 'Failed to delete cycle', 'error');
    }
  };

  const getStatusChip = (status: SavingsCycle['status']) => {
    switch (status) {
      case 'active':
        return (
          <Chip
            icon={<ActiveIcon sx={{ fontSize: '1rem !important', color: `${tokens.color.success} !important` }} />}
            label="Active" size="small"
            sx={{ bgcolor: tokens.color.successPale, color: tokens.color.success, fontWeight: 700, fontSize: '0.82rem' }}
          />
        );
      case 'upcoming':
        return (
          <Chip
            icon={<UpcomingIcon sx={{ fontSize: '1rem !important', color: `${tokens.color.warning} !important` }} />}
            label="Upcoming" size="small"
            sx={{ bgcolor: tokens.color.warningPale, color: tokens.color.warning, fontWeight: 700, fontSize: '0.82rem' }}
          />
        );
      default:
        return (
          <Chip
            icon={<ClosedIcon sx={{ fontSize: '1rem !important', color: `${tokens.color.textMuted} !important` }} />}
            label="Closed" size="small"
            sx={{ bgcolor: tokens.color.surfaceAlt, color: tokens.color.textMuted, fontWeight: 700, fontSize: '0.82rem', border: `1px solid ${tokens.color.border}` }}
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', bgcolor: tokens.color.bg }}>
        <CircularProgress size={48} thickness={4} sx={{ color: tokens.color.primary }} />
        <Typography sx={{ mt: 2.5, color: tokens.color.textMid, fontWeight: 600, fontSize: '1rem' }}>Loading cycles…</Typography>
      </Box>
    );
  }

  const summaryRows = preview
    ? [
        { label: 'Opening balance (brought forward)', value: preview.opening_balance },
        { label: 'Saved this month', value: preview.total_saved, plus: true },
        { label: 'Withdrawn this month', value: -preview.total_withdrawn },
        { label: 'Closing balance', value: preview.closing_balance, strong: true },
      ]
    : [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, fontFamily: tokens.font.base }}>
      {/* Top App Bar */}
      <Box
        sx={{
          background: tokens.color.surface, borderBottom: `1px solid ${tokens.color.border}`,
          px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.4rem' }, color: tokens.color.textDark, letterSpacing: '-0.01em', fontFamily: tokens.font.base }}>
          Monthly Savings Cycles
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCycles}
            sx={{ borderColor: tokens.color.border, color: tokens.color.textMid, fontWeight: 600, borderRadius: tokens.radius.md, textTransform: 'none', fontSize: '0.95rem', display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary, bgcolor: tokens.color.primaryPale } }}
          >
            Refresh
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, fontWeight: 700, borderRadius: tokens.radius.md, textTransform: 'none', fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(45,106,79,0.3)' }}
          >
            Create New Cycle
          </Button>
          <IconButton sx={{ color: tokens.color.textMid }} aria-label="Notifications"><NotificationsNone /></IconButton>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: tokens.radius.md }} onClose={() => setError(null)}>{error}</Alert>
        )}

        {/* Hero card */}
        <Card
          sx={{
            borderRadius: tokens.radius.xl,
            background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
            p: 3, mb: 3, boxShadow: tokens.shadow.elevated, color: '#fff', position: 'relative', overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Chip label="All Time" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.8rem', mb: 1.5 }} />
          <Typography sx={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>Total Cycles</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '2.5rem', sm: '3rem' }, lineHeight: 1.05, mb: 0.5 }}>{months.length}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TrendingUp sx={{ fontSize: '1rem', opacity: 0.9 }} />
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.9 }}>
              {stats.active} active · {stats.upcoming} upcoming · {stats.closed} closed
            </Typography>
          </Box>
        </Card>

        {/* Active-cycle close card */}
        {activeCycle && (
          <Card
            sx={{
              borderRadius: tokens.radius.xl, p: 3, mb: 3, boxShadow: tokens.shadow.card, background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted, mb: 0.25 }}>Current month</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: tokens.color.textDark, lineHeight: 1.15 }}>{activeCycle.name}</Typography>
            </Box>
            <Button
              variant="contained" startIcon={<EndIcon />} onClick={() => openCloseFlow(activeCycle)}
              sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md, boxShadow: 'none', px: 3, py: 1.1, whiteSpace: 'nowrap' }}
            >
              Close {activeCycle.name}
            </Button>
          </Card>
        )}

        {/* Stat cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          {[
            { count: stats.active, label: 'Active', color: tokens.color.success, bg: tokens.color.successPale },
            { count: stats.upcoming, label: 'Upcoming', color: tokens.color.warning, bg: tokens.color.warningPale },
            { count: stats.closed, label: 'Closed', color: tokens.color.textMuted, bg: tokens.color.surfaceAlt },
          ].map(({ count, label, color, bg }) => (
            <Card key={label} sx={{ flex: 1, p: { xs: 2, sm: 3 }, textAlign: 'center', borderRadius: tokens.radius.xl, boxShadow: tokens.shadow.stat, background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', sm: '2.8rem' }, color, lineHeight: 1.1 }}>{count}</Typography>
              <Chip label={label} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.85rem', mt: 0.5 }} />
            </Card>
          ))}
        </Stack>

        {/* Cycles table */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, overflow: 'hidden', boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceAlt }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: tokens.color.textDark, fontFamily: tokens.font.base }}>Savings Cycles</Typography>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                  {[
                    { label: 'Name' },
                    { label: 'Period', sm: true },
                    { label: 'Status' },
                    { label: 'Created', md: true },
                    { label: 'Actions', center: true },
                  ].map(({ label, sm, md, center }: any) => (
                    <TableCell
                      key={label} align={center ? 'center' : 'left'}
                      sx={{
                        fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, py: 1.5,
                        display: sm ? { xs: 'none', sm: 'table-cell' } : md ? { xs: 'none', md: 'table-cell' } : undefined,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {months.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: tokens.color.textMuted, fontSize: '1rem', mb: 0.5 }}>No savings cycles yet</Typography>
                      <Typography sx={{ color: tokens.color.textMuted, fontSize: '0.9rem' }}>Click "Create New Cycle" to get started</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  months.map((month, idx) => (
                    <TableRow key={month.id} sx={{ background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt, '&:hover': { background: tokens.color.primaryPale }, transition: 'background 0.15s' }}>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tokens.color.textDark }}>{month.name}</Typography>
                        <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '0.8rem', color: tokens.color.textMuted, mt: 0.25 }}>
                          {safeFormatDate(month.start_date, 'MMM d')} – {safeFormatDate(month.end_date, 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75, display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.9rem', color: tokens.color.textMid }}>
                          {safeFormatDate(month.start_date, 'MMM d, yyyy')} – {safeFormatDate(month.end_date, 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>{getStatusChip(month.status)}</TableCell>
                      <TableCell sx={{ py: 1.75, display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.9rem', color: tokens.color.textMuted }}>{safeFormatDate(month.created_at, 'MMM d, yyyy')}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.75 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          {month.status === 'upcoming' && (
                            <Tooltip title="Start this month">
                              <IconButton size="small" aria-label="Start this month" onClick={() => handleStartMonth(month.id)} sx={{ color: tokens.color.success, '&:hover': { bgcolor: tokens.color.successPale } }}>
                                <StartIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {month.status === 'active' && (
                            <Tooltip title="Close this month">
                              <IconButton size="small" aria-label="Close this month" onClick={() => openCloseFlow(month)} sx={{ color: tokens.color.warning, '&:hover': { bgcolor: tokens.color.warningPale } }}>
                                <EndIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {month.status === 'closed' && (
                            <Tooltip title="Reopen this month">
                              <IconButton size="small" aria-label="Reopen this month" onClick={() => handleReopenMonth(month)} sx={{ color: tokens.color.primary, '&:hover': { bgcolor: tokens.color.primaryPale } }}>
                                <ReopenIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {/* Delete: server now refuses this for any cycle
                              with savings or withdrawals — no need to
                              restrict it to 'upcoming' here in the UI too;
                              the button is always shown, the guard message
                              explains why it fails when it does. */}
                          <Tooltip title="Delete cycle">
                            <IconButton size="small" aria-label="Delete this cycle" onClick={() => setDeleteDialog({ open: true, cycle: month })} sx={{ color: tokens.color.danger, '&:hover': { bgcolor: tokens.color.dangerPale } }}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Close-month dialog: preview, then confirm */}
      <Dialog open={!!closeTarget} onClose={dismissCloseFlow} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : tokens.radius.xxl } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', color: tokens.color.textDark, fontFamily: tokens.font.base, pb: 1, pr: 6 }}>
          Close {closeTarget?.name}
          <IconButton aria-label="close" onClick={dismissCloseFlow} disabled={closing} sx={{ position: 'absolute', right: 12, top: 12, color: tokens.color.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: tokens.color.border }}>
          {previewLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
              <CircularProgress size={22} sx={{ color: tokens.color.primary }} />
              <Typography sx={{ color: tokens.color.textMuted }}>Working out the month-end summary…</Typography>
            </Box>
          )}
          {previewError && <Alert severity="error" sx={{ mb: 2, borderRadius: tokens.radius.md }}>{previewError}</Alert>}

          {preview && (
            <>
              <Typography sx={{ fontSize: '0.9rem', color: tokens.color.textMid, mb: 2 }}>
                Nothing is wiped. The closing balance below becomes the brought-forward balance for {nextMonthName(closeTarget)}.
              </Typography>

              <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, overflow: 'hidden', mb: 2 }}>
                {summaryRows.map((r, i) => (
                  <Box
                    key={r.label}
                    sx={{
                      display: 'flex', justifyContent: 'space-between', gap: 2, px: 2, py: 1.25,
                      bgcolor: r.strong ? tokens.color.primaryPale : i % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                      borderTop: r.strong ? `2px solid ${tokens.color.border}` : undefined,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: r.strong ? 800 : 500, color: tokens.color.textDark }}>{r.label}</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: r.strong ? 800 : 700, color: r.strong ? tokens.color.primary : r.value < 0 ? tokens.color.danger : tokens.color.textDark, whiteSpace: 'nowrap' }}>
                      {formatUGX(r.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, mb: 2 }}>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: tokens.color.textDark }}>
                  Monthly fees: {formatUGX(preview.total_fees)}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted, mt: 0.25 }}>
                  Charged on what each of the {preview.members_count} members saved this month. Never taken out of anyone's savings.
                </Typography>
              </Box>

              <TextField
                label="Cash counted (optional)"
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value.replace(/[^0-9.]/g, ''))}
                fullWidth size="small" sx={inputSx}
                InputProps={{ startAdornment: <InputAdornment position="start">UGX</InputAdornment> }}
                helperText="Enter the cash the SACCO actually holds to check it against the closing balance."
              />
              {cashDifference !== null && (
                <Alert severity={cashDifference === 0 ? 'success' : 'warning'} sx={{ mt: 1.5, borderRadius: tokens.radius.md }}>
                  {cashDifference === 0
                    ? 'Cash matches the closing balance.'
                    : `Cash is ${formatUGX(Math.abs(cashDifference))} ${cashDifference > 0 ? 'more' : 'less'} than the closing balance. Check entries before closing.`}
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1, borderTop: `1px solid ${tokens.color.border}` }}>
          <Button onClick={dismissCloseFlow} disabled={closing} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: tokens.radius.md, color: tokens.color.textMid }}>
            Not yet
          </Button>
          <Button
            variant="contained" onClick={handleConfirmClose} disabled={!preview || closing}
            sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md, boxShadow: 'none', px: 3 }}
          >
            {closing ? <CircularProgress size={22} color="inherit" /> : `Close month and start ${nextMonthName(closeTarget)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Cycle Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : tokens.radius.xxl } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.3rem', color: tokens.color.textDark, fontFamily: tokens.font.base, pb: 1 }}>
          Create New Savings Cycle
          <IconButton aria-label="close" onClick={handleCloseDialog} disabled={submitting} sx={{ position: 'absolute', right: 12, top: 12, color: tokens.color.textMuted, '&:hover': { bgcolor: tokens.color.surfaceAlt } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: tokens.color.border }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Start Date *" type="date" value={selectedDate} onChange={handleDateChange} fullWidth InputLabelProps={{ shrink: true }} helperText="Any date — past, present, or future" disabled={submitting} sx={inputSx} />
            <TextField label="Cycle Name" value={customName} onChange={(e) => setCustomName(e.target.value)} fullWidth helperText="Auto-filled from start date — edit freely" disabled={submitting} sx={inputSx} />
            <TextField label="Status" select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as any)} fullWidth disabled={submitting} sx={inputSx}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
            <TextField label="End Date (optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} helperText="Leave blank if cycle is ongoing" disabled={submitting} sx={inputSx} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1, borderTop: `1px solid ${tokens.color.border}` }}>
          <Button onClick={handleCloseDialog} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', borderRadius: tokens.radius.md, color: tokens.color.textMid, '&:hover': { bgcolor: tokens.color.surfaceAlt } }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMonth} disabled={!selectedDate || submitting} sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', borderRadius: tokens.radius.md, boxShadow: 'none', px: 3 }}>
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Create Cycle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, cycle: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: tokens.radius.xxl } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem', color: tokens.color.textDark }}>Delete cycle?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '1rem', color: tokens.color.textMid, lineHeight: 1.6 }}>
            Delete{' '}
            <Box component="span" sx={{ fontWeight: 700, color: tokens.color.danger }}>"{deleteDialog.cycle?.name}"</Box>
            ? A cycle that has any savings or withdrawals recorded can't be deleted — the server will reject it and tell you why.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, cycle: null })} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', borderRadius: tokens.radius.md, color: tokens.color.textMid, '&:hover': { bgcolor: tokens.color.surfaceAlt } }}>Cancel</Button>
          <Button variant="contained" onClick={handleDeleteConfirm} sx={{ bgcolor: tokens.color.danger, '&:hover': { bgcolor: '#A93226' }, textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', borderRadius: tokens.radius.md, boxShadow: 'none' }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={8000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: tokens.radius.md, fontSize: '0.95rem' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}