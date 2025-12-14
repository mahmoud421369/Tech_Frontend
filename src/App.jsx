import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Footer, Navbar, RepairDetailsModal, ServiceModal, AssignerHeader, Modal, DeliveryHeader } from './components';
import { Login, Signup, LoginSuccess, SuccessGoogle } from './Auth';
import { Repair, Explore, Track, Account, Homepage, Cart, DeviceDetail, Offers, RepairRequest, Devices, Stores } from './User';
import { Header, Shops, Users, Reviews, Category, Deliveries, Assigners, AdminOffers, AdminRepairRequests, AdminProducts, AdminAssignmentLogs, AdminSubscriptions, AdminTransactions } from './Admin';
import  Dashboard  from './Admin/Dashboard';
import { AssignerDashboard, DeliveryPersons, AssignerProfile, AssignedOrders, AssignedRepairs, AssignmentLogs, ReassignRepairs, ReassignOrders, OrdersForAssignment, RepairsForAssignment } from './Assigner';
import { DeliveryDashboard, DeliveryProfile, MyDeliveries, MyRepairs, AvailableOrders, AvailableRepairs } from './Delivery';
import { ShopHeader, ShopDashboard, RepairRequests, Products, Transactions, Support, ShopOffers, ShopProfile, ShopSettings, Inventory, Chat, Orders, ShopNotifications, Subscriptions } from './Shop';
import { useAuth } from './context/AuthContext';
import Shop from './User/Shop';

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activePage, setActivePage] = useState('admin-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cartCount, setCartCount] = useState(0); // Restore cartCount state
  const { currentUser } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Sync cartCount with cartItems.length as a fallback
  useEffect(() => {
    setCartCount(cartItems.length);
  }, [cartItems]);

  const toggleDarkMode = () => setDarkMode(!darkMode);


  const addToCart = (product) => {
    setCartItems((prev = []) => { // Fallback to empty array
      const existingItem = prev.find((item) => item.productId === product.id);
      if (existingItem) {
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
  };

  const updateCartCount = (items) => {
    setCartItems(items || []); // Ensure items is always an array
  };
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

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

  const withDeliveryLayout = (Component) => (
    <>
      <DeliveryHeader darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
      <Component darkMode={darkMode} />
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
          onCartClick={() => setShowCart(true)}
          addToCart={addToCart}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode((prev) => !prev)}
          updateCartCount={updateCartCount}
        />
      <Component darkMode={darkMode} {...extraProps} />
      <Footer darkMode={darkMode} />
    </>
  );

  const ProtectedRoute = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={withNavbarLayout(Homepage, { addToCart })} />
        <Route path="/login" element={<Login darkMode={darkMode} />} />
        <Route path="/signup" element={<Signup darkMode={darkMode} />} />
        <Route path="/explore" element={withNavbarLayout(Explore)} />
        <Route path="/devices" element={withNavbarLayout(Devices)} />
        <Route path="/shops" element={withNavbarLayout(Stores)} />
        <Route path="/track" element={withNavbarLayout(Track)} />
        <Route path="/account" element={withNavbarLayout(Account)} />
        <Route path="/repair" element={withNavbarLayout(Repair)} />
        <Route path="/offers" element={withNavbarLayout(Offers)} />
        <Route path="/device/:id" element={withNavbarLayout(DeviceDetail, { addToCart })} />
        <Route path="/shops/:shopId" element={withNavbarLayout(Shop)} />
        <Route path="/repair-request/:requestId/update" element={withNavbarLayout(RepairRequest)} />
        <Route path="/oauth2/success" element={<SuccessGoogle />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={withAdminLayout(Dashboard)} />
        <Route path="/repair-shops" element={withAdminLayout(Shops)} />
        <Route path="/shop/subscriptions" element={withAdminLayout(AdminSubscriptions)} />
        <Route path="/admin/transactions" element={withAdminLayout(AdminTransactions)} />
        <Route path="/users" element={withAdminLayout(Users)} />
        <Route path="/admin/offers" element={withAdminLayout(AdminOffers)} />
        <Route path="/category" element={withAdminLayout(Category)} />
        <Route path="/deliveries" element={withAdminLayout(Deliveries)} />
        <Route path="/assigners" element={withAdminLayout(Assigners)} />
        <Route path="/reviews" element={withAdminLayout(Reviews)} />
        <Route path="/admin/repair-requests" element={withAdminLayout(AdminRepairRequests)} />
        <Route path="/admin/products" element={withAdminLayout(AdminProducts)} />
        <Route path="/admin/assignment-logs" element={withAdminLayout(AdminAssignmentLogs)} />
     

        {/* Assigner Routes */}
        <Route path="/assigner-dashboard" element={withAssignerLayout(AssignerDashboard)} />
        <Route path="/assigner/profile" element={withAssignerLayout(AssignerProfile)} />
        <Route path="/assigner/delivery-persons" element={withAssignerLayout(DeliveryPersons)} />
        <Route path="/assigner/orders" element={withAssignerLayout(OrdersForAssignment)} />
        <Route path="/assigner/repair-requests" element={withAssignerLayout(RepairsForAssignment)} />
        <Route path="/assigner/assignment-logs" element={withAssignerLayout(AssignmentLogs)} />
        <Route path="/assigner/assigned-orders" element={withAssignerLayout(AssignedOrders)} />
        <Route path="/assigner/assigned-repairs" element={withAssignerLayout(AssignedRepairs)} />
        <Route path="/assigner/reassign-repairs" element={withAssignerLayout(ReassignRepairs)} />
        <Route path="/assigner/reassign-orders" element={withAssignerLayout(ReassignOrders)} />
        {/* Delivery Routes */}
        <Route path="/delivery-dashboard" element={withDeliveryLayout(DeliveryDashboard)} />
        <Route path="/delivery/profile" element={withDeliveryLayout(DeliveryProfile)} />
        <Route path="/delivery/available-orders" element={withDeliveryLayout(AvailableOrders)} />
        <Route path="/delivery/available-repair-requests" element={withDeliveryLayout(AvailableRepairs)} />
        <Route path="/delivery/my-deliveries" element={withDeliveryLayout(MyDeliveries)} />
        <Route path="/delivery/my-repairs" element={withDeliveryLayout(MyRepairs)} />
        
        {/* Shop Routes */}
        <Route path="/shop-dashboard" element={withShopLayout(ShopDashboard)} />
        <Route path="/support" element={withShopLayout(Chat)} />
        <Route path="/shop/transactions" element={withShopLayout(Transactions)} />
        <Route path="/repair/requests" element={withShopLayout(RepairRequests)} />
        <Route path="/shop/devices" element={withShopLayout(Products)} />
        <Route path="/shop/offers" element={withShopLayout(ShopOffers)} />
        <Route path="/subscriptions" element={withShopLayout(Subscriptions)} />
        <Route path="/shop/orders" element={withShopLayout(Orders)} />
        <Route path="/shop/profile" element={withShopLayout(ShopProfile)} />
        <Route path="/shop/inventory" element={withShopLayout(Inventory)} />
        <Route path="/shop/notifications" element={withShopLayout(ShopNotifications)} />
        <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
      </Routes>
    <Cart
          show={showCart}
          onClose={() => setShowCart(false)}
          darkMode={darkMode}
          cartItems={cartItems}
          setCartItems={setCartItems}
          updateCartCount={updateCartCount}
        />
    </Router>
  );
}

export default App;