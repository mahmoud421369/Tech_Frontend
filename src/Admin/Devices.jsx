import React, { useState } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Devices = ({ darkMode }) => {

  const [currentPage, setCurrentPage] = useState(1);
  const devicesPerPage = 5;
  
  const [devices, setDevices] = useState([
    { id: 1, name: 'iPhone 13', category: 'Smartphone', price: 699, condition: 'Refurbished', status: 'Available' },
    { id: 2, name: 'Samsung Galaxy S21', category: 'Smartphone', price: 649, condition: 'Used - Like New', status: 'Available' },
    { id: 3, name: 'iPad Pro', category: 'Tablet', price: 799, condition: 'New', status: 'Out of Stock' },
    { id: 4, name: 'MacBook Air', category: 'Laptop', price: 999, condition: 'Refurbished', status: 'Available' },
    { id: 5, name: 'Apple Watch Series 7', category: 'Smart Watch', price: 399, condition: 'Used - Good', status: 'Available' },
     { id: 6, name: 'MacBook Air', category: 'Laptop', price: 999, condition: 'Refurbished', status: 'Available' },
    { id: 7, name: 'Apple Watch Series 7', category: 'Smart Watch', price: 399, condition: 'Used - Good', status: 'Available' }
  ]);



 const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    status: ''
  });
  
  const [editingDevice, setEditingDevice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);


 
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         device.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category ? device.category === filters.category : true;
    const matchesCondition = filters.condition ? device.condition === filters.condition : true;
    const matchesStatus = filters.status ? device.status === filters.status : true;
    
    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });


  
  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = filteredDevices.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
  


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  
  
  const handleDelete = (id) => {
    setDeviceToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setDevices(devices.filter(device => device.id !== deviceToDelete));
    setShowDeleteModal(false);
  };


  const handleEdit = (device) => {
    setEditingDevice(device);
  };

  const saveEdit = (updatedDevice) => {
    setDevices(devices.map(device => 
      device.id === updatedDevice.id ? updatedDevice : device
    ));
    setEditingDevice(null);
  };

  return (
    <div style={{marginTop:"-550px",marginLeft:"270px"}} className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Devices Management</h1>
        <Link to="/devices/add" className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg">
          <FiPlus className="mr-2" /> Add Device
        </Link>
      </div>
      
    
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 cursor-pointer py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="block w-full pl-6 pr-10 text-blue-500 cursor-pointer bg-[#ECF0F3] py-3 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="">All Categories</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Tablet">Tablet</option>
              <option value="Laptop">Laptop</option>
              <option value="Smart Watch">Smart Watch</option>
            </select>
          </div>
          
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="block w-full pl-6 pr-10 cursor-pointer text-blue-500 bg-[#ECF0F3] py-3 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>
      
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-500 text-white ">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentDevices.map((device) => (
              <tr key={device.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{device.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{device.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{device.price} EGP</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    device.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                  <button 
                    onClick={() => handleEdit(device)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FiEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(device.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      



  <div className={`flex items-center justify-between p-4 ${
          darkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <div>
            Showing {indexOfFirstDevice + 1} to {Math.min(indexOfLastDevice, filteredDevices.length)} of {filteredDevices.length} devices
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : darkMode 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <FiChevronLeft />
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 rounded-lg ${
                  currentPage === i + 1
                    ? darkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-600 text-white'
                    : darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages 
                  ? 'opacity-50 cursor-not-allowed' 
                  : darkMode 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div> 



   
           {editingDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Edit Device</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input 
                  type="text" 
                  value={editingDevice.name}
                  onChange={(e) => setEditingDevice({...editingDevice, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Price</label>
                <input 
                  type="number" 
                  value={editingDevice.price}
                  onChange={(e) => setEditingDevice({...editingDevice, price: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => saveEdit(editingDevice)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this device?</p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
   
  );
};










export default Devices;