import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, Switch,
  TextField, Tooltip, Typography, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FormDialog from '../components/FormDialog';
import CellText from '../components/CellText';
import Money from '../components/Money';
import { couponApi } from '../api/endpoints';
import { formatINR, formatDate } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

const inDays = (n) => {
  const d = new Date(Date.now() + n * 86400000);
  return d.toISOString().slice(0, 10);
};

const EMPTY = {
  code: '', description: '', discountType: 'percent', discountValue: 10, maxDiscount: '',
  minOrderValue: 0, expiresAt: inDays(30), usageLimit: 0, perUserLimit: 1,
  firstOrderOnly: false, isActive: true, isPublic: true,
};

const rupee = { startAdornment: <InputAdornment position="start">₹</InputAdornment> };
const percent = { endAdornment: <InputAdornment position="end">%</InputAdornment> };

export default function Coupons() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const snackbar = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    couponApi
      .list({ page: paginationModel.page + 1, limit: paginationModel.pageSize })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, snackbar]);

  useEffect(load, [load]);

  const openForm = (row) => {
    setEditing(row || {});
    setForm(
      row
        ? {
            ...EMPTY,
            ...row,
            maxDiscount: row.maxDiscount || '',
            expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString().slice(0, 10) : inDays(30),
          }
        : EMPTY
    );
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        expiresAt: form.expiresAt,
        usageLimit: Number(form.usageLimit) || 0,
        perUserLimit: Number(form.perUserLimit) || 1,
        firstOrderOnly: form.firstOrderOnly,
        isActive: form.isActive,
        isPublic: form.isPublic,
        ...(form.maxDiscount ? { maxDiscount: Number(form.maxDiscount) } : {}),
      };

      if (editing?._id) await couponApi.update(editing._id, payload);
      else await couponApi.create(payload);

      snackbar.success(editing?._id ? 'Coupon updated' : 'Coupon created');
      setEditing(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await couponApi.remove(deleting._id);
      snackbar.success('Coupon deleted');
      setDeleting(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const columns = [
    {
      field: 'code',
      headerName: 'Code',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => <CellText mono primary={row.code} secondary={row.description} />,
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 150,
      renderCell: ({ row }) => (
        <CellText
          primary={row.discountType === 'percent' ? row.discountValue + '% off' : formatINR(row.discountValue) + ' off'}
          secondary={row.maxDiscount > 0 ? 'max ' + formatINR(row.maxDiscount) : null}
        />
      ),
    },
    {
      field: 'minOrderValue',
      headerName: 'Min order',
      width: 120,
      renderCell: ({ row }) => <Money value={row.minOrderValue} />,
    },
    {
      field: 'usage',
      headerName: 'Usage',
      width: 150,
      renderCell: ({ row }) => {
        const pct = row.usageLimit ? Math.min((row.usedCount / row.usageLimit) * 100, 100) : 0;
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              {row.usedCount} {row.usageLimit ? '/ ' + row.usageLimit : 'used'}
            </Typography>
            {row.usageLimit > 0 && (
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{ mt: 0.5, height: 5, borderRadius: 999 }}
                aria-label={'Redeemed ' + row.usedCount + ' of ' + row.usageLimit}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 130,
      valueGetter: (_v, row) => formatDate(row.expiresAt),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 190,
      sortable: false,
      renderCell: ({ row }) => {
        const expired = new Date(row.expiresAt) < new Date();
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap gap={0.5} alignItems="center">
            <Chip
              size="small"
              label={expired ? 'Expired' : row.isActive ? 'Active' : 'Paused'}
              color={expired ? 'default' : row.isActive ? 'success' : 'warning'}
            />
            {row.firstOrderOnly && <Chip size="small" label="1st order" variant="outlined" />}
            {!row.isPublic && <Chip size="small" label="Private" variant="outlined" />}
          </Stack>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openForm(row)} aria-label={'Edit coupon ' + row.code}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleting(row)} aria-label={'Delete coupon ' + row.code}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add coupon
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Discounts applied to a single order at checkout. Public coupons also appear in the customer's Rewards page."
        action={addButton}
      />

      <FilterBar onRefresh={load} refreshing={loading} />

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        empty={{
          icon: LocalOfferIcon,
          title: 'No coupons yet',
          description: 'Create a discount code and customers can redeem it at checkout right away.',
          action: addButton,
        }}
      />

      <FormDialog
        open={Boolean(editing)}
        title={editing?._id ? 'Edit coupon' : 'New coupon'}
        onClose={() => setEditing(null)}
        onSubmit={save}
        submitDisabled={!form.code}
        busy={busy}
      >
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Code"
              fullWidth
              required
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              helperText="Customers type this at checkout"
              inputProps={{ style: { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontWeight: 700 } }}
            />
            <TextField select label="Type" fullWidth value={form.discountType} onChange={(e) => set('discountType', e.target.value)}>
              <MenuItem value="percent">Percentage</MenuItem>
              <MenuItem value="flat">Flat amount</MenuItem>
            </TextField>
          </Stack>

          <TextField label="Description" fullWidth value={form.description} onChange={(e) => set('description', e.target.value)} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Discount"
              type="number"
              fullWidth
              required
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              InputProps={form.discountType === 'percent' ? percent : rupee}
            />
            <TextField
              label="Max discount"
              type="number"
              fullWidth
              disabled={form.discountType === 'flat'}
              value={form.maxDiscount}
              onChange={(e) => set('maxDiscount', e.target.value)}
              InputProps={rupee}
              helperText={form.discountType === 'flat' ? 'Percentage coupons only' : 'Blank means no cap'}
            />
            <TextField
              label="Min order"
              type="number"
              fullWidth
              value={form.minOrderValue}
              onChange={(e) => set('minOrderValue', e.target.value)}
              InputProps={rupee}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Expires on"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.expiresAt}
              onChange={(e) => set('expiresAt', e.target.value)}
            />
            <TextField
              label="Total uses"
              type="number"
              fullWidth
              helperText="0 means unlimited"
              value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
            />
            <TextField
              label="Uses per customer"
              type="number"
              fullWidth
              value={form.perUserLimit}
              onChange={(e) => set('perUserLimit', e.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
              label="Active"
            />
            <FormControlLabel
              control={<Switch checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />}
              label="Show publicly"
            />
            <FormControlLabel
              control={<Switch checked={form.firstOrderOnly} onChange={(e) => set('firstOrderOnly', e.target.checked)} />}
              label="First order only"
            />
          </Stack>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this coupon?"
        message={deleting ? 'Code ' + deleting.code + ' will stop working immediately. Orders that already used it are unaffected.' : ''}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
