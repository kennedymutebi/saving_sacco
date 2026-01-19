// ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, ArrowBack } from '@mui/icons-material';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface FormData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

interface ShowPasswords {
  old: boolean;
  new: boolean;
  confirm: boolean;
}

type PasswordField = keyof ShowPasswords;
type FormField = keyof FormData;

function ResetPassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState<ShowPasswords>({
    old: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (field: FormField) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    setError('');
    setSuccess(false);
  };

  const togglePasswordVisibility = (field: PasswordField) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation
    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      setError('All fields are required');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New password and confirm password do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (formData.old_password === formData.new_password) {
      setError('New password must be different from old password');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(
        formData.old_password,
        formData.new_password,
        formData.confirm_password
      );

      setSuccess(true);
      setError('');

      setTimeout(() => {
        setFormData({
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
        
        // Logout user and redirect to login
        logout();
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        py: 4,
        px: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 4, sm: 6 },
          width: '100%',
          maxWidth: 500,
          borderRadius: 3,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToDashboard}
          sx={{
            mb: 3,
            color: '#64748b',
            textTransform: 'none',
            '&:hover': { color: '#16a34a' },
          }}
        >
          Back to Dashboard
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Lock sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your current password and choose a new one
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Password successfully updated! Redirecting to login...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
            Current Password
          </Typography>
          <TextField
            fullWidth
            type={showPasswords.old ? 'text' : 'password'}
            value={formData.old_password}
            onChange={handleChange('old_password')}
            disabled={loading}
            required
            placeholder="Enter your current password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('old')} edge="end">
                    {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#16a34a' },
                '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 },
              },
            }}
          />

          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
            New Password
          </Typography>
          <TextField
            fullWidth
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.new_password}
            onChange={handleChange('new_password')}
            disabled={loading}
            required
            placeholder="Enter your new password"
            helperText="Must be at least 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('new')} edge="end">
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#16a34a' },
                '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 },
              },
            }}
          />

          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
            Confirm New Password
          </Typography>
          <TextField
            fullWidth
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={handleChange('confirm_password')}
            disabled={loading}
            required
            placeholder="Re-enter your new password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('confirm')} edge="end">
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#16a34a' },
                '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Make sure your password is strong and unique. You'll be logged out after changing your password.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default ResetPassword;