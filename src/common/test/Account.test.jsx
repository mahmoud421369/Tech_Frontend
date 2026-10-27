
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/api';
import Account, { queryClient } from '../../User/Account';

/* ───────── mocks: replace everything that talks to the network or the outside world ───────── */

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('jwt-decode', () => ({ jwtDecode: () => ({ exp: Math.floor(Date.now() / 1000) + 3600 }) }));
jest.mock('../utils/useAppLanguage', () => ({ useAppLanguage: () => 'en', languageDirection: () => 'ltr' }));
jest.mock('../utils/paymentStatus', () => ({
  useRepairPayment: () => ({ data: undefined, refetch: jest.fn() }),
  savePending: jest.fn(),
  clearPending: jest.fn(),
  loadPending: () => null,
}));
jest.mock('../../components/user/Hero', () => ({ __esModule: true, default: () => null }));
jest.mock('../../User/AccountMap', () => ({ __esModule: true, default: () => null }));

/* ───────── fake data ───────── */

const PROFILE = { first_name: 'Ahmed', last_name: 'Ali', email: 'ahmed@test.com', phone: '+201001234567', activate: true };
const ADDRESS = { id: 'addr-1', state: 'Cairo', city: 'Nasr City', street: 'Street 9', building: '12', isDefault: true, latitude: 0, longitude: 0 };

/* ───────── helpers ───────── */

/* Fakes the backend: each endpoint returns the data we pass in, then renders the page. */
function setup({ orders = [], repairs = [] } = {}) {
  api.get.mockImplementation(async (path) => {
    if (path.endsWith('/profile')) return { data: PROFILE };
    if (path.endsWith('/addresses')) return { data: [ADDRESS] };
    if (path.endsWith('/orders')) return { data: orders };
    if (path.endsWith('/repair-request')) return { data: repairs };
    return { data: [] };
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Account />
    </MemoryRouter>,
  );
  return { user };
}

/* Clicks the "Addresses" tab and waits until the fake address is on screen. */
const openAddresses = async (user) => {
  await user.click((await screen.findAllByRole('button', { name: /^addresses/i }))[0]);
  await screen.findByText(/Street 9, 12/);
};

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear(); /* the query client is module-level, so reset it between tests */
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('authToken', 'test-token');
});

/* ───────── tests ───────── */

describe('Profile tab', () => {
  it('shows the user details', async () => {
    setup({ orders: [{ id: 'o1', status: 'PENDING' }] });
    /* the name, email and phone appear in several places (sidebar, header, detail cards), so use the *All* queries */
    expect((await screen.findAllByText('Ahmed Ali')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('ahmed@test.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+201001234567').length).toBeGreaterThan(0);
  });

  it('blocks saving an invalid phone number', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: /edit profile/i }));
    const phone = screen.getByDisplayValue('+201001234567');
    await user.clear(phone);
    await user.type(phone, '123');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid phone/i);
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe('Addresses tab: in-use locking', () => {
  it('locks an address used by an active order', async () => {
    const { user } = setup({ orders: [{ id: 'o1', status: 'SHIPPED', deliveryAddress: 'addr-1' }] });
    await openAddresses(user);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it.each(['DELIVERED', 'CANCELLED'])('releases an address when its order is %s', async (status) => {
    const { user } = setup({ orders: [{ id: 'o1', status, deliveryAddress: 'addr-1' }] });
    await openAddresses(user);
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  it('releases an address when its repair is DEVICE_DELIVERED', async () => {
    const { user } = setup({ repairs: [{ id: 'r1', status: 'DEVICE_DELIVERED', deliveryAddress: 'addr-1' }] });
    await openAddresses(user);
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  it('understands an address sent as an object', async () => {
    const { user } = setup({ orders: [{ id: 'o1', status: 'PENDING', deliveryAddress: { id: 'addr-1' } }] });
    await openAddresses(user);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('refetches orders when the tab opens', async () => {
    const { user } = setup();
    await screen.findAllByText('Ahmed Ali');
    const ordersCalls = () => api.get.mock.calls.filter(([p]) => p.endsWith('/orders')).length;
    const before = ordersCalls();
    await openAddresses(user);
    await waitFor(() => expect(ordersCalls()).toBeGreaterThan(before));
  });
});