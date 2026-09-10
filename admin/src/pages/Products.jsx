import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Button, Chip, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RestaurantIcon from '@mui/icons-material/RestaurantMenu';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import CellText from '../components/CellText';
import Money from '../components/Money';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { productApi, categoryApi } from '../api/endpoints';
import { plural } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

export default function Products() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    productApi
      .list({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(category ? { category } : {}),
      })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, debouncedSearch, category, snackbar]);

  useEffect(load, [load]);

  // A filter change invalidates the current page: page 3 of an unfiltered list
  // is usually empty once the list shrinks, so go back to the first page.
  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
  }, [debouncedSearch, category]);

  const toggle = async (row) => {
    try {
      const res = await productApi.toggle(row._id);
      snackbar.success(res.message);
      load();
    } catch (err) {
      snackbar.error(err.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await productApi.remove(deleting._id);
      snackbar.success('Product deleted');
      setDeleting(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Product',
      minWidth: 280,
      flex: 1.4,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, height: '100%' }}>
          <Avatar src={row.images?.[0]?.url} variant="rounded" sx={{ width: 46, height: 46 }}>
            {row.name?.[0]}
          </Avatar>
          <CellText
            primary={row.name}
            secondary={[row.category?.name, row.servingSize].filter(Boolean).join(' · ')}
          />
        </Stack>
      ),
    },
    {
      field: 'foodType',
      headerName: 'Type',
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row.foodType === 'veg' ? 'Veg' : 'Non-veg'}
          color={row.foodType === 'veg' ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 110,
      renderCell: ({ row }) => <Money value={row.price} strong />,
    },
    {
      field: 'nutrition',
      headerName: 'Nutrition (per serving)',
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography variant="caption" color="text.secondary">
          {Math.round(row.nutrition?.calories || 0)} kcal &middot; P {Math.round(row.nutrition?.protein || 0)}g
          &middot; F {Math.round(row.nutrition?.fibre || 0)}g
        </Typography>
      ),
    },
    {
      field: 'optionGroups',
      headerName: 'Customizable',
      width: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row.optionGroups?.length ? plural(row.optionGroups.length, 'group') : 'No'}
          color={row.optionGroups?.length ? 'primary' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'isAvailable',
      headerName: 'Live',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Tooltip title={row.isAvailable ? 'Visible on the website' : 'Hidden from the menu'}>
          <Switch
            size="small"
            checked={Boolean(row.isAvailable)}
            onChange={() => toggle(row)}
            inputProps={{ 'aria-label': 'Show ' + row.name + ' on the website' }}
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate('/products/' + row._id)} aria-label={'Edit ' + row.name}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleting(row)} aria-label={'Delete ' + row.name}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const filtered = Boolean(search || category);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Prices, images, ingredients, nutrition and customization options. Changes appear on the website immediately."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}>
            Add product
          </Button>
        }
      />

      <FilterBar onRefresh={load} refreshing={loading}>
        <TextField
          label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { sm: 300 } }}
        />
        <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c._id} value={c.slug}>{c.name}</MenuItem>
          ))}
        </TextField>
      </FilterBar>

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        empty={{
          icon: RestaurantIcon,
          title: filtered ? 'No matching products' : 'No products yet',
          description: filtered
            ? 'Try a different search term or clear the filters.'
            : 'Add your first snack and it goes live on the menu straight away.',
          action: !filtered && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}>
              Add product
            </Button>
          ),
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this product?"
        message={
          deleting
            ? '"' + deleting.name + '" will be removed from the menu permanently. Past orders keep their own price and nutrition snapshots, so order history is unaffected.'
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
