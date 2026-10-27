/**
 * Jest + React Testing Library tests for RepairRequest.jsx (Create React App).
 * Location: src/common/test/RepairRequest.test.jsx   (RepairRequest.jsx is in src/User/)
 *
 * Requirements:
 *   - RepairRequest.jsx has this line above its default export:  export { queryClient };
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/RepairRequest.test.jsx
 *
 * Notes:
 *   - Translation files are mocked with empty objects, so t('someKey') returns the key itself
 *     (e.g. the "Continue" button is found by /continue/).
 *   - CRA sets `resetMocks: true`, so mock implementations are (re)set inside setup(), not in jest.mock factories.
 */
import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../api/api';
import { expireSession } from '../utils/auth';
import { toast } from '../../components/user/UiExtras';
import RepairRequest, { queryClient } from '../../User/Repair';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useNavigationType: () => 'POP', /* POP = no scroll-to-top side effect */
}));

let mockLanguage = 'en';
jest.mock('../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));

/* empty translations -> t(key) returns the key */
jest.mock('../../locales/en/translation.json', () => ({ repair: {} }));
jest.mock('../../locales/ar/translation.json', () => ({ repair: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ repair: {} }));

jest.mock('../utils/auth', () => ({
  authHeaders: () => ({ Authorization: 'Bearer test-token' }),
  cleanText: (v, max) => String(v || '').trim().slice(0, max || 100000),
  expireSession: jest.fn(),
  isUnauthorized: (err) => err?.response?.status === 401,
  useAuthGuard: () => 'test-token',
}));

jest.mock('../../components/user/UiExtras', () => ({
  EXTRAS_CSS: '',
  Toaster: () => null,
  toast: jest.fn(),
}));
jest.mock('../../components/user/ListingKit', () => ({
  LISTING_CSS: '',
  useLangFont: () => ({ style: {}, className: '' }),
  HeroWave: () => null,
  clean: (v, max) => String(v ?? '').slice(0, max || 100000),
}));
jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null }));
jest.mock('../../components/user/Ui3D', () => {
  const React = require('react');
  return {
    __esModule: true,
    UI3D_CSS: '',
    Defs3D: () => null,
    Chip3D: ({ children }) => React.createElement('span', null, children),
    Btn3D: ({ as: As = 'button', tone, darkMode, children, ...rest }) =>
      React.createElement(As, As === 'button' ? { type: 'button', ...rest } : rest, children),
    PageBtn: ({ active, darkMode, children, ...rest }) =>
      React.createElement('button', { type: 'button', 'aria-current': active ? 'page' : undefined, ...rest }, children),
    getPaginationRange: (page, total) => Array.from({ length: total }, (_, i) => i + 1),
  };
});

/* Headless UI's transitions don't finish in jsdom, so use a plain dialog */
jest.mock('@headlessui/react', () => {
  const React = require('react');
  const el = (tag) => ({ children }) => React.createElement(tag, null, children);
  return {
    Dialog: ({ open, children }) => (open ? React.createElement('div', { role: 'dialog' }, children) : null),
    DialogBackdrop: () => null,
    DialogPanel: el('div'),
    DialogTitle: el('h2'),
  };
});

/* ───────── fake data ───────── */

const CATEGORIES = [
  { id: 1, name: 'Phone' },
  { id: 2, name: 'Laptop' },
];

const shop = (o = {}) => ({
  id: 's1',
  name: 'Fix It',
  shopType: 'REPAIRER',
  activate: true,
  verified: true,
  rating: 4.5,
  email: 'a@b.com',
  phone: '+201001112222',
  shopAddress: { street: 'Main St', city: 'Cairo', state: 'Cairo' },
  ...o,
});

const SHOPS = [
  shop(),
  shop({ id: 's2', name: 'Sell Only', shopType: 'SELLER' }) /* not a repair shop: must be hidden */,
  shop({ id: 's3', name: 'Closed Shop', shopType: 'BOTH', activate: false, verified: false, rating: null }),
];

const httpError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

/* ───────── helpers ───────── */

