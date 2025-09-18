import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiBox, FiEdit2, FiInbox, FiSmartphone, FiTrash2 } from "react-icons/fi";
import ShopLayout from "../components/ShopLayout";

const Products = () => {
  const token = localStorage.getItem("authToken");
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: null,
    stockQuantity: 0,
    condition: "NEW",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);

const fetchProducts = async () => {
  try {
    const token = localStorage.getItem("authToken");
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
    const token = localStorage.getItem("authToken");
    const res = await fetch("http://localhost:8080/api/shops/categories", {
      headers: { 
        "Content-Type":"application/json",
        Authorization: `Bearer ${token}` 
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
      const res = await fetch("http://localhost:8080/api/shops/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to add product");

      Swal.fire("Success!", "Product added successfully", "success");
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        category: null,
        stockQuantity: 0,
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
      const updateData = {
        ...editingProduct,
        category: editingProduct.category,
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

  return (
    <ShopLayout>
    <div style={{marginTop:"-500px"}} className=" min-h-[calc(100vh-4rem)] bg-[#f1f5f9] p-6 font-cairo text-right">
     
      <div className="bg-white border p-4 rounded-2xl text-right mb-4">
                    <h1 className="text-3xl font-bold text-blue-500 flex items-center justify-end gap-2"><FiBox/>المنتجات </h1>
                
                  </div>

    
      <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto mb-8 shadow-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center justify-center gap-3">
          <FiSmartphone size={28} className="text-indigo-500" />
          {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
        </h2>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(editingProduct ? [editingProduct] : [newProduct]).map(
            (product, idx) => (
              <React.Fragment key={idx}>
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
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="السعر"
                  value={product.price}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          price: Number(e.target.value),
                        })
                      : setNewProduct({
                          ...newProduct,
                          price: Number(e.target.value),
                        })
                  }
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                  <option value="NEW">جديد</option>
                  <option value="USED">مستعمل</option>
                  <option value="REFURBISHED">مجدّد</option>
                </select>
                <input
                  type="number"
                  placeholder="الكمية المتاحة"
                  value={product.stockQuantity}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          stockQuantity: Number(e.target.value),
                        })
                      : setNewProduct({
                          ...newProduct,
                          stockQuantity: Number(e.target.value),
                        })
                  }
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                  <option value="">اختر الفئة</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </React.Fragment>
            )
          )}
        </div>

        
        <div className="mt-6 flex gap-3">
          <button
            onClick={editingProduct ? updateProduct : addProduct}
            className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-3xl  transition"
          >
            {editingProduct ? "تعديل المنتج" : "إضافة المنتج"}
          </button>
          {editingProduct && (
            <button
              onClick={() => setEditingProduct(null)}
              className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      
      <div className="bg-white p-6 rounded-2xl max-w-6xl mx-auto shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
          قائمة المنتجات
        </h2>
        <table className="min-w-full table-auto text-center border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-[#f1f5f9] text-blue-500">
            <tr>
              <th className="px-4 py-2">اسم المنتج</th>
              <th className="px-4 py-2">الحالة</th>
              <th className="px-4 py-2">السعر</th>
         

              <th className="px-4 py-2">المخزون</th>
              <th className="px-4 py-2">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 ">
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b hover:bg-gray-50 transition text-blue-950"
              >
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.condition}</td>
                <td className="px-4 py-2">{p.price} EGP</td>
               
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2 flex justify-center gap-2">
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="bg-transparent border text-amber-600 px-2 py-1 rounded-md hover:bg-amber-200 transition"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => updateStock(p.id, p.stock)}
                    className="bg-transparent border text-green-600 px-2 py-1 rounded-md hover:bg-green-200 transition"
                  >
                    <FiInbox />
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="bg-transparent border  text-red-600 px-2 py-1 rounded-md hover:bg-red-200 transition"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </ShopLayout>
  );
};

export default Products;