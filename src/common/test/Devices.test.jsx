/**
 * Jest + React Testing Library tests for Devices.jsx (Create React App).
 * Location: src/common/test/Devices.test.jsx   (Devices.jsx is in src/User/)
 *
 * Requirements:
 *   - Devices.jsx has this line above its default export:  export { queryClient };
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/Devices.test.jsx
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/api';
import { toast } from '../../components/user/UiExtras';
import Devices, { queryClient } from '../../User/Devices';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */
/* (factories use React.createElement so they never reference out-of-scope JSX helpers) */

const mockNavigate = jest.fn();
const mockSwalFire = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('../utils/useAppLanguage', () => ({ useAppLanguage: () => 'en', languageDirection: () => 'ltr' }));

/* only the strings the tests rely on; any other key simply renders as the key itself */
jest.mock('../../locales/en/translation.json', () => ({
  devices: {
    currency: 'EGP', pageTitle: 'Devices',
    conditionNew: 'New', conditionUsed: 'Used', conditionRefurbished: 'Refurbished', conditionUnknown: 'Unknown',
    addToCart: 'Add to cart', outOfStock: 'Out of stock', uncategorized: 'Uncategorized', noDescription: 'No description',
    imageUnavailable: 'Image unavailable', browseCategories: 'Browse categories', itemsCount: '{{count}} items',
    filters: 'Filters', resetAll: 'Reset all', clearAll: 'Clear all', clearFilters: 'Clear filters',
    priceRange: 'Price range', condition: 'Condition', category: 'Category', all: 'All',
    inStockOnly: 'In stock only', inStock: 'In stock',
    priceMin: 'From', priceMax: 'To', minPriceAria: 'Minimum price slider', maxPriceAria: 'Maximum price slider',
    errorInvalidNumber: 'Enter a valid number', errorNegative: 'Price cannot be negative',
    errorMinGreater: 'Min cannot exceed max', errorMaxLess: 'Max cannot be below min', errorMaxPrice: 'Max price is {{max}}',
    allProducts: 'All products', showing: 'Showing {{range}} of {{total}}',
    rowsPerPage: 'Rows per page', perPage: '{{count}} per page', gridView: 'Grid view', listView: 'List view',
    search: 'Search devices', searchAria: 'Search devices', clearSearch: 'Clear search', sortProducts: 'Sort products',
    sortRelevance: 'Relevance', sortPriceLow: 'Price: low to high', sortPriceHigh: 'Price: high to low', sortNewest: 'Newest',
    loadErrorTitle: 'Could not load devices', tryAgain: 'Try again', noProducts: 'No products found',
    loginRequiredTitle: 'Login required', goToLogin: 'Go to login', cancel: 'Cancel',
    addedToCartTitle: 'Added to cart', addedToCartText: '{{name}} was added', addToCartFailedTitle: 'Could not add to cart',
    justIn: 'Just in', latestArrivals: 'Latest arrivals', closeFilters: 'Close filters', showItems: 'Show {{count}} items',
    backToTop: 'Back to top',
  },
}));
jest.mock('../../locales/ar/translation.json', () => ({ devices: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ devices: {} }));

jest.mock('../../components/user/Hero', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null, isoCatKey: () => 'box' }));

jest.mock('../../components/user/Ui3D', () => {
  const h = require('react').createElement;
  return {
    UI3D_CSS: '',
    Defs3D: () => null,
    Glyph3D: () => null,
    Chip3D: ({ children }) => h('span', null, children),
    Btn3D: ({ children, tone, darkMode, ...rest }) => h('button', { type: 'button', ...rest }, children),
    FilterSection: ({ title, children }) => h('section', null, h('h4', null, title), children),
    OptionRow: ({ type, label, selected, onClick }) =>
      h('button', { type: 'button', role: type === 'radio' ? 'radio' : 'checkbox', 'aria-checked': !!selected, onClick }, label),
  };
});

jest.mock('../../components/user/UiExtras', () => ({ EXTRAS_CSS: '', Toaster: () => null, toast: jest.fn() }));

