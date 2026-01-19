// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Link,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call the login API
      await authService.login(email, password);

      // Store remember preference
      if (remember) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

      // Navigate to OTP verification page
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: { xs: '100%', sm: '500px', md: '1100px' },
          borderRadius: { xs: 2, md: 3 },
          overflow: 'hidden',
          minHeight: { xs: 'auto', md: 600 },
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Left Side - Branding (Desktop only) */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: { md: 6, lg: 8 },
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />

          <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 450 }}>
            <Box
              sx={{
                width: { md: 70, lg: 80 },
                height: { md: 70, lg: 80 },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <img 
                src="/profit-rounded-lines-icon.jpg" 
                alt="Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%' 
                }} 
              />
            </Box>

            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 2, 
                letterSpacing: '-0.5px',
                fontSize: { md: '2rem', lg: '3rem' }
              }}
            >
              Harvest Haven
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                opacity: 0.95, 
                fontWeight: 400,
                fontSize: { md: '1.25rem', lg: '1.5rem' }
              }}
            >
              Saving Association
            </Typography>
            <Box
              sx={{
                width: 60,
                height: 3,
                background: 'rgba(255, 255, 255, 0.4)',
                margin: '0 auto 24px',
                borderRadius: 2,
              }}
            />
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9, 
                lineHeight: 1.7, 
                fontSize: { md: '0.95rem', lg: '1.05rem' }
              }}
            >
              Empowering communities through smart savings and financial growth. Your trusted partner in building a secure financial future.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Form */}
        <Box
          sx={{
            flex: 1,
            padding: { xs: 3, sm: 4, md: 6, lg: 8 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#fff',
          }}
        >
          <Box sx={{ maxWidth: 420, mx: 'auto', width: '100%' }}>
            {/* Mobile Logo/Header - Only shows on mobile */}
            <Box 
              sx={{ 
                display: { xs: 'flex', md: 'none' }, 
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
                pb: 3,
                borderBottom: '2px solid #f1f5f9'
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                }}
              >
                <img 
                  src="/profit-rounded-lines-icon.jpg" 
                  alt="Logo" 
                  style={{ width: 60, height: 60, borderRadius: '50%' }} 
                />
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#16a34a',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Harvest Haven
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.875rem',
                  mt: 0.5
                }}
              >
                Saving Association
              </Typography>
            </Box>

            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                mb: 1, 
                color: '#0f172a',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
              }}
            >
              Member Sign In
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: { xs: 3, md: 4 }, 
                color: '#64748b', 
                fontSize: { xs: '0.875rem', md: '0.95rem' }
              }}
            >
              Access your account to manage your savings and investments
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #fecaca',
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  '& .MuiAlert-icon': { color: '#dc2626' }
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1.5, 
                  fontWeight: 600, 
                  color: '#334155', 
                  fontSize: { xs: '0.813rem', sm: '0.875rem' }
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#94a3b8', fontSize: { xs: 18, sm: 20 } }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: { xs: 2.5, md: 3 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#16a34a' },
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#16a34a', borderWidth: 2 },
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: { xs: '12px 14px', sm: '16.5px 14px' },
                  },
                }}
              />

              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1.5, 
                  fontWeight: 600, 
                  color: '#334155', 
                  fontSize: { xs: '0.813rem', sm: '0.875rem' }
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94a3b8', fontSize: { xs: 18, sm: 20 } }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#94a3b8' }}
                      >
                        {showPassword ? 
                          <VisibilityOff fontSize="small" /> : 
                          <Visibility fontSize="small" />
                        }
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#16a34a' },
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: '#16a34a', borderWidth: 2 },
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: { xs: '12px 14px', sm: '16.5px 14px' },
                  },
                }}
              />

              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', sm: 'center' }, 
                  mb: { xs: 3, md: 4 },
                  gap: { xs: 2, sm: 0 }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      size="small"
                      disabled={loading}
                      sx={{
                        color: '#cbd5e1',
                        '&.Mui-checked': { color: '#16a34a' },
                      }}
                    />
                  }
                  label={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b', 
                        fontSize: { xs: '0.813rem', sm: '0.875rem' }
                      }}
                    >
                      Keep me signed in
                    </Typography>
                  }
                />
                <Link
                  component={RouterLink}
                  to="/reset-password"
                  underline="none"
                  sx={{
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    color: '#16a34a',
                    fontWeight: 600,
                    '&:hover': { color: '#15803d' },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mb: 3,
                  py: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.938rem', sm: '1rem' },
                  fontWeight: 600,
                  bgcolor: '#16a34a',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                  '&:hover': {
                    bgcolor: '#15803d',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': { 
                    bgcolor: '#cbd5e1',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Account'}
              </Button>

              <Box sx={{ textAlign: 'center', pt: 3, borderTop: '1px solid #e2e8f0' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b', 
                    fontSize: { xs: '0.813rem', sm: '0.9rem' }
                  }}
                >
                  New to Harvest Haven?{' '}
                  <Link
                    component={RouterLink}
                    to="/signup"
                    underline="none"
                    sx={{
                      color: '#16a34a',
                      fontWeight: 600,
                      '&:hover': { color: '#15803d', textDecoration: 'underline' },
                    }}
                  >
                    Create an account
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}