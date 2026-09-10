import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, MenuItem, Stack, TextField, Typography, Divider, Link as MuiLink, Chip,
} from '@mui/material';
import MailIcon from '@mui/icons-material/MarkEmailUnread';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import FormDialog from '../components/FormDialog';
import CellText from '../components/CellText';
import StatusChip from '../components/StatusChip';
import { contactApi } from '../api/endpoints';
import { formatDateTime, CONTACT_STATUSES, humanize, plural } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';
import { getSocket } from '../lib/socket';

const SUBJECT_LABEL = {
  general: 'General enquiry',
  order: 'Order question',
  bulk: 'Bulk / office order',
  feedback: 'Feedback',
  partnership: 'Partnership',
  support: 'Support issue',
};

export default function ContactRequests() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const snackbar = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    contactApi
      .list({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(status ? { status } : {}),
      })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
        setNewCount(res.meta?.newCount || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, status, snackbar]);

  useEffect(load, [load]);

  // A filter change invalidates the current page: page 3 of an unfiltered list
  // is usually empty once the list shrinks, so go back to the first page.
  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
  }, [status]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      snackbar.info('New contact request received');
      load();
    };
    socket.on('contact:new', handler);
    return () => socket.off('contact:new', handler);
  }, [load, snackbar]);

  const update = async (id, patch) => {
    setBusy(true);
    try {
      await contactApi.update(id, patch);
      snackbar.success('Request updated');
      setOpen(null);
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
      headerName: 'From',
      minWidth: 210,
      flex: 1,
      renderCell: ({ row }) => <CellText primary={row.name} secondary={row.email} />,
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 180,
      renderCell: ({ row }) => (
        <Chip size="small" variant="outlined" label={SUBJECT_LABEL[row.subject] || humanize(row.subject)} />
      ),
    },
    {
      field: 'message',
      headerName: 'Message',
      minWidth: 280,
      flex: 1.5,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {row.message}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Received',
      width: 170,
      valueGetter: (_v, row) => formatDateTime(row.createdAt),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ row }) => <StatusChip kind="contact" value={row.status} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => { setOpen(row); setNote(row.adminNote || ''); }}
          aria-label={'Open request from ' + row.name}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contact Requests"
        subtitle={
          newCount > 0
            ? plural(newCount, 'new request') + ' waiting for a reply'
            : 'Every request has been handled.'
        }
      />

      <FilterBar onRefresh={load} refreshing={loading}>
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">All requests</MenuItem>
          {CONTACT_STATUSES.map((s) => (
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
        empty={{
          icon: MailIcon,
          title: status ? 'No matching requests' : 'No contact requests',
          description: status
            ? 'Try a different status filter.'
            : 'Messages sent through the storefront contact form arrive here.',
        }}
      />

      <FormDialog
        open={Boolean(open)}
        title="Contact request"
        onClose={() => setOpen(null)}
        cancelLabel="Close"
        busy={busy}
        extraActions={
          open && (
            <>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => update(open._id, { status: 'in-progress', adminNote: note })}
              >
                Mark in progress
              </Button>
              <Button
                variant="contained"
                disabled={busy}
                onClick={() => update(open._id, { status: 'resolved', adminNote: note })}
              >
                Mark resolved
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>{open.name}</Typography>
                <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                  <MuiLink href={'mailto:' + open.email} variant="body2">{open.email}</MuiLink>
                  {open.phone && <MuiLink href={'tel:' + open.phone} variant="body2">{open.phone}</MuiLink>}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {SUBJECT_LABEL[open.subject] || humanize(open.subject)} &middot; {formatDateTime(open.createdAt)}
                </Typography>
              </Box>
              <StatusChip kind="contact" value={open.status} />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2.5, lineHeight: 1.7 }}>
              {open.message}
            </Typography>

            <TextField
              label="Internal note"
              fullWidth
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              helperText="Only visible to your team."
            />
          </>
        )}
      </FormDialog>
    </>
  );
}
