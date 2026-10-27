import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiMail, FiPhone, FiClock, FiEdit3, FiCheckCircle, FiShield, FiSettings,
  FiAlertTriangle, FiCopy, FiBriefcase, FiUserCheck, FiActivity,
} from "react-icons/fi";
import { jwtDecode } from "jwt-decode";
import api from "../common/api/api";
import { EXTRAS_CSS, Toaster, toast } from "../components/user/UiExtras";

const NAME_MAX = 80;
const PHONE_MAX = 20;
const EMPTY_FORM = { name: "", department: "", phone: "" };

const TEXT_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'’&()\-/]*$/u;
const TEXT_STRIP_RE = /[^\p{L}\p{M}\p{N} .,'’&()\-/]/gu;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,19}$/;
const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };

const ensureNbFont = () => {
  if (typeof document === "undefined" || document.getElementById("nb-font")) return;
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
};

const NB_CSS = `
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-dot:#04261a;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:40px;height:12px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
.nb-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-field-off{background:var(--nb-gray);box-shadow:none;border-style:dashed}
.nb-field-err{border-color:#ef4444}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}}
`;

const PAGE_CSS = EXTRAS_CSS + NB_CSS;
const PANEL = "nb-gray nb-line border-2 border-dotted";
const PAGE_CLS = "min-h-screen py-6 lg:pl-64 mt-16 text-left overflow-x-hidden";

const TONE_BG = { em: "#34d399", teal: "#2dd4bf", lime: "#a3e635", cyan: "#22d3ee", amber: "#fbbf24", red: "#fb7185" };

const clean = (v) => String(v ?? "").normalize("NFC").replace(CTRL, "");
const txt = (v) => (typeof v === "string" || typeof v === "number" ? clean(v) : "");

const cleanText = (v) =>
  clean(v).replace(TEXT_STRIP_RE, "").replace(/\s{2,}/g, " ").replace(/^[\s.,'’&()\-/]+/, "").slice(0, NAME_MAX);

const cleanPhone = (v) =>
  clean(v).replace(/[^\d+\s-]/g, "").replace(/(?!^)\+/g, "").replace(/\s{2,}/g, " ").slice(0, PHONE_MAX);

const SANITIZERS = { name: cleanText, department: cleanText, phone: cleanPhone };

const toForm = (p) => ({
  name: cleanText(txt(p?.name)),
  department: cleanText(txt(p?.department)),
  phone: cleanPhone(txt(p?.phone)),
});

const shortId = (id) => clean(id).slice(-8);
const errText = (err) => {
  const m = err?.response?.data?.message;
  return typeof m === "string" ? clean(m).slice(0, 120) || undefined : undefined;
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" });
const formatLongDate = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? "—" : DATE_FMT.format(t);
};
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; } catch { return true; }
};

const isNotAssigner = (token) => {
  try {
    const p = jwtDecode(token);
    const found = [p.role, p.roles, p.authorities, p.scope, localStorage.getItem("role")]
      .flat().filter(Boolean).join(" ").toUpperCase();
    return found !== "" && !found.includes("ASSIGNER");
  } catch { return false; }
};

let swalPromise = null;
const loadSwal = () => (swalPromise ||= import("sweetalert2").then((m) => m.default));
const showToast = async (text, icon) => {
  try {
    const Swal = await loadSwal();
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  } catch {
    return;
  }
};

