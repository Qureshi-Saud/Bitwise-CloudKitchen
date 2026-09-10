import { Card, Stack, IconButton, Tooltip, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * The filter strip that sits above every list view.
 *
 * Pages used to hand-roll this, which is why the breakpoint at which filters
 * stacked and the width of each control differed on every screen. Controls are
 * laid out on one wrapping row and the refresh affordance is always in the same
 * corner.
 */
export default function FilterBar({ children, onRefresh, refreshing = false, action }) {
  return (
    <Card sx={{ p: 2, mb: 2.5 }}>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        flexWrap="wrap"
        alignItems="center"
        sx={{ '& > .MuiFormControl-root': { flex: { xs: '1 1 100%', sm: '0 1 auto' } } }}
      >
        {children}
        <Box sx={{ flex: '1 1 auto' }} />
        {action}
        {onRefresh && (
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={onRefresh} disabled={refreshing} aria-label="Refresh list">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Card>
  );
}
