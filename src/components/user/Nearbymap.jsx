import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiNavigation, FiCrosshair, FiLoader } from 'react-icons/fi';
import {
  DEFAULT_CENTER, ROLE_STYLES, roleStyle, getShopRole, serviceLabel, addressLine,
  getCoords, formatDistance, directionsUrl,
} from '../../utils/shopsutils';

const MAX_MARKERS = 150;
const DEFAULT_ZOOM = 11;
const LOCATE_OPTIONS = { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 };
const LOCATE_SAFETY_MS = 15000;

/* ---------- Static styles (module-level: built once, injected once) ---------- */
const mapStyles = `
  @keyframes pulseRing { 0% { transform: scale(.5); opacity: .8; } 100% { transform: scale(2.2); opacity: 0; } }
  @keyframes pinDrop { 0% { transform: translateY(-26px); opacity: 0; } 60% { transform: translateY(3px); opacity: 1; } 100% { transform: translateY(0); } }
  @keyframes floatPin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes floatShadow { 0%,100% { transform: scale(1); opacity: .35; } 50% { transform: scale(.82); opacity: .2; } }

  /* Game-style map: saturated tiles, chunky 3D controls, vignette */
  .shop-map .leaflet-tile-pane { filter: saturate(1.55) contrast(1.06) brightness(1.03); }
  .shop-map.is-dark .leaflet-tile-pane { filter: saturate(1.35) contrast(1.1) brightness(1.15) hue-rotate(-8deg); }
  .shop-map .leaflet-container { font-family: inherit; }

  .shop-pin, .sel-pin { background: transparent; border: 0; }
  .shop-pin .pin { width: 36px; height: 36px; border: 3px solid #fff; border-radius: 50% 50% 50% 0;
    background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.55), transparent 48%), var(--c);
    transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 16px -6px rgba(0,0,0,.55), inset -3px -4px 0 rgba(0,0,0,.18); transition: transform .15s ease; }
  .shop-pin .pin span { width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: inset 0 -2px 0 rgba(0,0,0,.15); }
  .shop-pin:hover .pin { transform: rotate(-45deg) scale(1.12); }
  .shop-pin .pin.active { transform: rotate(-45deg) scale(1.25); }

  .sel-pin { position: relative; }
  .sel-pin .ring { position: absolute; left: 50%; bottom: 4px; width: 30px; height: 12px; margin-left: -15px; border-radius: 50%;
    background: rgba(16,185,129,.55); animation: pulseRing 1.8s ease-out infinite; }
  .sel-pin .pin { position: absolute; left: 4px; top: 2px; width: 36px; height: 36px; border: 3px solid #fff; border-radius: 50% 50% 50% 0;
    background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.65), transparent 45%), linear-gradient(160deg, #34d399, #059669);
    transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 18px -6px rgba(4,120,87,.7), inset -3px -4px 0 rgba(0,0,0,.18); animation: pinDrop .45s ease-out both; }
  .sel-pin .pin span { width: 12px; height: 12px; border-radius: 50%; background: #fff; }

  .shop-popup .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 18px; border: 3px solid rgba(16,185,129,.65); box-shadow: 0 18px 40px -12px rgba(0,0,0,.5), 0 5px 0 0 rgba(4,120,87,.6); }
  .shop-popup .leaflet-popup-content { margin: 0; width: 240px !important; }
  .shop-popup-dark .leaflet-popup-content-wrapper, .shop-popup-dark .leaflet-popup-tip { background: #111827; }

  .shop-map .leaflet-control-zoom { border: 0; box-shadow: none; display: flex; flex-direction: column; gap: 6px; }
  .shop-map .leaflet-control-zoom a { width: 38px; height: 38px; line-height: 35px; font-size: 20px; font-weight: 900; color: #fff;
    background: linear-gradient(#34d399, #059669); border: 0; border-bottom: 4px solid #047857; border-radius: 12px; transition: transform .1s ease, border-width .1s ease; }
  .shop-map .leaflet-control-zoom a:hover { background: linear-gradient(#6ee7b7, #10b981); color: #fff; }
  .shop-map .leaflet-control-zoom a:active { transform: translateY(3px); border-bottom-width: 1px; }
  .shop-map .leaflet-control-zoom-in, .shop-map .leaflet-control-zoom-out { border-radius: 12px !important; }

  .illus-float { animation: floatPin 3.2s ease-in-out infinite; }
  .illus-shadow { transform-origin: 120px 140px; animation: floatShadow 3.2s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .sel-pin .ring, .sel-pin .pin, .illus-float, .illus-shadow { animation: none !important; }
    .shop-pin .pin { transition: none; }
  }
`;

