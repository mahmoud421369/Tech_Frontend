
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../api/api';
import Track, { queryClient } from '../../User/Track';



jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

/* language is switchable per test (variables starting with "mock" may be used inside jest.mock) */
let mockLanguage = 'en';
jest.mock('../utils/useAppLanguage', () => ({
  useAppLanguage: () => mockLanguage,
  languageDirection: (l) => (l === 'ar' ? 'rtl' : 'ltr'),
}));

/* empty translations -> t(key) returns the key */
jest.mock('../../locales/en/translation.json', () => ({ track: {} }));
jest.mock('../../locales/ar/translation.json', () => ({ track: {} }));
jest.mock('../../locales/fr/translation.json', () => ({ track: {} }));

jest.mock('../../components/user/Hero', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/user/Ui3D', () => {
  const React = require('react');
  return {
    __esModule: true,
    Defs3D: () => null,
    Glyph3D: () => null,
    TrustStrip: () => null,
    Chip3D: ({ children }) => React.createElement('span', null, children),
    Btn3D: ({ as: As = 'button', tone, darkMode, children, ...rest }) => React.createElement(As, rest, children),
  };
});



const order = (o = {}) => ({
  id: 'aaaaaaaa-1111',
  status: 'PENDING',
  createdAt: '2025-01-10T12:00:00Z',
  updatedAt: '2025-01-11T12:00:00Z',
  ...o,
});

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });


function setup({ orders = [], error = null } = {}) {
  const state = { orders, error };
  api.get.mockImplementation(async () => {
    if (state.error) throw state.error;
    return { data: state.orders };
  });
  const user = userEvent.setup();
  const utils = render(<Track />);
  return { user, state, ...utils };
}

const progressbar = () => screen.getByRole('progressbar');

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear(); 
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
  mockLanguage = 'en';
});



