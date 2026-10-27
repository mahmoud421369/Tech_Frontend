import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';
import { IsoIllustration, ISO_BY_VARIANT } from './IsoIllustrations';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const HERO_TRANSLATIONS = { en: enTranslations.hero, ar: arTranslations.hero, fr: frTranslations.hero };
const NO_TRANSLATION = Object.freeze({});
// Only the variant's own translation is used. Anything missing falls back to that variant's
// English defaults below (it no longer borrows the *home* copy for unrelated pages).
const getHeroTranslation = (language, variant) =>
  HERO_TRANSLATIONS[language]?.variants?.[variant] ?? NO_TRANSLATION;

/* Dark theme palette: charcoal surfaces, pure-black borders/shadows, neon green accent. */
const DARK = {
  hero: '#1e1e1e',     // hero background
  page: '#141414',     // colour of the wave at the bottom (set to your page's dark background)
  card: '#2a2a2a',     // circle behind the illustration
  accent: '#39ff88',   // neon green accent (buttons, underline, burst)
  accentSoft: '#39ff88', // heading accent word
};

/* ------------------------------------------------------------------ *
 *  Layout (matches the reference):
 *    [ big tight heading + underlined accent  ]   [ big circle + illustration + burst ]
 *    [ medium subtitle with underlined phrases ]
 *    [ chunky bordered button with hard offset shadow ]
 *
 *  Subtitle highlights: wrap a phrase in **double asterisks** (in VARIANT_DEFAULTS or in
 *  the translation JSON) and it is bolded + underlined, e.g.  "Fast **trusted repairs**".
 *
 *  Performance notes
 *  - Fonts: no render-blocking @import. Only the font for the current language is
 *    requested (<link> + preconnect, font-display: swap).
 *  - The 3D tilt is one composited layer (perspective() in the keyframe, no preserve-3d),
 *    runs only on large screens with motion allowed, and pauses while off-screen.
 *  - Entrance animations are one-shot; hover effects only on devices that can hover.
 *  - Buttons are static Tailwind strings (JIT-safe) and theme-switch through ONE css var.
 *  - Subtitle parsing, translations and buttons are memoized; no remount on language change.
 *  - The circle behind the art is a flat solid fill (no blur / glow / filters).
 * ------------------------------------------------------------------ */

const HERO_STYLES = `
  .font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .font-cairo, .font-cairo * { font-family: 'Cairo', system-ui, sans-serif; }

  @keyframes heroTilt3d {
    0%, 100% { transform: perspective(1500px) rotateX(7deg) rotateY(-12deg) translateY(0); }
    50%      { transform: perspective(1500px) rotateX(3deg) rotateY(-5deg) translateY(-12px); }
  }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(var(--ty, 16px)); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleFadeIn { from { opacity: 0; transform: scale(var(--s-from, 0.94)); } to { opacity: 1; transform: scale(1); } }

  .fade-in-up     { animation: fadeInUp var(--fdur, 0.4s) ${EASE} both; }
  .scale-fade-in  { animation: scaleFadeIn var(--fdur, 0.5s) ${EASE} both; }

  /* hand-drawn underline for highlighted subtitle phrases (wraps cleanly over several lines) */
  .hero-hl {
    font-weight: 700;
    color: #fff;
    padding-bottom: 0.22em;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23d1fae5' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom / 100% 0.32em no-repeat;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  /* dark mode: neon underline */
  .hero-dark .hero-hl {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom / 100% 0.32em no-repeat;
  }

  /* tilt: large screens + motion allowed only */
  @media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
    .hero-tilt-3d { animation: heroTilt3d 7s ease-in-out infinite; will-change: transform; }
  }
  .hero-stage[data-paused="true"] .hero-tilt-3d { animation-play-state: paused; will-change: auto; }

  @media (hover: hover) {
    .hero-3d-hover { transition: transform 0.3s ${EASE}; }
    .hero-3d-hover:hover { transform: scale(1.03); }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-3d-hover, .fade-in-up, .scale-fade-in { animation: none !important; transition: none !important; }
  }
`;

