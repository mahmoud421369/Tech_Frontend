import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const HERO_STYLES = `
  @keyframes heroTilt3d {
    0%, 100% { transform: rotateX(8deg) rotateY(-14deg) translateY(0px); }
    50%      { transform: rotateX(3deg) rotateY(-6deg) translateY(-14px); }
  }
  @keyframes heroChipFloat {
    0%, 100% { transform: translateZ(var(--tz, 70px)) translateY(0px); }
    50%      { transform: translateZ(var(--tz, 70px)) translateY(-9px); }
  }
  @keyframes heroRingSpin {
    from { transform: translateZ(-30px) rotate(0deg); }
    to   { transform: translateZ(-30px) rotate(360deg); }
  }
  @keyframes pulseScale {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(var(--s-peak, 1.05)); }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(var(--fy, -10px)); }
  }
  @keyframes twinkleFloat {
    0%, 100% { opacity: 0.5; transform: translateY(0); }
    50%      { opacity: 1; transform: translateY(var(--fy, -10px)); }
  }
  @keyframes dashMarch {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -28; }
  }
  @keyframes popIn {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes moveAlongPath {
    from { offset-distance: 0%; }
    to   { offset-distance: 100%; }
  }
  @keyframes pingPulse {
    0%   { transform: scale(1); opacity: 1; }
    70%  { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes spin360 {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes gentleWobble {
    0%, 100% { transform: rotate(calc(var(--a, 4) * -1deg)); }
    50%      { transform: rotate(var(--a, 4)deg); }
  }
  @keyframes toolWobbleA {
    0%, 100% { transform: rotate(-16deg); }
    50%      { transform: rotate(6deg); }
  }
  @keyframes toolWobbleB {
    0%, 100% { transform: rotate(10deg); }
    50%      { transform: rotate(-14deg); }
  }
  @keyframes flicker {
    0%, 100% { opacity: 0.15; }
    50%      { opacity: 0.6; }
  }
  @keyframes sparkleTwinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50%      { opacity: 1; transform: scale(1.2); }
  }
  @keyframes cellEnter {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes cellPulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.12); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(var(--ty, 16px)); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleFadeIn {
    from { opacity: 0; transform: scale(var(--s-from, 0.94)); }
    to   { opacity: 1; transform: scale(1); }
  }

  .hero-tilt-3d   { animation: heroTilt3d 7s ease-in-out infinite; will-change: transform; }
  .hero-chip-float { animation: heroChipFloat 4.4s ease-in-out infinite; }
  .hero-ring-spin { animation: heroRingSpin 14s linear infinite; }
  .hero-3d-hover  { transition: transform 0.3s ${EASE}; }
  .hero-3d-hover:hover { transform: scale(1.04); }

  .pulse-scale   { animation: pulseScale var(--fdur, 6s) ease-in-out infinite; transform-origin: center; }
  .float-y       { animation: floatY var(--fdur, 5s) ease-in-out infinite; transform-origin: center; }
  .twinkle-float { animation: twinkleFloat var(--fdur, 4s) ease-in-out infinite; }
  .dash-march    { stroke-dasharray: 6 8; animation: dashMarch 3s linear infinite; }
  .pop-in        { animation: popIn 0.8s ${EASE} both; }
  .move-along-path { animation: moveAlongPath 4s linear infinite; }
  .ping-pulse    { animation: pingPulse 2s ease-out infinite; transform-origin: center; }
  .spin-360      { animation: spin360 40s linear infinite; }
  .gentle-wobble { animation: gentleWobble var(--fdur, 5s) ease-in-out infinite; }
  .tool-wobble-a { animation: toolWobbleA 2.4s ease-in-out infinite; }
  .tool-wobble-b { animation: toolWobbleB 2.6s ease-in-out infinite; animation-delay: 0.3s; }
  .flicker-line  { animation: flicker 1.4s ease-in-out infinite; }
  .sparkle-twinkle { animation: sparkleTwinkle 2.2s ease-in-out infinite; transform-box: fill-box; }
  .cell-enter    { animation: cellEnter 0.5s ${EASE} both; transform-box: fill-box; transform-origin: center; }
  .cell-pulse    { animation: cellPulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .fade-in-up    { animation: fadeInUp var(--fdur, 0.4s) ${EASE} both; }
  .scale-fade-in { animation: scaleFadeIn var(--fdur, 0.5s) ${EASE} both; }

  @media (prefers-reduced-motion: reduce) {
    .hero-tilt-3d, .hero-chip-float, .hero-ring-spin, .hero-3d-hover, .pulse-scale,
    .float-y, .twinkle-float, .dash-march, .pop-in, .move-along-path, .ping-pulse,
    .spin-360, .gentle-wobble, .tool-wobble-a, .tool-wobble-b, .flicker-line,
    .sparkle-twinkle, .cell-enter, .cell-pulse, .fade-in-up, .scale-fade-in {
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
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-16 md:h-24" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? '#030a06' : '#f9fafb'} />
    </svg>
  </div>
));

const palette = (darkMode) => ({
  line: darkMode ? '#34d399' : '#059669',
  lineSoft: darkMode ? '#6ee7b7' : '#10b981',
  fillSoft: darkMode ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
  fillCard: darkMode ? '#0b1a12' : '#ffffff',
  cardBorder: darkMode ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)',
  ink: darkMode ? '#e5f7ee' : '#0f2b1e',
  mutedInk: darkMode ? '#9fd8bb' : '#4b7c65',
  accent: '#f59e0b',
});

const HomeIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <circle className="pulse-scale" style={{ '--fdur': '6s', '--s-peak': 1.05 }} cx="210" cy="215" r="150" fill={c.fillSoft} />
      <g className="float-y" style={{ '--fdur': '5s', '--fy': '-14px' }}>
        <rect x="140" y="90" width="140" height="240" rx="26" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <rect x="160" y="120" width="100" height="150" rx="8" fill={c.fillSoft} />
        <circle cx="210" cy="298" r="10" fill="none" stroke={c.line} strokeWidth="3" />
      </g>
      {[
        { cx: 90, cy: 140, r: 22, delay: 0 },
        { cx: 330, cy: 120, r: 16, delay: 0.6 },
        { cx: 340, cy: 260, r: 26, delay: 1.1 },
        { cx: 80, cy: 290, r: 18, delay: 0.3 },
      ].map((d, i) => (
        <circle
          key={i}
          className="twinkle-float"
          style={{ '--fdur': '4s', '--fy': '-10px', animationDelay: `${d.delay}s` }}
          cx={d.cx} cy={d.cy} r={d.r}
          fill="none" stroke={c.lineSoft} strokeWidth="3"
        />
      ))}
      <path
        className="dash-march"
        d="M60,340 Q210,380 360,340"
        fill="none" stroke={c.lineSoft} strokeWidth="2"
      />
    </svg>
  );
});

const DevicesIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <rect className="float-y" style={{ '--fdur': '5s', '--fy': '-10px' }} x="70" y="200" width="220" height="140" rx="14" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
      <rect x="90" y="216" width="180" height="94" rx="6" fill={c.fillSoft} />
      <rect x="150" y="340" width="60" height="10" rx="4" fill={c.cardBorder} />
      <g className="float-y" style={{ '--fdur': '4.5s', '--fy': '-12px', animationDelay: '0.4s' }}>
        <rect x="230" y="90" width="110" height="190" rx="20" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <rect x="246" y="116" width="78" height="120" rx="6" fill={c.fillSoft} />
        <circle cx="285" cy="256" r="8" fill="none" stroke={c.line} strokeWidth="2.5" />
      </g>
      <g className="pop-in" style={{ animationDelay: '0.6s' }}>
        <circle cx="120" cy="150" r="26" fill={c.accent} />
        <path d="M108,150 L117,159 L134,140" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
});

const TRACK_PATH = "M60,320 C120,320 110,180 190,150 C260,124 260,80 340,80";

const TrackIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <path d={TRACK_PATH} fill="none" stroke={c.cardBorder} strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />
      <circle
        className="move-along-path"
        r="10" fill={c.line}
        style={{ offsetPath: `path('${TRACK_PATH}')`, WebkitOffsetPath: `path('${TRACK_PATH}')` }}
      />
      <g>
        <circle cx="60" cy="320" r="9" fill={c.fillCard} stroke={c.line} strokeWidth="3" />
        <circle className="ping-pulse" cx="340" cy="80" r="16" fill="none" stroke={c.accent} strokeWidth="3" />
        <circle cx="340" cy="80" r="9" fill={c.accent} />
      </g>
      <g className="float-y" style={{ '--fdur': '3.5s', '--fy': '-10px' }}>
        <rect x="150" y="210" width="90" height="70" rx="12" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <path d="M150,232 L195,258 L240,232" fill="none" stroke={c.lineSoft} strokeWidth="2.5" />
        <line x1="195" y1="258" x2="195" y2="280" stroke={c.lineSoft} strokeWidth="2.5" />
      </g>
    </svg>
  );
});

const AccountIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <circle className="spin-360" style={{ transformOrigin: '210px 210px' }} cx="210" cy="210" r="150" fill="none" stroke={c.cardBorder} strokeWidth="2" strokeDasharray="4 10" />
      <circle cx="210" cy="180" r="52" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="3" />
      <circle cx="210" cy="164" r="20" fill="none" stroke={c.line} strokeWidth="4" />
      <path d="M176,208 Q210,186 244,208" fill="none" stroke={c.line} strokeWidth="4" strokeLinecap="round" />
      <path d="M150,270 Q210,236 270,270 L270,300 Q210,320 150,300 Z" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
      {[
        { angle: -30, icon: 'orders' },
        { angle: 90, icon: 'address' },
        { angle: 210, icon: 'gear' },
      ].map((d, i) => {
        const rad = (d.angle * Math.PI) / 180;
        const cx = 210 + 150 * Math.cos(rad);
        const cy = 210 + 150 * Math.sin(rad);
        return (
          <g key={i} className="float-y" style={{ '--fdur': '3.5s', '--fy': '-8px', animationDelay: `${i * 0.4}s` }}>
            <circle cx={cx} cy={cy} r="26" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
            {d.icon === 'orders' && <rect x={cx - 10} y={cy - 8} width="20" height="16" rx="2" fill="none" stroke={c.lineSoft} strokeWidth="2.5" />}
            {d.icon === 'address' && <path d={`M${cx} ${cy - 10} L${cx - 9} ${cy + 8} L${cx + 9} ${cy + 8} Z`} fill="none" stroke={c.lineSoft} strokeWidth="2.5" strokeLinejoin="round" />}
            {d.icon === 'gear' && <circle cx={cx} cy={cy} r="9" fill="none" stroke={c.lineSoft} strokeWidth="2.5" />}
          </g>
        );
      })}
    </svg>
  );
});

const RepairIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <circle className="pulse-scale" style={{ '--fdur': '5s', '--s-peak': 1.06 }} cx="210" cy="215" r="150" fill={c.fillSoft} />
      <rect x="150" y="110" width="120" height="200" rx="20" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
      <rect x="168" y="134" width="84" height="130" rx="6" fill={c.fillSoft} />
      {[0, 1, 2].map((i) => (
        <line key={i}
          className="flicker-line"
          style={{ animationDelay: `${i * 0.25}s` }}
          x1={180 + i * 22} y1="150" x2={180 + i * 22} y2="250"
          stroke={c.accent} strokeWidth="2"
        />
      ))}
      <g className="tool-wobble-a" style={{ transformOrigin: '300px 130px' }}>
        <rect x="290" y="70" width="20" height="90" rx="6" fill={c.fillCard} stroke={c.line} strokeWidth="3" />
        <path d="M280,70 L320,70 L314,50 L286,50 Z" fill="none" stroke={c.line} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g className="tool-wobble-b" style={{ transformOrigin: '120px 300px' }}>
        <rect x="112" y="250" width="16" height="80" rx="6" fill={c.fillCard} stroke={c.line} strokeWidth="3" />
        <circle cx="120" cy="240" r="14" fill="none" stroke={c.line} strokeWidth="3" />
      </g>
    </svg>
  );
});

const OffersIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <g className="gentle-wobble" style={{ '--fdur': '5s', '--a': 4, transformOrigin: '210px 210px' }}>
        <path d="M150,110 L250,110 L310,180 L230,290 L150,290 Z" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <circle cx="180" cy="150" r="10" fill={c.accent} />
        <text x="210" y="215" textAnchor="middle" fontSize="46" fontWeight="800" fill={c.line}>%</text>
      </g>
      {[
        { x: 90, y: 90, s: 10, d: 0 },
        { x: 330, y: 120, s: 14, d: 0.4 },
        { x: 340, y: 260, s: 8, d: 0.8 },
        { x: 100, y: 300, s: 12, d: 1.2 },
      ].map((sp, i) => (
        <path key={i}
          className="sparkle-twinkle"
          style={{ animationDelay: `${sp.d}s`, transformOrigin: `${sp.x}px ${sp.y}px` }}
          d={`M${sp.x} ${sp.y - sp.s} L${sp.x + sp.s * 0.3} ${sp.y - sp.s * 0.3} L${sp.x + sp.s} ${sp.y} L${sp.x + sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x} ${sp.y + sp.s} L${sp.x - sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x - sp.s} ${sp.y} L${sp.x - sp.s * 0.3} ${sp.y - sp.s * 0.3} Z`}
          fill={c.accent}
        />
      ))}
    </svg>
  );
});

const ShopIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      <rect x="110" y="180" width="200" height="140" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
      <g className="gentle-wobble" style={{ '--fdur': '4s', '--a': 1.5, transformOrigin: '210px 150px' }}>
        <path d="M100,150 L320,150 L340,190 L80,190 Z" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${100 + i * 44},190 L${100 + i * 44 + 30},190 L${100 + i * 44 + 18},220 L${100 + i * 44 + 12},220 Z`}
            fill={i % 2 === 0 ? c.line : c.fillCard} stroke={c.cardBorder} strokeWidth="1.5" />
        ))}
      </g>
      <rect x="185" y="240" width="50" height="80" rx="4" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="2.5" />
      <circle cx="222" cy="280" r="3" fill={c.line} />
      <g className="gentle-wobble" style={{ '--fdur': '3s', '--a': 6, animationDelay: '0.3s', transformOrigin: '300px 130px' }}>
        <line x1="300" y1="100" x2="300" y2="130" stroke={c.cardBorder} strokeWidth="2" />
        <rect x="270" y="130" width="60" height="30" rx="6" fill={c.fillCard} stroke={c.line} strokeWidth="2.5" />
        <text x="300" y="150" textAnchor="middle" fontSize="14" fontWeight="700" fill={c.line}>open</text>
      </g>
    </svg>
  );
});

const CategoryIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  const cells = [
    { x: 100, y: 100, shape: 'square' },
    { x: 200, y: 100, shape: 'circle' },
    { x: 300, y: 100, shape: 'triangle' },
    { x: 100, y: 200, shape: 'circle' },
    { x: 200, y: 200, shape: 'square', active: true },
    { x: 300, y: 200, shape: 'square' },
    { x: 100, y: 300, shape: 'triangle' },
    { x: 200, y: 300, shape: 'square' },
    { x: 300, y: 300, shape: 'circle' },
  ];
  return (
    <svg viewBox="0 0 420 420" className="w-full h-full">
      {cells.map((cell, i) => {
        const delay = i * 0.06;
        const style = cell.active
          ? { transformOrigin: `${cell.x}px ${cell.y}px`, animation: `cellEnter 0.5s ${EASE} ${delay}s both, cellPulse 2.4s ease-in-out infinite ${delay + 0.5}s` }
          : { transformOrigin: `${cell.x}px ${cell.y}px`, animationDelay: `${delay}s` };
        return (
          <g key={i} className={cell.active ? '' : 'cell-enter'} style={style}>
            {cell.shape === 'square' && (
              <rect x={cell.x - 28} y={cell.y - 28} width="56" height="56" rx="12"
                fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} />
            )}
            {cell.shape === 'circle' && (
              <circle cx={cell.x} cy={cell.y} r="28"
                fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} />
            )}
            {cell.shape === 'triangle' && (
              <path d={`M${cell.x} ${cell.y - 30} L${cell.x + 28} ${cell.y + 22} L${cell.x - 28} ${cell.y + 22} Z`}
                fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} strokeLinejoin="round" />
            )}
          </g>
        );
      })}
    </svg>
  );
});

