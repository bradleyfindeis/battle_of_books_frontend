import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { QuizMatchState } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function cableUrl(): string {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
  const path = '/cable';
  const token = api.getUserToken();
  if (token) {
    const separator = path.includes('?') ? '&' : '?';
    return `${base}${path}${separator}token=${encodeURIComponent(token)}`;
  }
  return `${base}${path}`;
}

export function useQuizMatchChannel(
  matchId: number | null,
  isConnected: boolean,
  onState: (state: QuizMatchState) => void
): void {
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    if (matchId == null || !isConnected) return;

    const url = cableUrl();
    const ws = new WebSocket(url);

    ws.onopen = () => {
      const subscribe = {
        command: 'subscribe',
        identifier: JSON.stringify({ channel: 'QuizMatchChannel', match_id: matchId }),
      };
      ws.send(JSON.stringify(subscribe));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message && typeof data.message === 'object') {
          onStateRef.current(data.message as QuizMatchState);
        }
      } catch {
        // ignore non-JSON or unexpected frames
      }
    };

    return () => {
      ws.close();
    };
  }, [matchId, isConnected]);
}
