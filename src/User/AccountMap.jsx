import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  FiSearch, FiLoader, FiCrosshair, FiExternalLink, FiMapPin, FiAlertTriangle, FiLayers, FiPlus, FiMinus, FiCheck,
} from 'react-icons/fi';

const STREET_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const DEFAULT_POINT = { lat: 30.0444, lng: 31.2357 };
const SAME = 1e-6;
const MAX_QUERY = 200;
const REVERSE_CACHE_LIMIT = 60;
const REVERSE_CACHE = new Map();

const DEFAULT_LABELS = {
  searchPlaceholder: 'Search for an address',
  searchLabel: 'Search address',
  useMyLocation: 'Use my current location',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  satellite: 'Toggle satellite view',
  pinTip: 'Your order will be delivered here',
  pinLabel: 'Selected location',
  currentLocation: 'Current location',
  dragHint: 'Drag the map to place the pin',
  locating: 'Locating address…',
  confirm: 'Confirm location',
  directions: 'Directions',
  mapLoading: 'Loading map',
  mapError: 'The map could not be loaded. You can still enter the latitude and longitude manually.',
  locationError: 'Could not get your location.',
};

const LANG = typeof navigator !== 'undefined' && navigator.language ? encodeURIComponent(navigator.language.slice(0, 10)) : 'en';

let leafletPromise;
const loadLeaflet = () => {
  if (!leafletPromise) {
    leafletPromise = Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([m]) => m.default || m)
      .catch((err) => { leafletPromise = undefined; throw err; });
  }
  return leafletPromise;
};

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const nominatim = async (path, signal) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/${path}&accept-language=${LANG}`, {
    signal,
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!res.ok) throw new Error('nominatim failed');
  return res.json();
};

const clean = (v, max = 160) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);

const validPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const directionsUrl = (lat, lng, oLat, oLng) => {
  const dest = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
  const hasOrigin = validPoint(oLat, oLng);
  return `https://www.google.com/maps/dir/?api=1${hasOrigin ? `&origin=${oLat.toFixed(6)},${oLng.toFixed(6)}` : ''}&destination=${dest}&travelmode=driving`;
};

const toPlace = (d) => {
  const a = d?.address || {};
  const first = String(d?.display_name || '').split(',')[0];
  const title = clean(d?.name || a.road || a.neighbourhood || a.suburb || a.city_district || first, 100);
  const parts = [a.suburb || a.city_district, a.city || a.town || a.village || a.state, a.country]
    .map((p) => clean(p, 60))
    .filter((p, i, arr) => p && p !== title && arr.indexOf(p) === i);
  return { title, subtitle: parts.join(', '), full: clean(d?.display_name, 300) };
};

const pickFirst = (a, keys) => {
  for (const k of keys) {
    const v = clean(a[k], 80);
    if (v) return v;
  }
  return '';
};

const toDetails = (d) => {
  const a = d?.address || {};
  const house = clean([a.house_name, a.house_number].filter(Boolean).join(' '), 80);
  return {
    state: pickFirst(a, ['state', 'governorate', 'province', 'region', 'state_district']),
    city: pickFirst(a, ['city', 'town', 'village', 'municipality', 'county', 'city_district', 'suburb']),
    street: pickFirst(a, ['road', 'pedestrian', 'footway', 'residential', 'path', 'neighbourhood', 'suburb']),
    building: house || pickFirst(a, ['building']),
  };
};

const reverseKey = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;
const rememberReverse = (key, d) => {
  if (REVERSE_CACHE.size >= REVERSE_CACHE_LIMIT) REVERSE_CACHE.delete(REVERSE_CACHE.keys().next().value);
  REVERSE_CACHE.set(key, d);
};

const MAP_CSS = `.gp-map .leaflet-container{font-family:inherit;outline:none;background:#efece6;cursor:grab}
.gp-map .leaflet-container:active{cursor:grabbing}
.gp-map.gp-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) saturate(1.1) brightness(.95) contrast(.95)}
.gp-map .leaflet-control-attribution{font-size:10px}
.dark .gp-map .leaflet-control-attribution{background:rgba(17,24,39,.8);color:#9ca3af}
.dark .gp-map .leaflet-control-attribution a{color:#6ee7b7}`;

