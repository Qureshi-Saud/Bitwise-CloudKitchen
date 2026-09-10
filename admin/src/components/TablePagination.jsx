import { Box, IconButton, MenuItem, Select, Typography } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  gridRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from '@mui/x-data-grid';

/**
 * The one pagination bar the whole panel uses.
 *
 * Left:  "Rows per page: [n]"  +  the visible range out of the total.
 * Right: "Page x of y"  +  first / prev / current / next / last controls.
 *
 * `PaginationBar` is presentational so non-DataGrid lists can share it;
 * the default export adapts it to the DataGrid pagination slot.
 */

const navButtonSx = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'hover' },
  '&.Mui-disabled': { opacity: 0.4, borderColor: 'divider' },
};

export function PaginationBar({
  page,
  pageCount,
  pageSize,
  rowCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const lastPage = Math.max(pageCount - 1, 0);
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(rowCount, (page + 1) * pageSize);

  const go = (next) => () => onPageChange(Math.min(Math.max(next, 0), lastPage));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        width: '100%',
        px: 2,
        py: 1.25,
      }}
    >
      {/* ------------------------------ Left ------------------------------ */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>

        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          size="small"
          aria-label="Rows per page"
          sx={{
            minWidth: 84,
            borderRadius: 2,
            fontSize: '.875rem',
            fontWeight: 600,
            '& .MuiSelect-select': { py: 0.75 },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>

        <Typography variant="body2" color="text.secondary">
          {from}–{to} of <Box component="strong" sx={{ color: 'text.primary' }}>{rowCount}</Box>
        </Typography>
      </Box>

      {/* ------------------------------ Right ----------------------------- */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
          Page <Box component="strong" sx={{ color: 'text.primary' }}>{Math.min(page + 1, Math.max(pageCount, 1))}</Box> of{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>{Math.max(pageCount, 1)}</Box>
        </Typography>

        <IconButton size="small" sx={navButtonSx} disabled={page === 0} onClick={go(0)} aria-label="First page">
          <FirstPageIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={navButtonSx} disabled={page === 0} onClick={go(page - 1)} aria-label="Previous page">
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Box
          aria-current="page"
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: '.8125rem',
            fontWeight: 700,
          }}
        >
          {Math.min(page + 1, Math.max(pageCount, 1))}
        </Box>

        <IconButton size="small" sx={navButtonSx} disabled={page >= lastPage} onClick={go(page + 1)} aria-label="Next page">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={navButtonSx} disabled={page >= lastPage} onClick={go(lastPage)} aria-label="Last page">
          <LastPageIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

/** DataGrid `slots.pagination` adapter — reads and writes the grid's own state. */
export default function DataGridPagination(props) {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);
  const rowCount = useGridSelector(apiRef, gridRowCountSelector);

  return (
    <PaginationBar
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      rowCount={rowCount}
      onPageChange={(next) => apiRef.current.setPage(next)}
      onPageSizeChange={(size) => {
        apiRef.current.setPageSize(size);
        apiRef.current.setPage(0);
      }}
      pageSizeOptions={props.pageSizeOptions}
    />
  );
}
