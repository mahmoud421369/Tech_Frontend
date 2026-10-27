import { useCallback, useEffect, useRef, useState } from 'react';
import SockJSImport from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import useAuthStore from '../store/Auth';

const SockJS = SockJSImport?.default ?? SockJSImport;

if (typeof Client !== 'function') {
  // eslint-disable-next-line no-console
  console.error('[useChatSocket] @stomp/stompjs `Client` is not a function. Run `npm ls @stomp/stompjs`, remove duplicate copies, and clear node_modules/.cache.');
}

const WS_URL = process.env.REACT_APP_WS_URL || 'https://api.tech-restore.tech/ws';
const RECONNECT_DELAY = 5000;
const CONNECT_TIMEOUT = 10000;
const AUTH_ERROR_RE = /unauthor|forbidden|expired|invalid.?token|jwt/i;

const debugOn = () => {
  try {
    return localStorage.getItem('chatDebug') === '1';
  } catch {
    return false;
  }
};

if (typeof window !== 'undefined' && window.location.protocol === 'https:' && WS_URL.startsWith('http:')) {
  // eslint-disable-next-line no-console
  console.warn('[useChatSocket] WS_URL is http: on an https page — the browser will block it (mixed content).');
}

export const readStored = (key) => {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getAuthToken = () => useAuthStore.getState().accessToken || readStored('authToken');

export function useChatSocket({ enabled, onConnect }) {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('idle');
  const [reason, setReason] = useState('');
  const clientRef = useRef(null);
  const tokenRef = useRef(null);
  const onConnectRef = useRef(onConnect);
  const storeToken = useAuthStore((s) => s.accessToken);
  const hasToken = !!(storeToken || readStored('authToken'));

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    if (typeof Client !== 'function') {
      setStatus('disconnected');
      setReason('STOMP client library failed to load');
      return undefined;
    }

    const token = getAuthToken();
    if (!token) {
      setStatus('auth-error');
      setReason('No auth token found — please log in');
      return undefined;
    }

    let disposed = false;
    let phase = 'connecting';
    const update = (v) => {
      if (!disposed) setStatus(v);
    };
    const why = (text) => {
      if (!disposed) setReason(text);
    };
    const keepFatal = (s) => (s === 'auth-error' || s === 'account-changed' ? s : 'disconnected');

    tokenRef.current = token;
    update('connecting');
    why('');

    const c = new Client({
      webSocketFactory: () => {
        try {
          return new SockJS(WS_URL);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[useChatSocket] could not create SockJS', e);
          why(`Invalid WebSocket URL: ${WS_URL}`);
          update('disconnected');
          throw e;
        }
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      beforeConnect: (cl) => {
        const t = getAuthToken();
        if (!t) {
          why('No auth token found — please log in');
          update('auth-error');
          cl.deactivate();
          return;
        }
        phase = 'connecting';
        tokenRef.current = t;
        cl.connectHeaders = { Authorization: `Bearer ${t}` };
        update('connecting');
      },
      reconnectDelay: RECONNECT_DELAY,
      connectionTimeout: CONNECT_TIMEOUT,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (m) => {
        // eslint-disable-next-line no-console
        if (debugOn()) console.debug('[stomp]', m);
      },
      onConnect: () => {
        phase = 'connected';
        why('');
        update('connected');
        onConnectRef.current?.();
      },
      onDisconnect: () => update('disconnected'),
      onStompError: (frame) => {
        const msg = frame?.headers?.message || '';
        const text = `${msg} ${frame?.body || ''}`;
        why(msg || 'The server rejected the STOMP connection');
        if (AUTH_ERROR_RE.test(text)) {
          update('auth-error');
          c.deactivate();
        } else {
          update('disconnected');
        }
      },
      onWebSocketError: () => {
        why('Network/CORS error while opening the WebSocket');
        update(keepFatal);
      },
      onWebSocketClose: (evt) => {
        if (disposed) return;
        if (phase === 'connecting') {
          why(
            `Could not open the connection${evt?.code ? ` (code ${evt.code})` : ''}. ` +
              `Check CORS / allowed origins and that ${WS_URL}/info is reachable.`
          );
        } else {
          why('Connection lost, retrying…');
        }
        update(keepFatal);
      },
    });

    const unsubscribeStore = useAuthStore.subscribe((state, prev) => {
      if (disposed) return;
      if (state.accessToken === prev.accessToken && state.userId === prev.userId) return;
      if (!state.accessToken) {
        why('You have been signed out');
        update('auth-error');
        c.deactivate();
        return;
      }
      if (prev.userId != null && state.userId != null && String(prev.userId) !== String(state.userId)) {
        why('You signed in with another account');
        update('account-changed');
        c.deactivate();
        return;
      }
      tokenRef.current = state.accessToken;
    });

    const onStorage = (e) => {
      if (e.key !== 'authToken' || !e.newValue) return;
      if (e.newValue === tokenRef.current || e.newValue === useAuthStore.getState().accessToken) return;
      why('You signed in with another account in a different tab');
      update('account-changed');
      c.deactivate();
    };
    window.addEventListener('storage', onStorage);

    const onPageShow = (e) => {
      if (e.persisted && !disposed) c.activate();
    };
    const onPageHide = () => c.deactivate();
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    c.activate();
    clientRef.current = c;
    setClient(c);

    return () => {
      disposed = true;
      unsubscribeStore();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      c.deactivate();
      clientRef.current = null;
      setClient(null);
      setStatus('idle');
      setReason('');
    };
  }, [enabled, hasToken]);

  const reconnect = useCallback(() => {
    const c = clientRef.current;
    if (!c) return;
    setStatus('connecting');
    Promise.resolve(c.deactivate()).then(() => c.activate());
  }, []);

  const authHeader = useCallback(() => `Bearer ${tokenRef.current || getAuthToken()}`, []);

  return { client, status, reason, isConnected: status === 'connected', reconnect, authHeader };
}