
import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const shopEmail = user?.email; 

  useEffect(() => {
    fetchMySubscriptions();
  }, []);

  const fetchMySubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('');
      setSubs(res.data);
    } catch (err) {
      alert('Failed to load subscriptions');
    }
    setLoading(false);
  };

  const subscribeCard = async () => {
    if (!window.confirm('Proceed with card payment?')) return;
    try {
      await api.post('/card', { shopEmail, amount: 99.99 });
      alert('Card subscription created!');
      fetchMySubscriptions();
    } catch (err) {
      alert('Payment failed');
    }
  };

  const subscribeCash = async () => {
    if (!window.confirm('Submit cash payment request?')) return;
    try {
      await api.post('/cash', { shopEmail, amount: 99.99 });
      alert('Cash request sent. Admin will confirm.');
      fetchMySubscriptions();
    } catch (err) {
      alert('Failed');
    }
  };

  const renewCard = async () => {
    if (!window.confirm('Renew with card?')) return;
    try {
      await api.post(`/renew/card/${shopEmail}`, { amount: 99.99 });
      alert('Renewed!');
      fetchMySubscriptions();
    } catch (err) {
      alert('Renew failed');
    }
  };

  const renewCash = async () => {
    if (!window.confirm('Request cash renewal?')) return;
    try {
      await api.post(`/renew/cash/${shopEmail}`, { amount: 99.99 });
      alert('Cash renewal requested');
      fetchMySubscriptions();
    } catch (err) {
      alert('Failed');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shop Owner Dashboard</h1>
      <p className="mb-4">Shop: <strong>{shopEmail}</strong></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={subscribeCard} className="bg-blue-600 text-white p-4 rounded hover:bg-blue-700">
          Subscribe with Card
        </button>
        <button onClick={subscribeCash} className="bg-green-600 text-white p-4 rounded hover:bg-green-700">
          Subscribe with Cash
        </button>
        <button onClick={renewCard} className="bg-indigo-600 text-white p-4 rounded hover:bg-indigo-700">
          Renew with Card
        </button>
        <button onClick={renewCash} className="bg-orange-600 text-white p-4 rounded hover:bg-orange-700">
          Renew with Cash
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-3">My Subscriptions</h2>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {subs.length === 0 ? <p>No subscriptions yet.</p> : (
            subs.map(s => (
              <div key={s.id} className="border p-4 rounded bg-gray-50">
                <p><strong>Type:</strong> {s.paymentType}</p>
                <p><strong>Status:</strong> {s.status}</p>
                <p><strong>Expires:</strong> {new Date(s.expiryDate).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;