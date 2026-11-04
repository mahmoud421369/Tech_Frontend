import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './common/api/api';
import queryClient from './common/utils/queryClient';
import { Footer, Navbar, AssignerHeader, DeliveryHeader, DashboardSkeleton, TableSkeleton, ProfileSkeleton } from './components';
import useAuthStore from './common/store/Auth';
import { redirectFor, canAccessArea, parseAccessToken } from './common/utils/authSession';

const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const loadAuth = () => import('./Auth');
const loadUser = () => import('./User');
const loadAdmin = () => import('./Admin');
const loadShop = () => import('./Shop');
const loadAssigner = () => import('./Assigner');

const Login = lazyNamed(loadAuth, 'Login');
const Signup = lazyNamed(loadAuth, 'Signup');
const SuccessGoogle = lazyNamed(loadAuth, 'SuccessGoogle');
const ShopSignup = lazy(() => import('./Auth/shop/ShopSignup'));
const DeliverySignup = lazy(() => import('./Auth/delivery/DeliverySignup'));
const AssignerSignup = lazy(() => import('./Auth/assigner/AssignerSignup'));

const Homepage = lazyNamed(loadUser, 'Homepage');
const Devices = lazyNamed(loadUser, 'Devices');
const Stores = lazyNamed(loadUser, 'Stores');
const Track = lazyNamed(loadUser, 'Track');
const Account = lazyNamed(loadUser, 'Account');
const Cart = lazyNamed(loadUser, 'Cart');
const Repair = lazyNamed(loadUser, 'Repair');
const Offers = lazyNamed(loadUser, 'Offers');
const DeviceDetail = lazyNamed(loadUser, 'DeviceDetail');
const CategoryProducts = lazyNamed(loadUser, 'CategoryProducts');
const MyOrders = lazyNamed(loadUser, 'MyOrders');

const Shop = lazy(() => import('./User/Shop'));

const AdminHeader = lazyNamed(loadAdmin, 'Header');
const Shops = lazyNamed(loadAdmin, 'Shops');
const Users = lazyNamed(loadAdmin, 'Users');
const Reviews = lazyNamed(loadAdmin, 'Reviews');
const Category = lazyNamed(loadAdmin, 'Category');
const Deliveries = lazyNamed(loadAdmin, 'Deliveries');
const Assigners = lazyNamed(loadAdmin, 'Assigners');
const AdminOffers = lazyNamed(loadAdmin, 'AdminOffers');
const AdminRepairRequests = lazyNamed(loadAdmin, 'AdminRepairRequests');
const AdminProducts = lazyNamed(loadAdmin, 'AdminProducts');
const AdminAssignmentLogs = lazyNamed(loadAdmin, 'AdminAssignmentLogs');
const AdminSubscriptions = lazyNamed(loadAdmin, 'AdminSubscriptions');
const AdminTransactions = lazyNamed(loadAdmin, 'AdminTransactions');
const AdminDashboard = lazy(() => import('./Admin/Dashboard'));

const ShopHeader = lazyNamed(loadShop, 'ShopHeader');
const ShopDashboard = lazyNamed(loadShop, 'ShopDashboard');
const RepairRequests = lazyNamed(loadShop, 'RepairRequests');
const Products = lazyNamed(loadShop, 'Products');
const Transactions = lazyNamed(loadShop, 'Transactions');
const ShopOffers = lazyNamed(loadShop, 'ShopOffers');
const ShopProfile = lazyNamed(loadShop, 'ShopProfile');
const Inventory = lazyNamed(loadShop, 'Inventory');
const Orders = lazyNamed(loadShop, 'Orders');
const Subscriptions = lazyNamed(loadShop, 'Subscriptions');
const ShopChatModal = lazy(() => import('./components/shop/ShopChatModal'));
const ShopReports = lazy(() => import('./Shop/ShopReports'));
const ShopReviews = lazy(() => import('./Shop/ShopReviews'));

