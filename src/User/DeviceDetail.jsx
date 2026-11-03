import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useParams, useNavigate, useNavigationType, Link } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiChevronDown, FiShoppingCart, FiCheck, FiTag, FiTruck, FiHome,
  FiMinus, FiPlus, FiAlertCircle, FiDollarSign, FiAward, FiShield, FiHeart, FiStar, FiRotateCcw, FiCpu,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, readStorage, safeImageUrl, kindOfCategory, clamp, clean, loadSwal, useHScroll,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } } });

const RELATED_LIMIT = 10;
const INFO_PAIRS_LIMIT = 4;
const SPEC_COLLAPSED = 12;
const CARD_IMG_W = 480;
const CARD_IMG_H = 480;
const MAIN_IMG_W = 900;
const MAIN_IMG_H = 900;
const SAVED_KEY = 'nb_saved_devices';
const SPEC_MAX = 50;
const LOW_STOCK = 5;
const SWIPE_MIN = 40;
const ZOOM = 2;
const ZOOM_EASE = 0.16;
const TAB_IDS = ['overview', 'specs'];
const TAB_KEYS = { overview: 'tabDescription', specs: 'techSpecs' };
const EMPTY_LIST = [];
const SLIDER_SK = [0, 1, 2, 3, 4];
const INFO_SK = [0, 1, 2, 3, 4];
const THUMB_SK = [0, 1, 2, 3];
const ALL_KEY = ['productsAll'];
const PRODUCT_STALE = 5 * 60 * 1000;
const TRUST_ITEMS = [
  [FiRotateCcw, 'returnsEasy'],
  [FiShield, 'securePayments'],
  [FiDollarSign, 'cashOnDelivery'],
  [FiAward, 'authentic'],
];

const categoryPath = (id) => `/products/category/${encodeURIComponent(id)}`;
const catKey = (id) => ['detailCategory', String(id)];
const rise = (ms) => ({ '--d': `${ms}ms` });

const POPPINS = "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const CAIRO = "'Cairo', 'Poppins', ui-sans-serif, system-ui, 'Segoe UI', Tahoma, sans-serif";
const POPPINS_STYLE = { fontFamily: POPPINS };
const CAIRO_STYLE = { fontFamily: CAIRO };
const FONT_HREF = {
  en: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap',
  ar: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
};

const ensureFont = (key) => {
  if (typeof document === 'undefined') return;
  const id = `gx-font-${key}`;
  if (document.getElementById(id)) return;
  if (!document.getElementById('gx-font-pre')) {
    [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      if (cors) l.crossOrigin = '';
      document.head.appendChild(l);
    });
    const mark = document.createElement('meta');
    mark.id = 'gx-font-pre';
    document.head.appendChild(mark);
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = FONT_HREF[key];
  document.head.appendChild(link);
};
ensureFont('en');

