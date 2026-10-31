import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import {
  FiUser, FiMail, FiPhone, FiLock, FiHome, FiMapPin, FiShoppingBag, FiFileText, FiTruck,
  FiBriefcase, FiClipboard, FiShield, FiArrowLeft, FiEye, FiEyeOff, FiAlertTriangle, FiChevronDown,
} from 'react-icons/fi';
import api from '../common/api/api';
import logo from '../common/images/tech-restore-logo.webp';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { LogoDropzone, LOGO_CSS, getLogoT } from '../components/shop/LogoKit';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const AUTH_CSS = `
.au-root{--dx:1;--nb-bg:var(--page);--nb-card:var(--card);--nb-ink:var(--txt);--nb-muted:var(--mut);--nb-line:var(--ink);--nb-shadow:var(--sh);--nb-gray:var(--soft);--nb-accent:var(--acc);--nb-btn:var(--acc);--nb-on:#022c22}
.au-root[dir=rtl]{--dx:-1}
.au-root select option{background:var(--card);color:var(--txt)}
.au-pattern{--p1:rgba(4,38,26,.1);--p2:rgba(16,185,129,.1);background-image:radial-gradient(circle at 2px 2px,var(--p1) 1.6px,transparent 1.8px),repeating-linear-gradient(135deg,var(--p2) 0 2px,transparent 2px 18px);background-size:22px 22px,auto}
.au-pattern-dark{--p1:rgba(57,255,136,.12);--p2:rgba(57,255,136,.05)}
.au-hl,.au-hl-dark{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.au-hl{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
.au-hl-dark{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
@keyframes auIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.au-in{animation:auIn .28s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*50ms)}
@keyframes auPop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.au-pop{animation:auPop .16s ease-out both}
@keyframes auShake{0%,100%{transform:none}25%{transform:translateX(-5px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
.au-shake{animation:auShake .28s ease-in-out}
@keyframes auErr{0%{opacity:0;transform:translateX(-6px)}30%{opacity:1;transform:translateX(5px)}55%{transform:translateX(-3px)}80%{transform:translateX(2px)}100%{opacity:1;transform:none}}
.au-err{animation:auErr .3s ease-out both}
.nb-muted{color:var(--mut)}
.nb-ic{color:var(--icon)}
.nb-line{border-color:var(--ink)}
.nb-gray{background:var(--soft)}
.nb-bg{background:var(--page)}
.nb-card{background:var(--card);border:2px solid var(--ink);box-shadow:5px 5px 0 var(--sh)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--card);color:var(--txt);border:2px solid var(--ink);box-shadow:3px 3px 0 var(--sh);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--sh)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--sh)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--acc);color:#022c22}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--acc);outline-offset:2px}
.nb-field{background:var(--field);color:var(--txt);border:2px solid var(--ink);box-shadow:3px 3px 0 var(--sh)}
.nb-field-err{border-color:var(--err);box-shadow:3px 3px 0 var(--err)}
.nb-link{font-weight:700;text-decoration:underline;text-decoration-color:var(--acc);text-decoration-thickness:2px;text-underline-offset:4px}
@media (prefers-reduced-motion:reduce){.au-in,.au-pop,.au-shake,.au-err{animation:none}.nb-btn{transition:none}}
`;

const injectOnce = (key, css) => {
  if (typeof document === 'undefined' || document.querySelector(`style[data-${key}]`)) return;
  const tag = document.createElement('style');
  tag.setAttribute(`data-${key}`, '');
  tag.textContent = css;
  document.head.appendChild(tag);
};
injectOnce('auth-styles', `${EXTRAS_CSS}\n${AUTH_CSS}`);
injectOnce('logo-styles', LOGO_CSS);