describe('Page states', () => {
  it('asks the user to log in when there is no token', async () => {
    localStorage.removeItem('authToken');
    setup();
    expect(await screen.findByText('loginRequired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /goToLogin/ })).toHaveAttribute('href', '/login');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('shows a loading skeleton while orders are loading', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<Track />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows an error card and recovers when "try again" is clicked', async () => {
    const { user, state } = setup({ error: httpError(400) });
    expect(await screen.findByText('loadErrorTitle')).toBeInTheDocument();

    state.error = null;
    state.orders = [order()];
    await user.click(screen.getByRole('button', { name: /tryAgain/ }));

    expect((await screen.findAllByText('#aaaaaaaa')).length).toBeGreaterThan(0);
    expect(screen.queryByText('loadErrorTitle')).not.toBeInTheDocument();
  });

  it('shows the empty state when the user has no orders', async () => {
    setup({ orders: [] });
    expect(await screen.findByText('noOrders')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /startShoppingButton/ })).toHaveAttribute('href', '/devices');
  });

  it('sets the page title', async () => {
    setup({ orders: [order()] });
    await screen.findAllByText('#aaaaaaaa');
    expect(document.title).toBe('Track your order | Tech-Restore');
  });

  it('renders right-to-left for Arabic', async () => {
    mockLanguage = 'ar';
    const { container } = setup({ orders: [order()] });
    await screen.findAllByText('#aaaaaaaa');
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
});

describe('Loading orders', () => {
  it('sends the auth token with the request', async () => {
    setup({ orders: [order()] });
    await screen.findAllByText('#aaaaaaaa');
    expect(api.get).toHaveBeenCalledWith(
      '/api/users/orders',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  });

  it('understands a paged response ({ content: [...] })', async () => {
    api.get.mockResolvedValue({ data: { content: [order({ id: 'cccccccc-3333' })] } });
    render(<Track />);
    expect((await screen.findAllByText('#cccccccc')).length).toBeGreaterThan(0);
  });

  it('ignores empty entries in the list', async () => {
    api.get.mockResolvedValue({ data: [null, order()] });
    render(<Track />);
    expect((await screen.findAllByText('#aaaaaaaa')).length).toBeGreaterThan(0);
  });
});

describe('Progress and steps', () => {
  it.each([
    ['PENDING', 0],
    ['PROCESSING', 40],
    ['FINISHPROCESSING', 60],
    ['SHIPPED', 80],
    ['DELIVERED', 100],
  ])('shows the right progress for %s', async (status, pct) => {
    setup({ orders: [order({ status })] });
    await screen.findAllByText('#aaaaaaaa');
    expect(progressbar()).toHaveAttribute('aria-valuenow', String(pct));
    expect(screen.getByText(`${pct}%`)).toBeInTheDocument();
  });

  it('marks the current step', async () => {
    setup({ orders: [order({ status: 'PROCESSING' })] });
    const badge = await screen.findByText('currentStatus');
    expect(badge.closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('itemsPrepared')).toBeInTheDocument();
  });

  it('shows the delivered step (and not the cancelled one) for a normal order', async () => {
    setup({ orders: [order({ status: 'SHIPPED' })] });
    await screen.findAllByText('#aaaaaaaa');
    expect(screen.getByText('packageDelivered')).toBeInTheDocument();
    expect(screen.queryByText('orderCancelled')).not.toBeInTheDocument();
  });

  it('shows the cancelled step and hides progress for a cancelled order', async () => {
    setup({ orders: [order({ status: 'CANCELLED' })] });
    await screen.findAllByText('#aaaaaaaa');
    expect(screen.getByText('orderCancelled')).toBeInTheDocument();
    expect(screen.queryByText('packageDelivered')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the timestamp from the status history', async () => {
    setup({
      orders: [order({ statusHistory: [{ status: 'PENDING', timestamp: '2025-01-09T12:00:00Z' }] })],
    });
    expect(await screen.findByText(/9 Jan,/)).toBeInTheDocument();
  });
});

describe('Order selector', () => {
  const two = [
    order({ id: 'aaaaaaaa-1111', status: 'PENDING' }),
    order({ id: 'bbbbbbbb-2222', status: 'DELIVERED' }),
  ];

  it('shows the first order by default and lists all orders', async () => {
    setup({ orders: two });
    await screen.findAllByText('#aaaaaaaa');
    expect(screen.getByLabelText('selectOrder')).toHaveValue('aaaaaaaa-1111');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(progressbar()).toHaveAttribute('aria-valuenow', '0');
  });

  it('switches to the selected order', async () => {
    const { user } = setup({ orders: two });
    await screen.findAllByText('#aaaaaaaa');
    await user.selectOptions(screen.getByLabelText('selectOrder'), 'bbbbbbbb-2222');
    expect((await screen.findAllByText('#bbbbbbbb')).length).toBeGreaterThan(0);
    expect(progressbar()).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Order details', () => {
  it('shows the order details panel', async () => {
    setup({
      orders: [
        order({
          trackingNumber: 'TRK-999',
          carrier: 'Aramex',
          totalAmount: 1500,
          paymentMethod: 'CARD',
          shippingAddress: { street: 'Street 9', city: 'Cairo' },
          items: [{}, {}],
        }),
      ],
    });
    expect(await screen.findByText('TRK-999')).toBeInTheDocument();
    expect(screen.getByText('Aramex')).toBeInTheDocument();
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
    expect(screen.getByText('CARD')).toBeInTheDocument();
    expect(screen.getByText('Street 9, Cairo')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('accepts an address sent as a plain string', async () => {
    setup({ orders: [order({ address: '12 Tahrir Square, Cairo' })] });
    expect(await screen.findByText('12 Tahrir Square, Cairo')).toBeInTheDocument();
  });

  it('falls back to the default courier', async () => {
    setup({ orders: [order()] });
    expect(await screen.findByText('standardCourier')).toBeInTheDocument();
  });

  it('formats the order date', async () => {
    setup({ orders: [order({ createdAt: '2025-01-10T12:00:00Z' })] });
    expect(await screen.findByText('10 Jan 2025')).toBeInTheDocument();
  });

  it('shows "estimated delivery" for an open order and "delivered on" for a delivered one', async () => {
    const { unmount } = setup({ orders: [order({ status: 'SHIPPED' })] });
    expect(await screen.findByText('estimatedDelivery')).toBeInTheDocument();
    expect(screen.queryByText('deliveredOn')).not.toBeInTheDocument();
    unmount();

    queryClient.clear();
    setup({ orders: [order({ status: 'DELIVERED' })] });
    expect(await screen.findByText('deliveredOn')).toBeInTheDocument();
  });

  it('hides the delivery estimate for a cancelled order', async () => {
    setup({ orders: [order({ status: 'CANCELLED' })] });
    await screen.findAllByText('#aaaaaaaa');
    expect(screen.queryByText('estimatedDelivery')).not.toBeInTheDocument();
    expect(screen.queryByText('deliveredOn')).not.toBeInTheDocument();
  });
});