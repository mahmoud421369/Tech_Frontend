import React, { useState } from "react"

import { FiSearch,FiMessageSquare,FiClock,FiCheckCircle,FiChevronLeft,FiChevronRight } from "react-icons/fi"
const Support = ({darkMode}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1);
    const requestsPerPage = 5;
  const supportRequests = [
    {
      id: "SUP-001",
      customer: "John Doe",
      subject: "Delayed repair delivery",
      priority: "high",
      status: "open",
      date: "2024-01-20",
      lastUpdate: "2024-01-20",
      assignedTo: "Sarah Admin",
    },
    {
      id: "SUP-002",
      customer: "Jane Smith",
      subject: "Refund request for cancelled service",
      priority: "medium",
      status: "in_progress",
      date: "2024-01-19",
      lastUpdate: "2024-01-21",
      assignedTo: "Mike Support",
    },
    {
      id: "SUP-003",
      customer: "Mike Johnson",
      subject: "Question about warranty coverage",
      priority: "low",
      status: "resolved",
      date: "2024-01-18",
      lastUpdate: "2024-01-19",
      assignedTo: "Lisa Help",
    },
    {
      id: "SUP-004",
      customer: "Sarah Wilson",
      subject: "Complaint about repair quality",
      priority: "high",
      status: "open",
      date: "2024-01-17",
      lastUpdate: "2024-01-17",
      assignedTo: "Tom Manager",
    },
    {
      id: "SUP-005",
      customer: "Tom Brown",
      subject: "Unable to track repair status",
      priority: "medium",
      status: "open",
      date: "2024-01-16",
      lastUpdate: "2024-01-16",
      assignedTo: "Sarah Admin",
    },
  ]

  const filteredRequests = supportRequests.filter((request) => {
    const matchesSearch =
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })


  

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Open</span>
      case "in_progress":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">In Progress</span>
      case "resolved":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Resolved</span>
      default:
        return <span className="border px-2 py-1 rounded text-xs">{status}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">High</span>
      case "medium":
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Medium</span>
      case "low":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Low</span>
      default:
        return <span className="border px-2 py-1 rounded text-xs">{priority}</span>
    }
  }

  return (
    <div style={{marginTop:"-550px",marginLeft:"300px"}} className="p-6 space-y-6 font-cairo">
      <div className="bg-[#f1f5f9] p-4 m-2 border-l-4 border-blue-600 text-blue-500 text-right">
        <h1 className="text-3xl font-bold text-blue-600">الدعم</h1><br />
        <p className="text-gray-400 text-sm font-bold">يمكنك الاطلاع علي جميع مشاكل واستفسارات العميل من هنا</p>
      </div>

      <div className="bg-white shadow rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="...ابحث في طلبات الدعم"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 text-right py-2 border rounded-md cursor-pointer  focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-[#f1f5f9] px-6 py-3 text-center text-xs   text-blue-600 uppercase tracking-wider">
                <th className="p-2">رقم الطلب</th>
                <th className="p-2">العميل</th>
                <th className="p-2">محتوي الطلب</th>
                <th className="p-2">حجم المشكلة</th>
                <th className="p-2">حالة الطلب</th>
      
                <th className="p-2">أخر تحديث للطلب</th>
                <th className="p-2">اتخاذ قرار</th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 text-center divide-y divide-gray-200">
              {currentRequests.map((request) => (
                <tr key={request.id} className="border-b text-sm">
                  <td className="p-2 font-medium">{request.id}</td>
                  <td className="p-2">{request.customer}</td>
                  <td className="p-2 max-w-[200px] truncate">{request.subject}</td>
                  <td className="p-2">{getPriorityBadge(request.priority)}</td>
                  <td className="p-2">{getStatusBadge(request.status)}</td>
                  <td className="p-2">{request.lastUpdate}</td>
                  <td className="p-2 space-x-2">
                    <button className="inline-flex items-center px-2 py-1 border rounded hover:bg-gray-100 text-sm">
                      <FiMessageSquare className="h-4 w-4" />
                    </button>

                    {request.status === "open" && (
                      <button className="inline-flex items-center px-2 py-1 border text-blue-600 rounded hover:bg-blue-50 text-sm">
                        <FiClock className="h-4 w-4" />
                      </button>
                    )}

                    {request.status !== "resolved" && (
                      <button className="inline-flex items-center px-2 py-1 border text-green-600 rounded hover:bg-green-50 text-sm">
                        <FiCheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>





                  <div className={`flex items-center justify-between w-auto p-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div>
                      Showing {indexOfFirstRequest + 1} to {Math.min(indexOfLastRequest, filteredRequests.length)} of {filteredRequests.length} requests
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



        </div>
      </div>
    </div>
  )
}

export default Support