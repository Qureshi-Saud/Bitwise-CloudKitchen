import { Chip } from '@mui/material';
import {
  ORDER_STATUS_COLOR, PAYMENT_STATUS_COLOR, REVIEW_STATUS_COLOR, CONTACT_STATUS_COLOR, humanize,
} from '../lib/utils';

const MAPS = {
  order: ORDER_STATUS_COLOR,
  payment: PAYMENT_STATUS_COLOR,
  review: REVIEW_STATUS_COLOR,
  contact: CONTACT_STATUS_COLOR,
};

/**
 * A status pill whose colour is decided by the domain vocabulary, not by the
 * calling page. `kind` picks the vocabulary; `value` is the raw stored status.
 */
export default function StatusChip({ kind, value, label, variant = 'filled', size = 'small', sx, ...rest }) {
  if (!value) return null;
  return (
    <Chip
      size={size}
      variant={variant}
      color={MAPS[kind]?.[value] || 'default'}
      label={label ?? humanize(value)}
      sx={sx}
      {...rest}
    />
  );
}
