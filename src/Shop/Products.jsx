import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiBox, FiEdit3, FiInbox, FiSmartphone, FiTrash2, FiChevronRight, FiChevronLeft, FiSearch } from "react-icons/fi";
import ShopLayout from "../components/ShopLayout";

const Products = () => {
  const token = localStorage.getItem("authToken");
  const [products, setProducts] = useState([]);
   const [searchTerm, setSearchTerm] = useState('');
const [newProduct, setNewProduct] = useState({
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: {
    id: "",
    name:"",
  },
  stockQuantity: 0,
  condition: "NEW",
});
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/shops/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      const products = Array.isArray(data) ? data : data.content || [];
      console.log(products);
      setProducts(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      Swal.fire("Error", "Failed to fetch products", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/categories", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const categories = Array.isArray(data) ? data : data.content || [];
      setCategories(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      Swal.fire("Error", "Failed to fetch categories", "error");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

const addProduct = async () => {
  try {
    if (!newProduct.category || !newProduct.category.id) {
      Swal.fire("Error", "Please select a category", "error");
      return;
    }

    const productToSubmit = {
      ...newProduct,
      price: newProduct.price ? Number(newProduct.price) : 0,
      stockQuantity: newProduct.stockQuantity ? Number(newProduct.stockQuantity) : 0,
      category: {
        id: newProduct.category.id,
      name: newProduct.category.name,
      }
    };
    console.log(productToSubmit)

    const res = await fetch("http://localhost:8080/api/shops/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productToSubmit),
    });

    if (!res.ok) throw new Error("Failed to add product");

    Swal.fire("Success!", "Product added successfully", "success");
    setNewProduct({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: null,
      stockQuantity: "",
      condition: "NEW",
    });
    fetchProducts();
  } catch (err) {
    console.error("Error adding product:", err);
    Swal.fire("Error", "Failed to add product", "error");
  }
};

 const updateProduct = async () => {
  try {
    if (!editingProduct.category || !editingProduct.category.id) {
      Swal.fire("Error", "Please select a category", "error");
      return;
    }

    const updateData = {
      ...editingProduct,
      price: editingProduct.price ? Number(editingProduct.price) : 0,
      stockQuantity: editingProduct.stockQuantity ? Number(editingProduct.stockQuantity) : 0,
      category: {
        id: editingProduct.category.id,
        name: editingProduct.category.name,
        createdAt: editingProduct.category.createdAt
      }
    };

    const res = await fetch(
      `http://localhost:8080/api/shops/products/${editingProduct.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) throw new Error("Failed to update product");

    Swal.fire("Success!", "Product updated successfully", "success");
    setEditingProduct(null);
    fetchProducts();
  } catch (err) {
    console.error("Error updating product:", err);
    Swal.fire("Error", "Failed to update product", "error");
  }
};

  const updateStock = async (productId, currentStock) => {
    const { value: newStock } = await Swal.fire({
      title: "تحديث المخزون",
      input: "number",
      inputLabel: "الكمية المتاحة",
      inputValue: currentStock,
      inputAttributes: { min: "0", step: "1" },
      showCancelButton: true,
      confirmButtonText: "تحديث",
      cancelButtonText: "إلغاء",
    });

    if (newStock === undefined || newStock === null) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/products/${productId}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newStock: parseInt(newStock) }),
        }
      );

      if (!res.ok) throw new Error("Failed to update stock");

      Swal.fire("Success!", "تم تحديث المخزون بنجاح", "success");
      fetchProducts();
    } catch (err) {
      console.error("Error updating stock:", err);
      Swal.fire("Error", "فشل في تحديث المخزون", "error");
    }
  };

  const deleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete product");

      Swal.fire("Deleted!", "Product has been deleted.", "success");
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      Swal.fire("Error", "Failed to delete product", "error");
    }
  };
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <ShopLayout>
      <div style={{marginTop:"-1230px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
            <FiBox className="text-xl sm:text-2xl" /> المنتجات
          </h1>
        </div>

      
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center justify-center gap-3">
            <FiSmartphone className="text-indigo-600 dark:text-indigo-400" />
            {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(editingProduct ? [editingProduct] : [newProduct]).map(
              (product, idx) => (
                <React.Fragment key={idx}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="اسم المنتج"
                      value={product.name}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          : setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full pl-4 pr-10 py-3 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="وصف المنتج"
                      value={product.description}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              description: e.target.value,
                            })
                          : setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                      }
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder=" السعر"
                      value={product.price}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              price: e.target.value,
                            })
                          : setNewProduct({
                              ...newProduct,
                              price: e.target.value,
                            })
                      }
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="رابط الصورة"
                      value={product.imageUrl}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              imageUrl: e.target.value,
                            })
                          : setNewProduct({
                              ...newProduct,
                              imageUrl: e.target.value,
                            })
                      }
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={product.condition}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              condition: e.target.value,
                            })
                          : setNewProduct({
                              ...newProduct,
                              condition: e.target.value,
                            })
                      }
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 appearance-none"
                    >
                      <option value="NEW">جديد</option>
                      <option value="USED">مستعمل</option>
                      <option value="REFURBISHED">مجدّد</option>
                    </select>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder=" الكمية"
                      value={product.stockQuantity}
                      onChange={(e) =>
                        editingProduct
                          ? setEditingProduct({
                              ...editingProduct,
                              stockQuantity: e.target.value,
                            })
                          : setNewProduct({
                              ...newProduct,
                              stockQuantity: e.target.value,
                            })
                      }
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={product.category?.id || ""}
                      onChange={(e) => {
                        const selectedCategory = categories.find(
                          (c) => c.id === e.target.value
                        );
                        if (editingProduct) {
                          setEditingProduct({
                            ...editingProduct,
                            category: selectedCategory,
                          });
                        } else {
                          setNewProduct({
                            ...newProduct,
                            category: selectedCategory,
                          });
                        }
                      }}
                      className="w-full pl-4 pr-10 py-3 text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 appearance-none"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </React.Fragment>
              )
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={editingProduct ? updateProduct : addProduct}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md"
            >
              {editingProduct ? "تعديل المنتج" : "إضافة المنتج"}
            </button>
            {editingProduct && (
              <button
                onClick={() => setEditingProduct(null)}
                className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

       
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
           <div className="relative w-full sm:w-64">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                      <input
                        type="text"
                        placeholder="... ابحث في المنتجات "
                        className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyUp={fetchProducts}
                      />
                    </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 text-center">
            قائمة المنتجات
          </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-center text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">اسم المنتج</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">السعر</th>
                  {/* <th className="px-4 py-3 font-semibold">التصنيف</th> */}
                  <th className="px-4 py-3 font-semibold">المخزون</th>
                  <th className="px-4 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {currentProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.condition}</td>
                    <td className="px-4 py-3">{p.price} EGP</td>
                    {/* <td className="px-4 py-3">{p.categoryId } </td> */}

                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          setEditingProduct({
                            ...p,
                            price: p.price || "",
                            stockQuantity: p.stock || "",
                          })
                        }
                        className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={() => updateStock(p.id, p.stock)}
                        className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200"
                      >
                        <FiInbox />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentProducts.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-gray-800">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                لا توجد منتجات
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                أضف منتجًا جديدًا لبدء إدارة قائمة المنتجات الخاصة بك
              </p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => changePage(currentPage - 1)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                <FiChevronRight />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => changePage(i + 1)}
                  className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  }`}
                >
                  {i + 1}
              </button>
              ))}
              <button
                onClick={() => changePage(currentPage + 1)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
              >
                <FiChevronLeft />
              </button>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default Products;