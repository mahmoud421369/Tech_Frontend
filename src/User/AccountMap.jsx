import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  FiSearch, FiLoader, FiCrosshair, FiExternalLink, FiMapPin, FiAlertTriangle, FiLayers, FiPlus, FiMinus,
} from 'react-icons/fi';
import { Btn3D, inputCls } from '../components/user/Ui3D';

const STREET_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const DEFAULT_POINT = { lat: 30.0444, lng: 31.2357 };
const SAME = 1e-6;

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
  const res = await fetch(`https://nominatim.openstreetmap.org/${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('nominatim failed');
  return res.json();
};

const directionsUrl = (lat, lng, oLat, oLng) =>
  `https://www.google.com/maps/dir/?api=1${oLat != null ? `&origin=${oLat},${oLng}` : ''}&destination=${lat},${lng}&travelmode=driving`;

const MAP_CSS = `.gp-ring{transform:scale(.4,.2);animation:gpring 1.8s ease-out infinite}@keyframes gpring{0%{transform:scale(.4,.2);opacity:.9}100%{transform:scale(1.6,.8);opacity:0}}
.gp-map .leaflet-container{font-family:inherit;outline:none;background:#e8eee8;cursor:grab}
.gp-map .leaflet-container:active{cursor:grabbing}
.gp-map.gp-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) saturate(1.1) brightness(.95) contrast(.95)}
.gp-map .leaflet-control-attribution{font-size:10px}
.dark .gp-map .leaflet-control-attribution{background:rgba(17,24,39,.8);color:#9ca3af}
.dark .gp-map .leaflet-control-attribution a{color:#6ee7b7}
.gp-vig{background:radial-gradient(ellipse at center,transparent 55%,rgba(4,38,26,.28) 100%);pointer-events:none}
@media (prefers-reduced-motion:reduce){.gp-ring{animation:none;opacity:.5;transform:scale(1,.5)}}`;

const MapPicker = memo(({ latitude, longitude, onChange, darkMode }) => {
  const mapEl = useRef(null);
  const map = useRef(null);
  const layers = useRef(null);
  const appliedSat = useRef(false);
  const onChangeRef = useRef(onChange);
  const lastPoint = useRef(null);
  const programmatic = useRef(false);
  const progTimer = useRef(null);
  const latest = useRef({ latitude, longitude });
  latest.current = { latitude, longitude };
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const hasPoint = !!latitude || !!longitude;
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let instance = null;
    let observer = null;
    let timer = null;
    let loaded = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current) return;
      const { latitude: lat0, longitude: lng0 } = latest.current;
      const lat = Number(lat0) || DEFAULT_POINT.lat;
      const lng = Number(lng0) || DEFAULT_POINT.lng;
      lastPoint.current = { lat, lng };
      const calm = prefersReducedMotion();

      try {
        instance = L.map(mapEl.current, {
          center: [lat, lng],
          zoom: lat0 ? 17 : 15,
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

      L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(instance);

      const tileOpts = { maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2 };
      const street = L.tileLayer(STREET_URL, { ...tileOpts, attribution: STREET_ATTR });
      const sat = L.tileLayer(SAT_URL, { ...tileOpts, maxNativeZoom: 18, attribution: SAT_ATTR });
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
          onChangeRef.current(c.lat, c.lng);
        }
      });
      instance.on('click', (e) => { onChangeRef.current(e.latlng.lat, e.latlng.lng); });

      if (typeof ResizeObserver !== 'undefined') {
        let raf = 0;
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
      observer?.disconnect();
      try { instance?.remove(); } catch { }
      map.current = null;
      layers.current = null;
    };
  }, []);

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
    const lat = Number(latitude);
    const lng = Number(longitude);
    const c = m.getCenter();
    if (Math.abs(c.lat - lat) < SAME && Math.abs(c.lng - lng) < SAME) return;
    lastPoint.current = { lat, lng };
    const zoom = Math.max(m.getZoom(), 16);
    
    programmatic.current = true;
    clearTimeout(progTimer.current);
    progTimer.current = setTimeout(() => { programmatic.current = false; }, 2000);
    if (prefersReducedMotion()) m.setView([lat, lng], zoom, { animate: false });
    else m.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [latitude, longitude, hasPoint, ready]);

  useEffect(() => {
    if (!hasPoint) { setAddress(''); return undefined; }
    const ctrl = new AbortController();
    setResolving(true);
    const id = setTimeout(() => {
      nominatim(`reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, ctrl.signal)
        .then((d) => setAddress(d?.display_name || '')).catch(() => { }).finally(() => setResolving(false));
    }, 350);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [latitude, longitude, hasPoint]);

  useEffect(() => {
    if (query.trim().length < 3) { setSuggestions([]); return undefined; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setSearching(true);
      try { setSuggestions((await nominatim(`search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, ctrl.signal)) || []); }
      catch { } finally { setSearching(false); }
    }, 400);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [query]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); setOrigin({ lat: coords.latitude, lng: coords.longitude }); onChangeRef.current(coords.latitude, coords.longitude); },
      () => {
        setLocating(false);
        import('sweetalert2').then((m) => (m.default || m).fire({ title: 'Location error', text: 'Could not get your location.', icon: 'error', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, []);

  const pick = useCallback((s) => { onChangeRef.current(parseFloat(s.lat), parseFloat(s.lon)); setQuery(s.display_name); setSuggestions([]); }, []);
  const onQueryKeyDown = useCallback((e) => { if (e.key === 'Escape') setSuggestions([]); }, []);
  const zoomIn = useCallback(() => map.current?.zoomIn(), []);
  const zoomOut = useCallback(() => map.current?.zoomOut(), []);

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const ctrlBtn = `flex h-9 w-9 items-center justify-center rounded-lg border shadow-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:text-emerald-400' : 'border-gray-200 bg-white text-gray-700 hover:text-emerald-600'}`;

  return (
    <div className="space-y-2">
      <style>{MAP_CSS}</style>
      <div className="relative">
        <FiSearch className={`pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onQueryKeyDown} placeholder="Search for an address" aria-label="Search address"
          autoComplete="off" className={`${inputCls(darkMode)} w-full ps-9 pe-9`} />
        {searching && <FiLoader className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500 motion-reduce:animate-none" />}
        {suggestions.length > 0 && (
          <ul className={`absolute z-30 mt-1 w-full overflow-hidden rounded-xl border shadow-xl ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            {suggestions.map((s) => (
              <li key={s.place_id}>
                <button type="button" onClick={() => pick(s)}
                  className={`w-full border-b px-3 py-2 text-start text-xs last:border-b-0 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`gp-map relative ${darkMode && !satellite ? 'gp-dark' : ''}`}>
        <div ref={mapEl} className={`isolate h-[320px] w-full overflow-hidden rounded-2xl border sm:h-[380px] ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} style={{ zIndex: 0 }} />

        {ready && !mapError && (
          <>
            <div className="gp-vig absolute inset-0 z-[5] rounded-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0 w-0" role="img" aria-label="Selected location">
              <span aria-hidden="true" className="gp-ring absolute -left-[22px] -top-[22px] h-11 w-11 rounded-full border-2 border-emerald-500/90 bg-emerald-500/20" />
              <span aria-hidden="true" className={`absolute -left-[9px] -top-1 h-2 w-[18px] rounded-full bg-black/45 blur-[2px] transition duration-200 motion-reduce:transition-none ${lifting ? 'scale-50 opacity-50' : ''}`} />
              <span aria-hidden="true" style={{ transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)' }}
                className={`absolute -left-5 -top-[52px] h-[52px] w-10 origin-bottom transition-transform duration-200 motion-reduce:transition-none ${lifting ? '-translate-y-3.5 scale-110' : ''}`}>
                <svg width="40" height="52" viewBox="0 0 40 52" fill="none" aria-hidden="true" focusable="false" className="drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]">
                  <defs><linearGradient id="gp-pin-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset="1" stopColor="#047857" /></linearGradient></defs>
                  <path d="M20 51C20 51 3 32 3 19a17 17 0 0 1 34 0c0 13-17 32-17 32z" fill="url(#gp-pin-g)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
                  <circle cx="20" cy="19" r="6" fill="#fff" />
                </svg>
              </span>
            </div>

            <div className="absolute end-2 bottom-8 z-20 flex flex-col gap-1.5">
              <button type="button" onClick={zoomIn} title="Zoom in" aria-label="Zoom in" className={ctrlBtn}><FiPlus size={16} /></button>
              <button type="button" onClick={zoomOut} title="Zoom out" aria-label="Zoom out" className={ctrlBtn}><FiMinus size={16} /></button>
            </div>

            {!hasPoint && (
              <p className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                Drag the map to place the pin
              </p>
            )}
          </>
        )}

        {!ready && !mapError && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/90' : 'border-gray-300 bg-gray-50/90'}`}>
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent motion-reduce:animate-none" role="status" aria-label="Loading map" />
          </div>
        )}
        {mapError && (
          <div role="alert" className={`absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-xs ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'}`}>
            <FiAlertTriangle className="h-5 w-5 text-amber-500" />
            The map could not be loaded. You can still enter the latitude and longitude manually.
          </div>
        )}
      </div>

      {ready && !mapError && (
        <div className="flex flex-wrap items-center gap-2">
          <Btn3D tone="soft" darkMode={darkMode} onClick={locateMe} disabled={locating} className="px-3 py-2 text-xs">
            {locating ? <FiLoader className="h-3.5 w-3.5 animate-spin text-emerald-500 motion-reduce:animate-none" /> : <FiCrosshair className="h-3.5 w-3.5 text-emerald-500" />} Use my location
          </Btn3D>
      
          {hasPoint && (
            <Btn3D as="a" href={directionsUrl(latitude, longitude, origin?.lat, origin?.lng)} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-xs">
              <FiExternalLink className="h-3.5 w-3.5" /> Directions
            </Btn3D>
          )}
          {hasPoint && <span className={`truncate font-mono text-[11px] ${muted}`}>{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</span>}
        </div>
      )}

      {(resolving || address) && (
        <p className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
          <FiMapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
          {resolving ? 'Locating address…' : address}
        </p>
      )}
      <p className={`text-[11px] ${muted}`}>Drag the map so the pin sits on your door, or tap a spot. Use Satellite to see the exact building.</p>
    </div>
  );
});

export default MapPicker;