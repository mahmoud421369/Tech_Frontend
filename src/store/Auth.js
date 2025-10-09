import { create } from 'zustand';

const useAuthStore = create((set) => ({
  accessToken: localStorage.getItem('authToken') || null,
  roles: JSON.parse(localStorage.getItem('roles')) || null,
  userId: localStorage.getItem('userId') || null,

  setAccessToken: (token) => {
    localStorage.setItem('authToken', token);
    set({ accessToken: token });
  },

  setUserData: (token, roles, userId) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('roles', JSON.stringify(roles));
    localStorage.setItem('userId', userId);
    set({ accessToken: token, roles, userId });
  },

  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('roles');
    localStorage.removeItem('userId');
    set({ accessToken: null, roles: null, userId: null });
  },
}));


useAuthStore.subscribe((state) => {
  console.log('Auth Store Updated:', {
    accessToken: state.accessToken,
    roles: state.roles,
    userId: state.userId,
  });
});

export default useAuthStore;