const AssignerDashboard = lazyNamed(loadAssigner, 'AssignerDashboard');
const DeliveryPersons = lazyNamed(loadAssigner, 'DeliveryPersons');
const AssignerProfile = lazyNamed(loadAssigner, 'AssignerProfile');
const AssignedOrders = lazyNamed(loadAssigner, 'AssignedOrders');
const AssignedRepairs = lazyNamed(loadAssigner, 'AssignedRepairs');
const AssignmentLogs = lazyNamed(loadAssigner, 'AssignmentLogs');
const ReassignRepairs = lazyNamed(loadAssigner, 'ReassignRepairs');
const ReassignOrders = lazyNamed(loadAssigner, 'ReassignOrders');
const OrdersForAssignment = lazyNamed(loadAssigner, 'OrdersForAssignment');
const RepairsForAssignment = lazyNamed(loadAssigner, 'RepairsForAssignment');

const DeliveryDashboard = lazy(() => import('./Delivery/DeliveryDashboard'));
const DeliveryProfile = lazy(() => import('./Delivery/DeliveryProfile'));
const AvailableOrders = lazy(() => import('./Delivery/AvailableOrders'));
const AvailableRepairs = lazy(() => import('./Delivery/AvailableRepairs'));
const MyDeliveries = lazy(() => import('./Delivery/MyDeliveries'));
const MyRepairs = lazy(() => import('./Delivery/MyRepairs'));

const SHOP_HOST = 'shop.tech-restore.tech';
const ROOT_DOMAIN = 'tech-restore.tech';
const SHOP_SIGNUP_URL = `https://${SHOP_HOST}/signup/shop`;
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isShopHost = hostname === SHOP_HOST;
const isProdHost = hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`);

const DARK_KEY = 'darkMode';
const STAFF_AREAS = ['admin', 'shop', 'assigner', 'delivery'];

const readDarkMode = () => {
  try {
    const stored = window.localStorage.getItem(DARK_KEY);
    if (stored === 'true' || stored === 'false') return stored === 'true';
  } catch { }
  return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
};

const cartKeyFor = (userId) => ['cartItems', userId ?? 'anon'];

const countCartItems = (items) =>
  Array.isArray(items)
    ? items.reduce((sum, i) => sum + Math.max(0, Math.trunc(Number(i?.quantity)) || 0), 0)
    : 0;

const useCartCount = () => {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const key = useMemo(() => cartKeyFor(userId), [userId]);
  const enabled = !!token;

  const { data = 0 } = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await api.get('/api/cart', { signal })).data.items || [],
    select: countCartItems,
    enabled,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    retry: (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status),
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const refresh = () => qc.invalidateQueries({ queryKey: key });
    window.addEventListener('cart:updated', refresh);
    return () => window.removeEventListener('cart:updated', refresh);
  }, [enabled, qc, key]);

  return enabled ? data : 0;
};

const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(readDarkMode);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.style.colorScheme = darkMode ? 'dark' : 'light';
    try { window.localStorage.setItem(DARK_KEY, darkMode ? 'true' : 'false'); } catch { }
  }, [darkMode]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === DARK_KEY && (e.newValue === 'true' || e.newValue === 'false')) setDarkMode(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);
  return [darkMode, toggleDarkMode];
};

const useRoles = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeRoles = useAuthStore((s) => s.roles);
  return useMemo(() => {
    if (!accessToken) return [];
    if (storeRoles?.length) return storeRoles;
    return parseAccessToken(accessToken, { checkExpiry: false })?.roles || [];
  }, [accessToken, storeRoles]);
};

const ExternalRedirect = ({ to }) => {
  useEffect(() => { window.location.replace(to); }, [to]);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const PageSkeleton = memo(({ darkMode }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading"
    className={`min-h-screen px-4 pb-24 pt-28 sm:px-6 md:pb-14 md:pt-32 ${darkMode ? 'bg-[#141414]' : 'bg-gray-50'}`}
  >
    <div className="mx-auto max-w-6xl space-y-4">
      <div className={`h-12 w-60 animate-pulse rounded-xl motion-reduce:animate-none ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-28 animate-pulse rounded-2xl motion-reduce:animate-none ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
      ))}
    </div>
  </div>
));

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
};

