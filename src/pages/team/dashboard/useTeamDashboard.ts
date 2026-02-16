import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { api } from '../../../api/client';
import { useTeamPresence } from '../../../hooks/useTeamPresence';
import { smallBurst } from '../../../utils/confetti';
import type {
  BookAssignment,
  ChallengeableTeammate,
  WeeklySummaryResponse,
  TeamReadingProgressResponse,
  DailyQuestionResponse,
} from '../../../api/client';

export function useTeamDashboard() {
  const { user, team, logout, isDemoMode, exitDemo, refreshMe, managedTeams, switchTeam } = useAuth();
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────
  const [myBooks, setMyBooks] = useState<BookAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingGameHighScore, setMatchingGameHighScore] = useState<number | null>(null);
  const [flashcardDeckTimesCompleted, setFlashcardDeckTimesCompleted] = useState<number>(0);
  const [quizHighScore, setQuizHighScore] = useState<number | null>(null);
  const [challengeableTeammates, setChallengeableTeammates] = useState<ChallengeableTeammate[]>([]);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [activeToday, setActiveToday] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryResponse | null>(null);
  const [teamReading, setTeamReading] = useState<TeamReadingProgressResponse | null>(null);

  // ── Daily question state ────────────────────────────────────────────
  const [dailyQ, setDailyQ] = useState<DailyQuestionResponse | null>(null);
  const [dailySelectedId, setDailySelectedId] = useState<number | null>(null);
  const [dailySubmitting, setDailySubmitting] = useState(false);
  const [dailyRevealed, setDailyRevealed] = useState(false);
  const [dailyExpanded, setDailyExpanded] = useState(true);
  const [dailyDismissing, setDailyDismissing] = useState(false);

  // ── Onboarding / UI state ──────────────────────────────────────────
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    return localStorage.getItem('bob_welcome_dismissed') === 'true';
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Edit progress state ─────────────────────────────────────────────
  const [editProgressAssignment, setEditProgressAssignment] = useState<BookAssignment | null>(null);
  const [editProgressStatus, setEditProgressStatus] = useState<BookAssignment['status']>('assigned');
  const [editProgressNotes, setEditProgressNotes] = useState('');
  const [editProgressPercent, setEditProgressPercent] = useState<number>(0);
  const [editProgressSubmitting, setEditProgressSubmitting] = useState(false);
  const [editProgressError, setEditProgressError] = useState<string | null>(null);

  // ── Real-time presence ──────────────────────────────────────────────
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const onlineUserIds = useTeamPresence(token);

  const sortedTeammates = useMemo(() => {
    return [...challengeableTeammates].sort((a, b) => {
      const aOnline = onlineUserIds.has(a.id) ? 1 : 0;
      const bOnline = onlineUserIds.has(b.id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return a.username.localeCompare(b.username);
    });
  }, [challengeableTeammates, onlineUserIds]);

  // ── Toast auto-dismiss ──────────────────────────────────────────────
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ── Data fetching ───────────────────────────────────────────────────

  // My books (teammates only)
  useEffect(() => {
    if (user?.role === 'team_lead') { setLoading(false); return; }
    let cancelled = false;
    api.getMyBooks()
      .then((data) => { if (!cancelled) setMyBooks(data); })
      .catch(() => { if (!cancelled) setMyBooks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.role, user?.id]);

  // Matching game personal stats
  useEffect(() => {
    let cancelled = false;
    api.getMyMatchingGameStats()
      .then((data) => { if (!cancelled) setMatchingGameHighScore(data.high_score); })
      .catch(() => { if (!cancelled) setMatchingGameHighScore(null); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Flashcard personal stats
  useEffect(() => {
    let cancelled = false;
    api.getMyFlashcardDeckStats()
      .then((data) => { if (!cancelled) setFlashcardDeckTimesCompleted(data.times_completed); })
      .catch(() => { if (!cancelled) setFlashcardDeckTimesCompleted(0); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Quiz personal stats
  useEffect(() => {
    if (!team?.book_list_id) return;
    let cancelled = false;
    api.getMyQuizStats()
      .then((data) => { if (!cancelled) setQuizHighScore(data.high_score); })
      .catch(() => { if (!cancelled) setQuizHighScore(null); });
    return () => { cancelled = true; };
  }, [team?.book_list_id, user?.id]);

  // Challengeable teammates
  useEffect(() => {
    if (!team?.book_list_id) return;
    let cancelled = false;
    api.getChallengeableTeammates()
      .then((data) => { if (!cancelled) setChallengeableTeammates(data); })
      .catch(() => { if (!cancelled) setChallengeableTeammates([]); });
    return () => { cancelled = true; };
  }, [team?.book_list_id, user?.id]);

  // Streak
  useEffect(() => {
    let cancelled = false;
    api.getMyStreak()
      .then((data) => { if (!cancelled) { setStreak(data.streak); setActiveToday(data.active_today); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // Weekly summary
  useEffect(() => {
    let cancelled = false;
    api.getMyWeeklySummary()
      .then((data) => { if (!cancelled) setWeeklySummary(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // Team reading progress
  useEffect(() => {
    let cancelled = false;
    api.getTeamReadingProgress()
      .then((data) => { if (!cancelled) setTeamReading(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // Daily spotlight question – hide entirely if already answered
  useEffect(() => {
    let cancelled = false;
    api.getDailyQuestion()
      .then((data) => {
        if (cancelled) return;
        if (data.already_answered) {
          setDailyQ(null);
        } else {
          setDailyQ(data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Handlers ────────────────────────────────────────────────────────

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
      setTimeout(() => setDailyDismissing(true), 3500);
      setTimeout(() => setDailyQ(null), 4000);
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
  };

  const handleSelectAvatarColor = async (color: string | null) => {
    setAvatarSaving(true);
    try {
      await api.updateMyAvatar(user?.avatar_emoji ?? null, color);
      await refreshMe();
    } catch { /* ignore */ }
    setAvatarSaving(false);
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

  const closeEditProgress = () => {
    setEditProgressAssignment(null);
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

  const handleChallenge = async (teammateId: number) => {
    setChallengeSubmitting(true);
    try {
      const match = await api.createQuizMatch(teammateId);
      navigate(`/team/quiz-match/${match.id}`);
    } catch {
      setToastMessage('Failed to create challenge');
    } finally {
      setChallengeSubmitting(false);
    }
  };

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    localStorage.setItem('bob_welcome_dismissed', 'true');
  };

  // ── Recommendations ─────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    if (!user || !team) return [];
    if (user.role === 'team_lead') return [];

    const recs: { emoji: string; text: string; link: string; linkLabel: string }[] = [];

    if (!activeToday) {
      recs.push({
        emoji: '\u{1F44B}',
        text: 'You haven\'t done an activity yet today. Keep your streak going!',
        link: '/team/flashcards',
        linkLabel: 'Quick practice',
      });
    }

    if (flashcardDeckTimesCompleted === 0) {
      recs.push({
        emoji: '\u{1F0CF}',
        text: 'Flashcards are a great way to learn titles and authors before quizzing.',
        link: '/team/flashcards',
        linkLabel: 'Try flashcards',
      });
    }

    if (matchingGameHighScore === null || matchingGameHighScore === 0) {
      recs.push({
        emoji: '\u{1F9E9}',
        text: 'Test your memory by matching books to authors in the matching game.',
        link: '/team/matching-game',
        linkLabel: 'Play matching game',
      });
    }

    if (flashcardDeckTimesCompleted > 0 && (quizHighScore === null || quizHighScore === 0) && team.book_list_id) {
      recs.push({
        emoji: '\u{1F4DD}',
        text: 'You\'ve practiced flashcards \u2014 ready to test yourself with a quiz?',
        link: '/team/quiz',
        linkLabel: 'Take a quiz',
      });
    }

    if (quizHighScore !== null && quizHighScore > 0 && challengeableTeammates.length > 0 && weeklySummary && weeklySummary.matches_played === 0) {
      recs.push({
        emoji: '\u2694\uFE0F',
        text: 'You\'re doing great on quizzes \u2014 challenge a teammate to a head-to-head match!',
        link: '#challenge',
        linkLabel: 'See teammates below',
      });
    }

    const unfinishedBooks = myBooks.filter((b) => b.status !== 'completed');
    if (unfinishedBooks.length > 0) {
      const nextBook = unfinishedBooks[0];
      const pct = nextBook.progress_percent ?? 0;
      if (pct > 0 && pct < 100) {
        recs.push({
          emoji: '\u{1F4D6}',
          text: `You're ${pct}% through "${nextBook.book?.title ?? 'your book'}" \u2014 keep reading!`,
          link: '#reading',
          linkLabel: 'Update progress',
        });
      }
    }

    if (quizHighScore !== null && quizHighScore > 0 && weeklySummary && weeklySummary.quizzes_completed >= 3) {
      recs.push({
        emoji: '\u{1F31F}',
        text: `${weeklySummary.quizzes_completed} quizzes this week with an avg of ${weeklySummary.quiz_avg_score}% \u2014 you're on a roll!`,
        link: '/team/my-progress',
        linkLabel: 'View progress',
      });
    }

    return recs.slice(0, 3);
  }, [user, team, activeToday, flashcardDeckTimesCompleted, matchingGameHighScore, quizHighScore, challengeableTeammates, weeklySummary, myBooks]);

  // ── Derived values ──────────────────────────────────────────────────
  const isNewUser = user?.role !== 'team_lead'
    && !welcomeDismissed
    && flashcardDeckTimesCompleted === 0
    && (matchingGameHighScore === null || matchingGameHighScore === 0)
    && (quizHighScore === null || quizHighScore === 0)
    && streak === 0;

  return {
    // Auth context values
    user,
    team,
    isDemoMode,
    managedTeams,
    switchTeam,

    // Data
    loading,
    myBooks,
    matchingGameHighScore,
    flashcardDeckTimesCompleted,
    quizHighScore,
    challengeableTeammates,
    sortedTeammates,
    onlineUserIds,
    streak,
    activeToday,
    weeklySummary,
    teamReading,
    recommendations,
    isNewUser,

    // Daily question
    dailyQ,
    dailySelectedId,
    setDailySelectedId,
    dailyRevealed,
    dailyExpanded,
    setDailyExpanded,
    dailySubmitting,
    dailyDismissing,
    handleDailyAnswer,

    // Edit progress
    editProgressAssignment,
    editProgressStatus,
    setEditProgressStatus,
    editProgressNotes,
    setEditProgressNotes,
    editProgressPercent,
    setEditProgressPercent,
    editProgressSubmitting,
    editProgressError,
    openEditProgress,
    closeEditProgress,
    handleSaveProgress,

    // UI
    toastMessage,
    showAvatarPicker,
    setShowAvatarPicker,
    avatarSaving,
    challengeSubmitting,

    // Handlers
    handleSelectAvatar,
    handleSelectAvatarColor,
    handleLogout,
    handleExitDemo,
    handleChallenge,
    dismissWelcome,
  };
}
