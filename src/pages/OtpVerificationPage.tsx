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

  // Get email from location state or localStorage
  const email =
    (location.state as { email?: string })?.email ||
    localStorage.getItem('pending_email') ||
    '';

  useEffect(() => {
    if (!email) {
      setError('No email found. Please return to login.');
      return;
    }
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    const event = e as unknown as React.KeyboardEvent<HTMLInputElement>;

    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.split('').forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);

      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!email) {
      setError('Email not found. Please return to login.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('Verifying OTP:', { email, otp: otpString }); // Debug log
      
      // Verify OTP and store access token in localStorage
      const data = await authService.verifyOtp(email, otpString);
      
      console.log('OTP verification response:', data); // Debug log
      console.log('Access token stored:', localStorage.getItem('access_token')); // Debug log
      console.log('Temp access token:', localStorage.getItem('temp_access_token')); // Debug log
      console.log('Is authenticated:', authService.isAuthenticated()); // Debug log

      // After OTP verification, check if we have an access token
      const hasToken = localStorage.getItem('access_token');
      
      if (!hasToken) {
        // Log all localStorage keys to debug
        console.log('All localStorage keys:', Object.keys(localStorage));
        console.log('LocalStorage contents:', {
          access_token: localStorage.getItem('access_token'),
          temp_access_token: localStorage.getItem('temp_access_token'),
          user_email: localStorage.getItem('user_email'),
        });
        
        setError('No access token received from server. Please check console for details.');
        return;
      }

      // Update authentication state
      login();
      
      // Update user data if provided
      if (data.user) {
        setUser(data.user);
      }

      setSuccess('OTP verified successfully! Redirecting to dashboard...');

      // Clear the OTP inputs
      setOtp(['', '', '', '', '', '']);

      // Redirect to previous location or dashboard immediately
      const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
      
      // Use a small delay just for user experience (to show success message)
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 800);
    } catch (err: any) {
      console.error('OTP verification error:', err); // Debug log
      
      // More detailed error message
      let errorMessage = 'OTP verification failed. ';
      
      if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check the code and try again.';
      }
      
      // Provide helpful hints based on common errors
      if (err.message?.toLowerCase().includes('expired')) {
        errorMessage += ' The code may have expired. Please request a new one.';
      } else if (err.message?.toLowerCase().includes('invalid')) {
        errorMessage += ' Please ensure you entered the correct 6-digit code.';
      }
      
      setError(errorMessage);
      
      // Clear OTP on error for security
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
      console.log('Resending OTP to:', email); // Debug log
      
      const response = await authService.resendOtp(email);
      
      console.log('Resend OTP response:', response); // Debug log
      
      setSuccess(response.message || 'A new OTP has been sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend OTP error:', err); // Debug log
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{ padding: { xs: 4, sm: 6 }, borderRadius: 4, textAlign: 'center', position: 'relative' }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ position: 'absolute', top: 16, left: 16, color: '#64748b', textTransform: 'none' }}
          >
            Back
          </Button>

          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <ShieldIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Verify Your Email
          </Typography>
          <Typography variant="body1" sx={{ mb: 1, color: '#64748b' }}>
            We've sent a verification code to
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#667eea', fontWeight: 600, wordBreak: 'break-word' }}>
            {email || 'your email'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'center', mb: 4 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, padding: '16px 0' } }}
                  sx={{
                    width: { xs: 45, sm: 60 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#e2e8f0', borderWidth: 2 },
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea' },
                    },
                  }}
                />
              ))}
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={otp.join('').length !== 6 || loading}
              sx={{
                mb: 3,
                py: 1.75,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)' },
                '&:disabled': { background: '#cbd5e1' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                Didn't receive the code?
              </Typography>
              <Button
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                sx={{ textTransform: 'none', color: '#667eea', fontWeight: 600, '&:disabled': { color: '#cbd5e1' } }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              This code will expire in 10 minutes. Do not share it with anyone.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}