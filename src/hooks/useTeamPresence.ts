import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function cableUrl(): string {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
  return `${base}/cable`;
}

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7245/ingest/e87869fc-7c62-4a18-9abb-ab61c7715a64';
function debugLog(message: string, data: Record<string, unknown>, hypothesisId: string) {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useTeamPresence.ts', message, data, hypothesisId, timestamp: Date.now() }) }).catch(() => {});
}
// #endregion

/**
 * Subscribe to the TeamPresenceChannel via ActionCable and maintain
 * a live set of online user IDs for the current user's team.
 *
 * Includes automatic reconnection with exponential back-off.
 */
export function useTeamPresence(isConnected: boolean): Set<number> {
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const retryRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (!isConnected) return;

    unmountedRef.current = false;
    retryRef.current = 0;

    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (unmountedRef.current) return;

      const url = cableUrl();
      // #region agent log
      debugLog('WS connecting', { url, isConnected }, 'H1');
      // #endregion
      ws = new WebSocket(url);

      ws.onopen = () => {
        // #region agent log
        debugLog('WS opened, subscribing', { url }, 'H1');
        // #endregion
        retryRef.current = 0;
        const subscribe = {
          command: 'subscribe',
          identifier: JSON.stringify({ channel: 'TeamPresenceChannel' }),
        };
        ws!.send(JSON.stringify(subscribe));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // #region agent log
          debugLog('WS message received', { type: data.type, messageType: data.message?.type, identifier: data.identifier, hasOnlineIds: Array.isArray(data.message?.online_user_ids), onlineIds: data.message?.online_user_ids }, 'H4');
          // #endregion
          if (
            data.message &&
            typeof data.message === 'object' &&
            data.message.type === 'presence_update' &&
            Array.isArray(data.message.online_user_ids)
          ) {
            // #region agent log
            debugLog('Setting onlineIds', { ids: data.message.online_user_ids }, 'H4');
            // #endregion
            setOnlineIds(new Set<number>(data.message.online_user_ids));
          }
        } catch {
          // ignore non-JSON or unexpected frames
        }
      };

      ws.onerror = (error) => {
        // #region agent log
        debugLog('WS error', { errorType: error.type }, 'H1');
        // #endregion
      };

      ws.onclose = (event) => {
        // #region agent log
        debugLog('WS closed', { code: event.code, reason: event.reason, wasClean: event.wasClean }, 'H1');
        // #endregion
        if (unmountedRef.current) return;
        // Reconnect with exponential back-off (max ~30s)
        const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
        retryRef.current += 1;
        retryTimeout = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (ws) ws.close();
    };
  }, [isConnected]);

  return onlineIds;
}
