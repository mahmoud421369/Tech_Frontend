import React, { useState, useEffect } from 'react';
import { 
 FiPlus, FiEdit,FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
 const Categories = () => (
  <div style={{marginTop:"-550px",marginLeft:"300px"}} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg">
        <FiPlus className="mr-2" /> Add Category
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['Smartphones', 'Tablets', 'Laptops', 'Smart Watches', 'Accessories', 'Gaming Consoles'].map((category, index) => (
        <div key={index} className="border rounded-lg p-4 flex justify-between items-center">
          <span>{category}</span>
          <div className="flex space-x-2">
            <button className="text-blue-500">
              <FiEdit />
            </button>
            <button className="text-red-500">
              <FiX />
            </button>
          </div>
        </div>
      ))}
    </div>
    

    <div className="mt-8 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
      <div className="flex space-x-2">
        <input 
          type="text" 
          className="block w-full pl-10 pr-10 cursor-pointer bg-[#ECF0F3] py-3 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="Enter category name"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Add</button>
      </div>
    </div>
  </div>
);
export default Categories