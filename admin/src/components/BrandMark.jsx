import { Box } from '@mui/material';
import useBrand from '../hooks/useBrand';

/**
 * The store logo exactly as uploaded in Settings. No bundled fallback
 * image - when no logo is set we draw a monogram from the store name so a
 * fresh install never shows another business's artwork.
 */
export default function BrandMark({ size = 36, radius = 2 }) {
  const { logoUrl, brandName } = useBrand();
  const box = { width: size, height: size, borderRadius: radius };

  if (logoUrl) {
    return <Box component="img" src={logoUrl} alt="" sx={{ ...box, objectFit: 'contain' }} />;
  }

  return (
    <Box
      aria-hidden
      sx={{
        ...box,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 800,
        fontSize: Math.round(size * 0.44),
        lineHeight: 1,
      }}
    >
      {(brandName || '').trim().charAt(0).toUpperCase()}
    </Box>
  );
}
