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
import { Search, Person, Visibility, TrendingUp, ArrowBack, Delete } from '@mui/icons-material';
import { viewSavingsService } from '../services/viewSavingsService';
import addSavingsService from '../services/addSavingsService';

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
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [savingsToDelete, setSavingsToDelete] = useState<SavingsEntry | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await viewSavingsService.getMembersWithSavings();
      
      console.log('API Response:', data);
      
      let membersArray: Member[] = [];
      if (Array.isArray(data)) {
        membersArray = data;
      } else if (data && typeof data === 'object') {
        const dataObj = data as any;
        membersArray = dataObj.members || dataObj.results || dataObj.data || [];
      }
      
      membersArray = membersArray.map(member => ({
        ...member,
        total_savings: member.total_savings ?? 0
      }));
      
      setMembers(membersArray);
      setFilteredMembers(membersArray);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.membership_id.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  };

  const handleViewSavings = async (member: Member): Promise<void> => {
    try {
      setDetailLoading(true);
      setError(null);
      setSuccess(null);
      setSelectedMember(member);
      
      const detailData: MemberSavingsDetail = await viewSavingsService.getMemberSavingsDetail(member.id);
      
      console.log('Detail data received:', detailData);
      
      const entries: SavingsEntry[] = detailData.current_month_entries || detailData.entries || detailData.savings || [];
      const total: number = Number(detailData.current_month_total ?? detailData.total ?? detailData.total_savings ?? 0);
      const month: string = detailData.month || detailData.cycle_name || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      setCurrentMonthEntries(entries);
      setCurrentMonthTotal(total);
      setCurrentMonth(month);
      setShowSavingsView(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load member savings details');
      console.error('Error fetching member savings:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (entry: SavingsEntry): void => {
    setSavingsToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!savingsToDelete || !selectedMember) return;

    try {
      setDeleting(true);
      setError(null);
      
      // Delete the savings entry
      await addSavingsService.deleteSavingsEntry(savingsToDelete.id);
      
      // Remove the deleted entry from the current list
      const updatedEntries = currentMonthEntries.filter(entry => entry.id !== savingsToDelete.id);
      setCurrentMonthEntries(updatedEntries);
      
      // Recalculate total
      const newTotal = updatedEntries.reduce((sum, entry) => {
        const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      setCurrentMonthTotal(newTotal);
      
      // Update the member's total savings in the list
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id 
          ? { ...m, total_savings: newTotal }
          : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      
      // Update selected member
      setSelectedMember({ ...selectedMember, total_savings: newTotal });
      
      setSuccess(`Savings entry of ${formatCurrency(savingsToDelete.amount)} deleted successfully!`);
      setDeleteDialogOpen(false);
      setSavingsToDelete(null);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete savings entry');
      console.error('Error deleting savings:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteDialogOpen(false);
    setSavingsToDelete(null);
  };

  const handleBackToList = (): void => {
    setShowSavingsView(false);
    setSelectedMember(null);
    setCurrentMonthEntries([]);
    setCurrentMonthTotal(0);
    setCurrentMonth('');
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: any): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : 
                      typeof amount === 'number' ? amount : 0;
    const validAmount = isNaN(numAmount) ? 0 : numAmount;
    return `UGX ${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            Loading members...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        width: '100%',
      }}
    >
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

      {/* Success Alert */}
      {success && (
        <Alert 
          severity="success" 
          onClose={() => setSuccess(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {success}
        </Alert>
      )}

      {!showSavingsView ? (
        <>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <TrendingUp sx={{ fontSize: 40, color: '#2563eb' }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                View Member Savings
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem' }}>
              Search and view detailed savings information for all members
            </Typography>
          </Box>

          {/* Search Bar */}
          <Card
            sx={{
              borderRadius: 4,
              p: 4,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              placeholder="Search by name or membership ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
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
          <Card
            sx={{
              borderRadius: 4,
              p: 4,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
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

            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
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
                            {formatCurrency(member?.total_savings ?? 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            startIcon={<Visibility />}
                            onClick={() => handleViewSavings(member)}
                            disabled={detailLoading}
                            sx={{
                              bgcolor: '#2563eb',
                              '&:hover': { bgcolor: '#1d4ed8' },
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {detailLoading ? <CircularProgress size={20} /> : 'View'}
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
      ) : selectedMember && (
        <>
          {/* Savings Detail View */}
          <Box>
            {/* Back Button and Header */}
            <Box sx={{ mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBackToList}
                sx={{
                  mb: 3,
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#2563eb',
                    color: '#fff',
                    borderColor: '#2563eb',
                  },
                }}
              >
                Back to Members
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: '#2563eb',
                    width: 60,
                    height: 60,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {selectedMember.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {selectedMember.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    {selectedMember.membership_id} • Total: {formatCurrency(selectedMember.total_savings)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Total Savings Card */}
            <Card
              sx={{
                borderRadius: 4,
                p: 4,
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.15)',
                border: '3px solid #2563eb',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}
                  >
                    Total Savings This Month
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 700, color: '#2563eb' }}
                  >
                    {formatCurrency(selectedMember.total_savings)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={`${currentMonthEntries.length} ${
                      currentMonthEntries.length === 1 ? 'Entry' : 'Entries'
                    }`}
                    sx={{
                      bgcolor: '#dcfce7',
                      color: '#166534',
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 2,
                      py: 3,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                    {currentMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Savings Entries Table */}
            <Card
              sx={{
                borderRadius: 4,
                p: 4,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}
              >
                Savings Entries
              </Typography>

              {currentMonthEntries.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: '2px dashed #e2e8f0',
                  }}
                >
                  <TrendingUp sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                    No savings entries for this month
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    This member hasn't made any savings deposits in{' '}
                    {currentMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          Date
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          Amount
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          Comment
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentMonthEntries.map((entry, index) => (
                        <TableRow
                          key={entry.id}
                          sx={{
                            bgcolor: index % 2 === 0 ? '#fafafa' : '#fff',
                            '&:hover': { bgcolor: '#f1f5f9' },
                          }}
                        >
                          <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                              {formatCurrency(entry.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: '#64748b' }}>
                            {entry.comment || 'No comment'}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Delete this savings entry">
                              <IconButton
                                onClick={() => handleDeleteClick(entry)}
                                sx={{
                                  color: '#dc2626',
                                  '&:hover': {
                                    bgcolor: '#fee2e2',
                                  },
                                }}
                              >
                                <Delete />
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
          </Box>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1e293b' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this savings entry?
            {savingsToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Amount:</strong> {formatCurrency(savingsToDelete.amount)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                  <strong>Date:</strong> {formatDate(savingsToDelete.date)}
                </Typography>
                {savingsToDelete.comment && (
                  <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>
                    <strong>Comment:</strong> {savingsToDelete.comment}
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="body2" sx={{ mt: 2, color: '#dc2626', fontWeight: 500 }}>
              This action cannot be undone.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}