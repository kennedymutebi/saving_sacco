/**
 * main.tsx — Application Entry Point
 *
 * Mounts the Harvest Haven SACCO app into the #root div.
 * Wraps the app in MUI ThemeProvider so all components
 * automatically use the Harvest Haven design system.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { muiTheme } from './config/muiTheme';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme}>
      {/* CssBaseline normalises browser default styles */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);