import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid, Typography, TextField, MenuItem, Button, Stack, Box, Divider, IconButton, Chip, Switch,
  FormControlLabel, Alert, Accordion, AccordionSummary, AccordionDetails, Avatar, InputAdornment,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { FormSkeleton } from '../components/Skeletons';
import { productApi, categoryApi, uploadApi } from '../api/endpoints';
import { plural } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

const EMPTY_NUTRITION = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0,
  sugar: 0, sodium: 0, iron: 0, calcium: 0, potassium: 0, vitaminA: 0,
};

const MACRO_FIELDS = [
  ['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'],
  ['fat', 'Fat (g)'], ['fibre', 'Fibre (g)'],
];

const MICRO_FIELDS = [
  ['sugar', 'Sugar (g)'], ['sodium', 'Sodium (mg)'], ['iron', 'Iron (mg)'],
  ['calcium', 'Calcium (mg)'], ['potassium', 'Potassium (mg)'], ['vitaminA', 'Vitamin A (mcg)'],
];

const OPTION_DELTAS = [['calories', 'kcal'], ['protein', 'Protein'], ['fibre', 'Fibre']];

const MAX_IMAGES = 6;

const EMPTY_PRODUCT = {
  name: '', shortDescription: '', description: '', category: '', price: 100, compareAtPrice: '',
  images: [], foodType: 'veg', nutrition: EMPTY_NUTRITION, servingSize: '1 portion', prepTimeMinutes: 15,
  ingredients: [], allergens: [], badges: [], dietTags: [], optionGroups: [],
  snackBoxEligible: true, isAvailable: true, isPopular: false, isFeatured: false,
  stockStatus: 'in-stock', order: 0,
};

const csvToArray = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);

