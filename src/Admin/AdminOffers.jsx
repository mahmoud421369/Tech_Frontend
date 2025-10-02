import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FiTrash2, FiPlus, FiList, FiEdit3, FiTag } from "react-icons/fi";

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");


  const fetchOffers = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/offers");
      if (!res.ok) throw new Error("Failed to fetch offers");
      const data = await res.json();
      setOffers(data.content || data || []);
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const saveOffer = async () => {
    if (!offerTitle.trim()) {
      Swal.fire("Error", "Title required", "error");
      return;
    }

    try {
      let res;
      if (editingOffer) {
        res = await fetch(
          `http://localhost:8080/api/admin/offers/${editingOffer.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: offerTitle,
              description: offerDescription,
            }),
          }
        );
      } else {
        res = await fetch("http://localhost:8080/api/admin/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: offerTitle,
            description: offerDescription,
          }),
        });
      }

      if (!res.ok) throw new Error("Failed to save offer");

      Swal.fire(
        "تم الحفظ",
        editingOffer ? "Offer updated successfully" : "Offer added successfully",
        "success"
      );
      setOfferTitle("");
      setOfferDescription("");
      setEditingOffer(null);
      setIsModalOpen(false);
      fetchOffers();
    } catch (err) {
      console.error("Error saving offer:", err);
      Swal.fire("Error", "Error saving offer", "error");
    }
  };


  const deleteOffer = async (id) => {
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
        `http://localhost:8080/api/admin/offers/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete offer");

      Swal.fire("Deleted", "Offer deleted successfully", "success");
      fetchOffers();
    } catch (err) {
      console.error("Error deleting offer:", err);
      Swal.fire("Error", "Error deleting offer", "error");
    }
  };

  const filteredOffers = offers.filter((o) =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
          style={{marginTop:"60px"}}
      className="space-y-6 p-6 max-w-8xl min-h-screen w-full mx-auto dark:bg-gray-900 bg-gray-50"
    >
      <div className= "flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700 border p-4 rounded-2xl text-left" >
        <div>
          <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2">
            <FiTag /> Offers
          </h1>
          <p className="text-gray-500">View,and Delete Offers</p>
        </div>
        {/* <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingOffer(null);
            setOfferTitle("");
            setOfferDescription("");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#f1f5f9] text-blue-500 rounded-3xl"
        >
          <FiPlus /> Add Offer
        </button> */}
      </div>

      <div className="bg-white  dark:bg-gray-800 dark:border-gray-700 border p-5 rounded-lg">
        <div className="relative flex-1 max-w-sm mb-4 text-right">
          <input
            type="text"
            placeholder="Search for offer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block dark:border-none dark:text-white dark:bg-gray-950 w-full rounded-3xl bg-gray-50 border cursor-pointer border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-white shadow overflow-hidden">
          <table className="min-w-full divide-y dark:divide-gray-700 divide-gray-200">
            <thead className="bg-[#f1f5f9] dark:bg-gray-700 dark:text-white text-blue-500">
              <tr>
                <th className="px-6 py-3 text-center font-medium uppercase">#</th>
                <th className="px-6 py-3 text-center font-medium uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-center font-medium uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-center font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 text-blue-500 dark:bg-gray-900 dark:text-gray-200">
              {filteredOffers.map((o) => (
                <tr key={o.id} className="text-center border-b dark:border-gray-700">
                  <td className="px-3 py-2 text-sm">{o.id}</td>
                  <td className="px-3 py-2 font-medium">{o.title}</td>
                  <td className="px-3 py-2">{o.description}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => {
                        setEditingOffer(o);
                        setOfferTitle(o.title);
                        setOfferDescription(o.description);
                        setIsModalOpen(true);
                      }}
                      className="p-2 m-2 bg-transparent border text-amber-600 rounded"
                    >
                      <FiEdit3 />
                    </button>
                    <button
                      onClick={() => deleteOffer(o.id)}
                      className="p-2 m-2 bg-transparent border text-red-600 rounded"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOffers.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No offers found
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
                {editingOffer ? "Edit Offer" : "Add new Offer"}
              </h3>
              <input
                type="text"
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Offer title"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder="Offer description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={saveOffer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;