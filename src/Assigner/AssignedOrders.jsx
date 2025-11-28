import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiSearch, FiUser, FiHome, FiDollarSign,
  FiCalendar, FiChevronLeft, FiChevronRight, FiMapPin
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const AssignedOrders = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [deliveryId, setDeliveryId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchOrders = useCallback(async () => {
    if (!token) return navigate('/login');
    if (!deliveryId.trim()) {
      Swal.fire({ icon: 'warning', title: 'Enter Delivery ID', toast: true, position: 'top-end' });
      return;
    }

    setLoading(true);
    try {
      const [ordersRes, logsRes] = await Promise.all([
        api.get(`/api/assigner/delivery/${deliveryId}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/assignment-log', {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'ORDER', deliveryId }
        })
      ]);

      const current = ordersRes.data.content || ordersRes.data || [];
      const assigned = (logsRes.data.content || logsRes.data || []).map(log => ({
        id: log.orderId,
        userId: log.userId,
        userName: log.userName,
        userAddress: log.userAddress,
        shopId: log.shopId,
        shopName: log.shopName,
        shopAddress: log.shopAddress,
        totalPrice: log.totalPrice,
        status: log.status || 'ASSIGNED',
        createdAt: log.createdAt,
      }));

      const merged = [...current, ...assigned];
      const unique = Array.from(new Map(merged.map(o => [o.id, o])).values());
      setOrders(unique);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load orders',
          text: err.response?.data?.message || 'Invalid delivery ID or no orders found',
          toast: true,
          position: 'top-end'
        });
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, deliveryId, navigate]);

  const filteredOrders = orders;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusGradient = (status) => {
    const gradients = {
      PENDING: 'from-yellow-400 to-amber-500',
      PENDING_PICKUP: 'from-orange-400 to-red-500',
      ASSIGNED: 'from-purple-500 to-pink-600',
      IN_TRANSIT: 'from-cyan-500 to-blue-600',
      IN_PROGRESS: 'from-indigo-500 to-purple-600',
      COMPLETED: 'from-emerald-500 to-teal-600',
      default: 'from-gray-400 to-gray-600'
    };
    return gradients[status] || gradients.default;
  };

  const formatPrice = (price) => price ? `${price.toLocaleString()} EGP` : '0 EGP';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

       
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white flex items-center gap-5 justify-center lg:justify-start">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-2xl">
              <FiPackage size={40} />
            </div>
            Assigned Orders by Delivery
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            View all orders assigned to a specific delivery agent
          </p>
        </div>

       
        <div className="mb-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              placeholder="Enter Delivery Person ID"
              className="w-full pl-14 pr-5 py-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-800 dark:text-white text-lg font-medium"
            />
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading || !deliveryId.trim()}
            className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <FiSearch size={20} /> Get Orders
              </>
            )}
          </button>
        </div>

      
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 animate-pulse border border-gray-200 dark:border-gray-800">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-32 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage size={100} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
              {deliveryId ? 'No orders found for this delivery person' : 'Enter a Delivery ID to view orders'}
            </h3>
            <p className="mt-3 text-gray-500 dark:text-gray-500">
              {deliveryId ? `ID: ${deliveryId}` : 'Start by typing a valid delivery agent ID'}
            </p>
          </div>
        ) : (
          <>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-3"
                >
                 
                  <div className={`h-2 bg-gradient-to-r ${getStatusGradient(order.status)}`} />

                  <div className="p-7">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                          #{order.id?.slice(-8)}
                        </h3>
                        <span className={`inline-block mt-3 px-5 py-2 rounded-full text-white font-bold text-sm shadow-lg bg-gradient-to-r ${getStatusGradient(order.status)}`}>
                          {order.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(order.totalPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      {order.userName && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600" size={18} />
                          <span className="font-medium">{order.userName}</span>
                        </div>
                      )}

                      {order.userAddress && (
                        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                          <FiHome className="text-teal-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">Delivery Address</div>
                            <div className="text-xs">{order.userAddress.street}, {order.userAddress.city}</div>
                          </div>
                        </div>
                      )}

                      {order.shopAddress && (
                        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                          <FiMapPin className="text-emerald-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">Pickup from</div>
                            <div className="text-xs">{order.shopName || 'Shop'}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-xs pt-2 border-t border-gray-200 dark:border-gray-800">
                        <FiCalendar size={16} />
                        <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

           
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  <FiChevronLeft /> Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssignedOrders;