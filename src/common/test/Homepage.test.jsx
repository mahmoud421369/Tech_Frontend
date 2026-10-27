/**
 * Jest + React Testing Library tests for Homepage.jsx (Create React App).
 * Location: src/common/test/Homepage.test.jsx   (Homepage.jsx is in src/User/, next to Service.jsx)
 *
 * Requirements:
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/Homepage.test.jsx
 *
 * Notes:
 *   - The English "homepage" translations are mocked with just two placeholder strings; every other key is
 *     returned as the key itself (e.g. the cart button is found by name 'addToCart').
 *   - Homepage creates ONE module-level QueryClient, so the react-query mock below tracks every client and
 *     beforeEach clears their caches (otherwise data would leak from one test into the next).
 *   - jwt-decode is faked: 'expired*' is expired, 'bad*' cannot be decoded, anything else is valid.
 *   - Hero, OffersSlider, Service, the Device3D / ListingKit / UiExtras helpers and the illustrations are replaced
 *     by tiny stand-ins; they have their own tests.
 *   - CRA sets `resetMocks: true`, so mock implementations are (re)set inside the tests, not in jest.mock factories.
 */
import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../api/api';
import Homepage from '../../User/Homepage';

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
  };
});

jest.mock('jwt-decode', () => ({
  jwtDecode: (token) => {
    if (token.startsWith('bad')) throw new Error('bad token');
    return { exp: Math.floor(Date.now() / 1000) + (token.startsWith('expired') ? -60 : 3600) };
  },
}));

let mockLanguage = 'en';
jest.mock('../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));

/* mostly empty translations -> tr(key) returns the key; two placeholder strings prove {{vars}} are replaced */
jest.mock('../../locales/en/translation.json', () => ({
  homepage: { noResultsFor: 'No results for {{query}}', addedToCart: 'Added {{name}} to your cart' },
}));
jest.mock('../../locales/ar/translation.json', () => ({ homepage: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ homepage: {} }));

jest.mock('../../components', () => {
  const React = require('react');
  return {
    __esModule: true,
    Hero: () => React.createElement('div', { 'data-testid': 'hero' }),
    OffersSlider: () => React.createElement('div', { 'data-testid': 'offers-slider' }),
  };
});

jest.mock('../../User/Service', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('div', { 'data-testid': 'service' }) };
});

jest.mock('../../components/user/Device3D', () => {
  const React = require('react');
  return {
    __esModule: true,
    Defs3D: () => null,
    Device3DStyles: () => null,
    DeviceScene: () => null,
    Chip3D: ({ children }) => React.createElement('span', null, children),
    Btn3D: ({ as: As = 'button', tone, darkMode, children, ...rest }) =>
      React.createElement(As, As === 'button' ? { type: 'button', ...rest } : rest, children),
    useOnScreen: () => [() => {}, true],
    readStorage: (key) => global.localStorage.getItem(key),
    money: (n) => `EGP ${n}`,
  };
});

