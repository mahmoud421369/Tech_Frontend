/**
 * Jest + React Testing Library tests for DeviceDetail.jsx (Create React App).
 * Location: src/common/test/DeviceDetail.test.jsx   (DeviceDetail.jsx is in src/User/)
 *
 * Requirements:
 *   - DeviceDetail.jsx has this line above its default export:  export { queryClient };
 *   - npm i -D @testing-library/dom @testing-library/react @testing-library/user-event @testing-library/jest-dom
 *   - src/setupTests.js contains:  import '@testing-library/jest-dom';
 *
 * Run:  npm test -- src/common/test/DeviceDetail.test.jsx
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import api from '../api/api';
import { toast } from '../../components/user/UiExtras';
import DeviceDetail, { queryClient } from '../../User/DeviceDetail';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */
/* (factories use React.createElement so they never reference out-of-scope JSX helpers) */

const mockNavigate = jest.fn();
const mockSwalFire = jest.fn();
let mockNavType = 'PUSH'; /* 'PUSH' = normal navigation, 'POP' = back/forward */

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useNavigationType: () => mockNavType,
}));

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('../utils/useAppLanguage', () => ({ useAppLanguage: () => 'en', languageDirection: () => 'ltr' }));

/* only the strings the tests rely on; any other key simply renders as the key itself */
jest.mock('../../locales/en/translation.json', () => ({
  deviceDetail: {
    currency: 'EGP', siteName: 'TechShop', breadcrumb: 'Breadcrumb', breadcrumbShop: 'Shop', deviceDetails: 'Device details',
    conditionNew: 'New', conditionUsed: 'Used', conditionRefurbished: 'Refurbished', conditionUnknown: 'Unknown',
    uncategorized: 'Uncategorized', outOfStock: 'Out of stock', inStock: 'In stock', onlyLeft: 'Only {{count}} left',
    unavailable: 'This product is no longer available',
    quantity: 'Quantity', decreaseQuantity: 'Decrease quantity', increaseQuantity: 'Increase quantity',
    addToCart: 'Add to cart', adding: 'Adding...', addedToCart: 'Added to cart', addedToCartText: '{{name}} was added to your cart',
    addFailed: 'Could not add to cart', errorTitle: 'Error', productNotFound: 'Product not found', goBack: 'Go back',
    productDescription: 'Description', noDescription: 'No description', stockCount: '{{count}} units available', listed: 'Listed {{date}}',
    similarProducts: 'Similar products', moreFromShop: 'More from {{name}}', otherDevices: 'Other {{condition}} devices',
    previous: 'Previous', next: 'Next', imageUnavailable: 'Image unavailable',
    loginRequiredTitle: 'Login required', goToLogin: 'Go to login', cancel: 'Cancel',
    cashOnDelivery: 'Cash on delivery', bestPrice: 'Best price', authentic: 'Authentic',
  },
}));
jest.mock('../../locales/ar/translation.json', () => ({ deviceDetail: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ deviceDetail: {} }));

jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null, isoCatKey: () => 'box' }));

jest.mock('../../components/user/Ui3D', () => {
  const h = require('react').createElement;
  return {
    UI3D_CSS: '',
    Defs3D: () => null,
    Glyph3D: () => null,
    Scene3D: () => null,
    Chip3D: ({ children }) => h('span', null, children),
    InfoRow: ({ children }) => h('div', null, children),
    Btn3D: ({ children, tone, darkMode, ...rest }) => h('button', { type: 'button', ...rest }, children),
  };
});

jest.mock('../../components/user/UiExtras', () => ({ EXTRAS_CSS: '', Toaster: () => null, toast: jest.fn() }));

jest.mock('../../components/user/ListingKit', () => {
  const R = require('react');
  return {
    LISTING_CSS: '',
    readStorage: (k) => global.localStorage.getItem(k), /* `global.` is allowed inside a mock factory, bare `localStorage` is not */
    safeImageUrl: (u) => (typeof u === 'string' && u ? u : ''),
    kindOfCategory: () => 'box',
    clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
    clean: (s, max) => String(s ?? '').slice(0, max),
    loadSwal: async () => ({ fire: (...a) => mockSwalFire(...a) }),
    useLangFont: () => ({ style: {}, className: '' }),
    useHScroll: () => ({ ref: R.createRef(), edge: { l: false, r: true }, scroll: () => {} }),
    HeroWave: () => null,
  };
});

