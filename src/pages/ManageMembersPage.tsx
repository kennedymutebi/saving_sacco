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
import { membersService} from '../services/membersService';
import type { Member, CreateMemberData, UpdateMemberData } from '../services/membersService';

interface FormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  place_of_residence: string;
}

// Validation utilities
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+256' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+256' + cleaned;
  }
  return cleaned;
};

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  const ugandanPhoneRegex = /^\+256[0-9]{9}$/;
  return ugandanPhoneRegex.test(normalized);
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
    member: null 
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
      console.error('Error fetching members:', err);
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
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        place_of_residence: '',
      });
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

    // First name validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    // Phone number validation
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      errors.phone_number = 'Invalid phone number. Use format: 0752682559 or +256752682559';
    }

    // Place of residence validation
    if (!formData.place_of_residence.trim()) {
      errors.place_of_residence = 'Place of residence is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMember = async () => {
    // Validate form
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingMember) {
        // Update existing member
        const updateData: UpdateMemberData = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: normalizePhoneNumber(formData.phone_number),
          place_of_residence: formData.place_of_residence.trim(),
        };
        
        await membersService.updateMember(editingMember.id, updateData);
        showSnackbar('Member updated successfully', 'success');
      } else {
        // Create new member
        const createData: CreateMemberData = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: normalizePhoneNumber(formData.phone_number),
          place_of_residence: formData.place_of_residence.trim(),
        };
        
        console.log('Creating member with data:', createData);
        await membersService.createMember(createData);
        showSnackbar('Member added successfully', 'success');
      }
      
      handleCloseForm();
      await fetchMembers();
    } catch (err: any) {
      console.error('Error saving member:', err);
      
      // Parse error message to provide helpful feedback
      let errorMessage = 'Failed to save member';
      
      const errString = err.message?.toLowerCase() || '';
      
      if (errString.includes('phone') && errString.includes('already exists')) {
        errorMessage = 'This phone number is already registered';
        setFormErrors({ phone_number: 'This phone number is already registered' });
      } else if (errString.includes('phone')) {
        errorMessage = 'Invalid phone number format';
        setFormErrors({ phone_number: 'Invalid phone number format' });
      } else if (errString.includes('network') || errString.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errString.includes('server error') || errString.includes('500')) {
        errorMessage = 'Server error. Please try again or contact support if the problem persists.';
      } else if (errString.includes('unauthorized') || errString.includes('401')) {
        errorMessage = 'Your session has expired. Please login again.';
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (member: Member) => {
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
      console.error('Error deleting member:', err);
      
      let errorMessage = 'Failed to delete member';
      const errString = err.message?.toLowerCase() || '';
      
      if (errString.includes('not found') || errString.includes('404')) {
        errorMessage = 'Member not found. It may have already been deleted.';
      } else if (errString.includes('permission') || errString.includes('403')) {
        errorMessage = 'You do not have permission to delete this member.';
      } else if (errString.includes('network') || errString.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, member: null });
  };

  const formatDate = (date: string) => {
    try { 
      return new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }); 
    } catch { 
      return 'N/A'; 
    }
  };

  if (loading && members.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>MANAGE MEMBERS</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => fetchMembers()}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
              Add New Member
            </Button>
          </Box>
        </Box>

        <TextField 
          fullWidth 
          placeholder="Search by name, phone..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }} 
        />

        <Card sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Total Members:</Typography>
          <Chip label={members.length} color="primary" />
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Membership ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Place of Residence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date Joined</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No members found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#3b82f6' }}>
                            {member.full_name?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {member.full_name || 'No name'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={member.membership_id} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af' }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{member.phone_number}</TableCell>
                      <TableCell>{member.place_of_residence}</TableCell>
                      <TableCell>{formatDate(member.date_joined)}</TableCell>
                      <TableCell align="center">
                        <Button 
                          size="small" 
                          startIcon={<Edit />} 
                          onClick={() => handleOpenForm(member)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Delete />} 
                          onClick={() => handleDeleteMember(member)} 
                          color="error"
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
        </Card>

        {/* Form Modal - SIMPLIFIED TO 4 FIELDS */}
        <Modal open={showForm} onClose={handleCloseForm}>
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: { xs: '90%', sm: 500 }, 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: 24, 
            p: 4, 
            maxHeight: '90vh', 
            overflow: 'auto' 
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editingMember ? 'Edit' : 'Add'} Member
              </Typography>
              <Button onClick={handleCloseForm} disabled={submitting}>
                <Close />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField 
                label="First Name" 
                value={formData.first_name} 
                onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                fullWidth 
                required
                error={!!formErrors.first_name}
                helperText={formErrors.first_name}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} 
              />
              <TextField 
                label="Last Name" 
                value={formData.last_name} 
                onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                fullWidth 
                required
                error={!!formErrors.last_name}
                helperText={formErrors.last_name}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} 
              />
              <TextField 
                label="Phone Number" 
                value={formData.phone_number} 
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })} 
                fullWidth 
                required
                error={!!formErrors.phone_number}
                helperText={formErrors.phone_number || 'Format: 0752682559 or +256752682559'}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} 
              />
              <TextField 
                label="Place of Residence" 
                value={formData.place_of_residence} 
                onChange={e => setFormData({ ...formData, place_of_residence: e.target.value })} 
                fullWidth 
                required
                error={!!formErrors.place_of_residence}
                helperText={formErrors.place_of_residence}
                InputProps={{ startAdornment: <InputAdornment position="start"><Home /></InputAdornment> }} 
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button variant="outlined" onClick={handleCloseForm} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSaveMember} 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : editingMember ? <Save /> : <Add />}
              >
                {submitting ? 'Saving...' : editingMember ? 'Update' : 'Save Member'}
              </Button>
            </Box>
          </Box>
        </Modal>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={cancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2 }}>
            <Warning color="error" fontSize="large" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem', color: 'text.primary' }}>
              Are you sure you want to delete{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'error.main' }}>
                {deleteDialog.member?.full_name}
              </Box>
              ?
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ff9800' }}>
                <Typography variant="body2" color="text.secondary">
                  ⚠️ <strong>Warning:</strong> This action cannot be undone. All member data including savings 
                  history will be permanently removed from the system.
                </Typography>
              </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={cancelDelete} 
              variant="outlined"
              size="large"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="contained" 
              color="error" 
              startIcon={<Delete />}
              size="large"
              autoFocus
            >
              Delete Member
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}