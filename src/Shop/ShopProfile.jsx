import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiEdit3, FiMapPin, FiTrash2, FiX, FiMail, FiPhone, FiStar, FiTag, FiCheckCircle, FiShield,
  FiLock, FiPlus, FiMinus, FiCamera, FiGlobe, FiRefreshCw, FiHome, FiAlertCircle,
  FiSearch, FiNavigation, FiExternalLink, FiSettings, FiSun, FiMoon, FiImage,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import api from '../common/api/api';
import useAuthStore from '../common/store/Auth';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';
import {
  BTN, BTN_MD, BTN_ICON, BTN_PRIMARY, CARD, PANEL, FIELD, LABEL, SCROLL_CSS, fmt, tpl, errText, isSafeId,
  confirmDialog, useDarkMode, useEscape, useShopLocale, StatCard, Overlay, IconTile,
} from '../components/shop/TableKit';
import { LogoDropzone, LOGO_CSS, getLogoT, prepareLogoFile } from '../components/shop/LogoKit';
import { ensureShopAssets, getFontStyle } from '../common/utils/shopFonts';
import { resolveImageSrc } from '../common/utils/productutils';

ensureShopAssets();

const NAME_MAX = 100;
const DESC_MAX = 1000;
const PASS_MIN = 8;
const PASS_MAX = 72;
const ADDR_MAX = 100;
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };
const GEO_BASE = 'https://nominatim.openstreetmap.org';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const GEO_CACHE_MAX = 40;
const GEO_DEBOUNCE = 600;
const THEME_EVENT = 'appDarkModeChanged';
const LANG_EVENT = 'appLanguageChanged';

const EMPTY_ADDR = { state: '', city: '', street: '', building: '', isDefault: false };

const LANG_OPTIONS = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

const SETTINGS_TXT = {
  en: {
    title: 'Settings',
    subtitle: 'Appearance and language for your dashboard',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
  },
  ar: {
    title: 'الإعدادات',
    subtitle: 'المظهر واللغة للوحة التحكم',
    appearance: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    language: 'اللغة',
  },
};

const MAP_TXT = {
  en: {
    hint: 'Drag the map to move the pin',
    search: 'Search a place or address',
    searchGo: 'Search',
    locate: 'Use my location',
    locateFail: 'Could not get your location. Allow location access and try again.',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resolving: 'Finding address…',
    resolveFail: 'Could not read this spot. Fill in the fields manually.',
    idle: 'Move the map to pick a spot.',
    pinned: 'Pinned',
    noResults: 'No places found',
    searchFail: 'Search failed. Try again.',
    mapFail: 'The map could not load. You can still fill in the address manually.',
    mapLoading: 'Loading map…',
    details: 'Address details',
    openMap: 'Open in maps',
    onMap: 'On map',
  },
  ar: {
    hint: 'حرّك الخريطة لتغيير مكان الدبوس',
    search: 'ابحث عن مكان أو عنوان',
    searchGo: 'بحث',
    locate: 'استخدم موقعي',
    locateFail: 'تعذر تحديد موقعك. اسمح بالوصول إلى الموقع وحاول مرة أخرى.',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    resolving: 'جارٍ تحديد العنوان…',
    resolveFail: 'تعذر قراءة هذا المكان. املأ الحقول يدويًا.',
    idle: 'حرّك الخريطة لاختيار المكان.',
    pinned: 'تم التحديد',
    noResults: 'لا توجد نتائج',
    searchFail: 'فشل البحث. حاول مرة أخرى.',
    mapFail: 'تعذر تحميل الخريطة. يمكنك إدخال العنوان يدويًا.',
    mapLoading: 'جارٍ تحميل الخريطة…',
    details: 'تفاصيل العنوان',
    openMap: 'فتح في الخرائط',
    onMap: 'على الخريطة',
  },
};

const MAP_CSS = `
.nb-map{position:relative;isolation:isolate;border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);background:var(--nb-gray);overflow:hidden;touch-action:none}
.nb-map .leaflet-container{font-family:inherit;outline:none;background:var(--nb-gray);width:100%;height:100%;cursor:grab}
.nb-map .leaflet-container:active{cursor:grabbing}
.nb-map.is-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) saturate(1.1) brightness(.95) contrast(.95)}
.nb-map .leaflet-control-attribution{font-size:9px;background:var(--nb-card);color:var(--nb-muted);border-top:2px solid var(--nb-line);border-inline-start:2px solid var(--nb-line);padding:0 5px;margin:0}
.nb-map .leaflet-control-attribution a{color:var(--nb-muted)}
.nb-map .leaflet-tile{will-change:transform}
.nb-map-vig{background:radial-gradient(ellipse at center,transparent 52%,rgba(4,38,26,.3) 100%);pointer-events:none}
.nb-pin{position:absolute;left:-22px;top:-54px;width:44px;height:56px;transform-origin:50% 100%;transition:transform .45s cubic-bezier(.34,1.8,.5,1);filter:drop-shadow(0 3px 0 rgba(4,38,26,.35));will-change:transform}
.nb-pin.is-lift{transform:translateY(-18px) scale(1.08);transition-duration:.14s;transition-timing-function:ease-out}
.nb-pin-shadow{position:absolute;left:-10px;top:-3px;width:20px;height:7px;border-radius:50%;background:rgba(4,38,26,.55);transition:transform .2s ease,opacity .2s ease}
.nb-pin-shadow.is-lift{transform:scale(.5);opacity:.4}
.nb-pin-ring{position:absolute;left:-20px;top:-10px;width:40px;height:20px;border:3px solid var(--nb-accent);border-radius:50%;animation:nbPing 1.7s ease-out infinite}
.nb-pin-ring.is-lift{animation:none;opacity:0}
@keyframes nbPing{0%{transform:scale(.35);opacity:.95}100%{transform:scale(1.7);opacity:0}}
@media (prefers-reduced-motion:reduce){.nb-pin,.nb-pin-shadow{transition:none}.nb-pin-ring{animation:none;opacity:.6}}
`;

