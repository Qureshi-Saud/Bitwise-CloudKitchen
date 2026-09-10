import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress,
} from '@mui/material';

/** Destructive-action confirmation. Mirrors FormDialog's busy behaviour. */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', confirmColor = 'error', onConfirm, onClose, loading,
}) {
  const close = (_event, reason) => {
    if (loading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Working...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
