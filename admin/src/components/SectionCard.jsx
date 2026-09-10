import { Card, CardContent, Divider, Stack, Typography, Box } from '@mui/material';

/**
 * A titled panel. Card headings across the panel are `h2` under the page's
 * single `h1`, so the document outline reads correctly in a screen reader.
 *
 * `action` sits opposite the title; `description` explains the section beneath.
 */
export default function SectionCard({
  title, description, action, divider = true, children, sx, contentSx,
}) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      <CardContent sx={{ flex: 1, ...contentSx }}>
        {(title || action) && (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant="h6" component="h2" sx={{ fontSize: '1rem' }}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {description}
                </Typography>
              )}
            </Box>
            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
          </Stack>
        )}
        {title && divider && <Divider sx={{ my: 2 }} />}
        {children}
      </CardContent>
    </Card>
  );
}
