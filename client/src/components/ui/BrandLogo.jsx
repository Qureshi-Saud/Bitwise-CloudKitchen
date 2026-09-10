import { useSettings } from '../../context/SettingsContext';

/**
 * The store logo, exactly as saved in Admin Panel -> Organization.
 *
 * There is deliberately no bundled fallback image: if no logo has been
 * uploaded we draw a monogram from the store name instead, so a fresh install
 * never shows another business's artwork.
 */
export default function BrandLogo({ size = 44, className = '', rounded = 'rounded-xl' }) {
  const { branding, brandName } = useSettings();
  const url = branding?.logoUrl;
  const box = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt={brandName ? brandName + ' logo' : ''}
        width={size}
        height={size}
        style={box}
        className={`${rounded} object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...box, fontSize: Math.round(size * 0.42) }}
      className={`grid place-items-center bg-brand-600 font-display font-extrabold text-white ${rounded} ${className}`}
    >
      {(brandName || '').trim().charAt(0).toUpperCase()}
    </span>
  );
}
