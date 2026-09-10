import { useEffect, useState } from 'react';
import {
  Grid, Typography, TextField, Button, Stack, Box, IconButton, InputAdornment,
  Switch, FormControlLabel, Alert, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import EmptyState from '../components/EmptyState';
import { FormSkeleton } from '../components/Skeletons';
import { snackBoxApi } from '../api/endpoints';
import { useSnackbar } from '../context/SnackbarContext';

const NUTRIENTS = [
  ['calories', 'kcal'], ['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat'], ['fibre', 'Fibre'],
];

const rupee = { startAdornment: <InputAdornment position="start">₹</InputAdornment> };
const percent = { endAdornment: <InputAdornment position="end">%</InputAdornment> };

export default function SnackBoxConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const snackbar = useSnackbar();

  useEffect(() => {
    snackBoxApi
      .config()
      .then((res) => setConfig(res.data))
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setConfig((c) => ({ ...c, [key]: value }));

  const updateTier = (i, patch) =>
    set('sizeTiers', config.sizeTiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const updateExtra = (i, patch) =>
    set('extras', config.extras.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const save = async () => {
    setSaving(true);
    try {
      await snackBoxApi.update({
        title: config.title,
        subtitle: config.subtitle,
        minItems: Number(config.minItems),
        maxItems: Number(config.maxItems),
        packagingFee: Number(config.packagingFee) || 0,
        isActive: config.isActive,
        sizeTiers: config.sizeTiers.map((t) => ({
          items: Number(t.items),
          label: t.label,
          discountPercent: Number(t.discountPercent) || 0,
        })),
        extras: config.extras.map((e) => ({
          key: e.key,
          label: e.label,
          price: Number(e.price) || 0,
          nutritionDelta: e.nutritionDelta,
          isAvailable: e.isAvailable,
        })),
      });
      snackbar.success('Snack box configuration saved. The website is already using it.');
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton label="Loading configuration" rail={false} sections={3} />;
  if (!config) return <Alert severity="error">Could not load the snack box configuration.</Alert>;

  const addTier = () =>
    set('sizeTiers', [...config.sizeTiers, { items: 2, label: 'New tier', discountPercent: 0 }]);

  const addExtra = () =>
    set('extras', [
      ...config.extras,
      {
        key: 'extra-' + (config.extras.length + 1),
        label: 'New extra',
        price: 20,
        nutritionDelta: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
        isAvailable: true,
      },
    ]);

  return (
    <>
      <PageHeader
        title="Snack Box"
        subtitle="Configure the Build Your Own Snack Box page. Products appear here automatically when marked snack-box eligible."
        action={
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save configuration'}
          </Button>
        }
      />

      <Alert severity="warning" sx={{ mb: 2.5 }}>
        <strong>This is a one-time box, not a subscription.</strong> There are no cycles, renewals or recurring
        charges anywhere in this feature, and none should be added — it would conflict with the core business model.
      </Alert>

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12} lg={5}>
          <SectionCard title="Page copy" sx={{ mb: 2.5 }}>
            <Stack spacing={2.5}>
              <TextField label="Title" fullWidth value={config.title} onChange={(e) => set('title', e.target.value)} />
              <TextField
                label="Subtitle"
                fullWidth
                multiline
                rows={3}
                value={config.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
              />
              <FormControlLabel
                control={<Switch checked={config.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
                label="Snack box builder is live"
              />
            </Stack>
          </SectionCard>

          <SectionCard title="Box limits" description="What a customer may put in a single box.">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Minimum items"
                type="number"
                fullWidth
                value={config.minItems}
                onChange={(e) => set('minItems', e.target.value)}
              />
              <TextField
                label="Maximum items"
                type="number"
                fullWidth
                value={config.maxItems}
                onChange={(e) => set('maxItems', e.target.value)}
              />
              <TextField
                label="Packaging fee"
                type="number"
                fullWidth
                value={config.packagingFee}
                onChange={(e) => set('packagingFee', e.target.value)}
                InputProps={rupee}
              />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard
            title="Size tiers"
            description="A one-time saving applied when a box reaches a given item count."
            action={<Button size="small" startIcon={<AddIcon />} onClick={addTier}>Add tier</Button>}
            sx={{ mb: 2.5 }}
          >
            {config.sizeTiers.length === 0 ? (
              <EmptyState
                dense
                title="No size tiers"
                description="Without a tier, every box is charged at full price."
                action={<Button variant="outlined" startIcon={<AddIcon />} onClick={addTier}>Add tier</Button>}
              />
            ) : (
              <Stack spacing={2}>
                {config.sizeTiers.map((tier, i) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                    <TextField
                      label="Items"
                      type="number"
                      sx={{ width: 100 }}
                      value={tier.items}
                      onChange={(e) => updateTier(i, { items: e.target.value })}
                    />
                    <TextField
                      label="Label"
                      fullWidth
                      value={tier.label}
                      onChange={(e) => updateTier(i, { label: e.target.value })}
                    />
                    <TextField
                      label="Discount"
                      type="number"
                      sx={{ width: 140 }}
                      value={tier.discountPercent}
                      onChange={(e) => updateTier(i, { discountPercent: e.target.value })}
                      InputProps={percent}
                    />
                    <Tooltip title="Remove tier">
                      <IconButton
                        color="error"
                        onClick={() => set('sizeTiers', config.sizeTiers.filter((_, idx) => idx !== i))}
                        aria-label={'Remove tier ' + tier.label}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            title="Optional extras"
            description="Add-ons customers can drop into their box, with the nutrition each one contributes."
            action={<Button size="small" startIcon={<AddIcon />} onClick={addExtra}>Add extra</Button>}
          >
            {config.extras.length === 0 ? (
              <EmptyState
                dense
                title="No extras"
                description="Extras are optional add-ons shown beside the box builder."
                action={<Button variant="outlined" startIcon={<AddIcon />} onClick={addExtra}>Add extra</Button>}
              />
            ) : (
              <Stack spacing={2}>
                {config.extras.map((extra, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: 'surface' }}>
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField label="Key" fullWidth value={extra.key} onChange={(e) => updateExtra(i, { key: e.target.value })} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Label" fullWidth value={extra.label} onChange={(e) => updateExtra(i, { label: e.target.value })} />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <TextField
                          label="Price"
                          type="number"
                          fullWidth
                          value={extra.price}
                          onChange={(e) => updateExtra(i, { price: e.target.value })}
                          InputProps={rupee}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={extra.isAvailable}
                                onChange={(e) => updateExtra(i, { isAvailable: e.target.checked })}
                              />
                            }
                            label={<Typography variant="caption">Available</Typography>}
                          />
                          <Tooltip title="Remove extra">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => set('extras', config.extras.filter((_, idx) => idx !== i))}
                              aria-label={'Remove extra ' + extra.label}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="overline" color="text.secondary">
                          Nutrition this extra adds
                        </Typography>
                      </Grid>

                      {NUTRIENTS.map(([key, label]) => (
                        <Grid item xs={6} sm={4} md={2.4} key={key}>
                          <TextField
                            label={label}
                            type="number"
                            fullWidth
                            value={extra.nutritionDelta?.[key] ?? 0}
                            onChange={(e) =>
                              updateExtra(i, {
                                nutritionDelta: { ...extra.nutritionDelta, [key]: Number(e.target.value) || 0 },
                              })
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