const FONT_URLS = {
  // Closest Google Font to the reference's geometric, tight, extra-bold sans.
  // To try another face, change this URL and the family in HERO_STYLES.
  jakarta: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  cairo: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
};
const requested = new Set();
const addLink = (rel, href, extra) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (extra) Object.assign(link, extra);
  document.head.appendChild(link);
};
const ensureFont = (key) => {
  if (typeof document === 'undefined' || requested.has(key)) return;
  if (!requested.size) {
    addLink('preconnect', 'https://fonts.googleapis.com');
    addLink('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  }
  requested.add(key);
  addLink('stylesheet', FONT_URLS[key]);
};

let heroStylesInjected = false;
const injectHeroStylesOnce = () => {
  if (heroStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-hero-styles', 'true');
  tag.textContent = HERO_STYLES;
  document.head.appendChild(tag);
  heroStylesInjected = true;
};
injectHeroStylesOnce(); // at import time: styles exist before first paint

const WaveBottom = memo(({ darkMode }) => (
  <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block h-16 w-full md:h-24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? DARK.page : '#f9fafb'} />
    </svg>
  </div>
));

/* Three "spark" strokes next to the art (like the reference). Mirrors in RTL. */
const Burst = memo(({ darkMode }) => (
  <svg
    className={`pointer-events-none absolute end-[1%] top-[2%] z-10 w-14 sm:w-20 lg:w-24 rtl:-scale-x-100 ${darkMode ? 'text-[#39ff88] [filter:drop-shadow(0_0_8px_rgba(57,255,136,.8))]' : 'text-white'}`}
    viewBox="0 0 160 150" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" aria-hidden="true"
  >
    <path d="M22 10L12 108" />
    <path d="M127 13L30 122" />
    <path d="M150 103L40 137" />
  </svg>
));

/* Illustration only: no card, glow or ring. The flat circle lives in <Hero>. */
const Illustration3DStage = memo(({ type, darkMode }) => {
  const ref = useRef(null);

  // Pause the tilt when the hero scrolls out of view (no React re-render).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => { el.dataset.paused = entry.isIntersecting ? 'false' : 'true'; },
      { rootMargin: '60px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="hero-stage absolute inset-0 z-[5]">
      <div className="hero-3d-hover h-full w-full">
        <div className="hero-tilt-3d h-full w-full">
          <IsoIllustration type={type} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
});

/* Wrap a phrase in **...** to get the bold + underlined highlight. */
const renderRich = (text) =>
  String(text ?? '').split('**').map((part, i) => (i % 2 ? <span key={i} className="hero-hl">{part}</span> : part));

const VARIANT_DEFAULTS = {
  home: {
    headingLine1: 'Put your', headingAccent: 'devices', headingLine2: 'first',
    description: 'Fast, trusted repairs and premium refurbished devices. Find **expert technicians** and **top shops** all in one place.',
    buttons: [{ label: 'Book a Repair', to: '/repair', primary: true }, { label: 'Browse Devices', to: '/devices', primary: false }],
  },
  devices: {
    headingLine1: 'Find your', headingAccent: 'next device', headingLine2: 'today',
    description: 'Browse **new, used and refurbished** phones and laptops from verified shops. Every listing is checked and warrantied.',
    buttons: [{ label: 'Browse Devices', to: '/devices', primary: true }, { label: 'Compare Shops', to: '/shops', primary: false }],
  },
  track: {
    headingLine1: 'Track your', headingAccent: 'orders', headingLine2: 'in real time',
    description: 'Watch every step of your delivery, **from warehouse to your doorstep**. Stay informed, stay in control.',
    buttons: [{ label: 'View My Orders', to: '/account', primary: true }, { label: 'Explore Shop', to: '/devices', primary: false }],
  },
  account: {
    headingLine1: 'Manage your', headingAccent: 'account', headingLine2: 'all in one place',
    description: 'Your **profile, addresses, orders** and **repair requests**, all in one place.',
    buttons: [{ label: 'My Orders', to: '/account', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  repair: {
    headingLine1: 'Put Your', headingAccent: 'Device', headingLine2: 'First',
    description: 'Fast, reliable repairs from **trusted local shops**. Describe your issue and get **connected instantly**.',
    buttons: [{ label: 'Book a Repair', to: '/repair', primary: true }, { label: 'My Orders', to: '/account', primary: false }],
  },
  offers: {
    headingLine1: 'Exclusive', headingAccent: 'Offers Just', headingLine2: 'For You',
    description: 'Save big on **repairs, accessories** and premium services at trusted shops near you. Limited time, grab them fast.',
    buttons: [{ label: 'Browse shops', to: '/shops', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  shop: {
    headingLine1: '', headingAccent: 'Trusted Shop', headingLine2: '',
    description: '**Genuine parts**, expert technicians and **fast turnaround** you can count on.',
    buttons: [{ label: 'View Products', href: '#shop-products', primary: true }, { label: 'Browse All Shops', to: '/shops', primary: false }],
  },
  shops: {
    headingLine1: 'Find the', headingAccent: 'right shop', headingLine2: 'near you',
    description: 'Compare **verified, rated shops** for repairs and device sales, then pick the one that fits.',
    buttons: [{ label: 'Browse Shops', to: '/shops', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  shopPage: {
    headingLine1: '', headingAccent: 'Trusted Shop', headingLine2: '',
    description: '**Genuine parts**, expert technicians and a team you can **chat with** any time.',
    buttons: [{ label: 'View Products', href: '#shop-products', primary: true }, { label: 'Browse All Shops', to: '/shops', primary: false }],
  },
  category: {
    headingLine1: 'Everything in', headingAccent: 'this category', headingLine2: '',
    description: '**Verified listings**, real conditions and fair prices. Filter by price and condition to find the right fit.',
    buttons: [{ label: 'View All Products', to: '/devices', primary: true }],
  },
  login: {
    headingLine1: 'Welcome', headingAccent: 'back', headingLine2: '',
    description: 'Sign in to see your **orders**, **repairs** and saved devices.',
    buttons: [],
  },
  signup: {
    headingLine1: 'Create your', headingAccent: 'account', headingLine2: '',
    description: 'Join in a minute to **book repairs**, **track orders** and shop verified devices.',
    buttons: [],
  },
  admin: {
    headingLine1: 'Run the', headingAccent: 'platform', headingLine2: 'with ease',
    description: 'Follow **shops, orders and logistics** from one dashboard.',
    buttons: [],
  },
};

/* Chunky "neo" buttons: thick border + hard offset shadow, like the reference.
   Static class strings (Tailwind JIT-safe). The shadow colour comes from ONE css var (--ink),
   and --dx flips the shadow / press direction in RTL. */
const BTN_BASE =
  '[--dx:1] rtl:[--dx:-1] group inline-flex items-center justify-center gap-3 border-[3px] border-[color:var(--ink)] px-7 py-4 text-base font-extrabold sm:px-9 sm:text-lg ' +
  'transition-[transform,box-shadow] duration-150 ease-out ' +
  '[box-shadow:calc(var(--dx)*7px)_7px_0_0_var(--ink)] ' +
  'hover:translate-y-[3px] hover:translate-x-[calc(var(--dx)*3px)] hover:[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--ink)] ' +
  'active:translate-y-[7px] active:translate-x-[calc(var(--dx)*7px)] active:[box-shadow:0_0_0_0_var(--ink)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-white';
const BUTTON_CLASSES = {
  light: {
    primary: `${BTN_BASE} [--ink:#022c22] bg-white text-emerald-950 hover:bg-emerald-50`,
    secondary: `${BTN_BASE} [--ink:#022c22] bg-emerald-900/40 text-white hover:bg-emerald-900/60`,
  },
  dark: {
    // neon primary + charcoal secondary, black border / hard black shadow
    primary: `${BTN_BASE} [--ink:#000] bg-[#39ff88] text-black hover:bg-[#6dffa8]`,
    secondary: `${BTN_BASE} [--ink:#000] bg-[#2a2a2a] text-white hover:bg-[#333]`,
  },
};

const Arrow = memo(() => (
  <svg
    className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
));

const HeroButton = memo(({ btn, className }) => {
  const content = <>{btn.label}{btn.primary && <Arrow />}</>;
  if (btn.onClick) return <button type="button" onClick={btn.onClick} className={className}>{content}</button>;
  if (btn.href) return <a href={btn.href} className={className}>{content}</a>;
  return <Link to={btn.to} className={className}>{content}</Link>;
});

/**
 * Props
 *  variant      – picks the copy + the default illustration (see ISO_BY_VARIANT)
 *  illustration – optional illustration key that overrides the variant default,
 *                 e.g. <Hero variant="category" illustration={isoCatKey(kind)} />
 */
const Hero = memo(({ variant = 'home', darkMode = false, illustration, headingLine1, headingAccent, headingLine2, description, buttons, children }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

  const cfg = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.home;
  const translated = getHeroTranslation(language, variant);
  const illoType = illustration ?? ISO_BY_VARIANT[variant] ?? ISO_BY_VARIANT.home;

  const resolvedLine1 = headingLine1 ?? translated[1] ?? cfg.headingLine1;
  const resolvedAccent = headingAccent ?? translated[2] ?? cfg.headingAccent;
  const resolvedLine2 = headingLine2 ?? translated[3] ?? cfg.headingLine2;
  const resolvedDesc = description ?? translated[4] ?? cfg.description;

  const richDesc = useMemo(() => renderRich(resolvedDesc), [resolvedDesc]);

  const resolvedButtons = useMemo(
    () => buttons ?? cfg.buttons.map((button, index) => ({ ...button, label: translated[index === 0 ? 5 : 6] || button.label })),
    [buttons, cfg, translated]
  );

  const btnClasses = BUTTON_CLASSES[darkMode ? 'dark' : 'light'];

  return (
    <section
      dir={languageDirection(language)}
      className={`relative flex min-h-screen items-center overflow-hidden ${isAr ? 'font-cairo' : 'font-jakarta'} ${
        darkMode ? 'hero-dark' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'
      }`}
      style={darkMode ? { backgroundColor: DARK.hero } : undefined}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 mt-10 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          {/* text column: centered below lg, start-aligned on desktop (RTL-aware) */}
          <div className="order-2 flex flex-col items-center space-y-8 text-center lg:order-1 lg:items-start lg:text-start">
            <h1
              className={`fade-in-up font-extrabold text-white [text-wrap:balance] text-[2.75rem] sm:text-6xl md:text-7xl xl:text-[5.5rem] ${
                isAr ? 'leading-[1.3] tracking-normal lg:text-7xl' : 'leading-[1.02] tracking-[-0.045em] lg:text-[4.75rem]'
              }`}
              style={{ '--ty': '18px', '--fdur': '0.4s', animationDelay: '0.05s' }}
            >
              {resolvedLine1 && <>{resolvedLine1}{' '}</>}
              <span className="relative inline-block">
                <span className={`relative z-10 ${darkMode ? '' : 'text-emerald-100'}`} style={darkMode ? { color: DARK.accentSoft, textShadow: '0 0 18px rgba(57,255,136,.55)' } : undefined}>{resolvedAccent}</span>
                <svg className="absolute -bottom-1 start-0 w-full" height="9" viewBox="0 0 200 9" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M3,6 Q50,1 100,5 T197,5"
                    stroke={darkMode ? DARK.accent : '#fff'}
                    strokeOpacity={darkMode ? 1 : 0.9}
                    strokeWidth="5" fill="none" strokeLinecap="round"
                  />
                </svg>
              </span>
              {resolvedLine2 && <>{' '}{resolvedLine2}</>}
            </h1>

            <p
              className={`fade-in-up mx-auto max-w-xl text-lg font-medium leading-[1.75] [text-wrap:pretty] sm:text-xl lg:mx-0 lg:text-2xl lg:leading-[1.7] ${darkMode ? 'text-neutral-300' : 'text-emerald-50'}`}
              style={{ '--ty': '12px', '--fdur': '0.35s', animationDelay: '0.1s' }}
            >
              {richDesc}
            </p>

            {children && (
              <div className="fade-in-up flex w-full justify-center lg:justify-start" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.14s' }}>
                {children}
              </div>
            )}

            {resolvedButtons && resolvedButtons.length > 0 && (
              <div className="fade-in-up flex flex-wrap justify-center gap-5 pb-3 pe-3 lg:justify-start" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.18s' }}>
                {resolvedButtons.map((btn) => (
                  <HeroButton key={btn.label} btn={btn} className={btn.primary ? btnClasses.primary : btnClasses.secondary} />
                ))}
              </div>
            )}
          </div>

          {/* art column: flat circle + big illustration that spills past it + spark strokes */}
          <div
            className="scale-fade-in relative order-1 mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[34rem] lg:order-2 lg:-mx-10 lg:max-w-none"
            style={{ '--s-from': 0.94, '--fdur': '0.5s', animationDelay: '0.05s' }}
          >
            <div
              className={`absolute inset-[7%] rounded-full ${
                darkMode
                  ? 'border-[3px] border-black bg-[#2a2a2a] [box-shadow:8px_8px_0_0_#000]'
                  : 'bg-emerald-300/35'
              }`}
              aria-hidden="true"
            />
            <Burst darkMode={darkMode} />
            <Illustration3DStage type={illoType} darkMode={darkMode} />
          </div>
        </div>
      </div>

      <WaveBottom darkMode={darkMode} />
    </section>
  );
});

export default Hero;