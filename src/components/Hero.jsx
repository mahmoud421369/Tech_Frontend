import React, { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const HERO_TRANSLATIONS = { en: enTranslations.hero, ar: arTranslations.hero, fr: frTranslations.hero };
const getHeroTranslation = (language, variant) =>
  HERO_TRANSLATIONS[language]?.variants?.[variant] || HERO_TRANSLATIONS.en.variants.home;

const HERO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap');
  .font-poppins, .font-poppins * { font-family: 'Poppins', sans-serif; }
  .font-cairo, .font-cairo * { font-family: 'Cairo', sans-serif; }
  @keyframes heroTilt3d {
    0%, 100% { transform: rotateX(7deg) rotateY(-12deg) translateY(0); }
    50%      { transform: rotateX(3deg) rotateY(-5deg) translateY(-12px); }
  }
  @keyframes heroChipFloat {
    0%, 100% { transform: translateZ(var(--tz, 70px)) translateY(0); }
    50%      { transform: translateZ(var(--tz, 70px)) translateY(-9px); }
  }
  @keyframes heroRingSpin { from { transform: translateZ(-30px) rotate(0deg); } to { transform: translateZ(-30px) rotate(360deg); } }
  @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--fy, -10px)); } }
  @keyframes dashMarch { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -28; } }
  @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes moveAlongPath { from { offset-distance: 0%; } to { offset-distance: 100%; } }
  @keyframes pingPulse { 0% { transform: scale(1); opacity: 1; } 70%, 100% { transform: scale(1.6); opacity: 0; } }
  @keyframes gentleWobble { 0%, 100% { transform: rotate(calc(var(--a, 4) * -1deg)); } 50% { transform: rotate(calc(var(--a, 4) * 1deg)); } }
  @keyframes sparkleTwinkle { 0%, 100% { opacity: 0.25; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  @keyframes cellEnter { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(var(--ty, 16px)); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleFadeIn { from { opacity: 0; transform: scale(var(--s-from, 0.94)); } to { opacity: 1; transform: scale(1); } }

  .hero-tilt-3d    { animation: heroTilt3d 7s ease-in-out infinite; will-change: transform; }
  .hero-chip-float { animation: heroChipFloat 4.4s ease-in-out infinite; }
  .hero-ring-spin  { animation: heroRingSpin 30s linear infinite; }
  .hero-3d-hover   { transition: transform 0.3s ${EASE}; }
  .hero-3d-hover:hover { transform: scale(1.04); }
  .float-y        { animation: floatY var(--fdur, 5s) ease-in-out infinite; }
  .dash-march     { stroke-dasharray: 6 8; animation: dashMarch 3s linear infinite; }
  .pop-in         { animation: popIn 0.8s ${EASE} both; }
  .move-along-path { animation: moveAlongPath 4s linear infinite; }
  .ping-pulse     { animation: pingPulse 2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
  .gentle-wobble  { animation: gentleWobble var(--fdur, 5s) ease-in-out infinite; }
  .sparkle-twinkle { animation: sparkleTwinkle 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .cell-enter     { animation: cellEnter 0.5s ${EASE} both; transform-box: fill-box; transform-origin: center; }
  .fade-in-up     { animation: fadeInUp var(--fdur, 0.4s) ${EASE} both; }
  .scale-fade-in  { animation: scaleFadeIn var(--fdur, 0.5s) ${EASE} both; }

  @media (prefers-reduced-motion: reduce) {
    .hero-tilt-3d, .hero-chip-float, .hero-ring-spin, .hero-3d-hover, .float-y, .dash-march, .pop-in,
    .move-along-path, .ping-pulse, .gentle-wobble, .sparkle-twinkle, .cell-enter, .fade-in-up, .scale-fade-in {
      animation-duration: 0.001s !important;
      transition-duration: 0.001s !important;
    }
  }
`;

let heroStylesInjected = false;
const injectHeroStylesOnce = () => {
  if (heroStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-hero-styles', 'true');
  tag.textContent = HERO_STYLES;
  document.head.appendChild(tag);
  heroStylesInjected = true;
};

const WaveBottom = memo(({ darkMode }) => (
  <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block h-16 w-full md:h-24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? '#030a06' : '#f9fafb'} />
    </svg>
  </div>
));

/* ───────────── Emerald 3D illustration kit ───────────── */
const HeroDefs = memo(({ darkMode }) => {
  const grads = [
    ['frame', '#0F766E', '#022C22'],
    ['side', '#064E3B', '#011A14'],
    ['screen', '#A7F3D0', '#059669'],
    ['em', '#6EE7B7', '#047857'],
    ['face', darkMode ? '#14532D' : '#FFFFFF', darkMode ? '#052E16' : '#BBF7D0'],
    ['plat', darkMode ? '#064E3B' : '#D1FAE5', darkMode ? '#022C22' : '#6EE7B7'],
  ];
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        {grads.map(([id, a, b]) => (
          <linearGradient key={id} id={`hx-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
});

const Platform = () => (
  <g aria-hidden="true">
    <ellipse cx="210" cy="356" rx="165" ry="38" fill="url(#hx-plat)" />
    <ellipse cx="210" cy="350" rx="120" ry="25" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="2" />
    <ellipse cx="210" cy="346" rx="70" ry="13" fill="#10b981" fillOpacity="0.18" />
  </g>
);

const Slab = ({ x, y, w, h, r = 18, d = 12, face = 'url(#hx-face)' }) => (
  <g>
    <rect x={x + d * 0.5} y={y + d} width={w} height={h} rx={r} fill="url(#hx-side)" />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={face} stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
    <path d={`M${x + r} ${y + 3}H${x + w - r}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
  </g>
);

const Phone = ({ x, y, w = 110, h = 210 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="12" y="14" width={w} height={h} rx="24" fill="url(#hx-side)" />
    <rect width={w} height={h} rx="24" fill="url(#hx-frame)" />
    <rect x="7" y="7" width={w - 14} height={h - 14} rx="18" fill="url(#hx-screen)" />
    <path d={`M7 ${h * 0.55}V25A18 18 0 0 1 25 7H${w * 0.7}z`} fill="#fff" fillOpacity="0.22" />
    <rect x={w / 2 - 16} y="12" width="32" height="8" rx="4" fill="#022C22" />
    <rect x="20" y="34" width={w - 40} height="12" rx="6" fill="#fff" fillOpacity="0.9" />
    <rect x="20" y="54" width={(w - 40) * 0.6} height="8" rx="4" fill="#fff" fillOpacity="0.55" />
    <rect x="20" y={h - 78} width={w - 40} height="50" rx="12" fill="#fff" fillOpacity="0.22" />
    <circle cx={w / 2} cy={h - 53} r="12" fill="#fff" fillOpacity="0.92" />
    <path d={`M${w / 2 - 5} ${h - 53}l4 4 7-8`} stroke="#059669" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Laptop = ({ x, y, w = 240 }) => {
  const h = w * 0.62;
  const cw = (w - 44) / 3;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="8" y="10" width={w} height={h} rx="14" fill="url(#hx-side)" />
      <rect width={w} height={h} rx="14" fill="url(#hx-frame)" />
      <rect x="8" y="8" width={w - 16} height={h - 16} rx="8" fill="url(#hx-screen)" />
      <path d={`M8 ${h * 0.6}V16a8 8 0 0 1 8-8H${w * 0.6}z`} fill="#fff" fillOpacity="0.2" />
      <rect x="22" y="22" width={w * 0.4} height="10" rx="5" fill="#fff" fillOpacity="0.9" />
      <rect x="22" y="40" width={w * 0.28} height="8" rx="4" fill="#fff" fillOpacity="0.55" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={22 + i * (cw + 4)} y={h - 62} width={cw} height="40" rx="8" fill="#fff" fillOpacity="0.24" />
      ))}
      <rect x="-16" y={h + 8} width={w + 32} height="20" rx="10" fill="url(#hx-side)" />
      <rect x="-16" y={h + 2} width={w + 32} height="20" rx="10" fill="url(#hx-face)" stroke="#fff" strokeOpacity="0.5" />
      <rect x={w / 2 - 26} y={h + 2} width="52" height="6" rx="3" fill="#6EE7B7" />
    </g>
  );
};

const ICONS = {
  check: <path d="M-9 0l6 6 12-12" />,
  pin: <><path d="M0 11C-9 0-9-10 0-10s9 10 0 21z" /><circle r="3" /></>,
  gear: <><circle r="6" /><path d="M0-13v4M0 9v4M-13 0h4M9 0h4M-9-9l3 3M6 6l3 3M9-9l-3 3M-6 6l-3 3" /></>,
  tag: <><path d="M-10-10h10l11 11-10 10-11-11z" /><circle cx="-5" cy="-5" r="2" /></>,
  tool: <><circle cx="6" cy="-6" r="6" /><path d="M2-2L-10 10" /></>,
  percent: <><circle cx="-6" cy="-6" r="3" /><circle cx="6" cy="6" r="3" /><path d="M8-9L-8 9" /></>,
  store: <path d="M-11-2V10H11V-2M-12-2l3-9H9l3 9z" />,
  user: <><circle cy="-4" r="5" /><path d="M-10 11a10 10 0 0120 0" /></>,
  box: <path d="M0-11l10 5v10L0 10-10 4V-6zM-10-6L0 0l10-6M0 0v10" />,
  phone: <><rect x="-6" y="-11" width="12" height="22" rx="3" /><path d="M-2 7h4" /></>,
  laptop: <><rect x="-10" y="-8" width="20" height="13" rx="2" /><path d="M-13 9h26" /></>,
  watch: <><rect x="-7" y="-8" width="14" height="16" rx="5" /><path d="M-4-12h8M-4 12h8" /></>,
};

// const Orb = ({ cx, cy, r = 26, icon, anim = 'float-y', delay = 0, fy = '-8px' }) => (
//   <g className={anim} style={{ '--fdur': '4s', '--fy': fy, '--a': 6, animationDelay: `${delay}s`, transformBox: 'fill-box', transformOrigin: 'center' }}>
//     <circle cx={cx} cy={cy + 5} r={r} fill="url(#hx-side)" />
//     <circle cx={cx} cy={cy} r={r} fill="url(#hx-face)" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
//     <ellipse cx={cx - r * 0.3} cy={cy - r * 0.5} rx={r * 0.4} ry={r * 0.18} fill="#fff" fillOpacity="0.8" />
//     <g transform={`translate(${cx} ${cy}) scale(${r / 26})`} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//       {ICONS[icon]}
//     </g>
//   </g>
// );

const Cube = ({ cx, cy, s = 70 }) => {
  const dx = s * 0.87, dy = s * 0.5;
  return (
    <g>
      <path d={`M${cx} ${cy - s}L${cx + dx} ${cy - dy}L${cx} ${cy}L${cx - dx} ${cy - dy}Z`} fill="url(#hx-face)" stroke="#fff" strokeOpacity="0.6" />
      <path d={`M${cx - dx} ${cy - dy}L${cx} ${cy}V${cy + s}L${cx - dx} ${cy + dy}Z`} fill="url(#hx-em)" />
      <path d={`M${cx + dx} ${cy - dy}L${cx} ${cy}V${cy + s}L${cx + dx} ${cy + dy}Z`} fill="url(#hx-frame)" />
      <path d={`M${cx - dx / 2} ${cy - s * 0.75}L${cx + dx / 2} ${cy - s * 0.25}`} stroke="#6EE7B7" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
};

const Sparkle = ({ x, y, s, d }) => (
  <path className="sparkle-twinkle" style={{ animationDelay: `${d}s` }} fill="#10b981"
    d={`M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3}L${x + s} ${y}L${x + s * 0.3} ${y + s * 0.3}L${x} ${y + s}L${x - s * 0.3} ${y + s * 0.3}L${x - s} ${y}L${x - s * 0.3} ${y - s * 0.3}Z`} />
);

const Float = ({ children, dur = 5, fy = '-10px', delay = 0 }) => (
  <g className="float-y" style={{ '--fdur': `${dur}s`, '--fy': fy, animationDelay: `${delay}s` }}>{children}</g>
);

const SVG = ({ children }) => <svg viewBox="0 0 420 420" className="h-full w-full" aria-hidden="true">{children}</svg>;

const HomeIllustration = memo(() => (
  <SVG>
    <Platform />
    <Float dur={6} fy="-8px"><Laptop x={40} y={190} w={220} /></Float>
    <Float dur={5} fy="-14px" delay={0.4}><Phone x={250} y={110} w={100} h={190} /></Float>
 
    <Sparkle x={340} y={70} s={10} d={0.3} />
  </SVG>
));

const DevicesIllustration = memo(() => (
  <SVG>
    <Platform />
    <Float dur={6} fy="-8px"><Laptop x={50} y={140} w={250} /></Float>
    <Float dur={5} fy="-12px" delay={0.4}><Phone x={278} y={170} w={84} h={160} /></Float>
 
    <Sparkle x={200} y={70} s={9} d={0.8} />
  </SVG>
));

const TRACK_PATH = 'M60,320 C120,320 110,180 190,150 C260,124 260,80 340,80';
const TrackIllustration = memo(() => (
  <SVG>
    <Platform />
    <path className="dash-march" d={TRACK_PATH} fill="none" stroke="#10b981" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    <circle className="move-along-path" r="9" fill="#059669" style={{ offsetPath: `path('${TRACK_PATH}')`, WebkitOffsetPath: `path('${TRACK_PATH}')` }} />

    <circle className="ping-pulse" cx="340" cy="80" r="30" fill="none" stroke="#10b981" strokeWidth="3" />
  
    <Float dur={3.5} fy="-10px"><Cube cx={215} cy={230} s={64} /></Float>
  </SVG>
));

const AccountIllustration = memo(() => (
  <SVG>
    <Platform />
    <Float dur={5} fy="-8px">
      <Slab x={100} y={95} w={220} h={220} r={30} />
      <circle cx="210" cy="170" r="38" fill="url(#hx-screen)" />
      <g transform="translate(210 170) scale(1.4)" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">{ICONS.user}</g>
      <rect x="140" y="230" width="140" height="12" rx="6" fill="#10b981" fillOpacity="0.35" />
      <rect x="160" y="256" width="100" height="10" rx="5" fill="#10b981" fillOpacity="0.2" />
      <rect x="150" y="280" width="120" height="14" rx="7" fill="url(#hx-em)" />
    </Float>
   
  </SVG>
));

const RepairIllustration = memo(() => (
  <SVG>
    <Platform />
    <Float dur={5} fy="-10px"><Phone x={155} y={85} w={110} h={220} /></Float>
    <g className="float-y" style={{ '--fdur': '5s', '--fy': '-10px' }}>
      <circle cx="210" cy="200" r="30" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="6" />
      <circle className="dash-march" cx="210" cy="200" r="30" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </g>

    <Sparkle x={330} y={110} s={10} d={0.4} />
  </SVG>
));

const OffersIllustration = memo(() => (
  <SVG>
    <Platform />
    <g className="gentle-wobble" style={{ '--fdur': '5s', '--a': 4, transformBox: 'fill-box', transformOrigin: 'center' }}>
      <Slab x={110} y={105} w={200} h={190} r={40} />
      <circle cx="210" cy="200" r="62" fill="url(#hx-screen)" />
      <circle cx="210" cy="200" r="62" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeDasharray="4 8" />
      <text x="210" y="226" textAnchor="middle" fontSize="72" fontWeight="800" fill="#fff">%</text>
      <circle cx="140" cy="135" r="9" fill="#022C22" fillOpacity="0.75" />
    </g>
    {[[85, 90, 10, 0], [335, 120, 14, 0.4], [345, 280, 8, 0.8], [95, 300, 12, 1.2]].map(([x, y, s, d], i) => <Sparkle key={i} x={x} y={y} s={s} d={d} />)}
  </SVG>
));

const ShopIllustration = memo(() => (
  <SVG>
    <Platform />
    <Slab x={105} y={185} w={200} h={140} r={14} />
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${95 + i * 44} 150H${139 + i * 44}l${i === 4 ? 0 : 0} 38H${95 + i * 44}z`} fill={i % 2 ? 'url(#hx-face)' : 'url(#hx-em)'} stroke="#fff" strokeOpacity="0.5" />
      ))}
      <rect x="95" y="186" width="220" height="8" rx="4" fill="url(#hx-side)" />
    </g>
    <rect x="185" y="238" width="52" height="87" rx="6" fill="url(#hx-screen)" stroke="#fff" strokeOpacity="0.6" />
    <rect x="125" y="226" width="42" height="42" rx="8" fill="url(#hx-screen)" stroke="#fff" strokeOpacity="0.6" />
    <rect x="252" y="226" width="42" height="42" rx="8" fill="url(#hx-screen)" stroke="#fff" strokeOpacity="0.6" />
    <g className="gentle-wobble" style={{ '--fdur': '3s', '--a': 5, transformBox: 'fill-box', transformOrigin: 'center top' }}>
      <Slab x={170} y={78} w={80} h={42} r={12} d={8} />
      <text x="210" y="105" textAnchor="middle" fontSize="15" fontWeight="800" fill="#047857">OPEN</text>
    </g>
  </SVG>
));

