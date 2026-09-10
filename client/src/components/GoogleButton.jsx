import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;

const loadScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const el = document.createElement('script');
    el.src = SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve(true);
    el.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
};

/**
 * Renders Google's official Sign In button. The client id is served by the API
 * rather than baked in at build time; without one this renders nothing and
 * email sign-in still works.
 */
export default function GoogleButton({ onCredential, text = 'signin_with' }) {
  const { googleClientId } = useSettings();
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;

    loadScript().then((ok) => {
      if (!ok || cancelled || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: ref.current.offsetWidth,
        text,
      });
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  if (!googleClientId) return null;

  return (
    <div>
      <div ref={ref} className="flex justify-center [&>div]:!w-full" />
      {!ready && <div className="skeleton h-11 w-full rounded-full" />}
    </div>
  );
}
