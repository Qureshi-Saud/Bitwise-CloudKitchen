import { useCallback, useEffect, useState } from 'react';
import {
  Box, Chip, IconButton, MenuItem, Rating, Stack, TextField, Tooltip, Typography, Avatar,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/StarRate';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FormDialog from '../components/FormDialog';
import CellText from '../components/CellText';
import { reviewApi } from '../api/endpoints';
import { formatDate, initials, REVIEW_STATUSES, humanize, plural } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [reply, setReply] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const snackbar = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    reviewApi
      .list({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...(status ? { status } : {}),
        ...(rating ? { rating } : {}),
      })
      .then((res) => {
        setRows(res.data);
        setRowCount(res.meta?.total || 0);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  }, [paginationModel, status, rating, snackbar]);

  useEffect(load, [load]);

  // A filter change invalidates the current page: page 3 of an unfiltered list
  // is usually empty once the list shrinks, so go back to the first page.
  useEffect(() => {
    setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
  }, [status, rating]);

  const moderate = async (row, patch) => {
    try {
      await reviewApi.moderate(row._id, patch);
      snackbar.success('Review updated');
      load();
    } catch (err) {
      snackbar.error(err.message);
    }
  };

  const sendReply = async () => {
    setBusy(true);
    try {
      await reviewApi.moderate(replyTarget._id, { reply: reply.trim() });
      snackbar.success('Reply posted and the customer has been notified');
      setReplyTarget(null);
      setReply('');
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
      await reviewApi.remove(deleting._id);
      snackbar.success('Review deleted');
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
      field: 'user',
      headerName: 'Customer',
      minWidth: 190,
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, height: '100%' }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 12, bgcolor: 'primary.main' }}>
            {initials(row.user?.name)}
          </Avatar>
          <CellText primary={row.user?.name || 'Customer'} secondary={formatDate(row.createdAt)} />
        </Stack>
      ),
    },
    {
      field: 'product',
      headerName: 'Product',
      minWidth: 160,
      flex: 0.7,
      sortable: false,
      valueGetter: (_v, row) => row.product?.name || '-',
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 140,
      renderCell: ({ row }) => (
        <Rating value={row.rating} readOnly size="small" aria-label={plural(row.rating, 'star')} />
      ),
    },
    {
      field: 'comment',
      headerName: 'Review',
      minWidth: 260,
      flex: 1.4,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          {row.title && <Typography variant="body2" fontWeight={700} noWrap>{row.title}</Typography>}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {row.comment || '(no comment)'}
          </Typography>
          {row.adminReply?.text && (
            <Chip size="small" label="Replied" color="primary" variant="outlined" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
          )}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: ({ row }) => (
        <TextField
          select
          size="small"
          variant="standard"
          value={row.status}
          onChange={(e) => moderate(row, { status: e.target.value })}
          sx={{ width: 120 }}
          inputProps={{ 'aria-label': 'Moderation status' }}
        >
          {REVIEW_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Reply">
            <IconButton
              size="small"
              onClick={() => { setReplyTarget(row); setReply(row.adminReply?.text || ''); }}
              aria-label="Reply to review"
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleting(row)} aria-label="Delete review">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const filtered = Boolean(status || rating);

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Moderate customer ratings and reply from the kitchen. Replies appear on the product page and notify the customer."
      />

      <FilterBar onRefresh={load} refreshing={loading}>
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All statuses</MenuItem>
          {REVIEW_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All ratings</MenuItem>
          {[5, 4, 3, 2, 1].map((r) => (
            <MenuItem key={r} value={r}>{plural(r, 'star')}</MenuItem>
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
          icon: StarIcon,
          title: filtered ? 'No matching reviews' : 'No reviews yet',
          description: filtered
            ? 'Try a different filter combination.'
            : 'Customer ratings land here once people start reviewing your snacks.',
        }}
      />

      <FormDialog
        open={Boolean(replyTarget)}
        title="Reply from the kitchen"
        onClose={() => setReplyTarget(null)}
        onSubmit={sendReply}
        submitLabel="Post reply"
        submitDisabled={reply.trim().length < 3}
        busy={busy}
      >
        {replyTarget && (
          <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, bgcolor: 'surface' }}>
            <Rating value={replyTarget.rating} readOnly size="small" />
            {replyTarget.title && <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{replyTarget.title}</Typography>}
            <Typography variant="body2" color="text.secondary">{replyTarget.comment}</Typography>
          </Box>
        )}
        <TextField
          label="Your reply"
          fullWidth
          multiline
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Thank the customer, or explain how you will fix the issue."
          helperText="Shown publicly on the product page."
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this review?"
        message="The review will be removed and the product rating recalculated. This cannot be undone."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
