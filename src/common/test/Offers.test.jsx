/**
 * Jest + React Testing Library tests for Offers.jsx (Create React App).
 * Location: src/common/test/Offers.test.jsx   (Offers.jsx is in src/User/)
 *
 * Requirements:
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/Offers.test.jsx
 *
 * Notes:
 *   - The "offersPage" translations are mocked with empty objects, so t('someKey') returns the key itself
 *     (e.g. the detail buttons are found by name 'details').
 *   - Offers creates ONE module-level QueryClient, so the react-query mock below tracks every client and
 *     beforeEach clears their caches (otherwise data would leak from one test into the next).
 *   - The headlessui Dialog is replaced by a plain element (its enter/exit transitions never finish in jsdom).
 *   - Dates are built relative to "now", so the tests never go stale.
 *   - CRA sets `resetMocks: true`, so mock implementations are (re)set inside the tests, not in jest.mock factories.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../api/api';
import Offers from '../../User/Offers';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

/* track the module-level QueryClient so its cache can be emptied between tests */
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  global.__testQueryClients = [];
  class TrackedQueryClient extends actual.QueryClient {
    constructor(...args) {
      super(...args);
      global.__testQueryClients.push(this);
    }
  }
  return { ...actual, QueryClient: TrackedQueryClient };
});

const mockNavigate = jest.fn();
let mockNavType = 'PUSH';
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ to, children, onClick, ...rest }) =>
      React.createElement(
        'a',
        { href: to, onClick: (e) => { e.preventDefault(); if (onClick) onClick(e); }, ...rest },
        children,
      ),
    useNavigate: () => mockNavigate,
    useNavigationType: () => mockNavType,
  };
});

jest.mock('@headlessui/react', () => {
  const React = require('react');
  return {
    Dialog: ({ open, children }) => (open ? React.createElement('div', { role: 'dialog' }, children) : null),
    DialogBackdrop: () => null,
    DialogPanel: ({ children }) => React.createElement('div', null, children),
    DialogTitle: ({ children }) => React.createElement('h2', null, children),
  };
});

let mockToken = 'tok';
const mockExpireSession = jest.fn();
jest.mock('../utils/auth', () => ({
  __esModule: true,
  authHeaders: () => ({ Authorization: 'Bearer tok' }),
  expireSession: (...a) => mockExpireSession(...a),
  isUnauthorized: (e) => e?.response?.status === 401,
  useAuthGuard: () => mockToken,
}));

let mockLanguage = 'en';
jest.mock('../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));

/* empty translations -> t(key) returns the key */
jest.mock('../../locales/en/translation.json', () => ({ offersPage: {} }));
jest.mock('../../locales/ar/translation.json', () => ({ offersPage: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ offersPage: {} }));

jest.mock('../../components/user/Ui3D', () => {
  const React = require('react');
  return {
    __esModule: true,
    UI3D_CSS: '',
    Defs3D: () => null,
    Chip3D: ({ children }) => React.createElement('span', null, children),
    Btn3D: ({ as: As = 'button', tone, darkMode, children, ...rest }) =>
      React.createElement(As, As === 'button' ? { type: 'button', ...rest } : rest, children),
    PageBtn: ({ darkMode, active, children, ...rest }) =>
      React.createElement('button', { type: 'button', 'aria-current': active ? 'page' : undefined, ...rest }, children),
    getPaginationRange: (page, total) => Array.from({ length: total }, (_, i) => i + 1),
  };
});

jest.mock('../../components/user/ListingKit', () => ({
  __esModule: true,
  LISTING_CSS: '',
  useLangFont: () => ({ style: {}, className: 'font-poppins' }),
  HeroWave: () => null,
  clean: (s, n) => String(s ?? '').slice(0, n),
}));

const mockToast = jest.fn();
jest.mock('../../components/user/UiExtras', () => ({
  __esModule: true,
  EXTRAS_CSS: '',
  Toaster: () => null,
  toast: (...a) => mockToast(...a),
}));

jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null }));

/* ───────── test data & helpers ───────── */

const httpError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } });

const DAY = 86400000;
/* n days ahead, minus an hour so Math.ceil() in the page lands exactly on n */
const inDays = (n) => new Date(Date.now() + n * DAY - 3600000).toISOString();
const START = '2026-01-10T12:00:00Z';

