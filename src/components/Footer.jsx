import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiClock, FiTool, FiRefreshCw } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import {
  RiMapPin2Line, RiHome3Line, RiDeviceLine, RiTruckLine, RiStore2Line,
  RiShieldCheckLine, RiVerifiedBadgeLine,
} from 'react-icons/ri';
import logo from '../images/tech-restore-logo.webp';
import { Defs3D, Device3DStyles, DeviceScene, Chip3D } from './Device3D';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const FOOTER_TRANSLATIONS = { en: enTranslations.footer, ar: arTranslations.footer, fr: frTranslations.footer };
const SECTIONS = ['brand', 'quickLinks', 'services', 'contact', 'bottomBar'];
const lookup = (footer, key) => {
  if (!footer) return '';
  for (const s of SECTIONS) { if (typeof footer[s]?.[key] === 'string') return footer[s][key]; }
  return typeof footer[key] === 'string' ? footer[key] : '';
};
// current language first, then English, then the key itself
const getFooterTranslation = (language, key) =>
  lookup(FOOTER_TRANSLATIONS[language], key) || lookup(FOOTER_TRANSLATIONS.en, key) || key;

/* ───────────── 3D social buttons: coloured glass keys that press down ───────────── */
const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FaFacebookF, cls: 'from-sky-400 to-blue-700 shadow-[0_4px_0_0_#1e3a8a,0_10px_14px_-8px_rgba(30,58,138,0.7)] active:shadow-[0_1px_0_0_#1e3a8a]' },
  { label: 'Twitter', href: 'https://twitter.com', Icon: FaTwitter, cls: 'from-sky-300 to-sky-600 shadow-[0_4px_0_0_#075985,0_10px_14px_-8px_rgba(7,89,133,0.7)] active:shadow-[0_1px_0_0_#075985]' },
  { label: 'Instagram', href: 'https://instagram.com', Icon: FaInstagram, cls: 'from-amber-400 via-rose-500 to-fuchsia-600 shadow-[0_4px_0_0_#9f1239,0_10px_14px_-8px_rgba(159,18,57,0.7)] active:shadow-[0_1px_0_0_#9f1239]' },
];

const SocialBtn3D = memo(({ href, Icon, label, cls }) => (
  <a
    href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-inset ring-white/30 transition-all duration-100 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${cls}`}
  >
    <Icon className="h-[18px] w-[18px] drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]" />
  </a>
));

/* ───────────── Links with a 3D chip each ───────────── */
const FooterLink = memo(({ to, Icon, tone = 'em', label, darkMode }) => (
  <li>
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
        darkMode ? 'text-gray-400 hover:text-emerald-300' : 'text-emerald-900/70 hover:text-emerald-700'
      }`}
    >
      <Chip3D tone={tone} className="h-8 w-8 flex-shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </Chip3D>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  </li>
));

const ContactRow = memo(({ Icon, tone = 'em', children }) => (
  <li className="flex items-start gap-3">
    <Chip3D tone={tone} className="h-8 w-8 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
    <div className="min-w-0 pt-1">{children}</div>
  </li>
));

