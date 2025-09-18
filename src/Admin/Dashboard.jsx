import React from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { 
 FiShoppingBag, FiUsers,FiDollarSign,
 FiTool,
 FiMessageSquare,
 FiAlertTriangle,

} from 'react-icons/fi';


const Dashboard = ({ darkMode }) => {

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (EGP)',
      data: [6500, 5900, 8000, 8100, 5600, 12840],
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      tension: 0.4
    }]
  };

  const deviceCategoriesData = {
    labels: ['Smartphones', 'Tablets', 'Laptops', 'Accessories'],
    datasets: [{
      data: [120, 30, 25, 12],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1']
    }]
  };


   const recentActivity = [
    { type: "approval", message: "New repair shop 'TechFix Pro' pending approval", time: "2 hours ago" },
    { type: "review", message: "Abusive review reported for 'Mobile Masters'", time: "4 hours ago" },
    { type: "transaction", message: "High-value transaction flagged for review", time: "6 hours ago" },
    { type: "support", message: "Customer complaint about delayed delivery", time: "8 hours ago" },
  ]

  return (
    <div style={{marginTop:"-550px",marginLeft:"300px"}} className={`p-6  ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
    
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Users', value: "10,864", icon: <FiUsers size={24}/>, change: '+12%' },
          { title: 'Active Repair Shops', value: 187, icon: <FiTool size={24}/>, change: '+8%' },
          { title: 'Monthly Revenue', value: "12,000 EGP", icon: <FiDollarSign size={24}/>, change: '+5%' },
          { title: 'Pending Reviews', value: '23', icon: <FiMessageSquare size={24}/>, change: '+24%' }
        ].map((stat, index) => (
          <div key={index} className={`rounded-xl p-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="text-3xl bg-gray-100 text-blue-500 p-3 rounded-3xl">{stat.icon}</div>
            </div>
            <p className={`text-sm mt-4 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

<div className="bg-white">
  <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 m-4 rounded-lg bg-white">
                <div className="flex-shrink-0">
                  {activity.type === "approval" && <FiShoppingBag className="h-5 w-5 text-blue-600" />}
                  {activity.type === "review" && <FiMessageSquare className="h-5 w-5 text-red-600" />}
                  {activity.type === "transaction" && <FiDollarSign className="h-5 w-5 text-green-600" />}
                  {activity.type === "support" && <FiAlertTriangle className="h-5 w-5 text-orange-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
    
              </div>
            ))}
               <hr />
          </div>
         

          </div><br /><br />
          


      
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6  mb-8">
        <div className={`rounded-xl p-6 shadow-md   ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
          <div className="h-80">
            <Line 
              data={revenueData} 
              options={{ 
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
        
        <div className={`rounded-xl p-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-lg font-semibold mb-4">Device Categories</h2>
          <div className="h-80">
            <Pie 
              data={deviceCategoriesData} 
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} 
            />
          </div>
        </div>
      </div>
      
      
    </div>
  );
};

export default Dashboard;