const VARIANT_ILLUSTRATIONS = {
  home: HomeIllustration,
  devices: DevicesIllustration,
  track: TrackIllustration,
  account: AccountIllustration,
  repair: RepairIllustration,
  offers: OffersIllustration,
  shop: ShopIllustration,
  category: CategoryIllustration,
};

const VARIANT_CHIP = {
  home: { label: 'Verified shops', delay: 0 },
  devices: { label: 'Warrantied', delay: 0.2 },
  track: { label: 'Live tracking', delay: 0.1 },
  account: { label: 'Your data, secure', delay: 0.15 },
  repair: { label: 'Fast turnaround', delay: 0.05 },
  offers: { label: 'Best price', delay: 0.25 },
  shop: { label: 'Official', delay: 0.1 },
  category: { label: 'Curated picks', delay: 0.2 },
};

const Illustration3DStage = memo(({ variant, darkMode }) => {
  const Comp = VARIANT_ILLUSTRATIONS[variant] ?? VARIANT_ILLUSTRATIONS.home;
  const chip = VARIANT_CHIP[variant] ?? VARIANT_CHIP.home;
  return (
    <div className="relative w-64 sm:w-80 lg:w-96 aspect-square" style={{ perspective: '1500px' }}>
      <div className="hero-3d-hover relative w-full h-full">
        <div className="hero-tilt-3d relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          <div
            className={`hero-ring-spin absolute inset-[6%] rounded-full border-[10px] ${darkMode ? 'border-emerald-500/15' : 'border-emerald-200/70'}`}
            style={{ transformStyle: 'preserve-3d' }}
          />
          <div
            className={`absolute inset-[12%] rounded-[3rem] ${darkMode ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/25' : 'bg-gradient-to-br from-emerald-200 to-teal-200'}`}
            style={{ transform: 'translateZ(-70px)', boxShadow: darkMode ? '0 50px 90px -30px rgba(16,185,129,0.25)' : '0 50px 90px -30px rgba(5,150,105,0.3)' }}
          />
          <div className="absolute inset-0" style={{ transform: 'translateZ(20px)' }}>
            <Comp darkMode={darkMode} />
          </div>
          <div
            className="hero-chip-float absolute top-[4%] right-[2%]"
            style={{ '--tz': '90px', transform: 'translateZ(90px)', animationDelay: `${chip.delay}s` }}
          >
            <div className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${darkMode ? 'bg-gray-900 border-emerald-800 text-emerald-300' : 'bg-white border-emerald-100 text-emerald-700'}`} style={{ boxShadow: darkMode ? '0 20px 35px -14px rgba(0,0,0,0.6)' : '0 20px 35px -14px rgba(6,95,70,0.3)' }}>
              {chip.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const VARIANT_DEFAULTS = {
  home: {
    badge: 'Trusted by thousands across Egypt',
    headingLine1: 'Put your',
    headingAccent: 'devices',
    headingLine2: 'first',
    description: 'Fast, trusted repairs and premium refurbished devices — find expert technicians and top shops all in one place.',
    buttons: [
      { label: 'Book a Repair', to: '/repair', primary: true },
      { label: 'Browse Devices', to: '/devices', primary: false },
    ],
  },
  devices: {
    badge: 'Certified devices, ready to ship',
    headingLine1: 'Find your',
    headingAccent: 'next device',
    headingLine2: 'today',
    description: 'Browse new, used, and refurbished phones and laptops from verified shops — every listing checked and warrantied.',
    buttons: [
      { label: 'Browse Devices', to: '/devices', primary: true },
      { label: 'Compare Shops', to: '/shops', primary: false },
    ],
  },
  track: {
    badge: 'Real-time order tracking',
    headingLine1: 'Track your',
    headingAccent: 'orders',
    headingLine2: 'in real time',
    description: 'Watch every step of your delivery — from warehouse to your doorstep. Stay informed, stay in control.',
    buttons: [
      { label: 'View My Orders', to: '/account', primary: true },
      { label: 'Explore Shop', to: '/devices', primary: false },
    ],
  },
  account: {
    badge: 'Your personal dashboard',
    headingLine1: 'Manage your',
    headingAccent: 'account',
    headingLine2: 'all in one place',
    description: 'Manage your profile, addresses, orders, and repair requests — all in one place.',
    buttons: [
      { label: 'My Orders', to: '/account', primary: true },
      { label: 'Book a Repair', to: '/repair', primary: false },
    ],
  },
  repair: {
    badge: 'Expert technicians ready now',
    headingLine1: 'Put Your',
    headingAccent: 'Device',
    headingLine2: 'First',
    description: 'Fast, reliable repairs from trusted local shops. Describe your issue and get connected instantly.',
    buttons: [
      { label: 'My Orders', to: '/account', primary: true },
      { label: 'Book a Repair', to: '/repair', primary: false },
    ],
  },
  offers: {
    badge: 'Limited time deals — grab them fast!',
    headingLine1: 'Exclusive',
    headingAccent: 'Offers Just',
    headingLine2: 'For You',
    description: 'Save big on repairs, accessories, and premium services at trusted shops near you.',
    buttons: [
      { label: 'Browse shops', to: '/shops', primary: true },
      { label: 'Book a Repair', to: '/repair', primary: false },
    ],
  },
  shop: {
    badge: 'Official Shop',
    headingLine1: '',
    headingAccent: 'Trusted Shop',
    headingLine2: '',
    description: 'Genuine parts, expert technicians, and fast turnaround you can count on.',
    buttons: [
      { label: 'View Products', href: '#shop-products', primary: true },
      { label: 'Browse All Shops', to: '/shops', primary: false },
    ],
  },
  category: {
    badge: 'Browsing a category',
    headingLine1: 'Everything in',
    headingAccent: 'this category',
    headingLine2: '',
    description: 'Verified listings, real conditions, and fair prices — filter by price, condition, and more to find the right fit.',
    buttons: [
      { label: 'View All Products', to: '/devices', primary: false },
    ],
  },
};

const Hero = memo(({
  variant = 'home',
  darkMode = false,
  badge,
  headingLine1,
  headingAccent,
  headingLine2,
  description,
  buttons,
  children,
}) => {
  React.useEffect(() => { injectHeroStylesOnce(); }, []);

  const cfg = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.home;

  const resolvedBadge   = badge         ?? cfg.badge;
  const resolvedLine1   = headingLine1  ?? cfg.headingLine1;
  const resolvedAccent  = headingAccent ?? cfg.headingAccent;
  const resolvedLine2   = headingLine2  ?? cfg.headingLine2;
  const resolvedDesc    = description   ?? cfg.description;
  const resolvedButtons = buttons       ?? cfg.buttons;

  return (
    <section className={`relative min-h-screen flex items-center overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#030a06]' : 'bg-white'
    }`}>
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          <div className="space-y-7 order-1 lg:order-1">

            <h1
              className={`fade-in-up text-4xl mt-6 sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.06] tracking-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
              style={{ '--ty': '18px', '--fdur': '0.4s', animationDelay: '0.05s' }}
            >
              {resolvedLine1 && <>{resolvedLine1}{' '}</>}
              <span className="relative inline-block">
                <span className={`relative z-10 ${darkMode ? 'text-emerald-400' : ''}`}>{resolvedAccent}</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                  <path d="M0,4 Q50,0 100,4 Q150,8 200,4" stroke="#10b981" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              {resolvedLine2 && <>{' '}{resolvedLine2}</>}
            </h1>

            <p
              className={`fade-in-up text-base sm:text-lg leading-relaxed max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ '--ty': '12px', '--fdur': '0.35s', animationDelay: '0.1s' }}
            >
              {resolvedDesc}
            </p>

            {children && (
              <div className="fade-in-up" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.14s' }}>
                {children}
              </div>
            )}

            {resolvedButtons && resolvedButtons.length > 0 && (
              <div
                className="fade-in-up flex flex-wrap gap-3"
                style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.18s' }}
              >
                {resolvedButtons.map((btn) => {
                  const className = btn.primary
                    ? `px-6 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-[0.97] ${
                        darkMode
                          ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                      }`
                    : `px-6 py-3 rounded-xl font-bold text-sm border-2 backdrop-blur-md transition-all duration-200 active:scale-[0.97] ${
                        darkMode
                          ? 'bg-white/5 border-white/15 text-gray-200 hover:border-emerald-400 hover:text-emerald-400'
                          : 'bg-white/40 border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                      }`;

                  if (btn.onClick) {
                    return (
                      <button key={btn.label} onClick={btn.onClick} className={className}>
                        {btn.label}
                      </button>
                    );
                  }
                  if (btn.href) {
                    return (
                      <a key={btn.label} href={btn.href} className={className}>
                        {btn.label}
                      </a>
                    );
                  }
                  return (
                    <Link key={btn.label} to={btn.to} className={className}>
                      {btn.label}
                    </Link>
                  );
                })}
              </div>
            )}

          </div>

          <div
            className="scale-fade-in relative order-1 lg:order-2 h-[300px] sm:h-[420px] lg:h-[520px] flex items-center justify-center"
            style={{ '--s-from': 0.94, '--fdur': '0.5s', animationDelay: '0.05s' }}
          >
            <Illustration3DStage variant={variant} darkMode={darkMode} />
          </div>

        </div>
      </div>

      <WaveBottom darkMode={darkMode} />
    </section>
  );
});

export default Hero;