const ColumnTitle = ({ children, darkMode }) => (
  <h3 className={`mb-5 text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{children}</h3>
);

const Footer = ({ darkMode = false }) => {
  const language = useAppLanguage();
  const t = useCallback((key) => getFooterTranslation(language, key), [language]);
  const muted = darkMode ? 'text-gray-400' : 'text-emerald-900/70';
  const hover = darkMode ? 'hover:text-emerald-300' : 'hover:text-emerald-700';

  const quickLinks = [
    { to: '/', Icon: RiHome3Line, label: t('home') },
    { to: '/devices', Icon: RiDeviceLine, label: t('devices') },
    { to: '/track', Icon: RiTruckLine, label: t('trackOrder') },
    { to: '/shops', Icon: RiStore2Line, label: t('shops') },
  ];
  const services = [
    { to: '/services/repair', Icon: FiTool, tone: 'em', label: t('deviceRepair') },
    { to: '/services/refurbish', Icon: FiRefreshCw, tone: 'sky', label: t('refurbishedSales') },
    { to: '/services/warranty', Icon: RiShieldCheckLine, tone: 'vi', label: t('warrantyPlans') },
    { to: '/services/delivery', Icon: RiTruckLine, tone: 'am', label: t('fastDelivery') },
  ];
  const legal = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/cookies', label: 'Cookie Policy' },
  ];

  return (
    <footer
      dir={languageDirection(language)}
      className={`relative overflow-hidden border-t ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${
        darkMode ? 'border-emerald-900/60 bg-[#04120b]' : 'border-emerald-100 bg-emerald-50/70'
      }`}
    >
      {/* gradients + animation CSS are idempotent, safe even if the page already rendered them */}
      <Defs3D />
      <Device3DStyles />

      <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />
      <div className={`pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/5' : 'bg-emerald-200/40'}`} />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* brand */}
          <div className="relative space-y-5 sm:col-span-2 lg:col-span-1">
            <DeviceScene compact className="pointer-events-none absolute -top-4 end-0 hidden h-24 w-28 opacity-80 sm:block lg:hidden xl:block" />
            <div className="relative flex items-center gap-3">
              <img src={logo} alt="Tech & Restore" width={48} height={48} className="h-12 w-auto rounded-xl" loading="lazy" decoding="async" />
              <div>
                <p className={`text-lg font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-emerald-950'}`}>Tech &amp; Restore</p>
                <p className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('tagline')}</p>
              </div>
            </div>

            <p className={`relative max-w-xs text-sm leading-relaxed ${muted}`}>{t('description')}</p>

            <div className="relative flex flex-wrap gap-2">
              {[t('certified'), t('genuineParts'), t('warranty')].map((b) => (
                <span key={b} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  <RiVerifiedBadgeLine className="h-3 w-3" />{b}
                </span>
              ))}
            </div>

            <div className="relative flex gap-3 pt-1">
              {SOCIALS.map((s) => <SocialBtn3D key={s.label} {...s} />)}
            </div>
          </div>

          {/* quick links */}
          <nav aria-label={t('quickLinks')}>
            <ColumnTitle darkMode={darkMode}>{t('quickLinks')}</ColumnTitle>
            <ul className="space-y-2.5">{quickLinks.map((l) => <FooterLink key={l.to} darkMode={darkMode} {...l} />)}</ul>
          </nav>

          {/* services */}
          <nav aria-label={t('ourServices')}>
            <ColumnTitle darkMode={darkMode}>{t('ourServices')}</ColumnTitle>
            <ul className="space-y-2.5">{services.map((s) => <FooterLink key={s.to} darkMode={darkMode} {...s} />)}</ul>
          </nav>

          {/* contact */}
          <div>
            <ColumnTitle darkMode={darkMode}>{t('contactUs')}</ColumnTitle>
            <ul className="space-y-4">
              <ContactRow Icon={RiMapPin2Line}>
                <span className={`text-sm ${muted}`}>Cairo, Al Maadi,<br />Egypt</span>
              </ContactRow>
              <ContactRow Icon={FiPhone} tone="sky">
                <a href="tel:+2019999" dir="ltr" className={`text-sm transition-colors ${muted} ${hover}`}>+20 19999</a>
              </ContactRow>
              <ContactRow Icon={FiMail} tone="vi">
                <a href="mailto:support@techrestore.com" className={`break-all text-sm transition-colors ${muted} ${hover}`}>support@techrestore.com</a>
              </ContactRow>
              <ContactRow Icon={FiClock} tone="am">
                <p className={`text-sm ${muted}`}>{t('support')}</p>
                <p className={`mt-0.5 text-xs ${darkMode ? 'text-emerald-400/60' : 'text-emerald-600/70'}`}>{t('alwaysHelp')}</p>
              </ContactRow>
            </ul>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm sm:flex-row ${darkMode ? 'border-emerald-900/60' : 'border-emerald-900/10'}`}>
          <p className={`text-center ${darkMode ? 'text-gray-500' : 'text-emerald-900/60'}`}>
            © {new Date().getFullYear()}{' '}
            <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Tech Restore</span>. {t('rights')}
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {legal.map(({ to, label }) => (
              <Link key={to} to={to} className={`transition-colors ${darkMode ? 'text-gray-500' : 'text-emerald-900/60'} ${hover}`}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);