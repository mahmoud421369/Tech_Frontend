
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import api from '../../api/api';


if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

const Login = require('../../../Auth/Login').default;



jest.mock('../../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
    useNavigate: () => mockNavigate,
  };
});

const mockSetUserData = jest.fn();
const mockClearAuth = jest.fn();
jest.mock('../../store/Auth', () => ({
  __esModule: true,
  default: (selector) => selector({ setUserData: mockSetUserData, clearAuth: mockClearAuth }),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: (token) => {
    if (token === 'bad') throw new Error('bad token');
    return { sub: 'jwt-sub' };
  },
}));

jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

let mockLanguage = 'en';
jest.mock('../../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));


jest.mock('../../../locales/en/translation.json', () => ({ login: {} }));
jest.mock('../../../locales/ar/translation.json', () => ({ login: {} }));
jest.mock('../../../locales/fr/translation.json', () => ({ login: {} }));

jest.mock('../../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null }));
jest.mock('../../../components/user/Ui3D', () => {
  const React = require('react');
  return {
    __esModule: true,
    UI3D_CSS: '',
    Defs3D: () => null,
    Glyph3D: () => null,
    Logo3D: () => null,
    Spinner: () => React.createElement('span', { 'data-testid': 'spinner' }),
    Chip3D: ({ children }) => React.createElement('span', null, children),
    cardCls: () => '',
    tileCls: () => '',
    inputCls: () => '',
    Btn3D: ({ as: As = 'button', tone, darkMode, children, ...rest }) =>
      React.createElement(As, As === 'button' ? { type: 'button', ...rest } : rest, children),
    Modal3D: ({ open, onClose, title, children }) =>
      open
        ? React.createElement(
            'div',
            { role: 'dialog', 'aria-label': title },
            React.createElement('button', { type: 'button', 'aria-label': 'closeDialog', onClick: onClose }, 'x'),
            children,
          )
        : null,
  };
});



const httpError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });
const networkError = () => new Error('Network Error'); 

const realLocation = window.location;
let locationReplaced = false;

const mockLocation = () => {
  delete window.location;
  window.location = { href: 'http://localhost/' };
  locationReplaced = true;
  return window.location;
};

const loginResolves = (data) => api.post.mockResolvedValue({ data });
const loginRejects = (status, message) => api.post.mockRejectedValue(httpError(status, { message }));

const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();
const ACTIVE_SUB = () => ({ status: 'ACTIVE', endDate: daysFromNow(10), shopId: 'sh1' });
const EXPIRED_SUB = { status: 'EXPIRED', endDate: '2020-01-01T00:00:00Z' };
const PENDING_CASH_SUB = { status: 'PENDING', paymentMethod: 'CASH', endDate: '2020-01-01T00:00:00Z' };


const shopLogin = (subscription) => {
  loginResolves({ access_token: 'tok', role: ['ROLE_SHOP_OWNER'], id: 'u1', email: 'shop@test.com' });
  api.get.mockImplementation(async () => {
    if (subscription instanceof Error) throw subscription;
    return { data: subscription };
  });
};

function setup() {
  api.get.mockResolvedValue({ data: null });
  const user = userEvent.setup();
  const utils = render(<Login />);
  return { user, ...utils };
}

const emailInput = () => screen.getByLabelText('emailLabel');
const passwordInput = () => screen.getByLabelText('passwordLabel');
const submitBtn = () => screen.getByRole('button', { name: 'logIn' });

const fill = async (user, email = 'a@b.com', password = 'secret1') => {
  await user.type(emailInput(), email);
  await user.type(passwordInput(), password);
};
const submit = (user) => user.click(submitBtn());


const openRenewal = async (user) => {
  shopLogin(EXPIRED_SUB);
  await fill(user, 'shop@test.com');
  await submit(user);
  return screen.findByRole('dialog', { name: 'rnTitleForm' });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
  mockLanguage = 'en';
});