const THEME = {
  light: '[--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--icon:#059669] [--card:#ffffff] [--field:#ffffff] [--txt:#022c22] [--mut:#4b5563] [--soft:#f3f4f6] [--page:#f9fafb] [--err:#e11d48]',
  dark: '[--ink:#000000] [--sh:#000000] [--acc:#39ff88] [--icon:#39ff88] [--card:#2a2a2a] [--field:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--soft:#1e1e1e] [--page:#141414] [--err:#fb7185]',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const CARD = 'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--card)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]';
const BTN = `inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] font-extrabold [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow,opacity] duration-150 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*5px)_6px_0_0_var(--sh)] active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] disabled:pointer-events-none disabled:opacity-45 ${FOCUS}`;
const PRIMARY = `${BTN} bg-[color:var(--acc)] text-emerald-950`;
const SECONDARY = `${BTN} bg-[color:var(--card)] text-[color:var(--txt)]`;
const ICON_TILE = 'inline-flex flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';
const FIELD = 'flex h-12 items-center gap-2 rounded-lg border-2 bg-[color:var(--field)] text-[color:var(--txt)] ps-3 transition-[box-shadow,border-color,opacity] duration-150 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]';
const FIELD_OK = 'border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';
const FIELD_BAD = 'au-shake border-[color:var(--err)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--err)]';
const OTP_BOX = `h-12 w-10 rounded-lg border-2 bg-[color:var(--field)] px-0 text-center text-lg font-extrabold text-[color:var(--txt)] outline-none transition-[box-shadow] duration-150 sm:w-11 ${FOCUS}`;
const LINK = `inline-flex min-h-9 cursor-pointer items-center gap-1.5 font-bold text-[color:var(--txt)] underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 ${FOCUS}`;

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

const MULTIPART_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
  transformRequest: [(data) => data],
  timeout: 120_000,
};
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
const strengthOf = (v) => (v
  ? [v.length >= MIN_PASSWORD_LENGTH, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length
  : 0);

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

const InlineError = memo(({ message }) => (
  <div role="alert" className="au-err flex items-start gap-2 text-[color:var(--err)]">
    <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
    <p className="min-w-0 text-sm font-bold leading-snug">{message}</p>
  </div>
));

const FieldError = memo(({ id, role, children }) => (
  <p id={id} role={role} className="au-err flex items-center gap-1 text-xs font-bold text-[color:var(--err)]">
    <FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{children}
  </p>
));

const StrengthMeter = memo(({ score }) => (
  <div className="flex gap-1.5" aria-hidden="true">
    {[1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`h-2 flex-1 rounded-full border-2 border-[color:var(--ink)] transition-colors duration-200 motion-reduce:transition-none ${score >= i ? 'bg-[color:var(--acc)]' : 'bg-[color:var(--soft)]'}`}
      />
    ))}
  </div>
));

const AuthInput = memo(({ id, label, icon: Icon, error, trailing, ...rest }) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>}
    <div className={`${FIELD} ${trailing ? 'pe-2' : 'pe-3'} ${rest.disabled ? 'opacity-60' : ''} ${error ? FIELD_BAD : FIELD_OK}`}>
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--icon)]" />}
      <input
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        {...rest}
      />
      {trailing}
    </div>
    {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
  </div>
));

const SelectField = memo(({ id, label, icon: Icon, error, children, ...rest }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>
    <div className={`${FIELD} relative pe-3 ${rest.disabled ? 'opacity-60' : ''} ${error ? FIELD_BAD : FIELD_OK}`}>
      <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--icon)]" />
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pe-6 text-sm font-semibold outline-none" {...rest}>
        {children}
      </select>
      <FiChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 h-4 w-4" />
    </div>
    {error && <FieldError id={`${id}-err`} role="alert">{error}</FieldError>}
  </div>
));