/* ───────── fake data ───────── */

const mk = (o) => ({
  id: 'p', name: 'Device', description: '', price: 1000, discount: 0, stock: 5, condition: 'NEW',
  categoryId: 'c1', categoryName: 'Laptops', shopId: 's9', shopName: 'Other Shop', createdAt: '2024-05-15T12:00:00Z',
  imageUrl: 'x.jpg', ...o,
});

/* the device being viewed: final price 800 (20% off 1000) */
const PRODUCT = mk({
  id: 'p1', name: 'Dell Laptop', description: 'Fast machine', price: 1000, discount: 20, stock: 5,
  shopId: 's1', shopName: 'TechZone', imageUrl: 'a.jpg', images: ['b.jpg', 'c.jpg'],
});

const OTHERS = [
  mk({ id: 'p4', name: 'HP Laptop', condition: 'USED', shopId: 's2' }), /* same category */
  mk({ id: 'p3', name: 'Samsung Galaxy', condition: 'NEW', categoryId: 'c2', categoryName: 'Phones', shopId: 's1', shopName: 'TechZone' }), /* same shop */
  mk({ id: 'p5', name: 'Sony Headphones', condition: 'NEW', categoryId: 'c3', categoryName: 'Audio' }),
  mk({ id: 'p6', name: 'Deleted Laptop', deleted: true }),
];

/* ───────── helpers ───────── */

