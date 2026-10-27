import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { readStorage } from '../../components/user/Device3D';



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



export const authHeaders = () => {
  const t = getValidToken();
  if (!t) throw new Error('Unauthorized');
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
  try { window.localStorage.removeItem('authToken'); } catch { }
  toast({ icon: 'warning', title: 'Session expired', text: 'Please log in' }).then(() => navigate('/login'));
};



export const useAuthGuard = () => {
  const navigate = useNavigate();
  const token = useMemo(getValidToken, []);
  useEffect(() => {
    if (!token) expireSession(navigate);
  }, [token, navigate]);
  return token;
};


export const cleanText = (value, max = 1000) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);