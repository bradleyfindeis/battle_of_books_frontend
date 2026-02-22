import { useEffect, useRef } from 'react';
import type { QuizMatchState } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function cableUrl(): string {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/+$/, '');
  return `${base}/cable`;
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
    console.log('[QuizMatch] channel connecting', { matchId, url: url.replace(/\?.*/, '?…') });
    const ws = new WebSocket(url);

    ws.onopen = () => {
      const subscribe = {
        command: 'subscribe',
        identifier: JSON.stringify({ channel: 'QuizMatchChannel', match_id: matchId }),
      };
      ws.send(JSON.stringify(subscribe));
      console.log('[QuizMatch] channel subscribe sent', { matchId });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message && typeof data.message === 'object') {
          const state = data.message as QuizMatchState;
          console.log('[QuizMatch] channel message', { matchId: state.id, status: state.status, phase: state.phase });
          onStateRef.current(state);
        }
      } catch {
        // ignore non-JSON or unexpected frames
      }
    };

    ws.onclose = (ev) => {
      console.log('[QuizMatch] channel closed', { matchId, code: ev.code, reason: ev.reason });
    };
    ws.onerror = () => {
      console.log('[QuizMatch] channel error', { matchId });
    };

    return () => {
      ws.close();
    };
  }, [matchId, isConnected]);
}
