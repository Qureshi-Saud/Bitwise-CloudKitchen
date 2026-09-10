import { useCallback, useEffect, useState } from 'react';
import {
  Avatar, Box, Chip, Stack, TextField, Typography, MenuItem, IconButton, Tooltip, Divider, Skeleton,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FormDialog from '../components/FormDialog';
import EmptyState from '../components/EmptyState';
import CellText from '../components/CellText';
import StatusChip from '../components/StatusChip';
import Money from '../components/Money';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { customerApi } from '../api/endpoints';
import { formatDate, formatDateTime, initials, humanize } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const ROLES = ['customer', 'staff', 'admin'];

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [blockTarget, setBlockTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const snackbar = useSnackbar();
  const { isAdmin } = useAdminAuth();
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(() => {
    setLoading(true);
    customerApi
      .list({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(role ? { role } : {}),
      })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, debouncedSearch, role, snackbar]);

  useEffect(load, [load]);

  // A filter change invalidates the current page: page 3 of an unfiltered list
  // is usually empty once the list shrinks, so go back to the first page.
  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
  }, [debouncedSearch, role]);

  const openDetail = async (row) => {
    setDetailLoading(true);
    setDetail({ user: row, orders: [] });
    try {
      const res = await customerApi.get(row._id);
      setDetail(res.data);
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      const res = await customerApi.toggleBlock(blockTarget._id);
      snackbar.success(res.message);
      setBlockTarget(null);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (row, value) => {
    try {
      await customerApi.changeRole(row._id, value);
      snackbar.success('Role updated to ' + value);
      load();
    } catch (err) {
      snackbar.error(err.message);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Customer',
      minWidth: 260,
      flex: 1.3,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, height: '100%' }}>
          <Avatar src={row.avatar?.url} sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 13 }}>
            {initials(row.name)}
          </Avatar>
          <CellText
            primary={
              <Stack direction="row" spacing={0.75} alignItems="center" component="span">
                <span>{row.name}</span>
                {row.isEmailVerified && (
                  <Tooltip title="Email verified">
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  </Tooltip>
                )}
              </Stack>
            }
            secondary={row.email}
          />
        </Stack>
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 140, valueGetter: (_v, row) => row.phone || '-' },
    {
      field: 'orders',
      headerName: 'Orders',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_v, row) => row.stats?.totalOrders || 0,
    },
    {
      field: 'spent',
      headerName: 'Lifetime spend',
      width: 150,
      renderCell: ({ row }) => <Money value={row.stats?.totalSpent || 0} strong />,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: ({ row }) =>
        isAdmin ? (
          <TextField
            select
            size="small"
            variant="standard"
            value={row.role}
            onChange={(e) => changeRole(row, e.target.value)}
            sx={{ width: 120 }}
            inputProps={{ 'aria-label': 'Role for ' + row.name }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>{humanize(r)}</MenuItem>
            ))}
          </TextField>
        ) : (
          <Chip size="small" label={humanize(row.role)} variant="outlined" />
        ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 130,
      valueGetter: (_v, row) => formatDate(row.createdAt),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => openDetail(row)} aria-label={'View ' + row.name}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && row.role !== 'admin' && (
            <Tooltip title={row.isBlocked ? 'Unblock' : 'Block'}>
              <IconButton
                size="small"
                color={row.isBlocked ? 'success' : 'error'}
                onClick={() => setBlockTarget(row)}
                aria-label={(row.isBlocked ? 'Unblock ' : 'Block ') + row.name}
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const filtered = Boolean(search || role);

  const stat = (label, value) => (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );

  return (
    <>
      <PageHeader title="Customers" subtitle="Accounts, order counts and lifetime spend across all one-time orders." />

      <FilterBar onRefresh={load} refreshing={loading}>
        <TextField
          label="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { sm: 300 } }}
        />
        <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{humanize(r)}</MenuItem>
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
        getRowClassName={({ row }) => (row.isBlocked ? 'blocked-row' : '')}
        sx={{ '& .blocked-row': { opacity: 0.55 } }}
        empty={{
          icon: PeopleIcon,
          title: filtered ? 'No matching customers' : 'No customers yet',
          description: filtered
            ? 'Try a different search term or clear the filters.'
            : 'Accounts appear here as soon as people start signing up.',
        }}
      />

      <FormDialog
        open={Boolean(detail)}
        title="Customer details"
        onClose={() => setDetail(null)}
        cancelLabel="Close"
      >
        {detail && (
          <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar src={detail.user.avatar?.url} sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                {initials(detail.user.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="h2" sx={{ fontSize: '1rem' }}>{detail.user.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{detail.user.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={humanize(detail.user.role)} color="primary" variant="outlined" />
                  <Chip
                    size="small"
                    label={detail.user.isEmailVerified ? 'Verified' : 'Unverified'}
                    color={detail.user.isEmailVerified ? 'success' : 'warning'}
                    variant="outlined"
                  />
                  {detail.user.isBlocked && <Chip size="small" label="Blocked" color="error" />}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={4} sx={{ mb: 2.5 }}>
              {stat('Orders', detail.user.stats?.totalOrders || 0)}
              {stat('Lifetime spend', <Money value={detail.user.stats?.totalSpent || 0} variant="h6" strong />)}
              {stat('Reward points', detail.user.rewardPoints || 0)}
            </Stack>

            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Recent orders
            </Typography>

            {detailLoading ? (
              <Stack spacing={1}>
                {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} />)}
              </Stack>
            ) : detail.orders?.length ? (
              <Stack divider={<Divider />}>
                {detail.orders.map((o) => (
                  <Stack key={o._id} direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                    <CellText mono primary={o.orderNumber} secondary={formatDateTime(o.createdAt)} />
                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      <StatusChip kind="order" value={o.status} />
                      <Money value={o.pricing?.total} strong />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <EmptyState dense title="No orders yet" description="This customer has not placed an order." />
            )}
          </>
        )}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(blockTarget)}
        title={blockTarget?.isBlocked ? 'Unblock this customer?' : 'Block this customer?'}
        message={
          blockTarget?.isBlocked
            ? blockTarget.name + ' will be able to sign in and order again.'
            : (blockTarget?.name || '') + ' will be signed out of every device and prevented from ordering.'
        }
        confirmLabel={blockTarget?.isBlocked ? 'Unblock' : 'Block'}
        confirmColor={blockTarget?.isBlocked ? 'primary' : 'error'}
        loading={busy}
        onConfirm={toggleBlock}
        onClose={() => setBlockTarget(null)}
      />
    </>
  );
}
