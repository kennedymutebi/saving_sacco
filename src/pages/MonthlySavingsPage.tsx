'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
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
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO, isValid } from 'date-fns';
import { cyclesService } from '../services/cyclesService';
import type { SavingsCycle, CreateCycleData } from '../services/cyclesService';

export default function MonthlySavingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [months, setMonths] = useState<SavingsCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [monthName, setMonthName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Statistics
  const [stats, setStats] = useState({ active: 0, upcoming: 0, closed: 0 });

  // Fetch all cycles on component mount
  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cyclesService.getAllCycles();
      
      console.log('Fetched cycles data:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMonths(data);
        calculateStatistics(data);
      } else {
        console.error('Expected array but got:', data);
        setMonths([]);
        calculateStatistics([]);
        showSnackbar('Unexpected data format from server', 'error');
      }
      
      // Optionally try to fetch from API (if endpoint exists)
      fetchStatisticsFromAPI();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch cycles';
      console.error('Error fetching cycles:', err);
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (cycles: SavingsCycle[]) => {
    const active = cycles.filter(m => m.status === 'active').length;
    const upcoming = cycles.filter(m => m.status === 'upcoming').length;
    const closed = cycles.filter(m => m.status === 'closed').length;
    setStats({ active, upcoming, closed });
  };

  const fetchStatisticsFromAPI = async () => {
    try {
      const data = await cyclesService.getCycleStatistics();
      setStats(data);
    } catch (err: any) {
      // Silently fail - we already have stats calculated from cycles
      console.log('Statistics endpoint not available, using calculated stats');
    }
  };

  // Helper function to safely parse and format dates
  const safeFormatDate = (dateString: string | null, formatStr: string): string => {
    try {
      if (!dateString) return 'Ongoing';
      
      // Try parsing as ISO string first
      let date = parseISO(dateString);
      
      // If that doesn't work, try creating a new Date
      if (!isValid(date)) {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Invalid Date';
      }
      
      return format(date, formatStr);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      const parsed = new Date(date);
      const monthName = format(parsed, 'MMMM yyyy');
      setMonthName(monthName);
    }
  };

  const handleCreateMonth = async () => {
    if (!selectedDate) {
      showSnackbar('Please select a valid date.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const start = startOfMonth(new Date(selectedDate));

      const cycleData: CreateCycleData = {
        start_date: start.toISOString().split('T')[0],
      };

      console.log('Creating cycle with data:', cycleData);
      const result = await cyclesService.createCycle(cycleData);
      console.log('Cycle created successfully:', result);
      
      showSnackbar(`Savings month "${monthName}" created successfully!`, 'success');
      handleCloseDialog();
      
      // Refresh the list
      await fetchCycles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create cycle';
      console.error('Error creating cycle:', err);
      showSnackbar(`Failed to create cycle: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMonthName('');
    setSelectedDate('');
  };

  const handleStartMonth = async (id: string) => {
    const month = months.find(m => m.id === id);
    if (!month) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(month.start_date);

    if (isBefore(today, start)) {
      if (!window.confirm(`Start "${month.name}" early? It hasn't reached the start date yet.`)) return;
    }

    try {
      // Update status to 'active' via PATCH
      await cyclesService.partialUpdateCycle(id, { status: 'active' } as any);
      
      showSnackbar(`"${month.name}" started successfully!`, 'success');
      
      // Refresh the list
      await fetchCycles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start cycle';
      console.error('Error starting cycle:', err);
      showSnackbar(`Failed to start cycle: ${errorMessage}`, 'error');
    }
  };

  const handleEndMonth = async (id: string) => {
    const month = months.find(m => m.id === id);
    if (!month) return;

    if (!window.confirm(`Are you sure you want to end "${month.name}"?`)) return;

    try {
      // Use the close endpoint
      await cyclesService.closeCycle(id);
      
      showSnackbar(`"${month.name}" closed successfully!`, 'success');
      
      // Refresh the list
      await fetchCycles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to close cycle';
      console.error('Error closing cycle:', err);
      showSnackbar(`Failed to close cycle: ${errorMessage}`, 'error');
    }
  };

  const getStatusChip = (status: SavingsCycle['status']) => {
    switch (status) {
      case 'active':
        return <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" />;
      case 'upcoming':
        return <Chip icon={<UpcomingIcon />} label="Upcoming" color="warning" size="small" />;
      case 'closed':
        return <Chip icon={<ClosedIcon />} label="Closed" color="default" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: '#f8fafc', 
        py: { xs: 2, sm: 3, md: 4 }, 
        px: { xs: 2, sm: 3 } 
      }}
    >
      <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: { xs: 3, sm: 4 },
            gap: 2
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1e293b',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Monthly Savings Cycles
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCycles}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Create New Month
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: { xs: 3, sm: 4 } }}
        >
          <Card sx={{ flex: 1, p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#16a34a',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              {stats.active}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Active Month
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#d97706',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              {stats.upcoming}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Upcoming
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#6b7280',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              {stats.closed}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Closed
            </Typography>
          </Card>
        </Stack>

        {/* Table */}
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: 2, 
            overflow: 'hidden' 
          }}
        >
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#475569',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Month
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#475569',
                      display: { xs: 'none', sm: 'table-cell' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Period
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#475569',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#475569',
                      display: { xs: 'none', md: 'table-cell' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Created
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#475569',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {months.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={5} 
                      align="center" 
                      sx={{ py: { xs: 4, sm: 6 }, color: '#64748b' }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        No savings months yet
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        Click "Create New Month" to get started
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  months.map((month) => (
                    <TableRow key={month.id} hover>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.813rem', sm: '0.938rem', md: '1rem' }
                          }}
                        >
                          {month.name}
                        </Typography>
                        {/* Show period on mobile under the name */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: { xs: 'block', sm: 'none' },
                            fontSize: '0.75rem',
                            mt: 0.5
                          }}
                        >
                          {safeFormatDate(month.start_date, 'MMM d')} – {safeFormatDate(month.end_date, 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { sm: '0.813rem', md: '0.875rem' } }}
                        >
                          {safeFormatDate(month.start_date, 'MMM d')} – {safeFormatDate(month.end_date, 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(month.status)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {safeFormatDate(month.created_at, 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack 
                          direction="row" 
                          spacing={{ xs: 0.5, sm: 1 }} 
                          justifyContent="center"
                        >
                          {month.status === 'upcoming' && (
                            <Tooltip title="Start Month">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStartMonth(month.id)}
                              >
                                <StartIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {month.status === 'active' && (
                            <Tooltip title="End Month">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEndMonth(month.id)}
                              >
                                <EndIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {month.status === 'closed' && (
                            <Typography 
                              variant="caption" 
                              color="text.disabled"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                              —
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Create Month Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Create New Savings Month
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={submitting}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Select Month Start Date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
              disabled={submitting}
            />
            <TextField
              label="Month Name (Auto-filled)"
              value={monthName}
              fullWidth
              disabled
              helperText="Automatically generated from selected date"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateMonth}
            disabled={!monthName || submitting}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Month'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}