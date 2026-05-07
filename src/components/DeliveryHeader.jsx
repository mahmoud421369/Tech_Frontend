import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  FiMoon, FiSun, FiUser, FiLogOut, FiMenu, FiX,
  FiPackage, FiTool, FiHome, FiClipboard, FiSettings,
  FiChevronDown, FiGrid, FiBell, FiZap, FiTruck, FiActivity
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo-bg.png";




const MENU_GROUPS = [
  {
    label: "Main Dashboard",
    items: [
      { name: "Console",           path: "/delivery/dashboard",                icon: <FiHome size={18} />      },
    ]
  },
  {
    label: "Availability",
    items: [
      { name: "Orders",       path: "/delivery/available-orders",         icon: <FiPackage size={18} />   },
      { name: "Repairs",      path: "/delivery/available-repair-requests",icon: <FiTool size={18} />      },
    ]
  },
  {
    label: "My Assignments",
    items: [
      { name: "Assigned Orders",   path: "/delivery/my-deliveries",            icon: <FiClipboard size={18} /> },
      { name: "Assigned Repairs",  path: "/delivery/my-repairs",               icon: <FiTool size={18} />      },
    ]
  },
  {
    label: "Management",
    items: [
      { name: "Agent Profile",     path: "/delivery/profile",                  icon: <FiSettings size={18} />  },
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




const NavLink = memo(({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden
      ${active
        ? "bg-lime-500 text-white shadow-lg shadow-lime-500/20 active:scale-95"
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




const DeliveryHeader = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [token, setToken]               = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile]   = useState(null);

 
  

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDark = useCallback(() => setDarkMode(d => !d), []);

  

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      if (!userProfile) {
       
        
        setUserProfile({ name: "Delivery Agent", email: "Active Personnel" });
        api.get('/api/delivery/profile', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setUserProfile(res.data))
          .catch(() => {});
      }
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      navigate("/login");
    }
  }, [token, navigate, userProfile]);


  
  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const { isConfirmed } = await Swal.fire({
      title: "Confirm Logout",
      text: "Ending your delivery session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#84cc16",
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
  }, [token, navigate, darkMode]);

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[60] lg:hidden transition-all duration-500" onClick={closeSidebar} aria-hidden="true" />
      )}

      
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white/80 dark:bg-gray-900/90 backdrop-blur-2xl border-r border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        
        <div className="relative h-20 flex items-center justify-between px-6 border-b border-gray-50 dark:border-gray-800/50">
          <Link to="/delivery/dashboard" className="flex items-center gap-2 group" onClick={closeSidebar}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-lime-500/20">
              <FiTruck className="text-white" size={20} />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Delivery<span className="text-lime-500">Hub</span></span>
          </Link>
          <button onClick={closeSidebar} className="lg:hidden p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all">
            <FiX size={18} />
          </button>
        </div>

      
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar-thin space-y-8">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{group.label}</h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <NavLink key={item.name} item={item} active={isActive(item.path)} onClick={closeSidebar} />
                ))}
              </div>
            </div>
          ))}
        </div>

       
        <div className="p-4 mt-auto border-t border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/20">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-4 space-y-3">
          
            <div className="flex gap-2">
              <button onClick={toggleDark} className="flex-1 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-lime-500 transition-all">
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
          
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-lime-500 hover:text-white transition-all shadow-sm">
            <FiMenu size={20} />
          </button>
          
          <div className="hidden sm:block">
     <img
                                     src={logo}
                                     alt="Tech & Bazaar"
                                     className="h-16 w-auto rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                                     style={{ transform: "scale(1.35)", transformOrigin: "left center" }}
                                   />
           
          </div>
        </div>

        
        <div className="flex items-center gap-3">
        
          
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-800 mx-1" />

          <Link to="/delivery/profile" className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-lime-500 transition-colors">
              <FiUser size={18} />
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{userProfile?.name?.split(' ')[0] || "Agent"}</p>
              <p className="text-[9px] font-bold text-gray-400">View Profile</p>
            </div>
          </Link>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </>
  );
};

export default memo(DeliveryHeader);