import React, { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiPlus, FiTrash2, FiEdit, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE = "http://localhost:8080/api/shop/inventory";

const Inventory = ({ darkMode }) => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const devicesPerPage = 5;
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({
    lowStock: 0,
    totalValue: 0,
    totalItems: 0
  });

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    supplier: '',
    sku: '',
    barcode: '',
    location: '',
    threshold: ''
  });
  const [showForm, setShowForm] = useState(false);

  // Fetch all inventory + stats
  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/search?query=${searchTerm}`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const [lowStockRes, totalValueRes, totalItemsRes] = await Promise.all([
        fetch(`${API_BASE}/low-stock`),
        fetch(`${API_BASE}/total-value`),
        fetch(`${API_BASE}/total-items`)
      ]);

      const lowStock = await lowStockRes.json();
      const totalValue = await totalValueRes.json();
      const totalItems = await totalItemsRes.json();

      setStats({
        lowStock: lowStock.length || 0,
        totalValue: totalValue || 0,
        totalItems: totalItems || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = inventory.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.ceil(inventory.length / devicesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_BASE}/${editingId}` : `${API_BASE}`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      fetchInventory();
      fetchStats();
      resetForm();
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      fetchInventory();
      fetchStats();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      category: '',
      price: '',
      quantity: '',
      supplier: '',
      sku: '',
      barcode: '',
      location: '',
      threshold: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const exportToExcel = async () => {
    try {
      const res = await fetch(`${API_BASE}/export`);
      const blob = await res.blob();
      saveAs(blob, 'inventory.xlsx');
    } catch (err) {
      console.error("Error exporting file:", err);
    }
  };

  const importFromExcel = async (e) => {
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      await fetch(`${API_BASE}/import`, {
        method: "POST",
        body: formDataUpload
      });
      fetchInventory();
      fetchStats();
    } catch (err) {
      console.error("Error importing file:", err);
    }
  };

  return (
    <div style={{ marginTop: "-550px", marginLeft: "270px" }} className="mx-auto px-4 py-8 bg-gray-50 h-auto font-cairo">
      
      <div className="bg-[#f1f5f9] p-4 m-2 border-l-4 border-blue-600 text-blue-500 text-right">
        <h1 className="text-3xl font-bold text-blue-600">نظام الجرد</h1><br />
        <p className="text-gray-400 text-sm font-bold"> يمكنك متابعة عدد الاجهزة ورؤية ان كان هناك نقص في منتج ما من هنا</p>
      </div>

     
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="...ابحث في الجرد"
            className="pl-10 pr-4 py-2 w-full cursor-pointer text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={fetchInventory}
          />
        </div>
      </div>













      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#f1f5f9] text-blue-600 px-4 py-2 font-bold rounded-3xl transition">
          <FiPlus /> اضافة منتج 
        </button>

        <label className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-3xl font-bold transition cursor-pointer">
          <FiUpload /> csv اضافة
          <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
        </label>

        <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-3xl font-bold transition">
          <FiDownload /> csv تصدير
        </button>
      </div>

        <div className="bg-white dark:bg-gray-800  shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f1f5f9]">
              <tr>
                <th className="px-6 py-3 text-center  text-xs font-bold text-blue-600 uppercase tracking-widerr">اسم المنتج</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">التصنيف</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">السعر</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">حالة المنتج</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th> */}
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">اتختذ قرار</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 text-center divide-y divide-gray-200 dark:divide-gray-700">
              {currentDevices.length > 0 ? (
                currentDevices.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2  whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="p-2 font-medium whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.category}</td>
                    <td className="p-2 font-medium whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${item.price}</td>
                    <td className="p-2 font-medium whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.quantity}</td>
                    <td className="p-2 font-medium whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.quantity <= (item.threshold || 0) 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {item.quantity <= (item.threshold || 0) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.location}</td> */}
                    <td className="p-2  whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      هذا المنتج غير متوفر
                  </td>
                </tr>
              )}
            </tbody>
          </table>

</div>
</div>
    
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#ECF0F3] dark:bg-gray-800 rounded-lg shadow p-4 text-right">
          <h3 className="text-lg font-bold text-gray-400 dark:text-gray-300 mb-2">عدد المنتجات</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-white">{stats.totalItems}</p>
        </div>
        <div className="bg-[#ECF0F3] dark:bg-gray-800 rounded-lg shadow p-4 text-right">
          <h3 className="text-lg font-bold text-gray-400 dark:text-gray-300 mb-2">منتجات الكميات القليلة</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.lowStock}</p>
        </div>
        <div className="bg-[#ECF0F3] dark:bg-gray-800 rounded-lg shadow p-4 text-right">
          <h3 className="text-lg font-bold text-gray-400 dark:text-gray-300 mb-2">اجمالي سعر المنتجات</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalValue.toLocaleString()} EGP</p>
        </div>
      </div>
    </div>
  );
};

export default Inventory;