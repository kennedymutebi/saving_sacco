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
import { tokens, avatarColor } from '../config/theme';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.login(email, password);
      if (remember) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Shared field sx
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.color.surfaceAlt,
      fontFamily: tokens.font.base,
      fontSize: '0.9rem',
      transition: 'all 0.2s',
      '& fieldset': { borderColor: tokens.color.border },
      '&:hover fieldset': { borderColor: tokens.color.primaryLight },
      '&.Mui-focused': {
        backgroundColor: tokens.color.surface,
        '& fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: { xs: '12px 14px', sm: '14px 14px' },
      color: tokens.color.textDark,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.color.bg,
        padding: { xs: 2, sm: 3 },
        fontFamily: tokens.font.base,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: { xs: '100%', sm: '480px', md: '1060px' },
          borderRadius: tokens.radius.xxl,
          overflow: 'hidden',
          minHeight: { xs: 'auto', md: 580 },
          border: `1px solid ${tokens.color.border}`,
          boxShadow: tokens.shadow.elevated,
        }}
      >
        {/* ── Left — Branding (desktop only) ──────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
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
          {/* Decorative blobs — same style as dashboard StatCard */}
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', top: '55%', right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
            {/* Logo circle */}
            <Box
              sx={{
                width: { md: 72, lg: 84 },
                height: { md: 72, lg: 84 },
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <img
                src="/profit-rounded-lines-icon.jpg"
                alt="Harvest Haven Logo"
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
              />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { md: '2rem', lg: '2.6rem' },
                lineHeight: 1.1,
                mb: 1,
                fontFamily: tokens.font.base,
                letterSpacing: '-0.5px',
              }}
            >
              Harvest Haven
            </Typography>
            <Typography
              sx={{
                mb: 3,
                opacity: 0.85,
                fontWeight: 400,
                fontSize: { md: '1rem', lg: '1.15rem' },
              }}
            >
              Saving Association
            </Typography>

            {/* Divider accent */}
            <Box sx={{ width: 52, height: 3, background: 'rgba(255,255,255,0.35)', margin: '0 auto 24px', borderRadius: 2 }} />

            <Typography
              sx={{
                opacity: 0.88,
                lineHeight: 1.75,
                fontSize: { md: '0.9rem', lg: '1rem' },
              }}
            >
              Empowering communities through smart savings and financial growth. Your trusted partner in building a secure future.
            </Typography>

            {/* Stats row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                mt: 4,
                pt: 3,
                borderTop: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {[
                { value: '2,400+', label: 'Members' },
                { value: '98%', label: 'Retention' },
                { value: '5 yrs', label: 'Trusted' },
              ].map(({ value, label }) => (
                <Box key={label} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', opacity: 0.75, mt: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Right — Form ─────────────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            padding: { xs: 3, sm: 4, md: 5, lg: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: tokens.color.surface,
          }}
        >
          <Box sx={{ maxWidth: 400, mx: 'auto', width: '100%' }}>

            {/* Mobile header */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${tokens.color.border}`,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  boxShadow: tokens.shadow.stat,
                }}
              >
                <img src="/profit-rounded-lines-icon.jpg" alt="Logo" style={{ width: 56, height: 56, borderRadius: '50%' }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1.2rem', fontFamily: tokens.font.base }}>
                Harvest Haven
              </Typography>
              <Typography sx={{ color: tokens.color.textMuted, fontSize: '0.78rem', mt: 0.25 }}>
                Saving Association
              </Typography>
            </Box>

            {/* Heading */}
            <Typography
              sx={{
                fontWeight: 800,
                mb: 0.75,
                color: tokens.color.textDark,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontFamily: tokens.font.base,
                lineHeight: 1.2,
              }}
            >
              Member Sign In
            </Typography>
            <Typography sx={{ mb: { xs: 3, md: 3.5 }, color: tokens.color.textMid, fontSize: '0.88rem', lineHeight: 1.6 }}>
              Access your account to manage your savings
            </Typography>

            {/* Error */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: tokens.radius.md,
                  background: '#FDECEA',
                  border: `1px solid ${tokens.color.danger}22`,
                  color: tokens.color.danger,
                  fontSize: '0.82rem',
                  '& .MuiAlert-icon': { color: tokens.color.danger },
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>

              {/* Email */}
              <Typography sx={{ mb: 1, fontWeight: 600, color: tokens.color.textDark, fontSize: '0.82rem', letterSpacing: 0.2 }}>
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
                      <EmailIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Password */}
              <Typography sx={{ mb: 1, fontWeight: 600, color: tokens.color.textDark, fontSize: '0.82rem', letterSpacing: 0.2 }}>
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
                      <LockIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: tokens.color.textMuted, '&:hover': { color: tokens.color.primary } }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Remember / Forgot */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 3.5,
                  gap: { xs: 1.5, sm: 0 },
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
                        color: tokens.color.border,
                        '&.Mui-checked': { color: tokens.color.primary },
                        p: 0.5,
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: tokens.color.textMid, fontSize: '0.82rem' }}>
                      Keep me signed in
                    </Typography>
                  }
                />
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  underline="none"
                  sx={{
                    fontSize: '0.82rem',
                    color: tokens.color.primary,
                    fontWeight: 600,
                    '&:hover': { color: tokens.color.secondary },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Submit */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mb: 3,
                  py: 1.6,
                  borderRadius: tokens.radius.md,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  bgcolor: tokens.color.primary,
                  boxShadow: tokens.shadow.stat,
                  fontFamily: tokens.font.base,
                  letterSpacing: 0.2,
                  '&:hover': {
                    bgcolor: tokens.color.secondary,
                    boxShadow: tokens.shadow.elevated,
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0)' },
                  '&:disabled': { bgcolor: tokens.color.border, boxShadow: 'none' },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Account'}
              </Button>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', pt: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
                <Typography sx={{ color: tokens.color.textMid, fontSize: '0.85rem' }}>
                  New to Harvest Haven?{' '}
                  <Link
                    component={RouterLink}
                    to="/signup"
                    underline="none"
                    sx={{
                      color: tokens.color.primary,
                      fontWeight: 700,
                      '&:hover': { color: tokens.color.secondary, textDecoration: 'underline' },
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