jest.mock('../../components/user/ListingKit', () => {
  const h = require('react').createElement;
  return {
    LISTING_CSS: '',
    PAGE_SIZES: [5, 10],
    readStorage: (k) => global.localStorage.getItem(k), /* `global.` is allowed inside a mock factory, bare `localStorage` is not */
    safeImageUrl: (u) => (typeof u === 'string' ? u : ''),
    clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
    clean: (s, max) => String(s ?? '').slice(0, max),
    loadSwal: async () => ({ fire: (...a) => mockSwalFire(...a) }),
    useLangFont: () => ({ style: {}, className: '' }),
    useBackToTop: () => false,
    useModalLock: () => {},
    Dropdown: ({ ariaLabel, value, onChange, options }) =>
      h('select', {
        'aria-label': ariaLabel,
        value: String(value),
        onChange: (e) => onChange(options.find((o) => String(o.value) === e.target.value).value),
      }, options.map((o) => h('option', { key: String(o.value), value: String(o.value) }, o.label))),
    FilterChip: ({ label, onRemove }) => h('button', { type: 'button', 'aria-label': `Remove ${label}`, onClick: onRemove }, label),
  };
});

jest.mock('../../components/user/ListingExtras', () => {
  const h = require('react').createElement;
  return {
    FeaturedBanner: ({ title, children }) => h('section', { 'data-testid': 'featured' }, h('h2', null, title), children),
    SectionToolbar: ({ title, children }) => h('div', null, h('h2', null, title), children),
    ResultsFooter: () => null,
  };
});

jest.mock('../../components/user/SearchBar', () => {
  const h = require('react').createElement;
  return {
    SearchBar: ({ value, onChange, placeholder, ariaLabel }) =>
      h('input', { type: 'text', value, placeholder, 'aria-label': ariaLabel, onChange: (e) => onChange(e.target.value) }),
  };
});

jest.mock('framer-motion', () => {
  const R = require('react');
  return {
    LazyMotion: ({ children }) => R.createElement(R.Fragment, null, children),
    AnimatePresence: ({ children }) => R.createElement(R.Fragment, null, children),
    domAnimation: {},
    m: { div: ({ children, initial, animate, exit, transition, ...rest }) => R.createElement('div', rest, children) },
  };
});

/* ───────── fake data ───────── */

const CATEGORIES = [
  { id: 'c1', name: 'Laptops' },
  { id: 'c2', name: 'Phones' },
  { id: 'c3', name: 'Audio' },
];

const mk = (o) => ({
  id: 'p', name: 'Device', description: '', price: 1000, discount: 0, stock: 5, condition: 'NEW',
  categoryId: 'c1', categoryName: 'Laptops', createdAt: '2024-01-01', imageUrl: '', ...o,
});

/* final prices: Dell 800 (20% off), iPhone 5000, Samsung 3000, HP 1500, Sony 500 */
const PRODUCTS = [
  mk({ id: 'p1', name: 'Dell Laptop', description: 'Fast machine', price: 1000, discount: 20, condition: 'NEW', createdAt: '2024-02-01' }),
  mk({ id: 'p2', name: 'iPhone 15', price: 5000, condition: 'USED', categoryId: 'c2', categoryName: 'Phones', createdAt: '2024-05-01' }),
  mk({ id: 'p3', name: 'Samsung Galaxy', price: 3000, stock: 0, condition: 'REFURBISHED', categoryId: 'c2', categoryName: 'Phones', createdAt: '2024-01-01' }),
  mk({ id: 'p4', name: 'HP Laptop', price: 1500, condition: 'USED', createdAt: '2024-04-01' }),
  mk({ id: 'p5', name: 'Sony Headphones', price: 500, condition: 'NEW', categoryId: 'c3', categoryName: 'Audio', createdAt: '2024-03-01' }),
];
const API_ORDER = ['Dell Laptop', 'iPhone 15', 'Samsung Galaxy', 'HP Laptop', 'Sony Headphones'];

/* ───────── helpers ───────── */

/* Fakes the backend: categories + products come from the data we pass in, then renders the page. */
function setup({ products = PRODUCTS, categories = CATEGORIES, impl } = {}) {
  api.get.mockImplementation(
    impl ||
      (async (path) => {
        if (path === '/api/categories') return { data: categories };
        if (path === '/api/products') return { data: products };
        return { data: [] };
      }),
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Devices darkMode={false} />
    </MemoryRouter>,
  );
  return { user };
}

