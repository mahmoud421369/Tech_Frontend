import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  FiTrash2,
  FiEye,
  FiHome,
  FiTool,
  FiBox,
  FiXCircle,
  FiCheckCircle,
  FiEdit3,
} from "react-icons/fi";

const Shops = () => {
  const token = localStorage.getItem("authToken");

  const [shops, setShops] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");


  const getAllShops = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/shops");
      const data = await res.json();
      setShops(data.content || data);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const getApprovedShops = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/shops/approved");
      const data = await res.json();
      setShops(data.content || data);
    } catch (err) {
      console.error("Error fetching approved shops:", err);
    }
  };

  const getSuspendedShops = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/shops/suspend");
      const data = await res.json();
      setShops(data.content || data);
    } catch (err) {
      console.error("Error fetching suspended shops:", err);
    }
  };

  const searchShops = async () => {
    if (!search.trim()) {
      getAllShops();
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/shops/search?query=${search}`
      );
      const data = await res.json();
      setShops(data.content || data);
    } catch (err) {
      console.error("Error searching shops:", err);
    }
  };

  const approveShop = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/shops/${id}/approve`,
        { method: "PUT" }
      );
      if (res.ok) {
        Swal.fire("Approved!", "Shop has been approved.", "success");
        getAllShops();
      }
    } catch (err) {
      console.error("Error approving shop:", err);
    }
  };

  const suspendShop = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/shops/${id}/suspend`,
        { method: "PUT" }
      );
      if (res.ok) {
        Swal.fire("Suspended!", "Shop has been suspended.", "warning");
        getAllShops();
      }
    } catch (err) {
      console.error("Error suspending shop:", err);
    }
  };

  const deleteShop = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `http://localhost:8080/api/admin/shops/${id}`,
            { method: "DELETE" }
          );
          if (res.ok) {
            setShops((prev) => prev.filter((shop) => shop.id !== id));
            Swal.fire("Deleted!", "Shop has been deleted.", "success");
          }
        } catch (err) {
          console.error("Error deleting shop:", err);
        }
      }
    });
  };

  const viewShop = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/shops/${id}`);
      if (res.ok) {
        const shop = await res.json();
        Swal.fire({
          title: `Shop Details - ${shop.name}`,
          html: `
            <p class='text-left'><strong>ID:</strong> ${shop.id}</p>
            <p class='text-left'><strong>Email:</strong> ${shop.email}</p>
            <p class='text-left'><strong>Phone:</strong> ${shop.phone}</p>
            <p class='text-left'><strong>Status:</strong> ${
              shop.verified ? "Verified" : "Not Verified"
            }</p>
            <p class='text-left'><strong>Rating:</strong> ${shop.rating}</p>
            <p class='text-left'><strong>Description:</strong> ${shop.description}</p>

            <p class='text-left'><strong>Shop Type:</strong> ${shop.shopType}</p>
          `,
          icon: "info",
          confirmButtonText: "Close",
        });
      }
    } catch (err) {
      console.error("Error fetching shop:", err);
    }
  };


  const fetchRepairRequests = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/repair-requests");
      const data = await res.json();
      setRepairRequests(data.content || data);
    } catch (err) {
      console.error("Error fetching repair requests:", err);
    }
  };

 
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const updateProduct = async (product) => {
  try {
    const token = localStorage.getItem("authToken");

    // 1. Fetch categories
    const catRes = await fetch("http://localhost:8080/api/admin/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const catData = await catRes.json();
    const categories = catData.content || [];

    // 2. Build dropdown options for categories
    const categoryOptions = categories
      .map(
        (cat) =>
          `<option value="${cat.id}" ${
            product.category?.id === cat.id ? "selected" : ""
          }>${cat.name}</option>`
      )
      .join("");

    // 3. Conditions dropdown
    const conditionOptions = ["NEW", "USED", "REFURBISHED"]
      .map(
        (c) =>
          `<option value="${c}" ${
            product.condition === c ? "selected" : ""
          }>${c}</option>`
      )
      .join("");

    // 4. SweetAlert form
    const { value: formValues } = await Swal.fire({
      title: "Update Product",
      html: `
        <input id="name" class="swal2-input" value="${product.name}" placeholder="Name">
        <input id="description" class="swal2-input" value="${product.description}" placeholder="Description">
        <input id="price" type="number" class="swal2-input" value="${product.price}" placeholder="Price">
        <input id="imageUrl" type="text" class="swal2-input" value="${product.imageUrl}" placeholder="Image URL">

        <label class="swal2-label">Category</label>
        <select id="category" class="swal2-input">${categoryOptions}</select>

        <input id="stockQuantity" type="number" class="swal2-input" value="${product.stock}" placeholder="Stock Quantity">

        <label class="swal2-label">Condition</label>
        <select id="condition" class="swal2-input">${conditionOptions}</select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          name: document.getElementById("name").value,
          description: document.getElementById("description").value,
          ImageUrl: document.getElementById("imageUrl").value,
          category: document.getElementById("category").value, // store selected categoryId
          stockQuantity: Number(document.getElementById("stockQuantity").value),
          condition: document.getElementById("condition").value,
          price: parseFloat(document.getElementById("price").value),
        };
      },
    });

    if (!formValues) return;

    // 5. Update product request
    const res = await fetch(
      `http://localhost:8080/api/admin/products/${product.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      }
    );

    if (res.ok) {
      Swal.fire("Updated!", "Product updated successfully.", "success");
      fetchProducts();
    } else {
      Swal.fire("Error", "Failed to update product", "error");
    }
  } catch (err) {
    console.error("Error updating product:", err);
    Swal.fire("Error", "Something went wrong", "error");
  }
};

const deleteProduct = async (id) => {
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
    const token = localStorage.getItem("authToken");

    console.log("Deleting product with ID:", id); 

    const res = await fetch(`http://localhost:8080/api/admin/products/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    if (!res.ok) {
      let errorMsg = `Failed to delete product (status ${res.status})`;
      try {
        const errData = await res.json();
        errorMsg = errData.message || JSON.stringify(errData);
      } catch (err) {
      console.error("Error deleting product:", err);
       
      }
      throw new Error(errorMsg);
    }

    Swal.fire("Deleted!", "Product has been deleted.", "success");
    fetchProducts();
  } catch (err) {
    console.error("Error deleting product:", err);
    Swal.fire("Error", err.message, "error");
  }
};

 