const GX_CSS = `
.gx{--g-bg:#f3f6f4;--g-card:#ffffff;--g-ink:#04261a;--g-muted:#5b7468;--g-line:#e3e9e6;--g-soft:#eef3f0;--g-accent:#10b981;--g-on:#04261a;--g-sale:#dc2626;--g-pos:#15803d;--g-media:#ffffff;--g-ring:rgba(16,185,129,.45);--g-btn:#047857;--g-glow:rgba(16,185,129,.14);--g-shadow:0 1px 2px rgba(4,38,26,.04),0 16px 36px -20px rgba(4,38,26,.22);--g-shadow-up:0 1px 2px rgba(4,38,26,.05),0 24px 46px -22px rgba(4,38,26,.32);--g-r:28px;background-color:var(--g-bg);background-image:radial-gradient(60rem 26rem at 88% -8rem,var(--g-glow),transparent 66%),radial-gradient(44rem 22rem at -6% 30rem,var(--g-glow),transparent 70%);background-repeat:no-repeat;color:var(--g-ink);color-scheme:light;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.gx-dark{--g-bg:#101211;--g-card:#1b1d1c;--g-ink:#ffffff;--g-muted:#9aa8a1;--g-line:#2b2f2d;--g-soft:#242826;--g-accent:#39ff88;--g-on:#022c22;--g-sale:#fb7185;--g-pos:#4ade80;--g-media:#161817;--g-ring:rgba(57,255,136,.5);--g-btn:#047857;--g-glow:rgba(57,255,136,.08);--g-shadow:0 1px 0 rgba(255,255,255,.03) inset,0 18px 40px -22px rgba(0,0,0,.85);--g-shadow-up:0 1px 0 rgba(255,255,255,.04) inset,0 26px 50px -24px rgba(0,0,0,.95);color-scheme:dark}
.gx button,.gx input,.gx select,.gx textarea{font-family:inherit}
.gx[lang=ar] *{letter-spacing:0!important}
.gx-card{background:var(--g-card);border:1px solid var(--g-line);border-radius:var(--g-r);box-shadow:var(--g-shadow)}
.gx-pcard{background:var(--g-card);border:1px solid var(--g-line);border-radius:26px;overflow:hidden;box-shadow:var(--g-shadow);contain:layout style;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease,border-color .25s ease}
.gx-pcard:hover{transform:translate3d(0,-4px,0);border-color:var(--g-accent);box-shadow:var(--g-shadow-up)}
.gx-pcard img{transition:transform .6s cubic-bezier(.22,.8,.2,1),opacity .2s ease}
.gx-pcard:hover img{transform:scale3d(1.06,1.06,1)}
.gx-panel{background:var(--g-card)}
.gx-glass{background:color-mix(in srgb,var(--g-card) 86%,transparent);-webkit-backdrop-filter:saturate(1.4) blur(12px);backdrop-filter:saturate(1.4) blur(12px)}
.gx-media{background:var(--g-media)}
.gx-frame{background:var(--g-media);border:1px solid var(--g-line)}
.gx-muted{color:var(--g-muted)}
.gx-pos{color:var(--g-pos)}
.gx-sale{color:var(--g-sale)}
.gx-ic{color:var(--g-accent)}
.gx-line{border-color:var(--g-line)}
.gx-bar{display:inline-block;width:6px;height:1.2em;border-radius:999px;background:linear-gradient(180deg,var(--g-accent),#059669)}
.gx-crumb{border-radius:6px;transition:color .15s ease}
.gx-crumb:hover{color:var(--g-accent);text-decoration:underline;text-underline-offset:3px}
.gx-crumb:focus-visible,.gx-btn:focus-visible,.gx-fab:focus-visible,.gx-thumb:focus-visible,.gx-tab:focus-visible,.gx-step:focus-visible,.gx-field:focus-within,.gx-gal:focus-visible{outline:3px solid var(--g-ring);outline-offset:2px}
.gx-chip{display:inline-flex;align-items:center;gap:4px;background:var(--g-soft);color:var(--g-ink);border-radius:999px;padding:5px 13px;font-size:12px;font-weight:600;line-height:1.4}
.gx-chip-a{background:var(--g-accent);color:var(--g-on)}
.gx-chip-r{background:#e11d48;color:#ffffff}
.gx-chip-w{background:#f97316;color:#ffffff}
.gx-chip-s{background:#0284c7;color:#ffffff}
.gx-chip-g{background:#15803d;color:#ffffff}
.gx-old{color:var(--g-muted);text-decoration:line-through}
.gx-rate{background:var(--g-soft);border-radius:999px}
.gx-rate-pill{display:inline-flex;align-items:center;gap:4px;background:var(--g-accent);color:var(--g-on);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700}
.gx-buy{position:relative;overflow:hidden;background:radial-gradient(30rem 14rem at 100% -4rem,var(--g-glow),transparent 70%),var(--g-card)}
.gx-pricebox{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 18px;padding-bottom:18px;margin-bottom:18px;border-bottom:1px dashed var(--g-line)}
.gx-tile{display:flex;align-items:center;gap:12px;background:var(--g-soft);border-radius:18px;padding:10px 12px;transition:transform .2s ease,background-color .2s ease}
.gx-tile:hover{transform:translate3d(0,-1px,0)}
.gx-tile-ic{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;border-radius:999px;background:var(--g-media);border:1px solid var(--g-line);color:var(--g-accent)}
.gx-fab{display:flex;align-items:center;justify-content:center;flex:none;background:rgba(255,255,255,.94);color:#111111;border:1px solid rgba(0,0,0,.06);box-shadow:0 4px 14px -4px rgba(0,0,0,.28);cursor:pointer;transition:transform .15s ease,background-color .15s ease}
.gx-fab:hover:not(:disabled){transform:scale(1.08)}
.gx-fab:active:not(:disabled){transform:scale(.94)}
.gx-fab:disabled{opacity:.45;cursor:not-allowed}
.gx-fab-on{background:var(--g-btn);color:#ffffff;border-color:var(--g-btn)}
.gx-btn{position:relative;overflow:hidden;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--g-card);color:var(--g-ink);border:1px solid var(--g-line);border-radius:999px;font-weight:600;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,transform .18s cubic-bezier(.2,.8,.2,1),filter .18s ease,box-shadow .18s ease,color .18s ease}
.gx-btn:hover:not(:disabled){border-color:var(--g-accent);transform:translate3d(0,-1px,0)}
.gx-btn:active:not(:disabled){transform:scale(.97)}
.gx-btn:disabled{opacity:.45;cursor:not-allowed}
.gx-btn-a,.gx-btn-on{background:linear-gradient(135deg,#10b981 0%,#059669 45%,var(--g-btn) 100%);color:#ffffff;border-color:transparent;box-shadow:0 14px 26px -12px rgba(4,120,87,.85),inset 0 1px 0 rgba(255,255,255,.28)}
.gx-btn-a::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.34) 50%,transparent 70%);transform:translate3d(-130%,0,0);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.gx-btn-a:hover:not(:disabled)::after{transform:translate3d(130%,0,0)}
.gx-btn-a:hover:not(:disabled),.gx-btn-on:hover:not(:disabled){filter:brightness(1.07);border-color:transparent;box-shadow:0 18px 30px -12px rgba(4,120,87,.95),inset 0 1px 0 rgba(255,255,255,.32)}
.gx-btn-ghost:hover:not(:disabled){background:var(--g-soft)}
.gx-field{display:inline-flex;align-items:center;gap:2px;padding:4px;background:var(--g-soft);color:var(--g-ink);border:1px solid var(--g-line);border-radius:999px}
.gx-step{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;background:var(--g-card);color:var(--g-ink);border:1px solid var(--g-line);cursor:pointer;transition:background-color .15s ease,color .15s ease,transform .15s ease,border-color .15s ease}
.gx-step:hover:not(:disabled){background:var(--g-accent);color:var(--g-on);border-color:var(--g-accent)}
.gx-step:active:not(:disabled){transform:scale(.92)}
.gx-step:disabled{opacity:.4;cursor:not-allowed}
.gx-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--g-line);border-radius:6px;background:var(--g-card);color:var(--g-on)}
.gx-box-on{background:var(--g-accent);border-color:var(--g-accent)}
.gx-thumb{border:2px solid var(--g-line);border-radius:20px;background:var(--g-media);padding:3px;overflow:hidden;cursor:pointer;transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease}
.gx-thumb:hover{border-color:var(--g-muted);transform:translate3d(0,-2px,0)}
.gx-thumb:active{transform:scale(.96)}
.gx-thumb-on,.gx-thumb-on:hover{border-color:var(--g-accent);box-shadow:0 0 0 3px var(--g-ring)}
.gx-spec{position:relative;transition:background-color .15s ease}
.gx-spec:nth-child(odd){background:var(--g-soft)}
.gx-spec:hover{background:var(--g-glow)}
.gx-spec::before{content:'';position:absolute;inset-block:10px;inset-inline-start:0;width:3px;border-radius:3px;background:var(--g-accent);opacity:0;transform:scaleY(.3);transition:opacity .18s ease,transform .18s ease}
.gx-spec:hover::before{opacity:1;transform:scaleY(1)}
.gx-cols>*+*{border-top:1px solid var(--g-line)}
@media (min-width:1024px){.gx-cols>*+*{border-top:0;border-inline-start:1px solid var(--g-line)}}
.gx-tab{position:relative;white-space:nowrap;margin:10px 0;padding:8px 18px;font-size:14px;font-weight:600;color:var(--g-muted);border-radius:999px;cursor:pointer;transition:color .15s ease,background-color .15s ease,box-shadow .15s ease}
.gx-tab:hover{color:var(--g-ink);background:var(--g-soft)}
.gx-tab-on,.gx-tab-on:hover{color:#ffffff;background:linear-gradient(135deg,#10b981,var(--g-btn));box-shadow:0 8px 18px -10px rgba(4,120,87,.9)}
.gx-tabbar{position:sticky;top:var(--gx-nav,64px);z-index:30;background:color-mix(in srgb,var(--g-card) 94%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:top .2s cubic-bezier(.2,.8,.2,1)}
body:has(.nv-root[data-hide=true]) .gx-tabbar{top:0}
.gx-anchor{scroll-margin-top:calc(var(--gx-nav,64px) + 72px)}
@media (min-width:1024px){
.gx-stick{position:sticky;top:calc(var(--gx-nav,64px) + 12px);align-self:start;transition:top .2s cubic-bezier(.2,.8,.2,1)}
body:has(.nv-root[data-hide=true]) .gx-stick{top:12px}
}
.gx-defer{content-visibility:auto;contain-intrinsic-size:auto 560px}
.gx-gal{border-radius:36px;background:var(--g-soft)}
.gx-zoom{overflow:hidden;isolation:isolate;touch-action:pan-y}
.gx-zoomlayer{position:absolute;inset:0;transform-origin:0 0;will-change:transform;backface-visibility:hidden}
.gx-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .28s ease,visibility 0s linear .28s}
.gx-slide-on{opacity:1;visibility:visible;transition:opacity .28s ease}
@media (hover:hover) and (pointer:fine){.gx-zoom{cursor:zoom-in}}
.gx-sk{background:linear-gradient(90deg,var(--g-soft) 25%,color-mix(in srgb,var(--g-soft) 45%,var(--g-card)) 50%,var(--g-soft) 75%);background-size:220% 100%;border-radius:14px;animation:gxShimmer 1.5s linear infinite}
@keyframes gxShimmer{from{background-position:120% 0}to{background-position:-120% 0}}
.gx-fade{animation:gxFade .3s ease both}
@keyframes gxFade{from{opacity:0}to{opacity:1}}
.gx-in{animation:gxIn .32s cubic-bezier(.2,.8,.2,1) both}
@keyframes gxIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.gx-rise{animation:gxRise .6s cubic-bezier(.16,.84,.24,1) both;animation-delay:var(--d,0ms)}
@keyframes gxRise{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}
.gx-up{animation:gxUp .26s cubic-bezier(.2,.8,.2,1) both}
@keyframes gxUp{from{transform:translate3d(0,100%,0)}to{transform:translate3d(0,0,0)}}
.gx-pop{animation:gxPop .3s cubic-bezier(.2,.9,.3,1.4) both}
@keyframes gxPop{0%{transform:scale(.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
.gx-hide-sb{scrollbar-width:none;-ms-overflow-style:none}
.gx-hide-sb::-webkit-scrollbar{display:none}
.ga-soft{fill:var(--g-soft)}
.ga-card{fill:var(--g-card);stroke:var(--g-line);stroke-width:2;stroke-linejoin:round}
.ga-line{fill:none;stroke:var(--g-line);stroke-width:4;stroke-linecap:round}
.ga-edge{fill:none;stroke:var(--g-line);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.ga-acc{fill:var(--g-accent)}
.ga-accline{fill:none;stroke:var(--g-accent);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
.ga-ring{fill:var(--g-card);stroke:var(--g-accent);stroke-width:4}
.ga-float{animation:gaFloat 3.4s ease-in-out infinite}
.ga-spark{transform-box:fill-box;transform-origin:center;animation:gaSpark 2.4s ease-in-out infinite}
@keyframes gaFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-5px,0)}}
@keyframes gaSpark{0%,100%{transform:scale(.8);opacity:.6}50%{transform:scale(1.15);opacity:1}}
@media (prefers-reduced-motion:reduce){.gx-pcard,.gx-pcard img,.gx-btn,.gx-btn-a::after,.gx-fab,.gx-thumb,.gx-crumb,.gx-tab,.gx-tabbar,.gx-stick,.gx-slide,.gx-step,.gx-tile,.gx-spec,.gx-spec::before{transition:none}.gx-pcard:hover,.gx-pcard:hover img,.gx-btn:hover:not(:disabled),.gx-thumb:hover,.gx-tile:hover{transform:none}.gx-fade,.gx-in,.gx-rise,.gx-up,.gx-sk,.gx-pop,.ga-float,.ga-spark{animation:none}}
`;

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('device-detail-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'device-detail-styles';
  tag.textContent = `${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${GX_CSS}`;
  document.head.appendChild(tag);
};
injectStyles();

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
};

const useInView = (margin = '500px') => {
  const [el, setEl] = useState(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (seen || !el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [el, seen, margin]);
  return [setEl, seen];
};

const useIdleFlag = (active) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active || on) return undefined;
    if (typeof window.requestIdleCallback === 'function') {
      const h = window.requestIdleCallback(() => setOn(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(h);
    }
    const h = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(h);
  }, [active, on]);
  return on;
};

const useNavOffset = () => {
  useEffect(() => {
    const root = document.documentElement;
    let head = null;
    let ro = null;
    let last = -1;
    const measure = () => {
      const next = document.querySelector('header.nv-head');
      if (next !== head) {
        ro?.disconnect();
        head = next;
        if (head && typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(measure);
          ro.observe(head);
        }
      }
      if (head) {
        const h = Math.round(head.getBoundingClientRect().height);
        if (h !== last) {
          last = h;
          root.style.setProperty('--gx-nav', `${h}px`);
        }
      }
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
      root.style.removeProperty('--gx-nav');
    };
  }, []);
};

