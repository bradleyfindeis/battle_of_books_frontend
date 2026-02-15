import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function cableUrl(token: string): string {
  const base = API_URL.replace(/^http/, 'ws');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}/cable${sep}token=${encodeURIComponent(token)}`;
}

/**
 * Subscribe to the TeamPresenceChannel via ActionCable and maintain
 * a live set of online user IDs for the current user's team.
 *
 * Includes automatic reconnection with exponential back-off.
 */
export function useTeamPresence(token: string | null): Set<number> {
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const retryRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    unmountedRef.current = false;
    retryRef.current = 0;

    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (unmountedRef.current) return;

      const url = cableUrl(token!);
      ws = new WebSocket(url);

      ws.onopen = () => {
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
          if (
            data.message &&
            typeof data.message === 'object' &&
            data.message.type === 'presence_update' &&
            Array.isArray(data.message.online_user_ids)
          ) {
            setOnlineIds(new Set<number>(data.message.online_user_ids));
          }
        } catch {
          // ignore non-JSON or unexpected frames
        }
      };

      ws.onclose = () => {
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
  }, [token]);

  return onlineIds;
}
