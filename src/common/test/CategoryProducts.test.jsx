/**
 * Jest + React Testing Library tests for CategoryProducts.jsx (Create React App).
 * Location: src/common/test/CategoryProducts.test.jsx   (CategoryProducts.jsx is in src/User/)
 *
 * Requirements:
 *   - CategoryProducts.jsx has this line above its default export:  export { queryClient };
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/CategoryProducts.test.jsx
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import api from '../api/api';
import CategoryProducts, { queryClient } from '../../User/CategoryProducts';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */
/* (factories use React.createElement and `global.` so they never reference out-of-scope variables) */

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
  devices: {},
  categoryProducts: {
    currency: 'EGP', titleSuffix: 'TechShop', categoryTitle: 'Category', backToAll: 'Back to all devices',
    productFromSellers: 'product from sellers', productsFromSellers: 'products from sellers',
    trustVerified: 'Verified sellers', trustQuality: 'Quality checked',
    shopByCondition: 'Shop by condition', allProducts: 'All products', itemSingular: 'item', itemPlural: 'items',
    conditionNew: 'New', conditionRefurbished: 'Refurbished', conditionUsed: 'Used',
    dealsBadge: 'Deals', biggestDiscounts: 'Biggest discounts', bestSavings: 'Best savings on {{name}}',
    filters: 'Filters', resetAll: 'Reset all', condition: 'Condition', priceRange: 'Price range',
    offersFilter: 'Offers', onSaleOnly: 'On sale only', onSale: 'On sale', closeFilters: 'Close filters', showItems: 'Show {{count}} items',
    productsLabel: 'products', search: 'Search products', searchAria: 'Search products', clearSearch: 'Clear search', clearAll: 'Clear all',
    sortBy: 'Sort by', sortRelevance: 'Relevance', sortPriceLow: 'Price: low to high', sortPriceHigh: 'Price: high to low', sortNewest: 'Newest',
    gridView: 'Grid view', listView: 'List view', addToCart: 'Add to cart', noDescription: 'No description',
    loadErrorTitle: 'Could not load products', tryAgain: 'Try again',
    noProducts: 'No products match', nothingHere: 'Nothing here yet', clearFilters: 'Clear filters',
    paginationLabel: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page', backToTop: 'Back to top',
    loginRequiredTitle: 'Login required', goToLogin: 'Go to login', cancel: 'Cancel',
    addedToCartTitle: 'Added to cart', addToCartFailedTitle: 'Could not add to cart', errorTitle: 'Error',
  },
}));
jest.mock('../../locales/ar/translation.json', () => ({ devices: {}, categoryProducts: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ devices: {}, categoryProducts: {} }));

jest.mock('../../components/user/Footer', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/user/Navbar', () => {
  const h = require('react').createElement;
  return { __esModule: true, default: ({ onCartClick }) => h('button', { type: 'button', onClick: onCartClick }, 'Cart') };
});
jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null, isoCatKey: () => 'box', isoCondKey: () => 'box' }));

jest.mock('../../components/user/Ui3D', () => {
  const h = require('react').createElement;
  return {
    UI3D_CSS: '',
    Defs3D: () => null,
    Chip3D: ({ children }) => h('span', null, children),
    Btn3D: ({ children, tone, darkMode, ...rest }) => h('button', { type: 'button', ...rest }, children),
    TrustStrip: ({ items }) => h('ul', null, items.map((i) => h('li', { key: i.title }, i.title))),
    FilterSection: ({ title, children }) => h('section', null, h('h4', null, title), children),
    OptionRow: ({ type, label, selected, onClick }) =>
      h('button', { type: 'button', role: type === 'radio' ? 'radio' : 'checkbox', 'aria-checked': !!selected, onClick }, label),
    PageBtn: ({ children, onClick, disabled, active, darkMode, ...rest }) =>
      h('button', { type: 'button', onClick, disabled, 'aria-current': active ? 'page' : undefined, ...rest }, children),
    getPaginationRange: (page, total) => Array.from({ length: total }, (_, i) => i + 1),
  };
});