/* ---------- Icons (cached) ---------- */
const iconCache = {};
const shopIcon = (role, active) => {
  const key = `${role}-${active}`;
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: 'shop-pin',
      html: `<div class="pin ${active ? 'active' : ''}" style="--c:${roleStyle(role).color}"><span></span></div>`,
      iconSize: [36, 44], iconAnchor: [18, 42], popupAnchor: [0, -40],
    });
  }
  return iconCache[key];
};
const selectedIcon = L.divIcon({
  className: 'sel-pin',
  html: '<i class="ring"></i><div class="pin"><span></span></div>',
  iconSize: [44, 56], iconAnchor: [22, 46], popupAnchor: [0, -44],
});

const zoomForRadius = (r) => (r <= 2 ? 14 : r <= 5 ? 13 : r <= 10 ? 12 : r <= 25 ? 11 : 10);

/* ---------- Map helpers ---------- */
const MapClick = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

const MapFly = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? map.getZoom(), { duration: 0.8 });
  }, [target, map]);
  return null;
};

/* ---------- 3D illustration (inline SVG, no extra network request) ---------- */
const LocationIllustration = memo(({ darkMode }) => {
  const top = darkMode ? '#1f2937' : '#d1fae5';
  const topB = darkMode ? '#111827' : '#a7f3d0';
  const left = darkMode ? '#0f172a' : '#34d399';
  const right = darkMode ? '#020617' : '#10b981';
  const line = darkMode ? '#374151' : '#ffffff';
  return (
    <svg viewBox="0 0 240 200" className="h-44 w-full max-w-[260px]" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ill-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={topB} /></linearGradient>
        <linearGradient id="ill-pin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset=".5" stopColor="#10b981" /><stop offset="1" stopColor="#047857" /></linearGradient>
        <linearGradient id="ill-cube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
      </defs>
      {/* slab */}
      <path d="M40 134 L120 172 L120 188 L40 150 Z" fill={left} />
      <path d="M120 172 L200 134 L200 150 L120 188 Z" fill={right} />
      <path d="M120 96 L200 134 L120 172 L40 134 Z" fill="url(#ill-top)" />
      {/* grid / roads */}
      <g stroke={line} strokeWidth="2" strokeLinecap="round" opacity=".85">
        <path d="M80 115 L160 153" /><path d="M160 115 L80 153" /><path d="M100 105 L180 143" opacity=".5" />
      </g>
      {/* mini buildings */}
      <g>
        <path d="M88 124 L104 132 L88 140 L72 132 Z" fill="url(#ill-cube)" />
        <path d="M72 132 L88 140 L88 156 L72 148 Z" fill="#94a3b8" />
        <path d="M88 140 L104 132 L104 148 L88 156 Z" fill="#cbd5e1" />
        <path d="M164 124 L176 130 L164 136 L152 130 Z" fill="url(#ill-cube)" />
        <path d="M152 130 L164 136 L164 148 L152 142 Z" fill="#94a3b8" />
        <path d="M164 136 L176 130 L176 142 L164 148 Z" fill="#cbd5e1" />
      </g>
      {/* target ring + shadow */}
      <ellipse cx="120" cy="140" rx="36" ry="14" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" opacity=".8" />
      <ellipse className="illus-shadow" cx="120" cy="140" rx="20" ry="7" fill="#064e3b" />
      {/* floating pin */}
      <g className="illus-float">
        <path d="M120 112 C120 112 92 84 92 64 A28 28 0 1 1 148 64 C148 84 120 112 120 112 Z" fill="url(#ill-pin)" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
        <path d="M104 52 C108 42 118 38 126 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
        <circle cx="120" cy="64" r="11" fill="#fff" />
        <circle cx="120" cy="64" r="5" fill="#059669" />
      </g>
    </svg>
  );
});