const mockSwalFire = jest.fn();
let mockShowTop = false;
jest.mock('../../components/user/ListingKit', () => ({
  __esModule: true,
  safeImageUrl: (v) => (v ? `http://api.test/uploads/${v}` : ''),
  StorefrontIllustration: () => null,
  loadSwal: () => Promise.resolve({ fire: (...a) => mockSwalFire(...a) }),
  clean: (s, n) => String(s ?? '').slice(0, n),
  useBackToTop: () => mockShowTop,
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

const PRODUCTS = [
  { id: 'p1', name: 'Galaxy Phone', description: 'Great camera', price: 1000, discount: 20, stock: 3, condition: 'NEW', categoryName: 'Phones', imageUrl: 'galaxy.png' },
  { id: 'p2', name: 'Gaming Laptop', description: 'Fast', price: 5000, discount: 0, stock: 0, condition: 'USED', categoryName: 'Laptops' },
  { id: 'p3', name: 'Old Tablet', price: 300, condition: 'constructor', categoryName: 'Tablets' },
  { id: 'p4', name: 'Deleted Thing', price: 10, deleted: true },
];

const SHOPS = [
  { id: 's1', name: 'Fix It', description: 'We repair phones', rating: 3.5, verified: false, shopType: 'REPAIRER', shopAddress: { street: 'Street 9', city: 'Cairo' }, phone: '+20 (100) 123-45abc' },
  { id: 's2', name: 'Top Tech', description: 'Best shop', rating: 4.8, verified: true, phone: '' },
  { id: 's3', name: 'Mid Shop', rating: 4.1 },
];

/* `products` / `shops` are the response bodies (so a plain array or a {content:[…]} page can both be tested) */
function mockApi({ products = { content: PRODUCTS }, shops = { content: SHOPS }, productsError, shopsError } = {}) {
  api.get.mockImplementation(async (url) => {
    if (url === '/api/users/shops/all') {
      if (shopsError) throw shopsError;
      return { data: shops };
    }
    if (url === '/api/products') {
      if (productsError) throw productsError;
      return { data: products };
    }
    throw new Error(`unexpected GET ${url}`);
  });
}

function setup(opts = {}) {
  const { token = 'valid-token', ...apiOpts } = opts;
  if (token) localStorage.setItem('authToken', token);
  mockApi(apiOpts);
  mockSwalFire.mockResolvedValue({});
  const user = userEvent.setup();
  const utils = render(<Homepage darkMode={false} />);
  return { user, ...utils };
}

const productCard = (name) => screen.getByRole('article', { name });
const waitForData = () => screen.findByRole('article', { name: 'Galaxy Phone' });
const searchInput = () => screen.getByLabelText('searchAria');

const manyProducts = (n) => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, name: `Item ${i + 1}`, price: 10, stock: 1 }));
const manyShops = (n) => Array.from({ length: n }, (_, i) => ({ id: `ms${i + 1}`, name: `Shop ${i + 1}`, rating: i + 1 }));

beforeEach(() => {
  jest.clearAllMocks();
  (global.__testQueryClients || []).forEach((c) => c.clear());
  localStorage.clear();
  sessionStorage.clear();
  mockLanguage = 'en';
  mockShowTop = false;
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  delete window.matchMedia;
});

/* ───────── tests ───────── */

describe('Page basics', () => {
  it('sets the page title and renders the static sections', async () => {
    setup();
    expect(document.title).toBe('pageTitle');
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(await screen.findByTestId('service')).toBeInTheDocument();
    expect(await screen.findByTestId('offers-slider')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'findDeviceOrShop' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'repairDevice' })).toBeInTheDocument();
  });

  it('links the repair and offers action cards', async () => {
    setup();
    await waitForData();
    expect(screen.getAllByRole('link', { name: 'bookRepair' }).some((a) => a.getAttribute('href') === '/repair')).toBe(true);
    expect(screen.getByRole('link', { name: 'viewOffers' })).toHaveAttribute('href', '/offers');
  });

  it('renders right-to-left with the Cairo font for Arabic', async () => {
    mockLanguage = 'ar';
    const { container } = setup();
    await waitForData();
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
    expect(container.firstChild).toHaveClass('font-cairo');
  });

  it('renders left-to-right with the Poppins font for English and French', async () => {
    mockLanguage = 'fr';
    const { container } = setup();
    await waitForData();
    expect(container.firstChild).toHaveAttribute('dir', 'ltr');
    expect(container.firstChild).toHaveClass('font-poppins');
  });
});

