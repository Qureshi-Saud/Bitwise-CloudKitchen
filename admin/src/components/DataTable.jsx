import { Card } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EmptyState from './EmptyState';
import DataGridPagination from './TablePagination';

/**
 * Thin wrapper so every admin table shares the same look and defaults.
 *
 * Pages pass an `empty` descriptor rather than styling their own "no rows"
 * message, so an empty table reads the same as an empty card grid.
 */
export default function DataTable({
  rows, columns, loading, rowCount, paginationModel, onPaginationModelChange, empty, sx,
  pageSizeOptions = [10, 20, 50], ...rest
}) {
  const serverSide = rowCount !== undefined;

  const NoRows = () => (
    <EmptyState
      dense
      icon={empty?.icon}
      title={empty?.title || 'Nothing here yet'}
      description={empty?.description}
      action={empty?.action}
    />
  );

  return (
    <Card>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id || row.id}
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        rowHeight={64}
        pageSizeOptions={pageSizeOptions}
        slots={{ noRowsOverlay: NoRows, pagination: DataGridPagination }}
        slotProps={{
          loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
          pagination: { pageSizeOptions },
        }}
        {...(serverSide
          ? { rowCount, paginationMode: 'server', paginationModel, onPaginationModelChange }
          : { initialState: { pagination: { paginationModel: { pageSize: 20 } } } })}
        sx={{
          border: 0,
          '--DataGrid-overlayHeight': '280px',
          '& .MuiDataGrid-columnHeader': { bgcolor: 'surface' },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
          '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-row:hover': { bgcolor: 'hover' },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'surface',
            minHeight: 56,
          },
          ...sx,
        }}
        {...rest}
      />
    </Card>
  );
}
