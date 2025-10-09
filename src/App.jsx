import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import {
Footer,Navbar,RepairDetailsModal,ServiceModal,AssignerHeader,Modal,DeliveryHeader
}
from './components';

import{
  Login,Signup,LoginSuccess,
  SuccessGoogle
}
from './Auth';

import {
 Repair, Explore, Track, Account,
  Homepage, Cart, DeviceDetail,
  Offers,
  RepairRequest
} from './User'; 

import {
  Dashboard,Notifications, Header, Shops, Users,
  Reviews,
  Category,
  Deliveries,
  Assigners,
  AdminOffers,
  AdminRepairRequests,
  AdminProducts
} from './Admin';


import {
  AssignerDashboard, DeliveryPersons, AssignerProfile, AssignedOrders, AssignedRepairs, AssignmentLogs,
  ReassignRepairs, ReassignOrders, OrdersForAssignment, RepairsForAssignment,
} from './Assigner';


import {
  DeliveryDashboard, DeliveryProfile, MyDeliveries, MyRepairs, AvailableOrders, AvailableRepairs,

} from './Delivery';

import {
  ShopHeader, ShopDashboard, RepairRequests, Products,
  Transactions, Support, ShopOffers, ShopProfile,
  ShopSettings, Inventory,Chat, Orders,
  ShopNotifications
} from './Shop';

import { useAuth } from './context/AuthContext';
import { SupportRequests } from './Admin';
import Shop from './User/Shop';




function App() {

 const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    }
  }, []);


  const [darkMode, setDarkMode] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activePage, setActivePage] = useState('admin-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
const [cartCount, setCartCount] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);



  
  const addToCart = (item) => {
    setCartItems((prev) => {
      const exists = prev.find((cartItem) => cartItem.id === item.id);
      return exists
        ? prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prev, { ...item, quantity: 1 }];
    });
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
      
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode}  />
      <Component darkMode={darkMode} />
    </>
  );
  const withAssignerLayout = (Component) => (
    <>
      
      <AssignerHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode}  />
      <Component darkMode={darkMode} />
    </>
  );

   const withDeliveryLayout = (Component) => (
    <>
      
      <DeliveryHeader darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}  />
      <Component darkMode={darkMode} />
    </>
  );
  const withShopLayout = (Component) => (
    <>
      <ShopHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode}   />
      <Component darkMode={darkMode} />
    </>
  );

  const withNavbarLayout = (Component, extraProps = {}) => (
    <>
      <Navbar cartCount={cartCount} setCartCount={setCartCount} onCartClick={() => setShowCart(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component  darkMode={darkMode} {...extraProps} />
      <Footer darkMode={darkMode}/>
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
        <Route path="/track" element={withNavbarLayout(Track)} />
        <Route path="/account" element={withNavbarLayout(Account)} />
        <Route path="/repair" element={withNavbarLayout(Repair)} />
        <Route path="/offers" element={withNavbarLayout(Offers)} />
        <Route path="/device/:id" element={withNavbarLayout(DeviceDetail, { addToCart })} />
        <Route path="/shops/:shopId" element={withNavbarLayout(Shop)}/>
        <Route path="/repair-request/:requestId/update" element={withNavbarLayout(RepairRequest)}/>

        <Route path="/oauth2/success" element={<SuccessGoogle />} />


        {/* Admin Routes */}
        <Route path="/dashboard" element={withAdminLayout(Dashboard)} />
        <Route path="/repair-shops" element={withAdminLayout(Shops)} />
        <Route path="/users" element={withAdminLayout(Users)} />
        <Route path="/admin/offers" element={withAdminLayout(AdminOffers)} />
        <Route path="/category" element={withAdminLayout(Category)} />
        <Route path="/deliveries" element={withAdminLayout(Deliveries)} />
        <Route path="/assigners" element={withAdminLayout(Assigners)} />
        <Route path="/reviews" element={withAdminLayout(Reviews)} />
        <Route path="/admin/repair-requests" element={withAdminLayout(AdminRepairRequests)} />
        <Route path="/admin/products" element={withAdminLayout(AdminProducts)} />

        <Route path="/notifications" element={withAdminLayout(Notifications)} />

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
        <Route path="/shop/orders" element={withShopLayout(Orders)} />
        <Route path="/shop/profile" element={withShopLayout(ShopProfile)} />
        <Route path="/shop/inventory" element={withShopLayout(Inventory)} />
        <Route path="/shop/notifications" element={withShopLayout(ShopNotifications)} />
        <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />


      </Routes>



<Cart
      show={showCart}
      onClose={() => setShowCart(false)}
      cartItems={cartItems}
      updateQuantity={updateQuantity}
      removeFromCart={removeFromCart}
      cartTotal={cartTotal}
      darkMode={darkMode}
    />
    </Router>
  );
}

export default App;