import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { configApi } from '../api/endpoints';

/**
 * Business identity, contact details, commerce rules, SEO, branding and social
 * profiles — all served by the API and owned by Admin Panel -> Organization.
 * Nothing here is hardcoded or read from a build-time env variable.
 */

const FALLBACK = {
  brandName: '',
  tagline: '',
  supportEmail: '',
  supportPhone: '',
  supportWhatsapp: '',
  whatsappLink: '',
  supportHours: '',
  address: '',
  city: '',
  serviceAreas: [],
  googleMapsEmbed: '',
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '' },
  branding: { logoUrl: '', faviconUrl: '' },
  minOrderValue: 0,
  deliveryFee: 0,
  freeDeliveryAbove: 0,
  taxPercent: 0,
  socials: {},
  googleClientId: '',
};

/** Prefilled WhatsApp greeting - the store name comes from the settings. */
const whatsappIntent = (brandName) =>
  brandName ? 'Hi ' + brandName + '! I would like to place an order.' : 'Hi! I would like to place an order.';

const SettingsContext = createContext({ ...FALLBACK, loading: true });

/** Keeps <head> in step with the SEO and branding values the admin has saved. */
function applyDocumentHead(settings) {
  const { seo, branding, brandName, tagline } = settings;

  const title = seo.metaTitle || [brandName, tagline].filter(Boolean).join(' | ');
  if (title) document.title = title;

  const meta = (selector, attr, key, content) => {
    if (!content) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  meta('meta[name="description"]', 'name', 'description', seo.metaDescription);
  meta('meta[name="keywords"]', 'name', 'keywords', seo.metaKeywords);
  meta('meta[property="og:site_name"]', 'property', 'og:site_name', brandName);
  meta('meta[property="og:title"]', 'property', 'og:title', title);
  meta('meta[property="og:description"]', 'property', 'og:description', seo.metaDescription);
  meta('meta[property="og:image"]', 'property', 'og:image', branding.logoUrl);

  const icon = (rel, href) => {
    if (!href) return;
    let el = document.head.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  };

  icon('icon', branding.faviconUrl || branding.logoUrl);
  icon('apple-touch-icon', branding.logoUrl || branding.faviconUrl);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    configApi
      .storefront()
      .then((res) => {
        if (cancelled || !res?.data) return;
        const next = {
          ...FALLBACK,
          ...res.data,
          seo: { ...FALLBACK.seo, ...(res.data.seo || {}) },
          branding: { ...FALLBACK.branding, ...(res.data.branding || {}) },
          socials: res.data.socials || {},
        };
        setSettings(next);
        applyDocumentHead(next);
      })
      // The storefront still works without settings; it just renders blanks.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const tel = settings.supportPhone ? 'tel:' + settings.supportPhone.replace(/[^\d+]/g, '') : '';
    const mailto = settings.supportEmail ? 'mailto:' + settings.supportEmail : '';
    const whatsappLink = settings.whatsappLink
      ? settings.whatsappLink + '?text=' + encodeURIComponent(whatsappIntent(settings.brandName))
      : '';

    return { ...settings, loading, telLink: tel, mailtoLink: mailto, whatsappLink };
  }, [settings, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
