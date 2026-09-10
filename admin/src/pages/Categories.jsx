import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Button, Stack, Chip, IconButton, TextField, Switch,
  FormControlLabel, Box, Avatar, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CategoryIcon from '@mui/icons-material/Category';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import FormDialog from '../components/FormDialog';
import EmptyState from '../components/EmptyState';
import { CardGridSkeleton } from '../components/Skeletons';
import { categoryApi } from '../api/endpoints';
import { formatINR, plural } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

const EMPTY = {
  name: '', tagline: '', description: '', icon: 'Salad', accent: '#16a34a',
  order: 0, isActive: true, image: { url: '' },
};

/** The shape the API expects, built from whatever the form currently holds. */
const toPayload = (form) => ({
  name: form.name,
  tagline: form.tagline || undefined,
  description: form.description || undefined,
  icon: form.icon,
  accent: form.accent,
  order: Number(form.order) || 0,
  isActive: form.isActive,
  ...(form.image?.url ? { image: { url: form.image.url } } : {}),
});

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const snackbar = useSnackbar();

  const load = () => {
    setLoading(true);
    categoryApi
      .list()
      .then((res) => setRows(res.data))
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openForm = (row) => {
    setEditing(row || {});
    setForm(row ? { ...EMPTY, ...row, image: row.image || { url: '' } } : EMPTY);
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = toPayload(form);
      if (editing?._id) await categoryApi.update(editing._id, payload);
      else await categoryApi.create(payload);

      snackbar.success(editing?._id ? 'Category updated' : 'Category created');
      setEditing(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /** Same visibility affordance the products table offers, without a round trip
   *  through the edit dialog. */
  const toggleActive = async (row) => {
    try {
      await categoryApi.update(row._id, { ...toPayload({ ...EMPTY, ...row }), isActive: !row.isActive });
      snackbar.success(row.name + (row.isActive ? ' hidden from the website' : ' is now visible'));
      load();
    } catch (err) {
      snackbar.error(err.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await categoryApi.remove(deleting._id);
      snackbar.success('Category deleted');
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
      Add category
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="The menu categories customers browse. Order here controls the order on the website."
        action={addButton}
      />

      {loading ? (
        <CardGridSkeleton count={6} height={216} />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={CategoryIcon}
            title="No categories yet"
            description="Categories group your snacks on the menu. Create the first one to start adding products."
            action={addButton}
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {rows.map((c) => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar src={c.image?.url} variant="rounded" sx={{ width: 56, height: 56, bgcolor: c.accent }}>
                      {c.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{c.name}</Typography>
                        {!c.isActive && <Chip size="small" label="Hidden" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {c.tagline || c.slug}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={plural(c.productCount || 0, 'product')} />
                        {c.startingPrice && (
                          <Chip size="small" variant="outlined" color="primary" label={'from ' + formatINR(c.startingPrice)} />
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, flex: 1, minHeight: 40 }}
                  >
                    {c.description || 'No description yet.'}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
                  >
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openForm(c)} aria-label={'Edit ' + c.name}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleting(c)} aria-label={'Delete ' + c.name}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <Chip size="small" label={'Order ' + c.order} variant="outlined" />
                    <Tooltip title={c.isActive ? 'Visible on the website' : 'Hidden from the website'}>
                      <Switch
                        size="small"
                        checked={Boolean(c.isActive)}
                        onChange={() => toggleActive(c)}
                        inputProps={{ 'aria-label': 'Show ' + c.name + ' on the website' }}
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
        title={editing?._id ? 'Edit category' : 'New category'}
        onClose={() => setEditing(null)}
        onSubmit={save}
        submitDisabled={!form.name}
        busy={busy}
      >
        <Stack spacing={2.5}>
          <TextField label="Name" fullWidth required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <TextField label="Tagline" fullWidth value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
          />
          <TextField
            label="Image URL"
            fullWidth
            value={form.image?.url || ''}
            onChange={(e) => set('image', { url: e.target.value })}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Icon"
              fullWidth
              helperText="Salad, Wheat, Sandwich, CookingPot, CupSoda"
              value={form.icon}
              onChange={(e) => set('icon', e.target.value)}
            />
            <TextField
              label="Accent colour"
              fullWidth
              value={form.accent}
              onChange={(e) => set('accent', e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box
                    sx={{
                      width: 18, height: 18, mr: 1, borderRadius: '50%', flexShrink: 0,
                      bgcolor: form.accent, border: '1px solid', borderColor: 'divider',
                    }}
                  />
                ),
              }}
            />
            <TextField
              label="Order"
              type="number"
              sx={{ width: { sm: 120 } }}
              value={form.order}
              onChange={(e) => set('order', e.target.value)}
            />
          </Stack>
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
            label="Visible on the website"
          />
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this category?"
        message={
          deleting
            ? 'You must move or delete the products inside "' + deleting.name + '" first. This cannot be undone.'
            : ''
        }
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