const offer = (id, extra = {}) => ({
  id,
  name: `Offer ${id}`,
  description: `Description ${id}`,
  discountType: 'PERCENTAGE',
  discountValue: 10,
  startDate: START,
  endDate: inDays(30),
  status: 'ACTIVE',
  shopId: 's1',
  shopName: 'Fix It',
  ...extra,
});

const SUMMER = offer(1, { name: 'Summer Sale', description: 'Big savings', discountValue: 25 });

const manyOffers = (n) => Array.from({ length: n }, (_, i) => offer(i + 1));

/* `detail` can be an object (returned for any id), a function (id) => object | throws, or omitted (404) */
function mockApi({ list = [SUMMER], listError, detail, plain = false } = {}) {
  api.get.mockImplementation(async (url) => {
    if (url === '/api/users/offers') {
      if (listError) throw listError;
      return { data: plain ? list : { content: list } }; /* `plain` = bare array instead of a {content:[…]} page */
    }
    if (url.startsWith('/api/users/offers/')) {
      const id = decodeURIComponent(url.split('/').pop());
      if (typeof detail === 'function') return { data: detail(id) };
      if (detail !== undefined) return { data: detail };
      throw httpError(404, {});
    }
    throw new Error(`unexpected GET ${url}`);
  });
}

function setup(opts = {}) {
  mockApi(opts);
  const user = userEvent.setup();
  const utils = render(<Offers darkMode={false} />);
  return { user, ...utils };
}

const cardOf = (name) => screen.getByRole('heading', { level: 3, name }).closest('article');
const findCard = async (name) => (await screen.findByRole('heading', { level: 3, name })).closest('article');

/*
 * The same label can appear in several places (e.g. 'activeOffers' is both the banner <h1> and the
 * stats label), so getByText would throw "multiple elements". Instead, look at every match and keep the
 * one that sits in a label/value pair: its closest <div> holds exactly one <dd>. That skips headings,
 * the banner (which holds all the stats) and card chips.
 */
const statValue = (label) => {
  const pair = screen
    .getAllByText(label)
    .map((el) => el.closest('div'))
    .find((div) => div && div.querySelectorAll('dd').length === 1);
  if (!pair) throw new Error(`No stat card found for label "${label}"`);
  return pair.querySelector('dd');
};

async function openDetail(user, name = 'Summer Sale') {
  const card = await findCard(name);
  await user.click(within(card).getByRole('button', { name: 'details' }));
  return screen.findByRole('dialog');
}

beforeEach(() => {
  jest.clearAllMocks();
  (global.__testQueryClients || []).forEach((c) => c.clear());
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  mockLanguage = 'en';
  mockToken = 'tok';
  mockNavType = 'PUSH';
});

/* ───────── tests ───────── */

