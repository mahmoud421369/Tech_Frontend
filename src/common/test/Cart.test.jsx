/**
 * Jest + React Testing Library tests for Cart.jsx (Create React App).
 * Location: src/common/test/Cart.test.jsx   (Cart.jsx is assumed to be in src/User/)
 *
 * Needs nothing extra beyond the Account test setup:
 *   @testing-library/dom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom
 *
 * Run:  npm test -- src/common/test/Cart.test.jsx
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api/api';
import { useOrderPayment, savePending, clearPending, loadPending } from '../utils/paymentStatus';
import Cart, { queryClient } from '../../User/Cart';

/* ───────── mocks: nothing here talks to a real backend, gateway or popup library ───────── */

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('jwt-decode', () => ({ jwtDecode: () => ({ exp: Math.floor(Date.now() / 1000) + 3600 }) }));
jest.mock('../utils/useAppLanguage', () => ({ useAppLanguage: () => 'en', languageDirection: () => 'ltr' }));
jest.mock('../utils/paymentStatus', () => ({
  useOrderPayment: jest.fn(),
  savePending: jest.fn(),
  clearPending: jest.fn(),
  loadPending: jest.fn(),
}));
/* the cart loads sweetalert2 with a dynamic import() for its toasts: fake it so we can check what was shown */
jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

/* ───────── fake data ───────── */

const ITEMS = [
  { id: 'i1', productName: 'iPhone Case', productPrice: 100, quantity: 2, productImageUrl: '' },
  { id: 'i2', productName: 'Fast Charger', productPrice: 50, quantity: 1, productImageUrl: '' },
];
const ADDRESS = { id: 'addr-1', street: 'Street 9', city: 'Nasr City' };
const PAY_URL = 'https://pay.example.com/checkout/abc';

/* ───────── helpers ───────── */

function setup({ items = ITEMS, addresses = [ADDRESS], show = true } = {}) {
  api.get.mockImplementation(async (path) => {
    if (path === '/api/cart') return { data: { items } };
    if (path === '/api/users/addresses') return { data: { content: addresses } };
    return { data: {} };
  });
  const user = userEvent.setup();
  const onClose = jest.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Cart show={show} onClose={onClose} darkMode={false} />
    </MemoryRouter>,
  );
  return { user, onClose };
}

/* Opens the checkout step and waits for the Place order button. */
const goToCheckout = async (user) => {
  await user.click(await screen.findByRole('button', { name: /checkout/i }));
  return screen.findByRole('button', { name: /place order/i });
};

/* Picks Cash on delivery (first radio) or Card (second radio). */
const choosePayment = async (user, which) => {
  const radios = await screen.findAllByRole('radio');
  await user.click(radios[which === 'card' ? 1 : 0]);
};

const toastShown = (matcher) => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining(matcher));

beforeEach(() => {
  /* CRA resets mock implementations before every test, so set the defaults here */
  jest.resetAllMocks();
  api.put.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
  api.post.mockResolvedValue({ data: {} });
  Swal.fire.mockResolvedValue({});
  loadPending.mockReturnValue(null);
  useOrderPayment.mockReturnValue({ data: undefined, refetch: jest.fn() });

  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
});

/* ───────── tests ───────── */

