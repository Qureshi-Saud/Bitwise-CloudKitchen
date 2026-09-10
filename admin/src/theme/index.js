import { createTheme } from '@mui/material/styles';

/**
 * Single source of truth for the admin's visual language.
 *
 * Every colour, radius and surface tint the panel uses lives here — pages and
 * components read them through the theme rather than repeating literals, so a
 * brand change is a one-file edit.
 */

const GREEN = '#16a34a';

/** Raw tokens, exported so non-MUI consumers (recharts) can share them. */
export const tokens = {
  /** Warm neutral behind table headers and inset panels. */
  surfaceSubtle: '#faf8f3',
  /** Page background. */
  surfaceCanvas: '#f6f7f4',
  /** Row / list-item hover wash, tinted with the brand green. */
  hover: 'rgba(22,163,74,.06)',
  /** Translucent app bar fill. */
  appBar: 'rgba(255,255,255,.85)',
  /** Chart series, in the order a multi-series chart should consume them. */
  chart: [GREEN, '#ea580c', '#0284c7', '#d97706', '#7c3aed'],
  /** Hairline used for chart gridlines and inset dividers. */
  gridline: 'rgba(0,0,0,.06)',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: GREEN, dark: '#15803d', light: '#4ade80', contrastText: '#fff' },
    secondary: { main: '#ea580c', dark: '#c2410c', light: '#fb923c', contrastText: '#fff' },
    success: { main: GREEN },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    info: { main: '#0284c7' },
    background: { default: tokens.surfaceCanvas, paper: '#ffffff' },
    text: { primary: '#1c1917', secondary: '#57534e' },
    divider: 'rgba(0,0,0,.07)',
    surface: tokens.surfaceSubtle,
    hover: tokens.hover,
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' },
    /** Uppercase micro-label used above stats and metadata blocks. */
    overline: { fontWeight: 700, letterSpacing: '.06em', lineHeight: 1.6 },
  },

  shape: { borderRadius: 12 },

  components: {
    /* ----------------------------- Surfaces ----------------------------- */
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
        elevation1: { boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12)' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16, border: '1px solid rgba(0,0,0,.05)' } },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } },
    },

    /* ------------------------------ Inputs ------------------------------ */
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 18 } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },

    /* ------------------------------ Dialogs ----------------------------- */
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: '1.0625rem', fontWeight: 700, paddingBottom: 8 } },
    },
    MuiDialogContent: {
      // MUI zeroes the top padding of content that follows a title, which clips
      // the floating label of a first form field. Put a little back.
      styleOverrides: { root: { paddingTop: '8px !important' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '8px 24px 20px', gap: 8 } },
    },

    /* ------------------------------- Table ------------------------------ */
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, backgroundColor: tokens.surfaceSubtle } } },

    /* ----------------------------- Feedback ----------------------------- */
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

export default theme;
