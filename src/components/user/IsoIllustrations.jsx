import React, { memo, useEffect, useId, useLayoutEffect, useRef, createContext, useContext } from 'react';

const ISO_STYLES = `
  .iso-root{
    --iso-line:#064e3b; --iso-top:#ffffff; --iso-left:#ecfdf5; --iso-right:#a7f3d0;
    --iso-screen:#f0fdf9; --iso-acc:#34d399; --iso-acc2:#059669;
    --iso-route:#ffffff; --iso-spark:#ffffff; --iso-glyph:#ffffff;
    --iso-skin:#fde7cf; --iso-hair:#064e3b; --iso-pants:#334155;
    --iso-shadow-op:.5;
    contain:layout style;
    content-visibility:auto;
    contain-intrinsic-size:420px 420px;
  }
  .iso-root[data-surface="plain"]{ --iso-route:#10b981; --iso-spark:#34d399; }

  .iso-root[data-dark="true"]{
    --iso-line:#39ff88; --iso-top:#464b49; --iso-left:#343836; --iso-right:#242726;
    --iso-screen:#141716; --iso-acc:#39ff88; --iso-acc2:#1fd868;
    --iso-route:#39ff88; --iso-spark:#39ff88; --iso-glyph:#021a0c;
    --iso-skin:#fcd9b6; --iso-hair:#0d0d0d; --iso-pants:#4b5563;
    --iso-shadow-op:.85;
  }
  .iso-root[data-surface="plain"][data-dark="true"]{ --iso-route:#39ff88; --iso-spark:#39ff88; }

  .iso-root[data-tone="orange"]{
    --iso-line:#7c2d12; --iso-top:#ffffff; --iso-left:#fff7ed; --iso-right:#fdba74;
    --iso-screen:#fffaf5; --iso-acc:#fb923c; --iso-acc2:#ea580c; --iso-hair:#7c2d12;
  }
  .iso-root[data-tone="orange"][data-dark="true"]{
    --iso-line:#431407; --iso-top:#fff7ed; --iso-left:#ffedd5; --iso-right:#fdba74;
    --iso-screen:#ffedd5; --iso-acc:#fb923c; --iso-acc2:#c2410c; --iso-hair:#431407;
  }
  .iso-root[data-tone="orange"][data-surface="plain"]{ --iso-route:#f97316; --iso-spark:#fb923c; }
  .iso-root[data-tone="orange"][data-surface="plain"][data-dark="true"]{ --iso-route:#fb923c; --iso-spark:#fdba74; }

  .iso-root[data-tone="amber"]{
    --iso-line:#78350f; --iso-top:#ffffff; --iso-left:#fffbeb; --iso-right:#fcd34d;
    --iso-screen:#fffdf2; --iso-acc:#fbbf24; --iso-acc2:#f59e0b; --iso-hair:#78350f;
  }
  .iso-root[data-tone="amber"][data-dark="true"]{
    --iso-line:#451a03; --iso-top:#fffbeb; --iso-left:#fef3c7; --iso-right:#fcd34d;
    --iso-screen:#fef3c7; --iso-acc:#fbbf24; --iso-acc2:#d97706; --iso-hair:#451a03;
  }
  .iso-root[data-tone="amber"][data-surface="plain"]{ --iso-route:#f59e0b; --iso-spark:#fbbf24; }
  .iso-root[data-tone="amber"][data-surface="plain"][data-dark="true"]{ --iso-route:#fbbf24; --iso-spark:#fde68a; }

  .iso-root[data-tone="sun"],.iso-root[data-tone="sun"][data-dark="true"]{
    --iso-line:#7c2d12; --iso-top:#ffffff; --iso-left:#fff7ed; --iso-right:#fed7aa;
    --iso-screen:#fffaf5; --iso-acc:#fde047; --iso-acc2:#facc15;
    --iso-route:#ffffff; --iso-spark:#ffffff; --iso-hair:#7c2d12; --iso-glyph:#ffffff;
    --iso-shadow-op:.35;
  }

  .iso-root svg{display:block;overflow:visible}

  .iso-s{stroke:var(--iso-line);stroke-width:1.2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
  .iso-thin{stroke-width:.85}
  .iso-fillstroke{stroke:var(--iso-right);stroke-width:1.4;vector-effect:non-scaling-stroke}
  .iso-top{fill:var(--iso-top)} .iso-left{fill:var(--iso-left)} .iso-right{fill:var(--iso-right)}
  .iso-screen{fill:var(--iso-screen)} .iso-acc{fill:var(--iso-acc)} .iso-acc2{fill:var(--iso-acc2)} .iso-white{fill:var(--iso-spark)}
  .iso-skin{fill:var(--iso-skin)} .iso-hair{fill:var(--iso-hair)} .iso-pants{fill:var(--iso-pants)}
  .iso-stroke-acc{fill:none;stroke:var(--iso-acc2);stroke-width:2.2;stroke-linecap:round;vector-effect:non-scaling-stroke}
  .iso-stroke-w{fill:none;stroke:var(--iso-route);stroke-width:2.4;stroke-linecap:round;vector-effect:non-scaling-stroke}
  .iso-glyph{fill:none;stroke:var(--iso-glyph);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
  .iso-faint{opacity:.45}

  .iso-sheen{fill:url(#iso-g-sheen);stroke:none;pointer-events:none}
  .iso-shade{fill:url(#iso-g-shade);stroke:none;pointer-events:none}
  .iso-shadow{fill:url(#iso-g-shadow);opacity:var(--iso-shadow-op);pointer-events:none}
  .iso-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--iso-acc) 30%,transparent),transparent)}

  @keyframes isoIn{from{opacity:0;transform:scale(.9) translateY(8px)}to{opacity:1;transform:none}}
  @keyframes isoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes isoBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes isoKey{0%,50%,100%{transform:translateY(0)}65%{transform:translateY(2.4px)}}
  @keyframes isoCover{0%,100%{transform:translateY(0)}50%{transform:translateY(11px)}}
  @keyframes isoBar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
  @keyframes isoSpin{to{transform:rotate(360deg)}}
  @keyframes isoRing{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.6);opacity:0}}
  @keyframes isoDash{to{stroke-dashoffset:-11}}
  @keyframes isoBlink{0%,100%{opacity:.35}50%{opacity:1}}
  @keyframes isoWave{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}
  @keyframes isoTwinkle{0%,100%{opacity:.25;transform:scale(.5) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(45deg)}}
  @keyframes isoPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
  @keyframes isoPop{0%{transform:scale(.3);opacity:0}12%{transform:scale(1.25);opacity:1}22%,100%{transform:scale(1);opacity:1}}
  @keyframes isoTravel{
    0%{offset-distance:0%;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{offset-distance:100%;opacity:0}
  }

  .iso-in{animation:isoIn .28s cubic-bezier(.16,1,.3,1) both}
  .iso-float{animation:isoFloat 6s ease-in-out infinite}
  .iso-bob{animation:isoBob 3s ease-in-out infinite}
  .iso-key{animation:isoKey 3.2s ease-in-out infinite both}
  .iso-cover{animation:isoCover 5s ease-in-out infinite}
  .iso-bar{transform-box:fill-box;transform-origin:50% 0;animation:isoBar 3s ease-in-out infinite both}
  .iso-spin{animation:isoSpin 4s linear infinite}
  .iso-spin-slow{animation:isoSpin 12s linear infinite}
  .iso-ring{transform-box:fill-box;transform-origin:center;animation:isoRing 2.4s ease-out infinite both}
  .iso-dash{stroke-dasharray:5 6;animation:isoDash 1.8s linear infinite}
  .iso-blink{animation:isoBlink 2s ease-in-out infinite}
  .iso-wave{transform-box:fill-box;transform-origin:50% 100%;animation:isoWave 1.8s ease-in-out infinite}
  .iso-twinkle{transform-box:fill-box;transform-origin:center;animation:isoTwinkle 2.4s ease-in-out infinite both}
  .iso-pulse{transform-box:fill-box;transform-origin:center;animation:isoPulse 2.6s ease-in-out infinite}
  .iso-pop{transform-box:fill-box;transform-origin:center;animation:isoPop 4.2s cubic-bezier(.2,.9,.3,1.2) infinite both}
  .iso-travel{offset-distance:50%;offset-rotate:0deg;animation:isoTravel 4.2s linear infinite}

  .iso-float:nth-child(2n){animation-duration:7s;animation-delay:-1.6s}
  .iso-float:nth-child(3n){animation-duration:5.4s;animation-delay:-.7s}
  .iso-bob:nth-child(2n){animation-duration:3.6s;animation-delay:-1s}
  .iso-bob:nth-child(3n){animation-duration:2.7s;animation-delay:-.4s}

  .iso-root[data-static="true"] *:not(.iso-in){animation:none !important}
  .iso-root[data-static="true"] .iso-ring{opacity:0}
  .iso-root[data-static="true"] .iso-bar{transform:none}

  .iso-root[data-paused="true"] *{animation-play-state:paused !important}
  .iso-root[data-hover="true"] *:not(.iso-in){animation-play-state:paused}
  .group:hover .iso-root[data-hover="true"] *,.iso-root[data-hover="true"]:hover *{animation-play-state:running}
  @media (prefers-reduced-motion:reduce){ .iso-root *{animation:none !important} }
`;

const ISO_DEFS = `
  <defs>
    <linearGradient id="iso-g-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="iso-g-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </linearGradient>
    <radialGradient id="iso-g-shadow">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
`;

let isoInjected = false;
const injectIsoOnce = () => {
  if (isoInjected || typeof document === 'undefined' || !document.head || !document.body) return;
  isoInjected = true;
  const tag = document.createElement('style');
  tag.setAttribute('data-iso-styles', 'true');
  tag.textContent = ISO_STYLES;
  document.head.appendChild(tag);
  const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  holder.innerHTML = ISO_DEFS;
  document.body.appendChild(holder);
};
injectIsoOnce();

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const S = 18;
const COS = 0.866;
const iso = (x, y, z = 0) => [(x - y) * COS * S, (x + y) * 0.5 * S - z * S];
const pts = (...p) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

const Plane = ({ x = 0, y = 0, z = 0, children }) => {
  const [ox, oy] = iso(x, y, z);
  return <g transform={`matrix(${COS * S} ${0.5 * S} ${-COS * S} ${0.5 * S} ${ox} ${oy})`}>{children}</g>;
};

const Wall = ({ x = 0, y = 0, z = 0, children }) => {
  const [ox, oy] = iso(x, y, z);
  return <g transform={`matrix(${COS * S} ${0.5 * S} 0 ${-S} ${ox} ${oy})`}>{children}</g>;
};

