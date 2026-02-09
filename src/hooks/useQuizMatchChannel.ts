import { useEffect, useRef } from 'react';
import type { QuizMatchState } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function cableUrl(token: string): string {
  const base = API_URL.replace(/^http/, 'ws');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}/cable${sep}token=${encodeURIComponent(token)}`;
}

export function useQuizMatchChannel(
  matchId: number | null,
  token: string | null,
  onState: (state: QuizMatchState) => void
): void {
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    if (matchId == null || !token) return;

    const url = cableUrl(token);
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
  }, [matchId, token]);
}
