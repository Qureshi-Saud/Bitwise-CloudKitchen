import { Box, Typography } from '@mui/material';

/**
 * The two-line "primary over secondary" cell used throughout the data grids.
 *
 * Centres itself in the row, which is what the scattered `sx={{ py: 1 }}` on
 * raw Boxes was approximating.
 */
export default function CellText({ primary, secondary, mono = false, strong = true }) {
  return (
    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <Typography
        variant="body2"
        noWrap
        sx={{
          fontWeight: strong ? 700 : 600,
          ...(mono && {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: '.8125rem',
            letterSpacing: '-.01em',
          }),
        }}
      >
        {primary}
      </Typography>
      {secondary != null && secondary !== '' && (
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {secondary}
        </Typography>
      )}
    </Box>
  );
}
