import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Avatar, CircularProgress, Alert, IconButton, Collapse,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Switch, Autocomplete, Select, MenuItem, FormControl,
} from '@mui/material';
import {
  Search, Add, Save, TrendingUp, Edit, KeyboardArrowDown,
  KeyboardArrowUp, Message, CheckCircle, Cancel, NotificationsNone,
  CalendarToday, Groups,
} from '@mui/icons-material';
import { addSavingsService } from '../services/addSavingsService';
import { viewSavingsService } from '../services/viewSavingsService';
import type { Member, SavingsCycle } from '../services/addSavingsService';
import { tokens, avatarColor } from '../config/theme';
import BalanceBreakdown from '../components/BalanceBreakdown';

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
  /** Set by the backend for correction entries (spec Section 4 / 6). */
  is_adjustment?: boolean;
}

interface MemberDetailResponse {
  member?: Member;
  entries?: SavingsEntry[];
  current_month_entries?: SavingsEntry[];
  savings?: SavingsEntry[];
  // Fields MemberSavingsDetailView already returns:
  total_this_month?: number;             // deposits this month
  total_withdrawn_this_month?: number;   // withdrawals this month
  net_balance_lifetime?: number;         // lifetime deposits - lifetime withdrawals
  carry_forward?: number;
  [key: string]: unknown;
}

interface MemberRow extends Member {
  expanded: boolean;
  savingsLoaded: boolean;
  savingsEntries: SavingsEntry[];
  collector_id?: number | null;
  collector_name?: string | null;
  // The three numbers every balance is shown as (spec Section 3)
  broughtForward: number;
  thisMonth: number;
  totalBalance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Turn whatever the members-list endpoint sends into B/F + This Month + Total.
 * Preferred backend fields: brought_forward, this_month, total_balance.
 * Falls back to the older field names so the page keeps working mid-migration.
 * Invariant kept everywhere: total = brought forward + this month.
 */
const normalizeBalances = (m: any) => {
  const thisMonth = toNum(
    m.this_month ?? m.balance_this_month ?? m.balance ??
    (toNum(m.total_savings) - toNum(m.total_withdrawn))
  );
  const explicitTotal = m.total_balance ?? m.net_balance_lifetime ?? m.lifetime_balance;
  const explicitBF = m.brought_forward ?? m.carry_forward;

  if (explicitTotal != null) {
    const totalBalance = toNum(explicitTotal);
    const broughtForward = explicitBF != null ? toNum(explicitBF) : totalBalance - thisMonth;
    return { broughtForward, thisMonth, totalBalance };
  }
  const broughtForward = toNum(explicitBF);
  return { broughtForward, thisMonth, totalBalance: broughtForward + thisMonth };
};

const compactUGX = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : Math.abs(n) >= 1_000 ? `${Math.round(n / 1_000)}k`
  : String(Math.round(n));

/** 'YYYY-MM-DD' in local time, whether given ISO or a display date like 'Oct 01, 2023'. */
const toISODate = (s: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const today = () => new Date().toISOString().split('T')[0];
const isCurrentMonth = (iso: string) => iso.slice(0, 7) === today().slice(0, 7);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SavingsManagerPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [activeCycle, setActiveCycle] = useState<SavingsCycle | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState('all');
  const [filterCollector, setFilterCollector] = useState('all');

  // Per-member inline form
  const [activeFormMemberId, setActiveFormMemberId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ [id: number]: { date: string; amount: string; comment: string } }>({});
  const [submitLoading, setSubmitLoading] = useState<{ [id: number]: boolean }>({});
  const [formError, setFormError] = useState<{ [id: number]: string | null }>({});
  // Duplicate-entry warning (spec Section 6): same member + date + amount
  const [duplicateWarning, setDuplicateWarning] = useState<{ [id: number]: boolean }>({});
  const [sendMessage, setSendMessage] = useState(false);

  // One-click correction (replaces delete)
  const [correctTarget, setCorrectTarget] = useState<{ entry: SavingsEntry; memberId: number } | null>(null);
  const [correctAmount, setCorrectAmount] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctError, setCorrectError] = useState<string | null>(null);

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
      setMembers(membersData.map((m) => ({
        ...m,
        ...normalizeBalances(m),
        expanded: false,
        savingsLoaded: false,
        savingsEntries: [],
      })));
      setActiveCycle(cycleData);
      if (!cycleData) setError('No active savings cycle found. Please create an active cycle first.');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull the authoritative numbers for one member from MemberSavingsDetailView.
   * Total = lifetime net; This Month = this month's deposits - withdrawals;
   * B/F = Total - This Month (so the three always reconcile).
   */
const loadMemberDetail = async (memberId: number) => {
    const detail = await viewSavingsService.getMemberSavingsDetail(memberId) as MemberDetailResponse;
    const entries: SavingsEntry[] = detail.current_month_entries ?? detail.entries ?? detail.savings ?? [];
    // total_this_month is already net of this cycle's withdrawals — see
    // MemberSavingsDetailView's comment ("now the correct remaining-this-month
    // figure"). Subtracting total_withdrawn_this_month again here was
    // double-counting the withdrawal, which is what caused this-month to
    // go negative and brought-forward to look stale.
    const thisMonth = toNum(detail.total_this_month);
    const totalBalance = toNum(detail.net_balance_lifetime);
    const recent = entries.filter((e) => !e.is_adjustment && Number(e.amount) > 0).slice(0, 4).map((e) => Number(e.amount));
    setRecentAmounts((prev) => ({ ...prev, [memberId]: [...new Set(recent)] }));
    setMembers((prev) => prev.map((m) => m.id !== memberId ? m : {
      ...m, savingsLoaded: true, savingsEntries: entries,
      thisMonth, totalBalance, broughtForward: totalBalance - thisMonth,
    }));
};