const At = ({ x = 0, y = 0, z = 0, s = 1, children }) => {
  const [tx, ty] = iso(x, y, z);
  return <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)})${s !== 1 ? ` scale(${s})` : ''}`}>{children}</g>;
};

const Box = ({ x, y, z = 0, w, d, h, top = 'iso-top', left = 'iso-left', right = 'iso-right', fx = true }) => {
  const a = iso(x, y, z + h), b = iso(x + w, y, z + h), c = iso(x + w, y + d, z + h), e = iso(x, y + d, z + h);
  const f = iso(x, y + d, z), g = iso(x + w, y + d, z), k = iso(x + w, y, z);
  const R = pts(b, c, g, k), T = pts(a, b, c, e);
  return (
    <g>
      <polygon className={`${left} iso-s`} points={pts(e, c, g, f)} />
      <polygon className={`${right} iso-s`} points={R} />
      <polygon className={`${top} iso-s`} points={T} />
      {fx && (
        <>
          <polygon className="iso-shade" points={R} />
          <polygon className="iso-sheen" points={T} />
        </>
      )}
    </g>
  );
};

const Flat = (p) => <Box fx={false} {...p} />;

const Slab = ({ x, y, z = 0, w, d, h, r = 0.6, top = 'iso-top' }) => {
  const mids = Math.max(1, Math.round((h * S) / 4.5));
  const circ = r >= Math.min(w, d) / 2 - 0.01;
  let sides;
  if (circ) {
    const cx = x + w / 2, cy = y + d / 2, k = r * 0.7071;
    sides = [[cx + k, cy - k], [cx - k, cy + k]].map(([px, py], i) => (
      <path key={i} d={seg(iso(px, py, z), iso(px, py, z + h))} className="iso-s" fill="none" />
    ));
  } else {
    const L = [iso(x + r, y + d, z), iso(x + w - r, y + d, z), iso(x + w - r, y + d, z + h), iso(x + r, y + d, z + h)];
    const R = [iso(x + w, y + r, z), iso(x + w, y + d - r, z), iso(x + w, y + d - r, z + h), iso(x + w, y + r, z + h)];
    sides = (
      <>
        <polygon className="iso-left iso-s" points={pts(...L)} />
        <polygon className="iso-right iso-s" points={pts(...R)} />
        <polygon className="iso-shade" points={pts(...R)} />
      </>
    );
  }
  return (
    <g>
      {Array.from({ length: mids + 1 }, (_, i) => (
        <Plane key={i} x={x} y={y} z={z + (h * i) / (mids + 1)}>
          <rect width={w} height={d} rx={r} className={i === 0 ? 'iso-right iso-s' : 'iso-right iso-fillstroke'} />
        </Plane>
      ))}
      {sides}
      <Plane x={x} y={y} z={z + h}>
        <rect width={w} height={d} rx={r} className={`${top} iso-s`} />
        <rect width={w} height={d} rx={r} className="iso-sheen" />
      </Plane>
    </g>
  );
};

const FitCtx = createContext(null);
const fitCache = new Map();
const SVG_NS = 'http://www.w3.org/2000/svg';

const measureDetached = (node) => {
  const host = document.createElement('div');
  host.className = 'iso-root';
  host.setAttribute('data-static', 'true');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:420px;height:420px;visibility:hidden;pointer-events:none;content-visibility:visible;';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 420 420');
  svg.setAttribute('width', '420');
  svg.setAttribute('height', '420');
  const g = node.cloneNode(true);
  svg.appendChild(g);
  host.appendChild(svg);
  document.body.appendChild(host);
  try { return g.getBBox(); } finally { host.remove(); }
};

const fitFromBox = (b, pad) => {
  const k = Math.min((420 - pad * 2) / b.width, (420 - pad * 2 - 30) / b.height, 3);
  const cy = 200;
  const rx = Math.max(20, b.width * k * 0.4);
  return {
    tf: `translate(210 ${cy}) scale(${k.toFixed(3)}) translate(${(-(b.x + b.width / 2)).toFixed(1)} ${(-(b.y + b.height / 2)).toFixed(1)})`,
    sh: [210, +(cy + (b.height * k) / 2 + 6).toFixed(1), +rx.toFixed(1), +(rx * 0.17).toFixed(1)],
  };
};

const applyFit = (outer, shadow, fit) => {
  outer.setAttribute('transform', fit.tf);
  if (shadow) {
    shadow.setAttribute('cx', fit.sh[0]);
    shadow.setAttribute('cy', fit.sh[1]);
    shadow.setAttribute('rx', fit.sh[2]);
    shadow.setAttribute('ry', fit.sh[3]);
  }
};

const Stage = ({ pad = 4, children }) => {
  const key = useContext(FitCtx);
  const outer = useRef(null);
  const inner = useRef(null);
  const shadow = useRef(null);
  const cached = key ? fitCache.get(key) : undefined;

  useIsoLayoutEffect(() => {
    if (key && fitCache.has(key)) {
      applyFit(outer.current, shadow.current, fitCache.get(key));
      return undefined;
    }
    let tries = 0;
    let timer;
    const retry = () => { if (tries++ < 6) timer = setTimeout(fit, 150); };
    const fit = () => {
      try {
        let b = measureDetached(inner.current);
        if (!b.width || !b.height) b = inner.current.getBBox();
        if (!b.width || !b.height) { retry(); return; }
        const res = fitFromBox(b, pad);
        applyFit(outer.current, shadow.current, res);
        if (key) fitCache.set(key, res);
      } catch (e) { retry(); }
    };
    fit();
    return () => clearTimeout(timer);
  }, [pad, key]);

  return (
    <>
      <ellipse
        ref={shadow} className="iso-shadow"
        cx={cached?.sh[0]} cy={cached?.sh[1]} rx={cached?.sh[2]} ry={cached?.sh[3]}
      />
      <g ref={outer} transform={cached?.tf}><g ref={inner}>{children}</g></g>
    </>
  );
};

let sharedIO;
const observeIso = (el) => {
  if (!el || typeof IntersectionObserver === 'undefined') return undefined;
  sharedIO ||= new IntersectionObserver(
    (entries) => entries.forEach((e) => { e.target.dataset.paused = e.isIntersecting ? 'false' : 'true'; }),
    { rootMargin: '80px' }
  );
  sharedIO.observe(el);
  return () => sharedIO.unobserve(el);
};

const Badge = ({ x, y, z, glyph = 'check', s = 1.2 }) => {
  const [px, py] = iso(x, y, z);
  return (
    <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${s})`}>
      <g className="iso-bob">
        <path d="M0-16L12-11V0C12 9 6 14 0 17C-6 14-12 9-12 0V-11Z" className="iso-acc iso-s iso-pulse" />
        {glyph === 'check' ? (
          <path d="M-5 0l4 4 7-8" className="iso-glyph iso-pop" />
        ) : (
          <>
            <rect x={-5} y={-2} width={10} height={8} rx={2} className="iso-top iso-s iso-thin" />
            <path d="M-3-2V-5a3 3 0 0 1 6 0V-2" className="iso-s iso-thin" fill="none" />
          </>
        )}
      </g>
    </g>
  );
};

const Pin = ({ x, y, z }) => {
  const [px, py] = iso(x, y, z);
  return (
    <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}>
      <g className="iso-bob">
        <path d="M0 0C-7-9-9-13-9-17a9 9 0 0 1 18 0c0 4-2 8-9 17z" className="iso-acc iso-s" />
        <circle cy={-17} r={3.2} className="iso-top iso-s iso-thin" />
      </g>
    </g>
  );
};

