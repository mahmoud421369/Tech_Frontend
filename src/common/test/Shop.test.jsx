
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/api';
import Shops, { queryClient } from '../../User/Shops';



const mockNavigate = jest.fn();
let mockNavType = 'PUSH'; 

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


jest.mock('../../locales/en/translation.json', () => ({
  shops: {
    pageTitle: 'Find shops', noAddress: 'No address', unnamedShop: 'Unnamed shop', verified: 'Verified', electronics: 'Electronics',
    getDirections: 'Get directions', details: 'Details', visitShop: 'Visit shop', close: 'Close', about: 'About', noDescription: 'No description',
    whatShopCanDo: 'What this shop can do', capRepairTitle: 'Repairs', capCertifiedTitle: 'Certified', capBuySellTitle: 'Buy and sell', capTradeInTitle: 'Trade-in',
    shopSingular: 'shop', shopPlural: 'shops', viewAll: 'View all',
    repairSectionTitle: 'Repair shops', sellSectionTitle: 'Sell shops', bothSectionTitle: 'Repair and sell shops',
    filters: 'Filters', resetAll: 'Reset all', serviceType: 'Service type', allShops: 'All shops', repairServices: 'Repair services', sellTradeIn: 'Sell and trade-in',
    shopType: 'Shop type', noTypes: 'No types', city: 'City', minimumRating: 'Minimum rating', anyRating: 'Any rating', stars: 'stars', verifiedOnly: 'Verified only',
    allShopsTitle: 'Shop directory', shopsFound: 'shops found', rowsPerPage: 'Rows per page', perPage: 'per page', gridView: 'Grid view', listView: 'List view',
    search: 'Search shops', searchAria: 'Search shops', clearSearch: 'Clear search', sortBy: 'Sort by',
    sortRelevance: 'Relevance', sortRating: 'Top rated', sortName: 'Name (A-Z)', clearAll: 'Clear all', loading: 'Loading',
    loadErrorTitle: 'Could not load shops', tryAgain: 'Try again', noMatch: 'No shops match your filters', noShops: 'No shops yet', clearFilters: 'Clear filters',
    backToTop: 'Back to top', closeFilters: 'Close filters', showShops: 'Show {{count}} shops', pagination: 'Shops pagination',
    topRated: 'Top rated', customerFavorites: 'Customer favorites', findExpert: 'Find an expert',
  },
}));
jest.mock('../../locales/ar/translation.json', () => ({ shops: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ shops: {} }));

