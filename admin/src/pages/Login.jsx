import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, Stack,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useAdminAuth } from '../context/AdminAuthContext';
import useBrand from '../hooks/useBrand';
import BrandMark from '../components/BrandMark';
import { tokens } from '../theme';

export default function Login() {
  const { login, isAuthenticated, booting } = useAdminAuth();
  const brand = useBrand();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!booting && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at 20% 20%, rgba(34,197,94,.14), transparent 45%),' +
          'radial-gradient(circle at 85% 15%, rgba(249,115,22,.12), transparent 40%),' +
          tokens.surfaceCanvas,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <BrandMark size={44} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                {brand.brandName}
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={700}>
                Admin Panel
              </Typography>
            </Box>
          </Stack>

          <Typography variant="h5" component="h1" gutterBottom>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Only accounts with an admin or staff role can access this panel.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <Box component="form" onSubmit={submit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<LoginIcon />}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