const Screwdriver = ({ x, y, z, rot = 35 }) => {
  const [px, py] = iso(x, y, z);
  return (
    <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot})`}>
      <g className="iso-bob">
        <rect x={-3.5} y={0} width={7} height={13} rx={3} className="iso-acc iso-s" />
        <rect x={-1.2} y={-15} width={2.4} height={15} className="iso-top iso-s iso-thin" />
        <path d="M-1.2-15L0-18L1.2-15" className="iso-s iso-thin" fill="none" />
      </g>
    </g>
  );
};

const Spark = ({ x, y, z, s = 8, delay = 0 }) => {
  const [px, py] = iso(x, y, z);
  const t = s * 0.3;
  return (
    <path
      className="iso-white iso-twinkle"
      style={{ animationDelay: `${delay}s` }}
      d={`M${px} ${py - s}L${px + t} ${py - t}L${px + s} ${py}L${px + t} ${py + t}L${px} ${py + s}L${px - t} ${py + t}L${px - s} ${py}L${px - t} ${py - t}Z`}
    />
  );
};

const Person = ({ wave = false, phone = false }) => (
  <g>
    <Flat x={0.15} y={0.25} w={0.6} d={0.6} h={1.7} top="iso-pants" left="iso-pants" right="iso-pants" />
    <Flat x={0.95} y={0.25} w={0.6} d={0.6} h={1.7} top="iso-pants" left="iso-pants" right="iso-pants" />
    <Flat x={0.1} y={0.2} w={0.7} d={0.8} h={0.25} top="iso-top" />
    <Flat x={0.9} y={0.2} w={0.7} d={0.8} h={0.25} top="iso-top" />
    <Flat x={-0.5} y={0.2} z={1.85} w={0.45} d={0.6} h={1.7} top="iso-acc" left="iso-acc" right="iso-acc2" />
    <Flat x={-0.5} y={0.25} z={1.6} w={0.45} d={0.5} h={0.3} top="iso-skin" left="iso-skin" right="iso-skin" />
    <Box x={0} y={0} z={1.95} w={1.7} d={1.1} h={1.9} top="iso-acc" left="iso-acc" right="iso-acc2" />
    <Flat x={0.6} y={0.3} z={3.85} w={0.5} d={0.5} h={0.25} top="iso-skin" left="iso-skin" right="iso-skin" />
    <Slab x={0.2} y={0.05} z={4.1} w={1.3} d={1.0} h={0.95} r={0.5} top="iso-skin" />
    <Slab x={0.15} y={0} z={5.0} w={1.4} d={1.1} h={0.35} r={0.55} top="iso-hair" />
    <Wall x={0.2} y={1.05} z={4.1}>
      <circle cx={0.42} cy={0.55} r={0.07} className="iso-hair" />
      <circle cx={0.88} cy={0.55} r={0.07} className="iso-hair" />
      <path d="M0.5 0.3Q0.65 0.15 0.8 0.3" className="iso-s iso-thin" fill="none" />
    </Wall>
    {wave ? (
      <g className="iso-wave">
        <Flat x={1.75} y={0.2} z={2.7} w={0.45} d={0.6} h={1.6} top="iso-acc" left="iso-acc" right="iso-acc2" />
        <Flat x={1.75} y={0.25} z={4.3} w={0.45} d={0.5} h={0.4} top="iso-skin" left="iso-skin" right="iso-skin" />
      </g>
    ) : (
      <>
        <Flat x={1.75} y={0.2} z={1.85} w={0.45} d={0.6} h={1.7} top="iso-acc" left="iso-acc" right="iso-acc2" />
        <Flat x={1.75} y={0.25} z={1.6} w={0.45} d={0.5} h={0.3} top="iso-skin" left="iso-skin" right="iso-skin" />
      </>
    )}
    {phone && (
      <g className="iso-bob">
        <Box x={-1.2} y={0.55} z={1.9} w={0.9} d={0.14} h={1.5} top="iso-top" left="iso-screen" right="iso-right" />
      </g>
    )}
  </g>
);

const PERSON_HOLD = <Person phone />;

const Storefront = ({ w = 6, d = 5, h = 4, n = 6, sign = false }) => {
  const aw = 1.2, ah = 0.9, at = h - 0.4, dw = 0.8;
  const dh = Math.min(2.5, at - ah - 0.15);
  const ww = w / 2 - dw - 1.1;
  const wh = Math.min(1.6, dh - 0.9);
  const stripes = Array.from({ length: n }, (_, i) => {
    const x0 = (i * w) / n, x1 = ((i + 1) * w) / n;
    return pts(iso(x0, d, at), iso(x1, d, at), iso(x1, d + aw, at - ah), iso(x0, d + aw, at - ah));
  });
  return (
    <g>
      <Box x={0} y={0} w={w} d={d} h={h} />
      <Box x={-0.25} y={-0.25} z={h} w={w + 0.5} d={d + 0.5} h={0.3} top="iso-acc" />
      {sign && (
        <>
          <Box x={w / 2 - 1.6} y={1} z={h + 0.3} w={3.2} d={0.4} h={1.3} top="iso-acc" left="iso-acc" right="iso-acc" />
          <Wall x={w / 2 - 1.6} y={1.4} z={h + 0.3}>
            <path d="M0.7 0.85H2.5M0.7 0.45H1.8" className="iso-glyph" />
          </Wall>
        </>
      )}
      {d > 4 && (
        <polygon className="iso-screen iso-s iso-thin" points={pts(iso(w, 1.2, 1), iso(w, d - 1.2, 1), iso(w, d - 1.2, 1 + wh), iso(w, 1.2, 1 + wh))} />
      )}
      <Wall x={0} y={d} z={0}>
        <rect x={w / 2 - dw} y={0} width={dw * 2} height={dh} rx={0.1} className="iso-screen iso-s iso-thin" />
        <circle cx={w / 2 + dw - 0.3} cy={dh / 2} r={0.09} className="iso-top iso-s iso-thin" />
        {ww > 0.4 && (
          <>
            <rect x={0.6} y={0.9} width={ww} height={wh} rx={0.1} className="iso-screen iso-s iso-thin" />
            <rect x={w / 2 + dw + 0.5} y={0.9} width={ww} height={wh} rx={0.1} className="iso-screen iso-s iso-thin" />
          </>
        )}
      </Wall>
      {stripes.map((p, i) => (
        <polygon key={i} points={p} className={`${i % 2 ? 'iso-top' : 'iso-acc'} iso-s iso-thin`} />
      ))}
      <polygon className="iso-right iso-s iso-thin" points={pts(iso(w, d, at), iso(w, d + aw, at - ah), iso(w, d, at - ah))} />
    </g>
  );
};

const House = () => (
  <g>
    <Box x={0} y={0} w={3} d={3} h={2.2} />
    <polygon className="iso-right iso-s" points={pts(iso(3, 0, 2.2), iso(3, 3, 2.2), iso(3, 1.5, 3.5))} />
    <polygon className="iso-acc iso-s" points={pts(iso(-0.2, 3.2, 2.1), iso(3.2, 3.2, 2.1), iso(3.2, 1.5, 3.5), iso(-0.2, 1.5, 3.5))} />
    <polygon className="iso-sheen" points={pts(iso(-0.2, 3.2, 2.1), iso(3.2, 3.2, 2.1), iso(3.2, 1.5, 3.5), iso(-0.2, 1.5, 3.5))} />
    <Wall x={0} y={3} z={0}>
      <rect x={0.5} y={0} width={0.9} height={1.5} rx={0.1} className="iso-screen iso-s iso-thin" />
      <rect x={1.8} y={0.8} width={0.8} height={0.8} rx={0.1} className="iso-screen iso-s iso-thin" />
    </Wall>
  </g>
);

const PhoneFlat = ({ broken = false }) => {
  const w = 2.8, d = 5;
  return (
    <g>
      <Slab x={0} y={0} w={w} d={d} h={0.3} r={0.6} />
      <Plane z={0.3}>
        <rect x={0.25} y={0.25} width={w - 0.5} height={d - 0.5} rx={0.4} className="iso-screen iso-s iso-thin" />
        {broken ? (
          <path d="M0.4 0.7L1.3 1.7L0.9 2.5L2 3.5L1.5 4.5" className="iso-s iso-thin" fill="none" />
        ) : (
          [0, 1, 2].flatMap((j) => [0, 1].map((i) => {
            const accent = (i + j) % 2;
            return (
              <rect
                key={`${i}${j}`} x={0.55 + i * 1.0} y={1 + j * 1.1} width={0.75} height={0.75} rx={0.2}
                className={`${accent ? 'iso-acc iso-blink' : 'iso-right'} iso-s iso-thin`}
                style={accent ? { animationDelay: `${(i + j * 2) * 0.35}s` } : undefined}
              />
            );
          }))
        )}
        <rect x={0.9} y={0.4} width={1} height={0.18} rx={0.09} className="iso-right iso-s iso-thin" />
      </Plane>
    </g>
  );
};

const LAPTOP_KEYS = (() => {
  let d = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) d += `M${0.6 + c * 0.8} ${1 + r * 0.8}h.62v.62h-.62z`;
  return d;
})();
const BAR_H = [2.2, 3.2, 1.8, 3.6, 2.6];

const LaptopParts = () => (
  <g>
    <Box x={0} y={-0.3} z={0.35} w={10} d={0.3} h={6.2} />
    <Wall x={0} y={0} z={0.35}>
      <rect x={0.4} y={0.4} width={9.2} height={5.4} rx={0.3} className="iso-screen iso-s iso-thin" />
      <rect x={0.9} y={4.9} width={3} height={0.35} rx={0.17} className="iso-acc" />
      <rect x={0.9} y={4.3} width={2} height={0.25} rx={0.12} className="iso-right" />
      {BAR_H.map((h, i) => (
        <rect key={i} x={1 + i * 1.15} y={0.9} width={0.75} height={h} rx={0.1} className="iso-acc iso-bar" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
      <circle cx={7.9} cy={3.3} r={1.2} className="iso-top iso-s iso-thin" />
      <path d="M7.9 2.1A1.2 1.2 0 1 1 6.7 3.3" className="iso-stroke-acc iso-spin" style={{ transformOrigin: '7.9px 3.3px' }} />
    </Wall>
    <Box x={0} y={0} w={10} d={7} h={0.35} />
    <Plane z={0.35}>
      <path d={LAPTOP_KEYS} className="iso-right iso-s iso-thin" />
      {[[2, 1], [6, 2], [4, 3]].map(([c, r], i) => (
        <rect key={i} x={0.6 + c * 0.8} y={1 + r * 0.8} width={0.62} height={0.62} className="iso-acc iso-blink" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <rect x={3.5} y={4.6} width={3} height={1.9} rx={0.3} className="iso-screen iso-s iso-thin" />
    </Plane>
  </g>
);

const WATCH_DOTS = [5.8, 6.5, 7.2];

const WatchParts = () => (
  <g>
    <Box x={1.4} y={-3} w={2.2} d={3} h={0.5} />
    <Slab x={0} y={0} w={5} d={5} h={0.9} r={1.2} />
    <Plane z={0.9}>
      <rect x={0.45} y={0.45} width={4.1} height={4.1} rx={0.85} className="iso-screen iso-s iso-thin" />
      <circle cx={2.5} cy={2.5} r={1.5} className="iso-s iso-thin iso-faint" fill="none" />
      <path d="M2.5 1A1.5 1.5 0 1 1 1 2.5" className="iso-stroke-acc iso-spin" style={{ transformOrigin: '2.5px 2.5px' }} />
      <line x1={2.5} y1={2.5} x2={2.5} y2={1.6} className="iso-s iso-spin-slow" style={{ transformOrigin: '2.5px 2.5px' }} />
      <circle cx={2.5} cy={2.5} r={0.18} className="iso-acc" />
    </Plane>
    <Box x={5} y={1.5} z={0.25} w={0.5} d={0.9} h={0.5} />
    <Box x={1.4} y={5} w={2.2} d={3} h={0.5} />
    <Plane z={0.5}>
      {WATCH_DOTS.map((yy) => <circle key={yy} cx={2.5} cy={yy} r={0.15} className="iso-screen iso-s iso-thin" />)}
    </Plane>
  </g>
);

const KEYS = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 12; c++) {
    KEYS.push({
      id: `${r}-${c}`,
      pos: iso(0.4 + c * 1.1, 0.4 + r * 1.1, 0.6),
      delay: (c * 0.15 + r * 0.12).toFixed(2),
      acc: (r * 5 + c * 3) % 11 === 0,
    });
  }
}

const Keyboard = () => {
  const uid = useId().replace(/:/g, '');
  const key = `k${uid}`, keyA = `ka${uid}`;
  return (
    <>
      <defs>
        <g id={key}><Flat x={0} y={0} w={0.82} d={0.82} h={0.7} /></g>
        <g id={keyA}><Flat x={0} y={0} w={0.82} d={0.82} h={0.7} top="iso-acc" /></g>
      </defs>
      <Stage>
        <g className="iso-float">
          <Box x={0} y={0} w={13.8} d={6} h={0.6} />
          {KEYS.map(({ id, pos, delay, acc }) => (
            <g key={id} transform={`translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`}>
              <use href={`#${acc ? keyA : key}`} className="iso-key" style={{ animationDelay: `${delay}s` }} />
            </g>
          ))}
          <g className="iso-key" style={{ animationDelay: '1s' }}>
            <Box x={3.6} y={4.8} z={0.6} w={5.6} d={0.82} h={0.7} />
          </g>
        </g>
      </Stage>
    </>
  );
};

const Marketplace = () => (
  <Stage>
    <Plane>
      <path d="M3.9 10C6 11.5 8 10 8 6.9" className="iso-stroke-w iso-dash" />
      <circle cx={8} cy={6.9} r={0.7} className="iso-stroke-w iso-ring" />
    </Plane>
    <At x={5} y={0}><Storefront w={6} d={5} h={4} n={6} /></At>
    <At x={1} y={7.5}><g className="iso-float"><PhoneFlat broken /></g></At>
    <Screwdriver x={2.4} y={10} z={3} rot={-30} />
    <Badge x={8} y={2.5} z={6.4} />
    <Spark x={12} y={1} z={5.5} s={9} />
    <Spark x={0.5} y={3.5} z={4} s={7} delay={0.8} />
  </Stage>
);