describe('Cart drawer: basics', () => {
  it('renders nothing when closed', () => {
    setup({ show: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the cart items', async () => {
    setup();
    expect(await screen.findByText('iPhone Case')).toBeInTheDocument();
    expect(screen.getByText('Fast Charger')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
  });

  it('shows the empty state without a checkout button when the cart is empty', async () => {
    setup({ items: [] });
    await screen.findByRole('dialog');
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/cart', expect.anything()));
    expect(screen.queryByText('iPhone Case')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });

  it('does not call the API when the user is not logged in', async () => {
    localStorage.clear();
    setup();
    await screen.findByRole('dialog');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', async () => {
    const { user, onClose } = setup();
    await user.click(await screen.findByRole('button', { name: /close cart/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Cart drawer: changing items', () => {
  it('increases a quantity', async () => {
    const { user } = setup();
    await screen.findByText('iPhone Case');
    await user.click(screen.getAllByRole('button', { name: /increase/i })[0]);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/cart/items/i1', { quantity: 3 }, expect.anything()));
  });

  it('removes an item when its quantity is decreased below 1', async () => {
    const { user } = setup();
    await screen.findByText('Fast Charger');
    await user.click(screen.getAllByRole('button', { name: /decrease/i })[1]); /* Fast Charger has quantity 1 */
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/cart/items/i2', expect.anything()));
    expect(api.put).not.toHaveBeenCalled();
  });

  it('removes an item with the remove button', async () => {
    const { user } = setup();
    await screen.findByText('iPhone Case');
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]);
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/cart/items/i1', expect.anything()));
  });

  it('sends only one request when a quantity button is double-clicked', async () => {
    api.put.mockReturnValue(new Promise(() => {})); /* never answers, so the first request stays "in flight" */
    const { user } = setup();
    await screen.findByText('iPhone Case');
    const plus = screen.getAllByRole('button', { name: /increase/i })[0];
    await user.click(plus);
    await user.click(plus);
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
  });

  it('clears the whole cart', async () => {
    const { user } = setup();
    await screen.findByText('iPhone Case');
    await user.click(screen.getByRole('button', { name: /clear cart/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/cart', expect.anything()));
  });

  it('shows the stock message and keeps going when the quantity update is rejected', async () => {
    api.put.mockRejectedValue({ response: { status: 409, data: { message: 'Only 3 left in stock' } } });
    const { user } = setup();
    await screen.findByText('iPhone Case');
    await user.click(screen.getAllByRole('button', { name: /increase/i })[0]);
    await waitFor(() => toastShown({ icon: 'error', title: 'Only 3 left in stock' }));
  });
});

describe('Checkout step', () => {
  it('keeps Place order disabled until a payment method is chosen', async () => {
    const { user } = setup();
    const place = await goToCheckout(user);
    expect(screen.getByText(/Street 9, Nasr City/)).toBeInTheDocument(); /* first address is preselected */
    expect(place).toBeDisabled();
    await choosePayment(user, 'cash');
    expect(screen.getByRole('button', { name: /place order/i })).toBeEnabled();
  });

  it('places a cash order with the right request and confirms it', async () => {
    api.post.mockResolvedValue({ data: { id: 'order-123' } });
    const { user } = setup();
    await goToCheckout(user);
    await choosePayment(user, 'cash');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/api/users/orders',
      { deliveryAddressId: 'addr-1', paymentMethod: 'CASH' },
      expect.anything(),
    ));
    await waitFor(() => toastShown({ toast: true, icon: 'success' }));
    expect(savePending).not.toHaveBeenCalled(); /* cash orders never wait for a payment */
  });

  it('places a card order, saves it as pending and redirects to the payment page', async () => {
    api.post.mockImplementation(async (path) => {
      if (path === '/api/users/orders') return { data: { id: 'order-123' } };
      if (path.startsWith('/api/payments/order/card/')) return { data: { paymentURL: PAY_URL } };
      return { data: {} };
    });
    const realLocation = window.location;
    delete window.location;
    window.location = { ...realLocation, assign: jest.fn() };

    try {
      const { user } = setup();
      await goToCheckout(user);
      await choosePayment(user, 'card');
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => expect(api.post).toHaveBeenCalledWith(
        '/api/users/orders',
        { deliveryAddressId: 'addr-1', paymentMethod: 'CREDIT_CARD' },
        expect.anything(),
      ));
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/payments/order/card/order-123', {}, expect.anything()));
      await waitFor(() => expect(savePending).toHaveBeenCalledWith({ orderId: 'order-123', url: PAY_URL }));
      await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith(PAY_URL));
    } finally {
      window.location = realLocation;
    }
  });
});

describe('Pending card payment', () => {
  const PENDING = { orderId: 'order-9', url: 'https://pay.example.com/p' };

  it('restores the "complete your payment" step after a refresh', async () => {
    loadPending.mockReturnValue(PENDING);
    setup();
    expect(await screen.findByText(/#order-9/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open payment page/i })).toBeInTheDocument();
  });

  it('confirms the order once the backend reports the payment as paid', async () => {
    loadPending.mockReturnValue(PENDING);
    useOrderPayment.mockReturnValue({ data: 'paid', refetch: jest.fn() });
    setup();
    await waitFor(() => expect(clearPending).toHaveBeenCalled());
    await waitFor(() => toastShown({ toast: true, icon: 'success' }));
  });
});