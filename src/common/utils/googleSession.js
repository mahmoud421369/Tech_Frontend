import useAuthStore from '../store/Auth';
import { parseAccessToken } from './authSession';

const MARK_KEY = 'googleSignIn';
const MARK_TTL_MS = 10 * 60 * 1000;
const CLIENT_COOKIE = 'client_access_token';

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export const markGoogleSignIn = () => {
  try { sessionStorage.setItem(MARK_KEY, String(Date.now())); } catch { }
};

export const clearGoogleMark = () => {
  try { sessionStorage.removeItem(MARK_KEY); } catch { }
};

export const hasGoogleMark = () => {
  try {
    const at = Number(sessionStorage.getItem(MARK_KEY));
    if (!at) return false;
    if (Date.now() - at > MARK_TTL_MS) { clearGoogleMark(); return false; }
    return true;
  } catch { return false; }
};

const readClientCookie = () => {
  try {
    const hit = document.cookie.split('; ').find((c) => c.startsWith(`${CLIENT_COOKIE}=`));
    const value = hit ? decodeURIComponent(hit.slice(CLIENT_COOKIE.length + 1)).trim() : '';
    return value || null;
  } catch { return null; }
};

export const clearClientCookie = () => {
  try {
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = [undefined, host, `.${host}`];
    if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`);
    domains.forEach((domain) => {
      const d = domain ? `; domain=${domain}` : '';
      document.cookie = `${CLIENT_COOKIE}=; Max-Age=0; path=/${d}; Secure`;
      document.cookie = `${CLIENT_COOKIE}=; Max-Age=0; path=/${d}`;
    });
  } catch { }
};

export const hasClientCookie = () => !!readClientCookie();

const readUrlToken = () => {
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const value = (hash.get(CLIENT_COOKIE) || query.get(CLIENT_COOKIE) || '').trim();
    return value || null;
  } catch { return null; }
};

const clearUrlToken = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(CLIENT_COOKIE);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    hash.delete(CLIENT_COOKIE);
    const h = hash.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${h ? `#${h}` : ''}`);
  } catch { }
};

export const hasUrlToken = () => !!readUrlToken();

export const storeAuthToken = (token) => {
  if (!token) return;
  try { localStorage.setItem('authToken', token); } catch { }
  useAuthStore.getState().setAccessToken(token);
};

export function applySession(data) {
  const session = parseAccessToken(data?.access_token, { checkExpiry: false });
  if (!session) return null;

  const fromBody = toArray(data.roles ?? data.role);
  const roles = fromBody.length ? fromBody : session.roles || [];
  const id = data.id ?? data.userId ?? session.id ?? null;
  const email = data.email || session.email || null;

  if (id != null) { try { localStorage.setItem('id', id); } catch { } }
  useAuthStore.getState().setUserData(session.token, roles, id, email);
  return { token: session.token, roles, id, email };
}

let inflight = null;

export function recoverGoogleSession(options) {
  const force = options && options.force === true;
  if (inflight) return inflight;
  if (!force && !hasGoogleMark() && !hasClientCookie() && !hasUrlToken()) return Promise.resolve(null);

  inflight = (async () => {
    try {
      const urlToken = readUrlToken();
      if (urlToken) clearUrlToken();

      const token = urlToken || readClientCookie();
      if (!token) return null;

      try {
        storeAuthToken(token);
        const session = applySession({ access_token: token });
        return session || { token, roles: [], id: null, email: null };
      } finally {
        clearClientCookie();
      }
    } finally {
      clearGoogleMark();
      inflight = null;
    }
  })();
  return inflight;
}