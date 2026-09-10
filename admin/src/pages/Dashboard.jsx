import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid, Typography, Box, Stack, Button, Alert, LinearProgress, Skeleton,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import TodayIcon from '@mui/icons-material/Today';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/RestaurantMenu';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';
import Money from '../components/Money';
import CellText from '../components/CellText';
import { dashboardApi, orderApi } from '../api/endpoints';
import { formatINR, formatDateTime, ORDER_STATUS_COLOR, ORDER_STATUSES } from '../lib/utils';
import { getSocket } from '../lib/socket';
import { tokens } from '../theme';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    Promise.all([dashboardApi.stats(), orderApi.list({ limit: 6 })])
      .then(([s, o]) => {
        setStats(s.data);
        setRecent(o.data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('order:new', load);
    return () => socket.off('order:new', load);
  }, []);

  const activeStatuses = ORDER_STATUSES.slice(0, 4);
  const activeTotal = activeStatuses.reduce((sum, s) => sum + (stats?.byStatus?.[s] || 0), 0);
  const closed = [
    ['Delivered', stats?.byStatus?.Delivered || 0],
    ['Cancelled', stats?.byStatus?.Cancelled || 0],
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live view of today's kitchen. Every order here is a single, on-demand order."
        action={
          <Button component={Link} to="/orders" variant="contained" startIcon={<ReceiptIcon />}>
            Manage orders
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={TodayIcon}
            label="Today's orders"
            value={stats?.todayOrders ?? 0}
            hint={formatINR(stats?.todayRevenue || 0) + ' today'}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={PaymentsIcon}
            label="Total revenue"
            value={formatINR(stats?.totalRevenue || 0)}
            hint="Excludes cancelled orders"
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={ReceiptIcon}
            label="Total orders"
            value={stats?.totalOrders ?? 0}
            hint={activeTotal + ' currently in progress'}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={PeopleIcon}
            label="Customers"
            value={stats?.customers ?? 0}
            hint={(stats?.activeProducts ?? 0) + ' products live'}
            color="success"
            loading={loading}
          />
        </Grid>

        {/* --------------------------- Kitchen queue --------------------------- */}
        <Grid item xs={12} lg={5}>
          <SectionCard title="Kitchen queue" description="Orders waiting to move through the pipeline.">
            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Stack spacing={2}>
              {activeStatuses.map((status) => {
                const count = stats?.byStatus?.[status] || 0;
                const pct = activeTotal ? (count / activeTotal) * 100 : 0;
                return (
                  <Box key={status}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <StatusChip kind="order" value={status} variant="outlined" />
                      <Typography variant="body2" fontWeight={700}>{count}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={ORDER_STATUS_COLOR[status]}
                      sx={{ height: 6, borderRadius: 999 }}
                      aria-label={status + ' orders'}
                    />
                  </Box>
                );
              })}

              <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                {closed.map(([label, value]) => (
                  <Stack key={label} direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{value}</Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </SectionCard>
        </Grid>

        {/* -------------------------- Top selling snacks ------------------------ */}
        <Grid item xs={12} lg={7}>
          <SectionCard
            title={
              <Stack direction="row" alignItems="center" spacing={1} component="span">
                <TrendingUpIcon color="primary" fontSize="small" />
                <span>Top selling snacks</span>
              </Stack>
            }
            description="Units sold across every order placed so far."
          >
            {loading ? (
              <Skeleton variant="rounded" height={260} />
            ) : stats?.topProducts?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.topProducts} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.gridline} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: tokens.hover }}
                    formatter={(value, name) => (name === 'revenue' ? formatINR(value) : value)}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,.08)', fontSize: 13 }}
                  />
                  <Bar dataKey="quantity" name="Units sold" fill={tokens.chart[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={RestaurantIcon}
                title="No sales data yet"
                description="Your best selling snacks chart here once the first orders come through."
              />
            )}
          </SectionCard>
        </Grid>

        {/* ---------------------------- Recent orders --------------------------- */}
        <Grid item xs={12}>
          <SectionCard
            title="Recent orders"
            action={<Button component={Link} to="/orders" size="small">View all</Button>}
          >
            {loading ? (
              <Stack spacing={1.5}>
                {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
              </Stack>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={ReceiptIcon}
                dense
                title="No orders yet"
                description="New orders appear here the moment a customer checks out."
              />
            ) : (
              <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                {recent.map((order) => (
                  <Stack
                    key={order._id}
                    component={Link}
                    to={'/orders/' + order._id}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    sx={{
                      py: 1.75, px: 1, mx: -1, borderRadius: 2,
                      textDecoration: 'none', color: 'inherit',
                      '&:hover': { bgcolor: 'hover' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                    }}
                  >
                    <CellText
                      mono
                      primary={order.orderNumber}
                      secondary={(order.user?.name || order.contactEmail) + ' · ' + formatDateTime(order.createdAt)}
                    />
                    <Stack direction="row" spacing={1.5} alignItems="center" flexShrink={0}>
                      <StatusChip kind="order" value={order.status} />
                      <StatusChip kind="payment" value={order.payment?.status} variant="outlined" />
                      <Money value={order.pricing.total} strong />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