const useImageZoom = () => {
  const layer = useRef(null);
  const z = useRef({ s: 1, x: 0, y: 0, ts: 1, tx: 0, ty: 0, raf: 0 });

  const tick = useCallback(() => {
    const st = z.current;
    const el = layer.current;
    st.raf = 0;
    if (!el) return;
    st.s += (st.ts - st.s) * ZOOM_EASE;
    st.x += (st.tx - st.x) * ZOOM_EASE;
    st.y += (st.ty - st.y) * ZOOM_EASE;
    const settled = Math.abs(st.ts - st.s) < 0.003 && Math.abs(st.tx - st.x) < 0.4 && Math.abs(st.ty - st.y) < 0.4;
    if (settled) {
      st.s = st.ts;
      st.x = st.tx;
      st.y = st.ty;
      el.style.transform = st.ts === 1 ? '' : `translate3d(${st.x}px,${st.y}px,0) scale(${st.s})`;
      return;
    }
    el.style.transform = `translate3d(${st.x}px,${st.y}px,0) scale(${st.s})`;
    st.raf = requestAnimationFrame(tick);
  }, []);

  const kick = useCallback(() => {
    if (!z.current.raf) z.current.raf = requestAnimationFrame(tick);
  }, [tick]);

  const aim = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
    z.current.tx = -(ZOOM - 1) * nx * r.width;
    z.current.ty = -(ZOOM - 1) * ny * r.height;
  }, []);

  const onEnter = useCallback((e) => {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    z.current.ts = ZOOM;
    aim(e);
    kick();
  }, [aim, kick]);

  const onMove = useCallback((e) => {
    if (e.pointerType !== 'mouse' || z.current.ts === 1) return;
    aim(e);
    kick();
  }, [aim, kick]);

  const onLeave = useCallback(() => {
    const st = z.current;
    st.ts = 1;
    st.tx = 0;
    st.ty = 0;
    kick();
  }, [kick]);

  useEffect(() => () => cancelAnimationFrame(z.current.raf), []);
  return { layer, onEnter, onMove, onLeave };
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const DEFAULT_TEXT = {
  en: {
    save: 'Save', saved: 'Saved',
    youSave: 'You save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount', specifications: 'Specifications',
    breadcrumbHome: 'Home', ratingsCount: '{{count}} ratings', sellingOutFast: 'Selling out fast',
    deliveryDetails: 'Delivery details', express: 'express', fastDelivery: 'Fast delivery', deliveryNote: 'Express shipping on in-stock items',
    paymentOptions: 'Payment options', boughtTogether: 'Frequently bought together', thisItem: 'This item', totalPrice: 'Total price', addSelected: 'Add {{count}} items to cart',
    soldBy: 'Sold by', viewShop: 'View shop', exploreMore: 'Explore more in {{name}}', dealBadge: 'Top deal',
    returnsEasy: 'Easy and hassle-free returns', securePayments: 'Secure payments',
    tabOverview: 'Product overview', tabDescription: 'Description', techSpecs: 'Technical specifications', highlights: 'Key features',
    productInfo: 'Product information',
    homeDeliveryText: 'This product can be delivered to your home with the cash on delivery option.',
    infoCondition: 'Condition', infoCategory: 'Category', infoAvailability: 'Availability', infoListed: 'Listed on', infoShop: 'Seller',
    specCount: '{{count}} specifications', showAllSpecs: 'Show all {{count}} specifications', showLessSpecs: 'Show fewer',
    noSpecs: 'No specifications yet', noSpecsText: 'The seller has not added technical details for this product.',
    noDescription: 'No description has been added yet',
    noRelated: 'Nothing similar yet', noRelatedText: 'Check back soon, new products are added every day.',
  },
  ar: {
    save: 'حفظ', saved: 'تم الحفظ',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم', specifications: 'المواصفات',
    breadcrumbHome: 'الرئيسية', ratingsCount: '{{count}} تقييم', sellingOutFast: 'ينفد بسرعة',
    deliveryDetails: 'تفاصيل التوصيل', express: 'إكسبريس', fastDelivery: 'توصيل سريع', deliveryNote: 'شحن إكسبريس للمنتجات المتوفرة',
    paymentOptions: 'خيارات الدفع', boughtTogether: 'يُشترى معًا بشكل متكرر', thisItem: 'هذا المنتج', totalPrice: 'السعر الإجمالي', addSelected: 'أضف {{count}} منتجات إلى السلة',
    soldBy: 'يباع بواسطة', viewShop: 'عرض المتجر', exploreMore: 'استكشف المزيد في {{name}}', dealBadge: 'عرض مميز',
    returnsEasy: 'إرجاع سهل وبدون متاعب', securePayments: 'مدفوعات آمنة',
    tabOverview: 'نظرة عامة', tabDescription: 'الوصف', techSpecs: 'المواصفات الفنية', highlights: 'أبرز المميزات',
    productInfo: 'معلومات المنتج',
    homeDeliveryText: 'يمكن توصيل هذا المنتج إلى منزلك مع خدمة الدفع عند الاستلام.',
    infoCondition: 'الحالة', infoCategory: 'القسم', infoAvailability: 'التوفر', infoListed: 'تاريخ الإضافة', infoShop: 'البائع',
    specCount: '{{count}} مواصفة', showAllSpecs: 'عرض كل المواصفات ({{count}})', showLessSpecs: 'عرض أقل',
    noSpecs: 'لا توجد مواصفات بعد', noSpecsText: 'لم يضف البائع تفاصيل فنية لهذا المنتج.',
    noDescription: 'لم تتم إضافة وصف بعد',
    noRelated: 'لا توجد منتجات مشابهة بعد', noRelatedText: 'عد قريبًا، فنحن نضيف منتجات جديدة كل يوم.',
  },
  fr: {
    save: 'Enregistrer', saved: 'Enregistré',
    youSave: 'Vous économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise', specifications: 'Caractéristiques',
    breadcrumbHome: 'Accueil', ratingsCount: '{{count}} avis', sellingOutFast: 'Bientôt épuisé',
    deliveryDetails: 'Détails de livraison', express: 'express', fastDelivery: 'Livraison rapide', deliveryNote: 'Expédition express pour les produits en stock',
    paymentOptions: 'Modes de paiement', boughtTogether: 'Souvent achetés ensemble', thisItem: 'Cet article', totalPrice: 'Prix total', addSelected: 'Ajouter {{count}} articles au panier',
    soldBy: 'Vendu par', viewShop: 'Voir la boutique', exploreMore: 'Découvrir plus dans {{name}}', dealBadge: 'Bonne affaire',
    returnsEasy: 'Retours simples et sans souci', securePayments: 'Paiements sécurisés',
    tabOverview: 'Présentation', tabDescription: 'Description', techSpecs: 'Caractéristiques techniques', highlights: 'Points forts',
    productInfo: 'Informations produit',
    homeDeliveryText: 'Ce produit peut être livré chez vous avec paiement à la livraison.',
    infoCondition: 'État', infoCategory: 'Catégorie', infoAvailability: 'Disponibilité', infoListed: 'Ajouté le', infoShop: 'Vendeur',
    specCount: '{{count}} caractéristiques', showAllSpecs: 'Afficher les {{count}} caractéristiques', showLessSpecs: 'Afficher moins',
    noSpecs: 'Aucune caractéristique pour le moment', noSpecsText: "Le vendeur n'a pas encore ajouté de détails techniques.",
    noDescription: "Aucune description n'a encore été ajoutée",
    noRelated: 'Rien de similaire pour le moment', noRelatedText: 'Revenez bientôt, de nouveaux produits arrivent chaque jour.',
  },
};
const DETAIL_SECTIONS = {
  en: enTranslations.deviceDetail,
  ar: arTranslations.deviceDetail,
  fr: frTranslations.deviceDetail,
};
const translators = {};
const getT = (lang) => {
  if (!translators[lang]) {
    const dict = { ...DEFAULT_TEXT.en, ...DETAIL_SECTIONS.en, ...DEFAULT_TEXT[lang], ...DETAIL_SECTIONS[lang] };
    translators[lang] = (key, values) => {
      let text = dict[key] ?? key;
      if (values) for (const k of Object.keys(values)) text = text.split(`{{${k}}}`).join(String(values[k]));
      return text;
    };
  }
  return translators[lang];
};

const pick = (obj, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined);

const CONDITION = {
  NEW: { chip: 'gx-chip-a', badge: 'bg-emerald-700', key: 'conditionNew' },
  USED: { chip: 'gx-chip-w', badge: 'bg-amber-700', key: 'conditionUsed' },
  REFURBISHED: { chip: 'gx-chip-s', badge: 'bg-sky-700', key: 'conditionRefurbished' },
};
const condOf = (c) => pick(CONDITION, c) || null;
const condLabel = (t, c) => (pick(CONDITION, c) ? t(pick(CONDITION, c).key) : clean(c, 30) || t('conditionUnknown'));

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const COMPACT_FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fmt = (n) => NUMBER_FORMAT.format(Number(n) || 0);
const fmtPrice = (n, currency) => `${currency} ${fmt(n)}`;
const fmtDate = (v, lang) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
};
const round2 = (n) => Math.round(n * 100) / 100;

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === 'PERCENTAGE') return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const toSpecList = (v) => {
  const source = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\n,،]/) : EMPTY_LIST;
  if (!source.length) return EMPTY_LIST;
  const out = [];
  for (const s of source) {
    const c = clean(typeof s === 'string' ? s : s?.name ?? s?.value ?? '', 120);
    if (c) out.push(c);
    if (out.length >= SPEC_MAX) break;
  }
  return out.length ? out : EMPTY_LIST;
};

const SPEC_PAIR = /^([^:：]{1,40})[:：]\s*(.+)$/;
const parseSpecs = (list) => {
  const highlights = [];
  const pairs = [];
  for (const s of list) {
    const hit = SPEC_PAIR.exec(s);
    if (hit) pairs.push([hit[1].trim(), hit[2].trim()]);
    else highlights.push(s);
  }
  return { highlights, pairs };
};

