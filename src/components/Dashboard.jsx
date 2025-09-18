
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard</h1>
        
        {currentUser && (
          <div className="mb-6 text-left">
            <p className="text-gray-600"><span className="font-medium">Name:</span> {currentUser.fullName}</p>
            <p className="text-gray-600"><span className="font-medium">Email:</span> {currentUser.email}</p>
            <p className="text-gray-600"><span className="font-medium">Username:</span> {currentUser.username}</p>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;