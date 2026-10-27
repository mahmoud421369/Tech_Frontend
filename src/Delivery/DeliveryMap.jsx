import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCrosshair, FiAlertTriangle } from "react-icons/fi";

const REDUCED = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const CAIRO = [30.0444, 31.2357];
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

let leafletPromise = null;
const loadLeaflet = () => {
  if (!leafletPromise) {
    leafletPromise = Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([m]) => m.default || m)
      .catch((err) => { leafletPromise = null; throw err; });
  }
  return leafletPromise;
};

const isDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark");


const routeColors = (dark) => (dark
  ? { casing: "#022c22", line: "#34d399", flow: "#022c22", straight: "#10b981" }
  : { casing: "#ffffff", line: "#10b981", flow: "#ffffff", straight: "#10b981" });

const CACHE_KEY = "geo_cache_v1";
const mem = new Map();
try {
  Object.entries(JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")).forEach(([k, v]) => mem.set(k, v));
} catch { }
const persist = () => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries([...mem].filter(([, v]) => v).slice(-500)))); } catch { }
};

const num = (v) => (v == null || v === "" ? NaN : Number(v));
const coordOf = (a) => {
  const la = num(a?.latitude ?? a?.lat);
  const lo = num(a?.longitude ?? a?.lng ?? a?.lon);
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? [la, lo] : null;
};
const queryOf = (a) => [a?.street, a?.state, a?.city].map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean).join(", ");
const keyOf = (a) => {
  const c = coordOf(a);
  if (c) return `c:${c[0]},${c[1]}`;
  const q = queryOf(a);
  return q ? `q:${q}` : null;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let chain = Promise.resolve();
const inflight = new Map();

const nominatim = async (q) => {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=eg&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode failed");
  const hit = (await res.json())?.[0];
  return hit ? [Number(hit.lat), Number(hit.lon)] : null;
};

const geocode = (addr) => {
  const direct = coordOf(addr);
  if (direct) return Promise.resolve(direct);
  const q = queryOf(addr);
  if (!q) return Promise.resolve(null);
  if (mem.has(q)) return Promise.resolve(mem.get(q));
  if (inflight.has(q)) return inflight.get(q);
  const p = (chain = chain.then(async () => {
    try {
      let v = await nominatim(`${q}, Egypt`);
      if (!v && addr?.city) {
        await wait(1100);
        const city = await nominatim(`${[addr.state, addr.city].filter(Boolean).join(", ")}, Egypt`);
        v = city ? [city[0], city[1], 1] : null;
      }
      mem.set(q, v);
      if (v) persist();
      return v;
    } catch {
      return null;
    } finally {
      await wait(1100);
      inflight.delete(q);
    }
  }));
  inflight.set(q, p);
  return p;
};

const ROUTES = new Map();
const haversine = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const pinHtml = (kind, label, small) =>
  `<div class="dm-pin dm-${kind}${small ? " sm" : ""}">${label ? `<span class="dm-lbl">${label}</span>` : ""}`
  + '<svg viewBox="-16 -42 32 44" width="32" height="44"><path class="dm-body" stroke-width="2" stroke-linejoin="round" d="M0 0C-6-10-15-17-15-27A15 15 0 0 1 15-27C15-17 6-10 0 0Z"/>'
  + `${kind === "a" ? '<rect class="dm-in" x="-5" y="-32" width="10" height="10" rx="2"/>' : '<circle class="dm-in" cy="-27" r="5.5"/>'}</svg></div>`;

const sigOf = (w) => `${w.kind}|${w.label || ""}|${w.small ? 1 : 0}|${w.id ?? ""}`;

const MAP_CSS = {
  __html: `
  .dm-icon{background:none;border:0}
  .dm-pin{position:relative;width:32px;height:44px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}
  .dm-pin svg{display:block;overflow:visible}
  .dm-pin.sm{transform:scale(.78);transform-origin:50% 95%}
  .dm-a .dm-body{fill:#10b981;stroke:#047857}.dm-b .dm-body{fill:#111827;stroke:#fff}.dm-in{fill:#fff}
  .dark .dm-a .dm-body{fill:#34d399;stroke:#064e3b}.dark .dm-b .dm-body{fill:#fff;stroke:#111827}
  .dark .dm-a .dm-in{fill:#064e3b}.dark .dm-b .dm-in{fill:#111827}
  .dm-lbl{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:2px;padding:3px 10px;border-radius:999px;background:#fff;color:#111827;font:700 11px/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.25)}
  .dark .dm-lbl{background:#111827;color:#fff}
  .dm-a:not(.sm)::after{content:"";position:absolute;left:50%;bottom:-9px;width:44px;height:20px;margin-left:-22px;border-radius:50%;background:rgba(16,185,129,.35);animation:dm-pulse 1.8s ease-out infinite;z-index:-1}
  .dm-wrap .leaflet-container{font-family:inherit;background:#e8eee8;outline:none}
  .dark .dm-wrap .leaflet-container{background:#0a1411}
  .dm-wrap.dm-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg)}
  .dark .dm-wrap .leaflet-bar a{background:#1f2937;color:#e5e7eb;border-bottom-color:#374151}
  .dark .dm-wrap .leaflet-bar a:hover{background:#374151}
  .dark .dm-wrap .leaflet-control-attribution{background:rgba(17,24,39,.8);color:#9ca3af}
  .dark .dm-wrap .leaflet-control-attribution a{color:#6ee7b7}
  .dm-flow{animation:dm-flow .9s linear infinite}
  @keyframes dm-flow{to{stroke-dashoffset:-24}}
  @keyframes dm-pulse{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.7);opacity:0}}
  @media (prefers-reduced-motion: reduce){.dm-a::after{animation:none!important}.dm-flow{animation:none!important}}
  `,
};

const Chip = ({ children, tone = "plain" }) => (
  <p className={`px-3 py-1.5 rounded-full shadow-md text-xs font-bold tabular-nums flex items-center gap-1.5 ${
    tone === "warn" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200" : "bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-white"}`}
  >
    {children}
  </p>
);

const DeliveryMap = ({ items, selectedId = null, onSelect, aspect = 0.7, className = "" }) => {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const glRef = useRef(null);
  const routeRef = useRef(null);
  const markersRef = useRef(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(isDark);
  const [points, setPoints] = useState({});
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const [route, setRoute] = useState(null);

  const pts = useMemo(() => items.map((it) => ({ id: it.id, a: it.pickup, b: it.drop, ka: keyOf(it.pickup), kb: keyOf(it.drop) })), [items]);
  const sel = useMemo(() => pts.find((p) => p.id === selectedId) || null, [pts, selectedId]);
  const A = sel ? points[sel.ka] : null;
  const B = sel ? points[sel.kb] : null;
  const routeKey = A && B ? `${A[0]},${A[1]};${B[0]},${B[1]}` : null;

  useEffect(() => {
    const mo = new MutationObserver(() => setDark(isDark()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    let dead = false;
    let ro = null;
    let timer = null;
    let loaded = false;
    let map = null;
    const markers = markersRef.current;

    loadLeaflet().then((L) => {
      if (dead || !elRef.current) return;
      glRef.current = L;

      try {
        map = L.map(elRef.current, {
          center: CAIRO,
          zoom: 11,
          minZoom: 2,
          maxZoom: 19,
          zoomControl: false,
          attributionControl: false,
          worldCopyJump: true,
          zoomAnimation: !REDUCED,
          fadeAnimation: !REDUCED,
        });
      } catch { setFailed(true); return; }

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);

      const tiles = L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: TILE_ATTR,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      
      const c = routeColors(isDark());
      const base = { lineCap: "round", lineJoin: "round", interactive: false, smoothFactor: 1.5 };
      routeRef.current = {
        casing: L.polyline([], { ...base, color: c.casing, weight: 11, opacity: 0.95 }).addTo(map),
        line: L.polyline([], { ...base, color: c.line, weight: 6, opacity: 1 }).addTo(map),
        flow: L.polyline([], { ...base, color: c.flow, weight: 2.5, opacity: 1, dashArray: "10 14", className: "dm-flow" }).addTo(map),
        straight: L.polyline([], { ...base, color: c.straight, weight: 4, opacity: 1, dashArray: "6 10" }).addTo(map),
      };

      mapRef.current = map;

      timer = setTimeout(() => { if (!loaded && !dead) setFailed(true); }, 25000);
      tiles.once("tileload", () => {
        loaded = true;
        clearTimeout(timer);
        if (!dead) setReady(true);
      });

      if (typeof ResizeObserver !== "undefined") {
        let raf = 0;
        ro = new ResizeObserver(() => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => { if (!dead && map) map.invalidateSize(); });
        });
        ro.observe(elRef.current);
      }
    }).catch(() => { if (!dead) setFailed(true); });

    return () => {
      dead = true;
      clearTimeout(timer);
      ro?.disconnect();
      markers.clear();
      routeRef.current = null;
      try { map?.remove(); } catch { }
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const r = routeRef.current;
    if (!ready || !r) return;
    const c = routeColors(dark);
    r.casing.setStyle({ color: c.casing });
    r.line.setStyle({ color: c.line });
    r.flow.setStyle({ color: c.flow });
    r.straight.setStyle({ color: c.straight });
  }, [ready, dark]);

  const wanted = useMemo(() => {
    const out = [];
    const seen = new Set();
    const add = (addr, k) => { if (k && !seen.has(k)) { seen.add(k); out.push({ addr, k }); } };
    if (sel) { add(sel.a, sel.ka); add(sel.b, sel.kb); }
    pts.forEach((p) => add(p.b, p.kb));
    return out;
  }, [pts, sel]);

  useEffect(() => {
    let dead = false;
    (async () => {
      for (const w of wanted) {
        if (pointsRef.current[w.k] !== undefined) continue;
        const v = await geocode(w.addr);
        if (dead) return;
        setPoints((p) => (p[w.k] !== undefined ? p : { ...p, [w.k]: v || false }));
      }
    })();
    return () => { dead = true; };
  }, [wanted]);

  const pending = wanted.reduce((n, w) => n + (points[w.k] === undefined ? 1 : 0), 0);

  useEffect(() => {
    if (!routeKey) { setRoute(null); return undefined; }
    const cached = ROUTES.get(routeKey);
    if (cached) { setRoute({ id: routeKey, ...cached }); return undefined; }
    const ctrl = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${A[1]},${A[0]};${B[1]},${B[0]}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        const r0 = j?.routes?.[0];
        if (!r0) throw new Error("no route");
        const v = { coords: r0.geometry.coordinates, km: r0.distance / 1000, min: Math.max(1, Math.round(r0.duration / 60)) };
        ROUTES.set(routeKey, v);
        setRoute({ id: routeKey, ...v });
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setRoute({ id: routeKey, coords: null, km: haversine(A, B), min: null });
      });
    return () => ctrl.abort();
  }, [routeKey, A, B]);

  const live = route && route.id === routeKey ? route : null;

  useEffect(() => {
    const r = routeRef.current;
    if (!ready || !r) return;
    let road = [];
    let straight = [];
    if (live?.coords) road = live.coords.map(([lng, lat]) => [lat, lng]);
    else if (live && A && B) straight = [[A[0], A[1]], [B[0], B[1]]];
    r.casing.setLatLngs(road);
    r.line.setLatLngs(road);
    r.flow.setLatLngs(road);
    r.straight.setLatLngs(straight);
  }, [ready, live, A, B]);

  useEffect(() => {
    const L = glRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    const want = new Map();
    const put = (key, ll, kind, label, small, title, id) => want.set(key, { ll: [ll[0], ll[1]], kind, label, small, title, id });
    pts.forEach((p) => {
      const b = points[p.kb];
      if (b && p.id !== selectedId) put(`d:${p.id}`, b, "b", null, true, "Drop-off. Select to see the route.", p.id);
    });
    if (sel) {
      if (A) put("A", A, "a", "Pickup", false, "Pickup location", null);
      if (B) put("B", B, "b", "Drop-off", false, "Drop-off location", null);
    }
    const reg = markersRef.current;
    reg.forEach((v, k) => {
      const w = want.get(k);
      if (!w || v.sig !== sigOf(w)) { v.marker.remove(); reg.delete(k); }
    });
    want.forEach((w, k) => {
      const ex = reg.get(k);
      if (ex) { ex.marker.setLatLng(w.ll); return; }
      const interactive = w.id != null;
      const icon = L.divIcon({ html: pinHtml(w.kind, w.label, w.small), className: "dm-icon", iconSize: [32, 44], iconAnchor: [16, 42] });
      const marker = L.marker(w.ll, {
        icon,
        title: w.title,
        interactive,
        keyboard: interactive,
        riseOnHover: interactive,
        zIndexOffset: w.small ? 0 : 1000,
      });
      if (interactive) marker.on("click", () => onSelectRef.current?.(w.id));
      marker.addTo(map);
      const el = marker.getElement();
      if (el) {
        el.setAttribute("role", interactive ? "button" : "img");
        el.setAttribute("aria-label", w.title);
      }
      reg.set(k, { marker, sig: sigOf(w) });
    });
  }, [ready, pts, points, sel, selectedId, A, B]);

  const fit = useCallback(() => {
    const L = glRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const list = (sel ? [points[sel.ka], points[sel.kb]] : pts.map((p) => points[p.kb])).filter(Boolean);
    if (!list.length) return;
    if (list.length === 1) {
      const ll = [list[0][0], list[0][1]];
      if (REDUCED) map.setView(ll, 15, { animate: false });
      else map.flyTo(ll, 15, { duration: 0.9 });
      return;
    }
    map.fitBounds(L.latLngBounds(list.map((x) => [x[0], x[1]])), { padding: [64, 64], maxZoom: 16, animate: !REDUCED, duration: 1 });
  }, [sel, pts, points]);

  const fitSig = `${selectedId ?? ""}|${pts[0]?.id ?? ""}|${pts.length}|${(sel ? [sel.ka, sel.kb] : pts.map((p) => p.kb)).map((k) => (points[k] ? 1 : 0)).join("")}`;
  const fitRef = useRef(fit);
  fitRef.current = fit;
  useEffect(() => { if (ready) fitRef.current(); }, [ready, fitSig]);

  const missing = sel && ((sel.ka && points[sel.ka] === false) || (sel.kb && points[sel.kb] === false) || !sel.ka || !sel.kb);
  const approx = sel && ((A && A[2]) || (B && B[2]));

  return (
    <div
      className={`dm-wrap relative isolate w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 ${dark ? "dm-dark" : ""} ${className}`}
      style={{ aspectRatio: `1 / ${aspect}` }}
    >
      <div ref={elRef} className="absolute inset-0 z-0 isolate" role="application" aria-label="Delivery map" />

      {!ready && !failed && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gray-50/90 dark:bg-gray-800/90">
          <span className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent motion-reduce:animate-none" role="status" aria-label="Loading map" />
        </div>
      )}
      {failed && (
        <div role="alert" className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-gray-50 p-4 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <FiAlertTriangle className="h-5 w-5 text-amber-500" />
          The map could not be loaded.
        </div>
      )}

      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
        {live && (live.min
          ? <Chip>{live.km.toFixed(1)} km · {live.min} min by road</Chip>
          : <Chip>{live.km.toFixed(1)} km straight line</Chip>)}
        {pending > 0 && (
          <Chip>
            <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Locating {pending} {pending === 1 ? "address" : "addresses"}…
          </Chip>
        )}
        {missing && <Chip tone="warn"><FiAlertTriangle size={13} aria-hidden="true" /> Couldn't find this address on the map</Chip>}
        {!missing && approx && <Chip tone="warn"><FiAlertTriangle size={13} aria-hidden="true" /> City-level location only</Chip>}
      </div>

      <button
        type="button"
        onClick={fit}
        aria-label="Re-center map"
        className="absolute top-[84px] right-[10px] z-10 w-[34px] h-[34px] rounded-[4px] flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-[0_0_0_2px_rgba(0,0,0,.2)] hover:text-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
      >
        <FiCrosshair size={15} aria-hidden="true" />
      </button>
      <style dangerouslySetInnerHTML={MAP_CSS} />
    </div>
  );
};

export default memo(DeliveryMap);