const useDarkMode = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setDark(el.classList.contains("dark")));
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || "");
  const i = s.lastIndexOf(" ");
  const head = i > 0 ? s.slice(0, i + 1) : "";
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const IconTile = memo(({ icon: Icon, tone = "em", className = "w-11 h-11", size = 18 }) => (
  <span className={`nb-tile ${className}`} style={{ background: TONE_BG[tone] }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

const StatCard = memo(({ label, value, caption, icon, tone }) => (
  <div className="nb-card nb-lift p-4 sm:p-5 min-w-0">
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="nb-muted text-[11px] font-bold uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight leading-tight truncate">{value}</p>
      </div>
    </div>
    <p className="mt-3">
      <span className="nb-chip max-w-full truncate" style={{ background: TONE_BG[tone], color: "#04261a" }}>{caption}</span>
    </p>
  </div>
));

const InfoCard = memo(({ icon: Icon, label, value }) => (
  <div className={`${PANEL} p-3 flex items-center gap-2.5 min-w-0`}>
    <Icon size={15} className="nb-ic flex-shrink-0" aria-hidden="true" />
    <div className="min-w-0">
      <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
      <p className="text-xs font-extrabold truncate">{value || "—"}</p>
    </div>
  </div>
));

const Field = memo(({ id, icon: Icon, label, field, value, editing, onChange, error, type = "text", inputMode, autoComplete, maxLength, placeholder }) => (
  <div className="min-w-0">
    <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide">
      <Icon size={14} className="nb-ic" aria-hidden="true" /> {label}
    </label>
    <div className={`nb-field flex h-12 items-center px-3.5 ${editing ? "" : "nb-field-off"} ${error ? "nb-field-err" : ""}`}>
      <input
        id={id}
        name={field}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize="off"
        spellCheck={false}
        maxLength={maxLength}
        placeholder={editing ? placeholder : undefined}
        value={value}
        disabled={!editing}
        dir={type === "tel" ? "ltr" : undefined}
        onChange={(e) => onChange(field, e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData?.getData("text") || "";
          if (pasted.length > 200) e.preventDefault();
        }}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-w-0 flex-1 bg-transparent text-base sm:text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-bold text-red-500">{error}</p>
    )}
  </div>
));

const ProfileSkeleton = ({ darkMode }) => (
  <div style={NB_FONT_STYLE} className={`nb ${darkMode ? "nb-dark" : ""} ${PAGE_CLS}`}>
    <style>{PAGE_CSS}</style>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Loading profile">
      <div className="nb-gray h-14 w-64" />
      <div className="nb-card h-44" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="nb-card h-32" />)}
      </div>
      <div className="nb-card h-80" />
    </div>
  </div>
);