const filteredShops = shops.filter(
  (shop) =>
    shop.name?.toLowerCase().includes(search.toLowerCase()) ||
    shop.email?.toLowerCase().includes(search.toLowerCase())
);
  useEffect(() => {
    if (filter === "approved") getApprovedShops();
    else if (filter === "suspended") getSuspendedShops();
    else getAllShops();
    fetchRepairRequests();
    fetchProducts();
  }, [filter]);

  return (
    <div style={{ marginLeft: "300px", marginTop: "-575px" }} className="p-6 bg-[#f1f5f9] space-y-10">

    
         <div className="bg-white border p-4 rounded-2xl text-left">
              <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><FiHome/>Shops Managament </h1>
              <p className="text-blue-500">Monitor and manage all the shops,approve or suspend shops,and view details of each</p>
            </div>
      <section className="bg-white p-5 rounded-lg">
    

      
        <div className="flex justify-between flex-row-reverse items-center mb-4">
          <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2"
          />
    
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#f1f5f9] text-blue-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium uppercase">ID</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Shop type</th>

              <th className="px-6 py-3 text-center font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500">
            {filteredShops.map((shop) => (
              <tr key={shop.id} className="text-left border-b">
                <td className="px-3 py-2">{shop.id}</td>
                <td className="px-3 py-2">{shop.name}</td>
                <td className="px-3 py-2">
                  {!shop.verified ? <p className="bg-indigo-50 text-indigo-500 font-bold text-xs px-3 py-2 rounded-3xl inline-block">Suspended</p> : <p className="bg-emerald-50 text-emerald-500 font-bold text-xs px-3 py-2 rounded-3xl inline-block">Active</p>}
                </td>
                <td className="px-3 py-2">{shop.shopType}</td>

                <td className="px-3 py-2 flex gap-2 justify-center">
                  <button
                    onClick={() => viewShop(shop.id)}
                    className="border text-blue-600 px-3 py-1 rounded-3xl flex items-center gap-1"
                  >
                    <FiEye /> 
                  </button>
                  { !shop.verified ?
                  <button
                    onClick={() => approveShop(shop.id)}
                    className="border text-green-600 px-3 py-1 rounded-3xl"
                  >
                    <FiCheckCircle/>
                  </button>
 :
                  <><button
                      onClick={() => suspendShop(shop.id)}
                      className="border text-yellow-600 px-3 py-1 rounded-3xl"
                    >
                      <FiXCircle />
                    </button><button
                      onClick={() => deleteShop(shop.id)}
                      className=" text-red-600 px-3 border py-1 rounded-3xl flex items-center gap-1"
                    >
                        <FiTrash2 />
                      </button></>
}
               

                </td>
              </tr>
            ))}
            {shops.length === 0 && (
              <tr>
                <td colSpan="12" className="py-4 text-center italic">
                  No shops found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

    

         <div className="bg-white border p-4 rounded-2xl text-left mb-4">
              <h1 className="text-3xl font-bold text-indigo-500 flex items-center gap-2"><FiTool/>Repair Requests </h1>
              <p className="text-indigo-500">Monitor and view all repair requests of shops</p>
            </div>
      <section className="bg-white rounded-lg p-5">
     
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-blue-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium uppercase">ID</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Shop ID</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Issue</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Delivery Method</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Payment Method</th>

            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500" >
            {repairRequests.map((req) => (
              <tr key={req.id} className="text-left border-b">
                <td className="px-3 py-2">{req.id}</td>
                <td className="px-3 py-2">{req.shopId}</td>
                <td className="px-3 py-2">{req.description}</td>
                <td className="px-3 py-2">{req.deliveryMethod}</td>
                <td className="px-3 py-2">{req.status}</td>
                
                <td className="px-3 py-2 text-center">{req.paymentMethod}</td>

              </tr>
            ))}
            {repairRequests.length === 0 && (
              <tr>
                <td colSpan="12" className="py-4 text-center  italic">
                  No repair requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      
               <div className="bg-white border p-4 rounded-2xl text-left mb-4">
              <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2"><FiBox/>Products </h1>
              <p className="text-red-500">Monitor and manage customer reviews</p>
            </div>
      <section className="bg-white rounded-lg p-5">
     
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#f1f5f9] text-blue-500">
            <tr>
              <th className="px-6 py-3 text-center font-medium uppercase">ID</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Price</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Condition</th>
  
              <th className="px-6 py-3 text-center font-medium uppercase">Stock</th>

              <th className="px-6 py-3 text-center font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500" >
            {products.map((p) => (
              <tr key={p.id} className="text-center border-b">
                <td className="px-3 py-2">{p.id}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.price} EGP</td>
                <td className="px-3 py-2">{p.condition} </td>
                <td className="px-3 py-2">{p.stock} items </td>

                <td className="px-3 py-2 flex gap-2 justify-center">
                  <button
                    onClick={() => updateProduct(p)}
                    className="border text-green-600 px-3 py-1 rounded-3xl"
                  >
                    <FiEdit3/>
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="border text-red-600 px-3 py-1 rounded-3xl flex items-center gap-1"
                  >
                    <FiTrash2 /> 
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="12" className="py-4 text-center italic">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Shops;