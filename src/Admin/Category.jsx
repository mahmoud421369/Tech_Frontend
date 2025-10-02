import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FiTrash2, FiPlus, FiList, FiEdit3 } from "react-icons/fi";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");


  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.content || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  
  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire("Error", "Name required","error");
      return;
    }

    try {
      let res;
      if (editingCategory) {
        res = await fetch(
          `http://localhost:8080/api/admin/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName }),
          }
        );
      } else {
        res = await fetch("http://localhost:8080/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName }),
        });
      }

      if (!res.ok) throw new Error("Failed to save category");

      Swal.fire(
        "Saved",
        editingCategory ? "Category updated successfully" : "Category added successfully",
        "success"
      );
      setCategoryName("");
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      Swal.fire("Error", "Error saving category: ", "error");
    }
  };

 
  const deleteCategory = async (id) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تستطيع التراجع عن هذا!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، احذفها!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/categories/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete category");

      Swal.fire("Deleted", "Category deleted successfully", "success");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      Swal.fire("Error", "Error deleting category", "error");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
    style={{marginTop:"60px"}}
      className="space-y-6 p-6 max-w-8xl min-h-screen w-full mx-auto dark:bg-gray-900 bg-gray-50"
    >
      <div className= "flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700 border p-4 rounded-2xl text-left" >
        <div  >
          <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><FiList/> Categories</h1>
          <p className="text-gray-500">Add , Edit ,and Delete Categories</p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingCategory(null);
            setCategoryName("");
          }}
          className="flex items-center gap-2 dark:bg-gray-950 dark:text-white dark:border-none px-4 py-2 bg-[#f1f5f9] text-blue-500   rounded-3xl  "
        >
          <FiPlus />  add category
        </button>
      </div>

 
      <div className=" bg-white  dark:bg-gray-800 dark:border-gray-700 border p-5 rounded-lg">
      <div className="relative flex-1 max-w-sm mb-4 text-right">
        <input
          type="text"
          placeholder="Search for category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 block w-full dark:bg-gray-950 dark:text-white dark:border-none rounded-3xl bg-gray-50 border cursor-pointer border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      
      <div className="bg-white  shadow overflow-hidden">
        <table className="min-w-full divide-y dark:divide-gray-700  divide-gray-200">
          <thead className="bg-[#f1f5f9] dark:bg-gray-700 dark:text-white text-blue-500">
            <tr>
              <th className="px-6 py-3 text-center font-medium uppercase">
                #
              </th>
              <th className="px-6 py-3 text-center font-medium uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-center font-medium uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500 dark:bg-gray-900 dark:text-gray-200">
            {filteredCategories.map((c, idx) => (
              <tr key={c.id} className="text-center border-b dark:border-gray-700">
                <td className="px-3 py-2 text-sm ">{c.id}</td>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 flex gap-4 justify-center items-center text-center">
                  <button
                    onClick={() => {
                      setEditingCategory(c);
                      setCategoryName(c.name);
                      setIsModalOpen(true);
                    }}
                    className="border dark:bg-gray-950 dark:border-none text-amber-600 px-3 py-1 rounded-3xl"
                  >
                    <FiEdit3 /> 
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="border dark:bg-gray-950 dark:border-none text-red-600 px-3 py-1 rounded-3xl"
                  >
                    <FiTrash2 /> 
                  </button>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

     
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? "Edit Category" : "Add new Category"}
              </h3>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="category name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  close
                </button>
                <button
                  onClick={saveCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;