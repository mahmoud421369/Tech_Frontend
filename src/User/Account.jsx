import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FiUser, FiMapPin, FiBox, FiTool, FiEdit2, FiTrash2, FiX, FiMail, FiPhone,
  FiPlus, FiInfo, FiHash, FiCheckCircle, FiSmartphone, FiAlertTriangle,
  FiCalendar, FiFileText, FiTruck, FiHome, FiEdit3, FiChevronLeft,
  FiChevronRight, FiXCircle, FiSend, FiClock, FiHelpCircle, FiShoppingBag,
  FiMonitor, FiDollarSign,
} from 'react-icons/fi';
import { FaLaptop, FaMobileAlt, FaTablet, FaDesktop, FaGamepad, FaTv } from 'react-icons/fa';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// === PROFILE SECTION ===
const ProfileSection = ({
  userProfile, isEditingProfile, setIsEditingProfile,
  profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, darkMode
}) => (
  <div className="animate-fade-in space-y-6">
    <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
      <FiUser /> Profile Information
    </h2>

    {isEditingProfile ? (
      <form onSubmit={handleUpdateProfile} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
            <input
              type="text" value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
            <input
              type="text" value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel" value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition"
            required
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center gap-2">
            Save Changes
          </button>
          <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md flex items-center gap-2">
            <FiX /> Cancel
          </button>
        </div>
      </form>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <FiInfo /> Account Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2"><FiUser /> Name</p>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2"><FiMail /> Email</p>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400 break-all">{userProfile?.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <FiSmartphone /> Contact
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2"><FiPhone /> Phone</p>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">{userProfile?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                userProfile?.activate
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                {userProfile?.activate ? 'Activated' : 'Not Activated'}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
                <FiEdit2 /> Edit
              </button>
              <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md">
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// === ADDRESSES SECTION ===
const AddressesSection = ({
  addresses, isAddingAddress, setIsAddingAddress,
  editingAddressId, setEditingAddressId,
  addressForm, setAddressForm,
  handleAddAddress, handleUpdateAddress, handleDeleteAddress,
  initEditAddress, cancelAddressForm, darkMode
}) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center flex-wrap gap-4">
      <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
        <FiMapPin /> My Addresses
      </h2>
      <button onClick={() => setIsAddingAddress(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
        <FiPlus /> Add Address
      </button>
    </div>

    {(isAddingAddress || editingAddressId) && (
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">
          {editingAddressId ? 'Edit' : 'Add'} Address
        </h3>
        <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input placeholder="State (e.g., Cairo)" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
            <input placeholder="City (e.g., Nasr City)" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
            <input placeholder="Street" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
            <input placeholder="Building/Apt" value={addressForm.building} onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })} className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <textarea placeholder="Notes (optional)" value={addressForm.notes} onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" rows="2" />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Set as default</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
              {editingAddressId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={cancelAddressForm} className="px-5 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {addresses.length === 0 && !isAddingAddress ? (
        <div className="col-span-full text-center py-12">
          <FiMapPin className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">No addresses yet. Add one!</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr.id}
            className={`relative p-5 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              addr.isDefault
                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-500'
                : 'bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50'
            }`}
          >
            {addr.isDefault && <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">Default</span>}
            <div className="flex items-start gap-3 mb-3">
              <FiMapPin className="text-indigo-600 text-xl mt-1" />
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{addr.street}, {addr.building}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{addr.city}, {addr.state}</p>
                {addr.notes && <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">"{addr.notes}"</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => initEditAddress(addr)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-indigo-600 border-2 border-transparent rounded-xl hover:border-indigo-500 transition">
                <FiEdit2 /> Edit
              </button>
              <button onClick={() => handleDeleteAddress(addr.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-red-600 border-2 border-transparent rounded-xl hover:border-red-500 transition">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// === ORDERS SECTION ===
const OrdersSection = ({ orders, ordersPage, setOrdersPage, showOrderDetails, handleCancelOrder, darkMode }) => {
  const itemsPerPage = 3;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const currentOrders = useMemo(() => orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage), [orders, ordersPage]);

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
        <FiBox /> My Orders
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <FiShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">No orders yet. Start shopping!</p>
          <a href="/explore" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
            Explore Now
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentOrders.map((order) => (
              <div key={order.id} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition hover:-translate-y-1">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Order #{order.id.slice(0, 8)}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><FiFileText /> {order.paymentMethod}</p>
                <p className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400"><FiDollarSign /> {order.totalPrice} EGP</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => showOrderDetails(order)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-indigo-600 border-2 border-transparent rounded-xl hover:border-indigo-500 transition">
                    <FiInfo />
                  </button>
                  <button onClick={() => handleCancelOrder(order.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-red-600 border-2 border-transparent rounded-xl hover:border-red-500 transition">
                    <FiXCircle />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4">
            <button onClick={() => setOrdersPage(p => Math.max(p - 1, 1))} disabled={ordersPage === 1} className="p-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition">
              <FiChevronLeft />
            </button>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Page {ordersPage} of {totalPages}</span>
            <button onClick={() => setOrdersPage(p => Math.min(p + 1, totalPages))} disabled={ordersPage === totalPages} className="p-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition">
              <FiChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// === REPAIRS SECTION ===
const RepairsSection = ({ repairRequests, repairsPage, setRepairsPage, handleViewRepairRequest, handleCancelRepairRequest, handleEditRepairRequest, darkMode }) => {
  const itemsPerPage = 3;
  const totalPages = Math.ceil(repairRequests.length / itemsPerPage);
  const currentRepairs = useMemo(() => repairRequests.slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage), [repairRequests, repairsPage]);

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
        <FiTool /> Repair Requests
      </h2>

      {repairRequests.length === 0 ? (
        <div className="text-center py-12">
          <FiTool className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">No repair requests.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRepairs.map((req) => (
              <div key={req.id} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition hover:-translate-y-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FiHash /> Repair #{req.id.slice(0, 8)}
                </h3>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><FiHome /> {req.shopName}</p>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><FiAlertTriangle /> {req.description}</p>
                {req.status === 'QUOTE_SENT' && req.price && (
                  <p className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400"><FiFileText /> {req.price} EGP</p>
                )}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button onClick={() => handleViewRepairRequest(req.id)} className="p-2 bg-white/50 dark:bg-black/30 text-blue-600 border-2 border-transparent rounded-xl hover:border-blue-500 transition"><FiInfo /></button>
                  <button onClick={() => handleCancelRepairRequest(req.id)} className="p-2 bg-white/50 dark:bg-black/30 text-red-600 border-2 border-transparent rounded-xl hover:border-red-500 transition"><FiXCircle /></button>
                  <button onClick={() => handleEditRepairRequest(req)} className="p-2 bg-white/50 dark:bg-black/30 text-amber-600 border-2 border-transparent rounded-xl hover:border-amber-500 transition"><FiEdit3 /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4">
            <button onClick={() => setRepairsPage(p => Math.max(p - 1, 1))} disabled={repairsPage === 1} className="p-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition">
              <FiChevronLeft />
            </button>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Page {repairsPage} of {totalPages}</span>
            <button onClick={() => setRepairsPage(p => Math.min(p + 1, totalPages))} disabled={repairsPage === totalPages} className="p-2 bg-indio-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition">
              <FiChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// === MAIN ACCOUNT COMPONENT ===
const Account = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  // === STATE ===
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ state: '', city: '', street: '', building: '', notes: '', isDefault: false });
  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingRepairs, setIsLoadingRepairs] = useState(true);

  // === FETCHERS ===
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const res = await api.get('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      setUserProfile(res.data);
      setProfileForm({ first_name: res.data.first_name || '', last_name: res.data.last_name || '', phone: res.data.phone || '' });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load profile', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [token]);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await api.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(res.data.content || []);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load addresses', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const res = await api.get('/api/users/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.content || []);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load orders', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [token]);

  const fetchRepairRequests = useCallback(async () => {
    try {
      setIsLoadingRepairs(true);
      const res = await api.get('/api/users/repair-request', { headers: { Authorization: `Bearer ${token}` } });
      setRepairRequests(res.data.content || []);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load repairs', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    } finally {
      setIsLoadingRepairs(false);
    }
  }, [token]);

  // === ADDRESS HELPERS (DEFINED FIRST!) ===
  const cancelAddressForm = useCallback(() => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({ state: '', city: '', street: '', building: '', notes: '', isDefault: false });
  }, []);

  const initEditAddress = useCallback((address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      state: address.state,
      city: address.city,
      street: address.street,
      building: address.building,
      notes: address.notes || '',
      isDefault: address.isDefault,
    });
  }, []);

  // === HANDLERS (NOW SAFE TO USE cancelAddressForm) ===
  const handleUpdateProfile = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/profile', profileForm, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUserProfile();
      setIsEditingProfile(false);
      Swal.fire({ title: 'Updated', text: 'Profile updated!', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to update profile', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [profileForm, fetchUserProfile, token]);

  const handleDeleteAccount = useCallback(async () => {
    const confirm = await Swal.fire({
      title: 'Delete Account?', text: 'This cannot be undone.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#d33',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('authToken');
      Swal.fire({ title: 'Deleted', text: 'Account deleted', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      navigate('/');
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to delete account', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [navigate, token]);

  const showOrderDetails = useCallback((order) => {
    const statusIcons = { PENDING: 'Pending', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };
    const itemsHtml = order.orderItems?.map(item => `
      <div class="p-2 border-b">
        <p class="flex justify-between"><strong>Product:</strong> ${item.productName}</p>
        <p class="flex justify-between"><strong>Qty:</strong> ${item.quantity}</p>
        <p class="flex justify-between"><strong>Price:</strong> ${item.priceAtCheckout} EGP</p>
      </div>
    `).join('') || '<p>No items</p>';

    Swal.fire({
      title: `Order #${order.id.slice(0, 8)}`,
      html: `
        <div style="text-align:left;">
          <p><strong>Total:</strong> ${order.totalPrice} EGP</p>
          <p><strong>Status:</strong> ${statusIcons[order.status] || order.status}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <hr class="my-2"/>
          <h4 class="font-bold">Items:</h4>
          <div class="max-h-48 overflow-y-auto">${itemsHtml}</div>
        </div>
      `,
      width: 600, showCloseButton: true, confirmButtonText: 'Close',
    });
  }, []);

  const handleCancelOrder = useCallback(async (orderId) => {
    const confirm = await Swal.fire({ title: 'Cancel Order?', icon: 'warning', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/api/users/orders/${orderId}/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
      Swal.fire({ title: 'Cancelled', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to cancel', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [fetchOrders, token]);

  const handleAddAddress = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/users/addresses', addressForm, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAddresses();
      cancelAddressForm();
      Swal.fire({ title: 'Added', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to add', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [addressForm, fetchAddresses, cancelAddressForm, token]);

  const handleUpdateAddress = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/users/addresses/${editingAddressId}`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAddresses();
      cancelAddressForm();
      Swal.fire({ title: 'Updated', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to update', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [editingAddressId, addressForm, fetchAddresses, cancelAddressForm, token]);

  const handleDeleteAddress = useCallback(async (addressId) => {
    const confirm = await Swal.fire({ title: 'Delete Address?', icon: 'warning', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/api/users/addresses/${addressId}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAddresses();
      Swal.fire({ title: 'Deleted', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to delete', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [fetchAddresses, token]);

  const handleViewRepairRequest = useCallback(async (repairId) => {
    try {
      const res = await api.get(`/api/users/repair-request/${repairId}`, { headers: { Authorization: `Bearer ${token}` } });
      const repair = res.data;
      Swal.fire({
        title: `Repair #${repair.id.slice(0, 8)}`,
        html: `<p><strong>Shop:</strong> ${repair.shopName}</p>
               <p><strong>Issue:</strong> ${repair.description}</p>
               <p><strong>Status:</strong> ${repair.status}</p>`,
        icon: 'info',
      });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load details', icon: 'error' });
    }
  }, [token]);

  const handleCancelRepairRequest = useCallback(async (requestId) => {
    const confirm = await Swal.fire({ title: 'Cancel Repair?', icon: 'warning', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/api/users/repair-request/${requestId}/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRepairRequests();
      Swal.fire({ title: 'Cancelled', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to cancel', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [fetchRepairRequests, token]);

  const handleEditRepairRequest = useCallback((request) => {
    Swal.fire({
      title: 'Edit Request',
      html: `<input id="desc" class="swal2-input" value="${request.description}">`,
      showCancelButton: true,
      preConfirm: () => {
        const desc = document.getElementById('desc').value;
        return api.put(`/api/users/repair-request/${request.shopId}/${request.id}`, { description: desc }, { headers: { Authorization: `Bearer ${token}` } });
      }
    }).then(() => fetchRepairRequests());
  }, [fetchRepairRequests, token]);

  // === EFFECTS ===
  useEffect(() => {
    if (!token) {
      Swal.fire({ title: 'Login Required', icon: 'warning', toast: true, position: 'top-end', timer: 2000 }).then(() => navigate('/login'));
      return;
    }
    Promise.all([fetchUserProfile(), fetchAddresses(), fetchOrders(), fetchRepairRequests()]);
  }, [fetchUserProfile, fetchAddresses, fetchOrders, fetchRepairRequests, navigate, token]);

  // === MENU ===
  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
    { id: 'orders', label: 'Orders', icon: <FiBox /> },
    { id: 'repairs', label: 'Repairs', icon: <FiTool /> },
  ];

  // === RENDER ===
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
      <section className="relative overflow-hidden pb-20">
        <div className={`h-64 ${darkMode ? 'bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`}>
          <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
            <path fill={darkMode ? '#111827' : '#ffffff'} d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z" />
          </svg>
          <div className="absolute inset-0 opacity-20">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />
            ))}
          </div>
          <div className="absolute inset-0 opacity-30">
            <FiSmartphone className="absolute top-16 left-10 w-16 h-16 text-white animate-bounce" />
            <FiMonitor className="absolute bottom-20 right-20 w-20 h-20 text-white animate-pulse" />
            <FaLaptop className="absolute top-1/3 right-1/4 w-14 h-14 text-white animate-ping" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 pt-20 text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">My Account</h1>
            <p className="mt-4 text-xl text-white/90">Manage everything in one place</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            {activeSection === 'profile' && (isLoadingProfile ? <LoadingSpinner /> : <ProfileSection {...{ userProfile, isEditingProfile, setIsEditingProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, darkMode }} />)}
            {activeSection === 'addresses' && (isLoadingAddresses ? <LoadingSpinner /> : <AddressesSection {...{ addresses, isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleAddAddress, handleUpdateAddress, handleDeleteAddress, initEditAddress, cancelAddressForm, darkMode }} />)}
            {activeSection === 'orders' && (isLoadingOrders ? <LoadingSpinner /> : <OrdersSection {...{ orders, ordersPage, setOrdersPage, showOrderDetails, handleCancelOrder, darkMode }} />)}
            {activeSection === 'repairs' && (isLoadingRepairs ? <LoadingSpinner /> : <RepairsSection {...{ repairRequests, repairsPage, setRepairsPage, handleViewRepairRequest, handleCancelRepairRequest, handleEditRepairRequest, darkMode }} />)}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Account;