const BASE_CSS = UI3D_CSS + EXTRAS_CSS;
const PAGE_CSS = BASE_CSS + SCROLL_CSS + MAP_CSS + LOGO_CSS;
const UPLOAD_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
  transformRequest: [(data) => data],
  timeout: 120_000,
};

const LOGO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch { } };

const sniffImageType = async (blob) => {
  try {
    const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  } catch { }
  return '';
};

const LOGO_MAX_DIM = 1024;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_QUALITIES = [0.9, 0.8, 0.7, 0.55, 0.4];

const toWebpLogo = async (blob) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }
  const scale = Math.min(1, LOGO_MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  let last = null;
  for (const q of LOGO_QUALITIES) {
    const out = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', q));
    if (!out || out.type !== 'image/webp') return null;
    last = out;
    if (out.size <= LOGO_MAX_BYTES) break;
  }
  return last;
};

const normalizeLogoBlob = async (blob) => {
  const type = await sniffImageType(blob);
  if (!type) return null;
  const base = String(blob.name || 'logo').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 60) || 'logo';
  let out = blob;
  let outType = type;
  if (type !== 'image/webp' || blob.size > LOGO_MAX_BYTES) {
    const webp = await toWebpLogo(blob);
    if (webp) {
      out = webp;
      outType = 'image/webp';
    }
  }
  return new File([out], `${base}.${LOGO_EXT[outType]}`, { type: outType, lastModified: Date.now() });
};

const unsupportedLogoError = () => Object.assign(new Error('unsupported logo format'), { code: 'UNSUPPORTED_LOGO' });

const uploadErrText = (err, u) => {
  const status = err?.response?.status;
  if (err?.code === 'UNSUPPORTED_LOGO') return u.unsupported;
  if (status === 413) return u.tooLarge;
  if (err?.code === 'ECONNABORTED') return u.timeout;
  return errText(err);
};

const putShopForm = async (shopId, fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    if (v instanceof Blob) {
      const clean = await normalizeLogoBlob(v);
      if (!clean) throw unsupportedLogoError();
      fd.append(k, clean, clean.name);
    } else {
      fd.append(k, String(v));
    }
  }
  return api.put(`/api/shops/${encodeURIComponent(shopId)}`, fd, UPLOAD_CONFIG);
};

const toCoord = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const coordsOf = (a) => {
  const lat = toCoord(a?.latitude ?? a?.lat);
  const lng = toCoord(a?.longitude ?? a?.lng ?? a?.lon);
  return lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

const round6 = (n) => Number(n.toFixed(6));
const cut = (v, max = ADDR_MAX) => String(v ?? '').slice(0, max);
const geoKey = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

const addrPayload = (a, coords) => ({
  state: String(a.state).trim(),
  city: String(a.city).trim(),
  street: String(a.street).trim(),
  building: String(a.building ?? '').trim(),
  isDefault: !!a.isDefault,
  ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
});

const validateAddr = (a, v) => {
  if (!String(a.state).trim()) return v.state;
  if (!String(a.city).trim()) return v.city;
  if (!String(a.street).trim()) return v.street;
  if ([a.state, a.city, a.street].some((x) => String(x).length > ADDR_MAX) || String(a.building ?? '').length > 50) return v.tooLong;
  return null;
};

const Field = ({ label, htmlFor, hint, children }) => (
  <div>
    <label htmlFor={htmlFor} className={LABEL}>{label}</label>
    {children}
    {hint && <p className="nb-muted mt-1 text-[10px] font-semibold">{hint}</p>}
  </div>
);

const PinMarker = memo(({ lifted }) => (
  <div className="pointer-events-none absolute left-1/2 top-1/2 z-[900]" aria-hidden="true">
    <span className={`nb-pin-ring ${lifted ? 'is-lift' : ''}`} />
    <span className={`nb-pin-shadow ${lifted ? 'is-lift' : ''}`} />
    <svg className={`nb-pin ${lifted ? 'is-lift' : ''}`} viewBox="0 0 44 56" fill="none">
      <path d="M22 2C11.5 2 3 10.3 3 20.6 3 34.5 22 54 22 54s19-19.5 19-33.4C41 10.3 32.5 2 22 2z" fill="var(--nb-accent)" stroke="#04261a" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="22" cy="20.5" r="8" fill="#ffffff" stroke="#04261a" strokeWidth="3" />
      <circle cx="22" cy="20.5" r="3" fill="#04261a" />
    </svg>
  </div>
));

const PinMap = memo(({ start, apiRef, onPick, onDragging, onReady, onFail, loadingText }) => {
  const elRef = useRef(null);
  const cbRef = useRef({ onPick, onDragging, onReady, onFail });
  const [ready, setReady] = useState(false);

  useEffect(() => { cbRef.current = { onPick, onDragging, onReady, onFail }; }, [onPick, onDragging, onReady, onFail]);

  useEffect(() => {
    let cancelled = false;
    let map = null;
    let observer = null;
    let loadTimer = null;
    let loaded = false;
    let last = null;

    (async () => {
      try {
        const [mod] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
        if (cancelled || !elRef.current) return;
        const L = mod.default || mod;

        map = L.map(elRef.current, {
          center: [start.lat, start.lng],
          zoom: start.zoom,
          minZoom: 3,
          maxZoom: 19,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          worldCopyJump: true,
          zoomSnap: 1,
          wheelPxPerZoomLevel: 90,
          inertiaDeceleration: 3400,
        });

        L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);

        const tiles = L.tileLayer(TILE_URL, {
          maxZoom: 19,
          attribution: TILE_ATTR,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 2,
        }).addTo(map);

        const markLoaded = () => {
          if (loaded || cancelled) return;
          loaded = true;
          clearTimeout(loadTimer);
          setReady(true);
        };
        tiles.once('tileload', markLoaded);
        tiles.once('load', markLoaded);
        loadTimer = setTimeout(() => { if (!loaded && !cancelled) cbRef.current.onFail(); }, 20000);

        map.on('movestart', () => { if (!cancelled) cbRef.current.onDragging(true); });
        map.on('moveend', () => {
          if (cancelled) return;
          cbRef.current.onDragging(false);
          const c = map.getCenter().wrap();
          if (last && Math.abs(last.lat - c.lat) < 1e-7 && Math.abs(last.lng - c.lng) < 1e-7) return;
          last = { lat: c.lat, lng: c.lng };
          cbRef.current.onPick(c.lat, c.lng);
        });
        map.on('click', (e) => map.panTo(e.latlng, { animate: true, duration: 0.45 }));

        if (typeof ResizeObserver !== 'undefined') {
          let raf = 0;
          observer = new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => { if (!cancelled && map) map.invalidateSize(); });
          });
          observer.observe(elRef.current);
        }

        apiRef.current = {
          flyTo: (lat, lng, z) => map.flyTo([lat, lng], z ?? Math.max(map.getZoom(), 16), { duration: 1.2 }),
          zoomIn: () => map.zoomIn(),
          zoomOut: () => map.zoomOut(),
        };

        const c0 = map.getCenter().wrap();
        last = { lat: c0.lat, lng: c0.lng };
        cbRef.current.onReady(c0.lat, c0.lng);
      } catch {
        if (!cancelled) cbRef.current.onFail();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(loadTimer);
      observer?.disconnect();
      apiRef.current = null;
      try { map?.remove(); } catch { }
    };
  }, [start, apiRef]);

  return (
    <>
      <div className="absolute inset-0 z-0 isolate">
        <div ref={elRef} className="h-full w-full" />
      </div>
      {!ready && (
        <div className="nb-gray absolute inset-0 z-[950] flex items-center justify-center text-xs font-extrabold uppercase">
          <FiRefreshCw size={14} className="me-2 animate-spin motion-reduce:animate-none" /> {loadingText}
        </div>
      )}
    </>
  );
});

