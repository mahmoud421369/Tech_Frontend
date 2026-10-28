import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiLogOut, FiMenu, FiX, FiActivity, FiUsers, FiBox, FiTool,
  FiClipboard, FiSearch, FiSettings, FiTag, FiStar, FiShoppingBag, FiTruck,
  FiLayers, FiCreditCard, FiChevronRight, FiTrash2,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../common/api/api";
import logo from "../../common/images/tech-restore-logo.webp";

let swalPromise = null;
const loadSwal = () => (swalPromise ||= import("sweetalert2").then((m) => m.default));

const ICON = 18;
const YEAR = new Date().getFullYear();

const NAV_ITEMS = [
  { name: "Dashboard", path: "/admin/dashboard", icon: FiActivity },
  { name: "Users", path: "/admin/users", icon: FiUsers },
  { name: "Categories", path: "/admin/category", icon: FiLayers },
  { name: "Transactions", path: "/admin/transactions", icon: FiCreditCard },
  { name: "Stores", path: "/admin/shops", icon: FiShoppingBag },
  { name: "Subscriptions", path: "/admin/subscriptions", icon: FiSettings },
  { name: "Products", path: "/admin/products", icon: FiBox },
  { name: "Repair Requests", path: "/admin/repair-requests", icon: FiTool },
  { name: "Offers", path: "/admin/offers", icon: FiTag },
  { name: "Reviews", path: "/admin/reviews", icon: FiStar },
  { name: "Delivery Network", path: "/admin/deliveries", icon: FiTruck },
  { name: "Assigners", path: "/admin/assigners", icon: FiUsers },
  { name: "Assignment Logs", path: "/admin/assignment-logs", icon: FiClipboard },
];
const SEARCH_INDEX = NAV_ITEMS.map((item) => ({ item, key: item.name.toLowerCase() }));
const PAGE_TITLES = Object.fromEntries(NAV_ITEMS.map((i) => [i.path, i.name]));
PAGE_TITLES["/admin/dashboard"] = "Dashboard Overview";

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };

const NB_CSS = `
html,body{overflow-x:hidden;max-width:100vw}
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#e6eae8;--nb-shadow:#e6eae8;--nb-gray:#f1f3f2;--nb-dot:#e6eae8;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-surface{background:var(--nb-card);color:var(--nb-ink)}
.nb-muted{color:var(--nb-muted)}
.nb-line{border-color:var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
:where(.nb-btn){display:inline-flex}
.nb-btn{align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn-sun{background:#f59e0b;color:#1f1300}
.nb-btn-moon{background:#6366f1;color:#ffffff}
.nb-btn-danger{background:#ef4444;color:#ffffff}
.nb-btn:focus-visible,.nb-field:focus-within,.nb-link:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
:where(.nb-opt){display:flex}
.nb-opt{width:100%;align-items:center;gap:10px;padding:9px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-btn);color:var(--nb-on)}
:where(.nb-link){display:flex}
.nb-link{align-items:center;gap:12px;padding:9px 12px;border:2px solid transparent;font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:var(--nb-ink);transition:transform .12s ease,background-color .12s ease}
.nb-link:hover{background:var(--nb-gray);border:2px dotted var(--nb-dot)}
.nb-link-on,.nb-link-on:hover{background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.custom-scrollbar-thin{scrollbar-width:thin;scrollbar-color:rgba(52,211,153,.6) transparent}
.custom-scrollbar-thin::-webkit-scrollbar{width:5px}
.custom-scrollbar-thin::-webkit-scrollbar-track{background:transparent}
.custom-scrollbar-thin::-webkit-scrollbar-thumb{background:rgba(52,211,153,.55)}
.custom-scrollbar-thin::-webkit-scrollbar-thumb:hover{background:#34d399}
@media (prefers-reduced-motion:reduce){.nb-btn,.nb-link{transition:none}}
`;

