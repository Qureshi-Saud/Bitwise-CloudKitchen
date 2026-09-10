import { useEffect, useState } from 'react';
import api from '../api/client';

/**
 * Store name, logo and favicon for the panel's own chrome, read from the public
 * settings endpoint so the sidebar, login screen, browser tab and tab icon all
 * follow whatever the admin saved under Settings. Nothing is hardcoded and
 * no brand asset is bundled. Works before sign-in - the endpoint needs no auth.
 */
const EMPTY = { brandName: '', logoUrl: '', faviconUrl: '' };

let cache = EMPTY;

/** Points the tab title and favicon at the saved brand. */
function applyDocumentHead({ brandName, logoUrl, faviconUrl }) {
  document.title = brandName ? 'Admin Panel | ' + brandName : 'Admin Panel';

  const href = faviconUrl || logoUrl;
  if (!href) return;

  let icon = document.head.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = href;
}

export default function useBrand() {
  const [brand, setBrand] = useState(cache);

  useEffect(() => {
    if (cache.brandName) {
      applyDocumentHead(cache);
      return;
    }

    let cancelled = false;
    api
      .get('/settings')
      .then((res) => {
        const next = {
          brandName: res.data?.brandName || '',
          logoUrl: res.data?.branding?.logoUrl || '',
          faviconUrl: res.data?.branding?.faviconUrl || '',
        };
        cache = next;
        applyDocumentHead(next);
        if (!cancelled) setBrand(next);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return brand;
}