const AssignerProfile = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();

  const tokenRef = useRef(localStorage.getItem("authToken"));
  const denied = useMemo(
    () => !tokenRef.current || isTokenExpired(tokenRef.current) || isNotAssigner(tokenRef.current),
    []
  );

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState({});

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const savingRef = useRef(false);
  const formCardRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    ensureNbFont();
    document.title = "Assigner Profile | Tech Restore";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      "Manage your Tech Restore assigner profile: display name, department, phone number and account status.";
  }, []);

  useEffect(() => {
    if (!denied) return;
    const token = tokenRef.current;
    if (token && !isTokenExpired(token)) showToast("Assigner accounts only.", "error");
    else localStorage.clear();
    navigate("/login", { replace: true });
  }, [denied, navigate]);

  const loadProfile = useCallback(async ({ keepForm = false } = {}) => {
    if (denied) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoadError(false);
    try {
      const { data } = await api.get("/api/assigner/profile", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted || !mountedRef.current) return;
      const safe = data && typeof data === "object" && !Array.isArray(data) ? data : {};
      setProfile(safe);
      if (!keepForm) setForm(toForm(safe));
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      const status = err?.response?.status;
      if (status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
      } else if (status === 403) {
        showToast("Assigner accounts only.", "error");
        navigate("/login", { replace: true });
      } else if (mountedRef.current) {
        setLoadError(true);
        toast({ icon: "error", title: "Failed to load profile", text: errText(err) });
      }
    } finally {
      if (abortRef.current === ctrl && mountedRef.current) setIsLoading(false);
    }
  }, [denied, navigate]);

  useEffect(() => {
    loadProfile();
    return () => abortRef.current?.abort();
  }, [loadProfile]);

  const retry = useCallback(() => {
    setIsLoading(true);
    loadProfile();
  }, [loadProfile]);

  const handleChange = useCallback((field, value) => {
    const sanitize = SANITIZERS[field];
    if (!sanitize) return;
    setForm((prev) => ({ ...prev, [field]: sanitize(value) }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const validate = useCallback(() => {
    const e = {};
    const name = form.name.trim();
    const department = form.department.trim();
    const phone = form.phone.trim();
    if (name.length < 2) e.name = "Enter at least 2 characters";
    else if (!TEXT_RE.test(name)) e.name = "Use letters, numbers and basic punctuation only";
    if (department && !TEXT_RE.test(department)) e.department = "Use letters, numbers and basic punctuation only";
    if (phone) {
      const digits = phone.replace(/\D/g, "").length;
      if (!PHONE_RE.test(phone) || digits < 7 || digits > 15) e.phone = "Invalid phone format";
    }
    setErrors(e);
    return Object.keys(e).length === 0 ? { name, department, phone } : null;
  }, [form]);

  const handleUpdate = useCallback(async () => {
    if (savingRef.current) return;
    const payload = validate();
    if (!payload) return;

    const current = toForm(profile);
    if (payload.name === current.name && payload.department === current.department && payload.phone === current.phone) {
      setForm(payload);
      setIsEditing(false);
      toast({ icon: "info", title: "No changes to save" });
      return;
    }

    const Swal = await loadSwal();
    const dark = document.documentElement.classList.contains("dark");
    const { isConfirmed } = await Swal.fire({
      title: "Save profile changes?",
      text: "Your name, department and phone will be updated.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save changes",
      confirmButtonColor: "#059669",
      background: dark ? "#2a2a2a" : "#fff",
      color: dark ? "#fff" : "#04261a",
    });
    if (!isConfirmed || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    try {
      await api.put("/api/assigner/profile", payload, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!mountedRef.current) return;
      setProfile((p) => ({ ...p, ...payload }));
      setForm(payload);
      setIsEditing(false);
      toast({ icon: "success", title: "Profile updated" });
      loadProfile({ keepForm: true });
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
      toast({ icon: "error", title: "Update failed", text: errText(err) });
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  }, [validate, profile, loadProfile, navigate]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("profile-name")?.focus({ preventScroll: true });
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setForm(toForm(profile));
    setErrors({});
    setIsEditing(false);
  }, [profile]);

  useEffect(() => {
    if (!isEditing) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !savingRef.current) cancelEdit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing, cancelEdit]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    handleUpdate();
  }, [handleUpdate]);

  const copyId = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: "success", title: "Copied", text: "ID copied to clipboard.", timer: 2000 });
    } catch {
      toast({ icon: "error", title: "Could not copy", text: "Allow clipboard access in your browser." });
    }
  }, []);

  const view = useMemo(() => {
    if (!profile) return null;
    const displayName = txt(profile.name) || "Assigner";
    const status = txt(profile.status).toUpperCase();
    const statusTone = status === "APPROVED" ? "em" : status === "PENDING" ? "amber" : "red";
    const verified = Boolean(profile.verified);
    const active = Boolean(profile.activate);
    return {
      displayName,
      department: txt(profile.department) || "Logistics",
      email: txt(profile.email),
      memberSince: formatLongDate(profile.createdAt),
      verified,
      stats: [
        {
          label: "Verification", value: verified ? "Verified" : "Pending",
          caption: verified ? "Identity confirmed" : "Awaiting review",
          icon: verified ? FiCheckCircle : FiClock, tone: verified ? "em" : "amber",
        },
        {
          label: "Account", value: active ? "Active" : "Deactivated",
          caption: active ? "Can sign in and assign" : "Access suspended",
          icon: FiActivity, tone: active ? "teal" : "red",
        },
        {
          label: "Approval", value: status ? titleCase(status) : "Unknown",
          caption: "Admin decision",
          icon: FiUserCheck, tone: status ? statusTone : "amber",
        },
        {
          label: "Access level", value: "Assigner",
          caption: "Orders and repairs",
          icon: FiBriefcase, tone: "cyan",
        },
      ],
    };
  }, [profile]);

  if (denied) return null;
  if (isLoading && !profile) return <ProfileSkeleton darkMode={darkMode} />;

  const shell = `nb ${darkMode ? "nb-dark" : ""} ${PAGE_CLS}`;

  if (!profile || !view) {
    return (
      <div style={NB_FONT_STYLE} className={shell}>
        <style>{PAGE_CSS}</style>
        <Toaster darkMode={darkMode} />
        <main className="max-w-md mx-auto px-4">
          <div role="alert" className="nb-card flex flex-col items-center text-center px-6 py-12">
            <IconTile icon={FiAlertTriangle} tone="red" className="w-14 h-14" size={26} />
            <h1 className="mt-4 text-lg font-extrabold uppercase">Couldn't load your profile</h1>
            <p className="nb-muted mt-1 text-sm font-medium">
              {loadError ? "Check your connection and try again." : "Your profile is not available right now."}
            </p>
            <button type="button" onClick={retry} className="nb-btn nb-btn-a mt-5 h-11 px-6 text-xs uppercase">
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={NB_FONT_STYLE} className={shell}>
      <style>{PAGE_CSS}</style>
      <Toaster darkMode={darkMode} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="px-0.5">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide">
            <span className="nb-bar" aria-hidden="true" />Account
          </p>
          <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
            <UnderlinedTitle text="Assigner Profile" />
          </h1>
          <p className="nb-muted mt-2 text-sm font-medium">
            Manage your personal details and review your account status on the Tech &amp; Restore platform.
          </p>
        </div>

        <section aria-label="Assigner summary" className="nb-card p-4 sm:p-6">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="relative flex-shrink-0">
              <span className="nb-tile w-24 h-24 text-4xl font-extrabold uppercase" style={{ background: TONE_BG.em }}>
                {view.displayName.charAt(0)}
              </span>
              <span className="nb-tile absolute -bottom-2 -right-2 w-9 h-9" style={{ background: TONE_BG.teal }}>
                <FiShield size={15} aria-hidden="true" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="nb-chip" style={{ background: TONE_BG.teal, color: "#04261a" }}>Assigner</span>
                {view.verified && (
                  <span className="nb-chip" style={{ background: TONE_BG.em, color: "#04261a" }}>Verified</span>
                )}
                {profile.id && (
                  <span className="nb-chip font-mono">
                    #{shortId(profile.id)}
                    <button
                      type="button"
                      onClick={() => copyId(profile.id)}
                      aria-label="Copy ID"
                      className="nb-btn h-5 w-5 !shadow-none"
                    >
                      <FiCopy size={10} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight break-words">{view.displayName}</h2>
              <p className="nb-muted mt-1 text-sm font-semibold truncate">{view.department}</p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit profile details"
                className="nb-btn nb-btn-a h-12 px-6 w-full sm:w-auto text-xs uppercase"
              >
                <FiEdit3 size={15} aria-hidden="true" /> Edit profile
              </button>
            )}
          </div>
        </section>

        <section aria-label="Account status" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {view.stats.map((s) => <StatCard key={s.label} {...s} />)}
        </section>

        <section ref={formCardRef} aria-labelledby="account-title" className="nb-card scroll-mt-24 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <IconTile icon={FiSettings} tone="em" />
            <div>
              <h2 id="account-title" className="text-sm font-extrabold uppercase">
                <span className="nb-ul">{isEditing ? "Editing your details" : "Your details"}</span>
              </h2>
              <p className="nb-muted mt-1 text-[11px] font-bold">
                {isEditing ? "Press Esc to cancel" : "Email and join date are read-only"}
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 mb-6">
            <InfoCard icon={FiMail} label="Email" value={view.email} />
            <InfoCard icon={FiClock} label="Member since" value={view.memberSince} />
          </div>

          <form onSubmit={onSubmit} noValidate autoComplete="on" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="profile-name" icon={FiUser} label="Display name" field="name"
                value={form.name} editing={isEditing} onChange={handleChange} error={errors.name}
                autoComplete="name" maxLength={NAME_MAX}
              />
              <Field
                id="profile-phone" icon={FiPhone} label="Phone" field="phone" type="tel" inputMode="tel"
                value={form.phone} editing={isEditing} onChange={handleChange} error={errors.phone}
                autoComplete="tel" maxLength={PHONE_MAX} placeholder="+20 100 000 0000"
              />
            </div>
            <Field
              id="profile-department" icon={FiBriefcase} label="Department" field="department"
              value={form.department} editing={isEditing} onChange={handleChange} error={errors.department}
              autoComplete="organization-title" maxLength={NAME_MAX} placeholder="e.g. Logistics"
            />

            {isEditing && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={cancelEdit} disabled={isSaving} className="nb-btn h-12 text-xs uppercase">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  aria-label="Save profile changes"
                  className="nb-btn nb-btn-a h-12 text-xs uppercase"
                >
                  <FiCheckCircle size={15} aria-hidden="true" /> {isSaving ? "Saving..." : "Apply changes"}
                </button>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
};

export default memo(AssignerProfile);