/* ---------- Marker for a shop ---------- */
const ShopMarker = memo(({ shop, coords, active, distance, userLoc, darkMode, dir, t, onFocus, onDetails, register }) => {
  const role = getShopRole(shop);
  const rs = roleStyle(role);
  const handlers = useMemo(() => ({ click: () => onFocus(shop.id) }), [onFocus, shop.id]);
  const setRef = useCallback((m) => register(shop.id, m), [register, shop.id]);
  const address = addressLine(shop);
  return (
    <Marker position={[coords.lat, coords.lng]} icon={shopIcon(role, active)} ref={setRef} eventHandlers={handlers} title={shop.name || undefined}>
      <Popup className={darkMode ? 'shop-popup shop-popup-dark' : 'shop-popup'} closeButton={false} autoPanPadding={[24, 24]}>
        <div dir={dir} className={darkMode ? 'text-white' : 'text-gray-900'}>
          <div className={`bg-gradient-to-br px-4 py-3 text-white ${rs.grad}`}>
            <p className="truncate text-sm font-extrabold">{shop.name || t('unnamedShop')}</p>
            <p className="mt-0.5 text-[11px] opacity-90">
              {serviceLabel(role, t)}{distance !== undefined && ` • ${formatDistance(distance, t)}`}
            </p>
          </div>
          <div className="space-y-2 p-3">
            {address && <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{address}</p>}
            <div className="grid grid-cols-2 gap-2">
              <a href={directionsUrl(shop, userLoc)} target="_blank" rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-bold !text-white no-underline shadow-[0_3px_0_0_#047857]">
                <FiNavigation className="h-3.5 w-3.5" /> {t('getDirections')}
              </a>
              <button type="button" onClick={() => onDetails(shop)}
                className={`rounded-xl py-2 text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{t('details')}</button>
              {shop.phone
                ? <a href={`tel:${shop.phone}`} className={`flex items-center justify-center rounded-xl py-2 text-xs font-bold no-underline ${darkMode ? 'bg-gray-800 !text-gray-200' : 'bg-gray-100 !text-gray-700'}`}>{t('callShop')}</a>
                : <span />}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

/* ---------- Draggable emerald pin for the chosen location ---------- */
const SelectedPin = memo(({ loc, onMove, label }) => {
  const handlers = useMemo(() => ({
    dragend: (e) => { const p = e.target.getLatLng(); onMove({ lat: p.lat, lng: p.lng }); },
  }), [onMove]);
  return (
    <Marker position={[loc.lat, loc.lng]} icon={selectedIcon} draggable zIndexOffset={1000} eventHandlers={handlers} title={label}>
      <Popup>{label}</Popup>
    </Marker>
  );
});

/* ---------- List row ---------- */
const ShopRow = memo(({ shop, coords, active, distance, userLoc, darkMode, t, onSelect }) => {
  const role = getShopRole(shop);
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  const select = () => onSelect(shop, coords);
  return (
    <li>
      <div
        role="button" tabIndex={0} onClick={select}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } }}
        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 ${
          active ? (darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50') : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
      >
        <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: roleStyle(role).color }} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${strong}`}>{shop.name || t('unnamedShop')}</p>
          <p className={`truncate text-xs ${muted}`}>
            {serviceLabel(role, t)}{distance !== undefined && ` • ${formatDistance(distance, t)}`}
          </p>
        </div>
        <a
          href={directionsUrl(shop, userLoc)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          aria-label={`${t('getDirections')}: ${shop.name || ''}`} title={t('getDirections')}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400"
        ><FiNavigation className="h-3.5 w-3.5" /></a>
      </div>
    </li>
  );
});

/* ---------- Main component ---------- */
// `cities` and `setRadius` are no longer used (city picker and km select were removed); leaving them passed by the parent is harmless.
const NearbyMap = ({ shops, userLoc, setUserLoc, radius, distances, darkMode, t, onDetails }) => {
  const [geoStatus, setGeoStatus] = useState('idle');
  const [focusId, setFocusId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const markerRefs = useRef({});
  const popupTimer = useRef(null);
  const mounted = useRef(false);
  const locateReq = useRef(0);
  const locateTimer = useRef(null);

  useEffect(() => {
    mounted.current = true; // set true on every mount (fixes StrictMode remount)
    return () => {
      mounted.current = false;
      clearTimeout(popupTimer.current);
      clearTimeout(locateTimer.current);
    };
  }, []);

  // Falls back to English if a translation key hasn't been added yet.
  const tr = useCallback((key, fallback, opts) => {
    const v = t(key, opts);
    return v && v !== key ? v : fallback;
  }, [t]);

  const dir = typeof document !== 'undefined' ? document.dir || 'ltr' : 'ltr';

  const located = useMemo(() => shops.map((s) => ({ shop: s, coords: getCoords(s) })).filter((x) => x.coords), [shops]);

  const visible = useMemo(() => {
    if (!userLoc) return located;
    return located
      .filter(({ shop }) => (distances[shop.id] ?? Infinity) <= radius)
      .sort((a, b) => distances[a.shop.id] - distances[b.shop.id]);
  }, [located, userLoc, distances, radius]);

  const markers = useMemo(() => visible.slice(0, MAX_MARKERS), [visible]);

  const initialCenter = useMemo(() => {
    if (!located.length) return DEFAULT_CENTER;
    return {
      lat: located.reduce((s, x) => s + x.coords.lat, 0) / located.length,
      lng: located.reduce((s, x) => s + x.coords.lng, 0) / located.length,
    };
  }, [located]);

  // Pick any point on the map (click, drag, or GPS).
  const pick = useCallback((loc, zoom) => {
    setUserLoc(loc);
    setFocusId(null);
    setFlyTarget({ ...loc, zoom });
  }, [setUserLoc]);

  // Cancels a pending geolocation request so a late callback can't override the user's choice.
  const cancelLocate = useCallback(() => {
    locateReq.current += 1;
    clearTimeout(locateTimer.current);
    setGeoStatus((s) => (s === 'loading' ? 'idle' : s));
  }, []);

  const onMapPick = useCallback((loc) => { cancelLocate(); pick(loc); }, [pick, cancelLocate]);
  const onPinMoved = useCallback((loc) => { setUserLoc(loc); setFocusId(null); }, [setUserLoc]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('unsupported'); return; }

    const reqId = ++locateReq.current;
    const finish = (status, loc) => {
      if (!mounted.current || reqId !== locateReq.current) return; // ignore stale/unmounted
      clearTimeout(locateTimer.current);
      setGeoStatus(status);
      if (loc) pick(loc, zoomForRadius(radius));
    };

    setGeoStatus('loading');

    // Safety net: some browsers never call back if the permission prompt is ignored
    clearTimeout(locateTimer.current);
    locateTimer.current = setTimeout(() => finish('unavailable'), LOCATE_SAFETY_MS);

    navigator.geolocation.getCurrentPosition(
      (pos) => finish('idle', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => finish(err.code === 1 ? 'denied' : 'unavailable'),
      LOCATE_OPTIONS,
    );
  }, [pick, radius]);

  const clearLocation = useCallback(() => { cancelLocate(); setUserLoc(null); setFocusId(null); }, [setUserLoc, cancelLocate]);

  const register = useCallback((id, m) => {
    if (m) markerRefs.current[id] = m; else delete markerRefs.current[id];
  }, []);
  const onMarkerFocus = useCallback((id) => setFocusId(id), []);

  const focusShop = useCallback((shop, coords) => {
    setFocusId(shop.id);
    setFlyTarget({ ...coords, zoom: 15 });
    clearTimeout(popupTimer.current);
    popupTimer.current = setTimeout(() => markerRefs.current[shop.id]?.openPopup(), 700);
  }, []);

  const geoMessage = { denied: 'locationDenied', unsupported: 'locationUnsupported', unavailable: 'locationUnavailable' }[geoStatus];
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  const tileStyle = darkMode ? 'dark_all' : 'rastertiles/voyager';
  const selectedLabel = tr('selectedLocation', 'Selected location');

  return (
    <section id="nearby-shops" className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <style>{mapStyles}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
              <FiMapPin className="h-3 w-3" /> {t('nearbyBadge')}
            </span>
            <h2 className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${strong}`}>{t('nearbyTitle')}</h2>
            <p className={`mt-1.5 text-sm sm:text-base ${muted}`}>{t('nearbySubtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={locate} disabled={geoStatus === 'loading'}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_0_#047857] transition active:translate-y-[3px] active:shadow-[0_1px_0_0_#047857] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              {geoStatus === 'loading' ? <FiLoader className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FiCrosshair className="h-4 w-4" />}
              {geoStatus === 'loading' ? t('locating') : t('useMyLocation')}
            </button>
            {userLoc && (
              <button type="button" onClick={clearLocation} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
                {t('clearLocation')}
              </button>
            )}
          </div>
        </div>

        {geoMessage && <p role="alert" className="mb-4 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-600">{t(geoMessage)}</p>}

        {located.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center text-sm ${darkMode ? 'border-gray-800 bg-gray-900 text-gray-400' : 'border-gray-100 bg-white text-gray-500'}`}>{t('noCoords')}</div>
        ) : (
          <div className={`grid overflow-hidden rounded-3xl border shadow-xl lg:grid-cols-[360px_1fr] ${darkMode ? 'border-gray-800 bg-gray-900 shadow-black/40' : 'border-gray-100 bg-white shadow-gray-200/70'}`}>
            {/* Side panel */}
            <div className={`order-2 flex max-h-[520px] min-h-[300px] flex-col lg:order-1 lg:max-h-[560px] ${darkMode ? 'lg:border-e lg:border-gray-800' : 'lg:border-e lg:border-gray-100'}`}>
              <div className={`border-b px-4 py-3 text-sm font-semibold ${darkMode ? 'border-gray-800 text-gray-200' : 'border-gray-100 text-gray-700'}`} aria-live="polite">
                {userLoc ? t('nearbyCount', { count: visible.length, radius }) : t('tapMapHint')}
              </div>

              {!userLoc ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
                  <LocationIllustration darkMode={darkMode} />
                  <p className={`mt-2 text-base font-extrabold ${strong}`}>{tr('selectOnMapTitle', 'Choose a spot on the map')}</p>
                  <p className={`mt-1 max-w-[260px] text-xs leading-relaxed ${muted}`}>
                    {tr('selectOnMapDesc', 'Tap anywhere on the map to drop a pin and see the shops around it, or use your current location.')}
                  </p>
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto overscroll-contain">
                  {visible.length === 0 && <li className={`p-6 text-center text-sm ${muted}`}>{t('noNearby', { radius })}</li>}
                  {markers.map(({ shop, coords }) => (
                    <ShopRow
                      key={shop.id} shop={shop} coords={coords} active={focusId === shop.id}
                      distance={distances[shop.id]} userLoc={userLoc} darkMode={darkMode} t={t} onSelect={focusShop}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Map */}
            <div dir="ltr" className={`shop-map relative isolate order-1 h-[360px] lg:order-2 lg:h-[560px] ${darkMode ? 'is-dark' : ''}`}>
              <MapContainer
                center={[initialCenter.lat, initialCenter.lng]} zoom={DEFAULT_ZOOM} minZoom={3} scrollWheelZoom preferCanvas worldCopyJump
                className="h-full w-full" style={{ background: darkMode ? '#0b1220' : '#cfe8d5', cursor: 'crosshair' }}
              >
                <TileLayer
                  key={darkMode ? 'dark' : 'light'}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url={`https://{s}.basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png`}
                  updateWhenIdle
                  keepBuffer={2}
                />
                <MapClick onPick={onMapPick} />
                <MapFly target={flyTarget} />
                {userLoc && (
                  <>
                    <Circle center={[userLoc.lat, userLoc.lng]} radius={radius * 1000} pathOptions={{ color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.1, dashArray: '8 8' }} />
                    <SelectedPin loc={userLoc} onMove={onPinMoved} label={selectedLabel} />
                  </>
                )}
                {markers.map(({ shop, coords }) => (
                  <ShopMarker
                    key={shop.id} shop={shop} coords={coords} active={focusId === shop.id} distance={distances[shop.id]}
                    userLoc={userLoc} darkMode={darkMode} dir={dir} t={t} onFocus={onMarkerFocus} onDetails={onDetails} register={register}
                  />
                ))}
              </MapContainer>

              {/* Game-style vignette */}
              <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-[450] ${darkMode ? 'shadow-[inset_0_0_80px_rgba(0,0,0,.55)]' : 'shadow-[inset_0_0_70px_rgba(6,78,59,.22)]'}`} />

              {/* Hint while no location is chosen (clicks pass through to the map) */}
              {!userLoc && (
                <div className="pointer-events-none absolute start-1/2 top-3 z-[500] -translate-x-1/2 rtl:translate-x-1/2">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white shadow-[0_4px_0_0_#047857]">
                    <FiMapPin className="h-3.5 w-3.5" /> {tr('selectOnMapTitle', 'Choose a spot on the map')}
                  </span>
                </div>
              )}

              <div
                dir={dir}
                className={`absolute bottom-3 start-3 z-[500] flex flex-wrap gap-x-3 gap-y-1 rounded-2xl border-b-4 px-3 py-2 text-[11px] font-semibold shadow-lg backdrop-blur ${darkMode ? 'border-gray-950 bg-gray-900/85 text-gray-200' : 'border-emerald-600/30 bg-white/90 text-gray-700'}`}
              >
                {[['REPAIRER', 'legendRepair'], ['SELLER', 'legendSell'], ['BOTH', 'legendBoth']].map(([r, k]) => (
                  <span key={r} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ROLE_STYLES[r].color }} />{t(k)}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(NearbyMap);