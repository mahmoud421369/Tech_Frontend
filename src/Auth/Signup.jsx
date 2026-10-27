import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import {
  FiUser, FiMail, FiPhone, FiLock, FiHome, FiMapPin, FiShoppingBag, FiFileText, FiTruck,
  FiBriefcase, FiClipboard, FiShield, FiArrowLeft, FiEye, FiEyeOff, FiAlertTriangle, FiChevronDown,
} from 'react-icons/fi';
import api from '../common/api/api';
import logo from '../common/images/tech-restore-logo.webp';
import { UI3D_CSS } from '../components/user/Ui3D';
import { useLangFont } from '../components/user/ListingKit';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b5563;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e5e7eb;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-field-err{border-color:#e11d48;box-shadow:3px 3px 0 #e11d48}
.nb-field:has(:disabled){opacity:.6}
.nb-alert{background:var(--nb-card);color:var(--nb-ink);border:2px solid #e11d48;box-shadow:3px 3px 0 #e11d48}
.nb-link{font-weight:700;text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:2px;text-underline-offset:4px}
.nb select option{background:var(--nb-card);color:var(--nb-ink)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){.nb-btn,.anim-float,.anim-fade-up{transition:none;animation:none!important}}
`;
const PAGE_CSS = `${UI3D_CSS}\n${EXTRAS_CSS}\n${NB_CSS}`;

const NS = { en: enTranslations.signup, ar: arTranslations.signup, fr: frTranslations.signup };
const T_CACHE = {};
const getT = (language) => (T_CACHE[language] ||= (key, vars) => {
  let s = NS[language]?.[key] || NS.en?.[key] || key;
  if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
});

const SUCCESS_DELAY_MS = 1500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const encoder = new TextEncoder();
const byteLength = (s) => encoder.encode(s || '').length;
const passwordStrengthError = (v, t) => {
  if (/\s/.test(v)) return t('errNoSpaces');
  if (!/[a-z]/.test(v)) return t('errLower');
  if (!/[A-Z]/.test(v)) return t('errUpper');
  if (!/\d/.test(v)) return t('errNumber');
  if (!/[^A-Za-z0-9]/.test(v)) return t('errSymbol');
  return '';
};

const validators = {
  email: (v, t) => (!v.trim() ? t('errEmailRequired') : !EMAIL_REGEX.test(v) ? t('errEmailInvalid') : ''),
  phone: (v, t) => (!v.trim() ? t('errPhoneRequired') : PHONE_REGEX.test(v.replace(/\D/g, '')) ? '' : t('errPhoneInvalid')),
  password: (v, t) => (!v ? t('errPasswordRequired')
    : v.length < MIN_PASSWORD_LENGTH ? t('errPasswordMin', { min: MIN_PASSWORD_LENGTH })
      : byteLength(v) > MAX_PASSWORD_BYTES ? t('errPasswordMax', { max: MAX_PASSWORD_BYTES })
        : passwordStrengthError(v, t)),
};
const validateField = (name, value = '', t) => (validators[name] ? validators[name](value, t) : !String(value).trim() ? t('errRequired') : '');

const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

const Spinner = () => <span aria-hidden="true" className="inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />;

const ErrorBanner = memo(({ message }) => (
  <div role="alert" className="nb-alert anim-fade-up flex items-start gap-2.5 p-3">
    <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
    <p className="min-w-0 text-sm font-bold leading-snug">{message}</p>
  </div>
));

const AuthInput = memo(({ id, label, icon: Icon, error, trailing, ...rest }) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>}
    <div className={`nb-field flex h-12 items-center gap-2 ps-3 ${trailing ? 'pe-2' : 'pe-3'} ${error ? 'nb-field-err' : ''}`}>
      {Icon && <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />}
      <input
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        {...rest}
      />
      {trailing}
    </div>
    {error && <p id={`${id}-err`} className="flex items-center gap-1 text-xs font-bold text-rose-500"><FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{error}</p>}
  </div>
));

const SelectField = memo(({ id, label, icon: Icon, error, children, ...rest }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>
    <div className={`nb-field relative flex h-12 items-center gap-2 ps-3 pe-3 ${error ? 'nb-field-err' : ''}`}>
      <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pe-6 text-sm font-semibold outline-none" {...rest}>
        {children}
      </select>
      <FiChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 h-4 w-4" />
    </div>
    {error && <p id={`${id}-err`} role="alert" className="flex items-center gap-1 text-xs font-bold text-rose-500"><FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{error}</p>}
  </div>
));

const EyeToggle = memo(({ shown, onToggle, t }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? t('hidePassword') : t('showPassword')} aria-pressed={shown}
    className="nb-ic flex h-8 w-8 flex-shrink-0 items-center justify-center focus-visible:outline focus-visible:outline-2">
    {shown ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
  </button>
));

const SHOP_TYPE_OPTIONS = [
  { value: 'REPAIRER', labelKey: 'shopTypeRepairer' },
  { value: 'SELLER', labelKey: 'shopTypeSeller' },
  { value: 'BOTH', labelKey: 'shopTypeBoth' },
];

const f = (name, label, icon, placeholder = label, extra = {}) => ({ name, label, icon, placeholder, ...extra });
const NAME_F = (ac) => f('name', 'fullName', FiUser, 'fullName', { autoComplete: ac });
const EMAIL_F = f('email', 'email', FiMail, 'phEmail', { type: 'email', autoComplete: 'email' });
const PHONE_F = f('phone', 'phone', FiPhone, 'phone', { type: 'tel', autoComplete: 'tel' });

const ROLES = {
  user: {
    labelKey: 'roleUser', icon: FiUser, endpoint: '/api/auth/register/user', ctaKey: 'ctaUser',
    fields: [
      f('first_name', 'firstName', FiUser, 'firstName', { autoComplete: 'given-name' }),
      f('last_name', 'lastName', FiUser, 'lastName', { autoComplete: 'family-name' }),
      EMAIL_F, PHONE_F,
    ],
  },
  shop: {
    labelKey: 'roleShop', icon: FiShoppingBag, endpoint: '/api/auth/register/shop', ctaKey: 'ctaShop',
    fields: [
      f('name', 'shopName', FiShoppingBag, 'shopName'),
      EMAIL_F, PHONE_F,
      f('description', 'description', FiFileText, 'phDescription'),
      f('shopType', 'shopType', FiShoppingBag, 'phSelectType', { type: 'select', options: SHOP_TYPE_OPTIONS }),
      f('state', 'state', FiMapPin, 'phState'),
      f('city', 'city', FiMapPin, 'phCity'),
      f('street', 'street', FiMapPin, 'phStreet'),
      f('building', 'building', FiMapPin, 'phBuilding'),
    ],
    toPayload: ({ state, city, street, building, ...rest }) => ({ ...rest, shopAddress: { state, city, street, building, isDefault: true } }),
  },
  delivery: {
    labelKey: 'roleDelivery', icon: FiTruck, endpoint: '/api/auth/register/delivery', ctaKey: 'ctaDelivery',
    fields: [NAME_F(), EMAIL_F, PHONE_F, f('address', 'address', FiHome, 'address')],
  },
  assigner: {
    labelKey: 'roleAssigner', icon: FiClipboard, endpoint: '/api/auth/register/assigner', ctaKey: 'ctaAssigner',
    fields: [NAME_F('name'), f('department', 'department', FiBriefcase, 'department'), EMAIL_F, PHONE_F],
  },
};
const ROLE_KEYS = Object.keys(ROLES);

const initialValues = () => Object.fromEntries(ROLE_KEYS.map((k) => [k, Object.fromEntries([...ROLES[k].fields.map((x) => [x.name, '']), ['password', '']])]));
const emptyMap = () => Object.fromEntries(ROLE_KEYS.map((k) => [k, {}]));

const OTP_LEN = 6;
const EMPTY_OTP = Array(OTP_LEN).fill('');

const OTPStep = memo(({ email, onSuccess, onBack, t }) => {
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);
  const busyRef = useRef(false);
  const abortRef = useRef(null);

  const otpCode = useMemo(() => otp.join(''), [otp]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const change = useCallback((i, v) => {
    if (!/^\d*$/.test(v)) return;
    setOtp((prev) => { const n = [...prev]; n[i] = v.slice(-1); return n; });
    setError('');
    if (v && i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus();
  }, []);

  const keyDown = useCallback((i, e) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) inputsRef.current[i - 1]?.focus();
  }, []);

  const paste = useCallback((e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!digits) return;
    e.preventDefault();
    const n = [...EMPTY_OTP]; digits.split('').forEach((c, i) => { n[i] = c; });
    setOtp(n); setError('');
    inputsRef.current[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  }, []);

  const verify = useCallback(async () => {
    if (busyRef.current) return;
    if (otpCode.length !== OTP_LEN) { setError(t('otpIncomplete')); return; }
    busyRef.current = true;
    abortRef.current = new AbortController();
    setLoading(true);
    let ok = false;
    try {
      await api.post('/api/auth/verify-email', { email, optCode: otpCode }, { signal: abortRef.current.signal });
      ok = true;
      toast({ icon: 'success', title: t('verifiedTitle'), text: t('verifiedText'), timer: 2500 });
      onSuccess();
    } catch (err) {
      if (!isCanceled(err)) setError(err.response?.data?.message || t('otpInvalid'));
    } finally {
      if (!ok) { busyRef.current = false; setLoading(false); }
    }
  }, [otpCode, email, onSuccess, t]);

  return (
    <div className="anim-fade-up space-y-4">
      <div className="space-y-3 text-center">
        <span className="nb-chip nb-chip-a mx-auto !p-3"><FiShield aria-hidden="true" className="h-7 w-7" /></span>
        <div>
          <h3 className="text-lg font-extrabold uppercase"><span className="nb-ul">{t('otpTitle')}</span></h3>
          <p className="nb-muted mt-3 text-sm">{t('otpSent')} <b className="nb-ic break-all" dir="ltr">{email}</b></p>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={paste}>
        {otp.map((d, i) => (
          <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1}
            value={d} aria-label={t('digit', { n: i + 1 })} autoFocus={i === 0}
            onChange={(e) => change(i, e.target.value)} onKeyDown={(e) => keyDown(i, e)}
            className={`nb-field h-12 w-10 bg-transparent px-0 text-center text-lg font-extrabold outline-none sm:w-11 ${error ? 'nb-field-err' : ''}`} />
        ))}
      </div>
      {error && <p role="alert" className="text-center text-xs font-bold text-rose-500">{error}</p>}
      <button type="button" onClick={verify} disabled={loading || otpCode.length !== OTP_LEN} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">
        {loading ? <><Spinner /> {t('verifying')}</> : t('verify')}
      </button>
      <button type="button" onClick={onBack} className="nb-link flex items-center gap-1.5 text-sm">
        <FiArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t('back')}
      </button>
    </div>
  );
});

const RoleForm = memo(({ role, values, errors, touched, onChange, onBlur, onSubmit, loading, showPw, onTogglePw, t }) => {
  const cfg = ROLES[role];
  const errOf = (n) => (touched[n] ? errors[n] || '' : '');
  const pwToggle = useMemo(() => <EyeToggle shown={showPw} onToggle={onTogglePw} t={t} />, [showPw, onTogglePw, t]);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={loading}>
      <div className="grid gap-4 sm:grid-cols-2">
        {cfg.fields.map(({ name, label, icon, placeholder, type = 'text', autoComplete, options }) => {
          const id = `${role}-${name}`;
          const error = errOf(name);
          if (type === 'select') {
            return (
              <SelectField key={name} id={id} name={name} label={t(label)} icon={icon} error={error}
                value={values[name]} disabled={loading} onChange={onChange} onBlur={onBlur}>
                <option value="">{t(placeholder)}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
              </SelectField>
            );
          }
          return (
            <AuthInput key={name} id={id} name={name} label={t(label)} icon={icon} type={type}
              value={values[name]} placeholder={t(placeholder)} autoComplete={autoComplete} disabled={loading}
              dir={type === 'email' || type === 'tel' ? 'ltr' : undefined}
              onChange={onChange} onBlur={onBlur} error={error} />
          );
        })}
      </div>

      <AuthInput id={`${role}-password`} name="password" label={t('passwordLabel')} icon={FiLock}
        type={showPw ? 'text' : 'password'} value={values.password} placeholder={t('passwordPlaceholder')} autoComplete="new-password" disabled={loading}
        onChange={onChange} onBlur={onBlur} error={errOf('password')} trailing={pwToggle} />

      {errors.general && <ErrorBanner message={errors.general} />}
      <button type="submit" disabled={loading} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase sm:text-base">
        {loading ? <><Spinner /> {t('creating')}</> : t(cfg.ctaKey)}
      </button>
    </form>
  );
});

const Signup = ({ darkMode = false }) => {
  const language = useAppLanguage();
  const t = getT(language);
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(emptyMap);
  const [touched, setTouched] = useState(emptyMap);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const busyRef = useRef(false);
  const abortRef = useRef(null);
  const leaveTimer = useRef();

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = t('pageTitle'); }, [t]);
  useEffect(() => () => { abortRef.current?.abort(); clearTimeout(leaveTimer.current); }, []);

  const patch = useCallback((setter, r, partial) => setter((p) => ({ ...p, [r]: { ...p[r], ...partial } })), []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    patch(setValues, role, { [name]: value });
    patch(setErrors, role, { [name]: validateField(name, value, t), general: '' });
  }, [role, patch, t]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    patch(setTouched, role, { [name]: true });
    patch(setErrors, role, { [name]: validateField(name, value, t) });
  }, [role, patch, t]);

  const register = useCallback(async (cfg, payload, r) => {
    if (busyRef.current) return;
    busyRef.current = true;
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      await api.post(cfg.endpoint, payload, { signal: abortRef.current.signal });
      setPendingEmail(payload.email);
      setOtpStep(true);
    } catch (err) {
      if (isCanceled(err)) return;
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 409) {
        const msg = serverMsg || t('emailExists');
        patch(setErrors, r, { email: msg, general: '' });
        patch(setTouched, r, { email: true });
        toast({ icon: 'error', title: t('emailExistsTitle'), text: msg, timer: 3500 });
      } else {
        const msg = serverMsg || t('registerFailed');
        patch(setErrors, r, { general: msg });
        toast({ icon: 'error', title: t('registerFailedTitle'), text: msg, timer: 3500 });
      }
    } finally { busyRef.current = false; setLoading(false); }
  }, [patch, t]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (busyRef.current) return;
    const cfg = ROLES[role];
    const vals = values[role];
    const names = [...cfg.fields.map((x) => x.name), 'password'];
    const errs = {};
    names.forEach((n) => { const m = validateField(n, vals[n], t); if (m) errs[n] = m; });
    setTouched((p) => ({ ...p, [role]: Object.fromEntries(names.map((n) => [n, true])) }));
    setErrors((p) => ({ ...p, [role]: errs }));
    if (Object.keys(errs).length) return;
    register(cfg, cfg.toPayload ? cfg.toPayload(vals) : vals, role);
  }, [role, values, register, t]);

  const togglePw = useCallback(() => setShowPw((p) => !p), []);
  const handleOtpSuccess = useCallback(() => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => navigate('/login'), SUCCESS_DELAY_MS);
  }, [navigate]);
  const handleOtpBack = useCallback(() => { setOtpStep(false); setPendingEmail(''); }, []);

  return (
    <div
      dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} relative min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
    >
      <style>{PAGE_CSS}</style>
      <Toaster darkMode={darkMode} />

      <header className="nb-bg fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Tech Restore" className="flex-shrink-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[color:var(--nb-accent)]">
            <img src={logo} alt="Tech Restore" className="h-9 w-auto" width={120} height={36} decoding="async" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="nb-muted hidden text-sm font-semibold sm:block">{t('haveAccount')}</span>
            <Link to="/login" className="nb-btn nb-btn-a px-4 py-2 text-xs uppercase sm:text-sm">{t('signIn')}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-8 px-4 pb-12 pt-24 sm:px-6 md:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-28">
        <div className="hidden md:sticky md:top-28 md:block">
          <div className="mx-auto max-w-lg p-6">
            <IsoIllustration type="track" tone="emerald" onGreen={false} darkMode={darkMode} className="aspect-square w-full" />
          </div>
        </div>

        <div className="anim-fade-up mx-auto w-full max-w-xl space-y-6 md:mx-0">
          <div>
            <span className="nb-bar" aria-hidden="true" />
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
              {t('titleBefore')}{' '}<span className="nb-ul">{t('titleAccent')}</span>
            </h1>
            <p className="mt-3 text-sm opacity-80 sm:text-base">{t('subtitle')}</p>
          </div>

          <div className="nb-card space-y-5 p-4 sm:p-6">
            {otpStep ? (
              <OTPStep email={pendingEmail} onSuccess={handleOtpSuccess} onBack={handleOtpBack} t={t} />
            ) : (
              <>
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide">{t('chooseRole')}</p>
                  <div role="radiogroup" aria-label={t('chooseRole')} className="grid grid-cols-2 gap-3">
                    {ROLE_KEYS.map((k) => {
                      const { labelKey, icon: Icon } = ROLES[k];
                      const on = role === k;
                      return (
                        <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setRole(k)}
                          className={`nb-btn justify-start px-3 py-2.5 text-start text-xs uppercase sm:text-sm ${on ? 'nb-btn-on' : ''}`}>
                          <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{t(labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <RoleForm
                  key={role} role={role} values={values[role]} errors={errors[role]} touched={touched[role]}
                  onChange={handleChange} onBlur={handleBlur} onSubmit={handleSubmit} loading={loading}
                  showPw={showPw} onTogglePw={togglePw} t={t}
                />

                <p className="nb-muted text-center text-sm font-semibold">
                  {t('haveAccount')} <Link to="/login" className="nb-link text-[color:var(--nb-ink)]">{t('loginHere')}</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export { queryClient };
export default memo(Signup);