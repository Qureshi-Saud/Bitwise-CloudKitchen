import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid, Typography, Stack, Button, Box, Divider, Stepper, Step, StepLabel, TextField, Avatar,
  Alert, MenuItem, useMediaQuery, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import ReplayIcon from '@mui/icons-material/Replay';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { DetailSkeleton } from '../components/Skeletons';
import StatusChip from '../components/StatusChip';
import Money from '../components/Money';
import { orderApi, paymentApi } from '../api/endpoints';
import { formatINR, formatDateTime, ORDER_STATUSES, nextStatus, humanize } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const FLOW = ORDER_STATUSES.slice(0, 5);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { isAdmin } = useAdminAuth();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const load = () => {
    orderApi
      .get(id)
      .then((res) => {
        setOrder(res.data);
        setTarget(nextStatus(res.data.status) || res.data.status);
      })
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const updateStatus = async () => {
    setSaving(true);
    try {
      await orderApi.updateStatus(id, target, note.trim() || undefined);
      snackbar.success('Order moved to ' + target);
      setNote('');
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refund = async () => {
    setSaving(true);
    try {
      await paymentApi.refund(id, order.pricing.total);
      snackbar.success('Refund initiated');
      setRefundOpen(false);
      load();
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailSkeleton label="Loading order" />;
  if (!order) return <Alert severity="error">Order not found.</Alert>;

  const activeStep = order.status === 'Cancelled' ? -1 : FLOW.indexOf(order.status);
  const isClosed = ['Delivered', 'Cancelled'].includes(order.status);

  const breakdown = [
    ['Items', order.pricing.itemsTotal],
    ['Customization', order.pricing.customizationTotal],
    ['Delivery', order.pricing.deliveryFee],
    ['Tax', order.pricing.tax],
  ];

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={'Placed ' + formatDateTime(order.createdAt) + ' by ' + (order.user?.name || order.contactEmail)}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
              Back
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
              Print
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12}>
          <SectionCard divider={false}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
              <StatusChip kind="order" value={order.status} size="medium" />
              <StatusChip
                kind="payment"
                value={order.payment.status}
                size="medium"
                variant="outlined"
                label={order.payment.method.toUpperCase() + ' · ' + humanize(order.payment.status)}
              />
            </Stack>

            {order.status === 'Cancelled' ? (
              <Alert severity="error">
                Cancelled {formatDateTime(order.cancelledAt)}
                {order.cancellationReason ? ' — ' + order.cancellationReason : ''}
              </Alert>
            ) : (
              <Stepper
                activeStep={activeStep}
                alternativeLabel={!isNarrow}
                orientation={isNarrow ? 'vertical' : 'horizontal'}
                sx={{ mb: 1 }}
              >
                {FLOW.map((step) => {
                  const event = order.statusHistory?.find((h) => h.status === step);
                  return (
                    <Step key={step}>
                      <StepLabel
                        optional={
                          event ? (
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(event.at)}
                            </Typography>
                          ) : null
                        }
                      >
                        {step}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard title="Items" sx={{ mb: 2.5 }}>
            <Stack divider={<Divider />}>
              {order.items.map((item, i) => (
                <Stack key={i} direction="row" spacing={2} sx={{ py: 2 }}>
                  <Avatar src={item.image} variant="rounded" sx={{ width: 56, height: 56 }}>
                    {item.name?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.categoryName} &middot; {item.foodType === 'veg' ? 'Veg' : 'Non-veg'} &middot; Qty {item.quantity}
                    </Typography>

                    {item.customizations?.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {item.customizations
                          .map((c) => c.groupTitle + ': ' + c.selections.map((s) => s.label).join(', '))
                          .join(' · ')}
                      </Typography>
                    )}

                    {item.boxItems?.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Box: {item.boxItems.map((b) => b.quantity + 'x ' + b.name).join(', ')}
                      </Typography>
                    )}

                    {item.nutritionSnapshot && (
                      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                        Snapshot: {Math.round(item.nutritionSnapshot.calories || 0)} kcal ·{' '}
                        {Math.round(item.nutritionSnapshot.protein || 0)}g protein
                      </Typography>
                    )}

                    {item.specialInstructions && (
                      <Alert severity="info" sx={{ mt: 1, py: 0 }}>{item.specialInstructions}</Alert>
                    )}
                  </Box>
                  <Money value={item.lineTotal} variant="subtitle2" strong color="text.primary" />
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              {breakdown.map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Money value={value} />
                </Stack>
              ))}
              {order.pricing.discount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Discount {order.coupon?.code ? '(' + order.coupon.code + ')' : ''}
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    -{formatINR(order.pricing.discount)}
                  </Typography>
                </Stack>
              )}
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Money value={order.pricing.total} variant="subtitle1" strong />
              </Stack>
            </Stack>
          </SectionCard>

          {order.customerNote && (
            <Alert severity="info" sx={{ mb: 2.5 }}>
              <strong>Customer note:</strong> {order.customerNote}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Update status" sx={{ mb: 2.5 }}>
            {isClosed ? (
              <Alert severity="success">
                This order is {order.status.toLowerCase()} and can no longer be advanced.
              </Alert>
            ) : (
              <Stack spacing={2}>
                <TextField select label="Move to" value={target} onChange={(e) => setTarget(e.target.value)} fullWidth>
                  {ORDER_STATUSES.filter((s) => FLOW.indexOf(s) >= FLOW.indexOf(order.status) || s === 'Cancelled').map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Note for the customer (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  inputProps={{ maxLength: 200 }}
                  helperText={note.length + '/200'}
                />
                <Button variant="contained" onClick={updateStatus} disabled={saving || target === order.status}>
                  {saving ? 'Updating...' : 'Update status'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  The customer sees this change instantly on their Track Order page and receives an email.
                </Typography>
              </Stack>
            )}

            {isAdmin && order.payment.status === 'paid' && order.payment.method !== 'cod' && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Button color="error" variant="outlined" startIcon={<ReplayIcon />} onClick={() => setRefundOpen(true)} fullWidth>
                  Refund {formatINR(order.pricing.total)}
                </Button>
              </>
            )}
          </SectionCard>

          <SectionCard title="Delivery" sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2">{order.deliveryAddress.fullName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              {order.deliveryAddress.line1}
              {order.deliveryAddress.line2 ? ', ' + order.deliveryAddress.line2 : ''}
              {order.deliveryAddress.landmark ? ', near ' + order.deliveryAddress.landmark : ''}
              <br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              <br />
              {order.deliveryAddress.phone}
            </Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>Slot</Typography>
            <Typography variant="body2">{order.deliverySlot.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(order.deliverySlot.date)}
            </Typography>
          </SectionCard>

          <SectionCard title="History">
            <Stack spacing={1.5}>
              {order.statusHistory?.map((h, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ minWidth: 118, flexShrink: 0 }}>
                    <StatusChip kind="order" value={h.status} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" display="block">{formatDateTime(h.at)}</Typography>
                    {h.note && <Typography variant="caption" color="text.secondary">{h.note}</Typography>}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={refundOpen}
        title="Refund this order?"
        message={'This will refund ' + formatINR(order.pricing.total) + ' to the customer through Razorpay. It cannot be undone.'}
        confirmLabel="Refund"
        loading={saving}
        onConfirm={refund}
        onClose={() => setRefundOpen(false)}
      />
    </>
  );
}