afterEach(() => {
  if (locationReplaced) {
    window.location = realLocation;
    locationReplaced = false;
  }
});



describe('Page basics', () => {
  it('sets the page title and shows the form', () => {
    setup();
    expect(document.title).toBe('pageTitle');
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(submitBtn()).toBeEnabled();
  });

  it('links to the sign-up page', () => {
    setup();
    expect(screen.getByRole('link', { name: 'signUp' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: 'createAccount' })).toHaveAttribute('href', '/signup');
  });

  it('renders right-to-left for Arabic', () => {
    mockLanguage = 'ar';
    const { container } = setup();
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });

  it('toggles password visibility', async () => {
    const { user } = setup();
    expect(passwordInput()).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'showPassword' }));
    expect(passwordInput()).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'hidePassword' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sends the browser to Google sign-in', async () => {
    const { user } = setup();
    const loc = mockLocation();
    await user.click(screen.getByRole('button', { name: 'google' }));
    expect(loc.href).toMatch(/\/oauth2\/authorization\/google$/);
  });
});

describe('Validation', () => {
  it('blocks an empty submit and shows both errors', async () => {
    const { user } = setup();
    await submit(user);
    expect(await screen.findByText('errEmailRequired')).toBeInTheDocument();
    expect(screen.getByText('errPasswordRequired')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows an invalid email error on blur', async () => {
    const { user } = setup();
    await user.type(emailInput(), 'abc');
    await user.tab();
    expect(await screen.findByText('errEmailInvalid')).toBeInTheDocument();
  });

  it('shows a too-short password error on blur', async () => {
    const { user } = setup();
    await user.type(passwordInput(), '123');
    await user.tab();
    expect(await screen.findByText('errPasswordMin')).toBeInTheDocument();
  });
});

describe('Signing in', () => {
  it('posts the trimmed credentials and stores the session', async () => {
    const { user } = setup();
    loginResolves({ access_token: 'tok', role: ['ROLE_ADMIN'], id: 'u1', email: 'a@b.com' });
    await fill(user);
    await submit(user);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
    expect(api.post).toHaveBeenCalledWith(
      '/api/auth/login',
      { email: 'a@b.com', password: 'secret1' },
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(mockSetUserData).toHaveBeenCalledWith('tok', ['ROLE_ADMIN'], 'u1', 'a@b.com');
    expect(localStorage.getItem('id')).toBe('u1');
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', title: 'welcomeBack' })));
  });

  it.each([
    ['ROLE_ADMIN', '/admin/dashboard'],
    ['ROLE_ASSIGNER', '/assigner/dashboard'],
    ['ROLE_DELIVERY', '/delivery/dashboard'],
    ['ROLE_GUEST', '/'],
    ['ROLE_UNKNOWN', '/dashboard'],
  ])('redirects %s to %s', async (role, path) => {
    const { user } = setup();
    loginResolves({ access_token: 'tok', role, id: 'u1', email: 'a@b.com' }); 
    await fill(user);
    await submit(user);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(path));
    expect(mockSetUserData).toHaveBeenCalledWith('tok', [role], 'u1', 'a@b.com');
  });

  it('falls back to the token subject and the typed email when the response has no id/email', async () => {
    const { user } = setup();
    loginResolves({ access_token: 'tok', role: 'ROLE_ADMIN' });
    await fill(user);
    await submit(user);
    await waitFor(() => expect(mockSetUserData).toHaveBeenCalledWith('tok', ['ROLE_ADMIN'], 'jwt-sub', 'a@b.com'));
  });

  it('clears the failed-attempt counter after a successful login', async () => {
    localStorage.setItem('loginThrottle', JSON.stringify({ count: 3, until: 0 }));
    const { user } = setup();
    loginResolves({ access_token: 'tok', role: ['ROLE_ADMIN'], id: 'u1' });
    await fill(user);
    await submit(user);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(localStorage.getItem('loginThrottle')).toBeNull();
  });

  it('shows a loading state and prevents a double submit', async () => {
    const { user } = setup();
    let resolve;
    api.post.mockImplementation(() => new Promise((r) => { resolve = r; }));
    await fill(user);
    await submit(user);

    const busy = await screen.findByRole('button', { name: 'signingIn' });
    expect(busy).toBeDisabled();
    expect(emailInput()).toBeDisabled();
    await user.click(busy);
    expect(api.post).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ data: { access_token: 'tok', role: ['ROLE_ADMIN'], id: 'u1' } }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
  });
});

