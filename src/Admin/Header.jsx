import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiUser, FiLogOut, FiMenu, FiX,
  FiActivity, FiUsers, FiBox, FiTool, FiClipboard, FiRefreshCw, FiSearch,
  FiChevronDown, FiBell, FiSettings, FiGrid, FiArchive, FiTag, FiStar, FiShoppingBag, FiTruck, FiLayers, FiCreditCard
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/final-logobg.webp";





const MENU_GROUPS = [
  {
    label: "Core Administration",
    items: [
      { name: "Dashboard", path: "/admin/dashboard", icon: <FiActivity size={18} /> },
      { name: "Users", path: "/admin/users", icon: <FiUsers size={18} /> },
      { name: "Categories", path: "/admin/category", icon: <FiLayers size={18} /> },
      { name: "Transactions", path: "/admin/transactions", icon: <FiCreditCard size={18} /> },
    ]
  },
  {
    label: "Shop Ecosystem",
    items: [
      { name: "Stores", path: "/admin/shops", icon: <FiShoppingBag size={18} /> },
      { name: "Subscriptions", path: "/admin/subscriptions", icon: <FiSettings size={18} /> },
      { name: "Products", path: "/admin/products", icon: <FiBox size={18} /> },
      { name: "Repair Requests", path: "/admin/repair-requests", icon: <FiTool size={18} /> },
      { name: "Offers", path: "/admin/offers", icon: <FiTag size={18} /> },
      { name: "Reviews", path: "/admin/reviews", icon: <FiStar size={18} /> },
    ]
  },
  {
    label: "Logistics Management",
    items: [
      { name: "Delivery Network", path: "/admin/deliveries", icon: <FiTruck size={18} /> },
      { name: "Assigners", path: "/admin/assigners", icon: <FiUsers size={18} /> },
      { name: "Assignment Logs", path: "/admin/assignment-logs", icon: <FiClipboard size={18} /> },
    ]
  }
];



const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch { return true; }
};

const AdminBadgeIllustration = memo(() => (
  <svg viewBox="0 0 44 44" className="w-full h-full">
    <path d="M22 4 L38 10 V21 C38 30 31 37 22 40 C13 37 6 30 6 21 V10 Z" fill="rgba(52,211,153,0.14)" stroke="#10b981" strokeWidth="2" />
    <path d="M15 21 L20 26 L30 14" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const SearchEmptyIllustration = memo(() => (
  <svg viewBox="0 0 120 100" className="w-20 h-16 mx-auto">
    <ellipse cx="60" cy="86" rx="32" ry="5" fill="rgba(0,0,0,0.05)" className="dark:fill-white/5" />
    <circle cx="52" cy="42" r="22" fill="none" stroke="#10b981" strokeWidth="3" className="dark:stroke-emerald-400" />
    <path d="M68 58 L82 72" stroke="#10b981" strokeWidth="4" strokeLinecap="round" className="dark:stroke-emerald-400" />
    <path d="M44 42 H60" stroke="#d1d5db" strokeWidth="2.4" strokeLinecap="round" className="dark:stroke-gray-600" />
    <circle cx="96" cy="20" r="2.2" fill="#fbbf24" />
  </svg>
));


const NavLink = memo(({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden
      ${active
        ? "bg-emerald-400 text-white shadow-lg shadow-emerald-400/20 active:scale-95"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
  >
    <span className={`flex-shrink-0 transition-transform duration-500 ${active ? "scale-110" : "group-hover:scale-110 group-hover:rotate-6"}`}>
      {item.icon}
    </span>
    <span className="relative z-10">{item.name}</span>
    {active && (
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    )}
  </Link>
));




const Header = ({ darkMode: darkModeProp, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [localDarkMode, setLocalDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const tokenRef = useRef(localStorage.getItem("authToken"));
 

  const darkMode = darkModeProp !== undefined ? darkModeProp : localDarkMode;


  

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    if (toggleDarkMode) toggleDarkMode(next);
    else setLocalDarkMode(next);
  }, [darkMode, toggleDarkMode]);

 
  

  useEffect(() => {
    const token = tokenRef.current;
    if (token && !isTokenExpired(token)) {
      
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  }, [navigate]);

 
  
  const handleLogout = useCallback(async () => {
    const token = tokenRef.current;
    const refreshToken = localStorage.getItem("refreshToken");
    const { isConfirmed } = await Swal.fire({
      title: "Confirm Logout",
      text: "Ending your administrative session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34d399",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Logout Now",
      background: darkMode ? '#111827' : '#fff',
      color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      if (token && refreshToken) await api.post("/api/auth/logout", { refreshToken }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {  }
    localStorage.clear();
    navigate("/login");
  }, [navigate, darkMode]);

  const isActive = (path) => location.pathname === path;
  const closeSidebar = () => setSidebarOpen(false);

  const filteredGroups = useMemo(() => MENU_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  })), [searchQuery]);
  const hasAnyResults = filteredGroups.some(g => g.items.length > 0);

  return (
    <>
      
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[60] lg:hidden transition-all duration-500" onClick={closeSidebar} aria-hidden="true" />
      )}

      
      
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-gray-900/90 backdrop-blur-2xl border-r border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        
        
        <div className="relative h-20 flex items-center justify-between px-6 border-b border-gray-50 dark:border-gray-800/50">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group" onClick={closeSidebar}>
            <div className="w-9 h-9 flex-shrink-0 group-hover:rotate-12 transition-transform duration-500">
              <AdminBadgeIllustration />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Tech<span className="text-emerald-400">Restore</span></span>
          </Link>
          <button onClick={closeSidebar} className="lg:hidden p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all">
            <FiX size={18} />
          </button>
        </div>

       
       
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar-thin space-y-8">
         
         
          <div className="relative group px-2">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Quick Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-emerald-200 dark:focus:border-emerald-900/50 text-xs font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/5 transition-all"
            />
          </div>

          {hasAnyResults ? (
            filteredGroups.map((group, idx) => (
              group.items.length > 0 && (
                <div key={idx} className="space-y-2">
                  <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{group.label}</h3>
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <NavLink key={item.name} item={item} active={isActive(item.path)} onClick={closeSidebar} />
                    ))}
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="px-4 py-6 text-center space-y-2">
              <SearchEmptyIllustration />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching pages</p>
            </div>
          )}
        </div>

        
        
        <div className="p-4 mt-auto border-t border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/20">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-4 space-y-3">
            <div className="flex gap-2">
              <button onClick={toggleDark} className="flex-1 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-all">
                {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
              <button onClick={handleLogout} className="flex-1 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all">
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

     
     
      <header className="fixed top-0 left-0 right-0 h-20 z-[40] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-50 dark:border-gray-800 flex items-center justify-between px-6 lg:pl-[280px] transition-all duration-500">
        <div className="flex items-center gap-4">
          
          
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-emerald-400 hover:text-white transition-all shadow-sm">
            <FiMenu size={20} />
          </button>

          <div className="hidden sm:block">
             <img
                         src={logo}
                         alt="Tech & Restore"
                         className="h-16 w-auto rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                         style={{ transformOrigin: "left center" }}
                       />
          </div>
        </div>

      
      
      </header>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #34d399; }
      `}} />
    </>
  );
};

export default Header;