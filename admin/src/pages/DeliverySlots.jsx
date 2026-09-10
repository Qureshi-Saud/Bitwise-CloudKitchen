import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Button, Stack, Chip, IconButton, TextField, Switch,
  FormControlLabel, Box, Alert, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import FormDialog from '../components/FormDialog';
import EmptyState from '../components/EmptyState';
import IconTile from '../components/IconTile';
import { CardGridSkeleton } from '../components/Skeletons';
import { slotApi } from '../api/endpoints';
import { useSnackbar } from '../context/SnackbarContext';

const EMPTY = { label: '', startTime: '09:00', endTime: '11:00', capacity: 40, cutoffMinutes: 60, order: 0, isActive: true };

/** The shape the API expects, built from whatever the form currently holds. */
const toPayload = (form) => ({
  label: form.label,
  startTime: form.startTime,
  endTime: form.endTime,
  capacity: Number(form.capacity) || 40,
  cutoffMinutes: Number(form.cutoffMinutes) || 0,
  order: Number(form.order) || 0,
  isActive: form.isActive,
});

export default function DeliverySlots() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const snackbar = useSnackbar();

  const load = () => {
    setLoading(true);
    slotApi
      .list()
      .then((res) => setRows(res.data))
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openForm = (row) => {
    setEditing(row || {});
    setForm(row ? { ...EMPTY, ...row } : EMPTY);
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = toPayload(form);
      if (editing?._id) await slotApi.update(editing._id, payload);
      else await slotApi.create(payload);

      snackbar.success(editing?._id ? 'Slot updated' : 'Slot created');
      setEditing(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /** Same visibility affordance the products table offers. */
  const toggleActive = async (row) => {
    try {
      await slotApi.update(row._id, { ...toPayload({ ...EMPTY, ...row }), isActive: !row.isActive });
      snackbar.success(row.label + (row.isActive ? ' withdrawn from checkout' : ' is now offered at checkout'));
      load();
    } catch (err) {
      snackbar.error(err.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await slotApi.remove(deleting._id);
      snackbar.success('Slot deleted');
      setDeleting(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add slot
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Delivery Slots"
        subtitle="The time windows customers can choose at checkout. Capacity and cutoff are enforced by the API."
        action={addButton}
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        A slot closes automatically <strong>cutoff minutes</strong> before it starts, giving the kitchen time to
        cook. Once a slot reaches its daily capacity it shows as fully booked to customers.
      </Alert>

      {loading ? (
        <CardGridSkeleton count={3} height={196} />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={ScheduleIcon}
            title="No delivery slots yet"
            description="Customers cannot check out until at least one slot is available. Add the first time window to open ordering."
            action={addButton}
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {rows.map((slot) => (
            <Grid item xs={12} sm={6} lg={4} key={slot._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: slot.isActive ? 1 : 0.6 }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <IconTile icon={ScheduleIcon} size={46} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{slot.label}</Typography>
                        {!slot.isActive && <Chip size="small" label="Off" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 2, flex: 1 }} flexWrap="wrap" useFlexGap alignItems="flex-start">
                    <Chip size="small" variant="outlined" label={'Capacity ' + slot.capacity} />
                    <Chip size="small" variant="outlined" label={'Cutoff ' + slot.cutoffMinutes + ' min'} />
                    <Chip size="small" variant="outlined" label={'Order ' + slot.order} />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
                  >
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openForm(slot)} aria-label={'Edit ' + slot.label}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleting(slot)} aria-label={'Delete ' + slot.label}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title={slot.isActive ? 'Offered at checkout' : 'Not offered at checkout'}>
                      <Switch
                        size="small"
                        checked={Boolean(slot.isActive)}
                        onChange={() => toggleActive(slot)}
                        inputProps={{ 'aria-label': 'Offer ' + slot.label + ' at checkout' }}
                      />
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <FormDialog
        open={Boolean(editing)}
        title={editing?._id ? 'Edit slot' : 'New delivery slot'}
        onClose={() => setEditing(null)}
        onSubmit={save}
        submitDisabled={!form.label}
        busy={busy}
        maxWidth="xs"
      >
        <Stack spacing={2.5}>
          <TextField
            label="Label"
            fullWidth
            required
            placeholder="Evening Snack (4:00 PM - 7:00 PM)"
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
            <TextField
              label="End time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Capacity"
              type="number"
              fullWidth
              helperText="Orders per day"
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            />
            <TextField
              label="Cutoff (min)"
              type="number"
              fullWidth
              helperText="Close this long before start"
              value={form.cutoffMinutes}
              onChange={(e) => set('cutoffMinutes', e.target.value)}
            />
            <TextField
              label="Order"
              type="number"
              sx={{ width: 100 }}
              helperText="Sort"
              value={form.order}
              onChange={(e) => set('order', e.target.value)}
            />
          </Stack>
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
            label="Offered at checkout"
          />
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this slot?"
        message={deleting ? '"' + deleting.label + '" will no longer be offered at checkout. Existing orders keep their slot.' : ''}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
