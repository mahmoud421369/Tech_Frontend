import React, { memo, useMemo, useState, useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiClock, FiX } from 'react-icons/fi';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import { RiMapPin2Line, RiHome3Line, RiDeviceLine, RiTruckLine, RiStore2Line } from 'react-icons/ri';
import logo from '../../common/images/tech-restore-logo.webp';
import { FooterArt } from './HeroArt';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';

const FOOTER_TRANSLATIONS = { en: enTranslations.footer, ar: arTranslations.footer, fr: frTranslations.footer };

const FOOTER_PATHS = {
  name: 'brand.name',
  tagline: 'brand.tagline',
  description: 'brand.description',
  followUs: 'social.title',
  facebook: 'social.facebook',
  instagram: 'social.instagram',
  quickLinks: 'quickLinks.title',
  home: 'quickLinks.home',
  devices: 'quickLinks.devices',
  trackOrder: 'quickLinks.trackOrder',
  shops: 'quickLinks.shops',
  contactUs: 'contact.title',
  address: 'contact.address',
  phone: 'contact.phone',
  email: 'contact.email',
  support: 'contact.hoursTitle',
  alwaysHelp: 'contact.hoursSubtitle',
  copyright: 'bottomBar.copyright',
  privacy: 'bottomBar.privacyPolicy',
  terms: 'bottomBar.termsOfService',
  cookies: 'bottomBar.cookiePolicy',
  close: 'bottomBar.close',
};

const LOCAL_FOOTER = {
  en: { close: 'Close' },
  ar: { close: 'إغلاق' },
  fr: { close: 'Fermer' },
};

const readPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const asString = (v) => (typeof v === 'string' && v ? v : '');

const getFooterTranslation = (language, key) => {
  const path = FOOTER_PATHS[key] || key;
  return asString(readPath(FOOTER_TRANSLATIONS[language], path))
    || asString(readPath(FOOTER_TRANSLATIONS.en, path))
    || LOCAL_FOOTER[language]?.[key]
    || LOCAL_FOOTER.en[key]
    || key;
};