const CategoryIllustration = memo(() => {
  const tiles = [[85, 85, 'phone'], [215, 85, 'laptop'], [85, 215, 'watch'], [215, 215, 'box']];
  return (
    <SVG>
      <Platform />
      {tiles.map(([x, y, icon], i) => (
        <g key={icon} className="cell-enter" style={{ animationDelay: `${i * 0.08}s` }}>
          <Slab x={x} y={y} w={115} h={115} r={26} face={i === 1 ? 'url(#hx-screen)' : 'url(#hx-face)'} />
          <g transform={`translate(${x + 57} ${y + 57}) scale(1.7)`} fill="none" stroke={i === 1 ? '#fff' : '#059669'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</g>
        </g>
      ))}
      <Sparkle x={350} y={80} s={10} d={0.2} />
    </SVG>
  );
});

const VARIANT_ILLUSTRATIONS = {
  home: HomeIllustration, devices: DevicesIllustration, track: TrackIllustration, account: AccountIllustration,
  repair: RepairIllustration, offers: OffersIllustration, shop: ShopIllustration, category: CategoryIllustration,
};
const VARIANT_CHIP = {
  home: { label: 'Verified shops', delay: 0 }, devices: { label: 'Warrantied', delay: 0.2 }, track: { label: 'Live tracking', delay: 0.1 },
  account: { label: 'Your data, secure', delay: 0.15 }, repair: { label: 'Fast turnaround', delay: 0.05 }, offers: { label: 'Best price', delay: 0.25 },
  shop: { label: 'Official', delay: 0.1 }, category: { label: 'Curated picks', delay: 0.2 },
};

const Illustration3DStage = memo(({ variant, darkMode, chipLabel }) => {
  const Comp = VARIANT_ILLUSTRATIONS[variant] ?? VARIANT_ILLUSTRATIONS.home;
  const chip = VARIANT_CHIP[variant] ?? VARIANT_CHIP.home;
  return (
    <div className="relative aspect-square w-64 sm:w-80 lg:w-[26rem]" style={{ perspective: '1500px' }}>
      <HeroDefs darkMode={darkMode} />
      <div className="hero-3d-hover relative h-full w-full">
        <div className="hero-tilt-3d relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          <div className={`absolute inset-[6%] rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/50'}`} style={{ transform: 'translateZ(-90px)' }} />
          <div className={`hero-ring-spin absolute inset-[3%] rounded-full border-2 border-dashed ${darkMode ? 'border-emerald-500/30' : 'border-emerald-400/50'}`} style={{ transformStyle: 'preserve-3d' }} />
          <div
            className={`absolute inset-[10%] rounded-[2.5rem] ring-1 backdrop-blur-sm ${darkMode ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/5 ring-emerald-400/20' : 'bg-gradient-to-br from-emerald-200/70 to-white/40 ring-white/70'}`}
            style={{ transform: 'translateZ(-50px)', boxShadow: darkMode ? '0 50px 90px -30px rgba(16,185,129,0.3)' : '0 50px 90px -30px rgba(5,150,105,0.35)' }}
          />
          <div className="absolute inset-0" style={{ transform: 'translateZ(30px)' }}><Comp /></div>
          <div className="hero-chip-float absolute right-[2%] top-[4%]" style={{ '--tz': '90px', transform: 'translateZ(90px)', animationDelay: `${chip.delay}s` }}>
            <div
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur ${darkMode ? 'border-emerald-700 bg-gray-900/80 text-emerald-300' : 'border-emerald-100 bg-white/90 text-emerald-700'}`}
              style={{ boxShadow: darkMode ? '0 4px 0 0 #022c22, 0 20px 35px -14px rgba(0,0,0,0.6)' : '0 4px 0 0 #a7f3d0, 0 20px 35px -14px rgba(6,95,70,0.3)' }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {chipLabel || chip.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ───────────── Defaults ───────────── */
const VARIANT_DEFAULTS = {
  home: {
    badge: 'Trusted by thousands across Egypt', headingLine1: 'Put your', headingAccent: 'devices', headingLine2: 'first',
    description: 'Fast, trusted repairs and premium refurbished devices — find expert technicians and top shops all in one place.',
    buttons: [{ label: 'Book a Repair', to: '/repair', primary: true }, { label: 'Browse Devices', to: '/devices', primary: false }],
  },
  devices: {
    badge: 'Certified devices, ready to ship', headingLine1: 'Find your', headingAccent: 'next device', headingLine2: 'today',
    description: 'Browse new, used, and refurbished phones and laptops from verified shops — every listing checked and warrantied.',
    buttons: [{ label: 'Browse Devices', to: '/devices', primary: true }, { label: 'Compare Shops', to: '/shops', primary: false }],
  },
  track: {
    badge: 'Real-time order tracking', headingLine1: 'Track your', headingAccent: 'orders', headingLine2: 'in real time',
    description: 'Watch every step of your delivery — from warehouse to your doorstep. Stay informed, stay in control.',
    buttons: [{ label: 'View My Orders', to: '/account', primary: true }, { label: 'Explore Shop', to: '/devices', primary: false }],
  },
  account: {
    badge: 'Your personal dashboard', headingLine1: 'Manage your', headingAccent: 'account', headingLine2: 'all in one place',
    description: 'Manage your profile, addresses, orders, and repair requests — all in one place.',
    buttons: [{ label: 'My Orders', to: '/account', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  repair: {
    badge: 'Expert technicians ready now', headingLine1: 'Put Your', headingAccent: 'Device', headingLine2: 'First',
    description: 'Fast, reliable repairs from trusted local shops. Describe your issue and get connected instantly.',
    buttons: [{ label: 'My Orders', to: '/account', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  offers: {
    badge: 'Limited time deals — grab them fast!', headingLine1: 'Exclusive', headingAccent: 'Offers Just', headingLine2: 'For You',
    description: 'Save big on repairs, accessories, and premium services at trusted shops near you.',
    buttons: [{ label: 'Browse shops', to: '/shops', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  shop: {
    badge: 'Official Shop', headingLine1: '', headingAccent: 'Trusted Shop', headingLine2: '',
    description: 'Genuine parts, expert technicians, and fast turnaround you can count on.',
    buttons: [{ label: 'View Products', href: '#shop-products', primary: true }, { label: 'Browse All Shops', to: '/shops', primary: false }],
  },
  category: {
    badge: 'Browsing a category', headingLine1: 'Everything in', headingAccent: 'this category', headingLine2: '',
    description: 'Verified listings, real conditions, and fair prices — filter by price, condition, and more to find the right fit.',
    buttons: [{ label: 'View All Products', to: '/devices', primary: false }],
  },
};

/* 3D push-button styles */
const buttonClass = (primary, darkMode) =>
  `inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-100 active:translate-y-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
    primary
      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_5px_0_0_#047857,0_14px_22px_-8px_rgba(5,150,105,0.55)] hover:from-emerald-300 hover:to-emerald-500 active:shadow-[0_1px_0_0_#047857]'
      : darkMode
      ? 'border border-emerald-900 bg-gray-900 text-emerald-300 shadow-[0_5px_0_0_#022c22] hover:text-emerald-200 active:shadow-[0_1px_0_0_#022c22]'
      : 'border border-emerald-200 bg-white text-emerald-700 shadow-[0_5px_0_0_#a7f3d0] hover:bg-emerald-50 active:shadow-[0_1px_0_0_#a7f3d0]'
  }`;

const Hero = memo(({ variant = 'home', darkMode = false, headingLine1, headingAccent, headingLine2, description, buttons, children }) => {
  useEffect(() => { injectHeroStylesOnce(); }, []);

  const cfg = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.home;
  const language = useAppLanguage();
  const translated = getHeroTranslation(language, variant);
  const translatedChip = HERO_TRANSLATIONS[language]?.chips?.[variant] || HERO_TRANSLATIONS.en.chips.home;

  const resolvedLine1 = headingLine1 ?? translated[1] ?? cfg.headingLine1;
  const resolvedAccent = headingAccent ?? translated[2] ?? cfg.headingAccent;
  const resolvedLine2 = headingLine2 ?? translated[3] ?? cfg.headingLine2;
  const resolvedDesc = description ?? translated[4] ?? cfg.description;
  const resolvedButtons = buttons ?? cfg.buttons.map((button, index) => ({ ...button, label: translated[index === 0 ? 5 : 6] || button.label }));

  return (
    <section
      dir={languageDirection(language)}
      key={language}
      className={`relative flex min-h-screen items-center overflow-hidden transition-all duration-500 ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-[#030a06]' : 'bg-white'}`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="order-1 space-y-7">
            <h1
              className={`fade-in-up text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem] ${darkMode ? 'text-white' : 'text-gray-900'}`}
              style={{ '--ty': '18px', '--fdur': '0.4s', animationDelay: '0.05s' }}
            >
              {resolvedLine1 && <>{resolvedLine1}{' '}</>}
              <span className="relative inline-block">
                <span className={`relative z-10 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{resolvedAccent}</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0,4 Q50,0 100,4 Q150,8 200,4" stroke="#10b981" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              {resolvedLine2 && <>{' '}{resolvedLine2}</>}
            </h1>

            <p className={`fade-in-up max-w-md text-base leading-relaxed sm:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ '--ty': '12px', '--fdur': '0.35s', animationDelay: '0.1s' }}>
              {resolvedDesc}
            </p>

            {children && <div className="fade-in-up" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.14s' }}>{children}</div>}

            {resolvedButtons && resolvedButtons.length > 0 && (
              <div className="fade-in-up flex flex-wrap gap-4 pb-1" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.18s' }}>
                {resolvedButtons.map((btn) => {
                  const className = buttonClass(btn.primary, darkMode);
                  if (btn.onClick) return <button key={btn.label} type="button" onClick={btn.onClick} className={className}>{btn.label}</button>;
                  if (btn.href) return <a key={btn.label} href={btn.href} className={className}>{btn.label}</a>;
                  return <Link key={btn.label} to={btn.to} className={className}>{btn.label}</Link>;
                })}
              </div>
            )}
          </div>

          <div
            className="scale-fade-in relative order-1 flex h-[300px] items-center justify-center sm:h-[420px] lg:order-2 lg:h-[520px]"
            style={{ '--s-from': 0.94, '--fdur': '0.5s', animationDelay: '0.05s' }}
          >
            <Illustration3DStage variant={variant} darkMode={darkMode} chipLabel={translatedChip} />
          </div>
        </div>
      </div>

      <WaveBottom darkMode={darkMode} />
    </section>
  );
});

export default Hero;