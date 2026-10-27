/**
 * mapSafe.js
 * Helpers that make MapLibre GL lifecycles safe in React (StrictMode, HMR, modals
 * that open/close quickly).
 *
 * Root cause of "The workers were terminated while a message was in flight":
 * two maps overlapped (old one still tearing down, new one already loading), and the
 * shared worker pool was terminated/restarted while the new map had messages in flight.
 * Fix: run map lifecycles strictly one at a time (claimMapSlot) and remove maps
 * immediately instead of waiting for "idle".
 */

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
  // capture = true so we run before bubbling listeners (e.g. dev error overlays)
  window.addEventListener('unhandledrejection', swallow, true);
  window.addEventListener('error', swallow, true);
}

/**
 * Hardens MapLibre's worker handling (call once, right after importing maplibre-gl).
 *
 * 1. prewarm(): holds a permanent reference on the shared worker pool, so removing the
 *    last map never terminates workers that still have messages in flight.
 *    (Deliberately never calls clearPrewarmedResources().)
 * 2. Longer worker ping: on every tab return MapLibre pings the workers and RESTARTS them
 *    if they do not answer within 500 ms. In dev (large worker, busy style/tile parsing)
 *    that is a false positive that kills healthy workers. We allow 5 s instead.
 * 3. Abort with a real AbortError: on termination MapLibre aborts in-flight messages with
 *    a plain Error, which its own code does not recognise as an abort, so it surfaces as
 *    "The workers were terminated while a message was in flight". Naming it AbortError
 *    makes MapLibre treat it as the expected, silent cancellation it is.
 */
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

      // ensureWorkers() runs on every tab return and restarts the pool when the ping fails.
      // Dev: skip it entirely (dev workers are slow/busy and the restart is a false positive).
      // Prod: keep the recovery for browser-killed workers, but never leave a rejection unhandled.
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

/** setTimeout that returns a cancel function. */
export const later = (fn, ms = 80) => {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
};

/**
 * Serial queue of map lifecycles.
 * const slot = claimMapSlot();
 * await slot.ready;   // previous map is fully gone
 * ...create map...
 * slot.release();     // call after the map has been removed (safeRemove does it for you)
 */
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

/**
 * Remove a map immediately (no waiting for "idle"), then call onDone shortly after so
 * the worker pool has time to settle before the next map is created.
 */
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
    // remove() can throw if the style is mid-load; retry once shortly after
    setTimeout(() => {
      try { map.remove(); } catch { }
      finish();
    }, 250);
  }
};