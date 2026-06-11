import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, CircularProgress, Alert, IconButton, Collapse,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Switch, FormControlLabel, Autocomplete, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Search, Add, Person, Save, TrendingUp, Delete, KeyboardArrowDown,
  KeyboardArrowUp, Message, CheckCircle, Cancel, NotificationsNone,
  FilterList, CalendarToday, BarChart,
} from '@mui/icons-material';
import { addSavingsService } from '../services/addSavingsService';
import { viewSavingsService } from '../services/viewSavingsService';
import type { Member, SavingsCycle } from '../services/addSavingsService';
import { tokens, avatarColor } from '../config/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavingsEntry {
  id: number;
  member?: number;
  cycle?: number;
  member_name?: string;
  cycle_name?: string;
  amount: string | number;
  date: string;
  comment: string;
  created_at?: string;
  updated_at?: string;
}

interface MemberDetailResponse {
  member?: Member;
  current_month_entries?: SavingsEntry[];
  current_month_total?: number;
  month?: string;
  cycle_name?: string;
  entries?: SavingsEntry[];
  savings?: SavingsEntry[];
  total?: number;
  total_savings?: number;
  [key: string]: unknown;
}

interface MemberRow extends Member {
  expanded: boolean;
  savingsLoaded: boolean;
  savingsEntries: SavingsEntry[];
  savingsTotal: number;
}






// ─── Mini Bar Chart (deposit growth curve) ───────────────────────────────────
const MOCK_BARS = [
  { label: 'Oct 01', v: 60 },
  { label: 'Oct 07', v: 75 },
  { label: 'Oct 14', v: 55 },
  { label: 'Oct 21', v: 90 },
  { label: 'Oct 28', v: 100 },
];

