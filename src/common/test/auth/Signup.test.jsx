
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import api from '../../api/api';


if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

const Signup = require('../../../Auth/Signup').default;



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

jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

let mockLanguage = 'en';
jest.mock('../../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));


jest.mock('../../../locales/en/translation.json', () => ({ signup: {} }));
jest.mock('../../../locales/ar/translation.json', () => ({ signup: {} }));
jest.mock('../../../locales/fr/translation.json', () => ({ signup: {} }));

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
    ErrorBanner: ({ message }) => React.createElement('div', { role: 'alert' }, message),
    Select3D: ({ darkMode, children, ...rest }) => React.createElement('select', rest, children),
    AuthInput: ({ id, label, icon, error, darkMode, trailing, ...rest }) =>
      React.createElement(
        'div',
        null,
        label ? React.createElement('label', { htmlFor: id }, label) : null,
        React.createElement('input', { id, 'aria-invalid': !!error, ...rest }),
        trailing,
        error ? React.createElement('p', { role: 'alert', id: `${id}-err` }, error) : null,
      ),
  };
});



const httpError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

function setup() {
  api.post.mockResolvedValue({ data: {} });
  const user = userEvent.setup();
  const utils = render(<Signup />);
  return { user, ...utils };
}

const field = (label) => screen.getByLabelText(label);
const typeInto = (user, label, text) => user.type(field(label), text);
const ctaBtn = (key) => screen.getByRole('button', { name: key });
const roleRadio = (key) => screen.getByRole('radio', { name: key });
const OTP_BOXES = () => screen.getAllByLabelText('digit');

const VALID_PASSWORD = 'Passw0rd!';

const fillUser = async (user) => {
  await typeInto(user, 'firstName', 'Ahmed');
  await typeInto(user, 'lastName', 'Ali');
  await typeInto(user, 'email', 'ahmed@test.com');
  await typeInto(user, 'phone', '01001234567');
  await typeInto(user, 'passwordLabel', VALID_PASSWORD);
};


const registerUser = async (user) => {
  await fillUser(user);
  await user.click(ctaBtn('ctaUser'));
  await screen.findByText('otpTitle');
};

const typeCode = async (user, code = '123456') => {
  const boxes = OTP_BOXES();
  for (let i = 0; i < code.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await user.type(boxes[i], code[i]);
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockLanguage = 'en';
});



describe('Page basics', () => {
  it('sets the page title and links to the login page', () => {
    setup();
    expect(document.title).toBe('pageTitle');
    expect(screen.getByRole('link', { name: 'signIn' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'loginHere' })).toHaveAttribute('href', '/login');
  });

  it('renders right-to-left for Arabic', () => {
    mockLanguage = 'ar';
    const { container } = setup();
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });

  it('toggles password visibility', async () => {
    const { user } = setup();
    expect(field('passwordLabel')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'showPassword' }));
    expect(field('passwordLabel')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'hidePassword' })).toBeInTheDocument();
  });
});

describe('Role selection', () => {
  it('starts on the "user" role with its fields', () => {
    setup();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(roleRadio('roleUser')).toHaveAttribute('aria-checked', 'true');
    ['firstName', 'lastName', 'email', 'phone', 'passwordLabel'].forEach((l) => expect(field(l)).toBeInTheDocument());
    expect(ctaBtn('ctaUser')).toBeInTheDocument();
  });

  it('shows the shop fields for the shop role', async () => {
    const { user } = setup();
    await user.click(roleRadio('roleShop'));
    expect(roleRadio('roleShop')).toHaveAttribute('aria-checked', 'true');
    ['shopName', 'email', 'phone', 'description', 'shopType', 'state', 'city', 'street', 'building', 'passwordLabel']
      .forEach((l) => expect(field(l)).toBeInTheDocument());
    expect(ctaBtn('ctaShop')).toBeInTheDocument();
    expect(screen.queryByLabelText('firstName')).not.toBeInTheDocument();
  });

  it('shows the right fields for delivery and assigner', async () => {
    const { user } = setup();
    await user.click(roleRadio('roleDelivery'));
    ['fullName', 'email', 'phone', 'address'].forEach((l) => expect(field(l)).toBeInTheDocument());
    expect(ctaBtn('ctaDelivery')).toBeInTheDocument();

    await user.click(roleRadio('roleAssigner'));
    ['fullName', 'department', 'email', 'phone'].forEach((l) => expect(field(l)).toBeInTheDocument());
    expect(ctaBtn('ctaAssigner')).toBeInTheDocument();
  });

  it('keeps each role\'s values separate', async () => {
    const { user } = setup();
    await typeInto(user, 'email', 'user@test.com');
    await user.click(roleRadio('roleShop'));
    expect(field('email')).toHaveValue('');
    await user.click(roleRadio('roleUser'));
    expect(field('email')).toHaveValue('user@test.com');
  });
});