jest.mock('../../components/user/ListingKit', () => {
  const h = require('react').createElement;
  const R = require('react');
  return {
    LISTING_CSS: '',
    PAGE_SIZES: [5, 10],
    CONDITIONS: ['New', 'Refurbished', 'Used'],
    readStorage: (k) => global.localStorage.getItem(k),
    safeImageUrl: (u) => (typeof u === 'string' ? u : ''),
    kindOfCategory: () => 'laptop',
    priceStep: () => 10,
    finalPrice: (p) => (p.discount ? Math.round(p.price * (1 - p.discount / 100) * 100) / 100 : p.price),
    clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
    loadSwal: async () => ({ fire: (...a) => mockSwalFire(...a) }),
    useLangFont: () => ({ style: {}, className: '' }),
    useBackToTop: () => false,
    useModalLock: () => {},
    useHScroll: () => ({ ref: R.createRef(), edge: { l: false, r: true }, scroll: () => {} }),
    HeroWave: () => null,
    PriceRangeSlider: ({ onChange }) => h('button', { type: 'button', onClick: () => onChange([0, 1000]) }, 'Cap price at 1000'),
    PaginationFilter: () => null,
    Dropdown: ({ label, ariaLabel, value, onChange, options }) =>
      h('select', {
        'aria-label': ariaLabel || label,
        value: String(value),
        onChange: (e) => onChange(options.find((o) => String(o.value) === e.target.value).value),
      }, options.map((o) => h('option', { key: String(o.value), value: String(o.value) }, o.label))),
    FilterChip: ({ label, onRemove }) => h('button', { type: 'button', 'aria-label': `Remove ${label}`, onClick: onRemove }, label),
  };
});

jest.mock('framer-motion', () => {
  const R = require('react');
  const pass = ({ children }) => R.createElement(R.Fragment, null, children);
  return {
    LazyMotion: pass,
    MotionConfig: pass,
    AnimatePresence: pass,
    domAnimation: {},
    m: { div: ({ children, initial, animate, exit, transition, ...rest }) => R.createElement('div', rest, children) },
  };
});

/* ───────── fake data ───────── */

const CATEGORY = { id: 'c1', name: 'Laptops' };

const mk = (o) => ({
  id: 'p', name: 'Device', description: '', price: 1000, discount: 0, condition: 'New',
  categoryName: 'Laptops', createdAt: '2024-01-01', imageUrl: '', ...o,
});

/* final prices: Dell 800 (20% off), iPhone 5000, Samsung 3000, HP 1350 (10% off), Sony 500 */
const PRODUCTS = [
  mk({ id: 'p1', name: 'Dell Laptop', description: 'Fast machine', price: 1000, discount: 20, condition: 'New', createdAt: '2024-02-01' }),
  mk({ id: 'p2', name: 'iPhone 15', price: 5000, condition: 'Used', createdAt: '2024-05-01' }),
  mk({ id: 'p3', name: 'Samsung Galaxy', price: 3000, condition: 'Refurbished', createdAt: '2024-01-01' }),
  mk({ id: 'p4', name: 'HP Laptop', price: 1500, discount: 10, condition: 'Used', createdAt: '2024-04-01' }),
  mk({ id: 'p5', name: 'Sony Headphones', price: 500, condition: 'New', createdAt: '2024-03-01' }),
];
const API_ORDER = ['Dell Laptop', 'iPhone 15', 'Samsung Galaxy', 'HP Laptop', 'Sony Headphones'];

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

/* ───────── helpers ───────── */

/* Fakes the backend for /products/category/c1 (category details + products), then renders the page.
   `category` / `products` can be an Error to make that request fail (400/404 are not retried). */
function setup({ category = CATEGORY, products = PRODUCTS } = {}) {
  api.get.mockImplementation(async (path) => {
    if (path === '/api/categories/c1') {
      if (category instanceof Error) throw category;
      return { data: category };
    }
    if (path === '/api/products/category/c1') {
      if (products instanceof Error) throw products;
      return { data: products };
    }
    return { data: [] };
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/products/category/c1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/products/category/:categoryId" element={<CategoryProducts darkMode={false} toggleDarkMode={jest.fn()} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { user };
}

/* the "all products" section; the deals slider repeats some cards outside it */
const gridEl = () => document.getElementById('category-products');
const names = () => within(gridEl()).queryAllByRole('article').map((a) => a.getAttribute('aria-label'));
const waitForNames = (expected) => waitFor(() => expect(names()).toEqual(expected));
const getCard = (name) => within(gridEl()).findByRole('article', { name });
const summaryText = (text) => screen.getByText((_, el) => el?.tagName === 'P' && el.getAttribute('aria-live') === 'polite' && el.textContent === text);

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn(); /* jsdom does not implement it */
});

beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockReset();
  api.post.mockResolvedValue({ status: 200 });
  mockSwalFire.mockReset();
  mockSwalFire.mockResolvedValue({ isConfirmed: false });
  window.scrollTo = jest.fn();
  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  queryClient.setDefaultOptions({ queries: { retry: false, refetchOnWindowFocus: false } });
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
});

/* ───────── tests ───────── */

describe('Header', () => {
  it('shows the category name, product count and back link', async () => {
    setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Laptops' })).toBeInTheDocument();
    expect(await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === '5 products from sellers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to all devices/ })).toHaveAttribute('href', '/devices');
  });

  it('uses the singular for a single product', async () => {
    setup({ products: [PRODUCTS[0]] });
    expect(await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === '1 product from sellers')).toBeInTheDocument();
  });

  it('updates the document title', async () => {
    setup();
    await waitFor(() => expect(document.title).toBe('Laptops | TechShop'));
  });

  it('sends the auth token when loading the category', async () => {
    setup();
    await screen.findByRole('heading', { level: 1, name: 'Laptops' });
    expect(api.get).toHaveBeenCalledWith('/api/categories/c1', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }));
  });

  it('understands a localized category name', async () => {
    setup({ category: { id: 'c1', name: { en: 'Laptops', ar: 'لابتوب' } } });
    expect(await screen.findByRole('heading', { level: 1, name: 'Laptops' })).toBeInTheDocument();
  });

  it('understands a list response', async () => {
    setup({ category: [{ id: 'x', name: 'Other' }, { id: 'c1', name: 'Laptops' }] });
    expect(await screen.findByRole('heading', { level: 1, name: 'Laptops' })).toBeInTheDocument();
  });

  it('takes the name from the products when the category request fails', async () => {
    setup({ category: httpError(404) });
    expect(await screen.findByRole('heading', { level: 1, name: 'Laptops' })).toBeInTheDocument();
  });

  it('shows the trust strip', async () => {
    setup();
    expect(await screen.findByText('Verified sellers')).toBeInTheDocument();
    expect(screen.getByText('Quality checked')).toBeInTheDocument();
  });

  it('opens the cart from the navbar', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Cart' }));
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });
});

