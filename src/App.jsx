import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import {
Footer,Navbar,RepairDetailsModal,ServiceModal
}
from './components';

import{
  Login,Signup
}
from './Auth';

import {
 Repair, Explore, Track, Account,
  Homepage, EditProfile, Cart, New, Used, DeviceDetail
} from './User'; 

import {
  Dashboard,Notifications, Header, Shops, Devices, Users, Settings, Categories,
  Chats, Offers, AdminTransactions, Reviews,
  Category
} from './Admin';

import {
  ShopHeader, ShopDashboard, RepairRequests, Products,
  Transactions, Support, ShopOffers, ShopProfile,
  ShopSettings, Inventory,Chat, Orders
} from './Shop';

import { useAuth } from './context/AuthContext';
import { SupportRequests } from './Admin';
import Shop from './User/Shop';
import OAuth2RedirectHandler from './Auth/AuthSuccess';
import OrdersPage from './Delivery/OrdersPage';
import UpdateOrderPage from './Delivery/UpdateOrderPage';
import PastOrdersPage from './Delivery/PastOrdersPage';



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

  const withShopLayout = (Component) => (
    <>
      <ShopHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode}   />
      <Component darkMode={darkMode} />
    </>
  );

  const withNavbarLayout = (Component, extraProps = {}) => (
    <>
      <Navbar cartCount={cartItems.length} onCartClick={() => setShowCart(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component darkMode={darkMode} {...extraProps} />
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
        <Route path="/purchase/new" element={withNavbarLayout(New)} />
        <Route path="/purchase/used" element={withNavbarLayout(Used)} />
        <Route path="/edit-profile" element={withNavbarLayout(EditProfile)} />
        <Route path="/device/:id" element={withNavbarLayout(DeviceDetail, { addToCart })} />
        <Route path="/shops/:shopId" element={withNavbarLayout(Shop)}/>


        {/* Admin Routes */}
        <Route path="/dashboard" element={withAdminLayout(Dashboard)} />
        <Route path="/repair-shops" element={withAdminLayout(Shops)} />
        <Route path="/users" element={withAdminLayout(Users)} />
        <Route path="/promotional-offers" element={withAdminLayout(Offers)} />
        <Route path="/category" element={withAdminLayout(Category)} />

        <Route path="/support-requests" element={withAdminLayout(SupportRequests)} />
        <Route path="/transactions" element={withAdminLayout(AdminTransactions)} />
        <Route path="/reviews" element={withAdminLayout(Reviews)} />
        <Route path="/settings" element={withAdminLayout(Settings)} />
        <Route path="/notifications" element={withAdminLayout(Notifications)} />

        {/* Shop Routes */}
        <Route path="/shop-dashboard" element={withShopLayout(ShopDashboard)} />
        <Route path="/support" element={withShopLayout(Chat)} />
        <Route path="/shop/transactions" element={withShopLayout(Transactions)} />
        <Route path="/repair/requests" element={withShopLayout(RepairRequests)} />
        <Route path="/shop/devices" element={withShopLayout(Products)} />
        <Route path="/shop/offers" element={withShopLayout(ShopOffers)} />
        <Route path="/shop/orders" element={withShopLayout(Orders)} />
        <Route path="/shop/profile" element={withShopLayout(ShopProfile)} />
        <Route path="/shop/settings" element={withShopLayout(ShopSettings)} />
        <Route path="/shop/inventory" element={withShopLayout(Inventory)} />

        <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />

 {/* Delivery Routes */}
 <Route path="/orders" element={<OrdersPage />} />
              <Route path="/update" element={<UpdateOrderPage />} />
              <Route path="/past-orders" element={<PastOrdersPage />} />
              <Route path="" element={<OrdersPage />} />

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