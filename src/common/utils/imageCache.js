const MAX_ENTRIES = 300;
const LOGO_KEY = 'shopLogoCache:v1';
const LOGO_TTL_MS = 24 * 60 * 60 * 1000;
const LOGO_MAX = 300;
const PERSIST_DELAY_MS = 400;

const imgState = new Map();
const imgHold = new Map();

const touch = (map, key, value) => {
  map.delete(key);
  map.set(key, value);
  if (map.size > MAX_ENTRIES) map.delete(map.keys().next().value);
};

export const markImg = (src, state) => {
  if (src) touch(imgState, src, state);
};

export const isImgOk = (src) => !!src && imgState.get(src) === 'ok';
export const isImgBad = (src) => !!src && imgState.get(src) === 'bad';

export const warmImage = (src) => {
  if (!src || typeof Image === 'undefined' || imgState.has(src) || imgHold.has(src)) return;
  const img = new Image();
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  if ('fetchPriority' in img) img.fetchPriority = 'low';
  img.onload = () => markImg(src, 'ok');
  img.onerror = () => imgHold.delete(src);
  img.src = src;
  touch(imgHold, src, img);
};

export const warmImages = (list) => {
  if (!Array.isArray(list) || !list.length) return () => {};
  const run = () => list.forEach(warmImage);
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 800);
  return () => clearTimeout(id);
};

let logoStore = null;
let persistTimer = null;

const loadLogoStore = () => {
  if (logoStore) return logoStore;
  logoStore = {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(LOGO_KEY));
    if (raw && typeof raw === 'object') {
      const now = Date.now();
      for (const id in raw) {
        const e = raw[id];
        if (e && typeof e.t === 'number' && now - e.t < LOGO_TTL_MS) logoStore[id] = e;
      }
    }
  } catch {
    logoStore = {};
  }
  return logoStore;
};

const persistLogoStore = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const entries = Object.entries(loadLogoStore());
      entries.sort((a, b) => b[1].t - a[1].t);
      window.localStorage.setItem(LOGO_KEY, JSON.stringify(Object.fromEntries(entries.slice(0, LOGO_MAX))));
    } catch { }
  }, PERSIST_DELAY_MS);
};

export const readLogoEntry = (id) => {
  if (id == null || typeof window === 'undefined') return undefined;
  const e = loadLogoStore()[String(id)];
  return e && Date.now() - e.t < LOGO_TTL_MS ? e : undefined;
};

export const writeLogo = (id, url) => {
  if (id == null || typeof window === 'undefined') return;
  loadLogoStore()[String(id)] = { u: url || null, t: Date.now() };
  persistLogoStore();
};

export const LOGO_STALE_MS = LOGO_TTL_MS;