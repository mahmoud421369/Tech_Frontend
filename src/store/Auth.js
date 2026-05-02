import { create } from 'zustand';

const useAuthStore = create((set) => ({
  accessToken: localStorage.getItem('authToken') || null,
  roles: JSON.parse(localStorage.getItem('roles') || 'null') || null,
  userId: localStorage.getItem('userId') || null,
  email: localStorage.getItem('userEmail') || null,  

  // -------------------------------------------------
  setAccessToken: (token) => {
    localStorage.setItem('authToken', token);
    set({ accessToken: token });
  },

  // -------------------------------------------------
  setUserData: (token, roles, userId, email) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('roles', JSON.stringify(roles));
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email ?? '');  
    set({ accessToken: token, roles, userId, email });
  },

  // -------------------------------------------------
  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('roles');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');           
    set({ accessToken: null, roles: null, userId: null, email: null });
  },
}));

// -----------------------------------------------------------------
// OPTIONAL: load any missing data from localStorage on app start

const loadInitialUser = () => {
  const token = localStorage.getItem('authToken');
  const roles = JSON.parse(localStorage.getItem('roles') || 'null');
  const userId = localStorage.getItem('userId');
  const email = localStorage.getItem('userEmail');

  if (token || roles || userId || email) {
    useAuthStore.getState().setUserData(token, roles, userId, email);
  }
};
loadInitialUser();

// -----------------------------------------------------------------
useAuthStore.subscribe((state) => {
  
});

export default useAuthStore;