describe('Page basics', () => {
  it('sets the page title and shows the banner', async () => {
    setup();
    expect(document.title).toBe('Exclusive Offers | Tech-Restore');
    expect(screen.getByRole('heading', { level: 1, name: 'activeOffers' })).toBeInTheDocument();
    expect(await screen.findByText('1 available')).toBeInTheDocument();
  });

  it('renders right-to-left for Arabic and sets the lang attribute', async () => {
    mockLanguage = 'ar';
    const { container } = setup();
    await findCard('Summer Sale');
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
    expect(container.firstChild).toHaveAttribute('lang', 'ar');
  });

  it('scrolls to the top on a normal navigation', () => {
    setup();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('leaves scrolling to the browser on back/forward (POP)', () => {
    mockNavType = 'POP';
    setup();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

describe('Loading the offers', () => {
  it('requests the offers with the auth headers and an abort signal', async () => {
    setup();
    await findCard('Summer Sale');
    expect(api.get).toHaveBeenCalledWith('/api/users/offers', expect.objectContaining({ headers: { Authorization: 'Bearer tok' }, signal: expect.anything() }));
  });

  it('does not call the API without a token', () => {
    mockToken = null;
    setup();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('accepts a plain array response', async () => {
    setup({ list: [SUMMER], plain: true });
    expect(await screen.findByRole('heading', { level: 3, name: 'Summer Sale' })).toBeInTheDocument();
  });

  it('skips empty entries and entries without an id, and converts ids to strings', async () => {
    setup({ list: [null, { name: 'No id' }, offer(0, { name: 'Zero id' }), SUMMER] });
    expect(await findCard('Summer Sale')).toBeInTheDocument();
    expect(cardOf('Zero id')).toBeInTheDocument(); /* id 0 is a valid id */
    expect(screen.queryByRole('heading', { level: 3, name: 'No id' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('shows the empty state when there are no offers', async () => {
    setup({ list: [] });
    expect(await screen.findByText('noActive')).toBeInTheDocument();
    expect(screen.getAllByText('checkBack').length).toBeGreaterThan(0);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows an error box with a working "Try again" button on a server error', async () => {
    mockApi({ list: [SUMMER] });
    api.get.mockRejectedValueOnce(httpError(500, {})).mockResolvedValueOnce({ data: { content: [SUMMER] } });
    const user = userEvent.setup();
    render(<Offers darkMode={false} />);

    expect(await screen.findByText("We couldn't load offers right now.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Summer Sale' })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('expires the session on 401 instead of showing the error box', async () => {
    setup({ listError: httpError(401, {}) });
    await waitFor(() => expect(mockExpireSession).toHaveBeenCalledWith(mockNavigate));
    expect(screen.queryByText("We couldn't load offers right now.")).not.toBeInTheDocument();
  });
});

describe('Offer cards', () => {
  it('shows a percentage offer', async () => {
    setup();
    const card = within(await findCard('Summer Sale'));
    expect(card.getByText('25%')).toBeInTheDocument();
    expect(card.getByText('off')).toBeInTheDocument();
    expect(card.getByText('percentageDiscount')).toBeInTheDocument();
    expect(card.getByText('Big savings')).toBeInTheDocument();
    expect(card.getByText('active')).toBeInTheDocument();
  });

  it('shows a fixed-amount offer with the EGP unit and no percentage note', async () => {
    setup({ list: [offer(1, { name: 'Fixed', discountType: 'FIXED_AMOUNT', discountValue: 150 })] });
    const card = within(await findCard('Fixed'));
    expect(card.getByText('150')).toBeInTheDocument();
    expect(card.getByText('EGP')).toBeInTheDocument();
    expect(card.queryByText('percentageDiscount')).not.toBeInTheDocument();
    expect(card.queryByText('150%')).not.toBeInTheDocument();
  });

  it.each([
    ['PERCENT', '30%'],
    ['percentage', '30%'],
    ['FIXED_VALUE', '30'],
    ['FIXED', '30'],
  ])('understands the discount type name %s', async (discountType, shown) => {
    setup({ list: [offer(1, { name: 'Typed', discountType, discountValue: 30 })] });
    const card = within(await findCard('Typed'));
    expect(card.getByText(shown)).toBeInTheDocument();
    if (shown === '30') expect(card.getByText('EGP')).toBeInTheDocument();
  });

  it('never guesses a unit for an unknown or missing discount type', async () => {
    setup({ list: [offer(1, { name: 'Unknown', discountType: null, discountValue: 40 })] });
    const card = within(await findCard('Unknown'));
    expect(card.getByText('40')).toBeInTheDocument();
    expect(card.queryByText('EGP')).not.toBeInTheDocument();
    expect(card.queryByText('percentageDiscount')).not.toBeInTheDocument();
  });

  it('caps a percentage at 100 and a negative value at 0', async () => {
    setup({ list: [offer(1, { name: 'Huge', discountValue: 250 }), offer(2, { name: 'Negative', discountValue: -5 })] });
    expect(within(await findCard('Huge')).getByText('100%')).toBeInTheDocument();
    expect(within(cardOf('Negative')).getByText('0%')).toBeInTheDocument();
  });

  it('shows inactive for any status other than ACTIVE', async () => {
    setup({ list: [offer(1, { name: 'Paused', status: 'PAUSED' })] });
    expect(within(await findCard('Paused')).getByText('inactive')).toBeInTheDocument();
  });

  it('uses the fallback text when there is no description', async () => {
    setup({ list: [offer(1, { name: 'Plain', description: '' })] });
    expect(within(await findCard('Plain')).getByText('descriptionFallback')).toBeInTheDocument();
  });

  it('shows the valid period', async () => {
    setup({ list: [offer(1, { name: 'Dated', endDate: '2099-12-31T12:00:00Z' })] });
    expect(within(await findCard('Dated')).getByText(/10 Jan.*31 Dec 2099/)).toBeInTheDocument();
  });

  it('shows the time left, highlighted when the offer ends soon', async () => {
    setup({ list: [offer(1, { name: 'Soon', endDate: inDays(5) })] });
    expect(within(await findCard('Soon')).getByText(/5 days/)).toBeInTheDocument();
  });

  it('shows no time-left chip for an ended offer', async () => {
    setup({ list: [offer(1, { name: 'Ended', endDate: '2020-01-01T00:00:00Z' })] });
    expect(within(await findCard('Ended')).queryByText(/days?|tomorrow|today/)).not.toBeInTheDocument();
  });

  it('links to the shop and encodes its id', async () => {
    setup({ list: [offer(1, { name: 'Linked', shopId: 'a b/c' })] });
    expect(within(await findCard('Linked')).getByRole('link', { name: 'Fix It' })).toHaveAttribute('href', '/shops/a%20b%2Fc');
  });

  it('shows no shop link when the shop id is missing', async () => {
    setup({ list: [offer(1, { name: 'Orphan', shopId: null })] });
    expect(within(await findCard('Orphan')).queryByRole('link')).not.toBeInTheDocument();
  });

  it('cuts very long names to 120 characters', async () => {
    setup({ list: [offer(1, { name: 'N'.repeat(150) })] });
    expect(await screen.findByRole('heading', { level: 3, name: 'N'.repeat(120) })).toBeInTheDocument();
  });
});

describe('Stats card', () => {
  const STATS_OFFERS = [
    offer(1, { endDate: inDays(2) }), /* ending soon */
    offer(2, { endDate: inDays(3), discountValue: 40 }), /* ending soon, best percentage */
    offer(3, { endDate: inDays(10) }),
    offer(4, { endDate: inDays(1), status: 'INACTIVE' }), /* inactive: not "ending soon" */
    offer(5, { endDate: '2020-01-01T00:00:00Z' }), /* ended: not "ending soon" */
  ];

  it('counts all offers, the ones ending soon and the best percentage', async () => {
    setup({ list: STATS_OFFERS });
    await findCard('Offer 1');
    expect(statValue('activeOffers')).toHaveTextContent('5');
    expect(statValue('Ending soon')).toHaveTextContent('2');
    expect(statValue('Best discount')).toHaveTextContent('40%');
  });

  it('ignores fixed-amount offers for the best discount and shows a dash when there is none', async () => {
    setup({ list: [offer(1, { discountType: 'FIXED_AMOUNT', discountValue: 500 })] });
    await findCard('Offer 1');
    expect(statValue('Best discount')).toHaveTextContent('–');
  });

  it('shows zeros when there are no offers', async () => {
    setup({ list: [] });
    await screen.findByText('noActive');
    expect(statValue('activeOffers')).toHaveTextContent('0');
    expect(statValue('Ending soon')).toHaveTextContent('0');
  });
});

describe('Pagination', () => {
  it('has no pager for 6 offers or fewer', async () => {
    setup({ list: manyOffers(6) });
    await findCard('Offer 1');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows 6 offers per page and moves to the next page', async () => {
    const { user } = setup({ list: manyOffers(8) });
    await findCard('Offer 1');
    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.queryByRole('heading', { level: 3, name: 'Offer 7' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await findCard('Offer 7')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('heading', { level: 3, name: 'Offer 1' })).not.toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last page', async () => {
    const { user } = setup({ list: manyOffers(8) });
    await findCard('Offer 1');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await findCard('Offer 7');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('jumps to a page number and goes back', async () => {
    const { user } = setup({ list: manyOffers(8) });
    await findCard('Offer 1');
    await user.click(screen.getByRole('button', { name: '2' }));
    await findCard('Offer 8');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(await findCard('Offer 1')).toBeInTheDocument();
  });
});

describe('Detail dialog', () => {
  it('opens with the card data and the details of the offer', async () => {
    const { user } = setup();
    const dialog = within(await openDetail(user));
    expect(dialog.getByRole('heading', { level: 2, name: 'Summer Sale' })).toBeInTheDocument();
    expect(dialog.getByText('Big savings')).toBeInTheDocument();
    expect(dialog.getByText('youSave')).toBeInTheDocument();
    expect(dialog.getByText('25%')).toBeInTheDocument();
    expect(dialog.getByText('validPeriod')).toBeInTheDocument();
    expect(dialog.getByText('shop')).toBeInTheDocument();
    expect(dialog.getByText('Fix It')).toBeInTheDocument();
  });

  it('shows a fixed amount as money', async () => {
    const { user } = setup({ list: [offer(1, { name: 'Fixed', discountType: 'FIXED_AMOUNT', discountValue: 150 })] });
    const dialog = within(await openDetail(user, 'Fixed'));
    expect(dialog.getByText('EGP 150')).toBeInTheDocument();
  });

  it('requests the single offer with the id encoded', async () => {
    const { user } = setup({ list: [offer('a/b', { name: 'Slash' })], detail: (id) => offer(id, { name: 'Slash' }) });
    await openDetail(user, 'Slash');
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/users/offers/a%2Fb', expect.objectContaining({ headers: { Authorization: 'Bearer tok' }, signal: expect.anything() })));
  });

  it('refreshes the content with the fresher data from the server', async () => {
    const { user } = setup({ detail: { ...SUMMER, name: 'Summer Sale (updated)', description: 'Updated text' } });
    const dialog = within(await openDetail(user));
    expect(await dialog.findByRole('heading', { level: 2, name: 'Summer Sale (updated)' })).toBeInTheDocument();
    expect(dialog.getByText('Updated text')).toBeInTheDocument();
  });

  it('falls back to the list data when the single-offer lookup returns 404', async () => {
    const { user } = setup(); /* detail endpoint answers 404 */
    const dialog = within(await openDetail(user));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/users/offers/1', expect.anything()));
    expect(dialog.getByRole('heading', { level: 2, name: 'Summer Sale' })).toBeInTheDocument();
    expect(dialog.queryByText('notFound')).not.toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('falls back to the list data when the server answers with an invalid body', async () => {
    const { user } = setup({ detail: {} });
    const dialog = within(await openDetail(user));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/users/offers/1', expect.anything()));
    expect(dialog.getByRole('heading', { level: 2, name: 'Summer Sale' })).toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('expires the session when the lookup answers 401', async () => {
    mockApi({ list: [SUMMER] });
    const base = api.get.getMockImplementation();
    api.get.mockImplementation(async (url, ...rest) => {
      if (url.startsWith('/api/users/offers/')) throw httpError(401, {});
      return base(url, ...rest);
    });
    const user = userEvent.setup();
    render(<Offers darkMode={false} />);
    await openDetail(user);
    await waitFor(() => expect(mockExpireSession).toHaveBeenCalledWith(mockNavigate));
  });

  it('shows the visit links only when the offer has a shop', async () => {
    const { user } = setup({ list: [offer(1, { name: 'No shop', shopId: null, shopName: '' })] });
    const dialog = within(await openDetail(user, 'No shop'));
    expect(dialog.queryByRole('link', { name: 'visit' })).not.toBeInTheDocument();
    expect(dialog.queryByRole('link', { name: /visitShop/ })).not.toBeInTheDocument();
  });

  it('links to the shop from the dialog', async () => {
    const { user } = setup();
    const dialog = within(await openDetail(user));
    expect(dialog.getByRole('link', { name: 'visit' })).toHaveAttribute('href', '/shops/s1');
    expect(dialog.getByRole('link', { name: /visitShop/ })).toHaveAttribute('href', '/shops/s1');
  });

  it('closes with the X button', async () => {
    const { user } = setup();
    const dialog = within(await openDetail(user));
    await user.click(dialog.getAllByRole('button', { name: 'close' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with the footer Close button', async () => {
    const { user } = setup();
    const dialog = within(await openDetail(user));
    const buttons = dialog.getAllByRole('button', { name: 'close' });
    await user.click(buttons[buttons.length - 1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the user follows a shop link', async () => {
    const { user } = setup();
    const dialog = within(await openDetail(user));
    await user.click(dialog.getByRole('link', { name: /visitShop/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the data of the offer that was opened', async () => {
    const { user } = setup({ list: [offer(1, { name: 'First' }), offer(2, { name: 'Second', description: 'Second text' })] });
    await user.click(within(await findCard('First')).getByRole('button', { name: 'details' }));
    await user.click(within(await screen.findByRole('dialog')).getAllByRole('button', { name: 'close' })[0]);

    await user.click(within(cardOf('Second')).getByRole('button', { name: 'details' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading', { level: 2, name: 'Second' })).toBeInTheDocument();
    expect(dialog.getByText('Second text')).toBeInTheDocument();
  });
});