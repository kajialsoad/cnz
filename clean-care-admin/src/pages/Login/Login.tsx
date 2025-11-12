import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password, rememberMe);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `,
          zIndex: 0,
        }}
      />

      {/* Login Card */}
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Logo/Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
              }}
            >
              <AdminIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Clean Care Admin
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Sign in to your admin dashboard
            </Typography>

            <Divider sx={{ my: 2 }} />
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#4CAF50' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#4CAF50',
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#4CAF50' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#4CAF50',
                },
              }}
            />

            {/* Error Message */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Remember Me */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  sx={{
                    color: '#4CAF50',
                    '&.Mui-checked': {
                      color: '#4CAF50',
                    },
                  }}
                />
              }
              label="Remember me"
              sx={{ mb: 3 }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049 0%, #1b5e20 100%)',
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.5)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
                  color: 'white',
                  opacity: 0.7,
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </Button>
          </Box>

          {/* Demo Credentials */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#4CAF50' }}>
              🔐 Demo Admin Accounts
            </Typography>
            <Box sx={{ textAlign: 'left', fontSize: '0.75rem' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#2E7D32', display: 'block' }}>
                👑 Super Admin:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>superadmin@demo.com</strong> / <strong>Demo123!@#</strong>
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#2E7D32', display: 'block', mt: 1 }}>
                👨‍💼 Admin:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>admin@demo.com</strong> / <strong>Demo123!@#</strong>
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Smart Complaint Management System
            </Typography>
            <Typography variant="caption" color="text.secondary">
              © 2025 Clean Care. All rights reserved.
            </Typography>
          </Box>
        </CardContent>
      </Card>


    </Box>
  );
};

export default Login;
