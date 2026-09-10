import { Box, Typography, Stack } from '@mui/material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

/**
 * Shown wherever a list, grid or table has nothing to display.
 *
 * Always says what would appear here and, where the admin can do something
 * about it, offers the action — an empty screen should never be a dead end.
 */
export default function EmptyState({ icon: Icon = InboxIcon, title, description, action, dense = false }) {
  return (
    <Stack
      alignItems="center"
      spacing={1}
      sx={{ py: dense ? 4 : 7, px: 3, textAlign: 'center' }}
    >
      <Box
        sx={{
          width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center',
          bgcolor: 'action.hover', color: 'text.disabled', mb: 0.5,
        }}
      >
        <Icon />
      </Box>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ pt: 1.5 }}>{action}</Box>}
    </Stack>
  );
}