const galleryOf = (p) => {
  const extra = [p.images, p.imageUrls, p.gallery].find(Array.isArray) || [];
  const list = [p.imageUrl, ...extra.map((i) => (typeof i === 'string' ? i : i?.url || i?.imageUrl))]
    .map(safeImageUrl)
    .filter(Boolean);
  return [...new Set(list)].slice(0, 8);
};

const normalizeProduct = (p, detailed = false) => {
  const base = Math.max(0, Number(p.price) || 0);
  const legacyPct = clamp(Number(p.discount) || 0, 0, 100);
  const legacyOld = Math.max(0, Number(p.oldPrice ?? p.originalPrice) || 0);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let price = base;
  let finalPrice = base;
  if (apiFinal > 0 && apiFinal < base) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(base, apiType, discountValue);
  else if (legacyPct) finalPrice = round2(base * (1 - legacyPct / 100));
  else if (legacyOld > base) price = legacyOld;
  const saving = round2(Math.max(0, price - finalPrice));
  const discount = price > 0 ? (saving / price) * 100 : 0;
  const images = detailed ? galleryOf(p) : [safeImageUrl(p.imageUrl)].filter(Boolean);
  return {
    id: String(p.id),
    rawId: p.id,
    name: clean(String(p.name ?? ''), 160),
    description: clean(String(p.description ?? ''), detailed ? 3000 : 200),
    specifications: detailed ? toSpecList(p.specifications) : EMPTY_LIST,
    categoryId: p.categoryId ?? p.category?.id ?? null,
    categoryName: clean(String(p.categoryName ?? ''), 80),
    condition: typeof p.condition === 'string' ? p.condition : '',
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    deleted: !!p.deleted,
    shopId: p.shopId != null ? String(p.shopId) : '',
    shopName: clean(String(p.shopName ?? p.brandName ?? ''), 80),
    createdAt: p.createdAt || null,
    rating: clamp(Number(p.rating ?? p.averageRating) || 0, 0, 5),
    reviews: Math.max(0, Number(p.reviewCount ?? p.reviewsCount ?? p.ratingCount) || 0),
    price,
    finalPrice,
    saving,
    discount,
    pct: saving > 0 ? Math.max(1, Math.round(discount)) : 0,
    images,
    imageUrl: images[0] || '',
  };
};

const toNormalized = (list) => list.map((p) => normalizeProduct(p));

const fetchProduct = async (id, signal) => normalizeProduct((await api.get(`/api/products/${encodeURIComponent(id)}`, { signal })).data, true);

const cleanList = (res) => {
  const list = res.data?.content || res.data || [];
  return Array.isArray(list) ? list.filter((p) => p && p.id != null && !p.deleted) : EMPTY_LIST;
};
const fetchAllProducts = async ({ signal }) => cleanList(await api.get('/api/products', { signal }));
const fetchCategoryProducts = async (cid, signal) => cleanList(await api.get(`/api/products/category/${encodeURIComponent(cid)}`, { signal }));

const prefetchProduct = (id) => {
  queryClient.prefetchQuery({ queryKey: ['product', String(id)], queryFn: ({ signal }) => fetchProduct(String(id), signal), staleTime: PRODUCT_STALE });
};

const ART = {
  specs: (
    <>
      <ellipse className="ga-soft" cx="80" cy="108" rx="44" ry="6" />
      <g className="ga-float">
        <rect className="ga-card" x="44" y="16" width="72" height="88" rx="12" />
        <rect className="ga-acc" x="64" y="9" width="32" height="14" rx="7" />
        <circle className="ga-soft" cx="60" cy="44" r="5" />
        <circle className="ga-soft" cx="60" cy="62" r="5" />
        <circle className="ga-soft" cx="60" cy="80" r="5" />
        <path className="ga-line" d="M74 44h30M74 62h30M74 80h18" />
      </g>
      <path className="ga-spark ga-acc" d="M126 30l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z" />
    </>
  ),
  description: (
    <>
      <ellipse className="ga-soft" cx="80" cy="108" rx="44" ry="6" />
      <g className="ga-float">
        <rect className="ga-card" x="38" y="14" width="70" height="88" rx="12" />
        <path className="ga-line" d="M52 36h42M52 52h42M52 68h24" />
        <circle className="ga-ring" cx="106" cy="80" r="15" />
        <path className="ga-accline" d="M117 91l13 13" />
      </g>
    </>
  ),
  related: (
    <>
      <ellipse className="ga-soft" cx="80" cy="110" rx="46" ry="6" />
      <g className="ga-float">
        <path className="ga-card" d="M38 46l42-18 42 18v38l-42 20-42-20z" />
        <path className="ga-edge" d="M38 46l42 20 42-20M80 66v38" />
        <path className="ga-acc" d="M60 37l42 19-8 4-42-19z" />
      </g>
      <path className="ga-spark ga-acc" d="M128 22l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z" />
      <circle className="ga-spark ga-acc" cx="32" cy="34" r="3.5" />
    </>
  ),
  image: (
    <>
      <ellipse className="ga-soft" cx="80" cy="108" rx="48" ry="6" />
      <g className="ga-float">
        <rect className="ga-card" x="32" y="22" width="96" height="74" rx="12" />
        <circle className="ga-acc" cx="58" cy="46" r="8" />
        <path className="ga-soft" d="M36 92l28-30 20 18 14-12 26 24z" />
      </g>
    </>
  ),
};

const EmptyState = memo(({ kind, title, text, compact = false }) => (
  <div className={`gx-fade flex flex-col items-center justify-center text-center ${compact ? 'py-4' : 'py-10'}`}>
    <svg viewBox="0 0 160 120" role="img" aria-label={title} className={compact ? 'h-24 w-32' : 'h-32 w-44'}>{ART[kind]}</svg>
    <p className="mt-2 text-base font-semibold">{title}</p>
    {text && <p className="gx-muted mt-1 max-w-xs text-sm">{text}</p>}
  </div>
));

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`gx-sk ${className}`} />;