const EyeToggle = memo(({ shown, onToggle, t }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? t('hidePassword') : t('showPassword')} aria-pressed={shown}
    className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-[color:var(--icon)] transition-transform duration-150 active:scale-90 ${FOCUS}`}>
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

const shopToFormData = ({ state, city, street, building, ...rest }, logoFile) => {
  const fd = new FormData();
  Object.entries(rest).forEach(([k, v]) => fd.append(k, v));
  fd.append('shopAddress.state', state);
  fd.append('shopAddress.city', city);
  fd.append('shopAddress.street', street);
  fd.append('shopAddress.building', building);
  fd.append('shopAddress.isDefault', 'true');
  if (logoFile) fd.append('logo', logoFile, logoFile.name);
  return fd;
};

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
    toPayload: shopToFormData,
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

const OTPStep = memo(({ email, onSuccess, onBack, t, darkMode }) => {
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
    <div className="au-pop space-y-4">
      <div className="space-y-3 text-center">
        <span className={`${ICON_TILE} mx-auto h-16 w-16`}><FiShield aria-hidden="true" className="h-8 w-8" /></span>
        <div>
          <h3 className="text-lg font-extrabold uppercase"><span className={darkMode ? 'au-hl-dark' : 'au-hl'}>{t('otpTitle')}</span></h3>
          <p className="mt-3 text-sm font-medium text-[color:var(--mut)]">{t('otpSent')} <b className="break-all text-[color:var(--icon)]" dir="ltr">{email}</b></p>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={paste}>
        {otp.map((d, i) => (
          <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1}
            value={d} aria-label={t('digit', { n: i + 1 })} autoFocus={i === 0}
            onChange={(e) => change(i, e.target.value)} onKeyDown={(e) => keyDown(i, e)}
            className={`${OTP_BOX} ${error ? 'au-shake border-[color:var(--err)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--err)]' : 'border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]'}`} />
        ))}
      </div>
      {error && <p role="alert" className="au-err text-center text-xs font-bold text-[color:var(--err)]">{error}</p>}
      <button type="button" onClick={verify} disabled={loading || otpCode.length !== OTP_LEN} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
        {loading ? <><Spinner /> {t('verifying')}</> : t('verify')}
      </button>
      <button type="button" onClick={onBack} className={`${LINK} text-sm`}>
        <FiArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t('back')}
      </button>
    </div>
  );
});

const RoleForm = memo(({ role, values, errors, touched, onChange, onBlur, onSubmit, loading, showPw, onTogglePw, t, language, logoFile, onLogoChange }) => {
  const cfg = ROLES[role];
  const errOf = (n) => (touched[n] ? errors[n] || '' : '');
  const pwToggle = useMemo(() => <EyeToggle shown={showPw} onToggle={onTogglePw} t={t} />, [showPw, onTogglePw, t]);
  const score = useMemo(() => strengthOf(values.password), [values.password]);

  return (
    <form onSubmit={onSubmit} noValidate className="au-pop space-y-4" aria-busy={loading}>
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

      {role === 'shop' && (
        <div className="space-y-1.5">
          <label htmlFor="shop-logo" className="block text-xs font-extrabold uppercase tracking-wide">{getLogoT(language).label}</label>
          <LogoDropzone id="shop-logo" file={logoFile} onChange={onLogoChange} disabled={loading} language={language} />
        </div>
      )}

      <div className="space-y-2.5">
        <AuthInput id={`${role}-password`} name="password" label={t('passwordLabel')} icon={FiLock}
          type={showPw ? 'text' : 'password'} value={values.password} placeholder={t('passwordPlaceholder')} autoComplete="new-password" disabled={loading}
          onChange={onChange} onBlur={onBlur} error={errOf('password')} trailing={pwToggle} />
        {values.password && <StrengthMeter score={score} />}
      </div>

      {errors.general && <InlineError message={errors.general} />}
      <button type="submit" disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase sm:text-base`}>
        {loading ? <><Spinner /> {t('creating')}</> : t(cfg.ctaKey)}
      </button>
    </form>
  );
});

