import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import { useTeamPresence } from '../../hooks/useTeamPresence';
import { starBurst, smallBurst } from '../../utils/confetti';
import type {
  Badge,
  BookAssignment,
  ChallengeableTeammate,
  MatchingGameTeamStatsResponse,
  FlashcardDeckTeamStatsResponse,
  QuizTeamStatsResponse,
  WeeklySummaryResponse,
  TeamReadingProgressResponse,
  DailyQuestionResponse,
} from '../../api/client';

const AVATAR_OPTIONS = [
  '🦊', '🐼', '🦁', '🐯', '🐻', '🐨', '🐸', '🐵',
  '🦄', '🐲', '🦅', '🐬', '🦋', '🐙', '🦉', '🐺',
  '🐱', '🐶', '🐰', '🐮', '🐷', '🐔', '🐧', '🐢',
  '🦈', '🦜', '🦩', '🐝', '🌟', '⚡', '🔥', '🌈',
];

const STATUS_LABELS: Record<BookAssignment['status'], string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function TeamDashboard() {
  const { user, team, logout, isDemoMode, exitDemo, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [myBooks, setMyBooks] = useState<BookAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingGameHighScore, setMatchingGameHighScore] = useState<number | null>(null);
  const [teamMatchingGameStats, setTeamMatchingGameStats] = useState<MatchingGameTeamStatsResponse | null>(null);
  const [flashcardDeckTimesCompleted, setFlashcardDeckTimesCompleted] = useState<number>(0);
  const [teamFlashcardDeckStats, setTeamFlashcardDeckStats] = useState<FlashcardDeckTeamStatsResponse | null>(null);
  const [quizHighScore, setQuizHighScore] = useState<number | null>(null);
  const [teamQuizStats, setTeamQuizStats] = useState<QuizTeamStatsResponse | null>(null);

  const [challengeableTeammates, setChallengeableTeammates] = useState<ChallengeableTeammate[]>([]);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);

  // Activity streak
  const [streak, setStreak] = useState<number>(0);
  const [activeToday, setActiveToday] = useState(false);

  // Badges
  const [badges, setBadges] = useState<Badge[]>([]);

  // Weekly summary
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryResponse | null>(null);

  // Team reading progress
  const [teamReading, setTeamReading] = useState<TeamReadingProgressResponse | null>(null);

  // Daily spotlight question
  const [dailyQ, setDailyQ] = useState<DailyQuestionResponse | null>(null);
  const [dailySelectedId, setDailySelectedId] = useState<number | null>(null);
  const [dailySubmitting, setDailySubmitting] = useState(false);
  const [dailyRevealed, setDailyRevealed] = useState(false);
  const [dailyExpanded, setDailyExpanded] = useState(true);

  // Onboarding welcome card
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    return localStorage.getItem('bob_welcome_dismissed') === 'true';
  });

  // Avatar picker
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Real-time presence tracking
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const onlineUserIds = useTeamPresence(token);

  // Sort teammates: online first, then alphabetical
  const sortedTeammates = useMemo(() => {
    return [...challengeableTeammates].sort((a, b) => {
      const aOnline = onlineUserIds.has(a.id) ? 1 : 0;
      const bOnline = onlineUserIds.has(b.id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return a.username.localeCompare(b.username);
    });
  }, [challengeableTeammates, onlineUserIds]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Edit assignment progress (teammates only on this page)
  const [editProgressAssignment, setEditProgressAssignment] = useState<BookAssignment | null>(null);
  const [editProgressStatus, setEditProgressStatus] = useState<BookAssignment['status']>('assigned');
  const [editProgressNotes, setEditProgressNotes] = useState('');
  const [editProgressPercent, setEditProgressPercent] = useState<number>(0);
  const [editProgressSubmitting, setEditProgressSubmitting] = useState(false);
  const [editProgressError, setEditProgressError] = useState<string | null>(null);

  // Team leads don't have reading assignments; skip the API call
  useEffect(() => {
    if (user?.role === 'team_lead') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .getMyBooks()
      .then((data) => {
        if (!cancelled) setMyBooks(data);
      })
      .catch(() => {
        if (!cancelled) setMyBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyMatchingGameStats()
      .then((data) => {
        if (!cancelled) setMatchingGameHighScore(data.high_score);
      })
      .catch(() => {
        if (!cancelled) setMatchingGameHighScore(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api
      .getTeamMatchingGameStats()
      .then((data) => {
        if (!cancelled) setTeamMatchingGameStats(data);
      })
      .catch(() => {
        if (!cancelled) setTeamMatchingGameStats(null);
      });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyFlashcardDeckStats()
      .then((data) => {
        if (!cancelled) setFlashcardDeckTimesCompleted(data.times_completed);
      })
      .catch(() => {
        if (!cancelled) setFlashcardDeckTimesCompleted(0);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!team?.book_list_id) return;
    let cancelled = false;
    api
      .getMyQuizStats()
      .then((data) => {
        if (!cancelled) setQuizHighScore(data.high_score);
      })
      .catch(() => {
        if (!cancelled) setQuizHighScore(null);
      });
    return () => { cancelled = true; };
  }, [team?.book_list_id]);

  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api
      .getTeamFlashcardDeckStats()
      .then((data) => {
        if (!cancelled) setTeamFlashcardDeckStats(data);
      })
      .catch(() => {
        if (!cancelled) setTeamFlashcardDeckStats(null);
      });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'team_lead' || !team?.book_list_id) return;
    let cancelled = false;
    api
      .getTeamQuizStats()
      .then((data) => {
        if (!cancelled) setTeamQuizStats(data);
      })
      .catch(() => {
        if (!cancelled) setTeamQuizStats(null);
      });
    return () => { cancelled = true; };
  }, [user?.role, team?.book_list_id]);

  useEffect(() => {
    if (!team?.book_list_id) return;
    let cancelled = false;
    api.getChallengeableTeammates().then((data) => {
      if (!cancelled) setChallengeableTeammates(data);
    }).catch(() => {
      if (!cancelled) setChallengeableTeammates([]);
    });
    return () => { cancelled = true; };
  }, [team?.book_list_id]);

  useEffect(() => {
    let cancelled = false;
    api.getMyStreak().then((data) => {
      if (!cancelled) {
        setStreak(data.streak);
        setActiveToday(data.active_today);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getMyBadges().then((data) => {
      if (!cancelled) {
        setBadges(data.badges);
        // Detect newly earned badges and fire confetti
        const storageKey = 'bob_earned_badges';
        const prev = new Set<string>(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        const currentEarned = data.badges.filter((b) => b.earned).map((b) => b.key);
        const newlyEarned = currentEarned.filter((k) => !prev.has(k));
        if (newlyEarned.length > 0 && prev.size > 0) {
          // Only fire if they had badges before (not first load ever)
          starBurst();
        }
        localStorage.setItem(storageKey, JSON.stringify(currentEarned));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getMyWeeklySummary().then((data) => {
      if (!cancelled) setWeeklySummary(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getTeamReadingProgress().then((data) => {
      if (!cancelled) setTeamReading(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch daily spotlight question
  useEffect(() => {
    let cancelled = false;
    api.getDailyQuestion().then((data) => {
      if (!cancelled) {
        setDailyQ(data);
        if (data.already_answered) {
          setDailyRevealed(true);
          setDailyExpanded(false);
          setDailySelectedId(data.my_choice_id ?? null);
        }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleDailyAnswer = async () => {
    if (!dailySelectedId || !dailyQ?.question_id) return;
    setDailySubmitting(true);
    try {
      const result = await api.answerDailyQuestion(dailySelectedId);
      setDailyQ((prev) => prev ? {
        ...prev,
        already_answered: true,
        my_choice_id: dailySelectedId,
        correct: result.correct,
        correct_answer_id: result.correct_answer_id,
        team_answered: result.team_answered,
        team_correct: result.team_correct,
      } : prev);
      setDailyRevealed(true);
      if (result.correct) smallBurst();
    } catch { /* ignore */ }
    setDailySubmitting(false);
  };

  const handleSelectAvatar = async (emoji: string | null) => {
    setAvatarSaving(true);
    try {
      await api.updateMyAvatar(emoji);
      await refreshMe();
    } catch { /* ignore */ }
    setAvatarSaving(false);
    setShowAvatarPicker(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/team/login', { replace: true });
  };

  const handleExitDemo = () => {
    exitDemo();
    navigate('/admin', { replace: true });
  };

  const openEditProgress = (assignment: BookAssignment) => {
    setEditProgressAssignment(assignment);
    setEditProgressStatus(assignment.status);
    setEditProgressNotes(assignment.progress_notes ?? '');
    setEditProgressPercent(assignment.progress_percent ?? 0);
    setEditProgressError(null);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProgressAssignment) return;
    setEditProgressSubmitting(true);
    setEditProgressError(null);
    api
      .updateAssignment(editProgressAssignment.id, editProgressStatus, editProgressNotes || undefined, editProgressPercent)
      .then(() => {
        api.getMyBooks().then(setMyBooks);
        setEditProgressAssignment(null);
        setToastMessage('Progress updated');
      })
      .catch(() => setEditProgressError('Failed to update progress'))
      .finally(() => setEditProgressSubmitting(false));
  };

  // Smart study recommendations based on current data
  const recommendations = useMemo(() => {
    if (!user || !team) return [];
    // Skip recommendations for team leads (they manage, not study)
    if (user.role === 'team_lead') return [];

    const recs: { emoji: string; text: string; link: string; linkLabel: string }[] = [];

    // Not active today — nudge
    if (!activeToday) {
      recs.push({
        emoji: '👋',
        text: 'You haven\'t done an activity yet today. Keep your streak going!',
        link: '/team/flashcards',
        linkLabel: 'Quick practice',
      });
    }

    // Never tried flashcards
    if (flashcardDeckTimesCompleted === 0) {
      recs.push({
        emoji: '🃏',
        text: 'Flashcards are a great way to learn titles and authors before quizzing.',
        link: '/team/flashcards',
        linkLabel: 'Try flashcards',
      });
    }

    // Never tried matching game
    if (matchingGameHighScore === null || matchingGameHighScore === 0) {
      recs.push({
        emoji: '🧩',
        text: 'Test your memory by matching books to authors in the matching game.',
        link: '/team/matching-game',
        linkLabel: 'Play matching game',
      });
    }

    // Has flashcard experience but never tried quiz
    if (flashcardDeckTimesCompleted > 0 && (quizHighScore === null || quizHighScore === 0) && team.book_list_id) {
      recs.push({
        emoji: '📝',
        text: 'You\'ve practiced flashcards — ready to test yourself with a quiz?',
        link: '/team/quiz',
        linkLabel: 'Take a quiz',
      });
    }

    // Has quiz experience but never challenged anyone
    if (quizHighScore !== null && quizHighScore > 0 && challengeableTeammates.length > 0 && weeklySummary && weeklySummary.matches_played === 0) {
      recs.push({
        emoji: '⚔️',
        text: 'You\'re doing great on quizzes — challenge a teammate to a head-to-head match!',
        link: '#challenge',
        linkLabel: 'See teammates below',
      });
    }

    // Has unfinished books
    const unfinishedBooks = myBooks.filter((b) => b.status !== 'completed');
    if (unfinishedBooks.length > 0) {
      const nextBook = unfinishedBooks[0];
      const pct = nextBook.progress_percent ?? 0;
      if (pct > 0 && pct < 100) {
        recs.push({
          emoji: '📖',
          text: `You're ${pct}% through "${nextBook.book?.title ?? 'your book'}" — keep reading!`,
          link: '#reading',
          linkLabel: 'Update progress',
        });
      }
    }

    // Doing well — encouragement
    if (quizHighScore !== null && quizHighScore > 0 && weeklySummary && weeklySummary.quizzes_completed >= 3) {
      recs.push({
        emoji: '🌟',
        text: `${weeklySummary.quizzes_completed} quizzes this week with an avg of ${weeklySummary.quiz_avg_score}% — you're on a roll!`,
        link: '/team/my-progress',
        linkLabel: 'View progress',
      });
    }

    // Limit to top 3 most relevant
    return recs.slice(0, 3);
  }, [user, team, activeToday, flashcardDeckTimesCompleted, matchingGameHighScore, quizHighScore, challengeableTeammates, weeklySummary, myBooks]);

  // Show welcome card for brand-new teammates who haven't done any activity
  const isNewUser = user?.role !== 'team_lead'
    && !welcomeDismissed
    && flashcardDeckTimesCompleted === 0
    && (matchingGameHighScore === null || matchingGameHighScore === 0)
    && (quizHighScore === null || quizHighScore === 0)
    && streak === 0;

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    localStorage.setItem('bob_welcome_dismissed', 'true');
  };

  if (!user || !team) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <button
                type="button"
                onClick={handleExitDemo}
                className="px-3 py-2 text-sm font-medium text-primary-700 rounded-lg border border-primary-300 bg-primary-50 hover:bg-primary-100 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
              >
                Exit demo
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-stone-700 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAvatarPicker((v) => !v)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-stone-100 border-2 border-stone-200 hover:border-primary-300 hover:bg-primary-50 transition text-2xl focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Change avatar"
                aria-label="Change avatar"
              >
                {user.avatar_emoji || '😊'}
              </button>
              {showAvatarPicker && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                  <p className="text-xs font-medium text-stone-500 mb-2">Choose your avatar</p>
                  <div className="grid grid-cols-8 gap-1">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        disabled={avatarSaving}
                        onClick={() => handleSelectAvatar(emoji)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition hover:bg-primary-100 ${
                          user.avatar_emoji === emoji ? 'bg-primary-200 ring-2 ring-primary-400' : ''
                        } disabled:opacity-50`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {user.avatar_emoji && (
                    <button
                      type="button"
                      disabled={avatarSaving}
                      onClick={() => handleSelectAvatar(null)}
                      className="mt-2 w-full text-xs text-stone-500 hover:text-stone-700 transition disabled:opacity-50"
                    >
                      Remove avatar
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Team: {team.name}</h2>
              <p className="text-sm text-stone-500">
                Signed in as {user.username}
                {user.role === 'team_lead' && (
                  <span className="ml-2 text-stone-400">· Team ID: {team.id} (use with your password to sign in)</span>
                )}
              </p>
            </div>
          </div>
          {streak > 0 && (
            <div
              className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 shrink-0"
              title={activeToday ? 'You\'ve been active today!' : 'Complete an activity today to keep your streak going!'}
            >
              <span className="text-xl" aria-hidden>🔥</span>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-800 leading-tight">{streak}-day streak</p>
                <p className="text-xs text-amber-600">
                  {activeToday ? 'Active today' : 'Do an activity to keep it!'}
                </p>
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
          </div>
        ) : (
          <>
            {/* Welcome onboarding card for new users */}
            {isNewUser && (
              <Card className="mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-primary-100 opacity-50" />
                <div className="absolute bottom-0 left-0 w-20 h-20 -ml-6 -mb-6 rounded-full bg-amber-100 opacity-40" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">
                        Welcome to Battle of the Books, {user.username}!
                      </h3>
                      <p className="mt-1 text-sm text-stone-600">
                        Get ready to learn, compete, and have fun with your team. Here's how to get started:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissWelcome}
                      className="shrink-0 rounded-lg p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
                      title="Dismiss"
                      aria-label="Dismiss welcome message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Link
                      to="/team/flashcards"
                      onClick={dismissWelcome}
                      className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-3 transition hover:bg-primary-100"
                    >
                      <span className="text-2xl shrink-0 mt-0.5" aria-hidden>1</span>
                      <div>
                        <p className="font-semibold text-primary-800 text-sm">Learn with flashcards</p>
                        <p className="text-xs text-primary-600 mt-0.5">Flip through cards to learn book titles and their authors.</p>
                      </div>
                    </Link>
                    <Link
                      to="/team/quiz"
                      onClick={dismissWelcome}
                      className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-3 transition hover:bg-violet-100"
                    >
                      <span className="text-2xl shrink-0 mt-0.5" aria-hidden>2</span>
                      <div>
                        <p className="font-semibold text-violet-800 text-sm">Test yourself with a quiz</p>
                        <p className="text-xs text-violet-600 mt-0.5">Answer questions about the books and track your high score.</p>
                      </div>
                    </Link>
                    <Link
                      to="/team/matching-game"
                      onClick={dismissWelcome}
                      className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 transition hover:bg-emerald-100"
                    >
                      <span className="text-2xl shrink-0 mt-0.5" aria-hidden>3</span>
                      <div>
                        <p className="font-semibold text-emerald-800 text-sm">Play the matching game</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Match books to authors against the clock at different difficulties.</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Weekly summary */}
            {weeklySummary && (weeklySummary.quizzes_completed > 0 || weeklySummary.matches_played > 0 || weeklySummary.books_finished > 0 || weeklySummary.days_active > 0) && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">This week</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-center">
                    <p className="text-2xl font-bold text-primary-700">{weeklySummary.quizzes_completed}</p>
                    <p className="text-xs font-medium text-primary-600 mt-1">
                      {weeklySummary.quizzes_completed === 1 ? 'Quiz' : 'Quizzes'}
                    </p>
                    {weeklySummary.quizzes_completed > 0 && (
                      <p className="text-[10px] text-primary-500 mt-0.5">avg {weeklySummary.quiz_avg_score}%</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
                    <p className="text-2xl font-bold text-violet-700">{weeklySummary.matches_played}</p>
                    <p className="text-xs font-medium text-violet-600 mt-1">
                      {weeklySummary.matches_played === 1 ? 'Match' : 'Matches'}
                    </p>
                    {weeklySummary.matches_played > 0 && (
                      <p className="text-[10px] text-violet-500 mt-0.5">{weeklySummary.matches_won} won</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{weeklySummary.books_finished}</p>
                    <p className="text-xs font-medium text-emerald-600 mt-1">
                      {weeklySummary.books_finished === 1 ? 'Book finished' : 'Books finished'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{weeklySummary.days_active}</p>
                    <p className="text-xs font-medium text-amber-600 mt-1">
                      {weeklySummary.days_active === 1 ? 'Day active' : 'Days active'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Teammate Quiz activity — shown first for team leads */}
            {user?.role === 'team_lead' && team?.book_list_id != null && teamQuizStats && teamQuizStats.teammates.length > 0 && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Teammate Quiz activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 pr-4 font-medium text-stone-700">Teammate</th>
                        <th className="py-2 pr-4 font-medium text-stone-700">Attempts</th>
                        <th className="py-2 pr-4 font-medium text-stone-700">High score</th>
                        <th className="py-2 font-medium text-stone-700">Per attempt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {teamQuizStats.teammates.map((t) => (
                        <tr key={t.user_id}>
                          <td className="py-3 pr-4 font-medium text-stone-900">{t.username}</td>
                          <td className="py-3 pr-4 text-stone-600">{t.attempt_count}</td>
                          <td className="py-3 pr-4 text-stone-600">{t.high_score}</td>
                          <td className="py-3 text-stone-600">
                            {t.attempts.length === 0
                              ? '—'
                              : (
                                  <ul className="list-inside list-disc space-y-0.5">
                                    {t.attempts.map((a, i) => (
                                      <li key={i}>
                                        Attempt {i + 1}: {a.correct_count}/{a.total_count} correct
                                      </li>
                                    ))}
                                  </ul>
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {/* Teammate Flashcard activity */}
            {user?.role === 'team_lead' && teamFlashcardDeckStats && teamFlashcardDeckStats.teammates.length > 0 && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Teammate Flashcard activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 pr-4 font-medium text-stone-700">Teammate</th>
                        <th className="py-2 pr-4 font-medium text-stone-700">Times started</th>
                        <th className="py-2 font-medium text-stone-700">Times completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {teamFlashcardDeckStats.teammates.map((t) => (
                        <tr key={t.user_id}>
                          <td className="py-3 pr-4 font-medium text-stone-900">{t.username}</td>
                          <td className="py-3 pr-4 text-stone-600">{t.times_started}</td>
                          <td className="py-3 text-stone-600">{t.times_completed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {/* Teammate Matching Game activity */}
            {user?.role === 'team_lead' && teamMatchingGameStats && teamMatchingGameStats.teammates.length > 0 && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Teammate Matching Game activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 pr-4 font-medium text-stone-700">Teammate</th>
                        <th className="py-2 pr-4 font-medium text-stone-700">Attempts</th>
                        <th className="py-2 pr-4 font-medium text-stone-700">High score</th>
                        <th className="py-2 font-medium text-stone-700">Per attempt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {teamMatchingGameStats.teammates.map((t) => (
                        <tr key={t.user_id}>
                          <td className="py-3 pr-4 font-medium text-stone-900">{t.username}</td>
                          <td className="py-3 pr-4 text-stone-600">{t.attempt_count}</td>
                          <td className="py-3 pr-4 text-stone-600">{t.high_score}</td>
                          <td className="py-3 text-stone-600">
                            {t.attempts.length === 0
                              ? '—'
                              : (
                                  <ul className="list-inside list-disc space-y-0.5">
                                    {t.attempts.map((a, i) => (
                                      <li key={i}>
                                        Attempt {i + 1}: {a.correct_count}/{a.total_count} correct
                                      </li>
                                    ))}
                                  </ul>
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {/* My reading progress — teammates only (team leads have no reading assignments) */}
            {user?.role !== 'team_lead' && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">My reading progress</h3>
                {myBooks.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-2xl mb-2" aria-hidden>📚</p>
                    <p className="font-medium text-stone-900">No books assigned yet</p>
                    <p className="mt-1 text-sm text-stone-500">Your team lead will assign books to you soon. In the meantime, try the activities below!</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {myBooks.map((a) => (
                      <li
                        key={a.id}
                        className="py-3 border-b border-stone-100 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-stone-900">{a.book?.title ?? 'Unknown book'}</span>
                            {a.book?.author && <span className="ml-2 text-sm text-stone-600">— {a.book.author}</span>}
                            {a.progress_notes && (
                              <p className="mt-1 text-sm text-stone-500 line-clamp-2">{a.progress_notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-sm font-medium px-2 py-1 rounded ${
                                a.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'in_progress'
                                    ? 'bg-primary-100 text-primary-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {STATUS_LABELS[a.status]}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditProgress(a)}
                              className="text-sm text-primary-600 hover:text-primary-700 focus:outline"
                              title="Update progress"
                            >
                              Update progress
                            </button>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                a.status === 'completed' || (a.progress_percent ?? 0) === 100
                                  ? 'bg-emerald-500'
                                  : (a.progress_percent ?? 0) > 0
                                    ? 'bg-primary-500'
                                    : 'bg-stone-200'
                              }`}
                              style={{ width: `${a.status === 'completed' ? 100 : (a.progress_percent ?? 0)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-stone-500 tabular-nums w-8 text-right">
                            {a.status === 'completed' ? 100 : (a.progress_percent ?? 0)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            {/* Daily spotlight question */}
            {dailyQ?.available && dailyQ.question_text && dailyQ.choices && (
              <Card className="mb-8">
                <button
                  type="button"
                  onClick={() => setDailyExpanded((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={dailyExpanded}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>💡</span>
                    <h3 className="text-lg font-semibold text-stone-900">Question of the day</h3>
                    {dailyRevealed && !dailyExpanded && (
                      <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${dailyQ.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {dailyQ.correct ? '✓ Answered' : '✗ Answered'}
                      </span>
                    )}
                  </div>
                  <span className={`text-xl text-stone-400 transition-transform ${dailyExpanded ? 'rotate-180' : ''}`} aria-hidden>
                    &#9662;
                  </span>
                </button>
                {dailyExpanded && (
                  <div className="mt-4">
                    <p className="text-stone-800 font-medium mb-4">{dailyQ.question_text}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {dailyQ.choices.map((choice) => {
                        const isSelected = dailySelectedId === choice.id;
                        const isCorrectAnswer = dailyRevealed && choice.id === dailyQ.correct_answer_id;
                        const isWrongChoice = dailyRevealed && isSelected && !dailyQ.correct;

                        let borderClass = 'border-stone-200';
                        let bgClass = 'bg-white hover:bg-stone-50';
                        if (dailyRevealed) {
                          if (isCorrectAnswer) {
                            borderClass = 'border-emerald-400';
                            bgClass = 'bg-emerald-50';
                          } else if (isWrongChoice) {
                            borderClass = 'border-red-300';
                            bgClass = 'bg-red-50';
                          } else {
                            bgClass = 'bg-white opacity-60';
                          }
                        } else if (isSelected) {
                          borderClass = 'border-primary-400';
                          bgClass = 'bg-primary-50';
                        }

                        return (
                          <button
                            key={choice.id}
                            type="button"
                            disabled={dailyRevealed || dailySubmitting}
                            onClick={() => setDailySelectedId(choice.id)}
                            className={`text-left rounded-xl border-2 ${borderClass} ${bgClass} px-4 py-3 transition disabled:cursor-default`}
                          >
                            <span className="text-sm font-medium text-stone-900">{choice.title}</span>
                            {choice.author && (
                              <span className="block text-xs text-stone-500 mt-0.5">by {choice.author}</span>
                            )}
                            {dailyRevealed && isCorrectAnswer && (
                              <span className="text-xs font-medium text-emerald-700 mt-1 block">✓ Correct answer</span>
                            )}
                            {dailyRevealed && isWrongChoice && (
                              <span className="text-xs font-medium text-red-600 mt-1 block">✗ Your answer</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!dailyRevealed && (
                      <button
                        type="button"
                        disabled={!dailySelectedId || dailySubmitting}
                        onClick={handleDailyAnswer}
                        className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        {dailySubmitting ? 'Submitting...' : 'Lock in answer'}
                      </button>
                    )}
                    {dailyRevealed && (
                      <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                        <span>
                          {dailyQ.correct
                            ? <span className="text-emerald-700 font-medium">🎉 You got it!</span>
                            : <span className="text-red-600 font-medium">Not quite — check out the correct answer above.</span>
                          }
                        </span>
                        {(dailyQ.team_answered ?? 0) > 0 && (
                          <span className="text-stone-500">
                            {dailyQ.team_correct}/{dailyQ.team_answered} teammates got it right
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Team reading progress */}
            {teamReading && teamReading.total_assignments > 0 && (
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">Team reading goal</h3>
                {/* Overall progress bar */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      {teamReading.completed_count} of {teamReading.total_assignments} books completed
                    </span>
                    <span className="text-sm font-semibold text-stone-900 tabular-nums">
                      {teamReading.total_assignments > 0 ? Math.round((teamReading.completed_count / teamReading.total_assignments) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${teamReading.total_assignments > 0 ? (teamReading.completed_count / teamReading.total_assignments) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-stone-500">
                    <span>{teamReading.completed_count} completed</span>
                    <span>{teamReading.in_progress_count} in progress</span>
                    <span>{teamReading.total_assignments - teamReading.completed_count - teamReading.in_progress_count} not started</span>
                  </div>
                </div>

                {/* Per-teammate mini bars */}
                {teamReading.teammates.length > 0 && (
                  <div className="border-t border-stone-100 pt-3">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Teammate progress</p>
                    <div className="space-y-2">
                      {teamReading.teammates.map((t) => (
                        <div key={t.user_id} className="flex items-center gap-3">
                          <span className={`text-sm w-28 truncate flex items-center gap-1.5 ${t.user_id === user?.id ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                            {t.avatar_emoji && <span className="text-sm shrink-0" aria-hidden>{t.avatar_emoji}</span>}
                            {t.user_id === user?.id ? 'You' : t.username}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                t.avg_progress === 100 ? 'bg-emerald-500' : t.avg_progress > 0 ? 'bg-primary-500' : 'bg-stone-200'
                              }`}
                              style={{ width: `${t.avg_progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-500 tabular-nums w-16 text-right">
                            {t.books_completed}/{t.books_assigned}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently completed */}
                {teamReading.recently_completed.length > 0 && (
                  <div className="border-t border-stone-100 pt-3 mt-3">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Recently finished</p>
                    <ul className="space-y-1">
                      {teamReading.recently_completed.map((rc, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-500 shrink-0" aria-hidden>&#10003;</span>
                          <span className="font-medium text-stone-800">{rc.username}</span>
                          <span className="text-stone-500">finished</span>
                          <span className="text-stone-700 italic truncate">{rc.book_title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* Feature links */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {team?.leaderboard_enabled !== false && (
                <Link
                  to="/team/leaderboard"
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card transition duration-200 hover:shadow-md hover:border-stone-200"
                >
                  <span className="text-2xl" aria-hidden>🏆</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900">Team Leaderboard</h3>
                    <p className="text-sm text-stone-600">See how you rank against your teammates.</p>
                  </div>
                  <span className="text-stone-400" aria-hidden>&rarr;</span>
                </Link>
              )}
              <Link
                to="/team/my-progress"
                className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card transition duration-200 hover:shadow-md hover:border-stone-200"
              >
                <span className="text-2xl" aria-hidden>📊</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900">My Progress</h3>
                  <p className="text-sm text-stone-600">Quiz trends, match record, reading stats, and more.</p>
                </div>
                <span className="text-stone-400" aria-hidden>&rarr;</span>
              </Link>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">Badges</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {badges.map((badge) => (
                    <div
                      key={badge.key}
                      className={`rounded-xl border p-3 text-center transition ${
                        badge.earned
                          ? 'border-amber-200 bg-amber-50 shadow-sm'
                          : 'border-stone-200 bg-stone-50 opacity-50'
                      }`}
                      title={badge.earned ? `${badge.name} — ${badge.description}` : `${badge.name} (locked) — ${badge.description}`}
                    >
                      <p className={`text-2xl ${badge.earned ? '' : 'grayscale'}`} aria-hidden>
                        {badge.emoji}
                      </p>
                      <p className={`mt-1 text-xs font-semibold leading-tight ${badge.earned ? 'text-stone-900' : 'text-stone-500'}`}>
                        {badge.name}
                      </p>
                      {badge.progress && (
                        <p className="mt-0.5 text-[10px] text-stone-500 leading-tight">{badge.progress}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart recommendations */}
            {recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-3">Recommended for you</h3>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="text-lg shrink-0" aria-hidden>{rec.emoji}</span>
                      <p className="flex-1 text-sm text-stone-700">{rec.text}</p>
                      {rec.link.startsWith('/') ? (
                        <Link
                          to={rec.link}
                          className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 transition whitespace-nowrap"
                        >
                          {rec.linkLabel} &rarr;
                        </Link>
                      ) : (
                        <span className="shrink-0 text-sm font-medium text-stone-400 whitespace-nowrap">
                          {rec.linkLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Activities</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card hover>
                  <h4 className="font-semibold text-stone-900">Matching Game</h4>
                  <p className="mt-1 text-sm text-stone-600">Match each book title to its author. Earn points for each correct match.</p>
                  <p className="mt-2 text-sm text-stone-700">
                    {matchingGameHighScore !== null && matchingGameHighScore > 0
                      ? `High score: ${matchingGameHighScore}`
                      : 'Ready to test your memory? Give it a try!'}
                  </p>
                  <Link
                    to="/team/matching-game"
                    className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Play
                  </Link>
                </Card>
                <Card hover>
                  <h4 className="font-semibold text-stone-900">Flashcards</h4>
                  <p className="mt-1 text-sm text-stone-600">Learn book titles and authors. Flip each card to see the author, then advance through the deck.</p>
                  <p className="mt-2 text-sm text-stone-700">
                    {flashcardDeckTimesCompleted > 0
                      ? `Times completed: ${flashcardDeckTimesCompleted}`
                      : 'Start here to learn all the titles and authors.'}
                  </p>
                  <Link
                    to="/team/flashcards"
                    className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Practice
                  </Link>
                </Card>
                <Card hover>
                  <h4 className="font-semibold text-stone-900">Quiz</h4>
                  <p className="mt-1 text-sm text-stone-600">Answer &quot;In which book does…?&quot; for each question; select the book and author.</p>
                  <p className="mt-2 text-sm text-stone-700">
                    {team?.book_list_id != null
                      ? (quizHighScore !== null && quizHighScore > 0
                          ? `High score: ${quizHighScore}`
                          : 'Think you know the books? Put yourself to the test!')
                      : 'Choose a book list to get started.'}
                  </p>
                  <Link
                    to="/team/quiz"
                    className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Play
                  </Link>
                </Card>
                {team?.book_list_id != null && (
                  <Card hover className="flex flex-col">
                    <h4 className="font-semibold text-stone-900">Challenge a teammate</h4>
                    <p className="mt-1 text-sm text-stone-600">Play a real-time 20-question quiz head-to-head.</p>
                    {challengeableTeammates.length === 0 ? (
                      <p className="mt-2 text-sm text-stone-500">Once your team lead adds more teammates, you can challenge them here.</p>
                    ) : (
                      <ul className="mt-3 space-y-2 flex-1">
                        {sortedTeammates.map((t) => {
                          const isOnline = onlineUserIds.has(t.id);
                          return (
                            <li key={t.id} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 font-medium text-stone-900">
                                <span className="relative inline-flex h-2 w-2" title={isOnline ? 'Online' : 'Offline'}>
                                  {isOnline && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                  )}
                                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                                </span>
                                {t.avatar_emoji && <span className="text-base" aria-hidden>{t.avatar_emoji}</span>}
                                {t.username}
                              </span>
                              <button
                                type="button"
                                disabled={challengeSubmitting}
                                onClick={async () => {
                                  setChallengeSubmitting(true);
                                  try {
                                    const match = await api.createQuizMatch(t.id);
                                    navigate(`/team/quiz-match/${match.id}`);
                                  } catch {
                                    setToastMessage('Failed to create challenge');
                                  } finally {
                                    setChallengeSubmitting(false);
                                  }
                                }}
                                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
                              >
                                {challengeSubmitting ? 'Creating…' : 'Challenge'}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Link
                      to="/team/match-history"
                      className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                    >
                      View match history &rarr;
                    </Link>
                  </Card>
                )}
              </div>
            </div>
            {/* Edit progress modal — teammates only */}
            {user?.role !== 'team_lead' && editProgressAssignment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-progress-title">
                <Card asModal className="max-w-md w-full p-6 shadow-lg">
                  <h2 id="edit-progress-title" className="text-lg font-semibold text-stone-900 mb-4">
                    Update progress{editProgressAssignment.book ? `: ${editProgressAssignment.book.title}` : ''}
                  </h2>
                  <form onSubmit={handleSaveProgress}>
                    <div className="mb-4">
                      <label htmlFor="edit-progress-status" className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                      <select
                        id="edit-progress-status"
                        value={editProgressStatus}
                        onChange={(e) => setEditProgressStatus(e.target.value as BookAssignment['status'])}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
                      >
                        <option value="assigned">{STATUS_LABELS.assigned}</option>
                        <option value="in_progress">{STATUS_LABELS.in_progress}</option>
                        <option value="completed">{STATUS_LABELS.completed}</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="edit-progress-percent" className="block text-sm font-medium text-stone-700 mb-1">
                        Progress: {editProgressPercent}%
                      </label>
                      <input
                        id="edit-progress-percent"
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={editProgressPercent}
                        onChange={(e) => setEditProgressPercent(Number(e.target.value))}
                        className="w-full accent-primary-600"
                      />
                      <div className="flex justify-between text-xs text-stone-400 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="edit-progress-notes" className="block text-sm font-medium text-stone-700 mb-1">Progress notes (optional)</label>
                      <textarea
                        id="edit-progress-notes"
                        value={editProgressNotes}
                        onChange={(e) => setEditProgressNotes(e.target.value)}
                        placeholder="e.g. Chapter 5, halfway through…"
                        rows={3}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {editProgressError && <p className="text-sm text-red-600 mb-3">{editProgressError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setEditProgressAssignment(null); setEditProgressError(null); }}
                        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editProgressSubmitting}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                      >
                        {editProgressSubmitting ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
