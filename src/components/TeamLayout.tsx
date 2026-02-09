import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { QuizMatchState } from '../api/client';

const POLL_INTERVAL_MS = 5000;

export function TeamLayout({ children }: { children: React.ReactNode }) {
  const [pendingInvite, setPendingInvite] = useState<QuizMatchState | null>(null);
  const location = useLocation();

  const checkPendingInvite = useCallback(() => {
    api
      .getPendingQuizMatchInvite()
      .then((data) => setPendingInvite(data ?? null))
      .catch(() => setPendingInvite(null));
  }, []);

  useEffect(() => {
    checkPendingInvite();
    const interval = setInterval(checkPendingInvite, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkPendingInvite]);

  useEffect(() => {
    checkPendingInvite();
  }, [location.pathname, checkPendingInvite]);

  const onMatchPage =
    location.pathname.startsWith('/team/quiz-match/') &&
    pendingInvite &&
    location.pathname === `/team/quiz-match/${pendingInvite.id}`;
  const showBanner = pendingInvite != null && !onMatchPage;

  return (
    <>
      {showBanner && (
        <div
          className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b-2 border-primary-400 bg-primary-500 px-4 py-2.5 text-white shadow-md"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">
            {pendingInvite.challenger_username} challenged you to a quiz!
          </p>
          <Link
            to={`/team/quiz-match/${pendingInvite.id}`}
            className="shrink-0 rounded bg-white px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-500"
          >
            Accept or decline →
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
