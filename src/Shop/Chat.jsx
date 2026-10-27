import React, { useEffect, useState, useCallback, useRef, memo, useMemo, lazy, Suspense } from 'react';
import { FiMessageSquare, FiChevronRight, FiClock } from 'react-icons/fi';
import api from '../common/api/api';
import { POLL_MS, isSafeId, num } from '../components/shop/TableKit';
import { useAppLanguage } from '../common/utils/useAppLanguage';
import { getFontStyle, ensureShopAssets } from '../common/utils/shopFonts';
import shopAr from '../common/ShopLocales/shopAr';
import shopEn from '../common/ShopLocales/shopEn';

ensureShopAssets();

const loadChatModal = () => import('../components/shop/ShopChatModal');
const ShopChatModal = lazy(loadChatModal);

const MAX_BACKOFF_STEPS = 3;

const PG_CSS = `
.pg{--pg-bg:#f9fafb;--pg-card:#ffffff;--pg-ink:#04261a;--pg-muted:#4b6b5c;--pg-line:#04261a;--pg-shadow:#04261a;--pg-gray:#e8ebe9;--pg-dot:#04261a;--pg-accent:#10b981;--pg-btn:#059669;--pg-on:#ffffff;color:var(--pg-ink)}
.dark .pg{--pg-bg:#141414;--pg-card:#2a2a2a;--pg-ink:#ffffff;--pg-muted:#a3a3a3;--pg-line:#000000;--pg-shadow:#000000;--pg-gray:#1e1e1e;--pg-dot:#3f3f3f;--pg-accent:#39ff88;--pg-btn:#39ff88;--pg-on:#022c22}
.pg[dir="rtl"] *{letter-spacing:0!important}
.pg-bg{background:var(--pg-bg)}
.pg-gray{background:var(--pg-gray)}
.pg-muted{color:var(--pg-muted)}
.pg-line{border-color:var(--pg-line)}
.pg-card{background:var(--pg-card);border:2px solid var(--pg-line);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-ul{text-decoration:underline;text-decoration-color:var(--pg-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pg-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pg-line);background:var(--pg-accent);color:#04261a}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.pg-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pg-shadow)}
.pg-btn-a{background:var(--pg-btn);color:var(--pg-on)}
.pg-btn:focus-visible{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-spin{border:4px solid var(--pg-accent);border-top-color:transparent;border-radius:50%;animation:pgSpin .8s linear infinite}
@keyframes pgSpin{to{transform:rotate(360deg)}}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-fade{animation:pgFade .2s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn{transition:none}.pg-spin,.pg-fade{animation:none}}
`;
const STYLE_EL = <style>{PG_CSS}</style>;

const NUM_CACHE = {};
const getNum = (locale) => (NUM_CACHE[locale] ||= new Intl.NumberFormat(locale));

const tpl = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const readShopId = () => {
  try {
    const v = localStorage.getItem('id');
    return v && isSafeId(v) ? v : null;
  } catch {
    return null;
  }
};

const ChatLoading = memo(({ label }) => (
  <div role="status" aria-label={label} className="fixed inset-0 z-[1000] grid place-items-center bg-black/60">
    <div className="pg-spin w-10 h-10" />
  </div>
));

const Chat = () => {
  const language = useAppLanguage();
  const isAr = language === 'ar';
  const L = isAr ? shopAr : shopEn;
  const t = L.chat;
  const nf = getNum(L.locale);
  const fontStyle = useMemo(() => getFontStyle(language), [language]);

  const [openChat, setOpenChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const fetchUnread = useCallback(async () => {
    const shopId = readShopId();
    if (!shopId) return true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await api.get(`/api/chats/${encodeURIComponent(shopId)}/unread-count`, { signal: controller.signal });
      if (!controller.signal.aborted) setUnreadCount(Math.max(0, Math.floor(num(data?.unreadCount ?? data))));
      return true;
    } catch {
      return controller.signal.aborted;
    }
  }, []);

  useEffect(() => {
    if (openChat) return undefined;
    let timer;
    let stopped = false;
    let generation = 0;
    let fails = 0;

    const run = async () => {
      const mine = ++generation;
      if (!document.hidden) {
        const ok = await fetchUnread();
        fails = ok ? 0 : Math.min(fails + 1, MAX_BACKOFF_STEPS);
      }
      if (stopped || mine !== generation) return;
      timer = setTimeout(run, POLL_MS * 2 ** fails);
    };

    const onVisible = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      run();
    };

    run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      abortRef.current?.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [openChat, fetchUnread]);

  const open = useCallback(() => setOpenChat(true), []);
  const close = useCallback(() => setOpenChat(false), []);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      lang={language}
      style={fontStyle}
      className="pg pg-bg min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden"
    >
      {STYLE_EL}

      <div key={language} className="pg-fade max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <header className="px-0.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
            {t.title[0]}<span className="pg-ul">{t.title[1]}</span>
          </h1>
          <p className="pg-muted mt-2 text-sm font-medium">{t.subtitle}</p>
        </header>

        <section className="pg-card overflow-hidden">
          <div className="px-6 py-10 sm:py-14 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <span className="pg-tile h-20 w-20">
                <FiMessageSquare size={36} aria-hidden="true" />
              </span>
              {unreadCount > 0 && (
                <span
                  className="pg-line absolute -top-2 -end-2 w-4 h-4 bg-red-500 border-2"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="space-y-2 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase">
                <span className="pg-ul">{t.heroTitle}</span>
              </h2>
              <p className="pg-muted text-sm font-semibold leading-relaxed">{t.heroText}</p>
            </div>

            <button
              type="button"
              onClick={open}
              onMouseEnter={loadChatModal}
              onFocus={loadChatModal}
              onTouchStart={loadChatModal}
              className="pg-btn pg-btn-a relative h-11 px-6 text-sm uppercase"
            >
              {t.open}
              <FiChevronRight size={16} className="rtl:rotate-180" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-label={tpl(t.unreadAria, { n: nf.format(unreadCount) })}
                  className="pg-line absolute -top-2.5 -end-2.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-extrabold tabular-nums grid place-items-center border-2"
                >
                  {unreadCount > 99 ? `${nf.format(99)}+` : nf.format(unreadCount)}
                </span>
              )}
            </button>
          </div>
        </section>

        <div className="pg-card p-4 flex items-center gap-3.5">
          <span className="pg-tile h-11 w-11" style={{ background: '#facc15' }}>
            <FiClock size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase">{t.tipTitle}</p>
            <p className="pg-muted text-xs font-semibold leading-relaxed">{t.tipText}</p>
          </div>
        </div>
      </div>

      {openChat && (
        <Suspense fallback={<ChatLoading label={t.loadingAria} />}>
          <ShopChatModal open={openChat} onClose={close} onUnreadChange={setUnreadCount} />
        </Suspense>
      )}
    </div>
  );
};

export default memo(Chat);