const Devices = () => (
  <Stage>
    <g className="iso-float"><LaptopParts /></g>
    <At x={11.5} y={1}><g className="iso-bob" style={{ animationDelay: '0.5s' }}><PhoneFlat /></g></At>
    <At x={3.5} y={9.4} s={0.6}><g className="iso-float" style={{ animationDelay: '1s' }}><WatchParts /></g></At>
    <Badge x={5} y={-0.3} z={8.6} />
    <Spark x={14} y={0} z={5} s={8} delay={0.6} />
  </Stage>
);

const Shop = () => (
  <Stage>
    <At x={0} y={0}><Storefront w={9} d={6} h={4.6} n={8} sign /></At>
    <At x={-2.4} y={6.4}>
      <Box x={0} y={0} w={1.5} d={1.5} h={1.2} />
      <Box x={0.2} y={0.2} z={1.2} w={1.1} d={1.1} h={0.9} top="iso-acc" />
    </At>
    <At x={10.2} y={6.6}><Box x={0} y={0} w={1.3} d={1.3} h={1.1} /></At>
    <Badge x={4.5} y={3} z={8.6} />
    <Spark x={-1.5} y={1} z={4} s={8} delay={0.5} />
  </Stage>
);

const ROUTE = [[1.9, 10.7], [5, 10.7], [5.5, 3.8], [9.5, 3.8]];
const ROUTE_PLANE = `M${ROUTE[0]}C${ROUTE[1]} ${ROUTE[2]} ${ROUTE[3]}`.replace(/,/g, ' ').replace(/ (?=C)/, '');
const ROUTE_SCREEN = (() => {
  const p = ROUTE.map(([x, y]) => iso(x, y, 0.2).map((n) => n.toFixed(1)));
  return `M${p[0][0]} ${p[0][1]}C${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;
})();

const Track = () => (
  <Stage>
    <Plane>
      <path d={ROUTE_PLANE} className="iso-stroke-w iso-dash" />
    </Plane>
    <At x={8} y={0}><House /></At>
    <At x={0} y={6}><Storefront w={3.8} d={3} h={3.4} n={4} /></At>
    <Pin x={9.5} y={1.5} z={5.6} />
    <g className="iso-travel" style={{ offsetPath: `path('${ROUTE_SCREEN}')` }}>
      <Box x={-0.45} y={-0.45} z={0.1} w={0.9} d={0.9} h={0.8} top="iso-acc" />
    </g>
    <Spark x={12} y={4} z={3} s={7} delay={0.7} />
  </Stage>
);

const Account = () => (
  <Stage>
    <g className="iso-float">
      <Box x={0} y={-0.4} w={7} d={0.4} h={8} />
      <Wall x={0} y={0} z={0}>
        <circle cx={3.5} cy={6} r={1.3} className="iso-screen iso-s iso-thin" />
        <circle cx={3.5} cy={6.3} r={0.45} className="iso-acc iso-s iso-thin" />
        <path d="M2.6 5.2a0.9 0.9 0 0 1 1.8 0" className="iso-s iso-thin" fill="none" />
        <rect x={1.8} y={4.2} width={3.4} height={0.4} rx={0.2} className="iso-acc" />
        <rect x={2.4} y={3.5} width={2.2} height={0.3} rx={0.15} className="iso-right" />
        <rect x={0.8} y={2.2} width={5.4} height={0.9} rx={0.25} className="iso-screen iso-s iso-thin" />
        <circle cx={1.4} cy={2.65} r={0.22} className="iso-acc iso-blink" />
        <rect x={0.8} y={1} width={5.4} height={0.9} rx={0.25} className="iso-screen iso-s iso-thin" />
        <circle cx={1.4} cy={1.45} r={0.22} className="iso-acc iso-blink" style={{ animationDelay: '0.5s' }} />
      </Wall>
    </g>
    <At x={1.4} y={2.4}>
      <g className="iso-bob" style={{ animationDelay: '0.6s' }}>
        <Slab x={0} y={0} w={5.2} d={3.4} h={0.3} r={0.6} />
        <Plane z={0.3}>
          <path d="M1.3 1H2.2M3 1H3.9" className="iso-s iso-thin" fill="none" />
          <circle cx={0.9} cy={1} r={0.38} className="iso-acc iso-s iso-thin" />
          <circle cx={2.6} cy={1} r={0.38} className="iso-acc iso-s iso-thin" />
          <circle cx={4.3} cy={1} r={0.38} className="iso-top iso-s iso-thin" />
          <rect x={0.7} y={2} width={3.2} height={0.3} rx={0.15} className="iso-right iso-s iso-thin" />
          <rect x={0.7} y={2.5} width={2} height={0.25} rx={0.12} className="iso-right iso-s iso-thin" />
        </Plane>
      </g>
    </At>
    <Badge x={7.2} y={-0.2} z={8} glyph="lock" />
    <Spark x={8} y={4} z={3} s={7} delay={0.9} />
  </Stage>
);

const PlusTag = ({ x, y, z, delay = 0 }) => (
  <g className="iso-float" style={{ animationDelay: `${delay}s` }}>
    <Slab x={x} y={y} z={z} w={3.2} d={2.2} h={0.3} r={0.6} top="iso-acc" />
    <Plane z={z + 0.3}>
      <path d={`M${x + 1.6} ${y + 0.5}V${y + 1.7}M${x + 1} ${y + 1.1}H${x + 2.2}`} className="iso-glyph" />
    </Plane>
  </g>
);

const OTP_CELLS = [0, 1, 2, 3, 4, 5];
const FINGER_R = [0.45, 0.9, 1.35];
const SHACKLE = 'M0.9 0V1.1A0.9 0.9 0 0 0 2.7 1.1V0';

const LoginHero = () => (
  <Stage>
    <Slab x={-3.4} y={-1.8} w={19} d={10.4} h={0.4} r={1} />

    <Plane z={0.4}>
      <path d="M0.6 5.4C3 8 5.6 7.2 7.6 4.6" className="iso-stroke-w iso-dash" />
      <circle cx={7.6} cy={4.6} r={0.7} className="iso-stroke-w iso-ring" />
    </Plane>

    <g className="iso-float">
      <Box x={0} y={-0.4} z={0.4} w={8} d={0.4} h={8.4} />
      <Wall x={0} y={0} z={0.4}>
        <circle cx={4} cy={7.1} r={0.95} className="iso-screen iso-s iso-thin" />
        <circle cx={4} cy={7.35} r={0.34} className="iso-acc iso-s iso-thin" />
        <path d="M3.35 6.7a0.65 0.65 0 0 1 1.3 0" className="iso-s iso-thin" fill="none" />
        <rect x={0.8} y={4.7} width={6.4} height={1} rx={0.3} className="iso-screen iso-s iso-thin" />
        <rect x={1.2} y={5} width={0.6} height={0.4} rx={0.08} className="iso-acc" />
        <rect x={2.2} y={5.12} width={3} height={0.18} rx={0.09} className="iso-right" />
        <rect x={0.8} y={3.3} width={6.4} height={1} rx={0.3} className="iso-screen iso-s iso-thin" />
        {OTP_CELLS.map((i) => (
          <circle key={i} cx={1.5 + i * 0.52} cy={3.8} r={0.14} className="iso-acc iso-blink" style={{ animationDelay: `${i * 0.22}s` }} />
        ))}
        <rect x={0.8} y={1.8} width={6.4} height={1} rx={0.32} className="iso-acc iso-s iso-thin iso-pulse" />
        <path d="M3.5 2.3H4.6M4.2 2.05L4.6 2.3L4.2 2.55" className="iso-glyph" style={{ strokeWidth: 1.6 }} />
        {[3.1, 4, 4.9].map((cx, i) => (
          <circle key={cx} cx={cx} cy={0.9} r={0.3} className={`${i === 1 ? 'iso-acc' : 'iso-screen'} iso-s iso-thin`} />
        ))}
      </Wall>
    </g>

    <At x={7.4} y={2.6} z={0.4}>
      <g className="iso-float" style={{ animationDelay: '0.4s' }}>
        <Box x={0} y={0} w={3.6} d={2.6} h={3} top="iso-acc" left="iso-acc" right="iso-acc2" />
        <Wall x={0} y={1.3} z={3}>
          <g className="iso-bob">
            <path d={SHACKLE} className="iso-stroke-acc" style={{ stroke: 'var(--iso-line)', strokeWidth: 6.5 }} />
            <path d={SHACKLE} className="iso-stroke-acc" style={{ stroke: 'var(--iso-top)', strokeWidth: 4 }} />
          </g>
        </Wall>
        <Wall x={0} y={2.6} z={0}>
          <circle cx={1.8} cy={1.8} r={0.4} className="iso-top iso-s iso-thin" />
          <rect x={1.66} y={0.8} width={0.28} height={1} rx={0.1} className="iso-top iso-s iso-thin" />
        </Wall>
      </g>
    </At>

    <At x={-2.8} y={3.2} z={0.4}>
      <g className="iso-bob" style={{ animationDelay: '0.9s' }}>
        <Slab x={0} y={0} w={3.4} d={3.4} h={0.4} r={1.7} />
        <Plane z={0.4}>
          {FINGER_R.map((r, i) => (
            <circle
              key={r} cx={1.7} cy={1.7} r={r} className="iso-stroke-acc iso-blink"
              style={{ strokeDasharray: '4 2.5', animationDelay: `${i * 0.4}s` }}
            />
          ))}
          <circle cx={1.7} cy={1.7} r={0.14} className="iso-acc" />
        </Plane>
      </g>
    </At>

    <g className="iso-float" style={{ animationDelay: '0.7s' }}>
      <Slab x={8.8} y={-1.8} z={9} w={5.6} d={2} h={0.3} r={0.8} />
      <Plane z={9.3}>
        {OTP_CELLS.map((i) => (
          <rect
            key={i} x={9.3 + i * 0.78} y={-1.25} width={0.55} height={0.9} rx={0.12}
            className="iso-acc iso-blink" style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </Plane>
    </g>

    <Badge x={4} y={-0.2} z={10.4} s={1.8} />
    <Spark x={-1.8} y={-0.6} z={8} s={9} />
    <Spark x={15} y={4} z={4} s={8} delay={0.7} />
    <Spark x={-3} y={8} z={2} s={7} delay={1.2} />
  </Stage>
);

const SignupHero = () => (
  <Stage>
    <Slab x={-1.2} y={-1.2} w={15.4} d={7.4} h={0.4} r={0.9} />

    <g className="iso-float">
      <Box x={5.6} y={-0.4} z={0.4} w={7.4} d={0.4} h={7.4} />
      <Wall x={5.6} y={0} z={0.4}>
        <circle cx={3.7} cy={5.9} r={1.05} className="iso-screen iso-s iso-thin" />
        <circle cx={3.7} cy={6.15} r={0.38} className="iso-acc iso-s iso-thin" />
        <path d="M3 5.25a0.7 0.7 0 0 1 1.4 0" className="iso-s iso-thin" fill="none" />
        <circle cx={4.9} cy={5.1} r={0.36} className="iso-acc iso-s iso-thin iso-pulse" />
        <path d="M4.9 4.92V5.28M4.72 5.1H5.08" className="iso-glyph" style={{ strokeWidth: 1.4 }} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={0.8} y={3.4 - i * 1.05} width={5.8} height={0.8} rx={0.25} className="iso-screen iso-s iso-thin" />
            <circle cx={1.35} cy={3.8 - i * 1.05} r={0.24} className="iso-acc iso-s iso-thin iso-blink" style={{ animationDelay: `${i * 0.5}s` }} />
            <rect x={2} y={3.7 - i * 1.05} width={2.2 + (i % 2) * 1.2} height={0.18} rx={0.09} className="iso-right" />
          </g>
        ))}
      </Wall>
    </g>

    <At x={2.6} y={1.8} z={0.4}>{PERSON_HOLD}</At>

    <PlusTag x={1.6} y={-1.6} z={7.4} delay={0.5} />
    <Badge x={12.2} y={-0.2} z={8.8} />
    <Spark x={-1} y={4.2} z={5.6} s={8} delay={0.6} />
    <Spark x={14} y={0} z={5} s={7} delay={1.1} />
  </Stage>
);

const REPAIR_GUIDES = [[0, 8.6], [4.4, 8.6], [4.4, 0]];

const Repair = () => {
  const w = 4.4, d = 8.6;
  return (
    <Stage>
      <Slab x={0} y={0} w={w} d={d} h={0.3} r={0.7} />
      <Plane z={0.3}>
        <rect x={0.3} y={0.3} width={w - 0.6} height={d - 0.6} rx={0.45} className="iso-screen iso-s iso-thin" />
        <rect x={0.8} y={3.1} width={2.8} height={4.4} rx={0.35} className="iso-right iso-s iso-thin" />
        <rect x={1.2} y={3.6} width={2} height={0.3} rx={0.15} className="iso-acc iso-blink" />
        <rect x={0.8} y={0.8} width={1.5} height={1.5} rx={0.25} className="iso-acc iso-s iso-thin" />
        <circle cx={3.2} cy={1.4} r={0.35} className="iso-top iso-s iso-thin" />
        <path d="M2.3 1.55H3.6V2.8" className="iso-stroke-acc iso-dash" />
      </Plane>
      {REPAIR_GUIDES.map(([gx, gy], i) => (
        <path key={i} d={seg(iso(gx, gy, 0.3), iso(gx, gy, 3.4))} className="iso-stroke-w iso-dash iso-faint" style={{ strokeWidth: 1.2 }} />
      ))}
      <g className="iso-cover">
        <Slab x={0} y={0} z={3.4} w={w} d={d} h={0.35} r={0.7} />
        <Plane z={3.75}>
          <rect x={0.35} y={0.35} width={2.1} height={2.1} rx={0.55} className="iso-top iso-s" />
          <circle cx={0.95} cy={0.95} r={0.38} className="iso-top iso-s iso-thin" />
          <circle cx={0.95} cy={1.85} r={0.38} className="iso-top iso-s iso-thin" />
          <circle cx={0.95} cy={0.95} r={0.16} className="iso-acc" />
          <circle cx={0.95} cy={1.85} r={0.16} className="iso-acc" />
          <circle cx={w / 2} cy={d * 0.58} r={0.55} className="iso-top iso-s iso-thin" />
        </Plane>
      </g>
      <Screwdriver x={8} y={0} z={2.6} />
      <Spark x={-1} y={1} z={5} s={8} delay={0.4} />
    </Stage>
  );
};

const ROUTE2 = [[2.8, 10.6], [6, 12.6], [11, 12.6], [14.2, 8.8]];
const ROUTE2_PLANE = `M${ROUTE2[0]}C${ROUTE2[1]} ${ROUTE2[2]} ${ROUTE2[3]}`;
const ROUTE2_SCREEN = (() => {
  const p = ROUTE2.map(([x, y]) => iso(x, y, 0.2).map((n) => n.toFixed(1)));
  return `M${p[0][0]} ${p[0][1]}C${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;
})();

const Services = () => (
  <Stage>
    <Plane>
      <path d={ROUTE2_PLANE} className="iso-stroke-w iso-dash" />
      <circle cx={14.2} cy={8.8} r={0.7} className="iso-stroke-w iso-ring" />
    </Plane>
    <g className="iso-float"><LaptopParts /></g>
    <At x={11.5} y={1}><g className="iso-bob" style={{ animationDelay: '0.5s' }}><PhoneFlat /></g></At>
    <At x={-0.5} y={8.6}>
      <g className="iso-bob" style={{ animationDelay: '1s' }}>
        <Box x={0} y={0} w={2.6} d={2.6} h={2} />
        <polygon className="iso-acc iso-s iso-thin" points={pts(iso(1, 0, 2), iso(1.6, 0, 2), iso(1.6, 2.6, 2), iso(1, 2.6, 2))} />
        <polygon className="iso-acc iso-s iso-thin" points={pts(iso(1, 2.6, 2), iso(1.6, 2.6, 2), iso(1.6, 2.6, 1.2), iso(1, 2.6, 1.2))} />
      </g>
    </At>
    <g className="iso-travel" style={{ offsetPath: `path('${ROUTE2_SCREEN}')` }}>
      <Box x={-0.4} y={-0.4} z={0.1} w={0.8} d={0.8} h={0.7} top="iso-acc" />
    </g>
    <Screwdriver x={-1.5} y={3} z={3.5} rot={-25} />
    <Badge x={5} y={-0.3} z={8.6} />
    <Spark x={13} y={-1} z={6} s={8} delay={0.6} />
  </Stage>
);

const Offers = () => (
  <Stage>
    <Slab x={0} y={0} w={5} d={5} h={0.55} r={2.5} />
    <Slab x={0} y={0} z={0.8} w={5} d={5} h={0.55} r={2.5} />
    <g className="iso-bob">
      <Slab x={0} y={0} z={1.9} w={5} d={5} h={0.55} r={2.5} />
      <Plane z={2.45}>
        <circle cx={2.5} cy={2.5} r={1.9} className="iso-s iso-thin iso-faint" fill="none" />
        <circle cx={1.8} cy={1.8} r={0.45} className="iso-acc iso-s iso-thin" />
        <circle cx={3.2} cy={3.2} r={0.45} className="iso-acc iso-s iso-thin" />
        <path d="M3.4 1.6L1.6 3.4" className="iso-s" fill="none" />
      </Plane>
    </g>
    <Spark x={5.5} y={-0.5} z={4.5} s={9} />
    <Spark x={-0.8} y={5} z={1.5} s={7} delay={0.9} />
  </Stage>
);

const GEAR_TEETH = [0, 45, 90, 135, 180, 225, 270, 315];
const BATTERY_CELLS = [0, 1, 2];
const CHIP_PINS = [0, 1, 2, 3].map((i) => `M5 ${(3.85 + i * 0.5).toFixed(2)}H5.4M7.8 ${(3.85 + i * 0.5).toFixed(2)}H8.2`).join('');

const Gear = ({ x, y, z = 0, s = 1 }) => (
  <At x={x} y={y} z={z} s={s}>
    <Slab x={0} y={0} w={3.4} d={3.4} h={0.5} r={1.7} />
    <Plane z={0.5}>
      <g className="iso-spin-slow" style={{ transformOrigin: '1.7px 1.7px' }}>
        {GEAR_TEETH.map((a) => (
          <rect key={a} x={1.48} y={-0.3} width={0.44} height={0.6} className="iso-acc iso-s iso-thin" transform={`rotate(${a} 1.7 1.7)`} />
        ))}
      </g>
      <circle cx={1.7} cy={1.7} r={1.15} className="iso-screen iso-s iso-thin" />
      <circle cx={1.7} cy={1.7} r={0.42} className="iso-acc iso-s iso-thin" />
    </Plane>
  </At>
);

const RepairCard = () => (
  <Stage>
    <Slab x={-1} y={-1} w={14} d={10} h={0.5} r={0.9} />

    <At x={1} y={1.6} z={0.5}><g className="iso-bob"><PhoneFlat broken /></g></At>

    <g className="iso-bob" style={{ animationDelay: '0.7s' }}>
      <Box x={5} y={0.8} z={0.5} w={3.6} d={1.6} h={0.7} />
      <Box x={8.6} y={1.2} z={0.5} w={0.4} d={0.8} h={0.4} top="iso-acc" />
      <Plane z={1.2}>
        {BATTERY_CELLS.map((i) => (
          <rect key={i} x={5.3 + i * 1.05} y={1.1} width={0.8} height={1} rx={0.15} className="iso-acc iso-s iso-thin iso-blink" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </Plane>
    </g>

    <Plane z={0.5}><path d={CHIP_PINS} className="iso-s" fill="none" /></Plane>
    <Box x={5.4} y={3.4} z={0.5} w={2.4} d={2.4} h={0.35} />
    <Plane z={0.85}>
      <rect x={6} y={4} width={1.2} height={1.2} rx={0.2} className="iso-acc iso-s iso-thin iso-pulse" />
      <circle cx={6.6} cy={4.6} r={0.22} className="iso-top" />
    </Plane>

    <Gear x={9.4} y={3.4} z={0.5} />

    <Screwdriver x={4.6} y={7.4} z={1.6} rot={-35} />
    <Badge x={2.4} y={2.4} z={6.4} />
    <Spark x={11.5} y={-0.5} z={4.5} s={9} />
    <Spark x={-0.8} y={6} z={3} s={7} delay={0.8} />
  </Stage>
);

const PriceTag = ({ x, y, z, w = 3.6, d = 2.2, delay = 0 }) => (
  <g className="iso-float" style={{ animationDelay: `${delay}s` }}>
    <Slab x={x} y={y} z={z} w={w} d={d} h={0.3} r={0.6} top="iso-acc" />
    <Plane z={z + 0.3}>
      <circle cx={x + 0.55} cy={y + 1.1} r={0.18} className="iso-top iso-s iso-thin" />
      <circle cx={x + 1.6} cy={y + 0.75} r={0.32} className="iso-top iso-s iso-thin" />
      <circle cx={x + 2.8} cy={y + 1.45} r={0.32} className="iso-top iso-s iso-thin" />
      <path d={`M${x + 2.8} ${y + 0.55}L${x + 1.6} ${y + 1.45}`} className="iso-glyph" />
    </Plane>
  </g>
);

const CoinStack = ({ x, y, z = 0, delay = 1.2 }) => (
  <At x={x} y={y} z={z}>
    <Slab x={0} y={0} w={3} d={3} h={0.45} r={1.5} />
    <Slab x={0} y={0} z={0.6} w={3} d={3} h={0.45} r={1.5} />
    <g className="iso-bob" style={{ animationDelay: `${delay}s` }}>
      <Slab x={0} y={0} z={1.2} w={3} d={3} h={0.45} r={1.5} />
      <Plane z={1.65}>
        <circle cx={1.5} cy={1.5} r={1.05} className="iso-s iso-thin iso-faint" fill="none" />
        <circle cx={1.15} cy={1.15} r={0.27} className="iso-acc iso-s iso-thin" />
        <circle cx={1.85} cy={1.85} r={0.27} className="iso-acc iso-s iso-thin" />
        <path d="M1.95 1.05L1.05 1.95" className="iso-s iso-thin" fill="none" />
      </Plane>
    </g>
  </At>
);

const OffersCard = () => (
  <Stage>
    <Slab x={-1} y={-1} w={15} d={10} h={0.45} r={0.9} />

    <Box x={0} y={1} z={0.45} w={4} d={3.2} h={4.2} />
    <Wall x={0} y={4.2} z={0.45}>
      <path d="M1.2 4.2C1.2 5.9 2.8 5.9 2.8 4.2" className="iso-s" fill="none" />
      <circle cx={2} cy={2} r={1.2} className="iso-acc iso-s iso-pulse" />
      <circle cx={1.6} cy={2.4} r={0.22} className="iso-top iso-s iso-thin" />
      <circle cx={2.4} cy={1.6} r={0.22} className="iso-top iso-s iso-thin" />
      <path d="M2.45 2.5L1.55 1.5" className="iso-glyph" />
    </Wall>

    <g className="iso-bob" style={{ animationDelay: '0.6s' }}>
      <Box x={6.2} y={0.8} z={0.45} w={3} d={3} h={2.6} />
      <polygon className="iso-acc iso-s iso-thin" points={pts(iso(7.4, 0.8, 3.05), iso(8, 0.8, 3.05), iso(8, 3.8, 3.05), iso(7.4, 3.8, 3.05))} />
      <polygon className="iso-acc iso-s iso-thin" points={pts(iso(7.4, 3.8, 3.05), iso(8, 3.8, 3.05), iso(8, 3.8, 0.45), iso(7.4, 3.8, 0.45))} />
      <Plane z={3.05}>
        <circle cx={7.7} cy={1.5} r={0.55} className="iso-acc iso-s iso-thin" />
        <circle cx={7.7} cy={3.1} r={0.55} className="iso-acc iso-s iso-thin" />
      </Plane>
    </g>

    <CoinStack x={10.6} y={4.6} z={0.45} />

    <PriceTag x={3.6} y={-0.4} z={6.2} />
    <path d={seg(iso(2, 1, 4.6), iso(4.4, 0.7, 6.4))} className="iso-stroke-acc iso-dash" />

    <Spark x={13} y={-0.5} z={4.5} s={9} />
    <Spark x={-0.8} y={5.5} z={2} s={7} delay={0.9} />
    <Spark x={8.5} y={-1} z={6.5} s={7} delay={0.4} />
  </Stage>
);

const ProductsBanner = () => (
  <Stage>
    <g className="iso-float"><LaptopParts /></g>
    <At x={11.5} y={1}><g className="iso-bob" style={{ animationDelay: '0.5s' }}><PhoneFlat /></g></At>
    <At x={3.5} y={9.4} s={0.6}><g className="iso-float" style={{ animationDelay: '1s' }}><WatchParts /></g></At>
    <PriceTag x={11} y={7.4} z={1.6} delay={0.8} />
    <Spark x={-1} y={2} z={5} s={8} delay={0.3} />
    <Spark x={14} y={0} z={3.5} s={7} delay={1} />
  </Stage>
);

const ShopsBanner = () => (
  <Stage>
    <At x={0} y={0}><Storefront w={6} d={5} h={4} n={6} sign /></At>
    <At x={7.4} y={0.6}><Storefront w={3.8} d={3} h={3.4} n={4} /></At>
    <Pin x={3} y={2} z={7.6} />
    <Badge x={9.3} y={2} z={5.6} />
    <Spark x={-1.2} y={1} z={4} s={8} delay={0.5} />
    <Spark x={12} y={0} z={5} s={7} delay={1.1} />
  </Stage>
);

const CALENDAR_CELLS = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ r, c, on: (r * 3 + c) % 4 === 0 })));

