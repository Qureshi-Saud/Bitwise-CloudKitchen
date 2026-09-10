import { Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';
import IconTile from './IconTile';

export default function StatCard({ icon, label, value, hint, color = 'primary', loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <IconTile icon={icon} color={color} />
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={90} height={34} />
          ) : (
            <Typography variant="h5" sx={{ mt: 0.25, lineHeight: 1.2 }}>{value}</Typography>
          )}
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>{hint}</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
