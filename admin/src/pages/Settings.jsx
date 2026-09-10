import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Grid, IconButton, InputAdornment, Paper,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/FacebookOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import XIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { FormSkeleton } from '../components/Skeletons';
import { settingsApi, uploadApi } from '../api/endpoints';
import { formatRelative } from '../lib/utils';
import { useSnackbar } from '../context/SnackbarContext';

/* -------------------------------------------------------------------------- */

const SECTIONS = ['general', 'seo', 'branding', 'commerce', 'social'];

/** Section label shown in the save bar, so it reads as prose not as a key. */
const SECTION_LABEL = {
  general: 'general information',
  seo: 'SEO',
  branding: 'branding',
  commerce: 'commerce rules',
  social: 'social profiles',
};

const EMPTY = {
  general: {
    siteName: '', tagline: '', contactEmail: '', contactNumber: '', whatsappNumber: '',
    companyAddress: '', city: '', serviceAreas: [], supportHours: '', googleMapsEmbed: '',
  },
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '' },
  branding: { logoUrl: '', faviconUrl: '' },
  commerce: { minOrderValue: 0, deliveryFee: 0, freeDeliveryAbove: 0, taxPercent: 0 },
  social: { instagram: '', facebook: '', twitter: '', linkedin: '', youtube: '' },
};

const rupee = { startAdornment: <InputAdornment position="start">₹</InputAdornment> };
const percent = { endAdornment: <InputAdornment position="end">%</InputAdornment> };

const socialAdornment = (Icon) => ({
  startAdornment: (
    <InputAdornment position="start">
      <Icon fontSize="small" sx={{ color: 'text.disabled' }} />
    </InputAdornment>
  ),
});

/**
 * Helper text for a field: whatever the field wants to say, followed by when it
 * was last changed. Every other form in the panel puts its guidance in
 * helperText, so this page does too rather than inventing a label row.
 */
const helper = (stamps, path, hint) => {
  const at = stamps?.[path];
  const stamp = at ? 'Updated ' + formatRelative(at) : 'Never updated';
  return hint ? hint + ' · ' + stamp : stamp;
};

