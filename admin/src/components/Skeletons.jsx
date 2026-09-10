import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

/**
 * The panel's "waiting for data" treatment.
 *
 * Skeletons, not spinners: they hold the shape of the page that is coming, so a
 * slow network reads as "nearly there" instead of "nothing is happening".
 * Spinners stay where they belong - on a button the operator just pressed, or
 * on an upload tile that is busy.
 *
 * Every page that blocks on a fetch picks the shell that matches its layout, so
 * a slow load looks the same everywhere instead of four different treatments.
 */

const repeat = (count, fn) => Array.from({ length: count }).map((_, i) => fn(i));

/** Title block that mirrors <PageHeader />. */
function PageHeaderSkeleton({ action = true }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box sx={{ minWidth: 0, width: '100%' }}>
        <Skeleton variant="text" width={220} height={38} />
        <Skeleton variant="text" width="60%" height={22} />
      </Box>
      {action && <Skeleton variant="rounded" width={180} height={38} sx={{ flexShrink: 0 }} />}
    </Stack>
  );
}

/** A card with a heading and a few stacked rows inside. */
function SectionCardSkeleton({ rows = 3, rowHeight = 44, height }) {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
        {height ? (
          <Skeleton variant="rounded" height={height} />
        ) : (
          <Stack spacing={1.25}>
            {repeat(rows, (i) => <Skeleton key={i} variant="rounded" height={rowHeight} />)}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/** Header + a stack of cards. The default fallback for a whole route. */
export function PageSkeleton({ cards = 2 }) {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading">
      <PageHeaderSkeleton />
      <Grid container spacing={2.5}>
        {repeat(cards, (i) => (
          <Grid item xs={12} key={i}>
            <SectionCardSkeleton rows={i === 0 ? 4 : 3} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/** Two-column read-only view: main column plus a narrower side rail. */
export function DetailSkeleton({ label = 'Loading' }) {
  return (
    <Box role="status" aria-busy="true" aria-label={label}>
      <PageHeaderSkeleton />
      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12}>
          <SectionCardSkeleton height={72} />
        </Grid>
        <Grid item xs={12} lg={7}>
          <SectionCardSkeleton rows={4} rowHeight={56} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <Stack spacing={2.5}>
            <SectionCardSkeleton rows={3} rowHeight={32} />
            <SectionCardSkeleton rows={2} rowHeight={32} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

/** Editor layout: wide form column with an optional settings rail. */
export function FormSkeleton({ label = 'Loading', rail = true, sections = 2 }) {
  return (
    <Box role="status" aria-busy="true" aria-label={label}>
      <PageHeaderSkeleton />
      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12} lg={rail ? 8 : 12}>
          <Stack spacing={2.5}>
            {repeat(sections, (i) => (
              <Card key={i}>
                <CardContent>
                  <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {repeat(4, (j) => (
                      <Grid item xs={12} sm={j % 3 === 0 ? 12 : 6} key={j}>
                        <Skeleton variant="rounded" height={52} />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        {rail && (
          <Grid item xs={12} lg={4}>
            <Stack spacing={2.5}>
              <SectionCardSkeleton height={180} />
              <SectionCardSkeleton rows={3} rowHeight={40} />
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

/** Grid of equal cards - categories, delivery slots, coupons. */
export function CardGridSkeleton({ count = 6, height = 216, cols = { xs: 12, sm: 6, lg: 4 } }) {
  return (
    <Grid container spacing={2.5} role="status" aria-busy="true" aria-label="Loading">
      {repeat(count, (i) => (
        <Grid item {...cols} key={i}>
          <Skeleton variant="rounded" height={height} />
        </Grid>
      ))}
    </Grid>
  );
}