function DepositGrowthChart({ period }: { period: 'Daily' | 'Weekly' }) {
  const max = Math.max(...MOCK_BARS.map((b) => b.v));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 80, mt: 1 }}>
      {MOCK_BARS.map((b, i) => (
        <Box key={b.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Box
            sx={{
              width: '100%',
              height: `${(b.v / max) * 68}px`,
              bgcolor: i === MOCK_BARS.length - 1 ? tokens.color.primary : tokens.color.primaryPale,
              borderRadius: `${tokens.radius.sm} ${tokens.radius.sm} 0 0`,
              transition: 'height 0.4s ease',
            }}
          />
          <Typography sx={{ fontSize: '0.58rem', color: tokens.color.textMuted, mt: '3px', whiteSpace: 'nowrap' }}>
            {b.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SavingsManagerPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [activeCycle, setActiveCycle] = useState<SavingsCycle | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'Daily' | 'Weekly'>('Daily');
  const [filterMember, setFilterMember] = useState('all');

  // Per-member inline form
  const [activeFormMemberId, setActiveFormMemberId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ [id: number]: { date: string; amount: string; comment: string } }>({});
  const [submitLoading, setSubmitLoading] = useState<{ [id: number]: boolean }>({});
  const [formError, setFormError] = useState<{ [id: number]: string | null }>({});
  const [sendMessage, setSendMessage] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ entry: SavingsEntry; memberId: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [recentAmounts, setRecentAmounts] = useState<{ [id: number]: number[] }>({});

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [membersData, cycleData] = await Promise.all([
        addSavingsService.getMembers(),
        addSavingsService.getActiveCycle(),
      ]);
      setMembers(membersData.map((m) => ({ ...m, expanded: false, savingsLoaded: false, savingsEntries: [], savingsTotal: 0 })));
      setActiveCycle(cycleData);
      if (!cycleData) setError('No active savings cycle found. Please create an active cycle first.');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];

  const handleToggleExpand = async (memberId: number) => {
    setMembers((prev) => prev.map((m) => m.id !== memberId ? m : { ...m, expanded: !m.expanded }));
    const member = members.find((m) => m.id === memberId);
    if (!member || member.savingsLoaded) return;
    try {
      const detail = await viewSavingsService.getMemberSavingsDetail(memberId) as MemberDetailResponse;
      const entries: SavingsEntry[] = detail.current_month_entries ?? detail.entries ?? detail.savings ?? [];
      const total = Number(detail.current_month_total ?? detail.total ?? detail.total_savings ?? 0);
      const lastAmounts = entries.slice(0, 4).map((e) => Number(e.amount));
      setRecentAmounts((prev) => ({ ...prev, [memberId]: [...new Set(lastAmounts)].filter(Boolean) }));
      setMembers((prev) => prev.map((m) => m.id !== memberId ? m : { ...m, savingsLoaded: true, savingsEntries: entries, savingsTotal: total }));
    } catch (err) {
      console.error('Failed to load savings for member', memberId, err);
    }
  };

  const handleOpenForm = (member: MemberRow) => {
    if (!activeCycle) { setError('No active savings cycle. Please create one first.'); return; }
    setActiveFormMemberId(member.id);
    const lastAmount = recentAmounts[member.id]?.[0]?.toString() || '';
    setFormData((prev) => ({ ...prev, [member.id]: { date: today(), amount: lastAmount, comment: '' } }));
    setFormError((prev) => ({ ...prev, [member.id]: null }));
  };

  const handleCloseForm = (memberId: number) => {
    setActiveFormMemberId(null);
    setFormError((prev) => ({ ...prev, [memberId]: null }));
  };

  const handleFormChange = (memberId: number, field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }));

  const handleSaveSavings = async (member: MemberRow) => {
    const data = formData[member.id];
    if (!data?.date || !data?.amount) { setFormError((prev) => ({ ...prev, [member.id]: 'Date and amount are required.' })); return; }
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) { setFormError((prev) => ({ ...prev, [member.id]: 'Enter a valid amount greater than 0.' })); return; }
    if (!activeCycle) { setFormError((prev) => ({ ...prev, [member.id]: 'No active cycle found.' })); return; }
    try {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: true }));
      setFormError((prev) => ({ ...prev, [member.id]: null }));
      const newEntry = await addSavingsService.createSavingsEntry({
        member: Number(member.id), cycle: Number(activeCycle.id),
        amount: Number(amount), date: data.date, comment: data.comment || '', send_sms: sendMessage,
      }) as SavingsEntry;
      const entryWithName = { ...newEntry, member_name: member.name };
      setMembers((prev) => prev.map((m) => {
        if (m.id !== member.id) return m;
        const updatedEntries = [entryWithName, ...m.savingsEntries];
        const newTotal = updatedEntries.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0);
        return { ...m, savingsEntries: updatedEntries, savingsTotal: newTotal, total_savings: newTotal, savingsLoaded: true };
      }));
      setRecentAmounts((prev) => ({ ...prev, [member.id]: [amount, ...(prev[member.id] || []).filter((a) => a !== amount)].slice(0, 5) }));
      setSuccessMessage(`UGX ${amount.toLocaleString()} saved for ${member.name}${sendMessage ? ' • SMS sent' : ''}!`);
      setActiveFormMemberId(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setFormError((prev) => ({ ...prev, [member.id]: err.message || 'Failed to save.' }));
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const handleDeleteClick = (entry: SavingsEntry, memberId: number) => {
    setEntryToDelete({ entry, memberId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      setDeleting(true);
      await addSavingsService.deleteSavingsEntry(entryToDelete.entry.id);
      setMembers((prev) => prev.map((m) => {
        if (m.id !== entryToDelete.memberId) return m;
        const updatedEntries = m.savingsEntries.filter((e) => e.id !== entryToDelete.entry.id);
        const newTotal = updatedEntries.reduce((s, e) => s + (parseFloat(String(e.amount)) || 0), 0);
        return { ...m, savingsEntries: updatedEntries, savingsTotal: newTotal, total_savings: newTotal };
      }));
      setSuccessMessage('Savings entry deleted.');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = parseFloat(String(amount ?? 0));
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' });

  // Total savings this month across all loaded members
  const totalThisMonth = members.reduce((s, m) => s + (parseFloat(String(m.total_savings ?? 0)) || 0), 0);

  const filteredMembers = members.filter(
    (m) =>
      (filterMember === 'all' || String(m.id) === filterMember) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.membership_id.toLowerCase().includes(search.toLowerCase()))
  );

  // ─── Loading state ────────────────────────────────────────────────────────────
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
          Loading savings data…
        </Typography>
      </Box>
    );
  }

  // ─── shared input sx ─────────────────────────────────────────────────────────
  const inputSx = {
    borderRadius: tokens.radius.md,
    fontSize: '0.85rem',
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: tokens.color.bg,
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        fontFamily: tokens.font.base,
      }}
    >
      {/* ── Top app bar ─────────────────────────────────────────────────────── */}
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
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.color.textDark, lineHeight: 1.2 }}>
            Savings Overview
          </Typography>
          {activeCycle && (
            <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted }}>
              {activeCycle.name}
            </Typography>
          )}
        </Box>
        <IconButton sx={{ color: tokens.color.textMid }}>
          <NotificationsNone />
        </IconButton>
      </Box>

      {/* ── Alerts ──────────────────────────────────────────────────────────── */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, pb: 4 }}>

        {/* ── Hero summary card ────────────────────────────────────────────── */}
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
          {/* decorative blobs */}
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
            {formatCurrency(totalThisMonth)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TrendingUp sx={{ fontSize: '1rem', opacity: 0.9 }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
              +12.4% vs last month
            </Typography>
          </Box>

          {/* Deposit Growth Chart */}
          <Box mt={2.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)' }}>
                Deposit Growth Curve
              </Typography>
              <Box display="flex" gap={0.5}>
                {(['Daily', 'Weekly'] as const).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    size="small"
                    sx={{
                      minWidth: 0,
                      px: 1.5, py: 0.3,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: 5,
                      textTransform: 'none',
                      bgcolor: chartPeriod === p ? 'rgba(255,255,255,0.25)' : 'transparent',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </Box>
            </Box>
            <DepositGrowthChart period={chartPeriod} />
          </Box>
        </Card>

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
        <Card
          sx={{
            borderRadius: tokens.radius.xxl,
            p: 2,
            mb: 2.5,
            bgcolor: tokens.color.surface,
            boxShadow: tokens.shadow.card,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Cycle badge */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                px: 1.5, py: 0.75, cursor: 'pointer',
                '&:hover': { bgcolor: tokens.color.surfaceAlt },
              }}
            >
              <CalendarToday sx={{ fontSize: 15, color: tokens.color.textMuted }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tokens.color.textDark, whiteSpace: 'nowrap' }}>
                {activeCycle?.name || 'October 2023'}
              </Typography>
            </Box>

            {/* Member filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: tokens.radius.md,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.primaryLight },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.primary },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Members</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={String(m.id)} sx={{ fontSize: '0.8rem' }}>{m.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Clear */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => { setFilterMember('all'); setSearch(''); }}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                borderRadius: tokens.radius.md,
                borderColor: tokens.color.border,
                color: tokens.color.textMid,
                '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary },
              }}
            >
              Clear Filters
            </Button>

            {/* SMS toggle */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Message sx={{ fontSize: 16, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }} />
              <Switch
                checked={sendMessage}
                onChange={(e) => setSendMessage(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: tokens.color.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: tokens.color.primaryLight },
                }}
              />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }}>
                {sendMessage ? 'SMS ON' : 'SMS OFF'}
              </Typography>
            </Box>
          </Box>
        </Card>

       

        {/* ── Search ──────────────────────────────────────────────────────────── */}
        <TextField
          fullWidth
          placeholder="Search by name or membership ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 2.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: tokens.color.textMuted, fontSize: 19 }} />
              </InputAdornment>
            ),
            sx: inputSx,
          }}
        />

        {/* ── Members list ─────────────────────────────────────────────────────── */}
        <Paper
          sx={{
            borderRadius: tokens.radius.xxl,
            overflow: 'hidden',
            boxShadow: tokens.shadow.card,
            background: tokens.color.surface,
            mb: 4,
          }}
        >
          {/* Table header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark, fontFamily: tokens.font.base }}>
              Members
            </Typography>
          </Box>

          <Box sx={{ width: '100%', overflowX: 'hidden' }}>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                  <TableCell sx={{ width: 36, p: 1, borderBottom: `2px solid ${tokens.color.border}` }} />
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, p: '10px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Member Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, p: '10px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Txn ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, p: '10px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', width: 80 }}>
                    Date
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, p: '10px 8px', width: 64 }}>
                    Act
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: tokens.color.textMuted }}>
                      <Typography variant="body2">No members found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member, index) => (
                    <React.Fragment key={member.id}>
                      {/* Member row */}
                      <TableRow
                        sx={{
                          bgcolor: member.expanded ? tokens.color.primaryPale : index % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                          cursor: 'pointer',
                          borderLeft: member.expanded ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: tokens.color.primaryPale },
                        }}
                        onClick={() => handleToggleExpand(member.id)}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <IconButton size="small" sx={{ p: 0.25 }}>
                            {member.expanded
                              ? <KeyboardArrowUp sx={{ color: tokens.color.primary, fontSize: 18 }} />
                              : <KeyboardArrowDown sx={{ color: tokens.color.textMuted, fontSize: 18 }} />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ p: '10px 8px' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                bgcolor: avatarColor(index),
                                width: 32, height: 32,
                                fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                              }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: tokens.color.textDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: tokens.color.success, fontWeight: 700 }}>
                                {formatCurrency(member.total_savings)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ p: '10px 8px' }}>
                          <Typography sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            #{member.membership_id}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ p: '10px 8px', width: 80 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: tokens.color.textMuted, lineHeight: 1.3 }}>
                            {member.savingsEntries[0] ? formatDate(member.savingsEntries[0].date) : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ p: '10px 4px', width: 64 }} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            disabled={!activeCycle}
                            onClick={() => {
                              if (!member.expanded) handleToggleExpand(member.id);
                              handleOpenForm(member);
                            }}
                            sx={{
                              bgcolor: activeFormMemberId === member.id ? tokens.color.secondary : tokens.color.primary,
                              color: '#fff',
                              width: 28, height: 28,
                              '&:hover': { bgcolor: tokens.color.secondary },
                              '&.Mui-disabled': { bgcolor: tokens.color.border, color: '#fff' },
                            }}
                          >
                            <Add sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded panel */}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                          <Collapse in={member.expanded} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                bgcolor: tokens.color.surfaceAlt,
                                borderBottom: `2px solid ${tokens.color.border}`,
                                px: { xs: 1.5, sm: 2.5 },
                                py: 2,
                              }}
                            >
                              {/* Inline Add Form */}
                              {activeFormMemberId === member.id && (
                                <Card
                                  sx={{
                                    borderRadius: tokens.radius.lg,
                                    p: 2.5,
                                    mb: 2,
                                    border: `2px solid ${tokens.color.primaryLight}`,
                                    boxShadow: `0 4px 16px rgba(45,106,79,0.12)`,
                                    bgcolor: tokens.color.surface,
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: tokens.color.textDark, mb: 1.5 }}>
                                    Add savings for {member.name}
                                  </Typography>

                                  {formError[member.id] && (
                                    <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}>
                                      {formError[member.id]}
                                    </Alert>
                                  )}

                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                      <TextField
                                        label="Date"
                                        type="date"
                                        value={formData[member.id]?.date || today()}
                                        onChange={(e) => handleFormChange(member.id, 'date', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                        sx={{ flex: '1 1 140px' }}
                                        InputProps={{ sx: inputSx }}
                                      />
                                      <Autocomplete
                                        freeSolo
                                        options={(recentAmounts[member.id] || []).map((a) => String(a))}
                                        getOptionLabel={(opt) => `UGX ${Number(opt).toLocaleString()}`}
                                        inputValue={formData[member.id]?.amount || ''}
                                        onInputChange={(_, val) => handleFormChange(member.id, 'amount', val.replace(/[^0-9.]/g, ''))}
                                        renderOption={(props, opt) => (
                                          <li {...props}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                              <CheckCircle sx={{ fontSize: 14, color: tokens.color.primary }} />
                                              <span style={{ fontSize: '0.82rem' }}>
                                                UGX {Number(opt).toLocaleString()}{' '}
                                                <span style={{ color: tokens.color.textMuted, fontSize: '0.75rem' }}>(recent)</span>
                                              </span>
                                            </Box>
                                          </li>
                                        )}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="Amount (UGX)"
                                            size="small"
                                            placeholder="Enter or pick recent"
                                            InputProps={{
                                              ...params.InputProps,
                                              startAdornment: (
                                                <InputAdornment position="start">
                                                  <Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>UGX</Typography>
                                                </InputAdornment>
                                              ),
                                              sx: inputSx,
                                            }}
                                            sx={{ flex: '1 1 180px' }}
                                          />
                                        )}
                                        sx={{ flex: '1 1 180px' }}
                                      />
                                    </Box>

                                    <TextField
                                      label="Comment (optional)"
                                      value={formData[member.id]?.comment || ''}
                                      onChange={(e) => handleFormChange(member.id, 'comment', e.target.value)}
                                      size="small"
                                      placeholder="e.g. Monthly deposit"
                                      fullWidth
                                      InputProps={{ sx: inputSx }}
                                    />

                                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                      <Button
                                        variant="contained"
                                        startIcon={
                                          submitLoading[member.id]
                                            ? <CircularProgress size={14} color="inherit" />
                                            : <Save sx={{ fontSize: 16 }} />
                                        }
                                        onClick={() => handleSaveSavings(member)}
                                        disabled={submitLoading[member.id]}
                                        size="small"
                                        sx={{
                                          bgcolor: tokens.color.primary,
                                          '&:hover': { bgcolor: tokens.color.secondary },
                                          textTransform: 'none',
                                          fontWeight: 700,
                                          borderRadius: tokens.radius.md,
                                          fontSize: '0.83rem',
                                          px: 2,
                                          boxShadow: 'none',
                                        }}
                                      >
                                        {submitLoading[member.id] ? 'Saving…' : 'Save'}
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        startIcon={<Cancel sx={{ fontSize: 16 }} />}
                                        onClick={() => handleCloseForm(member.id)}
                                        disabled={submitLoading[member.id]}
                                        size="small"
                                        sx={{
                                          textTransform: 'none',
                                          borderRadius: tokens.radius.md,
                                          fontSize: '0.83rem',
                                          borderColor: tokens.color.border,
                                          color: tokens.color.textMid,
                                          '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary },
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Message sx={{ fontSize: 15, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }} />
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }}>
                                          {sendMessage ? 'SMS ON' : 'SMS OFF'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Card>
                              )}

                              {/* Savings history */}
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: tokens.color.textDark }}>
                                  Savings History
                                </Typography>
                                {member.savingsLoaded && (
                                  <Chip
                                    label={`${member.savingsEntries.length} entries · ${formatCurrency(member.savingsTotal)}`}
                                    size="small"
                                    sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 700, fontSize: '0.72rem' }}
                                  />
                                )}
                              </Box>

                              {!member.savingsLoaded ? (
                                <Box display="flex" alignItems="center" gap={1.5} py={1.5}>
                                  <CircularProgress size={18} sx={{ color: tokens.color.primary }} />
                                  <Typography sx={{ fontSize: '0.82rem', color: tokens.color.textMuted }}>Loading…</Typography>
                                </Box>
                              ) : member.savingsEntries.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center', color: tokens.color.textMuted }}>
                                  <TrendingUp sx={{ fontSize: 32, mb: 0.5, color: tokens.color.primaryPale }} />
                                  <Typography sx={{ fontSize: '0.83rem' }}>No entries yet — add the first one above.</Typography>
                                </Box>
                              ) : (
                                <Box sx={{ width: '100%', overflowX: 'hidden' }}>
                                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                    <TableHead>
                                      <TableRow sx={{ background: tokens.color.primaryPale }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75, pl: 1, width: 28 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75, width: 90 }}>Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75 }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75 }}>Note</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75, width: 36 }}>Del</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {member.savingsEntries.map((entry, i) => (
                                        <TableRow
                                          key={entry.id}
                                          sx={{
                                            background: i % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                                            '&:hover': { background: tokens.color.primaryPale },
                                            transition: 'background 0.15s',
                                          }}
                                        >
                                          <TableCell sx={{ fontSize: '0.75rem', color: tokens.color.textMuted, py: 0.75, pl: 1 }}>{i + 1}</TableCell>
                                          <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, py: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {formatDate(entry.date)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ py: 0.75 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: tokens.color.success }}>
                                              {formatCurrency(entry.amount)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, py: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {entry.comment || '—'}
                                          </TableCell>
                                          <TableCell align="center" sx={{ py: 0.75, pr: 0.5 }}>
                                            <Tooltip title="Delete entry">
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(entry, member.id)}
                                                sx={{
                                                  p: 0.25,
                                                  color: tokens.color.danger,
                                                  '&:hover': { bgcolor: tokens.color.dangerPale },
                                                }}
                                              >
                                                <Delete sx={{ fontSize: 15 }} />
                                              </IconButton>
                                            </Tooltip>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setEntryToDelete(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: tokens.radius.xxl } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.87rem', color: tokens.color.textMid }}>
            Are you sure you want to delete this savings entry? This cannot be undone.
          </DialogContentText>
          {entryToDelete && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}` }}>
              <Typography sx={{ fontSize: '0.83rem', color: tokens.color.textDark }}><b>Amount:</b> {formatCurrency(entryToDelete.entry.amount)}</Typography>
              <Typography sx={{ fontSize: '0.83rem', mt: 0.5, color: tokens.color.textDark }}><b>Date:</b> {formatDate(entryToDelete.entry.date)}</Typography>
              {entryToDelete.entry.comment && (
                <Typography sx={{ fontSize: '0.83rem', mt: 0.5, color: tokens.color.textDark }}><b>Note:</b> {entryToDelete.entry.comment}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            onClick={() => { setDeleteDialogOpen(false); setEntryToDelete(null); }}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: tokens.color.textMid, fontSize: '0.85rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: tokens.color.danger,
              '&:hover': { bgcolor: '#A93226' },
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: tokens.radius.md,
              fontSize: '0.85rem',
              boxShadow: 'none',
            }}
          >
            {deleting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}