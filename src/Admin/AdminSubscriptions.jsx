
import { useState, useEffect } from 'react';
import api from '../api';

const AdminSubscriptions = () => {
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllSubscriptions();
  }, []);

  const fetchAllSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/subscriptions/all');
      console.log(res.data);
      setAllSubs(res.data);
    } catch (err) {
      alert('Failed to load all subscriptions');
    }
    setLoading(false);
  };

  const confirmCashPayment = async (paymentId) => {
    if (!window.confirm(`Confirm cash payment ID: ${paymentId}?`)) return;
    try {
      await api.post(`/api/subscriptions/cash/confirm/${paymentId}`);
      alert('Payment confirmed!');
      fetchAllSubscriptions();
    } catch (err) {
      alert('Confirmation failed');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <button
        onClick={fetchAllSubscriptions}
        className="mb-6 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Refresh All Subscriptions
      </button>

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Shop Email</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Expires</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {allSubs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{s.shopEmail}</td>
                  <td className="border px-4 py-2">{s.paymentType}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      s.status === 'PENDING' ? 'bg-yellow-200' :
                      s.status === 'ACTIVE' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="border px-4 py-2">{new Date(s.expiryDate).toLocaleDateString()}</td>
                  <td className="border px-4 py-2">
                    {s.paymentType === 'CASH' && s.status === 'PENDING' && (
                      <button
                        onClick={() => confirmCashPayment(s.paymentId)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Confirm Cash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allSubs.length === 0 && <p className="text-center py-4">No subscriptions found.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;