const RoleGuard = ({ area }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const roles = useRoles();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (canAccessArea(roles, area)) return <Outlet />;
  return <Navigate to={redirectFor(roles, '/')} replace />;
};

const UserAreaGuard = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const roles = useRoles();

  if (accessToken && roles.length && STAFF_AREAS.some((area) => canAccessArea(roles, area))) {
    return <Navigate to={redirectFor(roles, '/')} replace />;
  }
  return <Outlet />;
};

const DashboardRedirect = () => {
  const roles = useRoles();
  return <Navigate to={redirectFor(roles, '/')} replace />;
};

const NavbarLayout = memo(({ darkMode, toggleDarkMode, cartCount }) => (
  <>
    <Navbar cartCount={cartCount} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    <Suspense fallback={<PageSkeleton darkMode={darkMode} />}>
      <Outlet />
    </Suspense>
    <Footer darkMode={darkMode} />
  </>
));

const AdminLayout = memo(({ darkMode, toggleDarkMode }) => (
  <>
    <Suspense fallback={null}>
      <AdminHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </Suspense>
    <Suspense fallback={<DashboardSkeleton />}>
      <Outlet />
    </Suspense>
  </>
));

const AssignerLayout = memo(({ darkMode, toggleDarkMode }) => (
  <>
    <AssignerHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    <Suspense fallback={<DashboardSkeleton />}>
      <Outlet />
    </Suspense>
  </>
));

const DeliveryLayout = memo(({ darkMode, toggleDarkMode }) => (
  <>
    <DeliveryHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
    <Outlet />
  </>
));

const ShopLayout = memo(({ darkMode, toggleDarkMode }) => (
  <>
    <Suspense fallback={null}>
      <ShopHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </Suspense>
    <Suspense fallback={<DashboardSkeleton />}>
      <Outlet />
    </Suspense>
  </>
));