const LEGAL_DOCS = {
  en: {
    privacy: [
      ['Information we collect', 'We collect the details you give us when you create an account, place an order or book a repair: your name, email, phone number, delivery address and the device details you submit. We also receive basic technical data such as browser type and the pages you visit.'],
      ['How we use it', 'To process orders and repairs, deliver products, send order updates, provide support, prevent fraud and improve the service.'],
      ['Sharing', 'We share only what is needed with the shops that fulfil your order or repair and with our delivery partners. We never sell your personal data.'],
      ['Security and retention', 'We protect your data with encrypted connections and access controls, and keep it only as long as needed for your account, legal obligations or dispute resolution.'],
      ['Your rights', 'You can ask to access, correct or delete your data at any time by contacting {{email}}.'],
    ],
    terms: [
      ['Using the platform', 'By using Tech-Restore you agree to these terms. You must provide accurate information and keep your account credentials safe.'],
      ['Orders and payments', 'Prices are shown in the store currency. An order is confirmed once the shop accepts it. Available payment methods, including cash on delivery, are shown at checkout.'],
      ['Repairs and warranty', 'Repair quotes may change after diagnosis and need your approval first. Warranty terms are set by each shop and shown with the product or repair.'],
      ['Shops and listings', 'Independent shops are responsible for their products, prices and services. We verify shops but do not own their inventory.'],
      ['Acceptable use', 'Do not misuse the platform, post false listings, try to break its security or use it for unlawful purposes. We may suspend accounts that do.'],
      ['Liability and changes', 'We are not liable for indirect losses beyond what the law requires. We may update these terms, and continued use means you accept the changes. Questions: {{email}}.'],
    ],
    cookies: [
      ['What cookies are', 'Small text files stored on your device that help the site work and remember your choices.'],
      ['Necessary', 'Required for sign-in, your cart and security. They are always on.'],
      ['Analytics', 'Help us understand how the site is used so we can improve it. Used only if you allow them.'],
      ['Marketing', 'Used to show you offers and content that match your interests. Used only if you allow them.'],
      ['Your choices', 'You can accept all, reject the optional cookies or customize them in the cookie banner. You can also delete cookies in your browser settings, but some features may stop working. Questions: {{email}}.'],
    ],
  },
  ar: {
    privacy: [
      ['المعلومات التي نجمعها', 'نجمع البيانات التي تقدّمها عند إنشاء حساب أو تقديم طلب أو حجز إصلاح: الاسم والبريد الإلكتروني ورقم الهاتف وعنوان التوصيل وتفاصيل الجهاز. كما نتلقى بيانات تقنية أساسية مثل نوع المتصفح والصفحات التي تزورها.'],
      ['كيف نستخدمها', 'لمعالجة الطلبات والإصلاحات وتوصيل المنتجات وإرسال تحديثات الطلب وتقديم الدعم ومنع الاحتيال وتحسين الخدمة.'],
      ['المشاركة', 'نشارك فقط ما يلزم مع المتاجر التي تنفّذ طلبك أو إصلاحك ومع شركاء التوصيل. لا نبيع بياناتك الشخصية أبدًا.'],
      ['الأمان والاحتفاظ', 'نحمي بياناتك باتصالات مشفّرة وضوابط وصول، ونحتفظ بها فقط للمدة اللازمة لحسابك أو للالتزامات القانونية أو لحل النزاعات.'],
      ['حقوقك', 'يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت عبر التواصل معنا على {{email}}.'],
    ],
    terms: [
      ['استخدام المنصة', 'باستخدامك Tech-Restore فإنك توافق على هذه الشروط. يجب تقديم معلومات صحيحة والحفاظ على سرية بيانات حسابك.'],
      ['الطلبات والدفع', 'تُعرض الأسعار بعملة المتجر. يتم تأكيد الطلب عندما يقبله المتجر. تظهر طرق الدفع المتاحة، ومنها الدفع عند الاستلام، عند إتمام الشراء.'],
      ['الإصلاح والضمان', 'قد يتغيّر سعر الإصلاح بعد الفحص ويحتاج إلى موافقتك أولًا. يحدد كل متجر شروط الضمان وتُعرض مع المنتج أو الإصلاح.'],
      ['المتاجر والمنتجات', 'المتاجر المستقلة مسؤولة عن منتجاتها وأسعارها وخدماتها. نتحقق من المتاجر لكننا لا نملك مخزونها.'],
      ['الاستخدام المقبول', 'يُمنع إساءة استخدام المنصة أو نشر منتجات مزيفة أو محاولة اختراق أمانها أو استخدامها لأغراض غير قانونية. يحق لنا تعليق الحسابات المخالفة.'],
      ['المسؤولية والتعديلات', 'لا نتحمل مسؤولية الخسائر غير المباشرة إلا بالقدر الذي يفرضه القانون. قد نحدّث هذه الشروط، واستمرارك في الاستخدام يعني قبولك للتعديلات. للاستفسار: {{email}}.'],
    ],
    cookies: [
      ['ما هي ملفات تعريف الارتباط', 'ملفات نصية صغيرة تُخزَّن على جهازك لتساعد الموقع على العمل وتتذكر اختياراتك.'],
      ['الضرورية', 'مطلوبة لتسجيل الدخول والسلة والأمان. وهي مفعّلة دائمًا.'],
      ['التحليلات', 'تساعدنا على فهم استخدام الموقع لتحسينه. لا تُستخدم إلا بموافقتك.'],
      ['التسويق', 'تُستخدم لعرض عروض ومحتوى يناسب اهتماماتك. لا تُستخدم إلا بموافقتك.'],
      ['اختياراتك', 'يمكنك قبول الكل أو رفض الاختيارية أو تخصيصها من شريط ملفات تعريف الارتباط. ويمكنك أيضًا حذفها من إعدادات المتصفح، لكن بعض الميزات قد تتوقف عن العمل. للاستفسار: {{email}}.'],
    ],
  },
  fr: {
    privacy: [
      ['Informations collectées', 'Nous collectons les informations que vous nous donnez lors de la création de votre compte, d’une commande ou d’une réservation de réparation : nom, e-mail, téléphone, adresse de livraison et détails de l’appareil. Nous recevons aussi des données techniques de base, comme le navigateur et les pages visitées.'],
      ['Utilisation', 'Pour traiter les commandes et les réparations, livrer les produits, envoyer les mises à jour, assurer le support, prévenir la fraude et améliorer le service.'],
      ['Partage', 'Nous ne partageons que le nécessaire avec les boutiques qui traitent votre commande ou réparation et avec nos partenaires de livraison. Nous ne vendons jamais vos données personnelles.'],
      ['Sécurité et conservation', 'Nous protégeons vos données par des connexions chiffrées et des contrôles d’accès, et ne les conservons que le temps nécessaire à votre compte, aux obligations légales ou à la résolution de litiges.'],
      ['Vos droits', 'Vous pouvez demander à tout moment l’accès, la correction ou la suppression de vos données en écrivant à {{email}}.'],
    ],
    terms: [
      ['Utilisation de la plateforme', 'En utilisant Tech-Restore, vous acceptez ces conditions. Vous devez fournir des informations exactes et protéger vos identifiants.'],
      ['Commandes et paiements', 'Les prix sont affichés dans la devise de la boutique. Une commande est confirmée lorsque la boutique l’accepte. Les moyens de paiement disponibles, dont le paiement à la livraison, sont indiqués lors du paiement.'],
      ['Réparations et garantie', 'Les devis de réparation peuvent changer après diagnostic et nécessitent d’abord votre accord. Les conditions de garantie sont fixées par chaque boutique et indiquées avec le produit ou la réparation.'],
      ['Boutiques et annonces', 'Les boutiques indépendantes sont responsables de leurs produits, prix et services. Nous vérifions les boutiques mais ne possédons pas leur stock.'],
      ['Utilisation acceptable', 'N’utilisez pas la plateforme de manière abusive, ne publiez pas de fausses annonces, ne tentez pas de contourner sa sécurité et ne l’utilisez pas à des fins illégales. Nous pouvons suspendre les comptes concernés.'],
      ['Responsabilité et modifications', 'Nous ne sommes pas responsables des pertes indirectes au-delà de ce que la loi impose. Nous pouvons modifier ces conditions ; continuer à utiliser le service vaut acceptation. Questions : {{email}}.'],
    ],
    cookies: [
      ['Qu’est-ce qu’un cookie', 'Un petit fichier texte stocké sur votre appareil qui aide le site à fonctionner et à mémoriser vos choix.'],
      ['Nécessaires', 'Indispensables à la connexion, au panier et à la sécurité. Toujours actifs.'],
      ['Statistiques', 'Nous aident à comprendre l’utilisation du site pour l’améliorer. Utilisés uniquement si vous les autorisez.'],
      ['Marketing', 'Servent à vous proposer des offres et contenus adaptés à vos intérêts. Utilisés uniquement si vous les autorisez.'],
      ['Vos choix', 'Vous pouvez tout accepter, refuser les cookies facultatifs ou les personnaliser dans la bannière. Vous pouvez aussi les supprimer dans les paramètres du navigateur, mais certaines fonctions peuvent cesser de marcher. Questions : {{email}}.'],
    ],
  },
};

