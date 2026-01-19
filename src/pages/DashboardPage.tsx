import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardStats, SavingsTrend,
  WeeklyDeposit, RecentTransaction, TopSaver
} from '../types/dashboardtypes';

// MUI Components
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const SavingsDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [savingsTrendData, setSavingsTrendData] = useState<SavingsTrend[]>([]);
  const [weeklyDeposits, setWeeklyDeposits] = useState<WeeklyDeposit[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topSavers, setTopSavers] = useState<TopSaver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboardService.isAuthenticated()) {
      setError('Please login to view the dashboard');
      setLoading(false);
      return;
    }

    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getAllDashboardData();

      setStats(data.stats);
      setSavingsTrendData(data.trends);
      setWeeklyDeposits(data.weeklyDeposits);
      setRecentTransactions(data.transactions);
      setTopSavers(data.topSavers);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // --------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        height="70vh"
        justifyContent="center"
        alignItems="center"
        px={2}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography mt={3} color="#4a5568" fontSize={{ xs: '16px', sm: '20px' }} fontWeight={600}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // --------------------------------------------
  // ERROR SCREEN
  // --------------------------------------------
  if (error) {
    return (
      <Box p={{ xs: 2, sm: 5 }} maxWidth="800px" mx="auto">
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography fontWeight={700} mb={1}>Error</Typography>
          {error}
        </Alert>

        <Typography color="#4a5568">
          Please make sure you're logged in and the API server is running.
        </Typography>

        <Button
          onClick={fetchAllData}
          sx={{
            mt: 2,
            bgcolor: '#667eea',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: '8px',
            fontWeight: 600,
            '&:hover': { bgcolor: '#5a67d8' }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // --------------------------------------------
  // NO DATA SCREEN
  // --------------------------------------------
  if (!stats) {
    return (
      <Box p={{ xs: 2, sm: 5 }}>
        <Alert severity="warning">
          No dashboard data available
        </Alert>
      </Box>
    );
  }

  // --------------------------------------------
  // MAIN DASHBOARD
  // --------------------------------------------
  return (
    <Box
      p={{ xs: 2, sm: 3, md: 4 }}
      maxWidth="1600px"
      mx="auto"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      {/* ---------------- HEADER ---------------- */}
      <Box mb={{ xs: 3, sm: 5 }}>
        <Typography
          fontWeight={800}
          fontSize={{ xs: '1.75rem', sm: '2.5rem' }}
          color="#1a202c"
          mb={1}
        >
          💰 Savings Dashboard
        </Typography>

        <Typography 
          color="#4a5568" 
          fontSize={{ xs: '0.9rem', sm: '1.1rem' }} 
          fontWeight={500} 
          mt={2}
        >
          {stats.current_cycle
            ? `Current Cycle: ${stats.current_cycle.name}`
            : 'Manage your savings platform and track financial growth'
          }
        </Typography>
      </Box>

      {/* ---------------- STATS CARDS ---------------- */}
      <Box
        display="grid"
        gridTemplateColumns={{ 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }}
        gap={{ xs: '16px', sm: '24px' }}
        mb={{ xs: '24px', sm: '40px' }}
      >

        {/* TOTAL SAVINGS CARD */}
        <Card
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: { xs: '16px', sm: '20px' },
            boxShadow: '0 10px 30px rgba(17,153,142,0.3)'
          }}
        >
          <Typography 
            fontSize={{ xs: '16px', sm: '18px' }} 
            fontWeight={500} 
            color="#333" 
            mb={1}
          >
            Total Savings
          </Typography>

          <Typography 
            fontWeight={800} 
            fontSize={{ xs: '22px', sm: '28px' }} 
            color="#333"
          >
            {formatCurrency(stats.total_savings)}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Typography
              fontSize={{ xs: '13px', sm: '14px' }}
              fontWeight={600}
              color={stats.growth_percentage >= 0 ? '#10b981' : '#ef4444'}
            >
              {stats.growth_percentage >= 0 ? '↑' : '↓'} {Math.abs(stats.growth_percentage)}% growth
            </Typography>
          </Box>
        </Card>

        {/* TOTAL PROFIT */}
        <Card
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: { xs: '16px', sm: '20px' },
            boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
          }}
        >
          <Typography 
            fontSize={{ xs: '16px', sm: '18px' }} 
            fontWeight={500} 
            color="#333" 
            mb={1}
          >
            Total Profit
          </Typography>

          <Typography 
            fontWeight={800} 
            fontSize={{ xs: '22px', sm: '28px' }} 
            color="#333"
          >
            {formatCurrency(stats.total_profit)}
          </Typography>

          <Typography 
            mt={1} 
            fontWeight={600} 
            color="#333"
            fontSize={{ xs: '13px', sm: '14px' }}
          >
            {stats.profit_margin}% profit margin
          </Typography>
        </Card>

        {/* ACTIVE MEMBERS */}
        <Card
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: { xs: '16px', sm: '20px' },
            boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
            gridColumn: { xs: '1', sm: 'span 2', md: 'auto' }
          }}
        >
          <Typography 
            fontSize={{ xs: '16px', sm: '18px' }} 
            fontWeight={500} 
            color="#333" 
            mb={1}
          >
            Active Members
          </Typography>

          <Typography 
            fontWeight={800} 
            fontSize={{ xs: '22px', sm: '28px' }} 
            color="#333"
          >
            {stats.active_members}
          </Typography>

          <Typography 
            mt={1} 
            fontWeight={600} 
            color="#333"
            fontSize={{ xs: '13px', sm: '14px' }}
          >
            +{stats.new_members_this_month} new this month
          </Typography>
        </Card>

      </Box>

      {/* ---------------- CHARTS SECTION ---------------- */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={{ xs: '16px', sm: '24px' }}
        mb={{ xs: '24px', sm: '32px' }}
      >

        {/* SAVINGS & PROFIT TREND */}
        <Paper 
          sx={{ 
            p: { xs: 2.5, sm: 4 }, 
            borderRadius: { xs: '16px', sm: '24px' }, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
          }}
        >
          <Typography 
            fontWeight={700} 
            fontSize={{ xs: '1.1rem', sm: '1.3rem' }} 
            color="#1a202c" 
            mb={3}
          >
            📈 Savings & Profit Trend
          </Typography>

          {savingsTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={savingsTrendData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                  </linearGradient>

                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5576c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f5576c" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                <XAxis 
                  dataKey="month" 
                  stroke="#999" 
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#999" 
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />

                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="#667eea"
                  strokeWidth={3}
                  fill="url(#colorSavings)"
                  fillOpacity={1}
                  name="Total Savings"
                />

                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#f5576c"
                  strokeWidth={3}
                  fill="url(#colorProfit)"
                  fillOpacity={1}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="#999" textAlign="center" py={6}>
              No trend data available
            </Typography>
          )}
        </Paper>

        {/* WEEKLY DEPOSITS */}
        <Paper 
          sx={{ 
            p: { xs: 2.5, sm: 4 }, 
            borderRadius: { xs: '16px', sm: '24px' }, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
          }}
        >
          <Typography 
            fontWeight={700} 
            fontSize={{ xs: '1.1rem', sm: '1.3rem' }} 
            color="#1a202c" 
            mb={3}
          >
            📊 Weekly Deposit Activity
          </Typography>

          {weeklyDeposits.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeklyDeposits}>
                <XAxis 
                  dataKey="day" 
                  stroke="#999" 
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#999" 
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />

                <Bar dataKey="amount" fill="#11998e" radius={[12, 12, 0, 0]} name="Deposits" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="#999" textAlign="center" py={6}>
              No deposit data available
            </Typography>
          )}
        </Paper>

      </Box>

      {/* ---------------- TABLES SECTION ---------------- */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={{ xs: '16px', sm: '24px' }}
        mb={{ xs: '24px', sm: '32px' }}
      >

        {/* RECENT TRANSACTIONS */}
        <Paper 
          sx={{ 
            p: { xs: 2.5, sm: 4 }, 
            borderRadius: { xs: '16px', sm: '24px' }, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Typography 
            fontWeight={700} 
            fontSize={{ xs: '1.1rem', sm: '1.3rem' }} 
            color="#1a202c" 
            mb={3}
          >
            🔄 Recent Transactions
          </Typography>

          {recentTransactions.length > 0 ? (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Member
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Amount
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}
                    >
                      Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((transaction, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {transaction.member.first_name} {transaction.member.last_name}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#10b981',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        {formatDate(transaction.date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="#999" textAlign="center" py={6}>
              No recent transactions
            </Typography>
          )}
        </Paper>

        {/* TOP SAVERS */}
        <Paper 
          sx={{ 
            p: { xs: 2.5, sm: 4 }, 
            borderRadius: { xs: '16px', sm: '24px' }, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Typography 
            fontWeight={700} 
            fontSize={{ xs: '1.1rem', sm: '1.3rem' }} 
            color="#1a202c" 
            mb={3}
          >
            🏆 Top Savers
          </Typography>

          {topSavers.length > 0 ? (
            <Box>
              {topSavers.map((saver, index) => (
                <Box key={index}>
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    py={2}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: { xs: '32px', sm: '40px' },
                          height: { xs: '32px', sm: '40px' },
                          borderRadius: '50%',
                          bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          color: 'white'
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box>
                        <Typography 
                          fontWeight={600} 
                          fontSize={{ xs: '0.9rem', sm: '1rem' }}
                          color="#1a202c"
                        >
                          {saver.name}
                        </Typography>
                        <Typography 
                          fontSize={{ xs: '0.75rem', sm: '0.85rem' }} 
                          color="#666"
                        >
                          Rank #{saver.rank}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography 
                      fontWeight={700} 
                      fontSize={{ xs: '0.9rem', sm: '1.1rem' }}
                      color="#667eea"
                    >
                      {formatCurrency(saver.total_savings)}
                    </Typography>
                  </Box>
                  {index < topSavers.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="#999" textAlign="center" py={6}>
              No top savers data
            </Typography>
          )}
        </Paper>

      </Box>
    </Box>
  );
};

export default SavingsDashboard;