const OffersBanner = () => (
  <Stage>
    <Slab x={-1} y={-1} w={11} d={9} h={0.45} r={0.9} />
    <Box x={0.2} y={0.6} z={0.45} w={4.4} d={0.5} h={4.6} />
    <Wall x={0.2} y={1.1} z={0.45}>
      <rect x={0} y={3.5} width={4.4} height={1.1} className="iso-acc iso-s iso-thin" />
      <circle cx={1.1} cy={4.05} r={0.2} className="iso-top iso-s iso-thin" />
      <circle cx={3.3} cy={4.05} r={0.2} className="iso-top iso-s iso-thin" />
      {CALENDAR_CELLS.map(({ r, c, on }) => (
        <rect
          key={`${r}${c}`} x={0.5 + c * 1.3} y={0.4 + r * 1.0} width={0.9} height={0.55} rx={0.12}
          className={`${on ? 'iso-acc iso-blink' : 'iso-screen'} iso-s iso-thin`}
        />
      ))}
    </Wall>
    <CoinStack x={6.2} y={3.4} z={0.45} />
    <PriceTag x={5} y={0.2} z={5.4} />
    <Spark x={9.5} y={-0.5} z={4} s={8} delay={0.6} />
    <Spark x={-0.8} y={5} z={2.5} s={7} delay={1} />
  </Stage>
);