jest.mock('../../components/user/Hero', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/user/IsoIllustrations', () => ({ IsoIllustration: () => null, isoRoleKey: () => 'box' }));

jest.mock('../../common/utils/shopsutils', () => ({
  roleStyle: () => ({ grad: '', icon: () => null }),
  getShopRole: (s) => s.role || 'BOTH',
  serviceLabel: (role) => ({ REPAIRER: 'Repair', SELLER: 'Sell', BOTH: 'Both' }[role]),
  addressLine: (s) => [s.shopAddress?.street, s.shopAddress?.city].filter(Boolean).join(', '),
  directionsUrl: (s) => `https://maps.test/?q=${encodeURIComponent(s.name)}`,
}));

jest.mock('../../components/user/Ui3D', () => {
  const h = require('react').createElement;
  return {
    UI3D_CSS: '',
    Defs3D: () => null,
    Chip3D: ({ children }) => h('span', null, children),
    InfoRow: ({ children }) => h('div', null, children),
    Btn3D: ({ children, tone, darkMode, ...rest }) => h('button', { type: 'button', ...rest }, children),
    FilterSection: ({ title, children }) => h('section', null, h('h4', null, title), children),
    OptionRow: ({ type, label, selected, onClick }) =>
      h('button', { type: 'button', role: type === 'radio' ? 'radio' : 'checkbox', 'aria-checked': !!selected, onClick }, label),
  };
});

jest.mock('../../components/user/ListingKit', () => {
  const h = require('react').createElement;
  return {
    LISTING_CSS: '',
    PAGE_SIZES: [4, 8],
    useLangFont: () => ({ style: {}, className: '' }),
    useBackToTop: () => false,
    useModalLock: () => {},
    Dropdown: ({ label, ariaLabel, value, onChange, options }) =>
      h('select', {
        'aria-label': ariaLabel || label,
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
    Pager: ({ page, totalPages, onPage, label }) =>
      h('nav', { 'aria-label': label }, Array.from({ length: totalPages }, (_, i) =>
        h('button', { key: i, type: 'button', 'aria-current': page === i + 1 ? 'page' : undefined, onClick: () => onPage(i + 1) }, `Page ${i + 1}`))),
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
  const pass = ({ children }) => R.createElement(R.Fragment, null, children);
  return {
    LazyMotion: pass,
    MotionConfig: pass,
    AnimatePresence: pass,
    domAnimation: {},
    m: { div: ({ children, initial, animate, exit, transition, ...rest }) => R.createElement('div', rest, children) },
  };
});



const S = (o) => ({
  id: 's', name: 'Shop', role: 'BOTH', shopType: 'Electronics', description: '', phone: '', rating: 0, verified: false,
  shopAddress: { city: 'Cairo', street: 'Main St' }, ...o,
});

const SHOPS = [
  S({ id: 's1', name: 'Fix It Fast', role: 'REPAIRER', shopType: 'Phone Repair', description: 'Quick screen fixes', phone: '+201001', rating: 4.9, verified: true }),
  S({ id: 's2', name: 'Gadget Store', role: 'SELLER', shopType: 'Electronics', rating: 4.2, shopAddress: { city: 'Giza', street: 'Pyramids Rd' } }),
  S({ id: 's3', name: 'All Tech', role: 'BOTH', shopType: 'Phone Repair', rating: 4.6, verified: true }),
  S({ id: 's4', name: 'No Rating Shop', role: 'SELLER', shopType: 'Electronics', shopAddress: undefined }),
];
const API_ORDER = ['Fix It Fast', 'Gadget Store', 'All Tech', 'No Rating Shop'];
const list = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));


function setup({ shops = SHOPS, products = {}, reviews = {}, impl } = {}) {
  api.get.mockImplementation(
    impl ||
      (async (path) => {
        if (path === '/api/users/shops/all') return { data: shops };
        let m = path.match(/^\/api\/products\/shop\/(.+)$/);
        if (m) {
          const v = products[decodeURIComponent(m[1])];
          if (v instanceof Error) throw v;
          return { data: v ?? [] };
        }
        m = path.match(/^\/api\/reviews\/(.+)\/reviews$/);
        if (m) {
          const v = reviews[decodeURIComponent(m[1])];
          if (v instanceof Error) throw v;
          return { data: v ?? [] };
        }
        return { data: [] };
      }),
  );
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Shops darkMode={false} />
    </MemoryRouter>,
  );
  return { user };
}


const resultsEl = () => document.getElementById('shop-results');
const names = () => within(resultsEl()).queryAllByRole('article').map((a) => a.getAttribute('aria-label'));
const waitForNames = (expected) => waitFor(() => expect(names()).toEqual(expected));
const getCard = (name) => within(resultsEl()).findByRole('article', { name });

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn(); 
});

beforeEach(() => {
  jest.clearAllMocks();
  mockNavType = 'PUSH';
  window.scrollTo = jest.fn();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false, refetchOnWindowFocus: false } });
  localStorage.clear();
  sessionStorage.clear();
});



