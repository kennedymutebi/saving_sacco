'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Modal, Avatar, Container, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Search, Add, Person, Close, Save, Edit, Delete, Phone, Home,
  Refresh, Warning
} from '@mui/icons-material';
import { membersService } from '../services/membersService';
import type { Member, CreateMemberData, UpdateMemberData } from '../services/membersService';
import { tokens, avatarColor } from '../config/theme';

interface FormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  place_of_residence: string;
}

// ─── Shared Design Tokens (matching SavingsDashboard) ────────────────────────

// ─── Avatar palette cycling ───────────────────────────────────────────────────


// ─── Validation utilities ─────────────────────────────────────────────────────
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) cleaned = '+256' + cleaned.substring(1);
  if (!cleaned.startsWith('+')) cleaned = '+256' + cleaned;
  return cleaned;
};

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  return /^\+256[0-9]{9}$/.test(normalizePhoneNumber(phone));
};

// ─── Shared input sx ──────────────────────────────────────────────────────────
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

export default function AddMemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; member: Member | null }>({
    open: false,
    member: null,
  });

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    place_of_residence: '',
  });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async (query?: string) => {
    try {
      setLoading(true);
      const data = await membersService.getAllMembers(query);
      setMembers(data);
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(search || undefined), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenForm = (member: Member | null = null) => {
    setFormErrors({});
    if (member) {
      setEditingMember(member);
      const names = member.full_name.split(' ');
      setFormData({
        first_name: names[0] || '',
        last_name: names.slice(1).join(' ') || '',
        phone_number: member.phone_number || '',
        place_of_residence: member.place_of_residence || '',
      });
    } else {
      setEditingMember(null);
      setFormData({ first_name: '', last_name: '', phone_number: '', place_of_residence: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      errors.phone_number = 'Invalid phone number. Use format: 0752682559 or +256752682559';
    }
    if (!formData.place_of_residence.trim()) errors.place_of_residence = 'Place of residence is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMember = async () => {
    if (!validateForm()) { showSnackbar('Please fix the errors in the form', 'error'); return; }
    try {
      setSubmitting(true);
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: normalizePhoneNumber(formData.phone_number),
        place_of_residence: formData.place_of_residence.trim(),
      };
      if (editingMember) {
        await membersService.updateMember(editingMember.id, payload as UpdateMemberData);
        showSnackbar('Member updated successfully', 'success');
      } else {
        await membersService.createMember(payload as CreateMemberData);
        showSnackbar('Member added successfully', 'success');
      }
      handleCloseForm();
      await fetchMembers();
    } catch (err: any) {
      const errStr = err.message?.toLowerCase() || '';
      let msg = 'Failed to save member';
      if (errStr.includes('phone') && errStr.includes('already exists')) {
        msg = 'This phone number is already registered';
        setFormErrors({ phone_number: msg });
      } else if (errStr.includes('phone')) {
        msg = 'Invalid phone number format';
        setFormErrors({ phone_number: msg });
      } else if (errStr.includes('network') || errStr.includes('fetch')) {
        msg = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        msg = err.message;
      }
      showSnackbar(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (member: Member) => {
    setDeleteDialog({ open: true, member });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.member) return;
    const member = deleteDialog.member;
    setDeleteDialog({ open: false, member: null });
    try {
      setLoading(true);
      await membersService.deleteMember(member.id);
      showSnackbar(`${member.full_name || 'Member'} deleted successfully`, 'success');
      await fetchMembers();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => setDeleteDialog({ open: false, member: null });

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && members.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: tokens.color.bg }}>
        <CircularProgress size={48} thickness={4} sx={{ color: tokens.color.primary }} />
        <Typography sx={{ mt: 2.5, color: tokens.color.textMid, fontWeight: 600, fontSize: '1rem' }}>
          Loading members…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.color.bg, fontFamily: tokens.font.base }}>

      {/* ── Top App Bar ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: tokens.color.surface,
          borderBottom: `1px solid ${tokens.color.border}`,
          px: { xs: 2, md: 4 },
          py: 2,
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
            fontWeight: 800,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            color: tokens.color.textDark,
            letterSpacing: '-0.01em',
            fontFamily: tokens.font.base,
          }}
        >
          Manage Members
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchMembers()}
            sx={{
              borderColor: tokens.color.border,
              color: tokens.color.textMid,
              fontWeight: 600,
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary, bgcolor: tokens.color.primaryPale },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
            sx={{
              bgcolor: tokens.color.primary,
              '&:hover': { bgcolor: tokens.color.secondary },
              fontWeight: 700,
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: `0 4px 14px rgba(45,106,79,0.3)`,
            }}
          >
            Add New Member
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>

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
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Typography sx={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
            Total Members
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '2.5rem', sm: '3rem' }, lineHeight: 1.05 }}>
            {members.length}
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 500, opacity: 0.85, mt: 0.5 }}>
            registered in the system
          </Typography>
        </Card>

        {/* ── Search ──────────────────────────────────────────────────────────── */}
        <TextField
          fullWidth
          placeholder="Search by name or phone number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3, ...inputSx }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: tokens.color.textMuted }} />
              </InputAdornment>
            ),
          }}
        />

        {/* ── Members table ────────────────────────────────────────────────────── */}
        <Paper
          sx={{
            borderRadius: tokens.radius.xxl,
            overflow: 'hidden',
            boxShadow: tokens.shadow.card,
            background: tokens.color.surface,
          }}
        >
          {/* Section header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: tokens.color.textDark, fontFamily: tokens.font.base }}>
              Members
            </Typography>
            <Chip
              label={`${members.length} total`}
              size="small"
              sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 700, fontSize: '0.85rem' }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: tokens.color.surfaceAlt }}>
                  {['Member', 'Membership ID', 'Phone Number', 'Place of Residence', 'Date Joined', 'Actions'].map((h) => (
                    <TableCell
                      key={h}
                      align={h === 'Actions' ? 'center' : 'left'}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: tokens.color.textMuted,
                        borderBottom: `2px solid ${tokens.color.border}`,
                        py: 1.5,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: tokens.color.textMuted, fontSize: '1rem' }}>No members found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, idx) => (
                    <TableRow
                      key={member.id}
                      sx={{
                        background: idx % 2 === 0 ? tokens.color.surface : tokens.color.surfaceAlt,
                        '&:hover': { background: tokens.color.primaryPale },
                        transition: 'background 0.15s',
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: avatarColor(idx), width: 38, height: 38, fontWeight: 700, fontSize: '1rem' }}>
                            {member.full_name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: tokens.color.textDark }}>
                            {member.full_name || 'No name'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={member.membership_id}
                          size="small"
                          sx={{ bgcolor: tokens.color.primaryPale, color: tokens.color.primary, fontWeight: 700, fontSize: '0.85rem' }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.5, fontFamily: 'monospace', fontSize: '0.95rem', color: tokens.color.textMid }}>
                        {member.phone_number}
                      </TableCell>

                      <TableCell sx={{ py: 1.5, fontSize: '0.95rem', color: tokens.color.textMid }}>
                        {member.place_of_residence}
                      </TableCell>

                      <TableCell sx={{ py: 1.5, fontSize: '0.95rem', color: tokens.color.textMuted }}>
                        {formatDate(member.date_joined)}
                      </TableCell>

                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleOpenForm(member)}
                          sx={{
                            mr: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderRadius: tokens.radius.md,
                            color: tokens.color.primary,
                            '&:hover': { bgcolor: tokens.color.primaryPale },
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteMember(member)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderRadius: tokens.radius.md,
                            color: tokens.color.danger,
                            '&:hover': { bgcolor: tokens.color.dangerPale },
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal open={showForm} onClose={handleCloseForm}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '92%', sm: 520 },
            bgcolor: tokens.color.surface,
            borderRadius: tokens.radius.xxl,
            boxShadow: tokens.shadow.elevated,
            p: { xs: 3, sm: 4 },
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Modal header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: tokens.color.textDark, fontFamily: tokens.font.base }}>
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </Typography>
            <Button
              onClick={handleCloseForm}
              disabled={submitting}
              sx={{ minWidth: 0, p: 0.75, color: tokens.color.textMuted, borderRadius: tokens.radius.md, '&:hover': { bgcolor: tokens.color.surfaceAlt } }}
            >
              <Close />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              fullWidth
              required
              error={!!formErrors.first_name}
              helperText={formErrors.first_name}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: tokens.color.textMuted }} /></InputAdornment> }}
              sx={inputSx}
            />
            <TextField
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              fullWidth
              required
              error={!!formErrors.last_name}
              helperText={formErrors.last_name}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: tokens.color.textMuted }} /></InputAdornment> }}
              sx={inputSx}
            />
            <TextField
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              fullWidth
              required
              error={!!formErrors.phone_number}
              helperText={formErrors.phone_number || 'Format: 0752682559 or +256752682559'}
              InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: tokens.color.textMuted }} /></InputAdornment> }}
              sx={inputSx}
            />
            <TextField
              label="Place of Residence"
              value={formData.place_of_residence}
              onChange={(e) => setFormData({ ...formData, place_of_residence: e.target.value })}
              fullWidth
              required
              error={!!formErrors.place_of_residence}
              helperText={formErrors.place_of_residence}
              InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: tokens.color.textMuted }} /></InputAdornment> }}
              sx={inputSx}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCloseForm}
              disabled={submitting}
              sx={{
                borderColor: tokens.color.border,
                color: tokens.color.textMid,
                fontWeight: 600,
                borderRadius: tokens.radius.md,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMember}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : editingMember ? <Save /> : <Add />}
              sx={{
                bgcolor: tokens.color.primary,
                '&:hover': { bgcolor: tokens.color.secondary },
                fontWeight: 700,
                borderRadius: tokens.radius.md,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: 'none',
              }}
            >
              {submitting ? 'Saving…' : editingMember ? 'Update Member' : 'Save Member'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ── Snackbar ─────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: tokens.radius.md, fontSize: '0.95rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: tokens.radius.xxl } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Warning sx={{ color: tokens.color.danger, fontSize: '1.75rem' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: tokens.color.textDark }}>
            Confirm Delete
          </Typography>
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', color: tokens.color.textMid, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <Box component="span" sx={{ fontWeight: 700, color: tokens.color.danger }}>
              {deleteDialog.member?.full_name}
            </Box>
            ?
          </DialogContentText>

          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: tokens.color.dangerPale,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.danger}33`,
            }}
          >
            <Typography sx={{ fontSize: '0.95rem', color: tokens.color.textMid, lineHeight: 1.6 }}>
              ⚠️ <strong>Warning:</strong> This action cannot be undone. All member data including savings
              history will be permanently removed from the system.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            sx={{
              borderColor: tokens.color.border,
              color: tokens.color.textMid,
              fontWeight: 600,
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': { borderColor: tokens.color.primaryLight, color: tokens.color.primary },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            startIcon={<Delete />}
            autoFocus
            sx={{
              bgcolor: tokens.color.danger,
              '&:hover': { bgcolor: '#A93226' },
              fontWeight: 700,
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: 'none',
            }}
          >
            Delete Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}