describe('Login errors', () => {
  it('shows a friendly message and a hint for wrong credentials', async () => {
    const { user } = setup();
    loginRejects(401, 'Bad credentials');
    await fill(user);
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('errBadCredentials');
    expect(screen.getByText('wrongCredsHint')).toBeInTheDocument();
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', title: 'signInFailed' })));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('counts a server rejection as a failed attempt', async () => {
    const { user } = setup();
    loginRejects(401, 'Bad credentials');
    await fill(user);
    await submit(user);
    await screen.findByRole('alert');
    expect(JSON.parse(localStorage.getItem('loginThrottle')).count).toBe(1);
  });

  it('does not count a network error as a failed attempt', async () => {
    const { user } = setup();
    api.post.mockRejectedValue(networkError());
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('errNetwork');
    expect(localStorage.getItem('loginThrottle')).toBeNull();
  });

  it('reports a response without an access token', async () => {
    const { user } = setup();
    loginResolves({ role: ['ROLE_ADMIN'] });
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('errMissingToken');
    expect(mockSetUserData).not.toHaveBeenCalled();
  });

  it('clears the error as soon as the user edits a field', async () => {
    const { user } = setup();
    loginRejects(401, 'Bad credentials');
    await fill(user);
    await submit(user);
    await screen.findByRole('alert');
    await user.type(passwordInput(), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Brute-force lock', () => {
  it('locks the form after the 5th failed attempt', async () => {
    localStorage.setItem('loginThrottle', JSON.stringify({ count: 4, until: 0 }));
    const { user } = setup();
    loginRejects(401, 'Bad credentials');
    await fill(user);
    await submit(user);

    expect(await screen.findByText('lockedBanner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tryAgainIn' })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem('loginThrottle')).until).toBeGreaterThan(Date.now());
  });

  it('stays locked after a page reload', () => {
    localStorage.setItem('loginThrottle', JSON.stringify({ count: 0, until: Date.now() + 30000 }));
    setup();
    expect(screen.getByText('lockedBanner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tryAgainIn' })).toBeDisabled();
  });

  it('is not locked when the lock has already expired', () => {
    localStorage.setItem('loginThrottle', JSON.stringify({ count: 0, until: Date.now() - 1000 }));
    setup();
    expect(screen.queryByText('lockedBanner')).not.toBeInTheDocument();
    expect(submitBtn()).toBeEnabled();
  });
});