/* the "All products" section; the "Latest arrivals" banner and category cards live outside it */
const gridEl = () => document.getElementById('products-grid');
const names = () => within(gridEl()).queryAllByRole('article').map((a) => a.getAttribute('aria-label'));
const waitForNames = (expected) => waitFor(() => expect(names()).toEqual(expected));
const getCard = (name) => within(gridEl()).findByRole('article', { name });

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn(); /* jsdom does not implement it */
});

beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockReset();
  api.post.mockResolvedValue({ status: 200 });
  mockSwalFire.mockReset();
  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  queryClient.setDefaultOptions({ queries: { retry: false } }); /* a failing request must show the error state right away */
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
});

/* ───────── tests ───────── */

describe('Loading and listing', () => {
  it('lists the products returned by the API', async () => {
    setup();
    await waitForNames(API_ORDER);
  });

  it('sends the auth token for categories but not for products', async () => {
    setup();
    await waitForNames(API_ORDER);
    expect(api.get).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }));
    const productsCall = api.get.mock.calls.find(([p]) => p === '/api/products');
    expect(productsCall[1]).not.toHaveProperty('headers');
  });

  it('hides deleted products', async () => {
    setup({ products: [...PRODUCTS, mk({ id: 'p9', name: 'Ghost Device', deleted: true })] });
    await waitForNames(API_ORDER);
    expect(screen.queryByText('Ghost Device')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no products', async () => {
    setup({ products: [] });
    expect(await screen.findByText('No products found')).toBeInTheDocument();
    expect(screen.queryByTestId('featured')).not.toBeInTheDocument();
  });

  it('shows an error and recovers with "Try again"', async () => {
    let fail = true;
    const { user } = setup({
      impl: async (path) => {
        if (path === '/api/categories') return { data: CATEGORIES };
        if (fail) throw new Error('server down');
        return { data: PRODUCTS };
      },
    });
    expect(await screen.findByText('Could not load devices')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitForNames(API_ORDER);
  });

  it('does not crash on an unknown condition value', async () => {
    setup({ products: [mk({ id: 'p1', name: 'Odd Device', condition: 'constructor' })] });
    const card = await getCard('Odd Device');
    expect(within(card).getByText('constructor')).toBeInTheDocument();
  });

  it('shows the 4 newest products in the "Latest arrivals" banner', async () => {
    setup();
    const banner = await screen.findByTestId('featured');
    const labels = within(banner).getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(labels).toEqual(['iPhone 15', 'HP Laptop', 'Sony Headphones', 'Dell Laptop']);
  });
});

describe('Product card', () => {
  it('shows the discounted price, the old price and the discount badge', async () => {
    setup();
    const card = await getCard('Dell Laptop');
    expect(within(card).getByText('EGP 800')).toBeInTheDocument();
    expect(within(card).getByText(/^EGP 1,?000$/)).toBeInTheDocument();
    expect(within(card).getByText('-20%')).toBeInTheDocument();
  });

  it('disables the cart button for an out-of-stock product', async () => {
    setup();
    const card = await getCard('Samsung Galaxy');
    expect(within(card).getByText('Out of stock')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });

  it('opens the product page on click and on Enter', async () => {
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/device/p1');
    mockNavigate.mockClear();
    card.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/device/p1');
  });

  it('switches to the list layout (which also shows the description)', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    expect(screen.queryByText('Fast machine')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Fast machine')).toBeInTheDocument();
  });
});

describe('Add to cart', () => {
  it('posts only the product id + quantity and reports success', async () => {
    const onCartUpdated = jest.fn();
    window.addEventListener('cart:updated', onCartUpdated);
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' })));
    expect(api.post).toHaveBeenCalledWith('/api/cart/items', { productId: 'p1', quantity: 1 }, { headers: { Authorization: 'Bearer test-token' } });
    expect(onCartUpdated).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled(); /* the click on the button must not open the product */
    window.removeEventListener('cart:updated', onCartUpdated);
  });

  it('asks a guest to log in and goes to /login when confirmed', async () => {
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: true });
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('stays on the page when the guest cancels the login prompt', async () => {
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: false });
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockSwalFire).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows the server message when adding fails', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Stock changed' } } });
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Stock changed' })));
  });

  it('treats a non-2xx response as a failure', async () => {
    api.post.mockResolvedValue({ status: 500 });
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' })));
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }));
  });
});

