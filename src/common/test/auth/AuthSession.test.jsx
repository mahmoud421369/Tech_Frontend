
import { REDIRECTS, SHOP_ROLES, rolesFromClaims, parseAccessToken, redirectFor } from '../../utils/authSession';

const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const makeToken = (claims) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(claims)}.sig`;
const inSeconds = (s) => Math.floor(Date.now() / 1000) + s;

describe('rolesFromClaims', () => {
  it('reads an array of role strings', () => {
    expect(rolesFromClaims({ roles: ['ROLE_ADMIN', 'ROLE_USER'] })).toEqual(['ROLE_ADMIN', 'ROLE_USER']);
  });

  it('reads a single role string', () => {
    expect(rolesFromClaims({ role: 'ROLE_DELIVERY' })).toEqual(['ROLE_DELIVERY']);
  });

  it('unwraps Spring-style { authority } objects', () => {
    expect(rolesFromClaims({ authorities: [{ authority: 'ROLE_SELLER' }] })).toEqual(['ROLE_SELLER']);
  });

  it('reads ROLE_ entries from an OAuth scope string and ignores the rest', () => {
    expect(rolesFromClaims({ scope: 'openid profile ROLE_ASSIGNER' })).toEqual(['ROLE_ASSIGNER']);
  });

  it('removes duplicates and empty values', () => {
    expect(rolesFromClaims({ roles: ['ROLE_ADMIN', null, ''], role: 'ROLE_ADMIN' })).toEqual(['ROLE_ADMIN']);
  });

  it('returns an empty list for missing or invalid claims', () => {
    expect(rolesFromClaims()).toEqual([]);
    expect(rolesFromClaims(null)).toEqual([]);
    expect(rolesFromClaims('nope')).toEqual([]);
    expect(rolesFromClaims({})).toEqual([]);
  });
});

describe('parseAccessToken', () => {
  it('returns the session for a valid token', () => {
    const exp = inSeconds(3600);
    const token = makeToken({ sub: 'u-1', email: 'g@test.com', roles: ['ROLE_ADMIN'], exp });
    expect(parseAccessToken(token)).toEqual({ token, id: 'u-1', email: 'g@test.com', roles: ['ROLE_ADMIN'], exp });
  });

  it('prefers an explicit id claim over the subject', () => {
    const token = makeToken({ id: 42, sub: 'someone@test.com', exp: inSeconds(60) });
    expect(parseAccessToken(token).id).toBe(42);
  });

  it('uses the subject as the email when it looks like one', () => {
    const token = makeToken({ sub: 'who@test.com', exp: inSeconds(60) });
    expect(parseAccessToken(token)).toMatchObject({ id: 'who@test.com', email: 'who@test.com' });
  });

  it('does not treat a non-email subject as an email', () => {
    expect(parseAccessToken(makeToken({ sub: 'u-1', exp: inSeconds(60) })).email).toBeNull();
  });

  it('rejects an expired token', () => {
    expect(parseAccessToken(makeToken({ sub: 'u-1', exp: inSeconds(-1) }))).toBeNull();
  });

  it('accepts a token without an exp claim', () => {
    expect(parseAccessToken(makeToken({ sub: 'u-1' }))).toMatchObject({ id: 'u-1', exp: null });
  });

  it('respects the injected clock', () => {
    const token = makeToken({ sub: 'u-1', exp: inSeconds(60) });
    expect(parseAccessToken(token, Date.now() + 120000)).toBeNull();
  });

  it.each([undefined, null, '', 123, {}, 'not-a-jwt', 'a.b.c'])('rejects %p', (value) => {
    expect(parseAccessToken(value)).toBeNull();
  });
});

describe('redirectFor', () => {
  it.each(Object.entries(REDIRECTS))('sends %s to %s', (role, path) => {
    expect(redirectFor([role])).toBe(path);
  });

  it('uses the first role that has a destination', () => {
    expect(redirectFor(['ROLE_UNKNOWN', 'ROLE_ADMIN', 'ROLE_DELIVERY'])).toBe('/admin/dashboard');
  });

  it('falls back when no role matches', () => {
    expect(redirectFor(['ROLE_USER'])).toBe('/');
    expect(redirectFor(['ROLE_USER'], '/dashboard')).toBe('/dashboard');
    expect(redirectFor([], '/dashboard')).toBe('/dashboard');
    expect(redirectFor(undefined)).toBe('/');
  });
});

describe('SHOP_ROLES', () => {
  it('lists the roles that need a subscription check', () => {
    expect([...SHOP_ROLES].sort()).toEqual(['ROLE_REPAIRER', 'ROLE_SELLER', 'ROLE_SHOP_OWNER']);
  });
});