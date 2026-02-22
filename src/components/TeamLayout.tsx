import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { api } from '../api/client';
import type { QuizMatchState } from '../api/client';

const POLL_INTERVAL_MS = 5000;

const BOTTOM_NAV = [
  {
    to: '/team/dashboard',
    matchPaths: ['/team', '/team/dashboard'],
    label: 'Home',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.061l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.689z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15.75a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
      </svg>
    ),
  },
  {
    to: '/team/flashcards',
    matchPaths: ['/team/flashcards'],
    label: 'Flashcards',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
        <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
      </svg>
    ),
  },
  {
    to: '/team/quiz',
    matchPaths: ['/team/quiz'],
    label: 'Quiz',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/team/my-progress',
    matchPaths: ['/team/my-progress', '/team/leaderboard', '/team/match-history'],
    label: 'Progress',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const TEAM_LEAD_NAV = [
  { to: '/team/dashboard', label: 'Dashboard' },
  { to: '/team/activity', label: 'Team activity' },
  { to: '/team/management', label: 'Team management' },
  { to: '/team/books', label: 'Books & assignments' },
];

export function TeamLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingInvite, setPendingInvite] = useState<QuizMatchState | null>(null);
  const location = useLocation();

  const checkPendingInvite = useCallback(() => {
    api
      .getPendingQuizMatchInvite()
      .then((data) => {
        const invite = data && typeof data === 'object' && 'id' in data ? data : null;
        console.log('[QuizMatch] pending_invite result', invite ? { matchId: (data as { id: number }).id, status: (data as { status?: string }).status } : null);
        setPendingInvite(invite);
      })
      .catch((err) => {
        console.log('[QuizMatch] pending_invite error', err);
        setPendingInvite(null);
      });
  }, []);

  useEffect(() => {
    checkPendingInvite();
    const interval = setInterval(checkPendingInvite, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkPendingInvite]);

  useEffect(() => {
    checkPendingInvite();
  }, [location.pathname, checkPendingInvite]);

  useEffect(() => {
    const handler = () => {
      setPendingInvite(null);
    };
    window.addEventListener('quiz-invite-cleared', handler);
    return () => window.removeEventListener('quiz-invite-cleared', handler);
  }, []);

  const onMatchPage =
    location.pathname.startsWith('/team/quiz-match/') &&
    pendingInvite &&
    location.pathname === `/team/quiz-match/${pendingInvite.id}`;
  const showBanner = pendingInvite != null && !onMatchPage;
  const showTabs = user?.role === 'team_lead';

  return (
    <>
      {showBanner && (
        <div
          className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b-2 border-primary-400 bg-primary-500 px-4 py-2.5 text-white shadow-md animate-banner-slide"
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
      {showTabs && (
        <div className="bg-white border-b border-stone-200">
          <div className="flex gap-1 px-4 mx-auto max-w-7xl">
            {TEAM_LEAD_NAV.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <div className="pb-20">
        {children}
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {BOTTOM_NAV.map((item) => {
            const isActive = item.matchPaths.includes(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-stone-400 active:text-stone-600'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for notched devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