describe('Loading the data', () => {
  it('requests shops and products with the bearer token and an abort signal', async () => {
    setup();
    await waitForData();
    const opts = expect.objectContaining({ headers: { Authorization: 'Bearer valid-token' }, signal: expect.anything() });
    expect(api.get).toHaveBeenCalledWith('/api/users/shops/all', opts);
    expect(api.get).toHaveBeenCalledWith('/api/products', opts);
  });

  it('shows no cards and no empty message while loading', () => {
    localStorage.setItem('authToken', 'valid-token');
    api.get.mockImplementation(() => new Promise(() => {}));
    render(<Homepage darkMode={false} />);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('noProducts')).not.toBeInTheDocument();
    expect(screen.queryByText('noShops')).not.toBeInTheDocument();
  });

  it('accepts a plain array as the products response', async () => {
    setup({ products: PRODUCTS });
    expect(await screen.findByRole('article', { name: 'Galaxy Phone' })).toBeInTheDocument();
  });

  it('shows the empty messages when there are no products or shops', async () => {
    setup({ products: { content: [] }, shops: { content: [] } });
    expect(await screen.findByText('noProducts')).toBeInTheDocument();
    expect(screen.getByText('noShops')).toBeInTheDocument();
  });

  it('still shows the shops when only the products request fails', async () => {
    setup({ productsError: httpError(500, {}) });
    expect(await screen.findByRole('article', { name: 'Top Tech' })).toBeInTheDocument();
    expect(screen.getByText('noProducts')).toBeInTheDocument();
  });

  it('shows empty rails and stays on the page on a non-auth server error', async () => {
    setup({ shopsError: httpError(500, {}) });
    expect(await screen.findByText('noShops')).toBeInTheDocument();
    expect(screen.getByText('noProducts')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockSwalFire).not.toHaveBeenCalled();
  });
});

