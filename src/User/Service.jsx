import React, { memo, useEffect, useMemo } from 'react';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const SERVICE_TRANSLATIONS = {
  en: enTranslations.service,
  ar: arTranslations.service || arTranslations.hero?.service,
  fr: frTranslations.service || frTranslations.hero?.service,
};


const SERVICES = [
  { key: 'expertRepairs', illustration: 'repairCard' },
  { key: 'premiumDevices', illustration: 'devices' },
  { key: 'priorityShipping', illustration: 'track' },
];

const NUMBER_LOCALE = { en: 'en', fr: 'fr', ar: 'ar-EG' };


const fmtCache = {};
const pad2 = (language, n) => {
  const fmt = fmtCache[language]
    || (fmtCache[language] = new Intl.NumberFormat(NUMBER_LOCALE[language] || 'en', { minimumIntegerDigits: 2, useGrouping: false }));
  return fmt.format(n);
};

const getCard = (language, key) => {
  const own = SERVICE_TRANSLATIONS[language]?.cards?.[key];
  const en = SERVICE_TRANSLATIONS.en?.cards?.[key];
  return { title: own?.title || en?.title || key, desc: own?.desc || en?.desc || '' };
};



const FONT_URLS = {
  jakarta: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  cairo: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
};
const ensureFont = (key) => {
  if (typeof document === 'undefined') return;
  const href = FONT_URLS[key];
  if (document.head.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const SVC_STYLES = `
  .svc-font-latin, .svc-font-latin * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .svc-font-ar, .svc-font-ar * { font-family: 'Cairo', system-ui, sans-serif; }
  .svc-hl, .svc-hl-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .svc-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .svc-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
`;
let svcStylesInjected = false;
const injectSvcStylesOnce = () => {
  if (svcStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-service-styles', 'true');
  tag.textContent = SVC_STYLES;
  document.head.appendChild(tag);
  svcStylesInjected = true;
};
injectSvcStylesOnce();


const splitHeading = (text) => {
  const str = String(text ?? '');
  if (str.includes('**')) return str.split('**').map((part, i) => ({ part, hl: i % 2 === 1 }));
  const m = str.match(/^(.*[,،]\s*)([^,،]+)$/);
  if (m) return [{ part: m[1], hl: false }, { part: m[2], hl: true }];
  const words = str.split(' ');
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(' ')} `, hl: false }, { part: words.slice(-n).join(' '), hl: true }];
};

const SectionHeading = memo(({ label, title, darkMode, isAr }) => {
  const hl = darkMode ? 'svc-hl-dark' : 'svc-hl';
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 sm:mb-14">
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`h-3.5 w-12 border-2 ${darkMode ? 'border-[#39ff88] bg-[#39ff88]' : 'border-emerald-950 bg-emerald-400'}`}
        />
        <span className={`text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
          {label}
        </span>
      </div>
      <h2
        className={`max-w-4xl text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${
          isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
        } ${darkMode ? 'text-white' : 'text-emerald-950'}`}
      >
        {parts.map(({ part, hl: on }, i) => (on ? <span key={i} className={hl}>{part}</span> : part))}
      </h2>
    </div>
  );
});


const CARD_BASE =
  '[--dx:1] rtl:[--dx:-1] flex flex-col border-[3px] border-[color:var(--ink)] p-5 sm:p-6 ' +
  '[box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]';
const CARD_THEME = {
  light: `${CARD_BASE} [--ink:#022c22] [--sh:#022c22] bg-white`,
  dark: `${CARD_BASE} [--ink:#000] [--sh:#000] bg-[#2a2a2a]`,
};
const BADGE_THEME = {
  light: 'border-emerald-950 bg-emerald-400 [box-shadow:calc(var(--dx)*3px)_3px_0_0_#022c22]',
  dark: 'border-black bg-[#39ff88] [box-shadow:calc(var(--dx)*3px)_3px_0_0_#000]',
};

const ServiceCard = memo(({ index, illustration, title, desc, darkMode, isAr }) => (
  <li className={darkMode ? CARD_THEME.dark : CARD_THEME.light}>
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`inline-flex h-9 min-w-9 flex-shrink-0 items-center justify-center border-2 px-1.5 text-sm font-extrabold tabular-nums text-emerald-950 ${darkMode ? BADGE_THEME.dark : BADGE_THEME.light}`}
      >
        {index}
      </span>
      <h3 className={`text-xl font-extrabold uppercase sm:text-2xl ${isAr ? 'tracking-normal' : 'tracking-[-0.02em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
        <span className={darkMode ? 'svc-hl-dark' : 'svc-hl'}>{title}</span>
      </h3>
    </div>

    <div aria-hidden="true" className="my-6 aspect-[3/2] w-full">
      <IsoIllustration type={illustration} darkMode={darkMode} onGreen={false} className="h-full w-full" />
    </div>

    <p className={`mt-auto text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{desc}</p>
  </li>
));

const Service = ({ darkMode = false }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';
  const heading = SERVICE_TRANSLATIONS[language]?.title || SERVICE_TRANSLATIONS.en?.title;
  const label = SERVICE_TRANSLATIONS[language]?.badge || 'Services';

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

  const cards = useMemo(
    () => SERVICES.map((s, i) => ({ ...s, ...getCard(language, s.key), index: pad2(language, i + 1) })),
    [language],
  );

  return (
    <section
      dir={languageDirection(language)}
      className={`relative overflow-hidden py-14 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_900px] ${isAr ? 'svc-font-ar' : 'svc-font-latin'} ${darkMode ? 'bg-[#141414]' : 'bg-gray-50'}`}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading label={label} title={heading} darkMode={darkMode} isAr={isAr} />

        <ol className="grid grid-cols-1 gap-8 pb-2 pe-2 md:grid-cols-3 lg:gap-10">
          {cards.map(({ key, ...card }) => (
            <ServiceCard key={key} darkMode={darkMode} isAr={isAr} {...card} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default memo(Service);