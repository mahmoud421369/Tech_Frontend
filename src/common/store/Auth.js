import { create } from 'zustand';


const read = (key) => {
  try {
    const v = localStorage.getItem(key);
    return v && v !== 'null' && v !== 'undefined' ? v : null;
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    if (value == null || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {  }
};

const readRoles = () => {
  try {
    const r = JSON.parse(localStorage.getItem('roles') || 'null');
    return Array.isArray(r) ? r : null;
  } catch {
    return null;
  }
};

const STORAGE_KEYS = ['authToken', 'roles', 'userId', 'userEmail', 'id'];

const useAuthStore = create((set) => ({
  accessToken: read('authToken'),
  roles: readRoles(),
  userId: read('userId'),
  email: read('userEmail'),

  authAt: 0,

  setAccessToken: (token) => {
    write('authToken', token);
    set({ accessToken: token ?? null, authAt: token ? Date.now() : 0 });
  },


  setUserData: (token, roles, userId, email) => {
    if (!token) return; 

    const roleList = Array.isArray(roles) ? roles : roles ? [roles] : [];

    write('authToken', token);
    write('roles', JSON.stringify(roleList));
    write('userId', userId);
    write('userEmail', email);

    set({
      accessToken: token,
      roles: roleList,
      userId: userId != null ? String(userId) : null,
      email: email ?? null,
      authAt: Date.now(),
    });
  },

  clearAuth: () => {
    
    STORAGE_KEYS.forEach((k) => {
      try { localStorage.removeItem(k); } catch { }
    });
    set({ accessToken: null, roles: null, userId: null, email: null, authAt: 0 });
  },
}));

export default useAuthStore;