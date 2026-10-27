import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Footer, Navbar, AssignerHeader, DeliveryHeader, DashboardSkeleton, TableSkeleton, ProfileSkeleton } from './components';
import { Login, Signup, SuccessGoogle } from './Auth';
import Shop from './User/Shop';
import { Repair, Track, Account, Homepage, Cart, DeviceDetail, Offers, Devices, Stores, CategoryProducts } from './User';
import { Header, Shops, Users, Reviews, Category, Deliveries, Assigners, AdminOffers, AdminRepairRequests, AdminProducts, AdminAssignmentLogs, AdminSubscriptions, AdminTransactions } from './Admin';
import Dashboard from './Admin/Dashboard';
import { ShopHeader, ShopDashboard, RepairRequests, Products, Transactions, ShopOffers, ShopProfile, Inventory, Chat, Orders, Subscriptions } from './Shop';
import { AssignerDashboard, DeliveryPersons, AssignerProfile, AssignedOrders, AssignedRepairs, AssignmentLogs, ReassignRepairs, ReassignOrders, OrdersForAssignment, RepairsForAssignment } from './Assigner';
import useAuthStore from './common/store/Auth';
import { redirectFor, canAccessArea, parseAccessToken } from './common/utils/authSession';
import ShopChatModal from './components/shop/ShopChatModal';

const DeliveryDashboard = React.lazy(() => import('./Delivery/DeliveryDashboard'));
const DeliveryProfile = React.lazy(() => import('./Delivery/DeliveryProfile'));
const AvailableOrders = React.lazy(() => import('./Delivery/AvailableOrders'));
const AvailableRepairs = React.lazy(() => import('./Delivery/AvailableRepairs'));
const MyDeliveries = React.lazy(() => import('./Delivery/MyDeliveries'));
const MyRepairs = React.lazy(() => import('./Delivery/MyRepairs'));


const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
};


const RoleGuard = ({ area }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeRoles = useAuthStore((s) => s.roles);

  if (!accessToken) return <Navigate to="/login" replace />;


  const roles = storeRoles?.length
    ? storeRoles
    : parseAccessToken(accessToken, { checkExpiry: false })?.roles || [];

  if (canAccessArea(roles, area)) return <Outlet />;

  return <Navigate to={redirectFor(roles, '/')} replace />;
};


const AreaFallback = ({ to }) => <Navigate to={to} replace />;


const DashboardRedirect = () => {
  const roles = useAuthStore((s) => s.roles);
  return <Navigate to={redirectFor(roles, '/')} replace />;
};

const readDarkMode = () => {
  try { return window.localStorage.getItem('darkMode') === 'true'; } catch { return false; }
};