const CatLaptop = () => (
  <Stage>
    <g className="iso-float"><LaptopParts /></g>
    <Spark x={11} y={-1} z={6} s={8} />
  </Stage>
);

const CatPhone = () => (
  <Stage>
    <g className="iso-float"><PhoneFlat /></g>
    <Spark x={4} y={-0.5} z={2} s={7} delay={0.6} />
  </Stage>
);

const CatTablet = () => (
  <Stage>
    <g className="iso-float">
      <Slab x={0} y={0} w={7} d={5} h={0.35} r={0.7} />
      <Plane z={0.35}>
        <rect x={0.35} y={0.35} width={6.3} height={4.3} rx={0.45} className="iso-screen iso-s iso-thin" />
        <rect x={0.9} y={0.9} width={2.6} height={1.3} rx={0.2} className="iso-acc iso-blink" />
        <rect x={0.9} y={2.6} width={5.2} height={0.35} rx={0.17} className="iso-right" />
        <rect x={0.9} y={3.3} width={3.4} height={0.35} rx={0.17} className="iso-right" />
      </Plane>
    </g>
    <Spark x={7.5} y={-0.5} z={2} s={7} delay={0.5} />
  </Stage>
);

const HEADBAND = (() => {
  const L = iso(1.3, 1.3, 1.4), R = iso(8.7, 1.3, 1.4);
  return `M${L[0].toFixed(1)} ${L[1].toFixed(1)}C${L[0].toFixed(1)} ${(L[1] - 90).toFixed(1)} ${R[0].toFixed(1)} ${(R[1] - 90).toFixed(1)} ${R[0].toFixed(1)} ${R[1].toFixed(1)}`;
})();
const EAR_CUPS = [0, 7.4];

const CatAudio = () => (
  <Stage>
    <g className="iso-float">
      <path d={HEADBAND} className="iso-stroke-acc" style={{ stroke: 'var(--iso-line)', strokeWidth: 6 }} />
      <path d={HEADBAND} className="iso-stroke-acc" style={{ strokeWidth: 3.5 }} />
      {EAR_CUPS.map((x) => (
        <g key={x}>
          <Slab x={x} y={0} w={2.6} d={2.6} h={1.2} r={1.3} />
          <Plane z={1.2}><circle cx={x + 1.3} cy={1.3} r={0.85} className="iso-acc iso-s iso-thin iso-pulse" /></Plane>
        </g>
      ))}
    </g>
    <Spark x={9.5} y={-1} z={3} s={7} delay={0.7} />
  </Stage>
);

const CatWatch = () => (
  <Stage><g className="iso-float"><WatchParts /></g></Stage>
);