describe('Shop owners and subscriptions', () => {
  it('goes to the shop dashboard when the subscription is active', async () => {
    const { user } = setup();
    shopLogin(ACTIVE_SUB());
    await fill(user, 'shop@test.com');
    await submit(user);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/shop/dashboard'));
    expect(api.get).toHaveBeenCalledWith('/api/subscriptions/renew/status/shop%40test.com', expect.anything());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the renewal dialog when the subscription is expired', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    expect(dialog).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('treats a failed subscription check as expired', async () => {
    const { user } = setup();
    shopLogin(httpError(500));
    await fill(user, 'shop@test.com');
    await submit(user);
    expect(await screen.findByRole('dialog', { name: 'rnTitleForm' })).toBeInTheDocument();
  });

  it('opens the renewal dialog when the server answers "subscription expired"', async () => {
    const { user } = setup();
    loginRejects(403, 'Your subscription is expired');
    await fill(user);
    await submit(user);
    expect(await screen.findByRole('dialog', { name: 'rnTitleForm' })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the "request received" view for a pending cash renewal', async () => {
    const { user } = setup();
    shopLogin(PENDING_CASH_SUB);
    await fill(user, 'shop@test.com');
    await submit(user);

    expect(await screen.findByRole('dialog', { name: 'rnTitlePending' })).toBeInTheDocument();
    expect(screen.getByText('rnRequestReceived')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'backToLogin' }));
    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

describe('Renewal dialog', () => {
  it('signs the user out when the dialog is closed', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    await user.click(within(dialog).getByRole('button', { name: 'closeDialog' }));
    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('pays by card and redirects to the https payment page', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    api.post.mockResolvedValue({ data: { paymentURL: 'https://pay.example.com/x' } });
    const loc = mockLocation();

    await user.click(within(dialog).getByRole('button', { name: 'rnMore' })); /* 2 months */
    expect(within(dialog).getByText(/2.?000/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'rnPayCard' }));

    await waitFor(() => expect(loc.href).toBe('https://pay.example.com/x'));
    expect(api.post).toHaveBeenLastCalledWith(
      '/api/subscriptions/renew/card/shop%40test.com',
      { months: 2, type: 'COMMISSION' },
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(await screen.findByText('rnRedirecting')).toBeInTheDocument();
  });

  it('refuses a non-https payment link', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    api.post.mockResolvedValue({ data: { paymentURL: 'http://evil.example.com' } });
    const loc = mockLocation();
    await user.click(within(dialog).getByRole('button', { name: 'rnPayCard' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('rnInsecureLink');
    expect(loc.href).toBe('http://localhost/');
  });

  it('does not report success when the card renewal returns no payment link', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    api.post.mockResolvedValue({ data: {} });
    await user.click(within(dialog).getByRole('button', { name: 'rnPayCard' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('rnCardNotStarted');
    expect(screen.queryByText('rnRedirecting')).not.toBeInTheDocument();
  });

  it('shows a generic message instead of raw backend text on a 500', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    /* Login.jsx turns a 500 from the card endpoint into a friendly translated message
       (currently "rnInProgress"; "rnCardFailed" is the generic fallback), never the raw backend text */
    api.post.mockRejectedValue(httpError(500, { message: 'RUNTIME_ERROR: Paymob exploded', error_code: 'RT_001' }));
    await user.click(within(dialog).getByRole('button', { name: 'rnPayCard' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(/rnInProgress|rnCardFailed/);
    expect(alert).not.toHaveTextContent(/paymob|RUNTIME_ERROR|RT_001/i);
    expect(screen.queryByText('rnRedirecting')).not.toBeInTheDocument();
  });

  it('sends a cash renewal request', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    api.post.mockResolvedValue({ data: {} });
    await user.click(within(dialog).getByRole('radio', { name: 'payCash' }));
    await user.click(within(dialog).getByRole('button', { name: 'rnSendCash' }));

    expect(await screen.findByRole('dialog', { name: 'rnTitlePending' })).toBeInTheDocument();
    expect(api.post).toHaveBeenLastCalledWith(
      '/api/subscriptions/renew/cash/shop%40test.com',
      { months: 1, type: 'COMMISSION' },
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('keeps the month stepper between 1 and 12', async () => {
    const { user } = setup();
    const dialog = await openRenewal(user);
    expect(within(dialog).getByRole('button', { name: 'rnFewer' })).toBeDisabled();
    for (let i = 0; i < 15; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      if (within(dialog).getByRole('button', { name: 'rnMore' }).disabled) break;
      // eslint-disable-next-line no-await-in-loop
      await user.click(within(dialog).getByRole('button', { name: 'rnMore' }));
    }
    expect(within(dialog).getByRole('button', { name: 'rnMore' })).toBeDisabled();
    expect(within(dialog).getByText(/12.?000/)).toBeInTheDocument();
  });
});

describe('Forgot password', () => {
  const openForgot = async (user) => {
    await user.click(screen.getByRole('button', { name: 'forgotLink' }));
    return screen.findByRole('dialog', { name: 'fpTitleEmail' });
  };

  it('validates the email before sending', async () => {
    const { user } = setup();
    const dialog = await openForgot(user);
    await user.click(within(dialog).getByRole('button', { name: 'sendCode' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('errEmailInvalid');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows the server error when the email is unknown', async () => {
    const { user } = setup();
    const dialog = await openForgot(user);
    api.post.mockRejectedValue(httpError(404, { message: 'User not found' }));
    await user.type(within(dialog).getByRole('textbox'), 'nobody@test.com');
    await user.click(within(dialog).getByRole('button', { name: 'sendCode' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('errUserNotFound');
  });

  it('walks through email -> code -> new password -> done', async () => {
    const { user } = setup();
    let dialog = await openForgot(user);
    api.post.mockResolvedValue({ data: {} });

    await user.type(within(dialog).getByRole('textbox'), 'a@b.com');
    await user.click(within(dialog).getByRole('button', { name: 'sendCode' }));
    dialog = await screen.findByRole('dialog', { name: 'fpTitleOtp' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'a@b.com' }, expect.objectContaining({ signal: expect.anything() }));

    
    expect(within(dialog).getByRole('button', { name: /resendIn/ })).toBeDisabled();

    const boxes = within(dialog).getAllByLabelText('digit');
    expect(boxes).toHaveLength(6);
    expect(within(dialog).getByRole('button', { name: 'next' })).toBeDisabled();
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.type(boxes[i], String(i + 1));
    }
    await user.click(within(dialog).getByRole('button', { name: 'next' }));

    dialog = await screen.findByRole('dialog', { name: 'fpTitleReset' });
    await user.type(within(dialog).getByPlaceholderText('newPasswordPlaceholder'), 'newpass1');
    await user.type(within(dialog).getByPlaceholderText('confirmPasswordPlaceholder'), 'newpass1');
    await user.click(within(dialog).getByRole('button', { name: 'resetPassword' }));

    dialog = await screen.findByRole('dialog', { name: 'fpTitleDone' });
    expect(api.post).toHaveBeenLastCalledWith(
      '/api/auth/reset-password',
      { email: 'a@b.com', otp: '123456', newPassword: 'newpass1', confirmPassword: 'newpass1' },
      expect.objectContaining({ signal: expect.anything() }),
    );

    await user.click(within(dialog).getByRole('button', { name: 'backToSignIn' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rejects a mismatching or too-short new password', async () => {
    const { user } = setup();
    let dialog = await openForgot(user);
    api.post.mockResolvedValue({ data: {} });
    await user.type(within(dialog).getByRole('textbox'), 'a@b.com');
    await user.click(within(dialog).getByRole('button', { name: 'sendCode' }));
    dialog = await screen.findByRole('dialog', { name: 'fpTitleOtp' });
    const boxes = within(dialog).getAllByLabelText('digit');
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.type(boxes[i], '1');
    }
    await user.click(within(dialog).getByRole('button', { name: 'next' }));
    dialog = await screen.findByRole('dialog', { name: 'fpTitleReset' });
    api.post.mockClear();

    await user.type(within(dialog).getByPlaceholderText('newPasswordPlaceholder'), '123');
    await user.click(within(dialog).getByRole('button', { name: 'resetPassword' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('errPasswordMin');

    await user.clear(within(dialog).getByPlaceholderText('newPasswordPlaceholder'));
    await user.type(within(dialog).getByPlaceholderText('newPasswordPlaceholder'), 'newpass1');
    await user.type(within(dialog).getByPlaceholderText('confirmPasswordPlaceholder'), 'different1');
    await user.click(within(dialog).getByRole('button', { name: 'resetPassword' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('errPasswordMismatch');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('closes with the close button', async () => {
    const { user } = setup();
    const dialog = await openForgot(user);
    await user.click(within(dialog).getByRole('button', { name: 'closeDialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});