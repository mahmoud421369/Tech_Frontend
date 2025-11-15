import { create } from 'zustand';

const useAuthStore = create((set) => ({
  accessToken: localStorage.getItem('authToken') || null,
  roles: JSON.parse(localStorage.getItem('roles') || 'null') || null,
  userId: localStorage.getItem('userId') || null,
  email: localStorage.getItem('userEmail') || null,   // <-- NEW

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
    localStorage.setItem('userEmail', email ?? '');   // <-- NEW
    set({ accessToken: token, roles, userId, email });
  },

  // -------------------------------------------------
  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('roles');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');            // <-- NEW
    set({ accessToken: null, roles: null, userId: null, email: null });
  },
}));

// -----------------------------------------------------------------
// OPTIONAL: load any missing data from localStorage on app start
// (helps when the page is refreshed and the store is recreated)
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
  console.log('Auth Store Updated:', {
    accessToken: state.accessToken ? 'Present' : 'None',
    roles: state.roles,
    userId: state.userId,
    email: state.email,
  });
});

export default useAuthStore;