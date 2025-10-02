import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import Swal from "sweetalert2";

const RepairsForAssignment = () => {
  const token = localStorage.getItem("authToken");
  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [notes, setNotes] = useState("");
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch repairs for assignment
  const fetchRepairs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/assigner/repairs-for-assignment", {
        headers: { Authorization: `Bearer ${token}`},
      });
      
      if (!response.ok) throw new Error("Failed to fetch repairs");
      
      const data = await response.json();
      setRepairs(data.content || data || []);
    } catch (error) {
      console.error("Error fetching repairs:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load repairs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch delivery persons
  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/assigner/delivery-persons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch delivery persons");
      
      const data = await response.json();
      setDeliveryPersons(data.content || data || []);
    } catch (error) {
      console.error("Error fetching delivery persons:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load delivery persons",
      });
    }
  };

  // Assign repair to delivery person
  const assignRepair = async (deliveryId) => {
    // Validate IDs before sending
    if (!selectedRepair?.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid repair ID. Please try selecting the repair again.",
      });
      return;
    }

    if (!deliveryId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid delivery person ID. Please try again.",
      });
      return;
    }

    try {
      setIsAssigning(true);
      
      console.log("Sending assignment request:", {
        repairRequestId: selectedRepair.id,
        deliveryId: deliveryId,
        notes: notes
      });

      const response = await fetch("http://localhost:8080/api/assigner/assign-repair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repairRequestId: selectedRepair.id,
          deliveryId: deliveryId,
          notes: notes,
        }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(errorText || `Assignment failed with status: ${response.status}`);
      }

      // Handle successful response
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = responseText ? JSON.parse(responseText) : { message: "Repair assigned successfully" };
      } catch (parseError) {
        responseData = { message: responseText || "Repair assigned successfully" };
      }

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: responseData.message || "Repair assigned successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedRepair(null);
      setNotes("");
      // Refresh the repairs list after assignment
      await fetchRepairs();
      
    } catch (error) {
      console.error("Error assigning repair:", error);
      
      // Parse the error message to show user-friendly message
      let errorMessage = "Failed to assign repair";
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || error.message;
      } catch {
        errorMessage = error.message || "Failed to assign repair";
      }

      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: errorMessage,
        footer: errorMessage.includes("id must not be null") 
          ? "Please check that both repair and delivery person are properly selected."
          : null
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter repairs based on search term
  const filteredRepairs = repairs.filter(repair => 
    repair.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.shopId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.price?.toString().includes(searchTerm) ||
    repair.userAddress?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.userAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.shopAddress?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.shopAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepairs = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    fetchRepairs();
    fetchDeliveryPersons();
  }, [token]);

  const handleAssignClick = (repair) => {
    if (!repair?.id) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Repair",
        text: "This repair has an invalid ID and cannot be assigned.",
      });
      return;
    }
    
    setSelectedRepair(repair);
    setNotes(""); // Reset notes when opening modal
  };

  const handleCloseModal = () => {
    setSelectedRepair(null);
    setNotes("");
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING_PICKUP': 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'ASSIGNED': 'bg-purple-100 text-purple-800',
      'IN_TRANSIT': 'bg-indigo-100 text-indigo-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || statusColors.default;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">Repairs for Assignment</h2>
          <p className="text-blue-700">Manage and assign repair requests to delivery personnel</p>
        </div>

        {/* Search and Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search by user, shop, address, status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-blue-800">
              <span className="bg-blue-100 px-3 py-1 rounded-full">
                Total: {repairs.length}
              </span>
              <span className="bg-green-100 px-3 py-1 rounded-full text-green-800">
                Filtered: {filteredRepairs.length}
              </span>
              <span className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800">
                Page: {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Repairs Grid */}
        {!isLoading && currentRepairs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-blue-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              {repairs.length === 0 ? "No repairs available" : "No repairs found"}
            </h3>
            <p className="text-blue-700">
              {searchTerm ? "Try adjusting your search terms" : "All repairs have been assigned or no repairs are pending"}
            </p>
          </div>
        ) : (
          !isLoading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100"
                  >
                    <div className="p-6">
                      {/* Header with Status */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">
                            Repair #{repair.id ? repair.id.slice(-8) : 'N/A'}
                          </h3>
                          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(repair.status)}`}>
                            {repair.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{repair.price || '0'} EGP</div>
                          <div className="text-xs text-blue-500">Price</div>
                        </div>
                      </div>

                      {/* Repair Details */}
                      <div className="space-y-3 mb-4">
                        <div className="text-sm">
                          <div className="flex items-center text-blue-800 mb-1">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <strong>User ID:</strong> {repair.userId || 'N/A'}
                          </div>
                          
                          <div className="flex items-center text-blue-800 mb-1">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <strong>Shop ID:</strong> {repair.shopId || 'N/A'}
                          </div>

                          {/* Address Information */}
                          {repair.userAddress && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                              <strong>User Address:</strong> {repair.userAddress.street}, {repair.userAddress.city}, {repair.userAddress.state}
                            </div>
                          )}
                          
                          {repair.shopAddress && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
                              <strong>Shop Address:</strong> {repair.shopAddress.street}, {repair.shopAddress.city}, {repair.shopAddress.state}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            Created: {formatDate(repair.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleAssignClick(repair)}
                        disabled={isLoading || !repair.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {!repair.id ? "Invalid Repair" : "Assign Repair"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === number
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )
        )}

        {/* Assignment Modal */}
        {selectedRepair && (
          <Modal onClose={handleCloseModal} title="Assign Repair">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Repair Details</h4>
                <p className="text-sm text-blue-700"><strong>Repair ID:</strong> {selectedRepair.id || 'N/A'}</p>
                <p className="text-sm text-blue-700"><strong>User ID:</strong> {selectedRepair.userId || 'N/A'}</p>
                <p className="text-sm text-blue-700"><strong>Shop ID:</strong> {selectedRepair.shopId || 'N/A'}</p>
                <p className="text-sm text-blue-700"><strong>Price:</strong> ${selectedRepair.price || '0'}</p>
                <p className="text-sm text-blue-700"><strong>Status:</strong> {selectedRepair.status || 'N/A'}</p>
                
                {selectedRepair.userAddress && (
                  <p className="text-sm text-blue-700">
                    <strong>User Address:</strong> {selectedRepair.userAddress.street}, {selectedRepair.userAddress.city}, {selectedRepair.userAddress.state}
                  </p>
                )}
                
                {selectedRepair.shopAddress && (
                  <p className="text-sm text-blue-700">
                    <strong>Shop Address:</strong> {selectedRepair.shopAddress.street}, {selectedRepair.shopAddress.city}, {selectedRepair.shopAddress.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Assignment Notes:</label>
                <textarea
                  className="w-full border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any special instructions, delivery notes, or important information for the delivery person..."
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold text-blue-900 mb-3">Choose Delivery Person:</h3>
                
                {deliveryPersons.length === 0 ? (
                  <div className="text-center py-4 text-blue-700">
                    <p>No delivery persons available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {deliveryPersons.map((deliveryPerson) => (
                      <button
                        key={deliveryPerson.id}
                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        onClick={() => assignRepair(deliveryPerson.id)}
                        disabled={isAssigning || !deliveryPerson.id}
                      >
                        <div className="font-medium text-blue-900">
                          {deliveryPerson.name || 'Unknown Name'}
                          {!deliveryPerson.id && <span className="text-red-500 text-xs ml-2">(Invalid ID)</span>}
                        </div>
                        <div className="text-sm text-blue-600">ID: {deliveryPerson.id || 'N/A'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {isAssigning && (
                <div className="flex justify-center items-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-blue-600">Assigning repair...</span>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default RepairsForAssignment;