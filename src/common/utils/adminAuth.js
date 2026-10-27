import { jwtDecode } from "jwt-decode";



export const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; }
  catch { return true; }
};


export const getRolesFromToken = (token) => {
  try {
    const d = jwtDecode(token) || {};
    const raw = [d.role, d.roles, d.authorities, d.authority, d.scope, d.scp, d.userRole, d.user_role];
    return raw
      .flat(Infinity)
      .flatMap((r) => (typeof r === "string" ? r.split(/[\s,]+/) : r && typeof r === "object" ? [r.authority, r.role, r.name] : []))
      .filter((r) => typeof r === "string" && r)
      .map((r) => r.replace(/^ROLE_/i, "").toUpperCase());
  } catch { return []; }
};


export const isAdminToken = (token) => !isTokenExpired(token) && getRolesFromToken(token).includes("ADMIN");