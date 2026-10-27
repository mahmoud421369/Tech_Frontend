import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/Auth';
import { isTokenExpired } from './authSession';

export const getValidToken = () => {
  const t = useAuthStore.getState().accessToken;
  if (!t || !String(t).trim()) return null;
  return isTokenExpired(t) ? null : t;
};

export const authHeaders = () => {
  const t = useAuthStore.getState().accessToken;
  if (!t || !String(t).trim()) throw new Error('Unauthorized');
  return { Authorization: `Bearer ${t}` };
};

export const isUnauthorized = (err) => err?.message === 'Unauthorized' || err?.response?.status === 401;

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
  try { useAuthStore.getState().clearAuth(); } catch { }
  toast({ icon: 'warning', title: 'Session expired', text: 'Please log in again' }).then(() =>
    navigate('/login', { replace: true })
  );
};

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  return token || null;
};

export const cleanText = (value, max = 1000) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);