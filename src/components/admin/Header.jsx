import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiLogOut, FiMenu, FiX, FiActivity, FiUsers, FiBox, FiTool,
  FiClipboard, FiSearch, FiSettings, FiTag, FiStar, FiShoppingBag, FiTruck,
  FiLayers, FiCreditCard, FiChevronRight, FiChevronDown, FiTrash2, FiUser,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../common/api/api";
import logo from "../../common/images/tech-restore-logo.webp";

let swalPromise = null;
const loadSwal = () => (swalPromise ||= import("sweetalert2").then((m) => m.default));

const ICON = 18;
const YEAR = new Date().getFullYear();
const SEARCH_MAX = 40;
const MAX_RESULTS = 6;

const NAV_GROUPS = [
  {
    key: "overview",
    label: "Overview",
    items: [{ name: "Dashboard", path: "/admin/dashboard", icon: FiActivity }],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { name: "Products", path: "/admin/products", icon: FiBox },
      { name: "Categories", path: "/admin/category", icon: FiLayers },
      { name: "Offers", path: "/admin/offers", icon: FiTag },
      { name: "Reviews", path: "/admin/reviews", icon: FiStar },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    items: [
      { name: "Transactions", path: "/admin/transactions", icon: FiCreditCard },
      { name: "Stores", path: "/admin/shops", icon: FiShoppingBag },
      { name: "Subscriptions", path: "/admin/subscriptions", icon: FiSettings },
    ],
  },
  {
    key: "people",
    label: "People",
    items: [{ name: "Users", path: "/admin/users", icon: FiUsers }],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      { name: "Repair Requests", path: "/admin/repair-requests", icon: FiTool },
      { name: "Delivery Network", path: "/admin/deliveries", icon: FiTruck },
      { name: "Assigners", path: "/admin/assigners", icon: FiUsers },
      { name: "Assignment Logs", path: "/admin/assignment-logs", icon: FiClipboard },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
const SEARCH_INDEX = ALL_ITEMS.map((item) => ({ item, key: item.name.toLowerCase() }));
const PAGE_TITLES = Object.fromEntries(ALL_ITEMS.map((i) => [i.path, i.name]));
PAGE_TITLES["/admin/dashboard"] = "Dashboard Overview";

const isActivePath = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };

const NB_CSS = `
html,body{overflow-x:hidden;max-width:100vw}
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#e6eae8;--nb-shadow:#e6eae8;--nb-gray:#f1f3f2;--nb-dot:#e6eae8;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-surface{background:var(--nb-card);color:var(--nb-ink)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-line{border-color:var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-row{border-bottom:2px dotted var(--nb-dot)}
.nb-row:last-child{border-bottom:0}
.nb-group{padding:14px 12px 4px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--nb-muted)}
:where(.nb-tile){display:inline-flex}
.nb-tile{align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:var(--nb-on);background:var(--nb-btn)}
.nb-avatar{background:#ec4899;color:#fff;border-radius:9999px}
:where(.nb-btn){display:inline-flex}
.nb-btn{align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn-sun{background:#f59e0b;color:#1f1300}
.nb-btn-moon{background:#6366f1;color:#ffffff}
.nb-btn-danger{background:#ef4444;color:#ffffff}
.nb-btn-logout{background:#ef4444;color:#fff;border-color:#000;box-shadow:3px 3px 0 #000}
.nb-btn-logout:hover:not(:disabled){background:#dc2626;color:#fff;box-shadow:4px 4px 0 #000}
.nb-btn-logout:active:not(:disabled){box-shadow:0 0 0 #000}
.nb-btn:focus-visible,.nb-field:focus-within,.nb-link:focus-visible,.nb-opt:focus-visible,.nb-field-link:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-field-link{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-field-link:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
:where(.nb-opt){display:flex}
.nb-opt{width:100%;align-items:center;gap:10px;padding:9px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover,.nb-opt-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-opt-danger:hover{background:#ef4444;color:#fff}
:where(.nb-link){display:flex}
.nb-link{align-items:center;gap:12px;padding:9px 12px;border:2px solid transparent;font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:var(--nb-ink);transition:transform .12s ease,background-color .12s ease}
.nb-link:hover{background:var(--nb-gray);border:2px dotted var(--nb-dot)}
.nb-link-on,.nb-link-on:hover{background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-kbd{font-size:10px;font-weight:800;padding:1px 6px;border:2px solid var(--nb-line);background:var(--nb-gray);color:var(--nb-muted)}
.custom-scrollbar-thin{scrollbar-width:thin;scrollbar-color:rgba(52,211,153,.6) transparent}
.custom-scrollbar-thin::-webkit-scrollbar{width:5px}
.custom-scrollbar-thin::-webkit-scrollbar-track{background:transparent}
.custom-scrollbar-thin::-webkit-scrollbar-thumb{background:rgba(52,211,153,.55)}
.custom-scrollbar-thin::-webkit-scrollbar-thumb:hover{background:#34d399}
@keyframes nbIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.nb-pop{animation:nbIn .16s ease-out both;transform-origin:top}
@media (prefers-reduced-motion:reduce){.nb-btn,.nb-link,.nb-field-link{transition:none}.nb-pop{animation:none}}
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
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap";
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

const sanitizeSearch = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069<>]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, SEARCH_MAX);

const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

const clearSession = (darkMode) => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  writeStorage("darkMode", String(darkMode));
};

const useDismiss = (open, ref, onClose) => {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, onClose]);
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
      <span className="flex-1 truncate">{item.name}</span>
      {active && <FiChevronRight size={14} aria-hidden="true" className="flex-shrink-0" />}
    </Link>
  );
});

const SidebarNav = memo(({ pathname, onClick }) => (
  <nav
    aria-label="Main navigation"
    className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 flex flex-col gap-1 custom-scrollbar-thin"
  >
    {NAV_GROUPS.map((group) => (
      <div key={group.key} role="group" aria-label={group.label} className="flex flex-col gap-1">
        <p className="nb-group">{group.label}</p>
        {group.items.map((item) => (
          <SidebarLink key={item.path} item={item} active={isActivePath(pathname, item.path)} onClick={onClick} />
        ))}
      </div>
    ))}
  </nav>
));

const SidebarFooter = memo(({ onLogout }) => (
  <div className="nb-line p-3 flex flex-col gap-2.5 flex-shrink-0 border-t-2">
    <button type="button" onClick={onLogout} className="nb-btn nb-btn-logout w-full py-2 text-xs uppercase">
      <FiLogOut size={14} aria-hidden="true" /> Logout
    </button>
    <p className="nb-muted pt-0.5 text-center text-[10px] font-semibold">© {YEAR} Tech &amp; Restore</p>
  </div>
));

const ThemeButton = memo(({ darkMode, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={darkMode}
    aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
    title={darkMode ? "Light theme" : "Dark theme"}
    className={`nb-btn w-10 h-10 flex-shrink-0 rounded-full ${darkMode ? "nb-btn-moon" : "nb-btn-sun"}`}
  >
    {darkMode ? <FiMoon size={ICON} aria-hidden="true" /> : <FiSun size={ICON} aria-hidden="true" />}
  </button>
));

const SearchBox = memo(({ onNavigate }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < SEARCH_INDEX.length && out.length < MAX_RESULTS; i++) {
      if (SEARCH_INDEX[i].key.includes(q)) out.push(SEARCH_INDEX[i].item);
    }
    return out;
  }, [query]);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  useEffect(() => { setActive(0); }, [results]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const goTo = useCallback((path) => {
    onNavigate(path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }, [onNavigate]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      goTo(results[active].path);
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  }, [results, active, goTo]);

  const onChange = useCallback((e) => { setQuery(sanitizeSearch(e.target.value)); setOpen(true); }, []);
  const onFocus = useCallback(() => setOpen(true), []);

  const showMenu = open && query.trim();

  return (
    <div ref={ref} role="search" className="relative w-full max-w-xl">
      <div className="nb-field flex h-10 items-center gap-2 px-3">
        <FiSearch size={16} aria-hidden="true" className="flex-shrink-0" />
        <label htmlFor="admin-search" className="sr-only">Search pages</label>
        <input
          ref={inputRef}
          id="admin-search"
          type="text"
          role="combobox"
          aria-expanded={!!showMenu}
          aria-controls="admin-search-list"
          aria-autocomplete="list"
          value={query}
          placeholder="Search pages..."
          maxLength={SEARCH_MAX}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        />
        <span className="nb-kbd hidden lg:inline-block flex-shrink-0" aria-hidden="true">/</span>
      </div>

      {showMenu && (
        <div id="admin-search-list" role="listbox" className="nb-menu nb-pop absolute inset-x-0 top-12 z-10 overflow-hidden">
          {results.length ? results.map((r, idx) => {
            const Icon = r.icon;
            return (
              <button
                key={r.path}
                type="button"
                role="option"
                aria-selected={idx === active}
                onMouseEnter={() => setActive(idx)}
                onClick={() => goTo(r.path)}
                className={`nb-opt ${idx === active ? "nb-opt-on" : ""}`}
              >
                <Icon size={16} aria-hidden="true" className="flex-shrink-0" />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="hidden md:block text-[10px] opacity-70">{r.group}</span>
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

const AccountMenu = memo(({ name, role, onDelete, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  useDismiss(open, ref, close);

  const handleDelete = useCallback(() => { setOpen(false); onDelete(); }, [onDelete]);
  const handleLogout = useCallback(() => { setOpen(false); onLogout(); }, [onLogout]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="nb-field nb-field-link flex items-center gap-2.5 h-10 ps-1 pe-1 md:pe-3 rounded-full"
      >
        <span className="nb-tile nb-avatar w-8 h-8 text-sm font-extrabold uppercase">
          {name ? name.charAt(0) : <FiUser size={16} aria-hidden="true" />}
        </span>
        <span className="hidden md:block leading-tight text-left">
          <span className="block text-xs font-extrabold uppercase truncate max-w-[110px]">{name}</span>
          <span className="nb-muted block text-[10px] font-bold">{role}</span>
        </span>
        <FiChevronDown size={14} aria-hidden="true" className={`hidden md:block transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="nb-menu nb-pop absolute right-0 top-12 z-50 w-56 overflow-hidden">
          <div className="nb-line nb-gray px-3.5 py-3 border-b-2">
            <p className="text-xs font-extrabold uppercase truncate">{name}</p>
            <p className="nb-muted text-[10px] font-bold">{role}</p>
          </div>
          <button type="button" role="menuitem" onClick={handleLogout} className="nb-opt">
            <FiLogOut size={16} aria-hidden="true" className="flex-shrink-0" />
            <span className="flex-1 truncate">Logout</span>
          </button>
          <button type="button" role="menuitem" onClick={handleDelete} className="nb-opt nb-opt-danger">
            <FiTrash2 size={16} aria-hidden="true" className="flex-shrink-0" />
            <span className="flex-1 truncate">Delete account</span>
          </button>
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
  const toggleTheme = useCallback(() => setTheme(!darkMode), [setTheme, darkMode]);

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
        confirmButtonColor: "#059669",
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
          confirmButtonColor: "#059669",
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

  const pageTitle = useMemo(() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const match = ALL_ITEMS.find((i) => isActivePath(pathname, i.path));
    return match ? match.name : "Admin Panel";
  }, [pathname]);

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
              fetchPriority="high"
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

        <SidebarFooter onLogout={handleLogout} />
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

        <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
          <div className="hidden sm:flex flex-1 justify-end min-w-0">
            <SearchBox onNavigate={goTo} />
          </div>
          <ThemeButton darkMode={darkMode} onToggle={toggleTheme} />
          <AccountMenu
            name={profile.name}
            role={profile.role}
            onDelete={handleDeleteAccount}
            onLogout={handleLogout}
          />
        </div>
      </header>
    </div>
  );
};

export default memo(Header);