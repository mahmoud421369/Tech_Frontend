

const isWorkerKill = (e) => {
  const m = String(
    e?.reason?.message ?? e?.reason ?? e?.error?.message ?? e?.message ?? ''
  );
  return m.includes('workers were terminated');
};

export const isMapWorkerKill = isWorkerKill;

const swallow = (e) => {
  if (isWorkerKill(e)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
};

if (typeof window !== 'undefined' && !window.__mapSafeInstalled) {
  window.__mapSafeInstalled = true;

  window.addEventListener('unhandledrejection', swallow, true);
  window.addEventListener('error', swallow, true);
}


let hardened = false;
export const keepWorkersWarm = (gl) => {
  if (hardened || !gl) return;
  hardened = true;
  try { gl.prewarm?.(); } catch { }
  try {
    const d = gl.getGlobalDispatcher?.();
    if (d) {
      const ping = d.ping?.bind(d);
      if (ping) d.ping = (ms = 5000) => ping(Math.max(ms, 5000));


      const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
      const ensure = d.ensureWorkers?.bind(d);
      d.ensureWorkers = isProd && ensure
        ? () => {
          const p = ensure();
          Promise.resolve(p).catch(() => { });
          return p;
        }
        : () => Promise.resolve();
      d.handleWorkersTerminated = function handleWorkersTerminated() {
        const err = new Error('The workers were terminated while a message was in flight.');
        err.name = 'AbortError';
        try { this.workersAbortController?.abort(err); } catch { }
        this.actorsPromise = undefined;
      };
    }
  } catch { }
};


export const later = (fn, ms = 80) => {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
};


let tail = Promise.resolve();

export const claimMapSlot = () => {
  const ready = tail;
  let release;
  let released = false;
  const gate = new Promise((resolve) => { release = resolve; });
  tail = ready.then(() => gate);
  return {
    ready,
    release: () => {
      if (released) return;
      released = true;
      release();
    },
  };
};


export const safeRemove = (map, onDone) => {
  const finish = () => {
    if (onDone) setTimeout(onDone, 60);
  };
  if (!map) {
    onDone?.();
    return;
  }
  try { map.stop?.(); } catch { }
  try {
    map.remove();
    finish();
  } catch {
   
    setTimeout(() => {
      try { map.remove(); } catch { }
      finish();
    }, 250);
  }
};