describe('Listing', () => {
  it('lists the category products', async () => {
    setup();
    await waitForNames(API_ORDER);
    expect(summaryText('1–5 / 5 products')).toBeInTheDocument();
  });

  it('shows an error and recovers with "Try again"', async () => {
    api.get.mockReset();
    let fail = true;
    api.get.mockImplementation(async (path) => {
      if (path === '/api/categories/c1') return { data: CATEGORY };
      if (fail) throw httpError(400);
      return { data: PRODUCTS };
    });
    render(
      <MemoryRouter initialEntries={['/products/category/c1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/products/category/:categoryId" element={<CategoryProducts darkMode={false} toggleDarkMode={jest.fn()} />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Could not load products')).toBeInTheDocument();
    fail = false;
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
    await waitForNames(API_ORDER);
  });

  it('shows "Nothing here yet" for an empty category', async () => {
    setup({ products: [] });
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('shows the discounted price, the old price and the discount badge on a card', async () => {
    setup();
    const card = await getCard('Dell Laptop');
    expect(within(card).getByText('EGP 800.00')).toBeInTheDocument();
    expect(within(card).getByText('EGP 1,000.00')).toBeInTheDocument();
    expect(within(card).getByText('-20%')).toBeInTheDocument();
  });

  it('switches to the list layout (which also shows the description)', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    expect(screen.queryByText('Fast machine')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Fast machine')).toBeInTheDocument();
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
});

describe('Deals and conditions', () => {
  it('lists the discounted products, biggest discount first', async () => {
    setup();
    const heading = await screen.findByRole('heading', { name: 'Biggest discounts' });
    const section = heading.closest('section');
    const labels = within(section).getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(labels).toEqual(['Dell Laptop', 'HP Laptop']);
    expect(within(section).getByText('Best savings on Laptops')).toBeInTheDocument();
  });

  it('hides the deals section when nothing is discounted', async () => {
    setup({ products: PRODUCTS.map((p) => ({ ...p, discount: 0 })) });
    await waitForNames(API_ORDER);
    expect(screen.queryByRole('heading', { name: 'Biggest discounts' })).not.toBeInTheDocument();
  });

  it('shows a card per condition with its count', async () => {
    setup();
    expect(await screen.findByRole('button', { name: /^New 2 items/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Refurbished 1 item$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Used 2 items/ })).toBeInTheDocument();
  });

  it('filters by a condition card and "All products" resets it', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const used = screen.getByRole('button', { name: /^Used/ });
    expect(used).toHaveAttribute('aria-pressed', 'false');
    await user.click(used);
    expect(used).toHaveAttribute('aria-pressed', 'true');
    await waitForNames(['iPhone 15', 'HP Laptop']);

    await user.click(screen.getByRole('button', { name: /^All products/ }));
    await waitForNames(API_ORDER);
  });
});

describe('Search and filters', () => {
  it('searches product names', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'LAPTOP');
    await waitForNames(['Dell Laptop', 'HP Laptop']);
  });

  it('shows the no-match state and "Clear filters" restores the list', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'zzzz');
    expect(await screen.findByText('No products match')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitForNames(API_ORDER);
  });

  it('filters by condition from the filter panel and removes it with the chip', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'New' }));
    await waitForNames(['Dell Laptop', 'Sony Headphones']);
    await user.click(screen.getByRole('button', { name: 'Remove New' }));
    await waitForNames(API_ORDER);
  });

  it('shows only products on sale', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'On sale only' }));
    await waitForNames(['Dell Laptop', 'HP Laptop']);
  });

  it('filters by price range', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('button', { name: 'Cap price at 1000' }));
    await waitForNames(['Dell Laptop', 'Sony Headphones']);
    expect(screen.getByRole('button', { name: /^Remove EGP 0/ })).toBeInTheDocument();
  });

  it('"Clear all" removes every active filter', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'On sale only' }));
    await user.click(screen.getByRole('checkbox', { name: 'New' }));
    await waitForNames(['Dell Laptop']);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await waitForNames(API_ORDER);
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

describe('Sorting and paging', () => {
  it.each([
    ['priceLowToHigh', ['Sony Headphones', 'Dell Laptop', 'HP Laptop', 'Samsung Galaxy', 'iPhone 15']],
    ['priceHighToLow', ['iPhone 15', 'Samsung Galaxy', 'HP Laptop', 'Dell Laptop', 'Sony Headphones']],
    ['newest', ['iPhone 15', 'HP Laptop', 'Sony Headphones', 'Dell Laptop', 'Samsung Galaxy']],
  ])('sorts by %s', async (value, expected) => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), value);
    await waitForNames(expected);
  });

  describe('with many products', () => {
    const many = Array.from({ length: 7 }, (_, i) => mk({ id: `x${i}`, name: `Device ${i}` }));

    it('shows one page and moves with the pagination buttons', async () => {
      const { user } = setup({ products: many });
      await waitFor(() => expect(names()).toHaveLength(5)); /* page size 5 */
      expect(summaryText('1–5 / 7 products')).toBeInTheDocument();

      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
      await user.click(within(nav).getByRole('button', { name: 'Next page' }));
      await waitForNames(['Device 5', 'Device 6']);
      expect(within(nav).getByRole('button', { name: 'Next page' })).toBeDisabled();

      await user.click(within(nav).getByRole('button', { name: '1' }));
      await waitFor(() => expect(names()).toHaveLength(5));
    });

    it('shows no pagination for a single page', async () => {
      setup();
      await waitForNames(API_ORDER);
      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });
  });
});

describe('Add to cart', () => {
  it('posts only the product id + quantity and reports success', async () => {
    const onCartUpdated = jest.fn();
    window.addEventListener('cart:updated', onCartUpdated);
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', toast: true })));
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

  it('reports an error when the request fails', async () => {
    api.post.mockRejectedValue(new Error('network'));
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', toast: true })));
  });

  it('treats a non-2xx response as a failure', async () => {
    api.post.mockResolvedValue({ status: 500 });
    const { user } = setup();
    const card = await getCard('Dell Laptop');
    await user.click(within(card).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockSwalFire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' })));
    expect(mockSwalFire).not.toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }));
  });
});