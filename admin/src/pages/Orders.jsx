import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, TextField, MenuItem, Button, Typography, IconButton, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import CellText from '../components/CellText';
import StatusChip from '../components/StatusChip';
import Money from '../components/Money';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { orderApi } from '../api/endpoints';
import {
  formatDateTime, ORDER_STATUSES, PAYMENT_STATUSES, nextStatus, humanize,
} from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';
import { getSocket } from '../lib/socket';

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [advancing, setAdvancing] = useState(null);

  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(() => {
    setLoading(true);
    orderApi
      .list({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, status, paymentStatus, debouncedSearch, snackbar]);

  useEffect(load, [load]);

  // A filter change invalidates the current page: page 3 of an unfiltered list
  // is usually empty once the list shrinks, so go back to the first page.
  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
  }, [debouncedSearch, status, paymentStatus]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('order:new', load);
    return () => socket.off('order:new', load);
  }, [load]);

  const advance = async (order) => {
    const next = nextStatus(order.status);
    if (!next) return;
    setAdvancing(order._id);
    try {
      await orderApi.updateStatus(order._id, next);
      snackbar.success(order.orderNumber + ' moved to ' + next);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setAdvancing(null);
    }
  };

  const columns = [
    {
      field: 'orderNumber',
      headerName: 'Order',
      minWidth: 190,
      flex: 1,
      renderCell: ({ row }) => (
        <CellText mono primary={row.orderNumber} secondary={formatDateTime(row.createdAt)} />
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      minWidth: 190,
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <CellText primary={row.user?.name || 'Guest'} secondary={row.contactPhone} />
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      valueGetter: (_v, row) => row.items?.reduce((s, i) => s + i.quantity, 0) || 0,
    },
    {
      field: 'slot',
      headerName: 'Delivery slot',
      minWidth: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <CellText
          strong={false}
          primary={row.deliverySlot?.label || '-'}
          secondary={formatDateTime(row.deliverySlot?.date)}
        />
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 150,
      renderCell: ({ row }) => (
        <Stack spacing={0.5} alignItems="flex-start" justifyContent="center" sx={{ height: '100%' }}>
          <Money value={row.pricing?.total} strong />
          <StatusChip
            kind="payment"
            value={row.payment?.status}
            variant="outlined"
            label={row.payment?.method?.toUpperCase() + ' · ' + humanize(row.payment?.status)}
            sx={{ fontSize: 10, height: 18 }}
          />
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: ({ row }) => <StatusChip kind="order" value={row.status} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 190,
      sortable: false,
      renderCell: ({ row }) => {
        const next = nextStatus(row.status);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Open order">
              <IconButton size="small" onClick={() => navigate('/orders/' + row._id)} aria-label="Open order">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {next && row.status !== 'Cancelled' && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                disabled={advancing === row._id}
                onClick={() => advance(row)}
                sx={{ fontSize: 11, px: 1.5 }}
              >
                {next}
              </Button>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Move each order through Confirmed, Preparing, Packed, Out for Delivery and Delivered. Customers see every change live."
      />

      <FilterBar onRefresh={load} refreshing={loading}>
        <TextField
          label="Search order number, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { sm: 320 } }}
        />
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All statuses</MenuItem>
          {ORDER_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Payment"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All payments</MenuItem>
          {PAYMENT_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>
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
        onRowDoubleClick={({ row }) => navigate('/orders/' + row._id)}
        empty={{
          icon: ReceiptIcon,
          title: search || status || paymentStatus ? 'No matching orders' : 'No orders yet',
          description:
            search || status || paymentStatus
              ? 'Try a different search term or clear the filters.'
              : 'Orders appear here the moment a customer checks out.',
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Tip: double-click a row to open the full order.
      </Typography>
    </>
  );
}
