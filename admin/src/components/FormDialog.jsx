import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';

/**
 * The shell every create/edit dialog in the panel uses.
 *
 * Centralises what each page used to repeat by hand: action padding, the
 * neutral Cancel button, the busy state on the primary action, and refusing to
 * close from a backdrop click mid-save.
 */
export default function FormDialog({
  open, title, onClose, onSubmit, submitLabel = 'Save', submitDisabled = false,
  busy = false, cancelLabel = 'Cancel', maxWidth = 'sm', extraActions, children,
}) {
  const close = (_event, reason) => {
    if (busy && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={busy}>{cancelLabel}</Button>
        {extraActions}
        {onSubmit && (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={busy || submitDisabled}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {busy ? 'Saving...' : submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