const FT_CSS = `
  @keyframes ftFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ftRise { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
  .ft-hl, .ft-hl-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .ft-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .ft-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .ft-fade { animation: ftFade .16s ease-out both; }
  .ft-rise { animation: ftRise .22s cubic-bezier(.2,.8,.2,1) both; }
  @media (prefers-reduced-motion: reduce) { .ft-fade, .ft-rise { animation: none; } }
`;
let ftStylesInjected = false;
const injectFtStylesOnce = () => {
  if (ftStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-footer-styles', 'true');
  tag.textContent = FT_CSS;
  document.head.appendChild(tag);
  ftStylesInjected = true;
};
injectFtStylesOnce();

const FOCUS_BASE = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2';

const THEME = {
  light: {
    root: 'border-t-[3px] border-emerald-950 bg-white text-emerald-950',
    title: 'text-emerald-950',
    chip: 'border-2 border-emerald-950 bg-emerald-400 text-emerald-950 [box-shadow:calc(var(--dx)*2px)_2px_0_0_#022c22]',
    social:
      'border-2 border-emerald-950 bg-white text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_#022c22] hover:bg-emerald-400 hover:[box-shadow:calc(var(--dx)*4px)_4px_0_0_#022c22]',
    divider: 'border-emerald-900/30',
    muted: 'text-gray-700',
    sub: 'text-gray-500',
    tagline: 'text-emerald-700',
    link: 'text-gray-800 hover:text-emerald-600',
    linkUnderline: 'group-hover:decoration-emerald-400',
    inline: 'hover:text-emerald-600',
    hl: 'ft-hl',
    focus: `${FOCUS_BASE} focus-visible:outline-emerald-500`,
    modal: 'border-[3px] border-emerald-950 bg-white text-emerald-950 [box-shadow:calc(var(--dx)*8px)_8px_0_0_#022c22]',
    modalRule: 'border-emerald-900/20',
    modalBtn:
      'border-[3px] border-emerald-950 bg-emerald-400 text-emerald-950 [box-shadow:calc(var(--dx)*4px)_4px_0_0_#022c22]',
  },
  dark: {
    root: 'border-t-[3px] border-black bg-[#141414] text-white',
    title: 'text-white',
    chip: 'border-2 border-black bg-[#39ff88] text-black [box-shadow:calc(var(--dx)*2px)_2px_0_0_#000]',
    social:
      'border-2 border-black bg-[#2a2a2a] text-white [box-shadow:calc(var(--dx)*3px)_3px_0_0_#000] hover:bg-[#39ff88] hover:text-black hover:[box-shadow:calc(var(--dx)*4px)_4px_0_0_#000]',
    divider: 'border-neutral-700',
    muted: 'text-neutral-300',
    sub: 'text-neutral-400',
    tagline: 'text-[#39ff88]',
    link: 'text-neutral-200 hover:text-[#39ff88]',
    linkUnderline: 'group-hover:decoration-[#39ff88]',
    inline: 'hover:text-[#39ff88]',
    hl: 'ft-hl-dark',
    focus: `${FOCUS_BASE} focus-visible:outline-[#39ff88]`,
    modal: 'border-[3px] border-black bg-[#2a2a2a] text-white [box-shadow:calc(var(--dx)*8px)_8px_0_0_#000]',
    modalRule: 'border-neutral-600',
    modalBtn:
      'border-[3px] border-black bg-[#39ff88] text-black [box-shadow:calc(var(--dx)*4px)_4px_0_0_#000]',
  },
};

const SOCIALS = [
  { id: 'instagram', href: 'https://www.instagram.com/tech_restoree?xtok=MWlwYjdhbGhzNHE3cw==', Icon: FaInstagram },
  { id: 'facebook', href: 'https://www.facebook.com/profile.php?id=61595846460089', Icon: FaFacebookF },
];

const QUICK_LINKS = [
  { to: '/', Icon: RiHome3Line, key: 'home' },
  { to: '/devices', Icon: RiDeviceLine, key: 'devices' },
  { to: '/track', Icon: RiTruckLine, key: 'trackOrder' },
  { to: '/shops', Icon: RiStore2Line, key: 'shops' },
];

const LEGAL_ITEMS = ['privacy', 'terms', 'cookies'];

const PRESS = 'transition-[transform,box-shadow,background-color,color] duration-150 hover:-translate-y-px active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none';

const SocialBtn = memo(({ href, Icon, label, th }) => (
  <a
    href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
    className={`flex h-11 w-11 items-center justify-center ${PRESS} ${th.social} ${th.focus}`}
  >
    <Icon className="h-[18px] w-[18px]" />
  </a>
));

const FooterLink = memo(({ to, Icon, label, th }) => (
  <li>
    <Link to={to} className={`group flex min-h-11 items-center gap-3 py-1 text-sm font-semibold transition-colors duration-150 ${th.link} ${th.focus}`}>
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none ${th.chip}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className={`min-w-0 truncate group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 ${th.linkUnderline}`}>{label}</span>
    </Link>
  </li>
));

const ContactRow = memo(({ Icon, th, children }) => (
  <li className="flex items-start gap-3">
    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center ${th.chip}`}><Icon className="h-4 w-4" /></span>
    <div className="min-w-0 pt-1">{children}</div>
  </li>
));

const ColumnTitle = memo(({ th, children }) => (
  <h3 className={`mb-5 text-sm font-extrabold uppercase tracking-wide rtl:tracking-normal ${th.title}`}>
    <span className={th.hl}>{children}</span>
  </h3>
));

const LegalButton = memo(({ id, label, onOpen, th }) => (
  <button
    type="button" onClick={() => onOpen(id)} aria-haspopup="dialog"
    className={`min-h-11 font-semibold transition-colors duration-150 hover:underline hover:underline-offset-4 ${th.muted} ${th.inline} ${th.focus}`}
  >
    {label}
  </button>
));

const LegalModal = memo(({ title, sections, email, closeLabel, language, th, onClose }) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();
  const isAr = language === 'ar';

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll('button:not([disabled]), a[href]');
      if (!nodes || !nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, [onClose]);

  const onBackdrop = useCallback((e) => { if (e.target === e.currentTarget) onClose(); }, [onClose]);

  return createPortal(
    <div
      dir={languageDirection(language)}
      lang={language}
      onMouseDown={onBackdrop}
      className={`ft-fade fixed inset-0 z-[1200] flex items-end justify-center bg-black/60 p-4 [--dx:1] rtl:[--dx:-1] sm:items-center ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`ft-rise flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden ${th.modal}`}
      >
        <div className={`flex items-center justify-between gap-3 border-b-2 px-5 py-4 ${th.modalRule}`}>
          <h2 id={titleId} className="min-w-0 text-lg font-extrabold uppercase tracking-tight rtl:tracking-normal sm:text-xl">
            <span className={`truncate ${th.hl}`}>{title}</span>
          </h2>
          <button
            ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel}
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center ${PRESS} ${th.social} ${th.focus}`}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          {sections.map(([heading, text]) => (
            <section key={heading}>
              <h3 className="mb-1.5 text-sm font-extrabold uppercase tracking-wide rtl:tracking-normal">{heading}</h3>
              <p className={`text-sm leading-relaxed ${th.muted}`}>{text.split('{{email}}').join(email)}</p>
            </section>
          ))}
        </div>

        <div className={`border-t-2 px-5 py-4 ${th.modalRule}`}>
          <button
            type="button" onClick={onClose}
            className={`inline-flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-sm font-extrabold uppercase transition-[transform,box-shadow] duration-150 active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none sm:w-auto sm:min-w-[9rem] ${th.modalBtn} ${th.focus}`}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});

const Footer = ({ darkMode = false }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';
  const th = darkMode ? THEME.dark : THEME.light;
  const [openDoc, setOpenDoc] = useState(null);

  const tx = useMemo(() => {
    const out = {};
    Object.keys(FOOTER_PATHS).forEach((k) => { out[k] = getFooterTranslation(language, k); });
    return out;
  }, [language]);

  const openLegal = useCallback((id) => setOpenDoc(id), []);
  const closeLegal = useCallback(() => setOpenDoc(null), []);

  const phone = tx.phone;
  const email = tx.email;
  const telHref = `tel:${phone.replace(/[^\d+]/g, '').slice(0, 20)}`;
  const year = useMemo(() => new Date().getFullYear(), []);
  const sections = openDoc ? (LEGAL_DOCS[language]?.[openDoc] || LEGAL_DOCS.en[openDoc]) : null;

  return (
    <footer
      dir={languageDirection(language)}
      lang={language}
      className={`relative overflow-hidden [content-visibility:auto] [contain-intrinsic-size:auto_520px] ${isAr ? 'font-cairo' : 'font-jakarta'} ${th.root}`}
    >
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 [--dx:1] rtl:[--dx:-1] sm:px-6 sm:pt-16 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div className="relative space-y-5 sm:col-span-2 lg:col-span-1">
            <FooterArt darkMode={darkMode} className="pointer-events-none absolute -top-6 end-0 hidden h-32 w-48 sm:block lg:hidden xl:block" />
            <div className="relative flex items-center gap-3">
              <img src={logo} alt={tx.name} width={48} height={48} className="h-12 w-auto p-1" loading="lazy" decoding="async" />
              <div>
                <p className={`text-lg font-extrabold uppercase leading-tight ${th.title}`}>{tx.name}</p>
                <p className={`text-xs font-semibold ${th.tagline}`}>{tx.tagline}</p>
              </div>
            </div>

            <p className={`relative max-w-xs text-sm leading-relaxed ${th.muted}`}>{tx.description}</p>

            <div role="group" aria-label={tx.followUs} className="relative flex gap-3 pt-1 pe-1">
              {SOCIALS.map(({ id, ...s }) => <SocialBtn key={id} label={tx[id]} th={th} {...s} />)}
            </div>
          </div>

          <nav aria-label={tx.quickLinks}>
            <ColumnTitle th={th}>{tx.quickLinks}</ColumnTitle>
            <ul className="space-y-1">
              {QUICK_LINKS.map(({ key, ...l }) => <FooterLink key={l.to} label={tx[key]} th={th} {...l} />)}
            </ul>
          </nav>

          <div>
            <ColumnTitle th={th}>{tx.contactUs}</ColumnTitle>
            <ul className="space-y-4">
              <ContactRow Icon={RiMapPin2Line} th={th}>
                <span className={`text-sm ${th.muted}`}>{tx.address}</span>
              </ContactRow>
              <ContactRow Icon={FiPhone} th={th}>
                <a href={telHref} dir="ltr" className={`text-sm transition-colors duration-150 hover:underline ${th.muted} ${th.inline} ${th.focus}`}>{phone}</a>
              </ContactRow>
              <ContactRow Icon={FiMail} th={th}>
                <a href={`mailto:${email}`} className={`break-all text-sm transition-colors duration-150 hover:underline ${th.muted} ${th.inline} ${th.focus}`}>{email}</a>
              </ContactRow>
              <ContactRow Icon={FiClock} th={th}>
                <p className={`text-sm ${th.muted}`}>{tx.support}</p>
                <p className={`mt-0.5 text-xs ${th.sub}`}>{tx.alwaysHelp}</p>
              </ContactRow>
            </ul>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-between gap-4 border-t-2 border-dotted pt-6 text-sm sm:flex-row ${th.divider}`}>
          <p className={`text-center ${th.muted}`}>
            {tx.copyright.replace('{{year}}', year)}
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {LEGAL_ITEMS.map((id) => <LegalButton key={id} id={id} label={tx[id]} onOpen={openLegal} th={th} />)}
          </div>
        </div>
      </div>

      {openDoc && sections && (
        <LegalModal
          title={tx[openDoc]} sections={sections} email={email} closeLabel={tx.close}
          language={language} th={th} onClose={closeLegal}
        />
      )}
    </footer>
  );
};

export default memo(Footer);