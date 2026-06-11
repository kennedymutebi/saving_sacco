// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack,
  MarkEmailRead,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { tokens, avatarColor } from '../config/theme';

// ─── Design tokens (mirrors SavingsDashboard exactly) ────────────────────────

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

type Step = 'form' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          minHeight: { xs: 'auto', md: 560 },
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
          {/* Decorative blobs */}
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', top: '55%', right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
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
            <Typography sx={{ mb: 3, opacity: 0.85, fontSize: { md: '1rem', lg: '1.15rem' } }}>
              Saving Association
            </Typography>

            <Box sx={{ width: 52, height: 3, background: 'rgba(255,255,255,0.35)', margin: '0 auto 24px', borderRadius: 2 }} />

            <Typography sx={{ opacity: 0.88, lineHeight: 1.75, fontSize: { md: '0.9rem', lg: '1rem' } }}>
              No worries — it happens to everyone. Enter your registered email and we'll send you a link to reset your password securely.
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

            {/* ── STEP: Form ────────────────────────────────────────────── */}
            {step === 'form' && (
              <>
                <Button
                  startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
                  onClick={() => navigate('/login')}
                  sx={{
                    mb: 3,
                    color: tokens.color.textMid,
                    textTransform: 'none',
                    px: 0,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    '&:hover': { color: tokens.color.primary, background: 'transparent' },
                  }}
                >
                  Back to Sign In
                </Button>

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
                  Forgot Password?
                </Typography>
                <Typography sx={{ mb: 3.5, color: tokens.color.textMid, fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Enter your registered email address and we'll send you a password reset link.
                </Typography>

                {error && (
                  <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{
                      mb: 3,
                      borderRadius: tokens.radius.md,
                      background: '#FDECEA',
                      border: `1px solid ${tokens.color.danger}22`,
                      color: tokens.color.danger,
                      fontSize: '0.82rem',
                      '& .MuiAlert-icon': { color: tokens.color.danger },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Typography sx={{ mb: 1, fontWeight: 600, color: tokens.color.textDark, fontSize: '0.82rem', letterSpacing: 0.2 }}>
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3.5, ...fieldSx }}
                  />

                  <Button
                    type="submit"
                    fullWidth
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
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
                  </Button>

                  <Box sx={{ textAlign: 'center', pt: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
                    <Typography sx={{ color: tokens.color.textMid, fontSize: '0.85rem' }}>
                      Remember your password?{' '}
                      <Link
                        component={RouterLink}
                        to="/login"
                        underline="none"
                        sx={{
                          color: tokens.color.primary,
                          fontWeight: 700,
                          '&:hover': { color: tokens.color.secondary, textDecoration: 'underline' },
                        }}
                      >
                        Sign in
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            {/* ── STEP: Success ─────────────────────────────────────────── */}
            {step === 'success' && (
              <Box sx={{ textAlign: 'center' }}>
                {/* Icon circle — mirrors dashboard hero card style */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: tokens.shadow.elevated,
                  }}
                >
                  <MarkEmailRead sx={{ fontSize: 38, color: '#fff' }} />
                </Box>

                <Typography
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    color: tokens.color.textDark,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    fontFamily: tokens.font.base,
                    lineHeight: 1.2,
                  }}
                >
                  Check your email
                </Typography>

                <Typography sx={{ color: tokens.color.textMid, mb: 0.75, lineHeight: 1.7, fontSize: '0.9rem' }}>
                  We sent a password reset link to
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: tokens.color.primary,
                    mb: 4,
                    fontSize: '0.95rem',
                    wordBreak: 'break-word',
                  }}
                >
                  {email}
                </Typography>

                <Alert
                  severity="info"
                  sx={{
                    mb: 4,
                    borderRadius: tokens.radius.md,
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    backgroundColor: tokens.color.primaryPale,
                    border: `1px solid ${tokens.color.primaryLight}55`,
                    color: tokens.color.textMid,
                    '& .MuiAlert-icon': { color: tokens.color.primary },
                  }}
                >
                  Didn't receive the email? Check your spam folder or wait a few minutes before requesting again.
                </Alert>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { setStep('form'); setEmail(''); }}
                  sx={{
                    mb: 2,
                    py: 1.6,
                    borderRadius: tokens.radius.md,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: tokens.color.primary,
                    borderColor: tokens.color.primary,
                    fontFamily: tokens.font.base,
                    '&:hover': {
                      borderColor: tokens.color.secondary,
                      backgroundColor: tokens.color.primaryPale,
                      color: tokens.color.secondary,
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Try a different email
                </Button>

                <Box sx={{ pt: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    underline="none"
                    sx={{
                      color: tokens.color.primary,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      '&:hover': { color: tokens.color.secondary, textDecoration: 'underline' },
                    }}
                  >
                    ← Back to Sign In
                  </Link>
                </Box>
              </Box>
            )}

          </Box>
        </Box>
      </Paper>
    </Box>
  );
}