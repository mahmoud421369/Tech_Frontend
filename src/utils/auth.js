import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { readStorage } from '../components/Device3D';

/** Returns the stored JWT only if it exists and has not expired. */
export const getValidToken = () => {
  const t = readStorage('authToken');
  if (!t || !t.trim()) return null;
  try {
    const d = jwtDecode(t);
    return d?.exp && d.exp > Date.now() / 1000 ? t : null;
  } catch {
    return null;
  }
};

/** Read the token at request time (not render time) so an expired token is never sent. */
export const authHeaders = () => {
  const t = getValidToken();
  if (!t) throw new Error('Unauthorized');
  return { Authorization: `Bearer ${t}` };
};

export const isUnauthorized = (err) => err?.message === 'Unauthorized' || err?.response?.status === 401;

// sweetalert2 is only needed on error paths, so load it once, lazily.
let swalPromise;
export const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((m) => m.default || m);
  return swalPromise;
};

export const toast = (opts) =>
  loadSwal().then((Swal) =>
    Swal.fire({ toast: true, position: 'top-end', timer: 2000, timerProgressBar: true, showConfirmButton: false, ...opts })
  );

export const expireSession = (navigate) => {
  try { window.localStorage.removeItem('authToken'); } catch { /* ignore */ }
  toast({ icon: 'warning', title: 'Session expired', text: 'Please log in again' }).then(() => navigate('/login'));
};

/** Redirects to /login (client-side, no full reload) when there is no valid token. */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const token = useMemo(getValidToken, []);
  useEffect(() => {
    if (!token) expireSession(navigate);
  }, [token, navigate]);
  return token;
};

/** Strip markup + control characters from user text. React escapes on render and the server must still validate. */
export const cleanText = (value, max = 1000) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);