/* Fakes the backend and renders the page. Mutate the returned `backend` to change what the next request returns. */
function setup(opts = {}) {
  const backend = { categories: CATEGORIES, shops: SHOPS, categoriesStatus: null, shopsStatus: null, ...opts };
  api.get.mockImplementation(async (path) => {
    if (path === '/api/categories') {
      if (backend.categoriesStatus) throw httpError(backend.categoriesStatus);
      return { data: backend.categories };
    }
    if (path === '/api/users/shops/all') {
      if (backend.shopsStatus) throw httpError(backend.shopsStatus);
      return { data: backend.shops };
    }
    return { data: [] };
  });
  api.post.mockResolvedValue({ data: {} });
  const user = userEvent.setup();
  render(<RepairRequest />);
  return { user, backend };
}

const textbox = () => screen.getByRole('textbox', { name: 'describeProblem' });
const h2 = (name) => screen.findByRole('heading', { level: 2, name });
const continueBtn = () => screen.getByRole('button', { name: /continue/i });
const sendBtn = () => screen.getByRole('button', { name: /sendRepairRequest/ });
const shopCard = (name) =>
  screen.getAllByText(name).map((el) => el.closest('[role="radio"]')).find(Boolean);
const shopCalls = () => api.get.mock.calls.filter(([p]) => p === '/api/users/shops/all').length;

/* Step 1 -> 2: types a description and continues. */
const toStep2 = async (user, text = 'Cracked screen') => {
  await user.type(textbox(), text);
  await user.click(continueBtn());
  await h2('deviceType');
};

/* Step 2 -> 3: picks the "Phone" category and continues. */
const toStep3 = async (user) => {
  await toStep2(user);
  await user.click(await screen.findByRole('button', { name: 'Phone' }));
  await user.click(continueBtn());
  await h2('chooseShopTitle');
};

/* Step 3 -> 4: picks the "Fix It" shop and sends the request. */
const toStep4 = async (user) => {
  await toStep3(user);
  await user.click(await screen.findByText('Fix It'));
  await user.click(sendBtn());
  await h2('requestSent');
};

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  localStorage.clear();
  sessionStorage.clear();
  mockLanguage = 'en';
});

/* ───────── tests ───────── */

describe('Page basics', () => {
  it('sets the page title and shows the repair journey', async () => {
    setup();
    await h2('describeProblem');
    expect(document.title).toBe('Book Repair | Tech-Restore');
    expect(screen.getByText('repairJourney')).toBeInTheDocument();
    expect(screen.getByText('submittedDesc')).toBeInTheDocument();
    expect(screen.getByText('deviceDeliveredDesc')).toBeInTheDocument();
  });

  it('renders right-to-left for Arabic', async () => {
    mockLanguage = 'ar';
    setup();
    await h2('describeProblem');
    expect(document.querySelector('[dir="rtl"][lang="ar"]')).toBeInTheDocument();
  });
});

describe('Step 1: describe the problem', () => {
  it('disables Continue until a description is typed', async () => {
    const { user } = setup();
    await h2('describeProblem');
    expect(continueBtn()).toBeDisabled();
    await user.type(textbox(), 'Broken screen');
    expect(continueBtn()).toBeEnabled();
  });

  it('blocks a whitespace-only description and shows an inline error', async () => {
    const { user } = setup();
    await h2('describeProblem');
    await user.type(textbox(), '   ');
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't be blank/i);
    expect(textbox()).toHaveAttribute('aria-invalid', 'true');
    expect(continueBtn()).toBeDisabled();
  });

  it('shows a live character counter and caps the length', async () => {
    const { user } = setup();
    await h2('describeProblem');
    await user.type(textbox(), 'hello');
    expect(screen.getByText('5 / 1000')).toBeInTheDocument();
    expect(textbox()).toHaveAttribute('maxLength', '1000');
  });

  it('appends suggestion chips to the description', async () => {
    const { user } = setup();
    await h2('describeProblem');
    await user.click(screen.getByRole('button', { name: '+ Screen cracked' }));
    expect(textbox()).toHaveValue('Screen cracked');
    await user.click(screen.getByRole('button', { name: '+ Battery issue' }));
    expect(textbox()).toHaveValue('Screen cracked, battery issue');
  });

  it('moves to step 2 and marks it as the current step', async () => {
    const { user } = setup();
    await h2('describeProblem');
    await toStep2(user);
    expect(screen.getByText('category').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByText(/step 2 of 4/).length).toBeGreaterThan(0);
  });
});