  const handleToggleExpand = async (memberId: number) => {
    setMembers((prev) => prev.map((m) => m.id !== memberId ? m : { ...m, expanded: !m.expanded }));
    const member = members.find((m) => m.id === memberId);
    if (!member || member.savingsLoaded) return;
    try {
      await loadMemberDetail(memberId);
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
    setDuplicateWarning((prev) => ({ ...prev, [member.id]: false }));
  };

  const handleCloseForm = (memberId: number) => {
    setActiveFormMemberId(null);
    setFormError((prev) => ({ ...prev, [memberId]: null }));
    setDuplicateWarning((prev) => ({ ...prev, [memberId]: false }));
  };

  const handleFormChange = (memberId: number, field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }));
    if (field === 'amount' || field === 'date') setDuplicateWarning((prev) => ({ ...prev, [memberId]: false }));
  };

  const handleSaveSavings = async (member: MemberRow, skipDuplicateCheck = false) => {
    const data = formData[member.id];
    if (!data?.date || !data?.amount) { setFormError((prev) => ({ ...prev, [member.id]: 'Date and amount are required.' })); return; }
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) { setFormError((prev) => ({ ...prev, [member.id]: 'Enter a valid amount greater than 0.' })); return; }
    if (!activeCycle) { setFormError((prev) => ({ ...prev, [member.id]: 'No active cycle found.' })); return; }

    // Duplicate-entry warning: same amount, same day, same member
    if (!skipDuplicateCheck) {
      const isDuplicate = member.savingsEntries.some(
        (e) => !e.is_adjustment && toISODate(e.date) === data.date && Number(e.amount) === amount
      );
      if (isDuplicate) {
        setDuplicateWarning((prev) => ({ ...prev, [member.id]: true }));
        return;
      }
    }

    try {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: true }));
      setFormError((prev) => ({ ...prev, [member.id]: null }));
      setDuplicateWarning((prev) => ({ ...prev, [member.id]: false }));
      const newEntry = await addSavingsService.createSavingsEntry({
        member: Number(member.id), cycle: Number(activeCycle.id),
        amount: Number(amount), date: data.date, comment: data.comment || '', send_sms: sendMessage,
      }) as SavingsEntry;

      // Optimistic update. IMPORTANT: add to This Month and Total — never
      // overwrite the total with this month's sum (that was the old bug).
      setMembers((prev) => prev.map((m) => m.id !== member.id ? m : {
        ...m,
        savingsEntries: [{ ...newEntry, member_name: member.name }, ...m.savingsEntries],
        thisMonth: m.thisMonth + amount,
        totalBalance: m.totalBalance + amount,
        savingsLoaded: true,
      }));
      setRecentAmounts((prev) => ({ ...prev, [member.id]: [amount, ...(prev[member.id] || []).filter((a) => a !== amount)].slice(0, 5) }));
      setSuccessMessage(`UGX ${amount.toLocaleString()} saved for ${member.name}${sendMessage ? ' • SMS sent' : ''}!`);
      setActiveFormMemberId(null);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Sync with the server's numbers and tell the dashboard to refresh.
      loadMemberDetail(member.id).catch(() => {});
      window.dispatchEvent(new Event('savings-updated'));
    } catch (err: any) {
      setFormError((prev) => ({ ...prev, [member.id]: err.message || 'Failed to save.' }));
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  // ── One-click correction: records an adjustment, never deletes ─────────────
  const openCorrection = (entry: SavingsEntry, memberId: number) => {
    setCorrectTarget({ entry, memberId });
    setCorrectAmount(String(Number(entry.amount)));
    setCorrectReason('');
    setCorrectError(null);
  };

  const closeCorrection = () => { setCorrectTarget(null); setCorrectError(null); };

  const handleCorrectConfirm = async () => {
    if (!correctTarget) return;
    const newAmount = parseFloat(correctAmount);
    if (isNaN(newAmount) || newAmount < 0) { setCorrectError('Enter the correct amount (0 or more).'); return; }
    if (!correctReason.trim()) { setCorrectError('Say why this is being corrected.'); return; }
    if (newAmount === Number(correctTarget.entry.amount)) { setCorrectError('The amount is unchanged.'); return; }
    try {
      setCorrecting(true);
      setCorrectError(null);
      await addSavingsService.correctSavingsEntry(correctTarget.entry.id, {
        correct_amount: newAmount,
        reason: correctReason.trim(),
      });
      await loadMemberDetail(correctTarget.memberId);
      window.dispatchEvent(new Event('savings-updated'));
      setSuccessMessage('Correction recorded. The original entry is kept in the history.');
      setTimeout(() => setSuccessMessage(null), 5000);
      closeCorrection();
    } catch (err: any) {
      setCorrectError(err.message || 'Failed to record the correction.');
    } finally {
      setCorrecting(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = parseFloat(String(amount ?? 0));
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(isNaN(n) ? 0 : n);
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' });

  // Totals across the members loaded on this page. NOTE: the members endpoint
  // limits non-staff users to members they registered, so this is "these members".
  const sumBF = members.reduce((s, m) => s + m.broughtForward, 0);
  const sumMonth = members.reduce((s, m) => s + m.thisMonth, 0);
  const sumTotal = members.reduce((s, m) => s + m.totalBalance, 0);

  const collectorOptions = Array.from(
    new Map(
      members.filter((m) => m.collector_id != null)
        .map((m) => [m.collector_id as number, m.collector_name || `Collector #${m.collector_id}`])
    ).entries()
  );

  const filteredMembers = members.filter(
    (m) =>
      (filterMember === 'all' || String(m.id) === filterMember) &&
      (filterCollector === 'all' || String(m.collector_id) === filterCollector) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.membership_id.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '70vh', justifyContent: 'center', alignItems: 'center', background: tokens.color.bg }}>
        <CircularProgress size={48} thickness={4} sx={{ color: tokens.color.primary }} />
        <Typography sx={{ mt: 2.5, color: tokens.color.textMid, fontWeight: 600, fontSize: '1rem' }}>
          Loading savings data…
        </Typography>
      </Box>
    );
  }

  const inputSx = {
    borderRadius: tokens.radius.md,
    fontSize: '0.85rem',
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  };
  const selectSx = {
    fontSize: '0.8rem', fontWeight: 600, borderRadius: tokens.radius.md,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.border },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: tokens.color.primary },
  };
  const headCell = { fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, p: '10px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' } as const;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', fontFamily: tokens.font.base }}>
      {/* Top app bar */}
      <Box
        sx={{
          background: tokens.color.surface, borderBottom: `1px solid ${tokens.color.border}`,
          px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.color.textDark, lineHeight: 1.2 }}>
            Add Savings
          </Typography>
          {activeCycle && (
            <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted }}>{activeCycle.name}</Typography>
          )}
        </Box>
        <IconButton sx={{ color: tokens.color.textMid }} aria-label="Notifications"><NotificationsNone /></IconButton>
      </Box>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md, fontSize: '0.85rem' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, pb: 4 }}>
        {/* Summary: B/F + This Month = Total (replaces the single "Savings This Month"
            number, the hard-coded "+12.4%" and the mock bar chart) */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tokens.color.textDark }}>
              Balance of {members.length} member{members.length === 1 ? '' : 's'}
            </Typography>
            <Chip label="Current Month" size="small" sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 600, fontSize: '0.7rem' }} />
          </Box>
          <BalanceBreakdown broughtForward={sumBF} thisMonth={sumMonth} total={sumTotal} />
        </Box>

        {/* Filter bar */}
        <Card sx={{ borderRadius: tokens.radius.xxl, p: 2, mb: 2.5, bgcolor: tokens.color.surface, boxShadow: tokens.shadow.card }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, px: 1.5, py: 0.75 }}>
              <CalendarToday sx={{ fontSize: 15, color: tokens.color.textMuted }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tokens.color.textDark, whiteSpace: 'nowrap' }}>
                {activeCycle?.name ?? 'No active cycle'}
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} displayEmpty sx={selectSx}>
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Members</MenuItem>
                {members.map((m) => (<MenuItem key={m.id} value={String(m.id)} sx={{ fontSize: '0.8rem' }}>{m.name}</MenuItem>))}
              </Select>
            </FormControl>

            {collectorOptions.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={filterCollector}
                  onChange={(e) => setFilterCollector(e.target.value)}
                  displayEmpty
                  startAdornment={<Groups sx={{ fontSize: 15, color: tokens.color.textMuted, mr: 0.5 }} />}
                  sx={selectSx}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Collectors</MenuItem>
                  {collectorOptions.map(([id, name]) => (<MenuItem key={id} value={String(id)} sx={{ fontSize: '0.8rem' }}>{name}</MenuItem>))}
                </Select>
              </FormControl>
            )}

            <Button
              variant="outlined" size="small"
              onClick={() => { setFilterMember('all'); setFilterCollector('all'); setSearch(''); }}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', borderRadius: tokens.radius.md, borderColor: tokens.color.border, color: tokens.color.textMid, '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary } }}
            >
              Clear Filters
            </Button>

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Message sx={{ fontSize: 16, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }} />
              <Switch
                checked={sendMessage} onChange={(e) => setSendMessage(e.target.checked)} size="small"
                inputProps={{ 'aria-label': 'Send SMS to member' }}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: tokens.color.primary }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: tokens.color.primaryLight } }}
              />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: sendMessage ? tokens.color.primary : tokens.color.textMuted }}>
                {sendMessage ? 'SMS ON' : 'SMS OFF'}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Search */}
        <TextField
          fullWidth placeholder="Search by name or membership ID…" value={search}
          onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 2.5 }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ color: tokens.color.textMuted, fontSize: 19 }} /></InputAdornment>), sx: inputSx }}
        />

        {/* Members list */}
        <Paper sx={{ borderRadius: tokens.radius.xxl, overflow: 'hidden', boxShadow: tokens.shadow.card, background: tokens.color.surface, mb: 4 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceAlt }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark, fontFamily: tokens.font.base }}>Members</Typography>
          </Box>

          <Box sx={{ width: '100%', overflowX: 'hidden' }}>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                  <TableCell sx={{ width: 36, p: 1, borderBottom: `2px solid ${tokens.color.border}` }} />
                  <TableCell sx={headCell}>Member Name</TableCell>
                  <TableCell sx={headCell}>Txn ID</TableCell>
                  <TableCell sx={{ ...headCell, width: 80 }}>Date</TableCell>
                  <TableCell align="center" sx={{ ...headCell, width: 64 }}>Act</TableCell>
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
                          <IconButton size="small" sx={{ p: 0.25 }} aria-label={member.expanded ? 'Collapse' : 'Expand'}>
                            {member.expanded
                              ? <KeyboardArrowUp sx={{ color: tokens.color.primary, fontSize: 18 }} />
                              : <KeyboardArrowDown sx={{ color: tokens.color.textMuted, fontSize: 18 }} />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ p: '10px 8px' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: avatarColor(index), width: 32, height: 32, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: tokens.color.textDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: tokens.color.success, fontWeight: 700 }}>
                                  {formatCurrency(member.totalBalance)}
                                </Typography>
                                {member.collector_name && (
                                  <Chip label={member.collector_name} size="small" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 600, bgcolor: tokens.color.surfaceAlt, color: tokens.color.textMuted, '& .MuiChip-label': { px: 0.75 } }} />
                                )}
                              </Box>
                              <Typography sx={{ fontSize: '0.66rem', color: tokens.color.textMuted }}>
                                B/F {compactUGX(member.broughtForward)} + {compactUGX(member.thisMonth)} this month
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
                            size="small" disabled={!activeCycle} aria-label={`Add savings for ${member.name}`}
                            onClick={() => { if (!member.expanded) handleToggleExpand(member.id); handleOpenForm(member); }}
                            sx={{
                              bgcolor: activeFormMemberId === member.id ? tokens.color.secondary : tokens.color.primary, color: '#fff', width: 28, height: 28,
                              '&:hover': { bgcolor: tokens.color.secondary }, '&.Mui-disabled': { bgcolor: tokens.color.border, color: '#fff' },
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
                            <Box sx={{ bgcolor: tokens.color.surfaceAlt, borderBottom: `2px solid ${tokens.color.border}`, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
                              <Box sx={{ mb: 2 }}>
                                <BalanceBreakdown
                                  compact
                                  broughtForward={member.broughtForward}
                                  thisMonth={member.thisMonth}
                                  total={member.totalBalance}
                                  loading={!member.savingsLoaded}
                                />
                              </Box>

                              {/* Inline Add Form */}
                              {activeFormMemberId === member.id && (
                                <Card sx={{ borderRadius: tokens.radius.lg, p: 2.5, mb: 2, border: `2px solid ${tokens.color.primaryLight}`, boxShadow: `0 4px 16px rgba(45,106,79,0.12)`, bgcolor: tokens.color.surface }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: tokens.color.textDark, mb: 1.5 }}>
                                    Add savings for {member.name}
                                  </Typography>

                                  {formError[member.id] && (
                                    <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}>{formError[member.id]}</Alert>
                                  )}

                                  {duplicateWarning[member.id] && (
                                    <Alert
                                      severity="warning"
                                      sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}
                                      action={
                                        <Button color="inherit" size="small" sx={{ textTransform: 'none', fontWeight: 700 }} onClick={() => handleSaveSavings(member, true)}>
                                          Save anyway
                                        </Button>
                                      }
                                    >
                                      {member.name} already has UGX {Number(formData[member.id]?.amount).toLocaleString()} saved on this date.
                                    </Alert>
                                  )}

                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                      <TextField
                                        label="Date" type="date"
                                        value={formData[member.id]?.date || today()}
                                        onChange={(e) => handleFormChange(member.id, 'date', e.target.value)}
                                        InputLabelProps={{ shrink: true }} size="small" sx={{ flex: '1 1 140px' }}
                                        InputProps={{ sx: inputSx }}
                                        helperText={
                                          formData[member.id]?.date && !isCurrentMonth(formData[member.id].date) && activeCycle
                                            ? `Date is outside this month. It will still be recorded in ${activeCycle.name}.`
                                            : undefined
                                        }
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
                                                UGX {Number(opt).toLocaleString()} <span style={{ color: tokens.color.textMuted, fontSize: '0.75rem' }}>(recent)</span>
                                              </span>
                                            </Box>
                                          </li>
                                        )}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params} label="Amount (UGX)" size="small" placeholder="Enter or pick recent"
                                            InputProps={{
                                              ...params.InputProps,
                                              startAdornment: (<InputAdornment position="start"><Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>UGX</Typography></InputAdornment>),
                                              sx: inputSx,
                                            }}
                                            sx={{ flex: '1 1 180px' }}
                                          />
                                        )}
                                        sx={{ flex: '1 1 180px' }}
                                      />
                                    </Box>

                                    <TextField
                                      label="Comment (optional)" value={formData[member.id]?.comment || ''}
                                      onChange={(e) => handleFormChange(member.id, 'comment', e.target.value)}
                                      size="small" placeholder="e.g. Monthly deposit" fullWidth InputProps={{ sx: inputSx }}
                                    />

                                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                      <Button
                                        variant="contained"
                                        startIcon={submitLoading[member.id] ? <CircularProgress size={14} color="inherit" /> : <Save sx={{ fontSize: 16 }} />}
                                        onClick={() => handleSaveSavings(member)} disabled={submitLoading[member.id]} size="small"
                                        sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md, fontSize: '0.83rem', px: 2, boxShadow: 'none' }}
                                      >
                                        {submitLoading[member.id] ? 'Saving…' : 'Save'}
                                      </Button>
                                      <Button
                                        variant="outlined" startIcon={<Cancel sx={{ fontSize: 16 }} />}
                                        onClick={() => handleCloseForm(member.id)} disabled={submitLoading[member.id]} size="small"
                                        sx={{ textTransform: 'none', borderRadius: tokens.radius.md, fontSize: '0.83rem', borderColor: tokens.color.border, color: tokens.color.textMid, '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary } }}
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

                              {/* This month's entries */}
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: tokens.color.textDark }}>This month's entries</Typography>
                                {member.savingsLoaded && (
                                  <Chip label={`${member.savingsEntries.length} entries`} size="small" sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 700, fontSize: '0.72rem' }} />
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
                                  <Typography sx={{ fontSize: '0.83rem' }}>No entries this month. Add the first one above.</Typography>
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
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.primary, py: 0.75, width: 40 }}>Fix</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {member.savingsEntries.map((entry, i) => {
                                        const isNegative = Number(entry.amount) < 0;
                                        return (
                                          <TableRow key={entry.id} sx={{ background: i % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt, '&:hover': { background: tokens.color.primaryPale }, transition: 'background 0.15s' }}>
                                            <TableCell sx={{ fontSize: '0.75rem', color: tokens.color.textMuted, py: 0.75, pl: 1 }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, py: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {formatDate(entry.date)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 0.75 }}>
                                              <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: isNegative ? tokens.color.danger : tokens.color.success }}>
                                                {formatCurrency(entry.amount)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, py: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {entry.is_adjustment && (
                                                <Chip label="Adjustment" size="small" sx={{ height: 16, mr: 0.5, fontSize: '0.62rem', fontWeight: 600, bgcolor: tokens.color.surfaceAlt, color: tokens.color.textMid, '& .MuiChip-label': { px: 0.75 } }} />
                                              )}
                                              {entry.comment || '—'}
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 0.75, pr: 0.5 }}>
                                              {!entry.is_adjustment && (
                                                <Tooltip title="Correct this entry">
                                                  <IconButton
                                                    size="small" aria-label="Correct entry"
                                                    onClick={() => openCorrection(entry, member.id)}
                                                    sx={{ p: 0.25, color: tokens.color.primary, '&:hover': { bgcolor: tokens.color.primaryPale } }}
                                                  >
                                                    <Edit sx={{ fontSize: 15 }} />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
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

      {/* Correction dialog (replaces delete) */}
      <Dialog open={!!correctTarget} onClose={correcting ? undefined : closeCorrection} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: tokens.radius.xxl } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>Correct this entry</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.85rem', color: tokens.color.textMid, mb: 1.5 }}>
            The original entry stays in the history. Only the difference is recorded, as an adjustment.
          </DialogContentText>
          {correctTarget && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}` }}>
              <Typography sx={{ fontSize: '0.83rem', color: tokens.color.textDark }}><b>Recorded:</b> {formatCurrency(correctTarget.entry.amount)}</Typography>
              <Typography sx={{ fontSize: '0.83rem', mt: 0.5, color: tokens.color.textDark }}><b>Date:</b> {formatDate(correctTarget.entry.date)}</Typography>
            </Box>
          )}
          {correctError && <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}>{correctError}</Alert>}
          <TextField
            label="Correct amount (UGX)" value={correctAmount} size="small" fullWidth sx={{ mb: 1.5 }}
            onChange={(e) => setCorrectAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            InputProps={{ sx: inputSx }}
            helperText={
              correctTarget && correctAmount !== '' && !isNaN(parseFloat(correctAmount))
                ? `Adjustment: ${parseFloat(correctAmount) - Number(correctTarget.entry.amount) >= 0 ? '+' : '−'}${formatCurrency(Math.abs(parseFloat(correctAmount) - Number(correctTarget.entry.amount)))}`
                : undefined
            }
          />
          <TextField
            label="Reason" value={correctReason} size="small" fullWidth placeholder="e.g. Typed 50,000 instead of 5,000"
            onChange={(e) => setCorrectReason(e.target.value)} InputProps={{ sx: inputSx }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={closeCorrection} disabled={correcting} sx={{ textTransform: 'none', fontWeight: 600, color: tokens.color.textMid, fontSize: '0.85rem' }}>Cancel</Button>
          <Button
            onClick={handleCorrectConfirm} variant="contained" disabled={correcting}
            sx={{ bgcolor: tokens.color.primary, '&:hover': { bgcolor: tokens.color.secondary }, textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md, fontSize: '0.85rem', boxShadow: 'none' }}
          >
            {correcting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Record correction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}