describe('Search', () => {
  it('filters by name, case-insensitively', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.type(screen.getByRole('textbox', { name: 'Search devices' }), 'DELL');
    await waitForNames(['Dell Laptop']);
  });

  it('shows the empty state and "Clear filters" restores the list', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.type(screen.getByRole('textbox', { name: 'Search devices' }), 'zzzz');
    expect(await screen.findByText('No products found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitForNames(API_ORDER);
    expect(screen.getByRole('textbox', { name: 'Search devices' })).toHaveValue('');
  });
});

describe('Filters', () => {
  it('filters by category from the filter panel and removes it with the chip', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('radio', { name: 'Phones' }));
    await waitForNames(['iPhone 15', 'Samsung Galaxy']);
    await user.click(screen.getByRole('button', { name: 'Remove Phones' }));
    await waitForNames(API_ORDER);
  });

  it('filters by category from the category cards', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const cardBtn = screen.getByRole('button', { name: /^Laptops/ });
    expect(cardBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(cardBtn);
    expect(cardBtn).toHaveAttribute('aria-pressed', 'true');
    await waitForNames(['Dell Laptop', 'HP Laptop']);
  });

  it('filters by condition', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'Used' }));
    await waitForNames(['iPhone 15', 'HP Laptop']);
    await user.click(screen.getByRole('checkbox', { name: 'Refurbished' }));
    await waitForNames(['iPhone 15', 'Samsung Galaxy', 'HP Laptop']);
  });

  it('hides out-of-stock products with "In stock only"', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'In stock only' }));
    await waitForNames(['Dell Laptop', 'iPhone 15', 'HP Laptop', 'Sony Headphones']);
  });

  it('opens and closes the mobile filter sheet', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(dialog).getByRole('button', { name: 'Show 5 items' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    await user.click(screen.getByRole('button', { name: 'Close filters' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Price range filter', () => {
  it('filters by the max price field', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const to = screen.getByLabelText(/^To/);
    await user.clear(to);
    await user.type(to, '1000');
    await user.tab(); /* blur commits the value */
    await waitForNames(['Dell Laptop', 'Sony Headphones']);
  });

  it('rejects a min price above the max', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const from = screen.getByLabelText(/^From/);
    await user.clear(from);
    await user.type(from, '6000');
    await user.tab();
    expect(await screen.findByRole('alert')).toHaveTextContent('Min cannot exceed max');
    expect(from).toHaveValue(0); /* the rejected value is rolled back */
    expect(names()).toEqual(API_ORDER);
  });

  it('rejects a max price above the highest product price', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const to = screen.getByLabelText(/^To/);
    await user.clear(to);
    await user.type(to, '9999');
    await user.tab();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Max price is 5,?000/);
    expect(names()).toEqual(API_ORDER);
  });

  it('rejects an empty value', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.clear(screen.getByLabelText(/^To/));
    await user.tab();
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid number');
  });
});

describe('Sorting and paging', () => {
  it.each([
    ['priceLowToHigh', ['Sony Headphones', 'Dell Laptop', 'HP Laptop', 'Samsung Galaxy', 'iPhone 15']],
    ['priceHighToLow', ['iPhone 15', 'Samsung Galaxy', 'HP Laptop', 'Dell Laptop', 'Sony Headphones']],
    ['newest', ['iPhone 15', 'HP Laptop', 'Sony Headphones', 'Dell Laptop', 'Samsung Galaxy']],
  ])('sorts by %s', async (value, expected) => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort products' }), value);
    await waitForNames(expected);
  });

  it('shows one page of results and grows with "Rows per page"', async () => {
    const many = Array.from({ length: 7 }, (_, i) => mk({ id: `x${i}`, name: `Device ${i}`, createdAt: `2024-01-0${i + 1}` }));
    const { user } = setup({ products: many });
    await waitFor(() => expect(names()).toHaveLength(5)); /* page size 5 */
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Showing 1–5 of 7')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10');
    await waitFor(() => expect(names()).toHaveLength(7));
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Showing 1–7 of 7')).toBeInTheDocument();
  });
});