describe('Loading and listing', () => {
  it('lists the shops returned by the API', async () => {
    setup();
    await waitForNames(API_ORDER);
  });

  it('shows a loading state while the shops load', () => {
    setup({ impl: () => new Promise(() => {}) });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no shops', async () => {
    setup({ shops: [] });
    expect(await screen.findByText('No shops yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('shows an error and recovers with "Try again"', async () => {
    let fail = true;
    const { user } = setup({
      impl: async (path) => {
        if (path === '/api/users/shops/all') {
          if (fail) throw new Error('server down');
          return { data: SHOPS };
        }
        return { data: [] };
      },
    });
    expect(await screen.findByText('Could not load shops')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitForNames(API_ORDER);
  });

  it('updates the document title', async () => {
    setup();
    await waitFor(() => expect(document.title).toBe('Find shops'));
  });
});

describe('Shop card', () => {
  it('shows the product and review counters from the shop endpoints', async () => {
    setup({ products: { s1: list(3) }, reviews: { s1: list(1) } });
    const card = await getCard('Fix It Fast');
    expect(await within(card).findByText('+3')).toBeInTheDocument();
    expect(within(card).getByText('products')).toBeInTheDocument();
    expect(within(card).getByText('+1')).toBeInTheDocument();
    expect(within(card).getByText('review')).toBeInTheDocument();
  });

  it('understands paged counter responses', async () => {
    setup({ products: { s2: { totalElements: 12, content: [] } } });
    const card = await getCard('Gadget Store');
    expect(await within(card).findByText('+12')).toBeInTheDocument();
  });

  it('falls back to the counters on the shop when the endpoint fails', async () => {
    const shops = [S({ id: 's2', name: 'Gadget Store', role: 'SELLER', productCount: 7 })];
    setup({ shops, products: { s2: new Error('boom') } });
    const card = await getCard('Gadget Store');
    expect(await within(card).findByText('+7')).toBeInTheDocument();
  });

  it('shows the rating, address and phone', async () => {
    setup();
    const card = await getCard('Fix It Fast');
    expect(within(card).getByText('4.9')).toBeInTheDocument();
    expect(within(card).getByText('Main St, Cairo')).toBeInTheDocument();
    expect(within(card).getByText('+201001')).toBeInTheDocument();
  });

  it('shows "No address" and no rating for a bare shop', async () => {
    setup();
    const card = await getCard('No Rating Shop');
    expect(within(card).getByText('No address')).toBeInTheDocument();
    expect(within(card).queryByText('0.0')).not.toBeInTheDocument();
  });

  it('falls back to "Unnamed shop" when the name is missing', async () => {
    setup({ shops: [S({ id: 's9', name: '' })] });
    await waitForNames(['Unnamed shop']);
  });

  it('links to directions in a new tab', async () => {
    setup();
    const card = await getCard('Fix It Fast');
    const link = within(card).getByRole('link', { name: 'Get directions' });
    expect(link).toHaveAttribute('href', 'https://maps.test/?q=Fix%20It%20Fast');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('opens the shop page on click and on Enter', async () => {
    const { user } = setup();
    const card = await getCard('Fix It Fast');
    await user.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');
    mockNavigate.mockClear();
    card.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');
  });

  it('opens the shop once when the "Visit shop" button is clicked', async () => {
    const { user } = setup();
    const card = await getCard('Fix It Fast');
    await user.click(within(card).getByRole('button', { name: 'Visit shop' }));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');
  });
});

describe('Details modal', () => {
  it('opens without navigating, shows the shop info and closes', async () => {
    const { user } = setup();
    const card = await getCard('Fix It Fast');
    await user.click(within(card).getByRole('button', { name: 'Details' }));

    const dialog = screen.getByRole('dialog', { name: 'Fix It Fast' });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Quick screen fixes')).toBeInTheDocument();
    expect(within(dialog).getByText('Verified')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Get directions' })).toBeInTheDocument();

    await user.click(within(dialog).getAllByRole('button', { name: 'Close' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a placeholder when the shop has no description', async () => {
    const { user } = setup();
    const card = await getCard('Gadget Store');
    await user.click(within(card).getByRole('button', { name: 'Details' }));
    expect(within(screen.getByRole('dialog')).getByText('No description')).toBeInTheDocument();
  });

  it.each([
    ['Fix It Fast', ['Repairs', 'Certified'], ['Buy and sell', 'Trade-in']],
    ['Gadget Store', ['Buy and sell', 'Trade-in'], ['Repairs', 'Certified']],
    ['All Tech', ['Repairs', 'Certified', 'Buy and sell', 'Trade-in'], []],
  ])('lists the right capabilities for %s', async (name, shown, hidden) => {
    const { user } = setup();
    const card = await getCard(name);
    await user.click(within(card).getByRole('button', { name: 'Details' }));
    const dialog = screen.getByRole('dialog');
    shown.forEach((t) => expect(within(dialog).getByText(t)).toBeInTheDocument());
    hidden.forEach((t) => expect(within(dialog).queryByText(t)).not.toBeInTheDocument());
  });

  it('"Visit shop" closes the modal and opens the shop page', async () => {
    const { user } = setup();
    const card = await getCard('Fix It Fast');
    await user.click(within(card).getByRole('button', { name: 'Details' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Visit shop' }));
    expect(mockNavigate).toHaveBeenCalledWith('/shops/s1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Featured and role sections', () => {
  it('lists the top-rated shops (rating > 0) in the banner', async () => {
    setup();
    const banner = await screen.findByTestId('featured');
    const labels = within(banner).getAllByRole('article').map((a) => a.getAttribute('aria-label'));
    expect(labels).toEqual(['Fix It Fast', 'All Tech', 'Gadget Store']);
  });

  it('shows one section per service role that has shops', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: /Repair shops/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sell shops/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Repair and sell shops/ })).toBeInTheDocument();
  });

  it('"View all" applies the matching service filter', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const viewAll = screen.getAllByRole('button', { name: 'View all' });
    expect(viewAll).toHaveLength(3);

    await user.click(viewAll[0]);
    expect(screen.getByRole('radio', { name: 'Repair services' })).toHaveAttribute('aria-checked', 'true');
    await waitForNames(['Fix It Fast', 'All Tech']);
  });

  it('filters by a specialty card and toggles it off again', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const card = screen.getByRole('button', { name: /^Electronics/ });
    expect(card).toHaveAttribute('aria-pressed', 'false');
    await user.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    await waitForNames(['Gadget Store', 'No Rating Shop']);
    await user.click(card);
    await waitForNames(API_ORDER);
  });
});

describe('Search and filters', () => {
  it('searches names, types, cities and descriptions', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    const box = screen.getByRole('textbox', { name: 'Search shops' });
    await user.type(box, 'SCREEN');
    await waitForNames(['Fix It Fast']);
    await user.clear(box);
    await user.type(box, 'giza');
    await waitForNames(['Gadget Store']);
  });

  it('shows the no-match state and "Clear filters" restores the list', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.type(screen.getByRole('textbox', { name: 'Search shops' }), 'zzzz');
    expect(await screen.findByText('No shops match your filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitForNames(API_ORDER);
  });

  it('filters by service type (a BOTH shop matches both)', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('radio', { name: 'Repair services' }));
    await waitForNames(['Fix It Fast', 'All Tech']);
    await user.click(screen.getByRole('radio', { name: 'Sell and trade-in' }));
    await waitForNames(['Gadget Store', 'All Tech', 'No Rating Shop']);
  });

  it('filters by shop type and removes it with the chip', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'Phone Repair' }));
    await waitForNames(['Fix It Fast', 'All Tech']);
    await user.click(screen.getByRole('button', { name: 'Remove Phone Repair' }));
    await waitForNames(API_ORDER);
  });

  it('filters by city', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('button', { name: 'Cairo' }));
    await waitForNames(['Fix It Fast', 'All Tech']);
  });

  it('filters by minimum rating', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('radio', { name: /^4\.5\+ stars$/ }));
    await waitForNames(['Fix It Fast', 'All Tech']);
    await user.click(screen.getByRole('radio', { name: 'Any rating' }));
    await waitForNames(API_ORDER);
  });

  it('shows only verified shops', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'Verified only' }));
    await waitForNames(['Fix It Fast', 'All Tech']);
  });

  it('"Clear all" removes every active filter', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('checkbox', { name: 'Verified only' }));
    await user.click(screen.getByRole('button', { name: 'Cairo' }));
    await waitForNames(['Fix It Fast', 'All Tech']);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await waitForNames(API_ORDER);
  });

  it('opens and closes the mobile filter sheet', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(dialog).getByRole('button', { name: 'Show 4 shops' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    await user.click(screen.getByRole('button', { name: 'Close filters' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches between grid and list view', async () => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Sorting and paging', () => {
  it.each([
    ['ratingHighToLow', ['Fix It Fast', 'All Tech', 'Gadget Store', 'No Rating Shop']],
    ['nameAZ', ['All Tech', 'Fix It Fast', 'Gadget Store', 'No Rating Shop']],
  ])('sorts by %s', async (value, expected) => {
    const { user } = setup();
    await waitForNames(API_ORDER);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), value);
    await waitForNames(expected);
  });

  describe('with many shops', () => {
    const many = Array.from({ length: 9 }, (_, i) => S({ id: `x${i}`, name: `Shop ${i}`, role: 'SELLER' }));
    const summary = (text) => screen.getAllByText((_, el) => el?.tagName === 'P' && el.getAttribute('aria-live') === 'polite' && el.textContent === text);

    it('shows one page and moves between pages', async () => {
      const { user } = setup({ shops: many });
      await waitForNames(['Shop 0', 'Shop 1', 'Shop 2', 'Shop 3']); 
      expect(summary('1–4 / 9 shops found')).toHaveLength(1);

      const pager = screen.getByRole('navigation', { name: 'Shops pagination' });
      await user.click(within(pager).getByRole('button', { name: 'Page 2' }));
      await waitForNames(['Shop 4', 'Shop 5', 'Shop 6', 'Shop 7']);
      expect(summary('5–8 / 9 shops found')).toHaveLength(1);
    });

    it('grows with "Rows per page"', async () => {
      const { user } = setup({ shops: many });
      await waitFor(() => expect(names()).toHaveLength(4));
      await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '8');
      await waitFor(() => expect(names()).toHaveLength(8));
    });
  });
});

describe('Scrolling', () => {
  it('scrolls to the top on a normal navigation', async () => {
    mockNavType = 'PUSH';
    setup();
    await waitForNames(API_ORDER);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('leaves scrolling to the browser on back/forward', async () => {
    mockNavType = 'POP';
    setup();
    await waitForNames(API_ORDER);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});