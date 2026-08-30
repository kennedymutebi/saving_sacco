'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, CircularProgress, Alert, IconButton, Collapse, Tooltip,
} from '@mui/material';
import {
  Search, RemoveCircle, Save, Cancel, KeyboardArrowDown, KeyboardArrowUp,
  NotificationsNone, AccountBalanceWallet, Info,
} from '@mui/icons-material';
import { withdrawService } from '../services/withdrawService';
import type { Member, Withdrawal, MemberBalance } from '../services/withdrawService';
import { tokens, avatarColor } from '../config/theme';

interface MemberRow extends Member {
  expanded: boolean;
  balanceLoaded: boolean;
  netBalance: number;
  withdrawals: Withdrawal[];
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: tokens.radius.md,
    bgcolor: tokens.color.surface,
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
  },
};

export default function WithdrawPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [activeFormMemberId, setActiveFormMemberId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ [id: number]: { date: string; amount: string; reason: string } }>({});
  const [submitLoading, setSubmitLoading] = useState<{ [id: number]: boolean }>({});
  const [formError, setFormError] = useState<{ [id: number]: string | null }>({});

  useEffect(() => { loadMembers(); }, []);

  const today = () => new Date().toISOString().split('T')[0];

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await withdrawService.getMembers();
      setMembers(data.map((m) => ({ ...m, expanded: false, balanceLoaded: false, netBalance: 0, withdrawals: [] })));
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = async (memberId: number) => {
    setMembers((prev) => prev.map((m) => (m.id !== memberId ? m : { ...m, expanded: !m.expanded })));
    const member = members.find((m) => m.id === memberId);
    if (!member || member.balanceLoaded) return;
    try {
      const [balance, withdrawals] = await Promise.all([
        withdrawService.getMemberBalance(memberId) as Promise<MemberBalance>,
        withdrawService.getWithdrawals(memberId),
      ]);
      setMembers((prev) => prev.map((m) =>
        m.id !== memberId ? m : { ...m, balanceLoaded: true, netBalance: balance.net_balance, withdrawals }
      ));
    } catch (err) {
      console.error('Failed to load balance for member', memberId, err);
    }
  };

  const handleOpenForm = (member: MemberRow) => {
    setActiveFormMemberId(member.id);
    setFormData((prev) => ({ ...prev, [member.id]: { date: today(), amount: '', reason: '' } }));
    setFormError((prev) => ({ ...prev, [member.id]: null }));
  };

  const handleCloseForm = (memberId: number) => {
    setActiveFormMemberId(null);
    setFormError((prev) => ({ ...prev, [memberId]: null }));
  };

  const handleFormChange = (memberId: number, field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }));

  const handleWithdraw = async (member: MemberRow) => {
    const data = formData[member.id];
    if (!data?.date || !data?.amount) {
      setFormError((prev) => ({ ...prev, [member.id]: 'Date and amount are required.' }));
      return;
    }
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError((prev) => ({ ...prev, [member.id]: 'Enter a valid amount greater than 0.' }));
      return;
    }
    // Client-side heads-up only — the server is the source of truth and will reject
    // this too if the balance has changed since we last loaded it.
    if (member.balanceLoaded && amount > member.netBalance) {
      setFormError((prev) => ({
        ...prev,
        [member.id]: `Insufficient balance. Available balance is UGX ${member.netBalance.toLocaleString()}.`,
      }));
      return;
    }

    try {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: true }));
      setFormError((prev) => ({ ...prev, [member.id]: null }));

      const newWithdrawal = await withdrawService.createWithdrawal({
        member: member.id,
        amount,
        date: data.date,
        reason: data.reason || undefined,
      });

      setMembers((prev) => prev.map((m) => {
        if (m.id !== member.id) return m;
        return {
          ...m,
          withdrawals: [newWithdrawal, ...m.withdrawals],
          netBalance: m.netBalance - amount,
        };
      }));

      setSuccessMessage(`UGX ${amount.toLocaleString()} withdrawn for ${member.name}.`);
      setActiveFormMemberId(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      // Backend validation errors (e.g. real insufficient balance) surface here
      setFormError((prev) => ({ ...prev, [member.id]: err.message || 'Failed to withdraw.' }));
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = parseFloat(String(amount ?? 0));
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(isNaN(n) ? 0 : n);
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' });

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.membership_id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '70vh', justifyContent: 'center', alignItems: 'center', bgcolor: tokens.color.bg }}>
        <CircularProgress size={48} thickness={4} sx={{ color: tokens.color.primary }} />
        <Typography sx={{ mt: 2.5, color: tokens.color.textMid, fontWeight: 600 }}>Loading members…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, fontFamily: tokens.font.base }}>

      {/* Top bar */}
      <Box sx={{
        background: tokens.color.surface, borderBottom: `1px solid ${tokens.color.border}`,
        px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(45,106,79,0.06)',
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.color.textDark }}>
          Withdraw Savings
        </Typography>
        <IconButton sx={{ color: tokens.color.textMid }}><NotificationsNone /></IconButton>
      </Box>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: tokens.radius.md }}>
          {error}
        </Alert>
      )}

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2.5, pb: 4 }}>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by name or membership ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 2.5 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: tokens.color.textMuted, fontSize: 19 }} /></InputAdornment>,
            sx: inputSx,
          }}
        />

        <Paper sx={{ borderRadius: tokens.radius.xxl, overflow: 'hidden', boxShadow: tokens.shadow.card, background: tokens.color.surface }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceAlt }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tokens.color.textDark }}>Members</Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                  <TableCell sx={{ width: 36, borderBottom: `2px solid ${tokens.color.border}` }} />
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, textTransform: 'uppercase' }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}`, textTransform: 'uppercase' }}>Membership ID</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.textMuted, borderBottom: `2px solid ${tokens.color.border}` }}>Withdraw</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: tokens.color.textMuted }}>No members found</TableCell></TableRow>
                ) : (
                  filteredMembers.map((member, index) => (
                    <React.Fragment key={member.id}>
                      <TableRow
                        sx={{
                          bgcolor: member.expanded ? tokens.color.primaryPale : index % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: tokens.color.primaryPale },
                        }}
                        onClick={() => handleToggleExpand(member.id)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {member.expanded ? <KeyboardArrowUp sx={{ color: tokens.color.primary }} /> : <KeyboardArrowDown sx={{ color: tokens.color.textMuted }} />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: avatarColor(index), width: 32, height: 32, fontWeight: 700, fontSize: '0.8rem' }}>
                              {member.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: tokens.color.textDark }}>{member.name}</Typography>
                              {member.balanceLoaded && (
                                <Typography sx={{ fontSize: '0.72rem', color: tokens.color.success, fontWeight: 700 }}>
                                  Balance: {formatCurrency(member.netBalance)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.78rem', color: tokens.color.textMuted, fontFamily: 'monospace' }}>
                            #{member.membership_id}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => { if (!member.expanded) handleToggleExpand(member.id); handleOpenForm(member); }}
                            sx={{
                              bgcolor: activeFormMemberId === member.id ? tokens.color.secondary : tokens.color.danger,
                              color: '#fff', width: 28, height: 28,
                              '&:hover': { bgcolor: tokens.color.secondary },
                            }}
                          >
                            <RemoveCircle sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                          <Collapse in={member.expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ bgcolor: tokens.color.surfaceAlt, borderBottom: `2px solid ${tokens.color.border}`, px: { xs: 1.5, sm: 2.5 }, py: 2 }}>

                              {activeFormMemberId === member.id && (
                                <Card sx={{ borderRadius: tokens.radius.lg, p: 2.5, mb: 2, border: `2px solid ${tokens.color.danger}`, bgcolor: tokens.color.surface }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: tokens.color.textDark, mb: 1.5 }}>
                                    Withdraw for {member.name}
                                  </Typography>

                                  {member.balanceLoaded && (
                                    <Alert severity="info" icon={<Info />} sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}>
                                      Available balance: {formatCurrency(member.netBalance)}
                                    </Alert>
                                  )}

                                  {formError[member.id] && (
                                    <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: tokens.radius.md }}>
                                      {formError[member.id]}
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
                                      />
                                      <TextField
                                        label="Amount (UGX)"
                                        value={formData[member.id]?.amount || ''}
                                        onChange={(e) => handleFormChange(member.id, 'amount', e.target.value.replace(/[^0-9.]/g, ''))}
                                        size="small" sx={{ flex: '1 1 180px' }}
                                        InputProps={{
                                          sx: inputSx,
                                          startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>UGX</Typography></InputAdornment>,
                                        }}
                                      />
                                    </Box>
                                    <TextField
                                      label="Reason (optional)"
                                      placeholder="Withdraw to be refilled"
                                      value={formData[member.id]?.reason || ''}
                                      onChange={(e) => handleFormChange(member.id, 'reason', e.target.value)}
                                      size="small" fullWidth
                                      InputProps={{ sx: inputSx }}
                                    />
                                    <Box display="flex" gap={1}>
                                      <Button
                                        variant="contained"
                                        startIcon={submitLoading[member.id] ? <CircularProgress size={14} color="inherit" /> : <Save sx={{ fontSize: 16 }} />}
                                        onClick={() => handleWithdraw(member)}
                                        disabled={submitLoading[member.id]}
                                        size="small"
                                        sx={{ bgcolor: tokens.color.danger, '&:hover': { bgcolor: '#A93226' }, textTransform: 'none', fontWeight: 700, borderRadius: tokens.radius.md, boxShadow: 'none' }}
                                      >
                                        {submitLoading[member.id] ? 'Processing…' : 'Confirm Withdraw'}
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        startIcon={<Cancel sx={{ fontSize: 16 }} />}
                                        onClick={() => handleCloseForm(member.id)}
                                        disabled={submitLoading[member.id]}
                                        size="small"
                                        sx={{ textTransform: 'none', borderRadius: tokens.radius.md, borderColor: tokens.color.border, color: tokens.color.textMid }}
                                      >
                                        Cancel
                                      </Button>
                                    </Box>
                                  </Box>
                                </Card>
                              )}

                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: tokens.color.textDark }}>Withdrawal History</Typography>
                                {member.balanceLoaded && (
                                  <Chip
                                    icon={<AccountBalanceWallet sx={{ fontSize: '0.9rem !important' }} />}
                                    label={`${member.withdrawals.length} withdrawals`}
                                    size="small"
                                    sx={{ bgcolor: tokens.color.dangerPale, color: tokens.color.danger, fontWeight: 700, fontSize: '0.72rem' }}
                                  />
                                )}
                              </Box>

                              {!member.balanceLoaded ? (
                                <Box display="flex" alignItems="center" gap={1.5} py={1.5}>
                                  <CircularProgress size={18} sx={{ color: tokens.color.primary }} />
                                  <Typography sx={{ fontSize: '0.82rem', color: tokens.color.textMuted }}>Loading…</Typography>
                                </Box>
                              ) : member.withdrawals.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center', color: tokens.color.textMuted }}>
                                  <Typography sx={{ fontSize: '0.83rem' }}>No withdrawals yet.</Typography>
                                </Box>
                              ) : (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ background: tokens.color.dangerPale }}>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.danger }}>Date</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.danger }}>Amount</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.danger }}>Reason</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.color.danger }}>Drew From</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {member.withdrawals.map((w, i) => (
                                      <TableRow key={w.id} sx={{ background: i % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt }}>
                                        <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted }}>{formatDate(w.date)}</TableCell>
                                        <TableCell align="right">
                                          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: tokens.color.danger }}>
                                            {formatCurrency(w.amount)}
                                          </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem', color: tokens.color.textMuted }}>{w.reason}</TableCell>
                                        <TableCell>
                                          <Tooltip title={w.allocations.map(a => `${formatCurrency(a.amount)} from ${formatDate(a.deposit_date)}`).join(', ')}>
                                            <Typography sx={{ fontSize: '0.72rem', color: tokens.color.textMuted, textDecoration: 'underline dotted', cursor: 'help' }}>
                                              {w.allocations.length} deposit{w.allocations.length !== 1 ? 's' : ''}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
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
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}