describe('Session handling', () => {
  const expectLoginRedirect = async () => {
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'warning', title: 'sessionExpired', text: 'loginAgain', toast: true }));
  };

  it('redirects to login without calling the API when there is no token', async () => {
    setup({ token: null });
    await expectLoginRedirect();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('redirects to login and removes an expired token', async () => {
    setup({ token: 'expired-token' });
    await expectLoginRedirect();
    expect(api.get).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('treats a token that cannot be decoded as no token', async () => {
    setup({ token: 'bad-token' });
    await expectLoginRedirect();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('treats a blank token as no token', async () => {
    setup({ token: '   ' });
    await expectLoginRedirect();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('redirects to login and removes the token when the server answers 401', async () => {
    setup({ shopsError: httpError(401, {}) });
    await expectLoginRedirect();
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});

describe('Featured products', () => {
  it('shows name, category, price, discount and the original price', async () => {
    setup();
    const card = within(await waitForData());
    expect(card.getByText('Phones')).toBeInTheDocument();
    expect(card.getByText('EGP 800')).toBeInTheDocument(); /* 1000 - 20% */
    expect(card.getByText('EGP 1000')).toBeInTheDocument(); /* struck-through original */
    expect(card.getByText('-20%')).toBeInTheDocument();
    expect(card.getByText('conditionNew')).toBeInTheDocument();
  });

  it('hides soft-deleted products', async () => {
    setup();
    await waitForData();
    expect(screen.queryByRole('article', { name: 'Deleted Thing' })).not.toBeInTheDocument();
  });

  it('clamps the discount to 0-100 %', async () => {
    setup({ products: { content: [{ id: 'c1', name: 'Clamp', price: 100, discount: 150, stock: 1 }, { id: 'c2', name: 'NegDisc', price: 100, discount: -5, stock: 1 }] } });
    const clamp = within(await screen.findByRole('article', { name: 'Clamp' }));
    expect(clamp.getByText('-100%')).toBeInTheDocument();
    expect(clamp.getByText('EGP 0')).toBeInTheDocument();
    const neg = within(productCard('NegDisc'));
    expect(neg.queryByText(/^-\d+%$/)).not.toBeInTheDocument();
    expect(neg.getByText('EGP 100')).toBeInTheDocument();
  });

  it('shows the used badge and an out-of-stock label with a disabled cart button', async () => {
    setup();
    await waitForData();
    const card = within(productCard('Gaming Laptop'));
    expect(card.getByText('conditionUsed')).toBeInTheDocument();
    expect(card.getByText('outOfStock')).toBeInTheDocument();
    expect(card.getByRole('button', { name: 'addToCart' })).toBeDisabled();
  });

  it('ignores an unknown condition such as "constructor"', async () => {
    setup();
    await waitForData();
    expect(within(productCard('Old Tablet')).queryByText(/^condition/)).not.toBeInTheDocument();
  });

  it('uses the uploaded image and falls back to the illustration when it fails to load', async () => {
    setup();
    const card = await waitForData();
    const img = card.querySelector('img');
    expect(img).toHaveAttribute('src', 'http://api.test/uploads/galaxy.png');
    expect(img).toHaveAttribute('alt', 'Galaxy Phone');
    fireEvent.error(img);
    expect(card.querySelector('img')).toBeNull();
    expect(within(card).getByRole('img', { name: 'Galaxy Phone' })).toBeInTheDocument(); /* svg fallback */
  });

  it('shows the illustration when the product has no image', async () => {
    setup();
    await waitForData();
    const card = productCard('Gaming Laptop');
    expect(card.querySelector('img')).toBeNull();
    expect(within(card).getByRole('img', { name: 'Gaming Laptop' })).toBeInTheDocument();
  });

  it('features only the first 12 products', async () => {
    setup({ products: { content: manyProducts(15) } });
    expect(await screen.findByRole('article', { name: 'Item 12' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Item 13' })).not.toBeInTheDocument();
  });
});

describe('Top shops', () => {
  it('sorts shops by rating, highest first', async () => {
    setup();
    await waitForData();
    const labels = screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(labels.filter((n) => ['Fix It', 'Top Tech', 'Mid Shop'].includes(n))).toEqual(['Top Tech', 'Mid Shop', 'Fix It']);
  });

  it('shows only the 12 best-rated shops', async () => {
    setup({ shops: { content: manyShops(14) } });
    expect(await screen.findByRole('article', { name: 'Shop 14' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Shop 3' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Shop 2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Shop 1' })).not.toBeInTheDocument();
  });

  it('shows rating, verified badge, type, address and description', async () => {
    setup();
    await waitForData();
    const top = within(productCard('Top Tech'));
    expect(top.getByText('4.8')).toBeInTheDocument();
    expect(top.getByText('verified')).toBeInTheDocument();
    expect(top.getByText('Best shop')).toBeInTheDocument();

    const fix = within(productCard('Fix It'));
    expect(fix.queryByText('verified')).not.toBeInTheDocument();
    expect(fix.getByText('REPAIRER')).toBeInTheDocument();
    expect(fix.getByText('Street 9, Cairo')).toBeInTheDocument();
    expect(fix.getByText('We repair phones')).toBeInTheDocument();
  });

  it('falls back to default texts for a shop without name, description or rating', async () => {
    setup({ shops: { content: [{ id: 's9' }] } });
    expect(await screen.findByText('unnamedShop')).toBeInTheDocument();
    expect(screen.getByText('shopDescription')).toBeInTheDocument();
    expect(screen.queryByText(/^\d\.\d$/)).not.toBeInTheDocument();
  });

  it('builds the tel: link from digits and a leading + only', async () => {
    setup();
    await waitForData();
    const link = within(productCard('Fix It')).getByRole('link', { name: '+20 (100) 123-45abc' });
    expect(link).toHaveAttribute('href', 'tel:+2010012345');
    expect(within(productCard('Top Tech')).queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('Navigation', () => {
  it('opens the product page when a product card is clicked', async () => {
    const { user } = setup();
    await user.click(await waitForData());
    expect(mockNavigate).toHaveBeenCalledWith('/device/p1');
  });

  it('URL-encodes the product id', async () => {
    const { user } = setup({ products: { content: [{ id: 'x/y z', name: 'Odd Id', price: 1, stock: 1 }] } });
    await user.click(await screen.findByRole('article', { name: 'Odd Id' }));
    expect(mockNavigate).toHaveBeenCalledWith('/device/x%2Fy%20z');
  });

  it('opens a card with the Enter key', async () => {
    const { user } = setup();
    (await waitForData()).focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/device/p1');
  });

  it('opens the shop page from the card and from the visit button (once)', async () => {
    const { user } = setup();
    await waitForData();
    await user.click(productCard('Fix It'));
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');

    mockNavigate.mockClear();
    await user.click(within(productCard('Top Tech')).getByRole('button', { name: /visitShop/ }));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s2');
  });

  it('does not open the shop when the phone link is clicked', async () => {
    const { user } = setup();
    await waitForData();
    const stop = (e) => e.preventDefault(); /* jsdom cannot follow tel: links */
    document.addEventListener('click', stop);
    await user.click(within(productCard('Fix It')).getByRole('link', { name: /123/ }));
    document.removeEventListener('click', stop);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Add to cart', () => {
  const cartBtn = (name = 'Galaxy Phone') => within(productCard(name)).getByRole('button', { name: 'addToCart' });

  it('posts only the product id and quantity, refreshes the cart and shows a success toast', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockResolvedValue({ status: 201 });
    const onCart = jest.fn();
    window.addEventListener('cart:updated', onCart);

    await user.click(cartBtn());

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    window.removeEventListener('cart:updated', onCart);
    expect(api.post).toHaveBeenCalledWith('/api/cart/items', { productId: 'p1', quantity: 1 }, { headers: { Authorization: 'Bearer valid-token' } });
    expect(onCart).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', title: 'addedTitle', text: 'Added Galaxy Phone to your cart' }));
  });

  it('does not open the product page when the cart button is clicked', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockResolvedValue({ status: 201 });
    await user.click(cartBtn());
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('pressing Enter on the cart button adds to cart instead of opening the product', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockResolvedValue({ status: 201 });
    cartBtn().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the server message when adding fails', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockRejectedValue(httpError(400, { message: 'Only 1 left' }));
    await user.click(cartBtn());
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', title: 'errorTitle', text: 'Only 1 left' })));
  });

  it('falls back to a generic message when the server sends none', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockRejectedValue(new Error('Network Error'));
    await user.click(cartBtn());
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'addToCartFailed' })));
  });

  it('treats a non-2xx response as a failure', async () => {
    const { user } = setup();
    await waitForData();
    api.post.mockResolvedValue({ status: 500 });
    await user.click(cartBtn());
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'addToCartFailed' })));
  });

  it('disables the button while the request is pending (no double add)', async () => {
    const { user } = setup();
    await waitForData();
    let resolve;
    api.post.mockImplementation(() => new Promise((r) => { resolve = r; }));
    await user.click(cartBtn());
    await waitFor(() => expect(cartBtn()).toBeDisabled());
    await user.click(cartBtn());
    expect(api.post).toHaveBeenCalledTimes(1);
    resolve({ status: 201 });
    await waitFor(() => expect(mockToast).toHaveBeenCalled());
  });

  it('asks the user to log in when the session ended, and goes to login if confirmed', async () => {
    const { user } = setup();
    await waitForData();
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: true });
    await user.click(cartBtn());

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'info', title: 'loginRequiredTitle', showCancelButton: true }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('stays on the page when the login prompt is dismissed', async () => {
    const { user } = setup();
    await waitForData();
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: false });
    await user.click(cartBtn());
    await waitFor(() => expect(mockSwalFire).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('Search', () => {
  it('shows quick-access links when the field is focused and empty', async () => {
    const { user } = setup();
    await waitForData();
    await user.click(searchInput());
    expect(screen.getByRole('link', { name: 'browseProducts' })).toHaveAttribute('href', '/devices');
    expect(screen.getByRole('link', { name: 'findShops' })).toHaveAttribute('href', '/shops');
    expect(screen.getAllByRole('link', { name: 'latestOffers' }).some((a) => a.getAttribute('href') === '/offers')).toBe(true);
  });

  it('limits the input length to 80 characters', () => {
    setup();
    expect(searchInput()).toHaveAttribute('maxlength', '80');
  });

  it('finds products and shops by name or description, ignoring case', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'PHONE');
    expect(await screen.findByRole('link', { name: /Galaxy Phone/ })).toHaveAttribute('href', '/device/p1');
    expect(screen.getByRole('link', { name: /Fix It/ })).toHaveAttribute('href', '/shops/s1'); /* matched in the description */
  });

  it('finds a product through its description', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'camera');
    expect(await screen.findByRole('link', { name: /Galaxy Phone/ })).toBeInTheDocument();
  });

  it('finds offer suggestions', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'screen');
    expect(await screen.findByRole('link', { name: 'offerScreenRepair' })).toHaveAttribute('href', '/offers');
  });

  it('searches the whole catalog, not just the 12 featured products', async () => {
    const { user } = setup({ products: { content: manyProducts(15) } });
    await screen.findByRole('article', { name: 'Item 1' });
    expect(screen.queryByRole('article', { name: 'Item 14' })).not.toBeInTheDocument();
    await user.type(searchInput(), 'Item 14');
    expect(await screen.findByRole('link', { name: /Item 14/ })).toHaveAttribute('href', '/device/m14');
  });

  it('shows at most 4 product suggestions', async () => {
    const { user } = setup({ products: { content: manyProducts(8) } });
    await screen.findByRole('article', { name: 'Item 1' });
    await user.type(searchInput(), 'item');
    await screen.findAllByRole('link', { name: /Item/ });
    expect(screen.getAllByRole('link', { name: /Item/ })).toHaveLength(4);
  });

  it('never suggests deleted products', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'deleted');
    expect(await screen.findByText('No results for deleted')).toBeInTheDocument();
  });

  it('shows a no-results message with the query cut to 30 characters', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'x'.repeat(40));
    expect(await screen.findByText(`No results for ${'x'.repeat(30)}`)).toBeInTheDocument();
    expect(screen.getByText('tryDifferent')).toBeInTheDocument();
  });

  it('clears the query with the clear button', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'phone');
    await user.click(screen.getByRole('button', { name: 'clearSearch' }));
    expect(searchInput()).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'clearSearch' })).not.toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const { user } = setup();
    await waitForData();
    await user.click(searchInput());
    expect(screen.getByRole('link', { name: 'browseProducts' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: 'browseProducts' })).not.toBeInTheDocument();
  });

  it('closes when the user clicks outside', async () => {
    const { user } = setup();
    await waitForData();
    await user.click(searchInput());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('link', { name: 'browseProducts' })).not.toBeInTheDocument();
  });

  it('closes after a result is chosen', async () => {
    const { user } = setup();
    await waitForData();
    await user.type(searchInput(), 'galaxy');
    await user.click(await screen.findByRole('link', { name: /Galaxy Phone/ }));
    expect(screen.queryByRole('link', { name: /Galaxy Phone/ })).not.toBeInTheDocument();
  });
});