const ensureAssets = () => {
  if (typeof document === "undefined") return;
  if (!document.getElementById("nb-font")) {
    [["https://fonts.googleapis.com", false], ["https://fonts.gstatic.com", true]].forEach(([href, cors]) => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = href;
      if (cors) l.crossOrigin = "";
      document.head.appendChild(l);
    });
    const link = document.createElement("link");
    link.id = "nb-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
  if (!document.getElementById("nb-css")) {
    const style = document.createElement("style");
    style.id = "nb-css";
    style.textContent = NB_CSS;
    document.head.appendChild(style);
  }
};
ensureAssets();

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const tidyRole = (r) => {
  const role = String(r || "Admin").replace(/^ROLE_/i, "");
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const readProfile = (token) => {
  try {
    const d = jwtDecode(token);
    const name = d.name || d.fullName || d.username || d.sub || d.email || "Admin";
    const role = d.role || (Array.isArray(d.roles) ? d.roles[0] : "");
    return { name: String(name).split("@")[0], role: tidyRole(role) };
  } catch {
    return { name: "Admin", role: "Admin" };
  }
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const readAdminId = (token) => {
  try {
    const d = jwtDecode(token);
    const id = d.id || d.userId || d.uid || d.sub;
    return id && SAFE_ID.test(String(id)) ? String(id) : null;
  } catch {
    return null;
  }
};

const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

const clearSession = (darkMode) => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  writeStorage("darkMode", String(darkMode));
};

const SidebarLink = memo(({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`nb-link ${active ? "nb-link-on" : ""}`}
    >
      <Icon size={ICON} aria-hidden="true" className="flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
});

const SidebarNav = memo(({ pathname, onClick }) => (
  <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1.5 custom-scrollbar-thin">
    {NAV_ITEMS.map((item) => (
      <SidebarLink key={item.path} item={item} active={pathname === item.path} onClick={onClick} />
    ))}
  </nav>
));

const ThemeSwitch = memo(({ darkMode, onLight, onDark }) => (
  <div role="group" aria-label="Theme" className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={onLight}
      aria-pressed={!darkMode}
      className={`nb-btn py-1.5 text-xs uppercase ${!darkMode ? "nb-btn-sun" : ""}`}
    >
      <FiSun size={14} aria-hidden="true" /> Light
    </button>
    <button
      type="button"
      onClick={onDark}
      aria-pressed={darkMode}
      className={`nb-btn py-1.5 text-xs uppercase ${darkMode ? "nb-btn-moon" : ""}`}
    >
      <FiMoon size={14} aria-hidden="true" /> Dark
    </button>
  </div>
));

const ProfileBadge = memo(({ name, role }) => (
  <div className="nb-field hidden md:block h-10 px-3 flex-shrink-0 leading-tight text-left">
    <span className="block pt-1 text-xs font-extrabold uppercase truncate max-w-[140px]">{name}</span>
    <span className="nb-muted block text-[10px] font-bold">{role}</span>
  </div>
));

const DeleteButton = memo(({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Delete account"
    className="nb-btn nb-btn-danger h-10 px-3 flex-shrink-0 text-xs uppercase"
  >
    <FiTrash2 size={16} aria-hidden="true" />
    <span className="hidden sm:inline">Delete</span>
  </button>
));

const SearchBox = memo(({ onNavigate }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < SEARCH_INDEX.length && out.length < 6; i++) {
      if (SEARCH_INDEX[i].key.includes(q)) out.push(SEARCH_INDEX[i].item);
    }
    return out;
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const goTo = useCallback((path) => {
    onNavigate(path);
    setQuery("");
    setOpen(false);
  }, [onNavigate]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && results[0]) goTo(results[0].path);
    if (e.key === "Escape") { setQuery(""); setOpen(false); }
  }, [results, goTo]);

  const onChange = useCallback((e) => { setQuery(e.target.value); setOpen(true); }, []);
  const onFocus = useCallback(() => setOpen(true), []);

  return (
    <div ref={ref} role="search" className="relative w-full max-w-md">
      <div className="nb-field flex h-10 items-center gap-2 px-3">
        <FiSearch size={16} aria-hidden="true" className="flex-shrink-0" />
        <label htmlFor="admin-search" className="sr-only">Search pages</label>
        <input
          id="admin-search"
          type="text"
          value={query}
          placeholder="Search pages..."
          maxLength={40}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        />
      </div>

      {open && query.trim() && (
        <div className="nb-menu absolute inset-x-0 top-12 z-10 overflow-hidden">
          {results.length ? results.map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.path} type="button" onClick={() => goTo(r.path)} className="nb-opt">
                <Icon size={16} aria-hidden="true" className="flex-shrink-0" />
                <span className="flex-1 truncate">{r.name}</span>
                <FiChevronRight size={14} aria-hidden="true" />
              </button>
            );
          }) : (
            <p className="nb-muted px-4 py-3 text-sm font-semibold">No matching pages</p>
          )}
        </div>
      )}
    </div>
  );
});

