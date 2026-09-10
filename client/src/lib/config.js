/**
 * Runtime API wiring.
 *
 * Nothing here is hardcoded to a host: an explicit VITE_* value always wins,
 * otherwise the server origin is derived from the page itself. In dev that is
 * the current hostname on the API port (so opening the site from a phone on the
 * LAN still reaches the API); in a build it is the origin the app was served
 * from, which is what a reverse proxy or a single-domain deploy expects.
 */

const trim = (v) => String(v ?? '').trim().replace(/\/+$/, '');

const API_PREFIX = trim(import.meta.env.VITE_API_PREFIX) || '/api/v1';
const DEV_API_PORT = trim(import.meta.env.VITE_API_PORT) || '5000';

const serverOrigin = () => {
  const explicit = trim(import.meta.env.VITE_SERVER_URL);
  if (explicit) return explicit;

  // SSR / tests have no window; fall back to the dev server address.
  if (typeof window === 'undefined') return 'http://localhost:' + DEV_API_PORT;

  const { protocol, hostname, origin } = window.location;
  return import.meta.env.DEV ? protocol + '//' + hostname + ':' + DEV_API_PORT : trim(origin);
};

const SERVER_URL = serverOrigin();

/** REST base, e.g. https://example.com/api/v1 */
export const API_BASE_URL = trim(import.meta.env.VITE_API_URL) || SERVER_URL + API_PREFIX;

/** Socket.IO endpoint — same host as the API, without the REST prefix. */
export const SOCKET_URL = trim(import.meta.env.VITE_SOCKET_URL) || SERVER_URL;