function App() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const cartCount = useCartCount();

  useEffect(() => {
    const warm = () => { loadUser().catch(() => {}); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 1500);
    return () => clearTimeout(id);
  }, []);

  const addToCart = useCallback(() => { window.dispatchEvent(new Event('cart:updated')); }, []);
  const cartProps = useMemo(() => ({ addToCart }), [addToCart]);

  const page = (Component, extra) => <Component darkMode={darkMode} {...extra} />;
  const standalone = (Component, extra) => (
    <Suspense fallback={<PageSkeleton darkMode={darkMode} />}>{page(Component, extra)}</Suspense>
  );
  const withFallback = (Component, fallback) => <Suspense fallback={fallback}>{page(Component)}</Suspense>;

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<UserAreaGuard />}>
          <Route element={<NavbarLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} cartCount={cartCount} />}>
            <Route path="/" element={isShopHost ? <Navigate to="/signup/shop" replace /> : page(Homepage, cartProps)} />
            <Route path="/devices" element={page(Devices)} />
            <Route path="/shops" element={page(Stores)} />
            <Route path="/track" element={page(Track)} />
            <Route path="/account" element={page(Account)} />
            <Route path="/orders" element={<ProtectedRoute>{page(MyOrders)}</ProtectedRoute>} />
            <Route path="/my-orders" element={<Navigate to="/orders" replace />} />

            <Route path="/cart" element={<ProtectedRoute>{page(Cart)}</ProtectedRoute>} />
            <Route path="/repair" element={page(Repair)} />
            <Route path="/offers" element={page(Offers)} />
            <Route path="/device/:id" element={page(DeviceDetail, cartProps)} />
            <Route path="/shops/:shopId" element={page(Shop, cartProps)} />
          </Route>
          <Route path="/products/category/:categoryId" element={standalone(CategoryProducts, { toggleDarkMode })} />
        </Route>

        <Route path="/login" element={standalone(Login)} />
        <Route path="/signup" element={standalone(Signup)} />
        <Route path="/signup/shop" element={isShopHost || !isProdHost ? standalone(ShopSignup) : <ExternalRedirect to={SHOP_SIGNUP_URL} />} />
        <Route path="/signup/delivery" element={standalone(DeliverySignup)} />
        <Route path="/signup/assigner" element={standalone(AssignerSignup)} />
        <Route path="/oauth2/success" element={standalone(SuccessGoogle)} />

        <Route path="/admin" element={<RoleGuard area="admin" />}>
          <Route element={<AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={page(AdminDashboard)} />
            <Route path="shops" element={page(Shops)} />
            <Route path="subscriptions" element={page(AdminSubscriptions)} />
            <Route path="transactions" element={page(AdminTransactions)} />
            <Route path="users" element={page(Users)} />
            <Route path="offers" element={page(AdminOffers)} />
            <Route path="category" element={page(Category)} />
            <Route path="deliveries" element={page(Deliveries)} />
            <Route path="assigners" element={page(Assigners)} />
            <Route path="reviews" element={page(Reviews)} />
            <Route path="repair-requests" element={page(AdminRepairRequests)} />
            <Route path="products" element={page(AdminProducts)} />
            <Route path="assignment-logs" element={page(AdminAssignmentLogs)} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/assigner" element={<RoleGuard area="assigner" />}>
          <Route element={<AssignerLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
            <Route index element={<Navigate to="/assigner/dashboard" replace />} />
            <Route path="dashboard" element={page(AssignerDashboard)} />
            <Route path="profile" element={page(AssignerProfile)} />
            <Route path="delivery" element={page(DeliveryPersons)} />
            <Route path="orders" element={page(OrdersForAssignment)} />
            <Route path="repair-requests" element={page(RepairsForAssignment)} />
            <Route path="assignment-logs" element={page(AssignmentLogs)} />
            <Route path="assigned-orders" element={page(AssignedOrders)} />
            <Route path="assigned-repairs" element={page(AssignedRepairs)} />
            <Route path="reassign-repairs" element={page(ReassignRepairs)} />
            <Route path="reassign-orders" element={page(ReassignOrders)} />
            <Route path="*" element={<Navigate to="/assigner/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/delivery" element={<RoleGuard area="delivery" />}>
          <Route element={<DeliveryLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
            <Route index element={<Navigate to="/delivery/dashboard" replace />} />
            <Route path="dashboard" element={withFallback(DeliveryDashboard, <DashboardSkeleton />)} />
            <Route path="profile" element={withFallback(DeliveryProfile, <ProfileSkeleton />)} />
            <Route path="available-orders" element={withFallback(AvailableOrders, <TableSkeleton title="Orders" />)} />
            <Route path="available-repair-requests" element={withFallback(AvailableRepairs, <TableSkeleton title="Repairs" />)} />
            <Route path="my-deliveries" element={withFallback(MyDeliveries, <TableSkeleton title="Deliveries" />)} />
            <Route path="my-repairs" element={withFallback(MyRepairs, <TableSkeleton title="Repairs" />)} />
            <Route path="*" element={<Navigate to="/delivery/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/shop" element={<RoleGuard area="shop" />}>
          <Route element={<ShopLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
            <Route index element={<Navigate to="/shop/dashboard" replace />} />
            <Route path="dashboard" element={page(ShopDashboard)} />
            <Route path="reports" element={page(ShopReports)} />
            <Route path="reviews" element={page(ShopReviews)} />
            <Route path="chats" element={page(ShopChatModal)} />
            <Route path="transactions" element={page(Transactions)} />
            <Route path="repair-requests" element={page(RepairRequests)} />
            <Route path="devices" element={page(Products)} />
            <Route path="offers" element={page(ShopOffers)} />
            <Route path="subscriptions" element={page(Subscriptions)} />
            <Route path="orders" element={page(Orders)} />
            <Route path="profile" element={page(ShopProfile)} />
            <Route path="inventory" element={page(Inventory)} />
            <Route path="*" element={<Navigate to="/shop/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}