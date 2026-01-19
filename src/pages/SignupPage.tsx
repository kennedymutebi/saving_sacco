// SignupPage.tsx
import React, { useState } from 'react';
// Grid import removed – we don’t need it anymore

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
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/authService';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    placeOfResidence: '',
  });
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.password2) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!terms) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      await authService.signup(
        formData.email,
        formData.username || formData.email,
        formData.password,
        formData.password2,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.placeOfResidence
      );

      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
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
        padding: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: '1100px',
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: 650,
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Left Side - Branding */}
        <Box
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: 8,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ... branding content unchanged ... */}
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

          <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 450 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
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
                style={{ width: 80, height: 80, borderRadius: '50%' }} 
              />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, letterSpacing: '-0.5px' }}>
              Harvest Haven
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.95, fontWeight: 400 }}>
              Saving Association
            </Typography>
            <Box sx={{ width: 60, height: 3, background: 'rgba(255,255,255,0.4)', margin: '0 auto 24px', borderRadius: 2 }} />
            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.7, fontSize: '1.05rem' }}>
              Join thousands of members building financial security. Start your journey to prosperity with secure savings and trusted financial services.
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Form */}
        <Box
          sx={{
            flex: 1,
            padding: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#fff',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ maxWidth: 420, mx: 'auto', width: '100%' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
              Become a Member
            </Typography>
            <Typography variant="body2" sx={{ mb: 3.5, color: '#64748b', fontSize: '0.95rem' }}>
              Create your account to start saving and investing with us
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #fecaca',
                  '& .MuiAlert-icon': { color: '#dc2626' }
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Replaced Grid with Box + flex – exact same spacing & responsiveness */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 0 }}>
                <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                    First Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    disabled={loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                    Last Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    disabled={loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Everything below is 100% untouched */}
              <Typography variant="body2" sx={{ mt: 2.5, mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="your.email@example.com"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                  },
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                Phone Number
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="+256752682559"
                value={formData.phoneNumber}
                onChange={handleChange('phoneNumber')}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                  },
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                Place of Residence
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Kampala"
                value={formData.placeOfResidence}
                onChange={handleChange('placeOfResidence')}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                  },
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange('password')}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
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
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                  },
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={formData.password2}
                onChange={handleChange('password2')}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        size="small"
                        sx={{ color: '#94a3b8' }}
                      >
                        {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    size="small"
                    disabled={loading}
                    sx={{
                      color: '#cbd5e1',
                      '&.Mui-checked': { color: '#16a34a' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    I agree to the{' '}
                    <Link href="#" sx={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="#" sx={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mb: 3,
                  py: 1.75,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#16a34a',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                  '&:hover': {
                    bgcolor: '#15803d',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': { 
                    bgcolor: '#cbd5e1',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center', pt: 2.5, borderTop: '1px solid #e2e8f0' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/"
                    underline="none"
                    sx={{
                      color: '#16a34a',
                      fontWeight: 600,
                      '&:hover': { color: '#15803d', textDecoration: 'underline' },
                    }}
                  >
                    Sign in here
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