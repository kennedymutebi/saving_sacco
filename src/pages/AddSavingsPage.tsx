import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Modal, Avatar, CircularProgress, Alert
} from '@mui/material';
import { Search, Add, Person, Close, Save, TrendingUp } from '@mui/icons-material';
import { addSavingsService } from '../services/addSavingsService';
import type { Member, SavingsEntry, SavingsCycle } from '../services/addSavingsService';

export default function AddSavingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [activeCycle, setActiveCycle] = useState<SavingsCycle | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingsLoading, setSavingsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    comment: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load members and active cycle in parallel
      const [membersData, cycleData] = await Promise.all([
        addSavingsService.getMembers(),
        addSavingsService.getActiveCycle(),
      ]);
      
      setMembers(membersData);
      setActiveCycle(cycleData);
      
      if (!cycleData) {
        setError('No active savings cycle found. Please create an active cycle first.');
      }
      
      // Load recent savings
      await loadRecentSavings();
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSavings = async () => {
    try {
      setSavingsLoading(true);
      const recentSavings = await addSavingsService.getRecentSavings(10);
      setSavings(recentSavings);
    } catch (err: any) {
      console.error('Error loading recent savings:', err);
    } finally {
      setSavingsLoading(false);
    }
  };

  // Filtered members
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.membership_id.toLowerCase().includes(search.toLowerCase())
  );

  // Open form with today's date as default
  const handleOpenForm = (member: Member) => {
    if (!activeCycle) {
      setError('No active savings cycle found. Please create an active cycle first.');
      return;
    }
    
    // Set today's date as default
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    setSelectedMember(member);
    setFormData({
      date: todayStr,
      amount: '',
      comment: ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedMember(null);
    setFormData({ date: '', amount: '', comment: '' });
    setError(null);
  };

  // Save savings with minimal validation
  const handleSaveSavings = async () => {
    if (!formData.date || !formData.amount) {
      setError('Please fill in date and amount.');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedMember || !activeCycle) {
      setError('Missing member or active cycle information.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      const savingsData = {
        member: Number(selectedMember.id),
        cycle: Number(activeCycle.id),
        amount: Number(amount),
        date: formData.date,
        comment: formData.comment || ''
      };

      const newSaving = await addSavingsService.createSavingsEntry(savingsData);
      
      // Add member name for display
      const savingWithName = {
        ...newSaving,
        member_name: selectedMember.name
      };
      
      setSavings((prev) => [savingWithName, ...prev.slice(0, 9)]);
      setSuccessMessage(`Savings of UGX ${amount.toFixed(2)} added successfully for ${selectedMember.name}!`);
      
      // Reload members to update total savings
      const updatedMembers = await addSavingsService.getMembers();
      setMembers(updatedMembers);
      
      handleCloseForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save savings entry');
      console.error('Error saving savings:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const validAmount = numAmount ?? 0;
    return `UGX ${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#2563eb' }} />
          <Typography variant="h6" sx={{ mt: 2, color: '#475569' }}>
            Loading data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', width: '100%' }}>
      <Box>
        {/* Success Message */}
        {successMessage && (
          <Alert 
            severity="success" 
            onClose={() => setSuccessMessage(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp sx={{ fontSize: 40, color: '#2563eb' }} />
            <Box>
              <Typography variant="h4" fontWeight={700} color="#1e293b">
                ADD MEMBER SAVINGS
              </Typography>
              {activeCycle && (
                <Chip
                  label={`Active Cycle: ${activeCycle.name}`}
                  sx={{ mt: 1, bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Search Bar */}
        <Card sx={{ borderRadius: 4, p: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by name or membership ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 2 },
              },
            }}
          />
        </Card>

        {/* Members Table */}
        <Card sx={{ borderRadius: 4, p: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Person sx={{ fontSize: 28, color: '#2563eb' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              All Members
            </Typography>
            <Chip
              label={`${filteredMembers.length} ${filteredMembers.length === 1 ? 'member' : 'members'}`}
              sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    Member
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    Membership ID
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    Total Savings
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <Person sx={{ fontSize: 48, color: '#c0c0c0', mb: 1 }} />
                      <Typography variant="h6">No members found</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Try adjusting your search criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member, index) => (
                    <TableRow
                      key={member.id}
                      sx={{
                        bgcolor: index % 2 === 0 ? '#fafafa' : '#fff',
                        '&:hover': { bgcolor: '#f1f5f9' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40, fontWeight: 600 }}>
                            {member.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {member.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.membership_id}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.05rem' }}>
                          {formatCurrency(member.total_savings)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleOpenForm(member)}
                          disabled={!activeCycle}
                          sx={{
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#1d4ed8' },
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Add Savings
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Recent Savings */}
        {savings.length > 0 && (
          <Card sx={{ borderRadius: 4, p: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Recent Savings Added
              </Typography>
              {savingsLoading && <CircularProgress size={24} />}
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      Member
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      Date
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      Comment
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savings.slice(0, 10).map((saving, index) => (
                    <TableRow
                      key={saving.id}
                      sx={{
                        bgcolor: index % 2 === 0 ? '#fafafa' : '#fff',
                        '&:hover': { bgcolor: '#f1f5f9' },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {saving.member_name || `Member #${saving.member}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#475569', fontWeight: 500 }}>
                          {formatDate(saving.date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.05rem' }}>
                          {formatCurrency(saving.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#64748b' }}>
                          {saving.comment || 'No comment'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Add Savings Form Modal - Simple with Date Picker */}
        <Modal 
          open={showForm} 
          onClose={handleCloseForm}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 4,
              p: 4,
              width: { xs: '90%', sm: 600 },
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                {selectedMember && (
                  <>
                    <Avatar sx={{ bgcolor: '#2563eb', width: 48, height: 48, fontWeight: 600 }}>
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Add Savings for {selectedMember.name}
                      </Typography>
                      <Typography variant="body2" color="#64748b">
                        {selectedMember.membership_id}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
              <Button onClick={handleCloseForm}>
                <Close />
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                fullWidth
                required
                InputLabelProps={{ 
                  shrink: true,
                }}
                helperText="Select the date for this savings entry"
              />

              <TextField
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">UGX</InputAdornment>,
                }}
                inputProps={{ min: 0, step: '0.01' }}
              />
              
              <TextField
                label="Comment (Optional)"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                placeholder="Add any notes about this savings entry..."
              />
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
              <Button variant="outlined" onClick={handleCloseForm} disabled={submitLoading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSaveSavings}
                disabled={submitLoading}
                sx={{
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {submitLoading ? 'Saving...' : 'Save Savings'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}