describe('Validation', () => {
  it('blocks an empty submit and shows every required error', async () => {
    const { user } = setup();
    await user.click(ctaBtn('ctaUser'));
    expect(await screen.findAllByText('errRequired')).toHaveLength(2); 
    expect(screen.getByText('errEmailRequired')).toBeInTheDocument();
    expect(screen.getByText('errPhoneRequired')).toBeInTheDocument();
    expect(screen.getByText('errPasswordRequired')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows an invalid email error on blur', async () => {
    const { user } = setup();
    await typeInto(user, 'email', 'abc');
    await user.tab();
    expect(await screen.findByText('errEmailInvalid')).toBeInTheDocument();
  });

  it('shows an invalid phone error on blur', async () => {
    const { user } = setup();
    await typeInto(user, 'phone', '123');
    await user.tab();
    expect(await screen.findByText('errPhoneInvalid')).toBeInTheDocument();
  });

  it.each([
    ['Ab1!', 'errPasswordMin'],
    ['abcdefg1!', 'errUpper'],
    ['ABCDEFG1!', 'errLower'],
    ['Abcdefgh!', 'errNumber'],
    ['Abcdefg12', 'errSymbol'],
    ['Abcd 123!', 'errNoSpaces'],
    ['Aa1!'.repeat(19), 'errPasswordMax'] ,
  ])('rejects the password "%s" with %s', async (password, errorKey) => {
    const { user } = setup();
    await typeInto(user, 'passwordLabel', password);
    await user.tab();
    expect(await screen.findByText(errorKey)).toBeInTheDocument();
  });

  it('accepts a strong password', async () => {
    const { user } = setup();
    await typeInto(user, 'passwordLabel', VALID_PASSWORD);
    await user.tab();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Registering', () => {
  it('registers a user and moves to the verification step', async () => {
    const { user } = setup();
    await registerUser(user);

    expect(api.post).toHaveBeenCalledWith(
      '/api/auth/register/user',
      { first_name: 'Ahmed', last_name: 'Ali', email: 'ahmed@test.com', phone: '01001234567', password: VALID_PASSWORD },
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(screen.getByText('ahmed@test.com')).toBeInTheDocument();
  });

  it('registers a shop with a nested address', async () => {
    const { user } = setup();
    await user.click(roleRadio('roleShop'));
    await typeInto(user, 'shopName', 'Fix It');
    await typeInto(user, 'email', 'shop@test.com');
    await typeInto(user, 'phone', '01001234567');
    await typeInto(user, 'description', 'We fix phones');
    await user.selectOptions(field('shopType'), 'REPAIRER');
    await typeInto(user, 'state', 'Cairo');
    await typeInto(user, 'city', 'Nasr City');
    await typeInto(user, 'street', 'Street 9');
    await typeInto(user, 'building', '12');
    await typeInto(user, 'passwordLabel', VALID_PASSWORD);
    await user.click(ctaBtn('ctaShop'));

    await screen.findByText('otpTitle');
    expect(api.post).toHaveBeenCalledWith(
      '/api/auth/register/shop',
      {
        name: 'Fix It',
        email: 'shop@test.com',
        phone: '01001234567',
        description: 'We fix phones',
        shopType: 'REPAIRER',
        password: VALID_PASSWORD,
        shopAddress: { state: 'Cairo', city: 'Nasr City', street: 'Street 9', building: '12', isDefault: true },
      },
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('registers a delivery user', async () => {
    const { user } = setup();
    await user.click(roleRadio('roleDelivery'));
    await typeInto(user, 'fullName', 'Omar Driver');
    await typeInto(user, 'email', 'd@test.com');
    await typeInto(user, 'phone', '01001234567');
    await typeInto(user, 'address', '5 Tahrir St');
    await typeInto(user, 'passwordLabel', VALID_PASSWORD);
    await user.click(ctaBtn('ctaDelivery'));

    await screen.findByText('otpTitle');
    expect(api.post).toHaveBeenCalledWith(
      '/api/auth/register/delivery',
      { name: 'Omar Driver', email: 'd@test.com', phone: '01001234567', address: '5 Tahrir St', password: VALID_PASSWORD },
      expect.anything(),
    );
  });

  it('shows a loading state and prevents a double submit', async () => {
    const { user } = setup();
    let resolve;
    api.post.mockImplementation(() => new Promise((r) => { resolve = r; }));
    await fillUser(user);
    await user.click(ctaBtn('ctaUser'));

    const busy = await screen.findByRole('button', { name: 'creating' });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(api.post).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ data: {} }));
    expect(await screen.findByText('otpTitle')).toBeInTheDocument();
  });

  it('shows an inline error on the email field when the email already exists (409)', async () => {
    const { user } = setup();
    api.post.mockRejectedValue(httpError(409, { message: 'Email already exists' }));
    await fillUser(user);
    await user.click(ctaBtn('ctaUser'));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
    expect(screen.queryByText('otpTitle')).not.toBeInTheDocument();
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', title: 'emailExistsTitle' })));
  });

  it('shows the server message in a banner for other failures', async () => {
    const { user } = setup();
    api.post.mockRejectedValue(httpError(500, { message: 'Boom' }));
    await fillUser(user);
    await user.click(ctaBtn('ctaUser'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', title: 'registerFailedTitle' })));
  });

  it('falls back to a generic message when the server sends none', async () => {
    const { user } = setup();
    api.post.mockRejectedValue(httpError(500, {}));
    await fillUser(user);
    await user.click(ctaBtn('ctaUser'));
    expect(await screen.findByRole('alert')).toHaveTextContent('registerFailed');
  });
});

describe('Email verification (OTP)', () => {
  it('has six inputs and keeps Verify disabled until the code is complete', async () => {
    const { user } = setup();
    await registerUser(user);
    expect(OTP_BOXES()).toHaveLength(6);
    expect(ctaBtn('verify')).toBeDisabled();
    await typeCode(user, '12345');
    expect(ctaBtn('verify')).toBeDisabled();
    await user.type(OTP_BOXES()[5], '6');
    expect(ctaBtn('verify')).toBeEnabled();
  });

  it('ignores non-digit characters', async () => {
    const { user } = setup();
    await registerUser(user);
    await user.type(OTP_BOXES()[0], 'a');
    expect(OTP_BOXES()[0]).toHaveValue('');
  });

  it('fills every box when a code is pasted', async () => {
    const { user } = setup();
    await registerUser(user);
    await user.click(OTP_BOXES()[0]);
    await user.paste('654321');
    expect(OTP_BOXES().map((b) => b.value).join('')).toBe('654321');
    expect(ctaBtn('verify')).toBeEnabled();
  });

  it('verifies the email and goes to the login page', async () => {
    const { user } = setup();
    await registerUser(user);
    api.post.mockResolvedValue({ data: {} });
    await typeCode(user, '123456');
    await user.click(ctaBtn('verify'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(api.post).toHaveBeenLastCalledWith(
      '/api/auth/verify-email',
      { email: 'ahmed@test.com', optCode: '123456' },
      expect.objectContaining({ signal: expect.anything() }),
    );
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', title: 'verifiedTitle' })));
  });

  it('shows the server error for a wrong code and stays on the step', async () => {
    const { user } = setup();
    await registerUser(user);
    api.post.mockRejectedValue(httpError(400, { message: 'Wrong code' }));
    await typeCode(user, '111111');
    await user.click(ctaBtn('verify'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong code');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the server sends none', async () => {
    const { user } = setup();
    await registerUser(user);
    api.post.mockRejectedValue(httpError(400, {}));
    await typeCode(user, '111111');
    await user.click(ctaBtn('verify'));
    expect(await screen.findByRole('alert')).toHaveTextContent('otpInvalid');
  });

  it('goes back to the form and keeps what was typed', async () => {
    const { user } = setup();
    await registerUser(user);
    await user.click(screen.getByRole('button', { name: 'back' }));
    expect(await screen.findByRole('button', { name: 'ctaUser' })).toBeInTheDocument();
    expect(field('email')).toHaveValue('ahmed@test.com');
    expect(screen.queryByText('otpTitle')).not.toBeInTheDocument();
  });
});