import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { Search, Person, Visibility, TrendingUp, ArrowBack, Delete, NotificationsNone } from '@mui/icons-material';
import { viewSavingsService } from '../services/viewSavingsService';
import addSavingsService from '../services/addSavingsService';
import { tokens, avatarColor } from '../config/theme';
// ─── Design Tokens (from Figma) ──────────────────────────────────────────────


// ─── Types ────────────────────────────────────────────────────────────────────
interface SavingsEntry {
  id: number;
  member?: number;
  member_id?: string;
  member_name?: string;
  cycle?: number;
  cycle_name?: string;
  amount: string | number;
  date: string;
  comment: string;
  created_at?: string;
  updated_at?: string;
}

interface Member {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  membership_id: string;
  total_savings: number;
  initials?: string;
  savings?: SavingsEntry[];
}

interface MemberSavingsDetail {
  member?: Member;
  current_month_entries?: SavingsEntry[];
  current_month_total?: number;
  month?: string;
  cycle_name?: string;
  entries?: SavingsEntry[];
  savings?: SavingsEntry[];
  total?: number;
  total_savings?: number;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount: any): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : 0;
  const valid = isNaN(num) ? 0 : num;
  return `UGX ${valid.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

// Avatar palette cycling


// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewSavingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentMonthEntries, setCurrentMonthEntries] = useState<SavingsEntry[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [showSavingsView, setShowSavingsView] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [savingsToDelete, setSavingsToDelete] = useState<SavingsEntry | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await viewSavingsService.getMembersWithSavings();
      let arr: Member[] = Array.isArray(data)
        ? data
        : (data as any)?.members || (data as any)?.results || (data as any)?.data || [];
      arr = arr.map((m) => ({ ...m, total_savings: m.total_savings ?? 0 }));
      setMembers(arr);
      setFilteredMembers(arr);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilteredMembers(
      query.trim() === ''
        ? members
        : members.filter(
            (m) =>
              m.name.toLowerCase().includes(query.toLowerCase()) ||
              m.membership_id.toLowerCase().includes(query.toLowerCase())
          )
    );
  };

  const handleViewSavings = async (member: Member) => {
    try {
      setDetailLoading(true);
      setError(null);
      setSuccess(null);
      setSelectedMember(member);
      const detail: MemberSavingsDetail = await viewSavingsService.getMemberSavingsDetail(member.id);
      setCurrentMonthEntries(detail.current_month_entries || detail.entries || detail.savings || []);
      setCurrentMonthTotal(Number(detail.current_month_total ?? detail.total ?? detail.total_savings ?? 0));
      setCurrentMonth(detail.month || detail.cycle_name || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      setShowSavingsView(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load member savings details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (entry: SavingsEntry) => {
    setSavingsToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!savingsToDelete || !selectedMember) return;
    try {
      setDeleting(true);
      setError(null);
      await addSavingsService.deleteSavingsEntry(savingsToDelete.id);
      const updated = currentMonthEntries.filter((e) => e.id !== savingsToDelete.id);
      setCurrentMonthEntries(updated);
      const newTotal = updated.reduce((s, e) => {
        const a = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
        return s + (isNaN(a) ? 0 : a);
      }, 0);
      setCurrentMonthTotal(newTotal);
      const updatedMembers = members.map((m) =>
        m.id === selectedMember.id ? { ...m, total_savings: newTotal } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      setSelectedMember({ ...selectedMember, total_savings: newTotal });
      setSuccess(`Entry of ${formatCurrency(savingsToDelete.amount)} deleted.`);
      setDeleteDialogOpen(false);
      setSavingsToDelete(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete savings entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSavingsToDelete(null);
  };

  const handleBackToList = () => {
    setShowSavingsView(false);
    setSelectedMember(null);
    setCurrentMonthEntries([]);
    setCurrentMonthTotal(0);
    setCurrentMonth('');
    setError(null);
    setSuccess(null);
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: tokens.color.bg,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ color: tokens.color.primary }} />
          <Typography sx={{ mt: 2, color: tokens.color.textMid, fontFamily: tokens.font.base }}>
            Loading members…
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Page shell ──────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        background: tokens.color.bg,
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',        // ← prevent horizontal scroll
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
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.15rem',
            color: tokens.color.textDark,
            fontFamily: tokens.font.base,
          }}
        >
          {showSavingsView && selectedMember ? selectedMember.name : 'Member Savings'}
        </Typography>
        <IconButton sx={{ color: tokens.color.textMid }}>
          <NotificationsNone />
        </IconButton>
      </Box>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 2, borderRadius: tokens.radius.md, fontSize: '0.875rem' }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 2, borderRadius: tokens.radius.md, fontSize: '0.875rem' }}
          >
            {success}
          </Alert>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LIST VIEW                                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {!showSavingsView ? (
          <>
            {/* Summary card */}
            <Card
              sx={{
                borderRadius: tokens.radius.xl,
                background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
                p: 3,
                mb: 3,
                boxShadow: tokens.shadow.elevated,
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* decorative circle */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }}
              />
              <Chip
                label="Current Month"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  mb: 1.5,
                }}
              />
              <Typography sx={{ fontSize: '0.8rem', opacity: 0.85, mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Members
              </Typography>
              <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, mb: 0.5 }}>
                {members.length}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {filteredMembers.length} shown · tap View to see details
              </Typography>
            </Card>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search by name or membership ID…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: tokens.color.textMuted, fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: tokens.radius.lg,
                  background: tokens.color.surface,
                  fontSize: '0.9rem',
                  '& fieldset': { borderColor: tokens.color.border },
                  '&:hover fieldset': { borderColor: tokens.color.primaryLight },
                  '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
                },
              }}
              sx={{ mb: 2.5 }}
            />

            {/* Members list card */}
            <Card sx={{ borderRadius: tokens.radius.xl, boxShadow: tokens.shadow.card, overflow: 'hidden' }}>
              {/* Card header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  background: tokens.color.surface,
                }}
              >
                <Person sx={{ color: tokens.color.primary, fontSize: '1.3rem' }} />
                <Typography sx={{ fontWeight: 700, color: tokens.color.textDark, fontSize: '1rem' }}>
                  All Members
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Chip
                  label={filteredMembers.length}
                  size="small"
                  sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 700, minWidth: 28 }}
                />
              </Box>

              {/* Table — no overflowX, columns flex-distribute */}
              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: 'none',
                  overflowX: 'hidden',   // ← key: no horizontal scroll
                  width: '100%',
                }}
              >
                <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                      <TableCell
                        sx={{
                          width: '40%',
                          fontWeight: 700,
                          color: tokens.color.textMid,
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.5,
                          pl: 3,
                        }}
                      >
                        Member
                      </TableCell>
                      <TableCell
                        sx={{
                          width: '30%',
                          fontWeight: 700,
                          color: tokens.color.textMid,
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.5,
                        }}
                      >
                        Savings
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          width: '30%',
                          fontWeight: 700,
                          color: tokens.color.textMid,
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: `2px solid ${tokens.color.border}`,
                          py: 1.5,
                        }}
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                          <TrendingUp sx={{ fontSize: 40, color: tokens.color.textMuted, mb: 1 }} />
                          <Typography sx={{ color: tokens.color.textMuted, fontWeight: 600 }}>
                            No members found
                          </Typography>
                          <Typography variant="body2" sx={{ color: tokens.color.textMuted, mt: 0.5 }}>
                            Try a different search
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((member, idx) => (
                        <TableRow
                          key={member.id}
                          sx={{
                            background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                            '&:hover': { background: tokens.color.primaryPale },
                            transition: 'background 0.15s',
                          }}
                        >
                          {/* Member */}
                          <TableCell sx={{ pl: 3, py: 1.5, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                              <Avatar
                                sx={{
                                  bgcolor: avatarColor(idx),
                                  width: 36,
                                  height: 36,
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(member.name)}
                              </Avatar>
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
                                  {member.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: '0.72rem',
                                    color: tokens.color.textMuted,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {member.membership_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Savings */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: tokens.color.success,
                                fontSize: '0.82rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCurrency(member.total_savings ?? 0)}
                            </Typography>
                          </TableCell>

                          {/* Action */}
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={detailLoading ? undefined : <Visibility sx={{ fontSize: '0.9rem' }} />}
                              onClick={() => handleViewSavings(member)}
                              disabled={detailLoading}
                              sx={{
                                bgcolor: tokens.color.primary,
                                '&:hover': { bgcolor: '#1B4F39' },
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                borderRadius: tokens.radius.md,
                                px: 1.5,
                                py: 0.6,
                                minWidth: 0,
                                boxShadow: 'none',
                              }}
                            >
                              {detailLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════ */
          /* DETAIL VIEW                                                    */
          /* ══════════════════════════════════════════════════════════════ */
          selectedMember && (
            <>
              {/* Back */}
              <Button
                variant="text"
                startIcon={<ArrowBack sx={{ fontSize: '1rem' }} />}
                onClick={handleBackToList}
                sx={{
                  mb: 2.5,
                  color: tokens.color.primary,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': { bgcolor: tokens.color.primaryPale },
                  borderRadius: tokens.radius.md,
                  px: 1.5,
                }}
              >
                Back to Members
              </Button>

              {/* Member hero card */}
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
                <Box sx={{ position: 'absolute', bottom: -20, right: -20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 52, height: 52, fontSize: '1.2rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}
                  >
                    {getInitials(selectedMember.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                      {selectedMember.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.8 }}>
                      {selectedMember.membership_id}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.72rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
                  Savings This Month
                </Typography>
                <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {formatCurrency(selectedMember.total_savings)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                  <Chip
                    label={`${currentMonthEntries.length} ${currentMonthEntries.length === 1 ? 'entry' : 'entries'}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                  <Typography sx={{ fontSize: '0.78rem', opacity: 0.75 }}>{currentMonth}</Typography>
                </Box>
              </Card>

              {/* Entries table */}
              <Card sx={{ borderRadius: tokens.radius.xl, boxShadow: tokens.shadow.card, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${tokens.color.border}` }}>
                  <Typography sx={{ fontWeight: 700, color: tokens.color.textDark, fontSize: '1rem' }}>
                    Savings Entries
                  </Typography>
                </Box>

                {currentMonthEntries.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                    <TrendingUp sx={{ fontSize: 44, color: tokens.color.textMuted, mb: 1.5 }} />
                    <Typography sx={{ color: tokens.color.textMid, fontWeight: 600 }}>
                      No entries this month
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.color.textMuted, mt: 0.5 }}>
                      {selectedMember.name} hasn't deposited in {currentMonth}
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'hidden', width: '100%' }}>
                    <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableHead>
                        <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                          {['Date', 'Amount', 'Comment', ''].map((h, i) => (
                            <TableCell
                              key={h + i}
                              align={i === 1 ? 'right' : i === 3 ? 'center' : 'left'}
                              sx={{
                                width: i === 0 ? '28%' : i === 1 ? '28%' : i === 2 ? '32%' : '12%',
                                fontWeight: 700,
                                color: tokens.color.textMid,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                borderBottom: `2px solid ${tokens.color.border}`,
                                py: 1.5,
                                pl: i === 0 ? 3 : undefined,
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentMonthEntries.map((entry, idx) => (
                          <TableRow
                            key={entry.id}
                            sx={{
                              background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                              '&:hover': { background: tokens.color.primaryPale },
                              transition: 'background 0.15s',
                            }}
                          >
                            <TableCell sx={{ py: 1.5, pl: 3, fontSize: '0.82rem', color: tokens.color.textMid, whiteSpace: 'nowrap' }}>
                              {formatDate(entry.date)}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography sx={{ fontWeight: 700, color: tokens.color.success, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                {formatCurrency(entry.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5, fontSize: '0.82rem', color: tokens.color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.comment || '—'}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Tooltip title="Delete entry">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(entry)}
                                  sx={{
                                    color: tokens.color.danger,
                                    '&:hover': { bgcolor: tokens.color.dangerPale },
                                    width: 28,
                                    height: 28,
                                  }}
                                >
                                  <Delete sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </>
          )
        )}
      </Box>

      {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: tokens.radius.xl, p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: tokens.color.textDark, pb: 1 }}>
          Delete Entry
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: tokens.color.textMid, fontSize: '0.9rem' }}>
            Are you sure you want to permanently delete this savings entry?
          </DialogContentText>
          {savingsToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}` }}>
              <Typography variant="body2" sx={{ color: tokens.color.textMid }}>
                <strong>Amount:</strong> {formatCurrency(savingsToDelete.amount)}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.color.textMid, mt: 0.75 }}>
                <strong>Date:</strong> {formatDate(savingsToDelete.date)}
              </Typography>
              {savingsToDelete.comment && (
                <Typography variant="body2" sx={{ color: tokens.color.textMid, mt: 0.75 }}>
                  <strong>Note:</strong> {savingsToDelete.comment}
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: tokens.color.danger, fontWeight: 500, fontSize: '0.82rem' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: tokens.color.textMid, borderRadius: tokens.radius.md }}
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
              fontWeight: 600,
              borderRadius: tokens.radius.md,
              boxShadow: 'none',
            }}
          >
            {deleting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}