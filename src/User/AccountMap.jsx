import React, { useState, useEffect, useRef, memo } from 'react';
import { FiSearch, FiLoader, FiCrosshair, FiExternalLink, FiMapPin } from 'react-icons/fi';
import { Btn3D, inputCls } from '../components/Ui3D';



const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const useLeaflet = () => {
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.L);
  useEffect(() => {
    if (window.L) { setReady(true); return undefined; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = LEAFLET_CSS; document.head.appendChild(link);
    }
    const done = () => setReady(true);
    let script = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (!script) { script = document.createElement('script'); script.src = LEAFLET_JS; document.head.appendChild(script); }
    script.addEventListener('load', done);
    return () => script.removeEventListener('load', done);
  }, []);
  return ready;
};

const nominatim = async (path, signal) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('nominatim failed');
  return res.json();
};

const directionsUrl = (lat, lng, oLat, oLng) =>
  `https://www.google.com/maps/dir/?api=1${oLat != null ? `&origin=${oLat},${oLng}` : ''}&destination=${lat},${lng}&travelmode=driving`;

const PIN_HTML = `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
  <div class="pin-pulse" style="position:absolute;top:6px;width:34px;height:34px;border-radius:50%;background:#10b981"></div>
  <div style="position:relative;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))">
    <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#6ee7b7,#047857);transform:rotate(-45deg);border:3px solid #fff;display:flex;align-items:center;justify-content:center">
      <div style="width:12px;height:12px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div>
    </div>
  </div>
</div>`;

const MapPicker = memo(({ latitude, longitude, onChange, darkMode }) => {
  const mapEl = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const tiles = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const ready = useLeaflet();

  const hasPoint = !!latitude || !!longitude;
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState(null);


  useEffect(() => {
    if (!ready || !mapEl.current || map.current) return undefined;
    const L = window.L;
    const lat = latitude || 30.0444, lng = longitude || 31.2357;
    const m = L.map(mapEl.current, { center: [lat, lng], zoom: latitude ? 16 : 12, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    tiles.current = L.tileLayer(darkMode ? TILES.dark : TILES.light, {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 20, maxNativeZoom: 19, detectRetina: true,
    }).addTo(m);
    const mk = L.marker([lat, lng], {
      icon: L.divIcon({ html: PIN_HTML, className: '', iconSize: [38, 54], iconAnchor: [19, 54] }), draggable: true,
    }).addTo(m);
    mk.on('dragend', (e) => { const p = e.target.getLatLng(); onChangeRef.current(p.lat, p.lng); });
    m.on('click', (e) => { mk.setLatLng(e.latlng); onChangeRef.current(e.latlng.lat, e.latlng.lng); });
    map.current = m; marker.current = mk;
    return () => { m.remove(); map.current = null; marker.current = null; tiles.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);


  useEffect(() => { tiles.current?.setUrl(darkMode ? TILES.dark : TILES.light); }, [darkMode]);

 
  useEffect(() => {
    if (!map.current || !marker.current || !hasPoint) return;
    marker.current.setLatLng([latitude, longitude]);
    map.current.setView([latitude, longitude], Math.max(map.current.getZoom(), 16));
  }, [latitude, longitude, hasPoint]);

  
  useEffect(() => {
    if (!hasPoint) { setAddress(''); return undefined; }
    const ctrl = new AbortController();
    setResolving(true);
    const id = setTimeout(() => {
      nominatim(`reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, ctrl.signal)
        .then((d) => setAddress(d?.display_name || '')).catch(() => {}).finally(() => setResolving(false));
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

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setOrigin({ lat: coords.latitude, lng: coords.longitude }); onChange(coords.latitude, coords.longitude); },
      () => import('sweetalert2').then((m) => (m.default || m).fire({ title: 'Location error', text: 'Could not get your location.', icon: 'error', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const pick = (s) => { onChange(parseFloat(s.lat), parseFloat(s.lon)); setQuery(s.display_name); setSuggestions([]); };
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-2">
      <style>{`.pin-pulse{animation:pinpulse 1.8s ease-out infinite}@keyframes pinpulse{0%{transform:scale(.6);opacity:.55}70%,100%{transform:scale(2.1);opacity:0}}@media (prefers-reduced-motion:reduce){.pin-pulse{animation:none}}`}</style>
      <div className="relative">
        <FiSearch className={`pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for an address" aria-label="Search address"
          className={`${inputCls(darkMode)} w-full ps-9 pe-9`} />
        {searching && <FiLoader className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />}
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

      {!ready && (
        <div className={`flex h-64 items-center justify-center rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
          <span className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}
      <div ref={mapEl} className={`h-[280px] w-full overflow-hidden rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${ready ? '' : 'hidden'}`} style={{ zIndex: 0 }} />

      {ready && (
        <div className="flex flex-wrap items-center gap-2">
          <Btn3D tone="soft" darkMode={darkMode} onClick={locateMe} className="px-3 py-2 text-xs"><FiCrosshair className="h-3.5 w-3.5 text-emerald-500" /> Use my location</Btn3D>
          {hasPoint && (
            <Btn3D as="a" href={directionsUrl(latitude, longitude, origin?.lat, origin?.lng)} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-xs">
              <FiExternalLink className="h-3.5 w-3.5" /> Directions
            </Btn3D>
          )}
          {hasPoint && <span className={`truncate font-mono text-[11px] ${muted}`}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>}
        </div>
      )}

      {(resolving || address) && (
        <p className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
          <FiMapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
          {resolving ? 'Locating address…' : address}
        </p>
      )}
      <p className={`text-[11px] ${muted}`}>Click the map or drag the pin to set your location.</p>
    </div>
  );
});

export default MapPicker;