/** Cloudinary-backed image slot used for the logo and the favicon. */
function ImageSlot({ label, hint, value, height, onChange, onError }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const res = await uploadApi.images([file], 'branding');
      const url = res.data?.[0]?.url;
      if (!url) throw new Error('Upload did not return an image URL');
      onChange(url);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{label}</Typography>

      <Paper
        variant="outlined"
        component="button"
        type="button"
        onClick={() => !busy && input.current?.click()}
        aria-label={'Upload ' + label.toLowerCase()}
        sx={{
          width: '100%',
          height,
          display: 'grid',
          placeItems: 'center',
          cursor: busy ? 'wait' : 'pointer',
          borderStyle: 'dashed',
          bgcolor: 'action.hover',
          overflow: 'hidden',
          p: 1,
          '&:hover': { borderColor: 'primary.main' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        {busy ? (
          <CircularProgress size={22} />
        ) : value ? (
          <Box component="img" src={value} alt="" sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <Stack alignItems="center" spacing={0.5} color="text.disabled">
            <AddPhotoIcon />
            <Typography variant="caption">Upload</Typography>
          </Stack>
        )}
      </Paper>

      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">{hint}</Typography>
        {value && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => onChange('')} aria-label={'Remove ' + label.toLowerCase()}>
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */

export default function Settings() {
  const [saved, setSaved] = useState(null); // last state persisted on the server
  const [draft, setDraft] = useState(null); // what the form is editing
  const [stamps, setStamps] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const snackbar = useSnackbar();

  const hydrate = (data) => {
    const next = SECTIONS.reduce(
      (acc, s) => ({ ...acc, [s]: { ...EMPTY[s], ...(data[s] || {}) } }),
      {}
    );
    setSaved(next);
    setDraft(next);
    setStamps(data.fieldUpdatedAt || {});
  };

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => hydrate(res.data))
      .catch((err) => snackbar.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (section, field, value) =>
    setDraft((d) => ({ ...d, [section]: { ...d[section], [field]: value } }));

  const dirtySections = useMemo(() => {
    if (!draft || !saved) return [];
    return SECTIONS.filter((s) => JSON.stringify(draft[s]) !== JSON.stringify(saved[s]));
  }, [draft, saved]);

  const isDirty = dirtySections.length > 0;

  /** Revert every section a card owns. The social card also owns the WhatsApp
   *  number, which is stored under `general`. */
  const resetSections = (sections) =>
    setDraft((d) => sections.reduce((acc, s) => ({ ...acc, [s]: saved[s] }), { ...d }));

  const discard = () => setDraft(saved);

  const save = async () => {
    setSaving(true);
    try {
      // Only the sections that actually changed travel to the server, so the
      // per-field "last updated" stamps stay meaningful.
      const payload = dirtySections.reduce((acc, s) => ({ ...acc, [s]: draft[s] }), {});
      const res = await settingsApi.update(payload);
      hydrate(res.data);
      snackbar.success('Settings saved. The storefront is already using them.');
    } catch (err) {
      snackbar.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton label="Loading settings" sections={3} />;
  if (!draft) return <Alert severity="error">Could not load the business settings.</Alert>;

  const { general, seo, branding, commerce, social } = draft;
  const num = (v) => (v === '' ? '' : Number(v));

  /** The revert control every section card carries. */
  const revert = (sections) => {
    const dirty = sections.some((s) => dirtySections.includes(s));
    return (
      <Tooltip title={dirty ? 'Revert this section' : 'No unsaved changes here'}>
        <span>
          <IconButton size="small" onClick={() => resetSections(sections)} disabled={!dirty} aria-label="Revert section">
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Store identity, contact details, delivery rules, branding and search engine metadata — everything the storefront reads from here."
      />

      <Grid container spacing={2.5} alignItems="flex-start">
        {/* ---------------------------- General ---------------------------- */}
        <Grid item xs={12} lg={4}>
          <SectionCard title="General information" action={revert(['general'])}>
            <Stack spacing={2.5}>
              <TextField
                label="Site name" fullWidth placeholder="Your store name" value={general.siteName}
                onChange={(e) => set('general', 'siteName', e.target.value)}
                helperText={helper(stamps, 'general.siteName')}
              />
              <TextField
                label="Tagline" fullWidth placeholder="Your one-line tagline" value={general.tagline}
                onChange={(e) => set('general', 'tagline', e.target.value)}
                helperText={helper(stamps, 'general.tagline')}
              />
              <TextField
                label="Contact email" fullWidth type="email" placeholder="support@yourstore.in" value={general.contactEmail}
                onChange={(e) => set('general', 'contactEmail', e.target.value)}
                helperText={helper(stamps, 'general.contactEmail')}
              />
              <TextField
                label="Contact number" fullWidth placeholder="+91 90000 00000" value={general.contactNumber}
                onChange={(e) => set('general', 'contactNumber', e.target.value)}
                helperText={helper(stamps, 'general.contactNumber')}
              />
              <TextField
                label="Company address" fullWidth multiline rows={3} placeholder="Street, City, State (Country)"
                value={general.companyAddress}
                onChange={(e) => set('general', 'companyAddress', e.target.value)}
                helperText={helper(stamps, 'general.companyAddress')}
              />
              <TextField
                label="City" fullWidth placeholder="Pune, Maharashtra" value={general.city}
                onChange={(e) => set('general', 'city', e.target.value)}
                helperText={helper(stamps, 'general.city', 'Shown wherever the kitchen location is mentioned')}
              />
              <TextField
                label="Support hours" fullWidth placeholder="9:00 AM - 9:00 PM, all days" value={general.supportHours}
                onChange={(e) => set('general', 'supportHours', e.target.value)}
                helperText={helper(stamps, 'general.supportHours')}
              />

              <Box>
                <TextField
                  label="Delivery areas" fullWidth placeholder="Area one, Area two, Area three"
                  value={general.serviceAreas.join(', ')}
                  onChange={(e) =>
                    set('general', 'serviceAreas', e.target.value.split(',').map((a) => a.trim()).filter(Boolean))
                  }
                  helperText={helper(stamps, 'general.serviceAreas', 'Separate each area with a comma')}
                />
                {general.serviceAreas.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
                    {general.serviceAreas.map((area) => (
                      <Chip key={area} label={area} size="small" />
                    ))}
                  </Stack>
                )}
              </Box>

              <TextField
                label="Google Maps embed" fullWidth multiline rows={2} placeholder="https://www.google.com/maps/embed?pb=..."
                value={general.googleMapsEmbed}
                onChange={(e) => set('general', 'googleMapsEmbed', e.target.value)}
                helperText={helper(stamps, 'general.googleMapsEmbed', 'The src URL from Google Maps > Share > Embed a map')}
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* ------------------------------ SEO ------------------------------ */}
        <Grid item xs={12} lg={4}>
          <SectionCard title="SEO settings" action={revert(['seo'])}>
            <Stack spacing={2.5}>
              <TextField
                label="Meta title" fullWidth placeholder="Store | Your tagline" value={seo.metaTitle}
                inputProps={{ maxLength: 70 }}
                onChange={(e) => set('seo', 'metaTitle', e.target.value)}
                helperText={helper(stamps, 'seo.metaTitle', seo.metaTitle.length + '/70 — Google truncates beyond this')}
              />
              <TextField
                label="Meta description" fullWidth multiline rows={4}
                placeholder="One or two sentences describing the store"
                value={seo.metaDescription}
                inputProps={{ maxLength: 200 }}
                onChange={(e) => set('seo', 'metaDescription', e.target.value)}
                helperText={helper(stamps, 'seo.metaDescription', seo.metaDescription.length + '/200')}
              />
              <TextField
                label="Meta keywords" fullWidth multiline rows={2}
                placeholder="keyword one, keyword two, keyword three"
                value={seo.metaKeywords}
                onChange={(e) => set('seo', 'metaKeywords', e.target.value)}
                helperText={helper(stamps, 'seo.metaKeywords', 'Separate each keyword with a comma')}
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* ---------------------------- Branding --------------------------- */}
        <Grid item xs={12} lg={4}>
          <SectionCard title="Branding" action={revert(['branding'])}>
            <Stack spacing={3}>
              <ImageSlot
                label="Logo"
                hint="Transparent PNG, around 400x120px"
                height={140}
                value={branding.logoUrl}
                onChange={(url) => set('branding', 'logoUrl', url)}
                onError={snackbar.error}
              />
              <ImageSlot
                label="Favicon"
                hint="Square PNG or ICO, at least 64x64px"
                height={120}
                value={branding.faviconUrl}
                onChange={(url) => set('branding', 'faviconUrl', url)}
                onError={snackbar.error}
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* ------------------------- Commerce rules ------------------------ */}
        <Grid item xs={12}>
          <SectionCard title="Commerce rules" action={revert(['commerce'])}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} lg={3}>
                <TextField
                  label="Free delivery above" fullWidth type="number" value={commerce.freeDeliveryAbove}
                  onChange={(e) => set('commerce', 'freeDeliveryAbove', num(e.target.value))}
                  InputProps={rupee}
                  helperText={helper(stamps, 'commerce.freeDeliveryAbove', 'Orders at or above this amount ship free. 0 makes every order free.')}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <TextField
                  label="Delivery fee" fullWidth type="number" value={commerce.deliveryFee}
                  onChange={(e) => set('commerce', 'deliveryFee', num(e.target.value))}
                  InputProps={rupee}
                  helperText={helper(stamps, 'commerce.deliveryFee', 'Flat charge per order below the free-delivery threshold.')}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <TextField
                  label="Minimum order value" fullWidth type="number" value={commerce.minOrderValue}
                  onChange={(e) => set('commerce', 'minOrderValue', num(e.target.value))}
                  InputProps={rupee}
                  helperText={helper(stamps, 'commerce.minOrderValue', 'Checkout refuses carts below this subtotal. 0 allows any order.')}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <TextField
                  label="Tax" fullWidth type="number" value={commerce.taxPercent}
                  onChange={(e) => set('commerce', 'taxPercent', num(e.target.value))}
                  InputProps={percent}
                  helperText={helper(stamps, 'commerce.taxPercent', 'Applied to the payable amount after any discount.')}
                />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {/* ------------------------- Social profiles ----------------------- */}
        <Grid item xs={12}>
          <SectionCard title="Social profiles" action={revert(['social', 'general'])}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="Instagram" fullWidth placeholder="https://instagram.com/yourstore" value={social.instagram}
                  onChange={(e) => set('social', 'instagram', e.target.value)}
                  InputProps={socialAdornment(InstagramIcon)}
                  helperText={helper(stamps, 'social.instagram')}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="Twitter (X)" fullWidth placeholder="https://x.com/yourstore" value={social.twitter}
                  onChange={(e) => set('social', 'twitter', e.target.value)}
                  InputProps={socialAdornment(XIcon)}
                  helperText={helper(stamps, 'social.twitter')}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="WhatsApp" fullWidth placeholder="+91 90000 00000" value={general.whatsappNumber}
                  onChange={(e) => set('general', 'whatsappNumber', e.target.value)}
                  InputProps={socialAdornment(WhatsAppIcon)}
                  helperText={helper(stamps, 'general.whatsappNumber', 'Powers the Order on WhatsApp buttons')}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="Facebook" fullWidth placeholder="https://facebook.com/yourstore" value={social.facebook}
                  onChange={(e) => set('social', 'facebook', e.target.value)}
                  InputProps={socialAdornment(FacebookIcon)}
                  helperText={helper(stamps, 'social.facebook')}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="LinkedIn" fullWidth placeholder="https://linkedin.com/company/yourstore" value={social.linkedin}
                  onChange={(e) => set('social', 'linkedin', e.target.value)}
                  InputProps={socialAdornment(LinkedInIcon)}
                  helperText={helper(stamps, 'social.linkedin')}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  label="YouTube" fullWidth placeholder="https://youtube.com/@yourstore" value={social.youtube}
                  onChange={(e) => set('social', 'youtube', e.target.value)}
                  InputProps={socialAdornment(YouTubeIcon)}
                  helperText={helper(stamps, 'social.youtube')}
                />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>
      </Grid>

      {/* ----------------------------- Save bar ---------------------------- */}
      <Card
        sx={{
          position: 'sticky', bottom: 16, mt: 2.5, p: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 2, flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.24)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {isDirty
            ? 'Unsaved changes in ' + dirtySections.map((s) => SECTION_LABEL[s]).join(', ') + '.'
            : 'Everything here is live on the storefront.'}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button startIcon={<UndoIcon />} onClick={discard} disabled={!isDirty || saving}>
            Discard
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!isDirty || saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </Stack>
      </Card>
    </>
  );
}
