/**
 * muiTheme.ts — Material UI Theme Configuration
 *
 * Connects our design tokens to MUI so all MUI components
 * (Button, Card, TextField, etc.) automatically use the
 * Harvest Haven colour palette and typography.
 *
 * Usage in main.tsx:
 *   import { ThemeProvider } from '@mui/material/styles';
 *   import { muiTheme } from './config/muiTheme';
 *   <ThemeProvider theme={muiTheme}><App /></ThemeProvider>
 */

import { createTheme } from '@mui/material/styles';
import { tokens } from './theme';

export const muiTheme = createTheme({
  palette: {
    primary: {
      main:  tokens.color.primary,
      light: tokens.color.primaryLight,
      dark:  tokens.color.secondary,
    },
    error: {
      main: tokens.color.danger,
    },
    success: {
      main: tokens.color.success,
    },
    warning: {
      main: tokens.color.warning,
    },
    background: {
      default: tokens.color.bg,
      paper:   tokens.color.surface,
    },
    text: {
      primary:   tokens.color.textDark,
      secondary: tokens.color.textMid,
      disabled:  tokens.color.textMuted,
    },
  },

  typography: {
    fontFamily: tokens.font.base,
    allVariants: {
      color: tokens.color.textDark,
    },
  },

  shape: {
    borderRadius: 12, // matches tokens.radius.md
  },

  components: {
    // Buttons use brand green by default
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    // Cards use our shadow
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: tokens.shadow.card,
          borderRadius: tokens.radius.lg,
        },
      },
    },
    // TextFields use brand green focus colour
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.color.primary,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: tokens.color.primary,
          },
        },
      },
    },
  },
});