const CatMonitor = () => (
  <Stage>
    <Slab x={2.5} y={-1} w={4} d={2.4} h={0.35} r={0.6} />
    <Box x={3.9} y={-0.2} z={0.35} w={1.2} d={0.8} h={1.3} />
    <g className="iso-float">
      <Box x={0} y={-0.3} z={1.6} w={9} d={0.3} h={5.4} />
      <Wall x={0} y={0} z={1.6}>
        <rect x={0.4} y={0.4} width={8.2} height={4.6} rx={0.3} className="iso-screen iso-s iso-thin" />
        {BAR_H.map((h, i) => (
          <rect key={i} x={1 + i * 1.3} y={0.8} width={0.8} height={h * 0.9} rx={0.1} className="iso-acc iso-bar" style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
      </Wall>
    </g>
  </Stage>
);

const GAMING_BTNS = [[6.6, 1.8, 'iso-acc'], [7.5, 2.6, 'iso-top'], [6.6, 3.4, 'iso-top'], [5.7, 2.6, 'iso-acc']];

const CatGaming = () => (
  <Stage>
    <g className="iso-float">
      <Slab x={0} y={0} w={9} d={5} h={0.9} r={2} />
      <Plane z={0.9}>
        <path d="M2.4 1.7V3.3M1.6 2.5H3.2" className="iso-s" style={{ strokeWidth: 3 }} fill="none" />
        {GAMING_BTNS.map(([cx, cy, c], i) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={0.42} className={`${c} iso-s iso-thin iso-blink`} style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
        <circle cx={4.5} cy={3.7} r={0.5} className="iso-screen iso-s iso-thin" />
      </Plane>
    </g>
    <Spark x={9.5} y={-0.5} z={3} s={7} delay={0.4} />
  </Stage>
);

const CatCamera = () => (
  <Stage>
    <g className="iso-float">
      <Box x={0} y={0} w={8} d={4.5} h={3} />
      <Box x={5.4} y={0.9} z={3} w={1.8} d={1.3} h={0.5} top="iso-acc" />
      <Box x={1} y={1} z={3} w={1.4} d={1.4} h={0.35} />
      <Wall x={0} y={4.5} z={0}>
        <circle cx={4} cy={1.5} r={1.25} className="iso-top iso-s" />
        <circle cx={4} cy={1.5} r={0.85} className="iso-acc iso-s iso-thin iso-pulse" />
        <circle cx={3.7} cy={1.8} r={0.3} className="iso-top" />
      </Wall>
    </g>
    <Spark x={9} y={-0.5} z={4} s={7} delay={0.6} />
  </Stage>
);

const CatBox = () => (
  <Stage>
    <g className="iso-float">
      <Box x={0} y={0} w={6} d={6} h={4} />
      <polygon className="iso-acc iso-s iso-thin" points={pts(iso(2.6, 0, 4), iso(3.4, 0, 4), iso(3.4, 6, 4), iso(2.6, 6, 4))} />
      <Wall x={0} y={6} z={0}>
        <rect x={2.6} y={0} width={0.8} height={4} className="iso-acc iso-s iso-thin" />
        <rect x={0.5} y={0.6} width={1.5} height={0.9} rx={0.15} className="iso-screen iso-s iso-thin" />
      </Wall>
    </g>
    <Spark x={7} y={-0.5} z={3.5} s={7} delay={0.5} />
  </Stage>
);

const CRATE = (
  <>
    <Box x={0} y={0} w={7} d={6} h={3} />
    <polygon className="iso-top iso-s" points={pts(iso(0, 6, 3), iso(7, 6, 3), iso(7, 7.8, 4.4), iso(0, 7.8, 4.4))} />
    <polygon className="iso-right iso-s" points={pts(iso(7, 0, 3), iso(7, 6, 3), iso(8.8, 6, 4.4), iso(8.8, 0, 4.4))} />
    <Wall x={0} y={6} z={0}>
      <rect x={0.5} y={0.6} width={1.6} height={0.9} rx={0.15} className="iso-screen iso-s iso-thin" />
      <rect x={3} y={0} width={0.8} height={3} className="iso-acc iso-s iso-thin" />
    </Wall>
  </>
);

const Arrivals = () => (
  <Stage>
    {CRATE}
    <path d={seg(iso(1.8, 2, 3.1), iso(1.8, 2, 5.4))} className="iso-stroke-w iso-dash iso-faint" style={{ strokeWidth: 1.2 }} />
    <path d={seg(iso(5.4, 3.2, 3.1), iso(5.4, 3.2, 5.6))} className="iso-stroke-w iso-dash iso-faint" style={{ strokeWidth: 1.2 }} />
    <At x={0.4} y={-0.2} z={5.4}><g className="iso-bob"><PhoneFlat /></g></At>
    <At x={4.4} y={1.4} z={5.8} s={0.55}><g className="iso-float" style={{ animationDelay: '0.8s' }}><WatchParts /></g></At>
    <PlusTag x={9.6} y={-1.2} z={4.4} delay={0.5} />
    <Spark x={-1.2} y={1} z={6} s={8} delay={0.3} />
    <Spark x={9} y={4} z={7} s={7} delay={1} />
  </Stage>
);

const STAR_D = 'M0-1L.2245-.309L.951-.309L.363.118L.588.809L0 .382L-.588.809L-.363.118L-.951-.309L-.2245-.309Z';
const FIVE = [0, 1, 2, 3, 4];
const THREE = [0, 1, 2];

const Star = ({ cx, cy, r = 0.5, flip = false, cls = 'iso-acc', delay }) => (
  <path
    d={STAR_D} className={`${cls} iso-s iso-thin`} transform={`translate(${cx} ${cy}) scale(${r} ${flip ? -r : r})`}
    style={delay !== undefined ? { animationDelay: `${delay}s` } : undefined}
  />
);

const RatingPill = ({ x, y, z, delay = 0 }) => (
  <g className="iso-float" style={{ animationDelay: `${delay}s` }}>
    <Slab x={x} y={y} z={z} w={5} d={1.8} h={0.3} r={0.8} />
    <Plane z={z + 0.3}>
      {THREE.map((i) => <Star key={i} cx={x + 1.1 + i * 1.4} cy={y + 0.9} r={0.5} cls="iso-acc iso-blink" delay={i * 0.3} />)}
    </Plane>
  </g>
);

const ChatBubble = ({ x, y, z, w = 4, d = 2.6, accent = false, delay = 0 }) => (
  <g className="iso-bob" style={{ animationDelay: `${delay}s` }}>
    <Slab x={x} y={y} z={z} w={w} d={d} h={0.3} r={0.7} top={accent ? 'iso-acc' : 'iso-top'} />
    <Plane z={z + 0.3}>
      {THREE.map((i) => (
        <circle
          key={i} cx={x + w / 2 - 0.7 + i * 0.7} cy={y + d / 2} r={0.22}
          className={`${accent ? 'iso-top' : 'iso-acc'} iso-blink`} style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </Plane>
  </g>
);

const FRONT_SM = <Storefront w={6} d={5} h={4} n={4} />;
const FRONT_SIGN = <Storefront w={6} d={5} h={4} n={6} sign />;
const FRONT_MINI = <Storefront w={3.8} d={3} h={3.4} n={4} />;
const FRONT_BIG = <Storefront w={9} d={6} h={4.6} n={8} sign />;

const ADMIN_BARS = [2.0, 3.4, 2.6, 4.2, 3.0, 4.8];
const ADMIN_IDX = [0, 1, 2, 3, 4, 5];

const AdminHero = () => (
  <Stage>
    <Slab x={-1} y={-1} w={14} d={10} h={0.45} r={0.9} />

    <g className="iso-float">
      <Box x={0} y={0.2} z={0.45} w={8} d={0.4} h={6.4} />
      <Wall x={0} y={0.6} z={0.45}>
        <rect x={0.6} y={5.2} width={3} height={0.4} rx={0.2} className="iso-acc" />
        <rect x={0.6} y={4.6} width={1.8} height={0.28} rx={0.14} className="iso-right" />
        {ADMIN_IDX.map((i) => (
          <rect
            key={i} x={0.7 + i * 1.15} y={0.6} width={0.75} height={ADMIN_BARS[i] * 0.7} rx={0.1}
            className="iso-acc iso-s iso-thin iso-bar" style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </Wall>
    </g>

    <At x={9.2} y={2.6}><g className="iso-bob">{FRONT_MINI}</g></At>

    <Gear x={0.6} y={3.6} z={0.45} s={0.9} />

    <At x={4.6} y={4.4} z={0.45}>
      <g className="iso-bob" style={{ animationDelay: '0.7s' }}>
        <Box x={0} y={0} w={2.2} d={2.2} h={1.6} />
        <Box x={0.3} y={0.3} z={1.6} w={1.6} d={1.6} h={1} top="iso-acc" />
      </g>
    </At>

    <Badge x={4} y={0.4} z={8} />
    <Spark x={11} y={-0.5} z={5} s={9} />
    <Spark x={-1} y={5} z={3} s={7} delay={0.8} />
  </Stage>
);

const SHOPS_ROUTE = 'M4.4 10C7 11 9.4 8.6 9.3 5.4';

const ShopsHero = () => (
  <Stage>
    <Plane>
      <path d={SHOPS_ROUTE} className="iso-stroke-w iso-dash" />
      <circle cx={9.3} cy={5.4} r={0.7} className="iso-stroke-w iso-ring" />
    </Plane>
    <At x={0} y={0}>{FRONT_SIGN}</At>
    <At x={7.4} y={0.6}>{FRONT_MINI}</At>
    <At x={0.6} y={8}><g className="iso-float"><PhoneFlat /></g></At>
    <Pin x={3} y={2} z={7.6} />
    <Badge x={9.3} y={2} z={5.6} />
    <RatingPill x={10.4} y={6.6} z={1.2} delay={0.6} />
    <Spark x={-1.2} y={1} z={4} s={8} delay={0.5} />
    <Spark x={13} y={0} z={5} s={7} delay={1.1} />
  </Stage>
);

const ShopRepair = () => (
  <Stage>
    <At x={0} y={0}>{FRONT_SM}</At>
    <Gear x={6.8} y={0.6} />
    <Screwdriver x={8.6} y={6.2} z={1.2} rot={-35} />
    <Spark x={-1} y={1} z={4.5} s={8} delay={0.4} />
  </Stage>
);

const ShopSell = () => (
  <Stage>
    <At x={0} y={0}>{FRONT_SM}</At>
    <g className="iso-bob">
      <Box x={7} y={4.2} w={1.8} d={1.8} h={1.4} />
      <Box x={7.3} y={4.5} z={1.4} w={1.2} d={1.2} h={0.9} top="iso-acc" />
    </g>
    <PriceTag x={7} y={0.2} z={2.6} delay={0.5} />
    <Spark x={-1} y={1} z={4.5} s={8} delay={0.4} />
  </Stage>
);

const ShopBoth = () => (
  <Stage>
    <At x={0} y={0}>{FRONT_SIGN}</At>
    <Gear x={7} y={0.4} s={0.8} />
    <g className="iso-bob" style={{ animationDelay: '0.6s' }}>
      <Box x={7.2} y={4.6} w={1.7} d={1.7} h={1.3} />
      <Box x={7.5} y={4.9} z={1.3} w={1.1} d={1.1} h={0.8} top="iso-acc" />
    </g>
    <Badge x={3} y={2.5} z={7.6} />
  </Stage>
);

const ShopStore = () => (
  <Stage>
    <At x={0} y={0}>{FRONT_SM}</At>
    <Pin x={3} y={2} z={6.4} />
  </Stage>
);

const ShopsEmpty = () => (
  <Stage>
    <Slab x={0} y={0} w={11} d={8} h={0.45} r={0.9} />
    <Plane z={0.45}>
      <path d="M1.5 6.2C4 7 5 3 9.4 1.8" className="iso-stroke-acc iso-dash" />
      <rect x={1.2} y={1.2} width={2.4} height={1.8} rx={0.3} className="iso-screen iso-s iso-thin" />
      <rect x={7} y={4.8} width={2.6} height={2} rx={0.3} className="iso-screen iso-s iso-thin" />
    </Plane>
    <Pin x={9.4} y={1.8} z={0.45} />
    <g className="iso-float">
      <path d={seg(iso(6.5, 5.5, 3.4), iso(8.2, 7.2, 3.4))} className="iso-stroke-acc" style={{ stroke: 'var(--iso-line)', strokeWidth: 6 }} />
      <path d={seg(iso(6.5, 5.5, 3.4), iso(8.2, 7.2, 3.4))} className="iso-stroke-acc" style={{ strokeWidth: 3.5 }} />
      <Plane z={3.4}><circle cx={5} cy={4} r={2} className="iso-screen iso-s" /></Plane>
    </g>
    <Spark x={0.5} y={-0.5} z={3} s={8} delay={0.5} />
  </Stage>
);

const ShopHero = () => (
  <Stage>
    <At x={0} y={0}>{FRONT_BIG}</At>
    <At x={-3.4} y={5.6} s={0.42}><g className="iso-float"><LaptopParts /></g></At>
    <At x={10.6} y={5.4} s={0.6}><g className="iso-float" style={{ animationDelay: '1s' }}><WatchParts /></g></At>
    <Badge x={4.5} y={3} z={8.6} />
    <RatingPill x={-1.2} y={-2} z={7.4} delay={0.4} />
    <ChatBubble x={9} y={-2.2} z={6.4} accent delay={0.8} />
    <Spark x={-1.8} y={1} z={4} s={8} delay={0.5} />
    <Spark x={11.5} y={2} z={3} s={7} delay={1.2} />
  </Stage>
);

const BAR_W = [4.2, 3.2, 1.8];

const ShopReviews = () => (
  <Stage>
    <g className="iso-float">
      <Box x={0} y={-0.4} w={7} d={0.4} h={7} />
      <Wall x={0} y={0} z={0}>
        {FIVE.map((i) => <Star key={i} cx={1.2 + i * 1.15} cy={5.6} r={0.5} flip cls="iso-acc iso-blink" delay={i * 0.25} />)}
        <rect x={1} y={4.2} width={5} height={0.4} rx={0.2} className="iso-acc" />
        {BAR_W.map((w, i) => (
          <g key={i}>
            <rect x={1} y={2.9 - i * 0.8} width={5} height={0.45} rx={0.22} className="iso-right iso-s iso-thin" />
            <rect x={1} y={2.9 - i * 0.8} width={w} height={0.45} rx={0.22} className="iso-acc iso-s iso-thin" />
          </g>
        ))}
      </Wall>
    </g>
    <At x={1.4} y={2.4}>
      <g className="iso-bob" style={{ animationDelay: '0.6s' }}>
        <Slab x={0} y={0} w={5.4} d={3.2} h={0.3} r={0.6} />
        <Plane z={0.3}>
          <circle cx={0.9} cy={0.9} r={0.42} className="iso-acc iso-s iso-thin" />
          {FIVE.map((i) => <Star key={i} cx={2 + i * 0.7} cy={0.9} r={0.26} />)}
          <rect x={0.7} y={1.7} width={4} height={0.3} rx={0.15} className="iso-right iso-s iso-thin" />
          <rect x={0.7} y={2.3} width={2.6} height={0.25} rx={0.12} className="iso-right iso-s iso-thin" />
        </Plane>
      </g>
    </At>
    <Badge x={7.2} y={-0.2} z={7.4} />
  </Stage>
);

const ShopChat = () => (
  <Stage>
    <At x={0} y={1}><g className="iso-float"><PhoneFlat /></g></At>
    <ChatBubble x={4.2} y={-0.6} z={2.2} w={4.6} d={2.6} accent />
    <ChatBubble x={5} y={3.8} z={0.8} w={3.6} d={2.2} delay={0.9} />
    <Spark x={9.4} y={0} z={3.6} s={8} />
  </Stage>
);

const ShopEmpty = () => (
  <Stage>
    {CRATE}
    <At x={2} y={1} z={4.6}>
      <g className="iso-bob iso-faint">
        <Plane><rect width={2.8} height={5} rx={0.6} className="iso-stroke-w iso-dash" /></Plane>
      </g>
    </At>
    <Spark x={-1} y={1} z={5} s={8} delay={0.4} />
    <Spark x={9} y={4} z={6} s={7} delay={1} />
  </Stage>
);

const CondNew = () => (
  <Stage>
    <g className="iso-float">
      <Box x={0} y={0} w={6} d={5} h={3.6} />
      <polygon className="iso-acc iso-s iso-thin" points={pts(iso(2.6, 0, 3.6), iso(3.4, 0, 3.6), iso(3.4, 5, 3.6), iso(2.6, 5, 3.6))} />
      <Wall x={0} y={5} z={0}>
        <rect x={2.6} y={0} width={0.8} height={3.6} className="iso-acc iso-s iso-thin" />
        <rect x={0.5} y={0.6} width={1.5} height={0.9} rx={0.15} className="iso-screen iso-s iso-thin" />
      </Wall>
    </g>
    <Badge x={3} y={2.5} z={7.4} />
    <Spark x={7.2} y={-0.5} z={4.5} s={8} delay={0.3} />
    <Spark x={-1} y={4} z={3} s={7} delay={0.9} />
  </Stage>
);

const CondRefurbished = () => (
  <Stage>
    <At x={0} y={1}><g className="iso-float"><PhoneFlat /></g></At>
    <Gear x={4.6} y={0.4} s={0.9} />
    <Screwdriver x={5.6} y={6.4} z={1.2} rot={-35} />
    <Badge x={1.4} y={2.5} z={6.4} />
    <Spark x={8.6} y={-0.5} z={3.5} s={7} delay={0.6} />
  </Stage>
);

const CondUsed = () => (
  <Stage>
    <At x={0} y={1}><g className="iso-float"><PhoneFlat /></g></At>
    <PriceTag x={4} y={0} z={2.4} delay={0.4} />
    <CoinStack x={4.6} y={4.6} />
    <Spark x={9} y={-0.5} z={4} s={7} delay={0.8} />
  </Stage>
);

const RAW = {
  marketplace: Marketplace, devices: Devices, shop: Shop, track: Track,
  account: Account, loginHero: LoginHero, signupHero: SignupHero,
  repair: Repair, offers: Offers, keyboard: Keyboard, services: Services,
  repairCard: RepairCard, offersCard: OffersCard,
  productsBanner: ProductsBanner, shopsBanner: ShopsBanner, offersBanner: OffersBanner,
  cat_laptop: CatLaptop, cat_phone: CatPhone, cat_tablet: CatTablet, cat_audio: CatAudio, cat_watch: CatWatch,
  cat_monitor: CatMonitor, cat_gaming: CatGaming, cat_camera: CatCamera, cat_box: CatBox,
  cond_new: CondNew, cond_refurbished: CondRefurbished, cond_used: CondUsed,
  arrivals: Arrivals,
  adminHero: AdminHero,
  shopsHero: ShopsHero, shopsEmpty: ShopsEmpty,
  shop_repair: ShopRepair, shop_sell: ShopSell, shop_both: ShopBoth, shop_store: ShopStore,
  shopHero: ShopHero, shopReviews: ShopReviews, shopChat: ShopChat, shopEmpty: ShopEmpty,
};

export const ISO_ILLUSTRATIONS = Object.fromEntries(Object.entries(RAW).map(([k, C]) => [k, memo(C)]));

export const ISO_BY_VARIANT = {
  home: 'marketplace',
  devices: 'devices',
  shop: 'shop',
  shops: 'shopsHero',
  shopPage: 'shopHero',
  track: 'track',
  account: 'account',
  login: 'loginHero',
  signup: 'signupHero',
  repair: 'repairCard',
  offers: 'offersCard',
  category: 'arrivals',
  admin: 'adminHero',
};

const has = (key) => Object.prototype.hasOwnProperty.call(ISO_ILLUSTRATIONS, key);

export const isoCatKey = (kind) => (has(`cat_${kind}`) ? `cat_${kind}` : 'cat_box');

export const isoCondKey = (cond) => {
  const key = `cond_${String(cond || '').toLowerCase()}`;
  return has(key) ? key : 'cat_box';
};

export const isoRoleKey = (role) => (role === 'REPAIRER' ? 'shop_repair' : role === 'SELLER' ? 'shop_sell' : 'shop_both');

const TONES = new Set(['orange', 'amber', 'sun']);
const FALLBACK_BOX = ISO_ILLUSTRATIONS.cat_box;
const FALLBACK_SHOP = ISO_ILLUSTRATIONS.shop_both;
const FALLBACK_HOME = ISO_ILLUSTRATIONS.marketplace;

export const IsoIllustration = memo(({
  type = 'marketplace', darkMode = false, onGreen = true, hoverOnly = false, animated = true, glow = true, tone = 'emerald', className = 'h-full w-full',
}) => {
  const ref = useRef(null);
  const name = String(type);
  const Comp = ISO_ILLUSTRATIONS[type]
    ?? (name.startsWith('cat_') || name.startsWith('cond_') ? FALLBACK_BOX : name.startsWith('shop_') ? FALLBACK_SHOP : FALLBACK_HOME);
  const live = animated && !hoverOnly;
  const still = !animated && !hoverOnly;

  useEffect(() => {
    injectIsoOnce();
    return live ? observeIso(ref.current) : undefined;
  }, [live]);

  return (
    <div
      ref={ref}
      className={`iso-root pointer-events-none relative isolate select-none ${className}`}
      data-dark={darkMode}
      data-surface={onGreen ? undefined : 'plain'}
      data-tone={TONES.has(tone) ? tone : undefined}
      data-static={still ? 'true' : undefined}
      data-hover={hoverOnly ? 'true' : undefined}
      aria-hidden="true"
    >
      {glow && <div className="iso-glow absolute inset-[6%] -z-10 opacity-60" />}
      <svg key={type} viewBox="0 0 420 420" className="iso-in h-full w-full" focusable="false">
        <FitCtx.Provider value={type}>
          <Comp />
        </FitCtx.Provider>
      </svg>
    </div>
  );
});

const GALLERY = [
  ['marketplace', 'Home'], ['devices', 'Devices'], ['shop', 'Shop'], ['track', 'Tracking'],
  ['account', 'Account'], ['loginHero', 'Login'], ['signupHero', 'Sign up'],
  ['repair', 'Repair'], ['repairCard', 'Repair bench'], ['offers', 'Offers'], ['offersCard', 'Offers bag'], ['keyboard', 'Keyboard'],
  ['arrivals', 'Arrivals'], ['cat_laptop', 'Laptop'], ['cat_phone', 'Phone'], ['cat_tablet', 'Tablet'],
  ['cat_audio', 'Audio'], ['cat_watch', 'Watch'], ['cat_monitor', 'Monitor'], ['cat_gaming', 'Gaming'],
  ['cat_camera', 'Camera'], ['cat_box', 'Other'],
  ['cond_new', 'New'], ['cond_refurbished', 'Refurbished'], ['cond_used', 'Used'],
  ['adminHero', 'Admin'],
  ['shopsHero', 'Shops'], ['shop_repair', 'Repairer'], ['shop_sell', 'Seller'], ['shop_both', 'Both'],
  ['shop_store', 'Store'], ['shopsEmpty', 'No results'], ['shopHero', 'Shop page'], ['shopReviews', 'Reviews'],
  ['shopChat', 'Chat'], ['shopEmpty', 'Empty shelf'],
];

export const IsoGallery = memo(({ darkMode = false }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {GALLERY.map(([type, label]) => (
      <figure
        key={type}
        className={`group overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
          darkMode
            ? 'border-[3px] border-black bg-[#232625] [box-shadow:6px_6px_0_0_#000]'
            : 'rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 shadow-lg shadow-emerald-900/20 ring-1 ring-white/20'
        }`}
      >
        <div className="aspect-square p-2"><IsoIllustration type={type} darkMode={darkMode} hoverOnly /></div>
        <figcaption className={`px-4 pb-3 text-sm font-semibold ${darkMode ? 'text-white' : 'text-emerald-50'}`}>{label}</figcaption>
      </figure>
    ))}
  </div>
));

export default IsoIllustration;