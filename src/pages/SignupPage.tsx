// SignupPage.tsx
import React, { useState } from 'react';
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
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/authService';
import { tokens, avatarColor } from '../config/theme';

// ─── Design tokens (mirrors SavingsDashboard exactly) ────────────────────────

// Shared field sx — same as LoginPage
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surfaceAlt,
    fontFamily: tokens.font.base,
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    '& fieldset': { borderColor: tokens.color.border },
    '&:hover fieldset': { borderColor: tokens.color.primaryLight },
    '&.Mui-focused': {
      backgroundColor: tokens.color.surface,
      '& fieldset': { borderColor: tokens.color.primary, borderWidth: 2 },
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '11px 14px',
    color: tokens.color.textDark,
  },
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    sx={{
      mb: 0.75,
      fontWeight: 600,
      color: tokens.color.textDark,
      fontSize: '0.82rem',
      letterSpacing: 0.2,
      fontFamily: tokens.font.base,
    }}
  >
    {children}
  </Typography>
);

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

  const eyeProps = (show: boolean, toggle: () => void) => ({
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={toggle}
          edge="end"
          size="small"
          sx={{ color: tokens.color.textMuted, '&:hover': { color: tokens.color.primary } }}
        >
          {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  });

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
          maxWidth: { xs: '100%', sm: '520px', md: '1060px' },
          borderRadius: tokens.radius.xxl,
          overflow: 'hidden',
          border: `1px solid ${tokens.color.border}`,
          boxShadow: tokens.shadow.elevated,
        }}
      >
        {/* ── Left — Branding (desktop only) ──────────────────────────── */}
        <Box
          sx={{
            flex: '0 0 42%',
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

          <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
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
                fontSize: { md: '1.9rem', lg: '2.5rem' },
                lineHeight: 1.1,
                mb: 1,
                fontFamily: tokens.font.base,
                letterSpacing: '-0.5px',
              }}
            >
              Harvest Haven
            </Typography>
            <Typography sx={{ mb: 3, opacity: 0.85, fontSize: { md: '1rem', lg: '1.1rem' } }}>
              Saving Association
            </Typography>

            <Box sx={{ width: 52, height: 3, background: 'rgba(255,255,255,0.35)', margin: '0 auto 24px', borderRadius: 2 }} />

            <Typography sx={{ opacity: 0.88, lineHeight: 1.75, fontSize: { md: '0.88rem', lg: '0.97rem' } }}>
              Join thousands of members building financial security. Start your journey to prosperity with secure savings and trusted financial services.
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
                  <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.75, mt: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Right — Form ─────────────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            padding: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: tokens.color.surface,
            overflowY: 'auto',
          }}
        >
          <Box sx={{ maxWidth: 440, mx: 'auto', width: '100%' }}>

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
              Become a Member
            </Typography>
            <Typography sx={{ mb: 3, color: tokens.color.textMid, fontSize: '0.88rem', lineHeight: 1.6 }}>
              Create your account to start saving and investing with us
            </Typography>

            {/* Error */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
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

              {/* First / Last name row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <FieldLabel>First Name</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    disabled={loading}
                    required
                    sx={fieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <FieldLabel>Last Name</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    disabled={loading}
                    required
                    sx={fieldSx}
                  />
                </Box>
              </Box>

              {/* Email */}
              <FieldLabel>Email Address</FieldLabel>
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
                      <EmailIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Phone */}
              <FieldLabel>Phone Number</FieldLabel>
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
                      <PhoneIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Place of Residence */}
              <FieldLabel>Place of Residence</FieldLabel>
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
                      <LocationIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Password */}
              <FieldLabel>Password</FieldLabel>
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
                      <LockIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  ...eyeProps(showPassword, () => setShowPassword(!showPassword)),
                }}
                sx={{ mb: 2.5, ...fieldSx }}
              />

              {/* Confirm Password */}
              <FieldLabel>Confirm Password</FieldLabel>
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
                      <LockIcon sx={{ color: tokens.color.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  ...eyeProps(showConfirm, () => setShowConfirm(!showConfirm)),
                }}
                sx={{ mb: 2, ...fieldSx }}
              />

              {/* Terms */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
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
                    I agree to the{' '}
                    <Link
                      href="#"
                      sx={{
                        color: tokens.color.primary,
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="#"
                      sx={{
                        color: tokens.color.primary,
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ mb: 3 }}
              />

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
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
              </Button>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', pt: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
                <Typography sx={{ color: tokens.color.textMid, fontSize: '0.85rem' }}>
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/"
                    underline="none"
                    sx={{
                      color: tokens.color.primary,
                      fontWeight: 700,
                      '&:hover': { color: tokens.color.secondary, textDecoration: 'underline' },
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