const Header = ({ darkMode: darkModeProp, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tokenRef = useRef(readStorage("authToken"));
  const busyRef = useRef(false);

  const controlled = darkModeProp !== undefined && typeof toggleDarkMode === "function";
  const [localDark, setLocalDark] = useState(() => readStorage("darkMode") === "true");
  const darkMode = controlled ? !!darkModeProp : localDark;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(() => readProfile(tokenRef.current));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    writeStorage("darkMode", String(darkMode));
  }, [darkMode]);

  const setTheme = useCallback((next) => {
    if (next === darkMode) return;
    if (controlled) toggleDarkMode(next);
    else setLocalDark(next);
  }, [controlled, darkMode, toggleDarkMode]);
  const setLight = useCallback(() => setTheme(false), [setTheme]);
  const setDark = useCallback(() => setTheme(true), [setTheme]);

  useEffect(() => {
    if (isTokenExpired(readStorage("authToken"))) {
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      } catch {}
      navigate("/login", { replace: true });
    }
  }, [pathname, navigate]);

  useEffect(() => {
    const token = tokenRef.current;
    const id = token && !isTokenExpired(token) ? readAdminId(token) : null;
    if (!id) return undefined;
    const ctrl = new AbortController();
    api
      .get(`/api/admin/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      })
      .then(({ data }) => {
        if (ctrl.signal.aborted || !data) return;
        const full = `${data.firstName || ""} ${data.lastName || ""}`.trim();
        const name = data.name || full || String(data.email || "").split("@")[0];
        setProfile((prev) => {
          const next = {
            name: name || prev.name,
            role: data.role ? tidyRole(data.role) : prev.role,
          };
          return next.name === prev.name && next.role === prev.role ? prev : next;
        });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const handleLogout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const Swal = await loadSwal();
      const { isConfirmed } = await Swal.fire({
        title: "Confirm Logout",
        text: "Ending your administrative session?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Logout Now",
        background: darkMode ? "#2a2a2a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#04261a",
      });
      if (!isConfirmed) return;

      const token = readStorage("authToken");
      const refreshToken = readStorage("refreshToken");
      try {
        if (token && refreshToken)
          await api.post("/api/auth/logout", { refreshToken }, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
      clearSession(darkMode);
      navigate("/login", { replace: true });
    } finally {
      busyRef.current = false;
    }
  }, [navigate, darkMode]);

  const handleDeleteAccount = useCallback(async () => {
    if (busyRef.current) return;
    const token = readStorage("authToken");
    const id = token ? readAdminId(token) : null;
    busyRef.current = true;
    try {
      const Swal = await loadSwal();
      const theme = {
        background: darkMode ? "#2a2a2a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#04261a",
      };

      if (!id) {
        await Swal.fire({
          ...theme,
          title: "Unavailable",
          text: "Could not identify your admin account.",
          icon: "error",
          confirmButtonColor: "#10b981",
        });
        return;
      }

      const { isConfirmed } = await Swal.fire({
        ...theme,
        title: "Delete your account?",
        html: "This permanently deletes your admin account and cannot be undone.<br/>Type <b>DELETE</b> to confirm.",
        icon: "warning",
        input: "text",
        inputPlaceholder: "DELETE",
        inputAttributes: { autocapitalize: "off", autocomplete: "off" },
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Delete Account",
        focusCancel: true,
        showLoaderOnConfirm: true,
        inputValidator: (v) => (v === "DELETE" ? undefined : "Type DELETE exactly to continue"),
        preConfirm: async () => {
          try {
            await api.delete(`/api/admin/${encodeURIComponent(id)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return true;
          } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Could not delete the account. Please try again.";
            Swal.showValidationMessage(String(msg));
            return false;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });
      if (!isConfirmed) return;

      clearSession(darkMode);
      navigate("/login", { replace: true });
    } finally {
      busyRef.current = false;
    }
  }, [navigate, darkMode]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const goTo = useCallback((path) => navigate(path), [navigate]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  const pageTitle = PAGE_TITLES[pathname] || "Admin Panel";

  return (
    <div className={`nb ${darkMode ? "nb-dark" : ""} contents`} style={NB_FONT_STYLE}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        aria-label="Admin Portal Sidebar"
        className={`nb-surface nb-line fixed inset-y-0 left-0 z-[70] w-64 flex flex-col border-r-2 transition-[transform,visibility] duration-300 motion-reduce:transition-none
          ${sidebarOpen ? "translate-x-0 visible" : "-translate-x-full invisible"}
          lg:translate-x-0 lg:visible`}
      >
        <div className="nb-line flex items-center justify-between gap-2 px-4 h-16 flex-shrink-0 border-b-2">
          <Link
            to="/admin/dashboard"
            aria-label="Go to Admin Dashboard"
            onClick={closeSidebar}
            className="nb-link !border-transparent !bg-transparent !p-1 !shadow-none flex items-center gap-3 min-w-0"
          >
            <img
              src={logo}
              alt="Tech & Restore"
              width="40"
              height="40"
              decoding="async"
              className="h-10 w-auto max-w-[64px] flex-shrink-0 object-contain"
            />
            <span className="min-w-0 leading-tight normal-case">
              <span className="block text-xl font-extrabold tracking-tight truncate">
                Admin<span className="nb-ul">Panel</span>
              </span>
              <span className="nb-muted block text-[10px] font-semibold tracking-normal truncate">Tech &amp; Restore Control</span>
            </span>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close Navigation Sidebar"
              className="nb-btn lg:hidden h-9 w-9 flex-shrink-0"
            >
              <FiX size={ICON} aria-hidden="true" />
            </button>
          )}
        </div>

        <SidebarNav pathname={pathname} onClick={closeSidebar} />

        <div className="nb-line p-3 space-y-2.5 flex-shrink-0 border-t-2">
          <ThemeSwitch darkMode={darkMode} onLight={setLight} onDark={setDark} />
          <button type="button" onClick={handleLogout} className="nb-btn nb-btn-a w-full py-2 text-xs uppercase">
            <FiLogOut size={14} aria-hidden="true" /> Logout
          </button>
          <p className="nb-muted pt-0.5 text-center text-[10px] font-semibold">© {YEAR} Tech &amp; Restore</p>
        </div>
      </aside>

      <header
        role="banner"
        className="nb-surface nb-line fixed top-0 right-0 left-0 lg:left-64 h-16 z-40 border-b-2 flex items-center justify-between gap-4 px-4 sm:px-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open Navigation Sidebar"
            aria-expanded={sidebarOpen}
            className="nb-btn lg:hidden w-10 h-10 flex-shrink-0"
          >
            <FiMenu size={20} aria-hidden="true" />
          </button>
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight truncate">
            <span className="nb-ul">{pageTitle}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          <div className="hidden sm:flex flex-1 justify-end min-w-0">
            <SearchBox onNavigate={goTo} />
          </div>
          <ProfileBadge name={profile.name} role={profile.role} />
          <DeleteButton onClick={handleDeleteAccount} />
        </div>
      </header>
    </div>
  );
};

export default memo(Header);