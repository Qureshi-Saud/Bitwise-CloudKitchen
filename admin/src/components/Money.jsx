import { Typography } from '@mui/material';
import { formatINR } from '../lib/utils';

/**
 * Currency, rendered the same way everywhere.
 *
 * `strong` is for the figure that matters on a row (an order total, a product
 * price); plain is for supporting amounts in a breakdown.
 */
export default function Money({ value, strong = false, variant = 'body2', color, sx, ...rest }) {
  return (
    <Typography
      variant={variant}
      sx={{ fontWeight: strong ? 800 : 500, color: color || (strong ? 'primary.main' : 'text.primary'), ...sx }}
      {...rest}
    >
      {formatINR(value)}
    </Typography>
  );
}
