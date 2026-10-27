
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Cookies from 'js-cookie';
import SuccessGoogle from '../../../Auth/SuccessGoogle';



const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

const mockSetUserData = jest.fn();
jest.mock('../../store/Auth', () => ({
  __esModule: true,
  default: (selector) => selector({ setUserData: mockSetUserData }),
}));

jest.mock('js-cookie', () => ({ __esModule: true, default: { get: jest.fn(), remove: jest.fn() } }));

jest.mock('jwt-decode', () => ({
  jwtDecode: (token) => {
    if (token.startsWith('bad')) throw new Error('bad token');
    return {
      sub: 'u-1',
      email: 'g@test.com',
      roles: token.includes('admin') ? ['ROLE_ADMIN'] : ['ROLE_USER'],
      exp: Math.floor(Date.now() / 1000) + (token.startsWith('expired') ? -60 : 3600),
    };
  },
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const Passthrough = ({ children }) => React.createElement(React.Fragment, null, children);
  const cache = {};
  const m = new Proxy({}, {
    get: (_, tag) => {
      if (!cache[tag]) {
        cache[tag] = ({ children, initial, animate, exit, transition, ...rest }) => React.createElement(tag, rest, children);
      }
      return cache[tag];
    },
  });
  return { __esModule: true, LazyMotion: Passthrough, MotionConfig: Passthrough, AnimatePresence: Passthrough, domAnimation: {}, m };
});



const MISSING = 'No authentication token found. Please try logging in again.';
const EXPIRED = 'Your Google sign-in has expired. Please sign in again.';
const FAILED = 'Failed to finalize your session. Please try again.';


function setup({ cookie, server, strict = false } = {}) {
  Cookies.get.mockImplementation((name) => (name === 'client_access_token' ? cookie : undefined));
  if (server) window.__INITIAL_DATA__ = { access_token: server };
  const ui = strict ? <React.StrictMode><SuccessGoogle /></React.StrictMode> : <SuccessGoogle />;
  return render(ui);
}

const realLocation = window.location;
let locationReplaced = false;
const mockReload = () => {
  const reload = jest.fn();
  delete window.location;
  window.location = { reload };
  locationReplaced = true;
  return reload;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSetUserData.mockReset();
  localStorage.clear();
  delete window.__INITIAL_DATA__;
});

afterEach(() => {
  jest.useRealTimers();
  if (locationReplaced) {
    window.location = realLocation;
    locationReplaced = false;
  }
});



describe('Valid token', () => {
  it('stores the whole session (token, roles, id, email) and shows the success screen', () => {
    setup({ cookie: 'cookie-token' });
    expect(mockSetUserData).toHaveBeenCalledWith('cookie-token', ['ROLE_USER'], 'u-1', 'g@test.com');
    expect(localStorage.getItem('id')).toBe('u-1');
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByText('Authentication Successful')).toBeInTheDocument();
    expect(screen.getByText(/Redirecting you now/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reads the right cookie', () => {
    setup({ cookie: 'cookie-token' });
    expect(Cookies.get).toHaveBeenCalledWith('client_access_token');
  });

  it('uses the token injected by the server', () => {
    setup({ server: 'server-token' });
    expect(mockSetUserData).toHaveBeenCalledWith('server-token', ['ROLE_USER'], 'u-1', 'g@test.com');
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
  });
});

describe('Which token wins (the "session expired" bug)', () => {
  it('prefers the fresh server token over a leftover cookie', () => {
    setup({ cookie: 'old-cookie-token', server: 'fresh-server-token' });
    expect(mockSetUserData).toHaveBeenCalledTimes(1);
    expect(mockSetUserData.mock.calls[0][0]).toBe('fresh-server-token');
  });

  it('skips an expired server token and uses a valid cookie', () => {
    setup({ cookie: 'cookie-token', server: 'expired-server-token' });
    expect(mockSetUserData.mock.calls[0][0]).toBe('cookie-token');
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
  });

  it('never stores an expired cookie token', () => {
    setup({ cookie: 'expired-cookie-token' });
    expect(mockSetUserData).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(EXPIRED);
    expect(localStorage.getItem('id')).toBeNull();
  });

  it('rejects a token that cannot be decoded', () => {
    setup({ cookie: 'bad-token' });
    expect(mockSetUserData).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(EXPIRED);
  });

  it('reports expired when every token is expired', () => {
    setup({ cookie: 'expired-a', server: 'expired-b' });
    expect(screen.getByRole('alert')).toHaveTextContent(EXPIRED);
  });
});

describe('Redirect', () => {
  it('goes home (replacing history) after 2 seconds for a normal user', () => {
    jest.useFakeTimers();
    setup({ cookie: 'cookie-token' });
    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1999); });
    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1); });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('sends an admin to the admin dashboard', () => {
    jest.useFakeTimers();
    setup({ cookie: 'admin-token' });
    act(() => { jest.advanceTimersByTime(2000); });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
  });

  it('removes the hand-off cookie and server token only when the redirect happens', () => {
    jest.useFakeTimers();
    setup({ cookie: 'cookie-token', server: 'server-token' });
    expect(Cookies.remove).not.toHaveBeenCalled();
    expect(window.__INITIAL_DATA__.access_token).toBe('server-token');

    act(() => { jest.advanceTimersByTime(2000); });
    expect(Cookies.remove).toHaveBeenCalledWith('client_access_token', { path: '/' });
    expect(Cookies.remove).toHaveBeenCalledWith('client_access_token');
    expect(window.__INITIAL_DATA__.access_token).toBeUndefined();
  });

  it('does not redirect if the page is left before the timer fires', () => {
    jest.useFakeTimers();
    const { unmount } = setup({ cookie: 'cookie-token' });
    unmount();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('still signs in and redirects under React.StrictMode (effects run twice in development)', () => {
    jest.useFakeTimers();
    setup({ cookie: 'cookie-token', strict: true });
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(2000); });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

describe('No token', () => {
  it('shows an error and does not touch the auth store', () => {
    setup();
    expect(screen.getByRole('alert')).toHaveTextContent(MISSING);
    expect(screen.getByText('Login Problem')).toBeInTheDocument();
    expect(mockSetUserData).not.toHaveBeenCalled();
    expect(screen.queryByText('Welcome Back!')).not.toBeInTheDocument();
  });

  it('does not redirect', () => {
    jest.useFakeTimers();
    setup();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('"Login Page" goes to /login', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Login Page' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('"Retry" reloads the page', () => {
    setup();
    const reload = mockReload();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('Store failure', () => {
  it('shows an error when the session cannot be saved', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSetUserData.mockImplementation(() => { throw new Error('storage full'); });
    setup({ cookie: 'cookie-token' });

    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(screen.queryByText('Welcome Back!')).not.toBeInTheDocument();
  });

  it('does not redirect after a store failure', () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSetUserData.mockImplementation(() => { throw new Error('storage full'); });
    setup({ cookie: 'cookie-token' });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});