const MapPicker = memo(({ latitude, longitude, onChange, onAddress, onConfirm, darkMode, labels }) => {
  const L = labels ? { ...DEFAULT_LABELS, ...labels } : DEFAULT_LABELS;
  const mapEl = useRef(null);
  const map = useRef(null);
  const layers = useRef(null);
  const appliedSat = useRef(false);
  const onChangeRef = useRef(onChange);
  const lastPoint = useRef(null);
  const programmatic = useRef(false);
  const progTimer = useRef(null);
  const skipSearch = useRef(false);
  const searchBox = useRef(null);
  const latest = useRef({ latitude, longitude });
  latest.current = { latitude, longitude };
  const onAddressRef = useRef(onAddress);
  const autoFill = useRef(false);
  const autoTimer = useRef(null);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onAddressRef.current = onAddress; }, [onAddress]);

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const hasPoint = validPoint(latNum, lngNum) && (latNum !== 0 || lngNum !== 0);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const [place, setPlace] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState(null);

  const emit = useCallback((lat, lng) => {
    if (!validPoint(lat, lng)) return;
    autoFill.current = true;
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => { autoFill.current = false; }, 8000);
    onChangeRef.current?.(lat, lng);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let instance = null;
    let observer = null;
    let timer = null;
    let loaded = false;
    let raf = 0;

    loadLeaflet().then((Lf) => {
      if (cancelled || !mapEl.current) return;
      const { latitude: lat0, longitude: lng0 } = latest.current;
      const lat = Number(lat0) || DEFAULT_POINT.lat;
      const lng = Number(lng0) || DEFAULT_POINT.lng;
      lastPoint.current = { lat, lng };
      const calm = prefersReducedMotion();

      try {
        instance = Lf.map(mapEl.current, {
          center: [lat, lng],
          zoom: Number(lat0) ? 17 : 15,
          minZoom: 3,
          maxZoom: 19,
          zoomControl: false,
          attributionControl: false,
          doubleClickZoom: false,
          scrollWheelZoom: 'center',
          touchZoom: 'center',
          worldCopyJump: true,
          zoomAnimation: !calm,
          fadeAnimation: !calm,
        });
      } catch { setMapError(true); return; }

      Lf.control.attribution({ prefix: false, position: 'bottomright' }).addTo(instance);

      const tileOpts = { maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2, referrerPolicy: 'strict-origin-when-cross-origin' };
      const street = Lf.tileLayer(STREET_URL, { ...tileOpts, attribution: STREET_ATTR });
      const sat = Lf.tileLayer(SAT_URL, { ...tileOpts, maxNativeZoom: 18, attribution: SAT_ATTR });
      layers.current = { street, sat };
      street.addTo(instance);

      timer = setTimeout(() => { if (!loaded && !cancelled) setMapError(true); }, 25000);
      street.once('tileload', () => {
        loaded = true;
        clearTimeout(timer);
        if (!cancelled) setReady(true);
      });

      instance.on('movestart', () => { if (!cancelled) setLifting(true); });
      instance.on('moveend', () => {
        if (cancelled) return;
        setLifting(false);
        if (programmatic.current) { programmatic.current = false; return; }
        const c = instance.getCenter().wrap();
        const p = lastPoint.current;
        if (!p || Math.abs(c.lat - p.lat) > SAME || Math.abs(c.lng - p.lng) > SAME) {
          lastPoint.current = { lat: c.lat, lng: c.lng };
          emit(c.lat, c.lng);
        }
      });
      instance.on('click', (e) => { emit(e.latlng.lat, e.latlng.lng); });

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => { if (!cancelled && instance) instance.invalidateSize(); });
        });
        observer.observe(mapEl.current);
      }

      map.current = instance;
    }).catch(() => { if (!cancelled) setMapError(true); });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(progTimer.current);
      clearTimeout(autoTimer.current);
      cancelAnimationFrame(raf);
      observer?.disconnect();
      try { instance?.remove(); } catch { }
      map.current = null;
      layers.current = null;
    };
  }, [emit]);

  useEffect(() => {
    const m = map.current;
    const l = layers.current;
    if (!ready || !m || !l || appliedSat.current === satellite) return;
    appliedSat.current = satellite;
    const [on, off] = satellite ? [l.sat, l.street] : [l.street, l.sat];
    on.addTo(m);
    if (m.hasLayer(off)) m.removeLayer(off);
  }, [satellite, ready]);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m || !hasPoint) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - latNum) < SAME && Math.abs(c.lng - lngNum) < SAME) return;
    lastPoint.current = { lat: latNum, lng: lngNum };
    const zoom = Math.max(m.getZoom(), 16);

    programmatic.current = true;
    clearTimeout(progTimer.current);
    progTimer.current = setTimeout(() => { programmatic.current = false; }, 2000);
    if (prefersReducedMotion()) m.setView([latNum, lngNum], zoom, { animate: false });
    else m.flyTo([latNum, lngNum], zoom, { duration: 1.2 });
  }, [latNum, lngNum, hasPoint, ready]);

  useEffect(() => {
    if (!hasPoint) { setPlace(null); setResolving(false); return undefined; }

    const apply = (d) => {
      if (!d || d.error) { setPlace(null); return; }
      setPlace(toPlace(d));
      if (autoFill.current) {
        autoFill.current = false;
        clearTimeout(autoTimer.current);
        onAddressRef.current?.(toDetails(d));
      }
    };

    const key = reverseKey(latNum, lngNum);
    const hit = REVERSE_CACHE.get(key);
    if (hit) { apply(hit); setResolving(false); return undefined; }

    const ctrl = new AbortController();
    setResolving(true);
    const id = setTimeout(() => {
      nominatim(`reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`, ctrl.signal)
        .then((d) => {
          if (ctrl.signal.aborted) return;
          if (d && !d.error && typeof d === 'object') rememberReverse(key, d);
          apply(d);
        })
        .catch(() => { })
        .finally(() => { if (!ctrl.signal.aborted) setResolving(false); });
    }, 350);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [latNum, lngNum, hasPoint]);

  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return undefined; }
    const q = query.trim();
    if (q.length < 3) { setSuggestions([]); return undefined; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await nominatim(`search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`, ctrl.signal);
        if (!ctrl.signal.aborted) setSuggestions(Array.isArray(list) ? list.filter((s) => s && s.place_id != null && validPoint(parseFloat(s.lat), parseFloat(s.lon))).slice(0, 5) : []);
      } catch { } finally { if (!ctrl.signal.aborted) setSearching(false); }
    }, 400);
    return () => { clearTimeout(id); ctrl.abort(); setSearching(false); };
  }, [query]);

  useEffect(() => {
    if (!suggestions.length) return undefined;
    const onDown = (e) => { if (!searchBox.current?.contains(e.target)) setSuggestions([]); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [suggestions.length]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); setOrigin({ lat: coords.latitude, lng: coords.longitude }); emit(coords.latitude, coords.longitude); },
      () => {
        setLocating(false);
        import('sweetalert2').then((m) => (m.default || m).fire({ title: clean(L.locationError, 120), icon: 'error', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [emit, L.locationError]);

  const pick = useCallback((s) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    if (!validPoint(lat, lng)) return;
    skipSearch.current = true;
    emit(lat, lng);
    const details = toDetails(s);
    if (details.state || details.city || details.street || details.building) onAddressRef.current?.(details);
    setQuery(clean(s.display_name, MAX_QUERY));
    setSuggestions([]);
  }, [emit]);
  const onQueryChange = useCallback((e) => setQuery(e.target.value.slice(0, MAX_QUERY)), []);
  const onQueryKeyDown = useCallback((e) => { if (e.key === 'Escape') setSuggestions([]); }, []);
  const zoomIn = useCallback(() => map.current?.zoomIn(), []);
  const zoomOut = useCallback(() => map.current?.zoomOut(), []);
  const toggleSat = useCallback(() => setSatellite((v) => !v), []);
  const confirm = useCallback(() => {
    if (!hasPoint || typeof onConfirm !== 'function') return;
    onConfirm({ latitude: latNum, longitude: lngNum, address: place?.full || '', title: place?.title || '', subtitle: place?.subtitle || '' });
  }, [hasPoint, onConfirm, latNum, lngNum, place]);

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const panel = darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-800';
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500';
  const stackBtn = `flex h-11 w-11 items-center justify-center transition-colors ${focus} ${darkMode ? 'hover:text-emerald-400' : 'hover:text-emerald-600'}`;
  const showControls = ready && !mapError;

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${panel}`}>
      <style>{MAP_CSS}</style>

      <div className={`gp-map relative ${darkMode && !satellite ? 'gp-dark' : ''}`}>
        <div ref={mapEl} className="isolate h-[380px] w-full sm:h-[460px]" style={{ zIndex: 0 }} />

        {showControls && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start gap-2">
              <div ref={searchBox} className="pointer-events-auto relative min-w-0 flex-1">
                <FiSearch aria-hidden="true" className={`pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 ${muted}`} />
                <input
                  type="search"
                  value={query}
                  onChange={onQueryChange}
                  onKeyDown={onQueryKeyDown}
                  placeholder={L.searchPlaceholder}
                  aria-label={L.searchLabel}
                  autoComplete="off"
                  maxLength={MAX_QUERY}
                  className={`h-12 w-full rounded-xl border ps-11 pe-10 text-sm font-medium shadow-md outline-none transition-shadow placeholder:font-normal focus:ring-2 focus:ring-emerald-500 ${panel}`}
                />
                {searching && <FiLoader aria-hidden="true" className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500 motion-reduce:animate-none" />}
                {suggestions.length > 0 && (
                  <ul className={`absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border shadow-xl ${panel}`}>
                    {suggestions.map((s) => (
                      <li key={s.place_id}>
                        <button
                          type="button"
                          onClick={() => pick(s)}
                          className={`flex w-full items-start gap-2 border-b px-3 py-2.5 text-start text-xs last:border-b-0 ${focus} ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                          <FiMapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          <span className="min-w-0 flex-1 break-words">{clean(s.display_name, MAX_QUERY)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                aria-label={L.useMyLocation}
                title={L.useMyLocation}
                className={`pointer-events-auto flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-bold text-emerald-600 shadow-md transition-opacity disabled:cursor-wait disabled:opacity-60 ${focus} ${panel} ${darkMode ? '!text-emerald-400' : ''}`}
              >
                {locating
                  ? <FiLoader aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                  : <FiCrosshair aria-hidden="true" className="h-5 w-5" />}
                <span className="hidden sm:inline">{L.useMyLocation}</span>
              </button>
            </div>

            <div className={`absolute end-3 top-[68px] z-20 flex flex-col overflow-hidden rounded-xl border shadow-md ${panel}`}>
              <button type="button" onClick={zoomIn} title={L.zoomIn} aria-label={L.zoomIn} className={stackBtn}><FiPlus size={20} /></button>
              <span aria-hidden="true" className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <button type="button" onClick={zoomOut} title={L.zoomOut} aria-label={L.zoomOut} className={stackBtn}><FiMinus size={20} /></button>
              <span aria-hidden="true" className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <button
                type="button"
                onClick={toggleSat}
                title={L.satellite}
                aria-label={L.satellite}
                aria-pressed={satellite}
                className={`${stackBtn} ${satellite ? 'text-emerald-500' : ''}`}
              >
                <FiLayers size={18} />
              </button>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0 w-0" role="img" aria-label={L.pinLabel}>
              <span
                aria-hidden="true"
                className={`absolute -left-2.5 -top-1 h-2 w-5 rounded-full bg-black/40 blur-[2px] transition duration-200 motion-reduce:transition-none ${lifting ? 'scale-50 opacity-40' : ''}`}
              />
              <span
                aria-hidden="true"
                style={{ transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)' }}
                className={`absolute bottom-0 left-0 flex w-max -translate-x-1/2 flex-col items-center whitespace-nowrap transition-transform duration-200 motion-reduce:transition-none ${lifting ? '-translate-y-3' : ''}`}
              >
                <span className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white shadow-lg">{L.pinTip}</span>
                <span className="-mt-1 mb-1 h-2.5 w-2.5 rotate-45 bg-gray-900" />
                <svg width="30" height="54" viewBox="0 0 30 54" fill="none" focusable="false" className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                  <line x1="15" y1="28" x2="15" y2="53" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="15" cy="15" r="13" fill="#111827" stroke="#fff" strokeWidth="2" />
                  <circle cx="15" cy="15" r="4.5" fill="#fff" />
                </svg>
              </span>
            </div>
          </>
        )}

        {!ready && !mapError && (
          <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-800/90' : 'bg-gray-50/90'}`}>
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent motion-reduce:animate-none" role="status" aria-label={L.mapLoading} />
          </div>
        )}
        {mapError && (
          <div role="alert" className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
            <FiAlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {L.mapError}
          </div>
        )}
      </div>

      {showControls && (
        <div className={`flex items-center gap-3 border-t p-3 sm:gap-4 sm:p-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <span aria-hidden="true" className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FiMapPin className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            {hasPoint ? (
              <>
                <p className="text-xs font-bold text-emerald-600">{L.currentLocation}</p>
                {place ? (
                  <>
                    <p className={`truncate text-sm font-extrabold sm:text-base ${resolving ? 'opacity-60' : ''}`}>{place.title}</p>
                    {place.subtitle && <p className={`truncate text-xs ${muted} ${resolving ? 'opacity-60' : ''}`}>{place.subtitle}</p>}
                  </>
                ) : (
                  <p className={`text-sm font-medium ${muted}`}>{resolving ? L.locating : Number.isFinite(latNum) ? `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}` : ''}</p>
                )}
              </>
            ) : (
              <p className={`text-sm font-semibold ${muted}`}>{L.dragHint}</p>
            )}
          </div>
          {hasPoint && (
            <a
              href={directionsUrl(latNum, lngNum, origin?.lat, origin?.lng)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={L.directions}
              title={L.directions}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-colors ${focus} ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <FiExternalLink className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          {typeof onConfirm === 'function' && (
            <button
              type="button"
              onClick={confirm}
              disabled={!hasPoint}
              className={`inline-flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition-[background-color,transform] hover:bg-emerald-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:min-w-[200px] ${focus}`}
            >
              <FiCheck className="h-5 w-5" aria-hidden="true" />
              {L.confirm}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default MapPicker;