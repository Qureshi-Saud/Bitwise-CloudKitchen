import { Box } from '@mui/material';

/** The rounded, filled icon square used by stat cards and slot cards. */
export default function IconTile({ icon: Icon, color = 'primary', size = 48 }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size, height: size, borderRadius: 3, display: 'grid', placeItems: 'center',
        bgcolor: color + '.main', color: '#fff', flexShrink: 0,
      }}
    >
      <Icon />
    </Box>
  );
}
