import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SnackbarProvider } from './context/SnackbarContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <SnackbarProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
