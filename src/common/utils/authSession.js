import { jwtDecode } from 'jwt-decode';

export const REDIRECTS = {
  ROLE_ADMIN: '/admin/dashboard',
  ROLE_REPAIRER: '/shop/dashboard',
  ROLE_SELLER: '/shop/dashboard',
  ROLE_SHOP_OWNER: '/shop/dashboard',
  ROLE_ASSIGNER: '/assigner/dashboard',
  ROLE_DELIVERY: '/delivery/dashboard',
  ROLE_GUEST: '/',
};
export const SHOP_ROLES = new Set(['ROLE_SHOP_OWNER', 'ROLE_REPAIRER', 'ROLE_SELLER']);


export const AREA_ROLES = {
  admin: new Set(['ROLE_ADMIN']),
  shop: SHOP_ROLES,
  assigner: new Set(['ROLE_ASSIGNER']),
  delivery: new Set(['ROLE_DELIVERY']),
};

export const canAccessArea = (roles, area) => {
  const allowed = AREA_ROLES[area];
  if (!allowed) return false;
  return (roles || []).some((r) => allowed.has(r));
};

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_LIKE = /^[\w-]+$/;
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const CLOCK_SKEW_MS = 5 * 60 * 1000;

export const rolesFromClaims = (claims) => {
  if (!claims || typeof claims !== 'object') return [];
  const raw = [...toArray(claims.roles), ...toArray(claims.role), ...toArray(claims.authorities)]
    .map((r) => (typeof r === 'string' ? r : r?.authority));
  if (typeof claims.scope === 'string') raw.push(...claims.scope.split(/[\s,]+/).filter((s) => s.startsWith('ROLE_')));
  return [...new Set(raw.filter(Boolean))];
};

export const isTokenExpired = (token, now = Date.now()) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const { exp } = jwtDecode(token);
    return !!exp && exp * 1000 <= now - CLOCK_SKEW_MS;
  } catch {
    return true;
  }
};

export const parseAccessToken = (token, options = {}) => {
  const { checkExpiry = true, now = Date.now() } = typeof options === 'number' ? { now: options } : options;
  if (!token || typeof token !== 'string') return null;
  let claims;
  try { claims = jwtDecode(token); } catch { return null; }
  if (!claims || typeof claims !== 'object') return null;
  if (checkExpiry && claims.exp && claims.exp * 1000 <= now - CLOCK_SKEW_MS) return null;

  const sub = typeof claims.sub === 'string' ? claims.sub : null;
  const uname = typeof claims.username === 'string' ? claims.username : null;
  const subIsEmail = !!sub && EMAIL_LIKE.test(sub);
  const subIsId = !!sub && !subIsEmail && ID_LIKE.test(sub);

  return {
    token,
    id: claims.id ?? claims.userId ?? claims.user_id ?? (subIsId ? sub : null),
    email: claims.email ?? (uname && EMAIL_LIKE.test(uname) ? uname : subIsEmail ? sub : null),
    roles: rolesFromClaims(claims),
    exp: claims.exp ?? null,
  };
};

export const redirectFor = (roles, fallback = '/') => {
  for (const r of roles || []) if (REDIRECTS[r]) return REDIRECTS[r];
  return fallback;
};