const rupee = { startAdornment: <InputAdornment position="start">₹</InputAdornment> };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const fileRef = useRef(null);

  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productApi
      .get(id)
      .then((res) => {
        const p = res.data;
        setForm({
          ...EMPTY_PRODUCT,
          ...p,
          category: p.category?._id || p.category,
          nutrition: { ...EMPTY_NUTRITION, ...(p.nutrition || {}) },
          compareAtPrice: p.compareAtPrice || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNutrition = (key, value) =>
    setForm((f) => ({ ...f, nutrition: { ...f.nutrition, [key]: Number(value) || 0 } }));

  const uploadImages = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await uploadApi.images(files, 'products');
      set('images', [...form.images, ...res.data].slice(0, MAX_IMAGES));
      snackbar.success('Images uploaded');
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ------------------------- Customization group editing ------------------------ */

  const addGroup = () =>
    set('optionGroups', [
      ...form.optionGroups,
      {
        key: 'group-' + (form.optionGroups.length + 1),
        title: 'New option group',
        helpText: '',
        type: 'single',
        required: false,
        minSelect: 0,
        maxSelect: 1,
        order: form.optionGroups.length + 1,
        options: [],
      },
    ]);

  const updateGroup = (index, patch) =>
    set('optionGroups', form.optionGroups.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const removeGroup = (index) => set('optionGroups', form.optionGroups.filter((_, i) => i !== index));

  const addOption = (gi) =>
    updateGroup(gi, {
      options: [
        ...form.optionGroups[gi].options,
        {
          label: 'New option',
          priceDelta: 0,
          nutritionDelta: { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
          isDefault: false,
          isAvailable: true,
        },
      ],
    });

  const updateOption = (gi, oi, patch) =>
    updateGroup(gi, {
      options: form.optionGroups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)),
    });

  const removeOption = (gi, oi) =>
    updateGroup(gi, { options: form.optionGroups[gi].options.filter((_, i) => i !== oi) });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        prepTimeMinutes: Number(form.prepTimeMinutes),
        order: Number(form.order) || 0,
        ...(form.compareAtPrice ? { compareAtPrice: Number(form.compareAtPrice) } : {}),
      };
      delete payload._id;
      delete payload.slug;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.rating;
      delete payload.reviewCount;
      delete payload.soldCount;
      delete payload.isCustomizable;
      delete payload.id;
      if (!form.compareAtPrice) delete payload.compareAtPrice;

      if (isEdit) {
        await productApi.update(id, payload);
        snackbar.success('Product updated. The website is already showing the change.');
      } else {
        await productApi.create(payload);
        snackbar.success('Product created and live on the menu.');
      }
      navigate('/products');
    } catch (err) {
      setError(err.message + (err.errors ? ' — ' + err.errors.map((e) => e.field + ': ' + e.message).join('; ') : ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton label="Loading product" sections={2} />;

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        subtitle="Everything here is database-driven, so the customer website updates the moment you save."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')}>
              Back
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save product'}
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12} lg={8}>
          <SectionCard title="Basic details" sx={{ mb: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField label="Product name" fullWidth required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Category" fullWidth required value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Short description"
                  fullWidth
                  required
                  inputProps={{ maxLength: 180 }}
                  helperText={'Shown on the product card · ' + form.shortDescription.length + '/180'}
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Full description"
                  fullWidth
                  multiline
                  rows={4}
                  inputProps={{ maxLength: 1200 }}
                  helperText="Shown on the product page"
                  value={form.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  required
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  InputProps={rupee}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Compare at"
                  type="number"
                  fullWidth
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                  InputProps={rupee}
                  helperText="Optional"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select label="Food type" fullWidth value={form.foodType} onChange={(e) => set('foodType', e.target.value)}>
                  <MenuItem value="veg">Vegetarian</MenuItem>
                  <MenuItem value="non-veg">Non-vegetarian</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Prep time (min)" type="number" fullWidth value={form.prepTimeMinutes} onChange={(e) => set('prepTimeMinutes', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Serving size" fullWidth value={form.servingSize} onChange={(e) => set('servingSize', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Stock status" fullWidth value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value)}>
                  <MenuItem value="in-stock">In stock</MenuItem>
                  <MenuItem value="limited">Limited</MenuItem>
                  <MenuItem value="out-of-stock">Out of stock</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="Nutrition"
            description="Approximate, per serving. These values drive the product card, the Nutrition page filters and the HIGH PROTEIN / HIGH FIBRE badges."
            sx={{ mb: 2.5 }}
          >
            <Grid container spacing={2}>
              {MACRO_FIELDS.map(([key, label]) => (
                <Grid item xs={6} sm={4} md={2.4} key={key}>
                  <TextField
                    label={label}
                    type="number"
                    fullWidth
                    value={form.nutrition[key]}
                    onChange={(e) => setNutrition(key, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Micronutrients
            </Typography>
            <Grid container spacing={2}>
              {MICRO_FIELDS.map(([key, label]) => (
                <Grid item xs={6} sm={4} md={2} key={key}>
                  <TextField
                    label={label}
                    type="number"
                    fullWidth
                    value={form.nutrition[key]}
                    onChange={(e) => setNutrition(key, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>
          </SectionCard>

          <SectionCard
            title="Customization options"
            description="Each group appears on the Customize page. Price and nutrition deltas are applied by the server."
            action={<Button size="small" startIcon={<AddIcon />} onClick={addGroup}>Add group</Button>}
          >
            {form.optionGroups.length === 0 && (
              <Alert severity="info">
                No customization groups yet. Without them this product cannot be customized.
              </Alert>
            )}

            {form.optionGroups.map((group, gi) => (
              <Accordion
                key={gi}
                disableGutters
                elevation={0}
                sx={{
                  mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>{group.title}</Typography>
                    <Chip size="small" label={group.type === 'single' ? 'Single choice' : 'Multiple choice'} variant="outlined" />
                    <Chip size="small" label={plural(group.options.length, 'option')} variant="outlined" />
                    {group.required && <Chip size="small" label="Required" color="secondary" />}
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Key" fullWidth value={group.key} onChange={(e) => updateGroup(gi, { key: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField label="Title" fullWidth value={group.title} onChange={(e) => updateGroup(gi, { title: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Help text" fullWidth value={group.helpText || ''} onChange={(e) => updateGroup(gi, { helpText: e.target.value })} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField select label="Type" fullWidth value={group.type} onChange={(e) => updateGroup(gi, { type: e.target.value })}>
                        <MenuItem value="single">Single choice</MenuItem>
                        <MenuItem value="multiple">Multiple choice</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Max select" type="number" fullWidth value={group.maxSelect} onChange={(e) => updateGroup(gi, { maxSelect: Number(e.target.value) || 1 })} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Sort order" type="number" fullWidth value={group.order} onChange={(e) => updateGroup(gi, { order: Number(e.target.value) || 0 })} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControlLabel
                        control={<Switch checked={group.required} onChange={(e) => updateGroup(gi, { required: e.target.checked })} />}
                        label="Required"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2">Options</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addOption(gi)}>Add option</Button>
                  </Stack>

                  {group.options.map((option, oi) => (
                    <Box key={oi} sx={{ p: 1.5, mb: 1.5, borderRadius: 2, bgcolor: 'surface' }}>
                      <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField label="Label" fullWidth value={option.label} onChange={(e) => updateOption(gi, oi, { label: e.target.value })} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            label="Price change"
                            type="number"
                            fullWidth
                            value={option.priceDelta}
                            onChange={(e) => updateOption(gi, oi, { priceDelta: Number(e.target.value) || 0 })}
                            InputProps={rupee}
                          />
                        </Grid>
                        {OPTION_DELTAS.map(([k, label]) => (
                          <Grid item xs={4} sm={2} key={k}>
                            <TextField
                              label={label}
                              type="number"
                              fullWidth
                              value={option.nutritionDelta?.[k] ?? 0}
                              onChange={(e) =>
                                updateOption(gi, oi, {
                                  nutritionDelta: { ...option.nutritionDelta, [k]: Number(e.target.value) || 0 },
                                })
                              }
                            />
                          </Grid>
                        ))}
                        <Grid item xs={12} sm={11}>
                          <FormControlLabel
                            control={<Switch size="small" checked={option.isDefault} onChange={(e) => updateOption(gi, oi, { isDefault: e.target.checked })} />}
                            label={<Typography variant="caption">Selected by default</Typography>}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                          <Tooltip title="Remove option">
                            <IconButton size="small" color="error" onClick={() => removeOption(gi, oi)} aria-label={'Remove option ' + option.label}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}

                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeGroup(gi)} sx={{ mt: 1 }}>
                    Remove this group
                  </Button>
                </AccordionDetails>
              </Accordion>
            ))}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <SectionCard
            title="Images"
            description="Uploaded to Cloudinary. Only the URL and public id are stored in the database."
            sx={{ mb: 2.5 }}
          >
            {form.images.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                {form.images.map((img, i) => (
                  <Box key={img.url} sx={{ position: 'relative' }}>
                    <Avatar src={img.url} variant="rounded" sx={{ width: 76, height: 76 }} />
                    <Tooltip title="Remove image">
                      <IconButton
                        size="small"
                        onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                        sx={{
                          position: 'absolute', top: -8, right: -8,
                          bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' },
                        }}
                        aria-label={'Remove image ' + (i + 1)}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            )}

            <Button
              variant="outlined"
              startIcon={<PhotoIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={uploading || form.images.length >= MAX_IMAGES}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload images'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={uploadImages} />

            <TextField
              label="Or paste an image URL"
              fullWidth
              sx={{ mt: 2 }}
              placeholder="https://..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.startsWith('http')) {
                  set('images', [...form.images, { url: e.target.value }].slice(0, MAX_IMAGES));
                  e.target.value = '';
                }
              }}
              helperText={'Press Enter to add · ' + form.images.length + '/' + MAX_IMAGES + ' used'}
            />
          </SectionCard>

          <SectionCard title="Labels" sx={{ mb: 2.5 }}>
            <Stack spacing={2}>
              <TextField
                label="Ingredients"
                fullWidth
                multiline
                rows={2}
                helperText="Separate each with a comma"
                value={form.ingredients.join(', ')}
                onChange={(e) => set('ingredients', csvToArray(e.target.value))}
              />
              <TextField
                label="Allergens"
                fullWidth
                helperText="Separate each with a comma"
                value={form.allergens.join(', ')}
                onChange={(e) => set('allergens', csvToArray(e.target.value))}
              />
              <TextField
                label="Badges"
                fullWidth
                helperText="e.g. HIGH PROTEIN, HIGH FIBRE, LESS OIL, WHOLE GRAIN"
                value={form.badges.join(', ')}
                onChange={(e) => set('badges', csvToArray(e.target.value).map((s) => s.toUpperCase()))}
              />
              <TextField
                label="Diet tags"
                fullWidth
                helperText="Used by the menu filters: high-protein, high-fibre, oats-based, quinoa-based, fruit-based, less-oil, whole-grain"
                value={form.dietTags.join(', ')}
                onChange={(e) => set('dietTags', csvToArray(e.target.value).map((s) => s.toLowerCase()))}
              />
            </Stack>
          </SectionCard>

          <SectionCard title="Visibility">
            <Stack>
              <FormControlLabel
                control={<Switch checked={form.isAvailable} onChange={(e) => set('isAvailable', e.target.checked)} />}
                label="Live on the website"
              />
              <FormControlLabel
                control={<Switch checked={form.isPopular} onChange={(e) => set('isPopular', e.target.checked)} />}
                label="Show in Popular Snacks"
              />
              <FormControlLabel
                control={<Switch checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />}
                label="Feature on the homepage"
              />
              <FormControlLabel
                control={<Switch checked={form.snackBoxEligible} onChange={(e) => set('snackBoxEligible', e.target.checked)} />}
                label="Available in the Snack Box builder"
              />
              <TextField
                label="Sort order"
                type="number"
                sx={{ mt: 2 }}
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
              />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