function App() {
  const [darkMode, setDarkMode] = useState(readDarkMode);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { window.localStorage.setItem('darkMode', darkMode ? 'true' : 'false'); } catch { }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);
  const openCart = useCallback(() => setShowCart(true), []);
  const closeCart = useCallback(() => setShowCart(false), []);

  const addToCart = useCallback((product) => {
    setCartItems((prev = []) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
      }];
    });
  }, []);

  const updateCartCount = useCallback((items) => setCartItems(items || []), []);


  const withAdminLayout = (Component) => (
    <>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component darkMode={darkMode} />
    </>
  );

  const withAssignerLayout = (Component) => (
    <>
      <AssignerHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component darkMode={darkMode} />
    </>
  );

  const withDeliveryLayout = (Component, Fallback = null) => (
    <>
      <DeliveryHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      {Fallback ? (
        <Suspense fallback={Fallback}>
          <Component darkMode={darkMode} />
        </Suspense>
      ) : (
        <Component darkMode={darkMode} />
      )}
    </>
  );

  const withShopLayout = (Component) => (
    <>
      <ShopHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component darkMode={darkMode} />
    </>
  );

  const withNavbarLayout = (Component, extraProps = {}) => (
    <>
      <Navbar
        cartItems={cartItems}
        setCartItems={setCartItems}
        onCartClick={openCart}
        addToCart={addToCart}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        updateCartCount={updateCartCount}
      />
      <Component darkMode={darkMode} {...extraProps} />
      <Footer darkMode={darkMode} />
    </>
  );


  const cartProps = useMemo(() => ({ addToCart }), [addToCart]);

  return (
    <Router>
      <Routes>

    
        <Route path="/" element={withNavbarLayout(Homepage, cartProps)} />
        <Route path="/login" element={<Login darkMode={darkMode} />} />
        <Route path="/signup" element={<Signup darkMode={darkMode} />} />
        <Route path="/devices" element={withNavbarLayout(Devices)} />
        <Route path="/shops" element={withNavbarLayout(Stores)} />
        <Route path="/track" element={withNavbarLayout(Track)} />
        <Route path="/account" element={withNavbarLayout(Account)} />
        <Route path="/cart" element={withNavbarLayout(Cart)} />
        <Route path="/repair" element={withNavbarLayout(Repair)} />
        <Route path="/offers" element={withNavbarLayout(Offers)} />
        <Route path="/device/:id" element={withNavbarLayout(DeviceDetail, cartProps)} />
        <Route path="/shops/:shopId" element={withNavbarLayout(Shop, cartProps)} />
        <Route path="/products/category/:categoryId" element={<CategoryProducts darkMode={darkMode} />} />
        <Route path="/oauth2/success" element={<SuccessGoogle />} />

       
        <Route path="/admin" element={<RoleGuard area="admin" />}>
          <Route index element={<AreaFallback to="/admin/dashboard" />} />
          <Route path="dashboard" element={withAdminLayout(Dashboard)} />
          <Route path="shops" element={withAdminLayout(Shops)} />
          <Route path="subscriptions" element={withAdminLayout(AdminSubscriptions)} />
          <Route path="transactions" element={withAdminLayout(AdminTransactions)} />
          <Route path="users" element={withAdminLayout(Users)} />
          <Route path="offers" element={withAdminLayout(AdminOffers)} />
          <Route path="category" element={withAdminLayout(Category)} />
          <Route path="deliveries" element={withAdminLayout(Deliveries)} />
          <Route path="assigners" element={withAdminLayout(Assigners)} />
          <Route path="reviews" element={withAdminLayout(Reviews)} />
          <Route path="repair-requests" element={withAdminLayout(AdminRepairRequests)} />
          <Route path="products" element={withAdminLayout(AdminProducts)} />
          <Route path="assignment-logs" element={withAdminLayout(AdminAssignmentLogs)} />
          <Route path="*" element={<AreaFallback to="/admin/dashboard" />} />
        </Route>

       
        <Route path="/assigner" element={<RoleGuard area="assigner" />}>
          <Route index element={<AreaFallback to="/assigner/dashboard" />} />
          <Route path="dashboard" element={withAssignerLayout(AssignerDashboard)} />
          <Route path="profile" element={withAssignerLayout(AssignerProfile)} />
          <Route path="delivery" element={withAssignerLayout(DeliveryPersons)} />
          <Route path="orders" element={withAssignerLayout(OrdersForAssignment)} />
          <Route path="repair-requests" element={withAssignerLayout(RepairsForAssignment)} />
          <Route path="assignment-logs" element={withAssignerLayout(AssignmentLogs)} />
          <Route path="assigned-orders" element={withAssignerLayout(AssignedOrders)} />
          <Route path="assigned-repairs" element={withAssignerLayout(AssignedRepairs)} />
          <Route path="reassign-repairs" element={withAssignerLayout(ReassignRepairs)} />
          <Route path="reassign-orders" element={withAssignerLayout(ReassignOrders)} />
          <Route path="*" element={<AreaFallback to="/assigner/dashboard" />} />
        </Route>

       
        <Route path="/delivery" element={<RoleGuard area="delivery" />}>
          <Route index element={<AreaFallback to="/delivery/dashboard" />} />
          <Route path="dashboard" element={withDeliveryLayout(DeliveryDashboard, <DashboardSkeleton />)} />
          <Route path="profile" element={withDeliveryLayout(DeliveryProfile, <ProfileSkeleton />)} />
          <Route path="available-orders" element={withDeliveryLayout(AvailableOrders, <TableSkeleton title="Orders" />)} />
          <Route path="available-repair-requests" element={withDeliveryLayout(AvailableRepairs, <TableSkeleton title="Repairs" />)} />
          <Route path="my-deliveries" element={withDeliveryLayout(MyDeliveries, <TableSkeleton title="Deliveries" />)} />
          <Route path="my-repairs" element={withDeliveryLayout(MyRepairs, <TableSkeleton title="Repairs" />)} />
          <Route path="*" element={<AreaFallback to="/delivery/dashboard" />} />
        </Route>

      
        <Route path="/shop" element={<RoleGuard area="shop" />}>
          <Route index element={<AreaFallback to="/shop/dashboard" />} />
          <Route path="dashboard" element={withShopLayout(ShopDashboard)} />
          <Route path="chats" element={withShopLayout(ShopChatModal)} />
          <Route path="transactions" element={withShopLayout(Transactions)} />
          <Route path="repair-requests" element={withShopLayout(RepairRequests)} />
          <Route path="devices" element={withShopLayout(Products)} />
          <Route path="offers" element={withShopLayout(ShopOffers)} />
          <Route path="subscriptions" element={withShopLayout(Subscriptions)} />
          <Route path="orders" element={withShopLayout(Orders)} />
          <Route path="profile" element={withShopLayout(ShopProfile)} />
          <Route path="inventory" element={withShopLayout(Inventory)} />
          <Route path="*" element={<AreaFallback to="/shop/dashboard" />} />
        </Route>

   
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
      </Routes>

      <Cart
        show={showCart}
        onClose={closeCart}
        darkMode={darkMode}
        cartItems={cartItems}
        setCartItems={setCartItems}
        updateCartCount={updateCartCount}
      />
    </Router>
  );
}

export default App;