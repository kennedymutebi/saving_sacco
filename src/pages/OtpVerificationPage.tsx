// src/pages/OtpVerificationPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { Shield as ShieldIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { tokens, avatarColor } from '../config/theme';

// ─── Shared Design Tokens (matching SavingsDashboard) ────────────────────────


export default function OtpVerificationPage() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuth();

  const email =
    (location.state as { email?: string })?.email ||
    localStorage.getItem('pending_email') ||
    '';

  useEffect(() => {
    if (!email) { setError('No email found. Please return to login.'); return; }
    inputRefs.current[0]?.focus();
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, email]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    const event = e as unknown as React.KeyboardEvent<HTMLInputElement>;
    if (event.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter all 6 digits'); return; }
    if (!email) { setError('Email not found. Please return to login.'); return; }
    setError(null);
    setLoading(true);
    try {
      const data = await authService.verifyOtp(email, otpString);
      const hasToken = localStorage.getItem('access_token');
      if (!hasToken) { setError('No access token received from server.'); return; }
      login();
      if (data.user) setUser(data.user);
      setSuccess('OTP verified successfully! Redirecting to dashboard…');
      setOtp(['', '', '', '', '', '']);
      const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
      setTimeout(() => navigate(redirectTo, { replace: true }), 800);
    } catch (err: any) {
      let msg = 'OTP verification failed. ';
      if (err.message) msg += err.message;
      else msg += 'Please check the code and try again.';
      if (err.message?.toLowerCase().includes('expired')) msg += ' The code may have expired — request a new one.';
      else if (err.message?.toLowerCase().includes('invalid')) msg += ' Please ensure you entered the correct 6-digit code.';
      setError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await authService.resendOtp(email);
      setSuccess(response.message || 'A new OTP has been sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
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
        background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.secondary} 100%)`,
        padding: 3,
        fontFamily: tokens.font.base,
      }}
    >
      {/* decorative background blobs */}
      <Box sx={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 4, sm: 6 },
            borderRadius: tokens.radius.xxl,
            textAlign: 'center',
            position: 'relative',
            boxShadow: tokens.shadow.elevated,
            bgcolor: tokens.color.surface,
          }}
        >
          {/* Back button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: tokens.color.textMuted,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: tokens.radius.md,
              '&:hover': { bgcolor: tokens.color.surfaceAlt, color: tokens.color.primary },
            }}
          >
            Back
          </Button>

          {/* Shield icon */}
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
              boxShadow: `0 8px 24px rgba(45,106,79,0.3)`,
            }}
          >
            <ShieldIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Box>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.6rem', sm: '2rem' },
              color: tokens.color.textDark,
              mb: 1.5,
              fontFamily: tokens.font.base,
              letterSpacing: '-0.01em',
            }}
          >
            Verify Your Email
          </Typography>
          <Typography sx={{ mb: 0.75, color: tokens.color.textMuted, fontSize: '1rem' }}>
            We've sent a verification code to
          </Typography>
          <Typography
            sx={{
              mb: 4,
              color: tokens.color.primary,
              fontWeight: 700,
              fontSize: '1rem',
              wordBreak: 'break-word',
            }}
          >
            {email || 'your email'}
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: tokens.radius.md, textAlign: 'left', fontSize: '0.95rem' }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 3, borderRadius: tokens.radius.md, textAlign: 'left', fontSize: '0.95rem' }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* OTP inputs */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, justifyContent: 'center', mb: 4 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      padding: '16px 0',
                      color: tokens.color.textDark,
                    },
                  }}
                  sx={{
                    width: { xs: 46, sm: 62 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: tokens.radius.md,
                      bgcolor: digit ? tokens.color.primaryPale : tokens.color.surfaceAlt,
                      transition: 'background 0.15s',
                      '& fieldset': {
                        borderColor: digit ? tokens.color.primaryLight : tokens.color.border,
                        borderWidth: 2,
                      },
                      '&:hover fieldset': { borderColor: tokens.color.primaryLight },
                      '&.Mui-focused fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
                    },
                  }}
                />
              ))}
            </Box>

            {/* Verify button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={otp.join('').length !== 6 || loading}
              sx={{
                mb: 3,
                py: 1.75,
                borderRadius: tokens.radius.md,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.primaryLight} 100%)`,
                boxShadow: `0 4px 14px rgba(45,106,79,0.35)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${tokens.color.secondary} 0%, ${tokens.color.accent} 100%)`,
                  boxShadow: `0 6px 20px rgba(45,106,79,0.4)`,
                },
                '&:disabled': { background: tokens.color.border, boxShadow: 'none', color: tokens.color.textMuted },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
            </Button>

            {/* Resend */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: tokens.color.textMuted, fontSize: '0.95rem', mb: 0.75 }}>
                Didn't receive the code?
              </Typography>
              <Button
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                sx={{
                  textTransform: 'none',
                  color: tokens.color.primary,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: tokens.radius.md,
                  '&:hover': { bgcolor: tokens.color.primaryPale },
                  '&:disabled': { color: tokens.color.textMuted },
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Button>
            </Box>
          </Box>

          {/* Footer note */}
          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${tokens.color.border}` }}>
            <Typography sx={{ color: tokens.color.textMuted, fontSize: '0.85rem' }}>
              This code will expire in 10 minutes. Do not share it with anyone.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}