describe('Back to top', () => {
  it('is hidden until the page is scrolled', async () => {
    setup();
    await waitForData();
    expect(screen.queryByRole('button', { name: 'backToTop' })).not.toBeInTheDocument();
  });

  it('scrolls smoothly to the top', async () => {
    mockShowTop = true;
    const { user } = setup();
    await waitForData();
    await user.click(screen.getByRole('button', { name: 'backToTop' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('jumps instantly when the user prefers reduced motion', async () => {
    mockShowTop = true;
    window.matchMedia = jest.fn(() => ({ matches: true }));
    const { user } = setup();
    await waitForData();
    await user.click(screen.getByRole('button', { name: 'backToTop' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});

describe('Scroll rails', () => {
  const restore = [];
  const stubSize = (prop, value) => {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, prop);
    Object.defineProperty(Element.prototype, prop, { configurable: true, get: () => value });
    restore.push(() => Object.defineProperty(Element.prototype, prop, d));
  };
  afterEach(() => { while (restore.length) restore.pop()(); });

  it('shows no arrows when everything fits', async () => {
    setup();
    await waitForData();
    expect(screen.queryByRole('button', { name: 'scrollRight' })).not.toBeInTheDocument();
  });

  it('shows arrows for overflowing rails and scrolls by 75 % of the width', async () => {
    stubSize('clientWidth', 100);
    stubSize('scrollWidth', 1000);
    const original = Element.prototype.scrollBy;
    Element.prototype.scrollBy = jest.fn();
    restore.push(() => { Element.prototype.scrollBy = original; });

    const { user } = setup();
    await waitForData();
    const rights = await screen.findAllByRole('button', { name: 'scrollRight' });
    expect(rights).toHaveLength(2); /* products rail + shops rail */
    expect(screen.getAllByRole('button', { name: 'scrollLeft' })[0]).toBeDisabled();
    expect(rights[0]).toBeEnabled();

    await user.click(rights[0]);
    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: 75, behavior: 'smooth' });
  });
});