const AddressModal = memo(({ initial, busy, loc, dark, onClose, onSubmit }) => {
  useEscape(onClose);
  const { L, language } = loc;
  const t = L.profile;
  const m = t.modal;
  const x = MAP_TXT[language] || MAP_TXT.en;
  const isEdit = !!initial;

  const [form, setForm] = useState(() => ({ ...EMPTY_ADDR, ...(initial || {}), building: initial?.building ?? '' }));
  const [coords, setCoords] = useState(() => coordsOf(initial));
  const [start] = useState(() => {
    const c = coordsOf(initial);
    return c ? { ...c, zoom: 17 } : { ...DEFAULT_CENTER, zoom: 16 };
  });
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [resolving, setResolving] = useState(false);
  const [geoFail, setGeoFail] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const mapApi = useRef(null);
  const geoTimer = useRef(null);
  const geoAbort = useRef(null);
  const searchAbort = useRef(null);
  const geoCache = useRef(new Map());

  useEffect(() => () => {
    clearTimeout(geoTimer.current);
    geoAbort.current?.abort();
    searchAbort.current?.abort();
  }, []);

  const set = (k) => (e) => { setError(''); setForm((p) => ({ ...p, [k]: e.target.value.slice(0, k === 'building' ? 50 : ADDR_MAX) })); };

  const applyGeo = useCallback((d) => {
    const a = d?.address || {};
    setLabel(String(d?.display_name || ''));
    setForm((p) => ({
      ...p,
      state: cut(a.state || a.governorate || a.region || a.state_district || p.state),
      city: cut(a.city || a.town || a.village || a.suburb || a.city_district || a.county || p.city),
      street: cut(a.road || a.pedestrian || a.footway || a.neighbourhood || a.suburb || p.street),
      building: cut(a.house_number || a.building || p.building, 50),
    }));
  }, []);

  const handlePick = useCallback((lat, lng) => {
    setCoords({ lat: round6(lat), lng: round6(lng) });
    setError('');
    clearTimeout(geoTimer.current);
    geoAbort.current?.abort();
    const key = `${language}:${geoKey(lat, lng)}`;
    const cached = geoCache.current.get(key);
    if (cached) {
      setResolving(false);
      setGeoFail(false);
      applyGeo(cached);
      return;
    }
    geoTimer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      geoAbort.current = ctrl;
      setResolving(true);
      setGeoFail(false);
      try {
        const res = await fetch(`${GEO_BASE}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=${language}&lat=${lat}&lon=${lng}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error('geo');
        const d = await res.json();
        if (ctrl.signal.aborted) return;
        if (geoCache.current.size >= GEO_CACHE_MAX) geoCache.current.delete(geoCache.current.keys().next().value);
        geoCache.current.set(key, d);
        applyGeo(d);
      } catch (err) {
        if (!ctrl.signal.aborted && err?.name !== 'AbortError') { setGeoFail(true); setLabel(''); }
      } finally {
        if (geoAbort.current === ctrl) setResolving(false);
      }
    }, GEO_DEBOUNCE);
  }, [language, applyGeo]);

  const handleFail = useCallback(() => setMapFailed(true), []);
  const handleReady = useCallback((lat, lng) => {
    setCoords((p) => p || { lat: round6(lat), lng: round6(lng) });
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || searching) return;
    searchAbort.current?.abort();
    const ctrl = new AbortController();
    searchAbort.current = ctrl;
    setSearching(true);
    try {
      const res = await fetch(`${GEO_BASE}/search?format=jsonv2&limit=5&accept-language=${language}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error('search');
      const d = await res.json();
      if (!ctrl.signal.aborted) setResults(Array.isArray(d) ? d : []);
    } catch (err) {
      if (!ctrl.signal.aborted && err?.name !== 'AbortError') {
        setResults(null);
        toast({ icon: 'error', title: x.searchFail });
      }
    } finally {
      if (searchAbort.current === ctrl) setSearching(false);
    }
  }, [query, searching, language, x.searchFail]);

  const onSearchKey = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
  }, [runSearch]);

  const pickResult = useCallback((r) => {
    const lat = toCoord(r.lat);
    const lng = toCoord(r.lon);
    setResults(null);
    if (lat != null && lng != null) mapApi.current?.flyTo(lat, lng, 17);
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation || locating) { toast({ icon: 'error', title: x.locateFail }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); mapApi.current?.flyTo(pos.coords.latitude, pos.coords.longitude, 17); },
      () => { setLocating(false); toast({ icon: 'error', title: x.locateFail }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [locating, x.locateFail]);

  const zoomIn = useCallback(() => mapApi.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapApi.current?.zoomOut(), []);

  const submit = (e) => {
    e.preventDefault();
    const problem = validateAddr(form, t.validation);
    if (problem) { setError(problem); return; }
    onSubmit(addrPayload(form, coords));
  };

  const status = resolving ? x.resolving : geoFail ? x.resolveFail : label || x.idle;

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={isEdit ? m.editTitle : m.addTitle} className="nb-card relative w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={FiMapPin} tone={isEdit ? 'am' : 'em'} className="w-9 h-9" size={16} />
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{isEdit ? m.editTitle : m.addTitle}</span></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={m.close} className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="overflow-y-auto slim-scroll p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3 min-w-0">
            <div className={`nb-map h-80 sm:h-[28rem] ${dark ? 'is-dark' : ''}`}>
              {mapFailed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <FiAlertCircle size={26} className="text-red-500" />
                  <p className="text-xs font-bold">{x.mapFail}</p>
                </div>
              ) : (
                <>
                  <PinMap start={start} apiRef={mapApi} onPick={handlePick} onDragging={setDragging} onReady={handleReady} onFail={handleFail} loadingText={x.mapLoading} />
                  <div className="nb-map-vig absolute inset-0 z-[500]" aria-hidden="true" />
                  <PinMarker lifted={dragging} />

                  <div className="absolute start-2 end-2 top-2 z-[1000]">
                    <div className="nb-field flex h-10 items-center gap-2 ps-3 pe-1">
                      <FiSearch size={15} aria-hidden="true" className="flex-shrink-0" />
                      <input
                        type="text"
                        value={query}
                        maxLength={120}
                        autoComplete="off"
                        aria-label={x.search}
                        placeholder={x.search}
                        onChange={(e) => { setQuery(e.target.value); setResults(null); }}
                        onKeyDown={onSearchKey}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
                      />
                      <button type="button" onClick={runSearch} disabled={searching || !query.trim()} className={`${BTN_PRIMARY} h-8 uppercase`}>
                        {searching ? <FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" /> : x.searchGo}
                      </button>
                    </div>
                    {results && (
                      <div className="nb-menu mt-1.5 max-h-52 overflow-y-auto slim-scroll">
                        {results.length ? results.map((r) => (
                          <button key={r.place_id} type="button" onClick={() => pickResult(r)} className="nb-opt !normal-case !justify-start">
                            <FiMapPin size={14} aria-hidden="true" className="nb-ic flex-shrink-0" />
                            <span className="line-clamp-2">{r.display_name}</span>
                          </button>
                        )) : <p className="nb-muted px-3 py-3 text-xs font-bold">{x.noResults}</p>}
                      </div>
                    )}
                  </div>

                  <div className="nb-chip absolute start-2 bottom-7 z-[1000] !normal-case">
                    <FiMapPin size={11} aria-hidden="true" /> {dragging ? x.hint : x.pinned}
                  </div>

                  <div className="absolute end-2 bottom-7 z-[1000] flex flex-col gap-2">
                    <button type="button" onClick={locateMe} disabled={locating} title={x.locate} aria-label={x.locate} className={`${BTN} nb-btn-a h-9 w-9`}>
                      {locating ? <FiRefreshCw size={15} className="animate-spin motion-reduce:animate-none" /> : <FiNavigation size={15} />}
                    </button>
                    <button type="button" onClick={zoomIn} title={x.zoomIn} aria-label={x.zoomIn} className={`${BTN} h-9 w-9`}><FiPlus size={16} /></button>
                    <button type="button" onClick={zoomOut} title={x.zoomOut} aria-label={x.zoomOut} className={`${BTN} h-9 w-9`}><FiMinus size={16} /></button>
                  </div>
                </>
              )}
            </div>

            <div className={`${PANEL} p-3 flex items-start gap-2.5`} aria-live="polite">
              {resolving
                ? <FiRefreshCw size={15} className="nb-ic mt-0.5 flex-shrink-0 animate-spin motion-reduce:animate-none" />
                : <FiMapPin size={15} className="nb-ic mt-0.5 flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-xs font-extrabold break-words">{status}</p>
                {coords && (
                  <p dir="ltr" className="nb-muted mt-1 text-[10px] font-bold tabular-nums text-start">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3.5 min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase rtl:tracking-normal"><span className="nb-bar" aria-hidden="true" />{x.details}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={m.state} htmlFor="ad-state"><input id="ad-state" autoComplete="address-level1" value={form.state} onChange={set('state')} className={FIELD} /></Field>
              <Field label={m.city} htmlFor="ad-city"><input id="ad-city" autoComplete="address-level2" value={form.city} onChange={set('city')} className={FIELD} /></Field>
            </div>
            <Field label={m.street} htmlFor="ad-street"><input id="ad-street" autoComplete="street-address" value={form.street} onChange={set('street')} className={FIELD} /></Field>
            <Field label={m.building} htmlFor="ad-building"><input id="ad-building" value={form.building} onChange={set('building')} className={FIELD} /></Field>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
              {m.makeDefault}
            </label>
            {error && (
              <p role="alert" className="nb-card flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold !border-red-500 text-red-600 dark:text-red-300">
                <FiAlertCircle size={13} /> {error}
              </p>
            )}
          </div>
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex gap-2.5 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={busy} className={`${BTN_MD} flex-1 uppercase`}>{m.cancel}</button>
          <button type="submit" disabled={busy} className={`${BTN_PRIMARY} flex-1 uppercase`}>{busy ? m.saving : isEdit ? m.save : m.add}</button>
        </div>
      </form>
    </Overlay>
  );
});

const AddressRow = memo(({ addr, busy, loc, onEdit, onDelete }) => {
  const t = loc.L.profile.addresses;
  const x = MAP_TXT[loc.language] || MAP_TXT.en;
  const sep = loc.isAr ? '،' : ',';
  const c = coordsOf(addr);
  return (
    <div className={`${PANEL} p-3.5 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <IconTile icon={FiHome} tone="em" className="w-9 h-9" size={15} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span className="truncate">{addr.state}{sep} {addr.city}</span>
            {addr.isDefault && <span className="nb-chip flex-shrink-0" style={{ background: '#34d399', color: '#04261a' }}>{t.primary}</span>}
            {c && <span className="nb-chip flex-shrink-0"><FiMapPin size={10} aria-hidden="true" />{x.onMap}</span>}
          </p>
          <p className="nb-muted text-[11px] font-semibold truncate">{[addr.street, addr.building].filter(Boolean).join(' — ')}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {c && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=17/${c.lat}/${c.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            title={x.openMap}
            aria-label={x.openMap}
            className={BTN_ICON}
          >
            <FiExternalLink size={14} />
          </a>
        )}
        <button type="button" disabled={busy} title={t.edit} aria-label={t.edit} onClick={() => onEdit(addr)} className={`${BTN_ICON} !text-amber-600 dark:!text-amber-300`}><FiEdit3 size={14} /></button>
        <button type="button" disabled={busy} title={t.delete} aria-label={t.delete} onClick={() => onDelete(addr)} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={14} /></button>
      </div>
    </div>
  );
});

const SettingsCard = memo(({ language }) => {
  const s = SETTINGS_TXT[language] || SETTINGS_TXT.en;
  const [themeDark, setThemeDark] = useState(() => readStorage('darkMode') === 'true');
  const langStyles = useMemo(() => LANG_OPTIONS.map((l) => getFontStyle(l.code)), []);

  useEffect(() => {
    const onTheme = (e) => setThemeDark(!!e.detail);
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  const applyTheme = useCallback((dark) => {
    setThemeDark(dark);
    writeStorage('darkMode', String(dark));
    document.documentElement.classList.toggle('dark', dark);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: dark }));
  }, []);

  const applyLanguage = useCallback((code) => {
    writeStorage('appLanguage', code);
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  return (
    <section className={`${CARD} p-5 space-y-4`}>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase">
          <FiSettings size={14} className="nb-ic" aria-hidden="true" /> <span className="nb-ul">{s.title}</span>
        </h3>
        <p className="nb-muted mt-1.5 text-[11px] font-semibold">{s.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`${PANEL} p-3.5`}>
          <p className="nb-muted mb-2.5 text-[10px] font-bold uppercase">{s.appearance}</p>
          <div role="group" aria-label={s.appearance} className="flex gap-2">
            <button type="button" aria-pressed={!themeDark} onClick={() => applyTheme(false)} className={`${!themeDark ? BTN_PRIMARY : BTN_MD} h-9 flex-1 uppercase`}>
              <FiSun size={14} aria-hidden="true" /> {s.light}
            </button>
            <button type="button" aria-pressed={themeDark} onClick={() => applyTheme(true)} className={`${themeDark ? BTN_PRIMARY : BTN_MD} h-9 flex-1 uppercase`}>
              <FiMoon size={14} aria-hidden="true" /> {s.dark}
            </button>
          </div>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <p className="nb-muted mb-2.5 text-[10px] font-bold uppercase">{s.language}</p>
          <div role="group" aria-label={s.language} className="flex gap-2">
            {LANG_OPTIONS.map((l, i) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                style={langStyles[i]}
                aria-pressed={language === l.code}
                onClick={() => applyLanguage(l.code)}
                className={`${language === l.code ? BTN_PRIMARY : BTN_MD} h-9 flex-1`}
              >
                <FiGlobe size={14} aria-hidden="true" /> {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

const LogoCard = memo(({ language, src, broken, onBroken, name, hasLogo, uploading, removing, onUpload, onRemove }) => {
  const t = getLogoT(language);
  const [file, setFile] = useState(null);
  const busy = uploading || removing;
  const showImg = !!src && !broken;

  const save = useCallback(async () => {
    if (!file || busy) return;
    if (await onUpload(file)) setFile(null);
  }, [file, busy, onUpload]);
  const cancel = useCallback(() => setFile(null), []);

  return (
    <section id="shop-logo-card" className={`${CARD} p-5 space-y-4`} aria-busy={busy}>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase">
          <FiImage size={14} className="nb-ic" aria-hidden="true" /> <span className="nb-ul">{t.cardTitle}</span>
        </h3>
        <p className="nb-muted mt-1.5 text-[11px] font-semibold">{t.cardSub}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-shrink-0 flex-col items-center gap-2">
          <div className={`${PANEL} nb-gray flex h-28 w-28 items-center justify-center overflow-hidden`}>
            {showImg
              ? <img src={src} alt="" width={112} height={112} decoding="async" loading="lazy" referrerPolicy="no-referrer" onError={onBroken} className="h-full w-full object-cover" />
              : name ? <span className="nb-ic text-4xl font-extrabold">{[...name][0]}</span> : <FaStore size={34} className="nb-ic" />}
          </div>
          <p className="nb-muted text-[10px] font-bold uppercase">{hasLogo ? t.current : t.noLogo}</p>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <LogoDropzone id="sp-logo" file={file} onChange={setFile} disabled={busy} language={language} compact />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={!file || busy} className={`${BTN_PRIMARY} h-9 uppercase`}>
              {uploading ? <><FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" /> {t.saving}</> : t.save}
            </button>
            {file && (
              <button type="button" onClick={cancel} disabled={busy} className={`${BTN_MD} h-9 uppercase`}>{t.cancel}</button>
            )}
            {hasLogo && !file && (
              <button type="button" onClick={onRemove} disabled={busy} className={`${BTN_MD} h-9 uppercase !text-red-600 dark:!text-red-300`}>
                {removing
                  ? <><FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" /> {t.removing}</>
                  : <><FiTrash2 size={13} aria-hidden="true" /> {t.remove}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

const ShopProfile = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.profile;
  const tt = L.table;
  const nf = fm.number;
  const { accessToken, user } = useAuthStore();
  const shopId = String(user?.id ?? user?.shopId ?? localStorage.getItem('id') ?? '');
  const validShop = isSafeId(shopId);

  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [pass, setPass] = useState({ next: '', confirm: '' });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const [addrModal, setAddrModal] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const [busyAddr, setBusyAddr] = useState(null);

  const logoInputRef = useRef(null);
  const abortRef = useRef(null);
  const addressesRef = useRef(addresses);
  const busyAddrRef = useRef(null);
  const locRef = useRef(loc);
  useEffect(() => { addressesRef.current = addresses; }, [addresses]);
  useEffect(() => { locRef.current = loc; }, [loc]);
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const fetchAll = useCallback(async ({ only, resetForm = true } = {}) => {
    if (!accessToken || !validShop) { setLoading(false); return; }
    const full = !only;
    let signal;
    if (full) {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      ({ signal } = controller);
      setLoading(true);
    }
    const [shopRes, addrRes] = await Promise.allSettled([
      only === 'addresses' ? null : api.get(`/api/shops/${encodeURIComponent(shopId)}`, { signal }),
      only === 'shop' ? null : api.get('/api/shops/address', { signal }),
    ]);
    if (signal?.aborted) return;
    if (shopRes.status === 'fulfilled' && shopRes.value) {
      const d = shopRes.value.data || {};
      setShop(d);
      if (resetForm) setForm({ name: d.name || '', description: d.description || '' });
      setLogoBroken(false);
    } else if (shopRes.status === 'rejected') {
      toast({ icon: 'error', title: locRef.current.L.profile.toasts.loadFail, text: errText(shopRes.reason) });
    }
    if (addrRes.status === 'fulfilled' && addrRes.value) {
      const d = addrRes.value.data;
      setAddresses(Array.isArray(d) ? d : d?.content || []);
    }
    if (full) setLoading(false);
  }, [accessToken, shopId, validShop]);

  useEffect(() => { fetchAll(); return () => abortRef.current?.abort(); }, [fetchAll]);
  const refresh = useCallback(() => fetchAll(), [fetchAll]);

  const dirty = shop && (form.name.trim() !== (shop.name || '') || form.description.trim() !== (shop.description || ''));

  const saveProfile = useCallback(async (e) => {
    e.preventDefault();
    const x = locRef.current.L.profile.toasts;
    const name = form.name.trim();
    if (!name) { toast({ icon: 'warning', title: x.nameRequired }); return; }
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await putShopForm(shopId, { name, description: form.description.trim() });
      toast({ icon: 'success', title: x.updated });
      fetchAll({ only: 'shop' });
    } catch (err) {
      toast({ icon: 'error', title: x.updateFail, text: errText(err) });
    } finally {
      setSavingProfile(false);
    }
  }, [form, shopId, savingProfile, fetchAll]);

  const passProblem = useMemo(() => {
    if (!pass.next) return '';
    if (pass.next.length < PASS_MIN) return tpl(t.passShort, { n: nf.format(PASS_MIN) });
    if (!/[A-Za-z]/.test(pass.next) || !/\d/.test(pass.next)) return t.passMix;
    if (pass.confirm && pass.next !== pass.confirm) return t.passMismatch;
    return '';
  }, [pass, t, nf]);

  const savePassword = useCallback(async (e) => {
    e.preventDefault();
    const x = locRef.current.L.profile;
    if (!pass.next || passProblem || pass.next !== pass.confirm || savingPass) {
      if (pass.next && pass.next !== pass.confirm) toast({ icon: 'warning', title: x.passMismatch });
      return;
    }
    setSavingPass(true);
    try {
      await putShopForm(shopId, { name: (shop?.name || form.name).trim(), description: (shop?.description || '').trim(), password: pass.next });
      toast({ icon: 'success', title: x.toasts.passChanged });
    } catch (err) {
      toast({ icon: 'error', title: x.toasts.passFail, text: errText(err) });
    } finally {
      setPass({ next: '', confirm: '' });
      setSavingPass(false);
    }
  }, [pass, passProblem, savingPass, shop, form.name, shopId]);

  const applyShop = useCallback((data, fallback) => {
    setLogoBroken(false);
    setShop((p) => ({ ...(p || {}), ...(data && typeof data === 'object' ? data : {}), ...(fallback || {}) }));
  }, []);

  const uploadLogo = useCallback(async (file) => {
    if (uploading || removing) return false;
    const x = locRef.current.L.profile;
    setUploading(true);
    try {
      const { data } = await putShopForm(shopId, { logo: file });
      toast({ icon: 'success', title: x.toasts.logoUpdated });
      applyShop(data);
      if (!data?.logoUrl) await fetchAll({ only: 'shop', resetForm: false });
      return true;
    } catch (err) {
      toast({ icon: 'error', title: x.toasts.logoFail, text: uploadErrText(err, x.upload) });
      return false;
    } finally {
      setUploading(false);
    }
  }, [shopId, uploading, removing, applyShop, fetchAll]);

  const removeLogo = useCallback(async () => {
    if (uploading || removing) return;
    const { language: lg, L: LL } = locRef.current;
    const lt = getLogoT(lg);
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: lt.confirmRemoveTitle,
        text: lt.confirmRemoveText,
        icon: 'warning',
        confirmButtonText: lt.remove,
        cancelButtonText: LL.table.cancel,
        confirmButtonColor: '#ef4444',
      }));
    } catch {
      toast({ icon: 'error', title: LL.profile.toasts.confirmFail, text: LL.profile.toasts.confirmFailText });
      return;
    }
    if (!isConfirmed) return;
    setRemoving(true);
    try {
      const { data } = await putShopForm(shopId, { removeLogo: true });
      applyShop(data, { logoUrl: null, logo: null, logoPath: null });
      toast({ icon: 'success', title: lt.removed });
    } catch (err) {
      toast({ icon: 'error', title: lt.removeFail, text: errText(err) });
    } finally {
      setRemoving(false);
    }
  }, [shopId, uploading, removing, applyShop]);

  const handleLogoUpload = useCallback(async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked || uploading || removing) return;
    const { L: LL, language: lg } = locRef.current;
    const res = await prepareLogoFile(picked, getLogoT(lg));
    if (res.error) { toast({ icon: 'error', title: LL.profile.toasts.invalidImage, text: res.error }); return; }
    uploadLogo(res.file);
  }, [uploading, removing, uploadLogo]);

  const logoSrc = useMemo(() => resolveImageSrc(shop?.logoUrl ?? shop?.logo ?? shop?.logoPath ?? ''), [shop]);

  const saveAddress = useCallback(async (payload) => {
    if (addrSaving) return;
    const x = locRef.current.L.profile.toasts;
    const editing = addrModal && addrModal !== 'new' ? addrModal : null;
    if (editing && !isSafeId(editing.id)) { toast({ icon: 'error', title: x.invalidAddrId }); return; }
    setAddrSaving(true);
    try {
      if (editing) await api.put(`/api/shops/address/${encodeURIComponent(editing.id)}`, payload);
      else await api.post('/api/shops/address', payload);
      toast({ icon: 'success', title: editing ? x.addrUpdated : x.addrAdded });
      setAddrModal(null);
      fetchAll({ only: 'addresses' });
    } catch (err) {
      toast({ icon: 'error', title: editing ? x.addrUpdateFail : x.addrAddFail, text: errText(err) });
    } finally {
      setAddrSaving(false);
    }
  }, [addrModal, addrSaving, fetchAll]);

  const deleteAddress = useCallback(async (addr) => {
    if (!isSafeId(addr.id) || busyAddrRef.current) return;
    const { L: LL } = locRef.current;
    const x = LL.profile;
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: x.confirmDelete.title,
        text: x.confirmDelete.text,
        icon: 'warning',
        confirmButtonText: x.confirmDelete.yes,
        cancelButtonText: LL.table.cancel,
        confirmButtonColor: '#ef4444',
      }));
    } catch {
      toast({ icon: 'error', title: x.toasts.confirmFail, text: x.toasts.confirmFailText });
      return;
    }
    if (!isConfirmed) return;
    busyAddrRef.current = addr.id;
    setBusyAddr(addr.id);
    const idx = addressesRef.current.findIndex((a) => a.id === addr.id);
    setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
    try {
      await api.delete(`/api/shops/address/${encodeURIComponent(addr.id)}`);
      toast({ icon: 'success', title: locRef.current.L.profile.toasts.addrDeleted });
    } catch (err) {
      setAddresses((prev) => (prev.some((a) => a.id === addr.id)
        ? prev
        : [...prev.slice(0, Math.max(idx, 0)), addr, ...prev.slice(Math.max(idx, 0))]));
      toast({ icon: 'error', title: locRef.current.L.profile.toasts.addrDeleteFail, text: errText(err) });
    } finally {
      busyAddrRef.current = null;
      setBusyAddr(null);
    }
  }, []);

  const handleEdit = useCallback((a) => setAddrModal(a), []);
  const openNewAddr = useCallback(() => setAddrModal('new'), []);
  const openLogoPicker = useCallback(() => logoInputRef.current?.click(), []);
  const closeAddr = useCallback(() => { if (!addrSaving) setAddrModal(null); }, [addrSaving]);
  const onLogoError = useCallback(() => setLogoBroken(true), []);

  const statCards = useMemo(() => [
    { label: t.stats.rating.label, value: shop?.rating ? nf.format(Number(Number(shop.rating).toFixed(1))) : '—', description: t.stats.rating.desc, icon: FiStar, tone: 'am' },
    { label: t.stats.status.label, value: shop?.activate ? t.stats.status.active : t.stats.status.suspended, description: t.stats.status.desc, icon: FiShield, tone: shop?.activate ? 'em' : 'ro' },
    { label: t.stats.verification.label, value: shop?.verified ? t.stats.verification.verified : t.stats.verification.unverified, description: t.stats.verification.desc, icon: FiCheckCircle, tone: shop?.verified ? 'sky' : 'te' },
    { label: t.stats.addresses.label, value: nf.format(addresses.length), description: t.stats.addresses.desc, icon: FiMapPin, tone: 'vi' },
  ], [shop, addresses.length, t, nf]);

  const overview = useMemo(() => [
    [FiMail, t.email, shop?.email || '—', true],
    [FiPhone, t.phone, shop?.phone || t.notSet, true],
    [FiGlobe, t.joined, fmt(fm.date, shop?.createdAt), false],
  ], [shop, t, fm]);

  const wrapperProps = {
    dir,
    lang: language,
    style: font,
    className: 'nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start',
  };

  if (!accessToken || !validShop) {
    return (
      <div {...wrapperProps}>
        <style>{PAGE_CSS}</style><Defs3D />
        <div className="max-w-7xl mx-auto px-4 sm:px-6"><div className={`${CARD} p-10`}><EmptyState3D kind="box" title={t.noShop.title} subtitle={t.noShop.sub} darkMode={darkMode} /></div></div>
      </div>
    );
  }

  return (
    <div {...wrapperProps}>
      <style>{PAGE_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <div key={language} className="lang-fade max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={openLogoPicker}
              disabled={uploading || removing}
              title={t.changeLogo}
              aria-label={t.changeLogoAria}
              className="nb-btn nb-gray relative w-16 h-16 overflow-hidden flex-shrink-0 group"
            >
              {logoSrc && !logoBroken
                ? <img src={logoSrc} alt="" width={64} height={64} decoding="async" referrerPolicy="no-referrer" onError={onLogoError} className="w-full h-full object-cover" />
                : shop?.name ? <span className="nb-ic text-2xl font-extrabold">{[...shop.name][0]}</span> : <FaStore size={26} className="nb-ic" />}
              <span className="absolute inset-0 bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity motion-reduce:transition-none">
                <FiCamera size={18} className={uploading ? 'animate-pulse motion-reduce:animate-none' : ''} />
              </span>
            </button>
            <input ref={logoInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase rtl:tracking-normal tracking-wide">
                <span className="nb-bar" aria-hidden="true" />
                <FiTag size={12} aria-hidden="true" /> {shop?.shopType || t.defaultType}
              </p>
              <h1 className="mt-2 flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight rtl:tracking-normal leading-[1.15]">
                <span className="nb-ul truncate">{shop?.name || t.defaultName}</span>
                {shop?.verified && <FiCheckCircle className="nb-ic flex-shrink-0" size={20} aria-label={t.verifiedAria} />}
              </h1>
            </div>
          </div>
          <button type="button" onClick={refresh} aria-label={tt.refresh} title={tt.refresh} className={`${BTN_MD} h-10 uppercase`}>
            <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> {tt.refresh}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <section className={`${CARD} p-5 space-y-3 lg:col-span-1`} aria-busy={loading}>
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{t.overview}</span></h3>
            {overview.map(([Icon, label, value, ltr]) => (
              <div key={label} className={`${PANEL} p-3`}>
                <p className="nb-muted text-[9px] font-bold uppercase mb-1">{label}</p>
                <p className="flex items-center gap-2 text-xs font-extrabold break-all">
                  <Icon size={13} className="nb-ic flex-shrink-0" />
                  <bdi dir={ltr ? 'ltr' : undefined}>{loading && !shop ? '…' : value}</bdi>
                </p>
              </div>
            ))}
          </section>

          <div className="lg:col-span-2 space-y-5">
            <LogoCard
              language={language}
              src={logoSrc}
              broken={logoBroken}
              onBroken={onLogoError}
              name={shop?.name}
              hasLogo={!!(shop?.logoUrl ?? shop?.logo ?? shop?.logoPath)}
              uploading={uploading}
              removing={removing}
              onUpload={uploadLogo}
              onRemove={removeLogo}
            />

            <SettingsCard language={language} />

            <form onSubmit={saveProfile} noValidate className={`${CARD} p-5 space-y-4`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{t.store.title}</span></h3>
                <button type="submit" disabled={savingProfile || !dirty} className={`${BTN_PRIMARY} h-9 uppercase`}>{savingProfile ? t.store.saving : t.store.save}</button>
              </div>
              <Field label={t.store.name} htmlFor="sp-name">
                <input id="sp-name" type="text" maxLength={NAME_MAX} autoComplete="organization" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={FIELD} />
              </Field>
              <Field label={t.store.desc} htmlFor="sp-desc" hint={`${nf.format(form.description.length)} / ${nf.format(DESC_MAX)}`}>
                <textarea id="sp-desc" rows={4} maxLength={DESC_MAX} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder={t.store.descPlaceholder} className="nb-input w-full px-3 py-2 text-sm font-semibold resize-none" />
              </Field>
            </form>

            <form onSubmit={savePassword} noValidate className={`${CARD} p-5 space-y-4`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase"><FiLock size={14} className="nb-ic" /> <span className="nb-ul">{t.security.title}</span></h3>
                <button type="submit" disabled={savingPass || !pass.next || !pass.confirm || !!passProblem} className={`${BTN_MD} h-9 uppercase`}>{savingPass ? t.security.submitting : t.security.submit}</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t.security.next} htmlFor="sp-pass">
                  <input id="sp-pass" type="password" autoComplete="new-password" maxLength={PASS_MAX} value={pass.next} onChange={(e) => setPass((p) => ({ ...p, next: e.target.value }))} className={FIELD} />
                </Field>
                <Field label={t.security.confirm} htmlFor="sp-pass2">
                  <input id="sp-pass2" type="password" autoComplete="new-password" maxLength={PASS_MAX} value={pass.confirm} onChange={(e) => setPass((p) => ({ ...p, confirm: e.target.value }))} className={FIELD} />
                </Field>
              </div>
              {passProblem && <p role="alert" className="text-[11px] font-bold text-red-500">{passProblem}</p>}
            </form>

            <section className={`${CARD} p-5 space-y-3`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase"><FiMapPin size={14} className="nb-ic" /> <span className="nb-ul">{t.addresses.title}</span></h3>
                <button type="button" onClick={openNewAddr} className={`${BTN_PRIMARY} h-9 uppercase`}><FiPlus size={14} /> {t.addresses.add}</button>
              </div>
              {addresses.length === 0 ? (
                <div className="py-8"><EmptyState3D kind="box" title={t.addresses.emptyTitle} subtitle={t.addresses.emptySub} darkMode={darkMode} /></div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((a) => <AddressRow key={a.id} addr={a} busy={busyAddr === a.id} loc={loc} onEdit={handleEdit} onDelete={deleteAddress} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {addrModal && (
        <AddressModal
          key={addrModal === 'new' ? 'new' : addrModal.id}
          initial={addrModal === 'new' ? null : addrModal}
          busy={addrSaving}
          loc={loc}
          dark={darkMode}
          onClose={closeAddr}
          onSubmit={saveAddress}
        />
      )}
    </div>
  );
};

export default memo(ShopProfile);