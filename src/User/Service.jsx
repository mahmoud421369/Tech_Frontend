import React, { memo } from 'react';
import { FiTool, FiMonitor, FiTruck, FiShield, FiArrowRight } from 'react-icons/fi';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import { Defs3D, Device3DStyles, Glyph3D, Chip3D, Btn3D, useOnScreen } from '../components/Device3D';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const SERVICE_TRANSLATIONS = {
  en: enTranslations.service,
  ar: arTranslations.service || arTranslations.hero?.service,
  fr: frTranslations.service || frTranslations.hero?.service,
};

// Same four translation keys as before; the last two (data recovery / trade-in) were dropped.
const SERVICES = [
  { key: 'expertRepairs', icon: FiTool, tone: 'em' },
  { key: 'premiumDevices', icon: FiMonitor, tone: 'sky' },
  { key: 'priorityShipping', icon: FiTruck, tone: 'am' },
  { key: 'ironcladWarranty', icon: FiShield, tone: 'vi' },
];

const getCard = (language, key) => ({
  title: SERVICE_TRANSLATIONS[language]?.cards?.[key]?.title || SERVICE_TRANSLATIONS.en?.cards?.[key]?.title || key,
  desc: SERVICE_TRANSLATIONS[language]?.cards?.[key]?.desc || SERVICE_TRANSLATIONS.en?.cards?.[key]?.desc || '',
});

/* ───────────── 3D scene: device cluster on a glass plate, orbit ring, floating labels ───────────── */
const FloatLabel = ({ icon: Icon, tone, label, darkMode, className, delay = '0s' }) => (
  <div
    style={{ animationDelay: delay }}
    className={`anim-float absolute flex items-center gap-2 rounded-2xl border py-1.5 pl-1.5 pr-3 text-[11px] font-bold shadow-lg backdrop-blur-sm ${
      darkMode ? 'border-emerald-500/20 bg-gray-900/80 text-emerald-200' : 'border-emerald-100 bg-white/90 text-emerald-900'
    } ${className}`}
  >
    <Chip3D tone={tone} className="h-7 w-7"><Icon className="h-3.5 w-3.5" /></Chip3D>
    <span className="whitespace-nowrap">{label}</span>
  </div>
);

const ServiceScene = memo(({ darkMode }) => {
  const [ref, visible] = useOnScreen();
  return (
    <div ref={ref} aria-hidden="true" className={`relative mx-auto aspect-square w-full max-w-[200px] sm:max-w-[420px] ${visible ? '' : 'anim-paused'}`}>
      {/* glow + orbit ring */}
      <div className={`absolute inset-[10%] rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/50'}`} />
      <div className={`anim-orbit absolute inset-[4%] rounded-full border-2 border-dashed ${darkMode ? 'border-emerald-500/25' : 'border-emerald-300/80'}`} />

      {/* tilted glass plate */}
      <div className="absolute inset-[16%] [perspective:800px]">
        <div
          className={`h-full w-full rounded-[2.2rem] ring-1 ${darkMode ? 'bg-gradient-to-br from-emerald-900/70 to-emerald-950 ring-emerald-400/20 shadow-[0_30px_40px_-20px_rgba(0,0,0,0.7)]' : 'bg-gradient-to-br from-white to-emerald-100 ring-emerald-200 shadow-[0_30px_40px_-24px_rgba(5,150,105,0.5)]'}`}
          style={{ transform: 'rotateX(52deg) rotateZ(-8deg) translateY(22%)' }}
        />
      </div>

      {/* devices */}
      <Glyph3D name="laptop" className="absolute left-[12%] top-[34%] h-[46%] w-[60%]" />
      <Glyph3D name="phone" className="anim-float absolute right-[14%] top-[10%] h-[44%] w-[22%]" style={{ animationDelay: '0.4s' }} />
      <Glyph3D name="tablet" className="absolute bottom-[10%] right-[18%] h-[26%] w-[26%]" />
      <Glyph3D name="watch" className="anim-float absolute bottom-[14%] left-[10%] h-[24%] w-[18%]" style={{ animationDelay: '1.1s' }} />
      <Glyph3D name="audio" className="anim-float absolute left-[24%] top-[8%] h-[24%] w-[24%]" style={{ animationDelay: '0.8s' }} />

      {/* floating labels (hidden on very small screens) */}
      <div className="hidden sm:block">
        <FloatLabel icon={FiTool} tone="em" label="Trusted repairs" darkMode={darkMode} className="left-[-2%] top-[40%]" delay="0.2s" />
        <FloatLabel icon={FiTruck} tone="am" label="Fast delivery" darkMode={darkMode} className="right-[-2%] top-[52%]" delay="0.9s" />
        <FloatLabel icon={FiShield} tone="vi" label="Warranty" darkMode={darkMode} className="bottom-[2%] left-[34%]" delay="1.5s" />
      </div>
    </div>
  );
});

const ServiceCard = memo(({ icon: Icon, tone, title, desc, darkMode }) => (
  <article
    className={`group relative flex h-full flex-col gap-4 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 sm:p-6 ${
      darkMode
        ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30'
        : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'
    }`}
  >
    <Chip3D tone={tone} className="h-12 w-12 flex-shrink-0 transition-transform duration-200 group-hover:scale-105"><Icon className="h-6 w-6" /></Chip3D>
    <div className="min-w-0 flex-1">
      <h3 className={`text-base font-bold leading-snug tracking-tight sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`mt-1.5 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
    </div>
    <span className="h-0.5 w-10 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-70 transition-all duration-200 group-hover:w-16 group-hover:opacity-100" />
  </article>
));

/**
 * Props:
 *  darkMode   – boolean
 *  standalone – set true only if this section is rendered on its own page
 *               (Homepage already renders <Defs3D /> and <Device3DStyles />).
 */
const Service = ({ darkMode = false, standalone = false }) => {
  const language = useAppLanguage();
  const heading = SERVICE_TRANSLATIONS[language]?.title || SERVICE_TRANSLATIONS.en?.title;
  const isRtl = languageDirection(language) === 'rtl';

  return (
    <section
      dir={languageDirection(language)}
      className={`relative overflow-hidden py-12 sm:py-16 ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}
    >
      {standalone && <><Defs3D /><Device3DStyles /></>}
      <div className={`pointer-events-none absolute -top-24 h-72 w-72 rounded-full blur-3xl ${isRtl ? '-left-24' : '-right-24'} ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{heading}</h2>
          <Btn3D as="a" href="/repair" className="px-4 py-2 text-sm">
            Book a repair <FiArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Btn3D>
        </div>

        {/* cards + illustration share ONE row from lg up */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="order-last grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:order-none lg:col-span-7">
            {SERVICES.map(({ key, icon, tone }) => {
              const { title, desc } = getCard(language, key);
              return <ServiceCard key={key} icon={icon} tone={tone} darkMode={darkMode} title={title} desc={desc} />;
            })}
          </div>

          <div className="order-first lg:order-none lg:col-span-5">
            <ServiceScene darkMode={darkMode} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(Service);