/* Fakes the backend: /api/products/:id returns `product` (or fails when it is null), /api/products returns the list. */
function setup({ product = PRODUCT, others = OTHERS, addToCart = jest.fn(), id = 'p1' } = {}) {
  api.get.mockImplementation(async (path) => {
    if (path === '/api/products') return { data: [product, ...others].filter(Boolean) };
    if (path.startsWith('/api/products/')) {
      if (!product) throw new Error('404');
      return { data: product };
    }
    return { data: [] };
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[`/device/${id}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/device/:id" element={<DeviceDetail darkMode={false} addToCart={addToCart} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { user, addToCart };
}

/* waits for the page to be ready (the product <h1> is on screen) */
const ready = (name = 'Dell Laptop') => screen.findByRole('heading', { level: 1, name });
/* the buy panel (price, stock, quantity, add-to-cart) */
const panel = () => within(screen.getByRole('complementary'));
const articleNames = (el) => within(el).getAllByRole('article').map((a) => a.getAttribute('aria-label'));

beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockReset();
  api.post.mockResolvedValue({ status: 200 });
  mockSwalFire.mockReset();
  mockNavType = 'PUSH';
  window.scrollTo = jest.fn(); /* jsdom does not implement it */
  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
});

/* ───────── tests ───────── */

describe('Product details', () => {
  it('shows the name, category, description and condition', async () => {
    setup();
    await ready();
    expect(api.get).toHaveBeenCalledWith('/api/products/p1', expect.anything());
    expect(panel().getByText('Laptops')).toBeInTheDocument();
    expect(panel().getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Fast machine')).toBeInTheDocument();
  });

  it('shows the discounted price, the old price and the discount percentage', async () => {
    setup();
    await ready();
    expect(panel().getByText('EGP 800')).toBeInTheDocument();
    expect(panel().getByText(/^EGP 1,?000$/)).toBeInTheDocument();
    expect(panel().getByText('-20%')).toBeInTheDocument();
  });

  it('derives the discount from a legacy oldPrice field', async () => {
    setup({ product: { ...PRODUCT, discount: 0, price: 1000, oldPrice: 1200 } });
    await ready();
    expect(panel().getByText('EGP 1,000')).toBeInTheDocument();
    expect(panel().getByText('-17%')).toBeInTheDocument();
  });

  it('shows no discount badge for a regular price', async () => {
    setup({ product: { ...PRODUCT, discount: 0 } });
    await ready();
    expect(panel().queryByText(/^-\d+%$/)).not.toBeInTheDocument();
  });

  it('treats an invalid price as 0', async () => {
    setup({ product: { ...PRODUCT, discount: 0, price: 'abc' } });
    await ready();
    expect(panel().getByText('EGP 0')).toBeInTheDocument();
  });

  it('falls back to a placeholder description', async () => {
    setup({ product: { ...PRODUCT, description: '' } });
    await ready();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows the breadcrumb and updates the document title', async () => {
    setup();
    await ready();
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/devices');
    expect(within(nav).getByText('Laptops')).toBeInTheDocument();
    expect(within(nav).getByText('Dell Laptop')).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(document.title).toBe('Dell Laptop | TechShop'));
  });

  it('shows the listing date and the stock count', async () => {
    setup();
    await ready();
    expect(screen.getByText(/^Listed .*2024$/)).toBeInTheDocument();
    expect(screen.getByText('5 units available')).toBeInTheDocument();
  });

  it('links to the shop when the product has one', async () => {
    setup();
    await ready();
    expect(panel().getByRole('link', { name: 'TechZone' })).toHaveAttribute('href', '/shops/s1');
  });

  it('shows no shop link without a shop', async () => {
    setup({ product: { ...PRODUCT, shopId: undefined, shopName: undefined } });
    await ready();
    expect(screen.queryByRole('link', { name: 'TechZone' })).not.toBeInTheDocument();
  });

  it('does not crash on an unknown condition value', async () => {
    setup({ product: { ...PRODUCT, condition: 'constructor' } });
    await ready();
    expect(panel().getByText('constructor')).toBeInTheDocument();
  });
});

describe('Gallery', () => {
  it('builds the gallery from the main image plus the extra images', async () => {
    const { user } = setup();
    await ready();
    expect(screen.getByRole('img', { name: 'Dell Laptop' })).toHaveAttribute('src', 'a.jpg');
    expect(screen.getByRole('button', { name: 'Dell Laptop 1' })).toHaveAttribute('aria-current', 'true');

    await user.click(screen.getByRole('button', { name: 'Dell Laptop 2' }));
    expect(screen.getByRole('img', { name: 'Dell Laptop' })).toHaveAttribute('src', 'b.jpg');
    expect(screen.getByRole('button', { name: 'Dell Laptop 2' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Dell Laptop 3' })).toBeInTheDocument();
  });

  it('shows no thumbnails for a single image', async () => {
    setup({ product: { ...PRODUCT, images: [] } });
    await ready();
    expect(screen.queryByRole('button', { name: 'Dell Laptop 1' })).not.toBeInTheDocument();
  });

  it('shows the illustration when the product has no image', async () => {
    setup({ product: { ...PRODUCT, imageUrl: '', images: [] } });
    await ready();
    expect(screen.getByRole('img', { name: 'Image unavailable' })).toBeInTheDocument();
  });
});

describe('Stock and quantity', () => {
  it.each([
    [20, 'In stock'],
    [5, 'Only 5 left'],
  ])('shows the stock status for %i units', async (stock, label) => {
    setup({ product: { ...PRODUCT, stock } });
    await ready();
    expect(panel().getByText(label)).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });

  it('disables buying when the product is out of stock', async () => {
    setup({ product: { ...PRODUCT, stock: 0 } });
    await ready();
    expect(panel().getByText('Out of stock')).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });

  it('disables buying and explains it when the product was deleted', async () => {
    setup({ product: { ...PRODUCT, deleted: true } });
    await ready();
    expect(panel().getByText('This product is no longer available')).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });

  it('keeps the quantity between 1 and the available stock', async () => {
    const { user } = setup({ product: { ...PRODUCT, stock: 3 } });
    await ready();
    const qty = () => screen.getByRole('complementary').querySelector('[aria-live="polite"]');
    const minus = panel().getByRole('button', { name: 'Decrease quantity' });
    const plus = panel().getByRole('button', { name: 'Increase quantity' });

    expect(qty()).toHaveTextContent('1');
    expect(minus).toBeDisabled();
    await user.click(plus);
    await user.click(plus);
    expect(qty()).toHaveTextContent('3');
    expect(plus).toBeDisabled();
    await user.click(minus);
    expect(qty()).toHaveTextContent('2');
  });
});

describe('Add to cart', () => {
  it('posts only the product id + chosen quantity and reports success', async () => {
    const onCartUpdated = jest.fn();
    window.addEventListener('cart:updated', onCartUpdated);
    const { user, addToCart } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Increase quantity' }));
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' })));
    expect(api.post).toHaveBeenCalledWith('/api/cart/items', { productId: 'p1', quantity: 2 });
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', quantity: 2 }));
    expect(onCartUpdated).toHaveBeenCalled();
    window.removeEventListener('cart:updated', onCartUpdated);
  });

  it('blocks double submits while the request is pending', async () => {
    let finish;
    api.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { user } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));

    const busy = await screen.findByRole('button', { name: 'Adding...' });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(api.post).toHaveBeenCalledTimes(1);

    finish({ status: 200 });
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' })));
    expect(panel().getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });

  it('asks a guest to log in and goes to /login when confirmed', async () => {
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: true });
    const { user, addToCart } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(api.post).not.toHaveBeenCalled();
    expect(addToCart).not.toHaveBeenCalled();
  });

  it('stays on the page when the guest cancels the login prompt', async () => {
    localStorage.removeItem('authToken');
    mockSwalFire.mockResolvedValue({ isConfirmed: false });
    const { user } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(mockSwalFire).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows the server message when adding fails', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Stock changed' } } });
    const { user, addToCart } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Stock changed' })));
    expect(addToCart).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the server gives none', async () => {
    api.post.mockRejectedValue(new Error('network'));
    const { user } = setup();
    await ready();
    await user.click(panel().getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Could not add to cart' })));
  });
});

describe('Related products', () => {
  it('lists same-category products (without itself or deleted ones)', async () => {
    setup();
    await ready();
    const region = await screen.findByRole('region', { name: 'Similar products' });
    expect(articleNames(region)).toEqual(['HP Laptop']);
  });

  it('lists more products from the same shop', async () => {
    setup();
    await ready();
    const region = await screen.findByRole('region', { name: 'More from TechZone' });
    expect(articleNames(region)).toEqual(['Samsung Galaxy']);
  });

  it('falls back to devices in the same condition when the product has no shop', async () => {
    setup({ product: { ...PRODUCT, shopId: undefined, shopName: undefined } });
    await ready();
    const region = await screen.findByRole('region', { name: 'Other new devices' });
    expect(articleNames(region)).toEqual(['Samsung Galaxy', 'Sony Headphones']);
  });

  it('hides the "similar" slider when there are no similar products', async () => {
    setup({ product: { ...PRODUCT, categoryId: 'c9' } });
    await ready();
    await screen.findByRole('region', { name: 'More from TechZone' });
    expect(screen.queryByRole('region', { name: 'Similar products' })).not.toBeInTheDocument();
  });

  it('opens a related product', async () => {
    const { user } = setup();
    await ready();
    const region = await screen.findByRole('region', { name: 'Similar products' });
    await user.click(within(region).getByRole('article', { name: 'HP Laptop' }));
    expect(mockNavigate).toHaveBeenCalledWith('/device/p4');
  });

  it('adds a related product to the cart with quantity 1', async () => {
    const { user, addToCart } = setup();
    await ready();
    const region = await screen.findByRole('region', { name: 'Similar products' });
    await user.click(within(region).getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' })));
    expect(api.post).toHaveBeenCalledWith('/api/cart/items', { productId: 'p4', quantity: 1 });
    expect(addToCart).not.toHaveBeenCalled(); /* the page-level callback is only for the main product */
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Not found and navigation', () => {
  it('shows "Product not found" and goes back', async () => {
    const { user } = setup({ product: null });
    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Product not found' })));
    await user.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('scrolls to the top on a normal navigation', async () => {
    mockNavType = 'PUSH';
    setup();
    await ready();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('leaves scrolling to the browser on back/forward', async () => {
    mockNavType = 'POP';
    setup();
    await ready();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});