const SliderSkeleton = () => (
  <div aria-hidden="true">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Sk className="h-7 w-48" />
      <div className="flex gap-2"><Sk className="h-10 w-10 !rounded-full" /><Sk className="h-10 w-10 !rounded-full" /></div>
    </div>
    <div className="flex gap-4 overflow-hidden pb-4 pt-1">
      {SLIDER_SK.map((i) => (
        <div key={i} className="w-44 flex-shrink-0 sm:w-56">
          <div className="gx-card overflow-hidden !rounded-[26px] p-2.5">
            <Sk className="aspect-square w-full !rounded-2xl" />
            <div className="space-y-2 p-1.5 pt-3"><Sk className="h-4 w-full" /><Sk className="h-4 w-2/3" /><Sk className="h-6 w-1/2" /></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PageSkeleton = () => (
  <div role="status" aria-busy="true" aria-live="polite" className="gx-fade">
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <Sk className="h-4 w-72 max-w-full" />
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
        <div className="flex min-w-0 flex-col-reverse gap-3 lg:col-span-5 lg:flex-row">
          <div className="flex gap-2.5 p-1 lg:w-20 lg:flex-col">
            {THUMB_SK.map((i) => <Sk key={i} className="h-16 w-16 flex-none !rounded-[20px] lg:h-[4.5rem] lg:w-[4.5rem]" />)}
          </div>
          <Sk className="aspect-square min-w-0 flex-1 !rounded-[36px] sm:aspect-[4/5] lg:max-h-[40rem]" />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-7">
          <div className="flex gap-2"><Sk className="h-6 w-24 !rounded-full" /><Sk className="h-6 w-28 !rounded-full" /></div>
          <Sk className="h-8 w-full" />
          <Sk className="h-8 w-3/5" />
          <Sk className="h-5 w-40" />
          <div className="gx-card space-y-5 p-6">
            <div className="flex items-end justify-between gap-4"><Sk className="h-10 w-40" /><Sk className="h-7 w-28 !rounded-full" /></div>
            <div className="flex gap-2"><Sk className="h-6 w-20 !rounded-full" /><Sk className="h-6 w-20 !rounded-full" /></div>
            <div className="flex gap-3"><Sk className="h-[52px] w-32 !rounded-full" /><Sk className="h-[52px] flex-1 !rounded-full" /><Sk className="h-[52px] w-[52px] !rounded-full" /></div>
            <div className="grid gap-2.5 sm:grid-cols-2"><Sk className="h-14 !rounded-2xl" /><Sk className="h-14 !rounded-2xl" /></div>
          </div>
          <div className="gx-card space-y-3 p-5"><Sk className="h-5 w-40" /><Sk className="h-12 w-full !rounded-2xl" /><Sk className="h-12 w-full !rounded-2xl" /></div>
          <div className="space-y-2">{INFO_SK.map((i) => <Sk key={i} className="h-10 w-full" />)}</div>
        </div>
      </div>
    </div>
    <div className="gx-panel gx-line border-y">
      <div className="mx-auto flex max-w-7xl gap-3 px-4 py-4 sm:px-6 lg:px-8"><Sk className="h-9 w-32 !rounded-full" /><Sk className="h-9 w-32 !rounded-full" /></div>
    </div>
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
      <Sk className="h-7 w-56" />
      <div className="gx-card space-y-3 p-6"><Sk className="h-4 w-full" /><Sk className="h-4 w-full" /><Sk className="h-4 w-3/4" /></div>
    </div>
  </div>
);

const Shell = ({ language, darkMode, className = '', children }) => {
  const isAr = language === 'ar';
  useEffect(() => { if (isAr) ensureFont('ar'); }, [isAr]);
  return (
    <div dir={languageDirection(language)} lang={language} style={isAr ? CAIRO_STYLE : POPPINS_STYLE}
      className={`gx ${darkMode ? 'gx-dark' : ''} min-h-screen [overflow-x:clip] ${className}`}>
      <Defs3D />
      <Toaster darkMode={darkMode} />
      {children}
    </div>
  );
};

const SectionTitle = memo(({ children }) => (
  <h2 className="mb-5 flex items-center gap-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl">
    <span className="gx-bar flex-none" aria-hidden="true" />
    <span className="min-w-0">{children}</span>
  </h2>
));

const BlockTitle = memo(({ children }) => (
  <h3 className="mb-3 flex items-center gap-2.5 text-base font-semibold">
    <span className="gx-bar !h-4 !w-1 flex-none" aria-hidden="true" />
    {children}
  </h3>
));

const IconTile = memo(({ icon: Icon, children, tone = '' }) => (
  <li className="gx-tile text-sm font-medium leading-relaxed">
    <span className="gx-tile-ic"><Icon className="h-4 w-4" aria-hidden="true" /></span>
    <span className={`min-w-0 ${tone}`}>{children}</span>
  </li>
));

const DeviceArt = memo(({ category, label, darkMode, big = false }) => (
  <div role="img" aria-label={label} className="gx-media relative flex h-full w-full items-center justify-center overflow-hidden">
    {big
      ? <IsoIllustration type={isoCatKey(kindOfCategory(category))} darkMode={darkMode} onGreen={false} className="relative h-4/5 w-4/5" />
      : <FiTag className="gx-ic h-1/2 w-1/2" aria-hidden="true" />}
  </div>
));

const DeviceImage = memo(({ src, alt, category, className, label, darkMode, big = false, eager = false, width = CARD_IMG_W, height = CARD_IMG_H }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  const handleError = useCallback(() => setFailed(true), []);
  const handleLoad = useCallback(() => setLoaded(true), []);
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    setLoaded(!!(el && el.complete && el.naturalWidth > 0));
  }, [src]);
  if (!src || failed) return <DeviceArt category={category} label={label} darkMode={darkMode} big={big} />;
  return (
    <>
      {!loaded && <span aria-hidden="true" className="gx-sk absolute inset-0 !rounded-none" />}
      <img
        ref={ref} src={src} alt={alt} width={width} height={height} decoding="async" referrerPolicy="no-referrer" draggable={false}
        loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'}
        onLoad={handleLoad} onError={handleError}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const ExpressTag = memo(({ t }) => (
  <span className="inline-flex w-fit items-center overflow-hidden rounded-full text-[11px] font-bold italic leading-none rtl:not-italic">
    <span className="bg-emerald-300 py-1.5 pe-2 ps-3 text-black">{t('express')}</span>
    <span className="bg-black py-1.5 pe-3 ps-2 text-white">{t('fastDelivery')}</span>
  </span>
));

const RatingPill = memo(({ product, t }) => {
  if (!(product.rating > 0)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" dir="ltr">
      <span className="gx-rate-pill tabular-nums">
        {product.rating.toFixed(1)}
        <FiStar className="h-3 w-3" fill="currentColor" aria-hidden="true" />
      </span>
      {product.reviews > 0 && <span className="gx-muted font-medium">{t('ratingsCount', { count: COMPACT_FORMAT.format(product.reviews) })}</span>}
    </div>
  );
});

const PriceLine = memo(({ product, currency, t, big = false }) => {
  const discounted = product.saving > 0;
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2" dir="ltr">
      <span className="sr-only">{discounted ? `${t('discountedPrice')}: ` : ''}</span>
      <span className={`font-semibold ${big ? 'text-sm' : 'text-xs'}`}>{currency}</span>
      <span className={`font-bold leading-tight tabular-nums tracking-tight ${big ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{fmt(product.finalPrice)}</span>
      {discounted && (
        <>
          <span className={`gx-old font-medium tabular-nums ${big ? 'text-sm' : 'text-[11px]'}`}>
            <span className="sr-only">{t('originalPrice')}: </span>
            {fmt(product.price)}
          </span>
          <span className={`gx-pos font-bold tabular-nums ${big ? 'text-base' : 'text-xs'}`} title={t('discountValue')}>-{product.pct}%</span>
        </>
      )}
    </div>
  );
});

const AddButton = memo(({ onAdd, disabled, label, addedLabel, className = '', compact = false }) => {
  const [state, setState] = useState('idle');
  const timer = useRef();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); }; }, []);
  const click = useCallback(async () => {
    if (state === 'adding') return;
    setState('adding');
    const ok = await onAdd();
    if (!alive.current) return;
    setState(ok ? 'added' : 'idle');
    if (ok) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => alive.current && setState('idle'), 1500);
    }
  }, [onAdd, state]);
  return (
    <button type="button" onClick={click} disabled={disabled || state === 'adding'} aria-busy={state === 'adding'} className={`gx-btn gx-btn-a ${className}`}>
      {state === 'adding'
        ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
        : state === 'added'
          ? <FiCheck aria-hidden="true" className="gx-pop h-4 w-4" strokeWidth={3} />
          : <FiShoppingCart aria-hidden="true" className="h-4 w-4" />}
      <span aria-live="polite" className={compact ? 'hidden sm:inline' : ''}>{state === 'added' ? addedLabel : label}</span>
    </button>
  );
});

const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, onSave, isSaved = false, t }) => {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);

  const cond = condOf(product.condition);
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= LOW_STOCK;
  const currency = t('currency');
  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const prefetch = useCallback(() => prefetchProduct(product.id), [product.id]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(product.rawId); }, [onSave, product.rawId]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (out || busy) return;
    setBusy(true);
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBusy(false);
    if (ok) { setAdded(true); clearTimeout(timer.current); timer.current = setTimeout(() => mounted.current && setAdded(false), 1400); }
  }, [onAddToCart, product, out, busy]);

  return (
    <article
      onClick={open} onKeyDown={handleKey} onPointerEnter={prefetch} onFocus={prefetch} tabIndex={0} aria-label={product.name}
      className="gx-pcard group relative flex h-full cursor-pointer flex-col p-2.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--g-accent)]"
    >
      <div className="gx-frame relative aspect-square w-full overflow-hidden rounded-[1.25rem]">
        <DeviceImage src={product.imageUrl} alt={product.name} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode}
          className="absolute inset-0 h-full w-full rounded-[1.25rem] object-contain p-3" />
        {cond && (
          <span className={`absolute start-2 top-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none text-white ${cond.badge}`}>{condLabel(t, product.condition)}</span>
        )}
        <button type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className="gx-fab absolute end-2 top-2 z-10 h-8 w-8 rounded-full">
          <FiHeart className={`h-4 w-4 ${isSaved ? 'gx-pop text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={handleCart} disabled={out || busy} aria-label={t('addToCart')} title={t('addToCart')}
          className={`gx-fab absolute bottom-2 end-2 z-10 h-9 w-9 rounded-full ${added ? 'gx-fab-on' : ''}`}>
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            : added ? <FiCheck className="gx-pop h-5 w-5" /> : <FiPlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-1.5 pb-1.5 pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{product.name}</h3>
        {product.rating > 0 && (
          <span className="gx-rate inline-flex w-fit items-center gap-1 px-2 py-0.5 text-xs font-semibold tabular-nums" dir="ltr">
            <FiStar className="gx-pos h-3 w-3" fill="currentColor" aria-hidden="true" />
            {product.rating.toFixed(1)}
            {product.reviews > 0 && <span className="gx-muted font-medium">({COMPACT_FORMAT.format(product.reviews)})</span>}
          </span>
        )}
        <div className="mt-auto pt-1">
          <PriceLine product={product} currency={currency} t={t} />
        </div>
        {out ? <p className="gx-sale text-xs font-semibold">{t('outOfStock')}</p>
          : low ? (
            <p className="flex items-center gap-1.5 text-xs font-medium">
              <span aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-500" />{t('onlyLeft', { count: product.stock })}
            </p>
          ) : (
            <p className="gx-muted flex min-w-0 items-center gap-1.5 text-xs font-medium">
              <FiTag aria-hidden="true" className="h-3 w-3 flex-shrink-0" /><span className="truncate">{product.categoryName || t('uncategorized')}</span>
            </p>
          )}
      </div>
    </article>
  );
});

const ProductSlider = memo(({ title, products, darkMode, isRTL, saved, onSave, onAddToCart, onOpen, t }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <section aria-label={title}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl">
          <span className="gx-bar flex-none" aria-hidden="true" />
          <span className="min-w-0 truncate">{title}</span>
        </h2>
        <div className="flex flex-none gap-2">
          <button type="button" className="gx-btn gx-btn-ghost h-10 w-10" onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('previous')}><BackIcon className="h-4 w-4" /></button>
          <button type="button" className="gx-btn gx-btn-ghost h-10 w-10" onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('next')}><ForwardIcon className="h-4 w-4" /></button>
        </div>
      </header>
      <div ref={ref} className="gx-hide-sb -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-6 pt-2 motion-reduce:scroll-auto">
        {products.map((p) => (
          <div key={p.id} className="w-44 flex-shrink-0 snap-start sm:w-56">
            <ProductCard product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} onSave={onSave} isSaved={saved.has(p.rawId)} t={t} />
          </div>
        ))}
      </div>
    </section>
  );
});

const Breadcrumb = memo(({ categoryId, categoryName, productName, t }) => (
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-1.5 text-xs font-medium sm:text-sm">
    <Link to="/" className="gx-crumb">{t('breadcrumbHome')}</Link>
    <FiChevronRight className="gx-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    <Link to="/devices" className="gx-crumb">{t('breadcrumbShop')}</Link>
    {categoryName && (
      <>
        <FiChevronRight className="gx-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        {categoryId != null && categoryId !== ''
          ? <Link to={categoryPath(categoryId)} title={categoryName} className="gx-crumb max-w-[10rem] truncate">{categoryName}</Link>
          : <span className="max-w-[10rem] truncate">{categoryName}</span>}
      </>
    )}
    <FiChevronRight className="gx-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    <span className="gx-muted max-w-[14rem] truncate" aria-current="page">{productName}</span>
  </nav>
));

const Gallery = memo(({ product, cond, darkMode, isSaved, onSave, isRTL, t }) => {
  const images = product.images;
  const count = images.length;
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0, 1]));
  const touchX = useRef(null);
  const { layer, onEnter, onMove, onLeave } = useImageZoom();

  const select = useCallback((i) => {
    setActive(i);
    setSeen((prev) => {
      if (prev.has(i) && prev.has(i + 1) && prev.has(i - 1)) return prev;
      const next = new Set(prev);
      [i - 1, i, i + 1].forEach((x) => { if (x >= 0 && x < count) next.add(x); });
      return next;
    });
  }, [count]);
  const go = useCallback((d) => select((active + d + count) % count), [select, active, count]);

  const onTouchStart = useCallback((e) => { touchX.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e) => {
    if (touchX.current == null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE_MIN) go((dx < 0) !== isRTL ? 1 : -1);
  }, [count, go, isRTL]);
  const onKeyDown = useCallback((e) => {
    if (count < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(isRTL ? -1 : 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(isRTL ? 1 : -1); }
  }, [count, go, isRTL]);

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {count > 1 && (
        <ul className="gx-hide-sb flex flex-none gap-2.5 overflow-x-auto p-1.5 pb-2 lg:max-h-[40rem] lg:w-[5.75rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-1.5">
          {images.map((s, i) => (
            <li key={s} className="flex-none">
              <button type="button" onClick={() => select(i)} aria-label={`${product.name} ${i + 1}`} aria-current={i === active ? 'true' : undefined}
                className={`gx-thumb block h-16 w-16 lg:h-[4.5rem] lg:w-[4.5rem] ${i === active ? 'gx-thumb-on' : ''}`}>
                <img src={s} alt="" width={96} height={96} loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} className="block h-full w-full rounded-2xl object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        tabIndex={count > 1 ? 0 : undefined} role="group" aria-roledescription="carousel" aria-label={product.name} onKeyDown={onKeyDown}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        className="gx-gal gx-card relative aspect-square min-w-0 flex-1 overflow-hidden sm:aspect-[4/5] lg:max-h-[40rem]"
      >
        <div className="gx-zoom gx-frame absolute inset-3 rounded-[1.75rem] sm:inset-4 sm:rounded-[2rem]" onPointerEnter={onEnter} onPointerMove={onMove} onPointerLeave={onLeave}>
          {count === 0
            ? <div className="absolute inset-0 flex items-center justify-center"><EmptyState kind="image" compact title={t('imageUnavailable')} /></div>
            : (
              <div ref={layer} className="gx-zoomlayer">
                {images.map((s, i) => (seen.has(i) ? (
                  <div key={s} className={`gx-slide ${i === active ? 'gx-slide-on' : ''}`} aria-hidden={i !== active}>
                    <DeviceImage src={s} alt={i === active ? product.name : ''} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode} big eager={i === 0}
                      width={MAIN_IMG_W} height={MAIN_IMG_H} className="absolute inset-0 h-full w-full rounded-[1.75rem] object-contain p-6 sm:rounded-[2rem] sm:p-8" />
                  </div>
                ) : null))}
              </div>
            )}
        </div>
        {cond && <span className={`pointer-events-none absolute start-6 top-6 z-10 rounded-full px-3 py-1.5 text-xs font-semibold leading-none text-white sm:start-7 sm:top-7 ${cond.badge}`}>{condLabel(t, product.condition)}</span>}
        <button type="button" onClick={onSave} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className="gx-fab absolute end-6 top-6 z-10 h-10 w-10 rounded-full sm:end-7 sm:top-7">
          <FiHeart className={`h-5 w-5 ${isSaved ? 'gx-pop text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t('previous')} className="gx-fab absolute start-6 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full opacity-90 sm:start-7">
              <FiChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t('next')} className="gx-fab absolute end-6 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full opacity-90 sm:end-7">
              <FiChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center gap-1.5 sm:bottom-7" aria-hidden="true">
              {images.map((s, i) => <span key={s} className={`h-2 rounded-full transition-[width,background-color] duration-300 ${i === active ? 'w-6 bg-[color:var(--g-accent)]' : 'w-2 bg-black/25'}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const SpecRows = memo(({ rows }) => (
  <dl>
    {rows.map(([k, v], i) => (
      <div key={`${k}-${i}`} className="gx-spec grid grid-cols-5 items-baseline gap-3 px-5 py-3.5 text-sm">
        <dt className="gx-muted col-span-2 break-words font-medium">{k}</dt>
        <dd className="col-span-3 break-words font-semibold">{v}</dd>
      </div>
    ))}
  </dl>
));

const InfoTable = memo(({ rows }) => (
  <div className="gx-card overflow-hidden !rounded-3xl">
    <SpecRows rows={rows} />
  </div>
));

const SpecTable = memo(({ pairs, t }) => {
  const [open, setOpen] = useState(false);
  const collapsible = pairs.length > SPEC_COLLAPSED;
  const shown = collapsible && !open ? pairs.slice(0, SPEC_COLLAPSED) : pairs;
  const mid = Math.ceil(shown.length / 2);
  const cols = shown.length > 6 ? [shown.slice(0, mid), shown.slice(mid)] : [shown];
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return (
    <div className="gx-card overflow-hidden !rounded-3xl">
      <div className="gx-line flex items-center gap-3 border-b px-5 py-4">
        <span className="gx-tile-ic"><FiCpu className="h-4 w-4" aria-hidden="true" /></span>
        <span className="text-sm font-semibold">{t('specCount', { count: pairs.length })}</span>
      </div>
      <div className="gx-cols grid items-start lg:grid-cols-2">
        {cols.map((c, i) => <SpecRows key={i} rows={c} />)}
      </div>
      {collapsible && (
        <div className="gx-line flex justify-center border-t p-4">
          <button type="button" onClick={toggle} aria-expanded={open} className="gx-btn gx-btn-ghost px-5 py-2.5 text-sm">
            <span>{open ? t('showLessSpecs') : t('showAllSpecs', { count: pairs.length })}</span>
            <FiChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
});

const TabBar = memo(({ active, onSelect, trailing, t }) => (
  <nav aria-label={t('tabDescription')} className="gx-tabbar gx-line border-b">
    <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
      <div className="gx-hide-sb flex min-w-0 gap-2 overflow-x-auto">
        {TAB_IDS.map((tid) => (
          <button key={tid} type="button" onClick={() => onSelect(tid)} aria-current={active === tid ? 'true' : undefined}
            className={`gx-tab ${active === tid ? 'gx-tab-on' : ''}`}>{t(TAB_KEYS[tid])}</button>
        ))}
      </div>
      {trailing}
    </div>
  </nav>
));

const StickyBuyBar = memo(({ product, currency, qty, onAdd, disabled, darkMode, t }) => (
  <div className="gx-up gx-glass gx-line fixed inset-x-0 bottom-0 z-40 rounded-t-[1.75rem] border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,.14)] lg:hidden">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
      <span className="gx-frame relative block h-12 w-12 flex-none overflow-hidden rounded-2xl">
        <DeviceImage src={product.imageUrl} alt="" category={product.categoryName} label={product.name} darkMode={darkMode} className="h-full w-full rounded-2xl object-contain p-1" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
        <PriceLine product={product} currency={currency} t={t} />
      </div>
      <AddButton onAdd={onAdd} disabled={disabled} label={`${t('addToCart')}${qty > 1 ? ` ×${qty}` : ''}`} addedLabel={t('addedToCart')} className="h-11 flex-none px-5 text-sm" compact />
    </div>
  </div>
));

const BuyBox = memo(({ product, currency, cond, stockStatus, unavailable, lowStock, qty, maxQty, onQty, onAdd, isSaved, onSave, ctaRef, t }) => {
  const discounted = product.saving > 0;
  return (
    <aside aria-label={t('addToCart')} className="gx-card gx-buy p-5 sm:p-6">
      <div className="gx-pricebox">
        <PriceLine product={product} currency={currency} t={t} big />
        {discounted && <p className="gx-chip gx-chip-g" dir="auto">{t('youSave', { value: fmtPrice(product.saving, currency) })}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`gx-chip ${cond ? cond.chip : ''}`}>{condLabel(t, product.condition)}</span>
        <span className={`gx-chip ${stockStatus.cls}`}>{stockStatus.label}</span>
        {lowStock && <span className="gx-chip gx-chip-w"><FiAlertCircle className="h-3 w-3" aria-hidden="true" />{t('sellingOutFast')}</span>}
      </div>

      <div ref={ctaRef} className="mt-5 flex flex-wrap items-center gap-3">
        <div className="gx-field">
          <button type="button" aria-label={t('decreaseQuantity')} onClick={() => onQty(qty - 1)} disabled={qty <= 1 || unavailable} className="gx-step"><FiMinus className="h-4 w-4" /></button>
          <span className="min-w-[2.5rem] px-1 text-center text-sm font-bold tabular-nums" aria-live="polite" dir="ltr">{qty}</span>
          <button type="button" aria-label={t('increaseQuantity')} onClick={() => onQty(qty + 1)} disabled={qty >= maxQty || unavailable} className="gx-step"><FiPlus className="h-4 w-4" /></button>
        </div>
        <AddButton onAdd={onAdd} disabled={unavailable} label={t('addToCart')} addedLabel={t('addedToCart')} className="h-[52px] min-w-0 flex-1 px-6 text-sm" />
        <button type="button" onClick={onSave} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className={`gx-btn h-[52px] w-[52px] flex-shrink-0 ${isSaved ? 'gx-btn-on' : 'gx-btn-ghost'}`}>
          <FiHeart className={`h-5 w-5 ${isSaved ? 'gx-pop' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {qty > 1 && !unavailable && (
        <p className="gx-fade mt-3 flex items-center justify-between gap-3 px-1 text-sm">
          <span className="gx-muted font-medium">{t('totalPrice')}</span>
          <span className="font-bold tabular-nums" dir="ltr">{fmtPrice(round2(product.finalPrice * qty), currency)}</span>
        </p>
      )}

      {product.shopName && (
        <div className="gx-tile mt-5 !rounded-2xl !p-3">
          <span className="gx-tile-ic !h-11 !w-11"><RiStoreLine className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="gx-muted text-xs font-medium">{t('soldBy')}</p>
            {product.shopId
              ? (
                <Link to={`/shops/${encodeURIComponent(product.shopId)}`} className="gx-crumb flex items-center gap-1 text-sm font-semibold">
                  <span className="truncate">{product.shopName}</span>
                  <FiChevronRight className="h-3.5 w-3.5 flex-none rtl:rotate-180" aria-hidden="true" />
                </Link>
              )
              : <p className="truncate text-sm font-semibold">{product.shopName}</p>}
          </div>
        </div>
      )}

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {TRUST_ITEMS.map(([Icon, key]) => <IconTile key={key} icon={Icon}>{t(key)}</IconTile>)}
      </ul>
    </aside>
  );
});

const DeviceDetailContent = memo(({ id, addToCart, darkMode }) => {
  const navigate = useNavigate();
  const language = useAppLanguage();
  const isRTL = languageDirection(language) === 'rtl';
  const t = getT(language);
  useScrollTopOnEnter();
  useNavOffset();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [buyEl, setBuyEl] = useState(null);
  const [showBar, setShowBar] = useState(false);
  const [saved, toggleSaved] = useSavedProducts();
  const [relatedRef, relatedNear] = useInView('600px');

  const { data: product, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => fetchProduct(id, signal),
    placeholderData: () => {
      const hit = queryClient.getQueryData(ALL_KEY)?.find((p) => String(p.id) === id);
      return hit ? normalizeProduct(hit) : undefined;
    },
    staleTime: PRODUCT_STALE,
  });

  const idle = useIdleFlag(!!product && !isPlaceholderData);
  const cid = product?.categoryId ?? null;

  const catQ = useQuery({
    queryKey: cid != null ? catKey(cid) : ['detailCategory', 'none'],
    queryFn: ({ signal }) => fetchCategoryProducts(cid, signal),
    select: toNormalized,
    enabled: idle && cid != null,
    staleTime: PRODUCT_STALE,
    structuralSharing: false,
  });
  const allQ = useQuery({
    queryKey: ALL_KEY,
    queryFn: fetchAllProducts,
    select: toNormalized,
    enabled: idle && (relatedNear || cid == null),
    staleTime: PRODUCT_STALE,
    structuralSharing: false,
  });
  const catList = catQ.data || EMPTY_LIST;
  const allList = allQ.data || EMPTY_LIST;
  const catPending = cid != null && catQ.isPending;

  useEffect(() => { if (product?.name) document.title = `${product.name} | ${t('siteName')}`; }, [product?.name, t]);
  useEffect(() => { if (isError) toast({ icon: 'error', title: t('errorTitle'), text: t('productNotFound'), timer: 3500 }); }, [isError, t]);

  useEffect(() => {
    if (!buyEl || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(buyEl);
    return () => io.disconnect();
  }, [buyEl]);

  const productId = product?.id;
  useEffect(() => {
    if (!productId || typeof IntersectionObserver === 'undefined') return undefined;
    const els = TAB_IDS.map((tid) => document.getElementById(tid)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActiveTab(e.target.id);
    }, { rootMargin: '-30% 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [productId]);

  const selectTab = useCallback((tid) => {
    setActiveTab(tid);
    document.getElementById(tid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const specs = useMemo(() => parseSpecs(product?.specifications || EMPTY_LIST), [product?.specifications]);

  const sameCategory = useMemo(() => {
    if (!productId || !catList.length) return EMPTY_LIST;
    const out = [];
    for (const p of catList) if (p.id !== productId) out.push(p);
    return out.slice(-RELATED_LIMIT);
  }, [catList, productId]);

  const moreGroup = useMemo(() => {
    if (!product || !allList.length) return { title: '', products: EMPTY_LIST };
    const key = product.categoryId != null ? String(product.categoryId) : '';
    const rest = [];
    for (const p of allList) {
      if (p.id === product.id) continue;
      if (!key || String(p.categoryId ?? '') !== key) rest.push(p);
    }
    const byShop = product.shopId ? rest.filter((p) => p.shopId === product.shopId) : EMPTY_LIST;
    const moreRaw = byShop.length ? byShop : rest.filter((p) => p.condition === product.condition);
    return {
      title: byShop.length
        ? t('moreFromShop', { name: product.shopName || t('breadcrumbShop') })
        : t('otherDevices', { condition: condLabel(t, product.condition).toLowerCase() }),
      products: moreRaw.slice(-RELATED_LIMIT),
    };
  }, [allList, product, t]);

  const postToCart = useCallback((p, qty) => api.post('/api/cart/items', { productId: p.id, quantity: qty }), []);

  const ensureLogin = useCallback(async () => {
    if (readStorage('authToken')) return true;
    const Swal = await loadSwal();
    const r = await Swal.fire({
      title: t('loginRequiredTitle'), text: t('loginRequiredText'), icon: 'info',
      showCancelButton: true, confirmButtonText: t('goToLogin'), cancelButtonText: t('cancel'),
    });
    if (r.isConfirmed) navigate('/login');
    return false;
  }, [navigate, t]);

  const successToast = useCallback((name) => {
    window.dispatchEvent(new Event('cart:updated'));
    toast({ icon: 'success', title: t('addedToCart'), text: t('addedToCartText', { name: clean(name, 60) }), timer: 2500 });
  }, [t]);
  const failToast = useCallback((err) => toast({ icon: 'error', title: t('errorTitle'), text: clean(err?.response?.data?.message, 120) || t('addFailed'), timer: 3000 }), [t]);

  const unavailable = !product || product.deleted || product.stock <= 0;
  const maxQty = Math.max(1, product?.stock || 1);
  const qty = clamp(quantity, 1, maxQty);

  const handleAddToCart = useCallback(async () => {
    if (!product || unavailable) return false;
    if (!(await ensureLogin())) return false;
    try {
      await postToCart(product, qty);
      addToCart?.({ ...product, price: product.finalPrice, quantity: qty });
      successToast(product.name);
      return true;
    } catch (err) {
      failToast(err);
      return false;
    }
  }, [product, unavailable, ensureLogin, postToCart, qty, addToCart, successToast, failToast]);

  const handleRelatedAdd = useCallback(async (p) => {
    if (!(await ensureLogin())) return false;
    try { await postToCart(p, 1); successToast(p.name); return true; } catch (err) { failToast(err); return false; }
  }, [ensureLogin, postToCart, successToast, failToast]);

  const setQty = useCallback((n) => setQuantity(clamp(n, 1, maxQty)), [maxQty]);
  const openProduct = useCallback((pid) => navigate(`/device/${encodeURIComponent(pid)}`), [navigate]);
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const saveCurrent = useCallback(() => { if (product) toggleSaved(product.rawId); }, [product, toggleSaved]);

  if (isLoading) {
    return (
      <Shell language={language} darkMode={darkMode}>
        <PageSkeleton />
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell language={language} darkMode={darkMode} className="flex items-center justify-center px-4">
        <div className="gx-card gx-in w-full max-w-sm space-y-4 p-8 text-center">
          <IsoIllustration type="shopEmpty" darkMode={darkMode} onGreen={false} className="mx-auto h-32 w-32" />
          <h2 className="text-xl font-bold">{t('productNotFound')}</h2>
          <button type="button" onClick={goBack} className="gx-btn gx-btn-a mx-auto h-11 px-6 text-sm"><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('goBack')}</button>
        </div>
      </Shell>
    );
  }

  const currency = t('currency');
  const cond = condOf(product.condition);
  const detailLoading = isPlaceholderData;
  const listed = fmtDate(product.createdAt, language);
  const isSaved = saved.has(product.rawId);
  const discounted = product.saving > 0;
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK;
  const stockStatus = unavailable
    ? { label: t('outOfStock'), cls: 'gx-chip-r' }
    : product.stock > 10
      ? { label: t('inStock'), cls: 'gx-chip-g' }
      : { label: t('onlyLeft', { count: product.stock }), cls: 'gx-chip-w' };
  const relatedEmpty = relatedNear && idle && !catPending && !allQ.isPending && !sameCategory.length && !moreGroup.products.length;

  const infoRows = [
    [t('infoCondition'), condLabel(t, product.condition)],
    [t('infoCategory'), product.categoryName || t('uncategorized')],
    [t('infoAvailability'), product.stock > 0 ? t('stockCount', { count: product.stock }) : t('outOfStock')],
    product.shopName && [t('infoShop'), product.shopName],
    listed && [t('infoListed'), listed],
    ...specs.pairs.slice(0, INFO_PAIRS_LIMIT),
  ].filter(Boolean);

  const miniBar = showBar ? (
    <div className="gx-fade ms-auto hidden min-w-0 items-center gap-3 py-2 lg:flex">
      <span className="gx-frame relative block h-10 w-10 flex-none overflow-hidden rounded-2xl">
        <DeviceImage src={product.imageUrl} alt="" category={product.categoryName} label={product.name} darkMode={darkMode} className="h-full w-full rounded-2xl object-contain p-1" />
      </span>
      <p className="max-w-[18rem] truncate text-sm font-medium">{product.name}</p>
      <PriceLine product={product} currency={currency} t={t} />
      <AddButton onAdd={handleAddToCart} disabled={unavailable} label={t('addToCart')} addedLabel={t('addedToCart')} className="h-10 flex-none px-5 text-sm" />
    </div>
  ) : null;

  return (
    <Shell language={language} darkMode={darkMode}>
      <section aria-label={product.name}>
        <div className="mx-auto max-w-7xl px-4 pb-12 mt-10 pt-28 sm:px-6 lg:px-8">
          <div className="gx-rise" style={rise(0)}>
            <Breadcrumb categoryId={product.categoryId} categoryName={product.categoryName} productName={product.name} t={t} />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div className="gx-stick min-w-0 lg:col-span-5">
              <div className="gx-rise" style={rise(60)}>
                <Gallery key={product.id} product={product} cond={cond} darkMode={darkMode} isSaved={isSaved} onSave={saveCurrent} isRTL={isRTL} t={t} />
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <div className="gx-rise" style={rise(110)}>
                <div className="flex flex-wrap items-center gap-2.5">
                  {discounted && <span className="gx-chip gx-chip-a font-bold">{t('dealBadge')}</span>}
                  {product.shopName && product.shopId && (
                    <Link to={`/shops/${encodeURIComponent(product.shopId)}`} className="gx-crumb inline-flex max-w-full items-center gap-1.5 text-sm font-semibold">
                      <RiStoreLine className="gx-ic h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="truncate">{product.shopName}</span>
                    </Link>
                  )}
                </div>

                <h1 className="mt-3 break-words text-2xl font-bold leading-snug tracking-tight sm:text-3xl lg:text-[2rem]">{product.name}</h1>

                <div className="mt-3"><RatingPill product={product} t={t} /></div>

                {detailLoading
                  ? <div className="mt-3 space-y-2" aria-hidden="true"><Sk className="h-3.5 w-full" /><Sk className="h-3.5 w-4/5" /></div>
                  : product.description && <p className="gx-muted mt-3 line-clamp-3 break-words text-sm leading-relaxed">{product.description}</p>}
              </div>

              <div className="gx-rise mt-5" style={rise(180)}>
                <BuyBox
                  product={product} currency={currency} cond={cond} stockStatus={stockStatus} unavailable={unavailable} lowStock={lowStock}
                  qty={qty} maxQty={maxQty} onQty={setQty} onAdd={handleAddToCart} isSaved={isSaved} onSave={saveCurrent} ctaRef={setBuyEl} t={t}
                />
              </div>

              {product.deleted && (
                <p className="gx-chip gx-chip-r gx-in mt-4 !px-4 !py-2"><FiAlertCircle className="h-4 w-4 flex-shrink-0" /> {t('unavailable')}</p>
              )}

              {product.categoryId != null && product.categoryName && (
                <Link to={categoryPath(product.categoryId)} style={rise(240)} className="gx-card gx-btn-ghost gx-btn gx-rise mt-5 !flex !w-full !justify-between !rounded-full px-5 py-3 text-sm font-medium">
                  <span className="flex min-w-0 items-center gap-2"><FiTag className="gx-ic h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="truncate">{t('exploreMore', { name: product.categoryName })}</span></span>
                  <FiChevronRight className="h-4 w-4 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
                </Link>
              )}

              <section aria-label={t('deliveryDetails')} style={rise(290)} className="gx-card gx-rise mt-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2.5 text-base font-semibold">
                    <span className="gx-bar !h-4 !w-1 flex-none" aria-hidden="true" />
                    {t('deliveryDetails')}
                  </h3>
                  {!unavailable && <ExpressTag t={t} />}
                </div>
                <ul className="mt-4 grid gap-2.5">
                  <IconTile icon={FiTruck} tone={unavailable ? 'gx-sale font-semibold' : ''}>{unavailable ? t('outOfStock') : t('deliveryNote')}</IconTile>
                  <IconTile icon={FiHome}>{t('homeDeliveryText')}</IconTile>
                  <IconTile icon={FiDollarSign}>{t('paymentOptions')}: {t('cashOnDelivery')}</IconTile>
                </ul>
              </section>

              <section aria-label={t('productInfo')} style={rise(340)} className="gx-rise mt-6">
                <BlockTitle>{t('productInfo')}</BlockTitle>
                <InfoTable rows={infoRows} />
              </section>
            </div>
          </div>
        </div>
      </section>

      <TabBar active={activeTab} onSelect={selectTab} trailing={miniBar} t={t} />

      <div className="gx-defer">
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <section id="overview" aria-label={t('tabDescription')} className="gx-anchor">
            <SectionTitle>{t('tabDescription')}</SectionTitle>
            <div className="gx-card p-5 sm:p-8">
              {detailLoading
                ? <div className="space-y-3" aria-hidden="true"><Sk className="h-4 w-full" /><Sk className="h-4 w-full" /><Sk className="h-4 w-3/4" /></div>
                : product.description
                  ? <p className="whitespace-pre-line break-words text-sm leading-relaxed sm:text-[15px] sm:leading-7">{product.description}</p>
                  : <EmptyState kind="description" title={t('noDescription')} />}
              {specs.highlights.length > 0 && (
                <>
                  <h3 className="mb-3 mt-8 flex items-center gap-2.5 text-base font-semibold">
                    <span className="gx-bar !h-4 !w-1 flex-none" aria-hidden="true" />
                    {t('highlights')}
                  </h3>
                  <ul className="grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
                    {specs.highlights.map((h, i) => (
                      <li key={i} className="gx-tile !items-start">
                        <span className="gx-box gx-box-on mt-0.5 !rounded-full"><FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} /></span>
                        <span className="min-w-0 break-words font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          <section id="specs" aria-label={t('techSpecs')} className="gx-anchor">
            <SectionTitle>{t('techSpecs')}</SectionTitle>
            {detailLoading
              ? <div className="gx-card space-y-2 p-4" aria-hidden="true">{INFO_SK.map((i) => <Sk key={i} className="h-11" />)}</div>
              : specs.pairs.length > 0
                ? <SpecTable pairs={specs.pairs} t={t} />
                : <div className="gx-card"><EmptyState kind="specs" title={t('noSpecs')} text={t('noSpecsText')} /></div>}
          </section>
        </div>
      </div>

      <section ref={relatedRef} aria-label={t('similarProducts')} className="gx-panel gx-line rounded-t-[2.5rem] border-t" style={relatedNear ? undefined : { minHeight: 480 }}>
        {relatedNear && (
          <div className="gx-fade mx-auto max-w-7xl space-y-12 px-4 py-12 pb-28 sm:px-6 sm:py-14 lg:px-8 lg:pb-16">
            {catPending ? <SliderSkeleton /> : (
              <ProductSlider title={t('similarProducts')} products={sameCategory} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
            )}
            {allQ.isPending ? <SliderSkeleton /> : (
              <ProductSlider title={moreGroup.title} products={moreGroup.products} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
            )}
            {relatedEmpty && <EmptyState kind="related" title={t('noRelated')} text={t('noRelatedText')} />}
          </div>
        )}
      </section>

      {showBar && <StickyBuyBar product={product} currency={currency} qty={qty} disabled={unavailable} onAdd={handleAddToCart} darkMode={darkMode} t={t} />}
    </Shell>
  );
});

function DeviceDetailRoute(props) {
  const { id } = useParams();
  return <DeviceDetailContent key={id} id={id} {...props} />;
}
export { queryClient };
export default function DeviceDetail(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceDetailRoute {...props} />
    </QueryClientProvider>
  );
}