describe('Step 2: device category', () => {
  it('lists the categories and blocks Continue until one is picked', async () => {
    const { user } = setup();
    await toStep2(user);
    expect(await screen.findByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Laptop' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/select a device type/i);
    expect(continueBtn()).toBeDisabled();
  });

  it('selects a category and enables Continue', async () => {
    const { user } = setup();
    await toStep2(user);
    await user.click(await screen.findByRole('button', { name: 'Phone' }));
    expect(screen.getByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/select a device type/i)).not.toBeInTheDocument();
    expect(continueBtn()).toBeEnabled();
  });

  it('keeps the description when going back', async () => {
    const { user } = setup();
    await toStep2(user, 'Water damage');
    await user.click(screen.getByRole('button', { name: /back/ }));
    await h2('describeProblem');
    expect(textbox()).toHaveValue('Water damage');
  });

  it('paginates categories (6 per page)', async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Cat ${i + 1}` }));
    const { user } = setup({ categories: many });
    await toStep2(user);
    expect(await screen.findByRole('button', { name: 'Cat 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cat 7' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByRole('button', { name: 'Cat 7' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cat 1' })).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no categories', async () => {
    const { user } = setup({ categories: [] });
    await toStep2(user);
    expect(await screen.findByText(/No device types available yet/)).toBeInTheDocument();
  });

  it('shows an error and recovers on "Try again"', async () => {
    const { user, backend } = setup({ categoriesStatus: 500 });
    await toStep2(user);
    expect(await screen.findByText(/couldn't load device types/i)).toBeInTheDocument();

    backend.categoriesStatus = null;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Phone' })).toBeInTheDocument();
  });

  it('expires the session on a 401', async () => {
    setup({ categoriesStatus: 401 });
    await h2('describeProblem');
    await screen.findByRole('textbox', { name: 'describeProblem' });
    await act(async () => {});
    expect(expireSession).toHaveBeenCalledWith(mockNavigate);
  });
});

describe('Step 3: choose a shop', () => {
  it('does not load shops before step 3', async () => {
    const { user } = setup();
    await toStep2(user);
    await user.click(await screen.findByRole('button', { name: 'Phone' }));
    expect(shopCalls()).toBe(0);
    await user.click(continueBtn());
    await h2('chooseShopTitle');
    await screen.findByText('Fix It');
    expect(shopCalls()).toBe(1);
  });

  it('only lists repair shops (REPAIRER / BOTH)', async () => {
    const { user } = setup();
    await toStep3(user);
    expect(await screen.findByText('Fix It')).toBeInTheDocument();
    expect(screen.getByText('Closed Shop')).toBeInTheDocument();
    expect(screen.queryByText('Sell Only')).not.toBeInTheDocument();
  });

  it('shows rating and verified badge', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Fix It');
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('newRating')).toBeInTheDocument(); /* Closed Shop has no rating */
    expect(screen.getAllByText('Verified')).toHaveLength(1);
  });

  it('selects an active shop and enables the send button', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Fix It');
    expect(sendBtn()).toBeDisabled();
    await user.click(screen.getByText('Fix It'));
    expect(shopCard('Fix It')).toHaveAttribute('aria-checked', 'true');
    expect(sendBtn()).toBeEnabled();
  });

  it('cannot select an inactive shop', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Closed Shop');
    expect(shopCard('Closed Shop')).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByText('Closed Shop'));
    expect(shopCard('Closed Shop')).toHaveAttribute('aria-checked', 'false');
    expect(sendBtn()).toBeDisabled();
  });

  it('can be selected with the keyboard', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Fix It');
    shopCard('Fix It').focus();
    await user.keyboard('{Enter}');
    expect(shopCard('Fix It')).toHaveAttribute('aria-checked', 'true');
  });

  it('paginates shops (4 per page)', async () => {
    const five = Array.from({ length: 5 }, (_, i) => shop({ id: `s${i}`, name: `Shop ${i + 1}` }));
    const { user } = setup({ shops: five });
    await toStep3(user);
    await screen.findByText('Shop 1');
    expect(screen.queryByText('Shop 5')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Shop 5')).toBeInTheDocument();
  });

  it('shows an empty state when there are no repair shops', async () => {
    const { user } = setup({ shops: [] });
    await toStep3(user);
    expect(await screen.findByText('noShops')).toBeInTheDocument();
  });

  it('shows an error and recovers on "Try again"', async () => {
    const { user, backend } = setup({ shopsStatus: 500 });
    await toStep3(user);
    expect(await screen.findByText(/couldn't load repair shops/i)).toBeInTheDocument();

    backend.shopsStatus = null;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Fix It')).toBeInTheDocument();
  });
});

describe('Shop details modal', () => {
  it('opens with the shop details without selecting the shop', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Fix It');
    await user.click(screen.getAllByRole('button', { name: 'shopDetailsAria' })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('a@b.com')).toBeInTheDocument();
    expect(within(dialog).getByText('+201001112222')).toBeInTheDocument();
    expect(within(dialog).getByText('Main St, Cairo, Cairo')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'phone' })).toHaveAttribute('href', 'tel:+201001112222');
    expect(shopCard('Fix It')).toHaveAttribute('aria-checked', 'false');
  });

  it('closes with the close button', async () => {
    const { user } = setup();
    await toStep3(user);
    await screen.findByText('Fix It');
    await user.click(screen.getAllByRole('button', { name: 'shopDetailsAria' })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Sending the request', () => {
  it('posts the description, category and shop, then shows the success step', async () => {
    sessionStorage.setItem('acct:repairs', '[]');
    const { user } = setup();
    await toStep4(user);

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      '/api/users/repair-request/s1',
      { description: 'Cracked screen', deviceCategory: '1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
    expect(screen.getByText('Fix It')).toBeInTheDocument();
    expect(screen.getByText('Cairo, Cairo')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }));
  });

  it('drops the stale repairs cache of the account page', async () => {
    sessionStorage.setItem('acct:repairs', '[{"id":"old"}]');
    const { user } = setup();
    await toStep4(user);
    expect(sessionStorage.getItem('acct:repairs')).toBeNull();
  });

  it('shows a loading state and prevents double submit', async () => {
    let resolve;
    const { user } = setup();
    await toStep3(user);
    api.post.mockImplementation(() => new Promise((r) => { resolve = r; }));
    await user.click(await screen.findByText('Fix It'));
    await user.click(sendBtn());

    const sending = await screen.findByRole('button', { name: /sending/ });
    expect(sending).toBeDisabled();
    await user.click(sending);
    expect(api.post).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ data: {} }));
    await h2('requestSent');
  });

  it('shows the server error and stays on step 3 when sending fails', async () => {
    const { user } = setup();
    await toStep3(user);
    api.post.mockRejectedValue(httpError(500, { message: 'Server exploded' }));
    await user.click(await screen.findByText('Fix It'));
    await user.click(sendBtn());

    await act(async () => {});
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Server exploded' }));
    expect(screen.queryByRole('heading', { level: 2, name: 'requestSent' })).not.toBeInTheDocument();
    expect(sendBtn()).toBeEnabled();
  });

  it('expires the session when sending returns 401', async () => {
    const { user } = setup();
    await toStep3(user);
    api.post.mockRejectedValue(httpError(401));
    await user.click(await screen.findByText('Fix It'));
    await user.click(sendBtn());

    await act(async () => {});
    expect(expireSession).toHaveBeenCalledWith(mockNavigate);
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
  });
});

describe('Step 4: success', () => {
  it('"new request" starts over with an empty form', async () => {
    const { user } = setup();
    await toStep4(user);
    await user.click(screen.getByRole('button', { name: /newRequest/ }));
    await h2('describeProblem');
    expect(textbox()).toHaveValue('');
    expect(continueBtn()).toBeDisabled();
  });

  it('"view my requests" goes to the account page', async () => {
    const { user } = setup();
    await toStep4(user);
    await user.click(screen.getByRole('button', { name: /viewMyRequests/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/account');
  });
});