const Signup = ({ darkMode = false }) => {
  const language = useAppLanguage();
  const t = getT(language);
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
  const [logoFile, setLogoFile] = useState(null);
  const busyRef = useRef(false);
  const abortRef = useRef(null);
  const leaveTimer = useRef();

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

  const register = useCallback(async (cfg, payload, r, email) => {
    if (busyRef.current) return;
    busyRef.current = true;
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const config = payload instanceof FormData
        ? { ...MULTIPART_CONFIG, signal: abortRef.current.signal }
        : { signal: abortRef.current.signal };
      const res = await api.post(cfg.endpoint, payload, config);
      if (res?.data?.logoWarning) {
        const lt = getLogoT(language);
        toast({ icon: 'warning', title: lt.warnTitle, text: lt.warn, timer: 5000 });
      }
      setPendingEmail(email);
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
  }, [patch, t, language]);

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
    register(cfg, cfg.toPayload ? cfg.toPayload(vals, logoFile) : vals, role, vals.email);
  }, [role, values, logoFile, register, t]);

  const togglePw = useCallback(() => setShowPw((p) => !p), []);
  const handleOtpSuccess = useCallback(() => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => navigate('/login'), SUCCESS_DELAY_MS);
  }, [navigate]);
  const handleOtpBack = useCallback(() => { setOtpStep(false); setPendingEmail(''); }, []);

  return (
    <div
      dir={languageDirection(language)} lang={language}
      className={`au-root au-pattern nb ${darkMode ? 'au-pattern-dark nb-dark' : ''} ${THEME[darkMode ? 'dark' : 'light']} relative min-h-screen overflow-x-hidden bg-[color:var(--page)] text-[color:var(--txt)] ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Toaster darkMode={darkMode} />

      <header className="fixed inset-x-0 top-0 z-40 border-b-[3px] border-[color:var(--ink)] bg-[color:var(--page)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Tech Restore" className={`flex-shrink-0 rounded-md ${FOCUS}`}>
            <img src={logo} alt="Tech Restore" className="h-9 w-auto" width={120} height={36} decoding="async" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-[color:var(--mut)] sm:block">{t('haveAccount')}</span>
            <Link to="/login" className={`${PRIMARY} justify-center px-4 py-2 text-xs uppercase sm:text-sm`}>{t('signIn')}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-8 px-4 pb-12 pt-24 sm:px-6 md:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-28">
        <div className="au-in hidden md:sticky md:top-28 md:block">
          <div className="mx-auto max-w-lg p-6">
            <IsoIllustration type="track" tone="emerald" onGreen={false} darkMode={darkMode} className="aspect-square w-full" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl space-y-6 md:mx-0">
          <div className="au-in">
            <h1 className={`text-3xl font-extrabold [text-wrap:balance] sm:text-4xl lg:text-5xl ${isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.15] tracking-[-0.04em]'}`}>
              {t('titleBefore')}{' '}<span className={darkMode ? 'au-hl-dark' : 'au-hl'}>{t('titleAccent')}</span>
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-[color:var(--mut)] sm:text-lg">{t('subtitle')}</p>
          </div>

          <div style={{ '--i': 1 }} className={`au-in space-y-5 p-4 sm:p-6 ${CARD}`}>
            {otpStep ? (
              <OTPStep email={pendingEmail} onSuccess={handleOtpSuccess} onBack={handleOtpBack} t={t} darkMode={darkMode} />
            ) : (
              <>
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide">{t('chooseRole')}</p>
                  <div role="radiogroup" aria-label={t('chooseRole')} className="grid grid-cols-2 gap-3 pb-1 pe-1">
                    {ROLE_KEYS.map((k) => {
                      const { labelKey, icon: Icon } = ROLES[k];
                      const on = role === k;
                      return (
                        <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setRole(k)}
                          className={`${on ? PRIMARY : SECONDARY} justify-start px-3 py-2.5 text-start text-xs uppercase sm:text-sm`}>
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
                  language={language} logoFile={logoFile} onLogoChange={setLogoFile}
                />

                <p className="text-center text-sm font-semibold text-[color:var(--mut)]">
                  {t('haveAccount')} <Link to="/login" className={LINK}>{t('loginHere')}</Link>
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