import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { QuizMatchState } from '../../api/client';
import { useQuizMatchChannel } from '../../hooks/useQuizMatchChannel';
import { celebrationBurst } from '../../utils/confetti';

const CLOCK_SECONDS = 30;

function remainingSeconds(phaseEnteredAt: string | null | undefined): number {
  if (!phaseEnteredAt) return 0;
  const start = Date.parse(phaseEnteredAt) / 1000;
  const now = Date.now() / 1000;
  return Math.max(0, Math.floor(CLOCK_SECONDS - (now - start)));
}

function Nav() {
  return (
    <nav className="border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Quiz Challenge</h1>
        <Link
          to="/team/dashboard"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

export function QuizMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const matchId = id != null ? parseInt(id, 10) : null;

  const [match, setMatch] = useState<QuizMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booksOpen, setBooksOpen] = useState(false);
  const [authorsOpen, setAuthorsOpen] = useState(false);
  const [clockDisplaySeconds, setClockDisplaySeconds] = useState<number>(0);
  const timeoutCalledRef = useRef(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const isChallenger = user && match && match.challenger_id === user.id;
  const isOpponent = user && match && match.invited_opponent_id === user.id && (match.opponent_id == null || match.opponent_id === user.id);
  const canAnswer =
    match?.current_question &&
    user &&
    ((match.phase === 'question_show' && match.current_question.first_responder_id === user.id) ||
      (match.phase === 'second_responder_can_answer' && match.current_question.first_responder_id !== user.id));
  const isMyTurn = !!canAnswer;

  const fetchMatch = useCallback(async () => {
    if (matchId == null || !Number.isFinite(matchId)) {
      setError('Invalid match');
      setLoading(false);
      return;
    }
    try {
      const data = await api.getQuizMatch(matchId);
      setMatch(data);
      setError(null);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && (e as { response?: { status?: number } }).response?.status === 404
        ? 'Match not found'
        : 'You are not a participant in this match';
      setError(msg);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // When entering steal phase with author-only (title was correct), lock book selection
  useEffect(() => {
    const q = match?.current_question;
    if (match?.phase === 'second_responder_can_answer' && q?.steal_author_only && q?.locked_book_list_item_id != null) {
      setSelectedBookId(q.locked_book_list_item_id);
    }
  }, [match?.phase, match?.current_question?.steal_author_only, match?.current_question?.locked_book_list_item_id]);

  useQuizMatchChannel(
    match?.id ?? null,
    token,
    (state) => {
      setMatch(state);
      const q = state.current_question;
      if (state.phase === 'question_show' || state.phase === 'second_responder_can_answer') {
        if (q?.steal_author_only && q?.locked_book_list_item_id != null) {
          setSelectedBookId(q.locked_book_list_item_id);
          setSelectedAuthorId(null);
        } else {
          setSelectedBookId(null);
          setSelectedAuthorId(null);
        }
      }
      if (state.phase_entered_at !== match?.phase_entered_at) {
        timeoutCalledRef.current = false;
      }
    }
  );

  const inClockPhase =
    match?.phase === 'question_show' || match?.phase === 'second_responder_can_answer';
  const phaseEnteredAt = match?.phase_entered_at;

  useEffect(() => {
    if (!inClockPhase || !phaseEnteredAt) {
      setClockDisplaySeconds(0);
      return;
    }
    const update = () => {
      const rem = remainingSeconds(phaseEnteredAt);
      setClockDisplaySeconds(rem);
      if (rem <= 0 && matchId != null && isMyTurn && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        api.submitQuizMatchTimeout(matchId).then((data) => setMatch(data)).catch(() => {});
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [inClockPhase, phaseEnteredAt, matchId, isMyTurn]);

  // Fire confetti when match completes and user won
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (match?.status !== 'completed' || confettiFiredRef.current) return;
    const won =
      (isChallenger && match.challenger_score > match.opponent_score) ||
      (isOpponent && match.opponent_score > match.challenger_score);
    if (won) {
      confettiFiredRef.current = true;
      celebrationBurst();
    }
  }, [match?.status, match?.challenger_score, match?.opponent_score, isChallenger, isOpponent]);

  const handleJoin = async () => {
    if (matchId == null || joining) return;
    setJoining(true);
    try {
      const data = await api.joinQuizMatch(matchId);
      setMatch(data);
    } catch {
      setError('Failed to join match');
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitAnswer = async () => {
    const q = match?.current_question;
    const bookId = q?.steal_author_only ? (q.locked_book_list_item_id ?? selectedBookId) : selectedBookId;
    const authorOnly = !!q?.steal_author_only;
    if (
      matchId == null ||
      !q ||
      (authorOnly ? selectedAuthorId == null : (selectedBookId == null || selectedAuthorId == null)) ||
      (!authorOnly && bookId == null) ||
      submitting ||
      !isMyTurn
    )
      return;
    setSubmitting(true);
    try {
      const data = await api.submitQuizMatchAnswer(
        matchId,
        match!.current_question_index,
        bookId ?? 0,
        selectedAuthorId!
      );
      setMatch(data);
      setSelectedBookId(null);
      setSelectedAuthorId(null);
    } catch {
      // keep state; channel may still update
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <p className="text-stone-600">{error ?? 'Match not found'}</p>
          <Link
            to="/team/dashboard"
            className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (match.status === 'pending' && isOpponent && match.opponent_id == null) {
    const handleDecline = async () => {
      if (matchId == null) return;
      try {
        await api.declineQuizMatch(matchId);
        navigate('/team/dashboard', { replace: true });
      } catch {
        navigate('/team/dashboard', { replace: true });
      }
    };

    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12">
          <h2 className="text-lg font-semibold text-stone-900">You were challenged!</h2>
          <p className="mt-2 text-stone-600">
            {match.challenger_username} wants to play a 20-question quiz with you.
          </p>
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
          >
            {joining ? 'Joining…' : 'Accept challenge'}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="mt-4 block w-full text-center text-sm font-medium text-stone-600 hover:text-stone-900 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Decline (back to dashboard)
          </button>
        </div>
      </div>
    );
  }

  if (match.status === 'pending') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12">
          <h2 className="text-lg font-semibold text-stone-900">Waiting for opponent</h2>
          <p className="mt-2 text-stone-600">
            Share this link with {match.invited_opponent_username} to start:
          </p>
          <p className="mt-2 break-all rounded-lg bg-stone-100 p-3 font-mono text-sm text-stone-800">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </p>
          <Link
            to="/team/dashboard"
            className="mt-6 inline-block font-medium text-primary-600 hover:text-primary-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (match.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <h2 className="text-lg font-semibold text-stone-900">Your teammate left</h2>
          <p className="mt-2 text-stone-600">
            The quiz challenge has ended because the other player left.
          </p>
          <Link
            to="/team/dashboard"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (match.status === 'completed') {
    const challengerWins = match.challenger_score > match.opponent_score;
    const opponentWins = match.opponent_score > match.challenger_score;
    const tie = match.challenger_score === match.opponent_score;
    const results = match.question_results ?? [];
    const opponentName = match.opponent_username ?? match.invited_opponent_username ?? 'Opponent';

    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h2 className="text-lg font-semibold text-stone-900">Game over</h2>
          <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-stone-700">
              {match.challenger_username}: {match.challenger_score} pts
            </p>
            <p className="mt-1 text-stone-700">
              {opponentName}: {match.opponent_score} pts
            </p>
            <p className="mt-3 font-medium text-stone-900">
              {tie ? "It's a tie!" : (isChallenger && challengerWins) || (isOpponent && opponentWins) ? 'You win!' : 'You lost.'}
            </p>
          </div>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-stone-900 mb-3">Question breakdown</h3>
              <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {results.map((r, i) => {
                  const firstGotIt = r.first_responder_correct;
                  const secondGotIt = r.second_responder_correct === true;
                  const secondMissed = r.second_responder_correct === false;
                  const onlyFirstAnswered = r.second_responder_correct === null;
                  return (
                    <li key={r.quiz_question_id ?? i} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
                      <p className="font-medium text-stone-900 mb-1">
                        Q{r.question_index + 1}: {r.question_text}
                      </p>
                      <p className="text-stone-600 mb-2">
                        Answer: {r.correct_book_title ?? '—'}
                        {r.correct_book_author ? ` by ${r.correct_book_author}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            firstGotIt ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {r.first_responder_username}: {firstGotIt ? 'Correct' : 'Wrong'}
                        </span>
                        {onlyFirstAnswered ? (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-stone-50 text-stone-500">
                            {r.second_responder_username}: No answer (first got it)
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                              secondGotIt ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {r.second_responder_username}: {secondGotIt ? 'Correct' : secondMissed ? 'Wrong' : '—'}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Link
            to="/team/dashboard"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const q = match.current_question;
  if (!q) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12 text-center text-stone-600">
          Loading question…
        </div>
      </div>
    );
  }

  const choices = q.choices ?? [];
  const stealAuthorOnly = !!match?.current_question?.steal_author_only;
  const lockedBookId = match?.current_question?.locked_book_list_item_id ?? null;
  const canSubmit =
    isMyTurn &&
    !submitting &&
    (stealAuthorOnly ? selectedAuthorId != null : selectedBookId != null && selectedAuthorId != null);

  const currentTurnUserId =
    match.phase === 'question_show'
      ? q.first_responder_id
      : match.phase === 'second_responder_can_answer'
        ? (q.first_responder_id === match.challenger_id ? match.opponent_id : match.challenger_id)
        : null;
  const currentTurnUsername =
    currentTurnUserId === match.challenger_id
      ? match.challenger_username
      : currentTurnUserId === match.opponent_id || currentTurnUserId === match.invited_opponent_id
        ? (match.opponent_username ?? match.invited_opponent_username)
        : null;
  const challengerTurn = currentTurnUserId === match.challenger_id;
  const opponentTurn = currentTurnUserId === match.opponent_id || currentTurnUserId === match.invited_opponent_id;

  const clockLabel =
    clockDisplaySeconds > 0 ? `0:${clockDisplaySeconds.toString().padStart(2, '0')}` : '0:00';

  const isStealPhase = match.phase === 'second_responder_can_answer';
  const missedUsername =
    isStealPhase && q
      ? q.first_responder_id === match.challenger_id
        ? match.challenger_username
        : (match.opponent_username ?? match.invited_opponent_username)
      : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-sm font-medium ${
                challengerTurn ? 'bg-primary-100 text-primary-800' : 'text-stone-700'
              }`}
            >
              {match.challenger_avatar && <span className="mr-0.5" aria-hidden>{match.challenger_avatar}</span>}
              {match.challenger_username} {match.challenger_score}
            </span>
            <span className="text-stone-400">–</span>
            <span
              className={`rounded px-2 py-0.5 text-sm font-medium ${
                opponentTurn ? 'bg-primary-100 text-primary-800' : 'text-stone-700'
              }`}
            >
              {(match.opponent_avatar ?? match.invited_opponent_avatar) && <span className="mr-0.5" aria-hidden>{match.opponent_avatar ?? match.invited_opponent_avatar}</span>}
              {match.opponent_username ?? match.invited_opponent_username} {match.opponent_score}
            </span>
          </div>
          <span className="text-sm text-stone-500">
            Question {match.current_question_index + 1} of {match.total_questions}
          </span>
        </div>

        {inClockPhase && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 ${
              isStealPhase && isMyTurn
                ? 'border-amber-300 bg-amber-50'
                : isStealPhase
                  ? 'border-amber-200 bg-amber-50/50'
                  : isMyTurn
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-stone-200 bg-stone-50'
            }`}
          >
            {isStealPhase && (
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                Steal opportunity
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isMyTurn ? (isStealPhase ? 'text-amber-900' : 'text-primary-800') : 'text-stone-700'}`}>
                {isStealPhase
                  ? isMyTurn
                    ? stealAuthorOnly
                      ? `${missedUsername ?? 'They'} got the title — pick the author to steal (1 point).`
                      : `${missedUsername ?? 'They'} missed — steal the points! Answer now.`
                    : `You missed — ${currentTurnUsername ?? 'Opponent'} can steal! Wait for their answer.`
                  : isMyTurn
                    ? 'Your turn — select the book and author.'
                    : `${currentTurnUsername ?? 'Opponent'}'s turn — wait for their answer.`}
              </span>
              {phaseEnteredAt && (
                <span
                  className={`tabular-nums text-sm font-semibold ${
                    clockDisplaySeconds <= 5 ? 'text-red-600' : isStealPhase && isMyTurn ? 'text-amber-700' : isMyTurn ? 'text-primary-700' : 'text-stone-600'
                  }`}
                  aria-live="polite"
                >
                  {clockLabel}
                </span>
              )}
            </div>
          </div>
        )}

        <h2 className="mb-6 text-lg font-medium text-stone-900">{q.question_text}</h2>

        <div className="mb-4 rounded-lg border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => !stealAuthorOnly && setBooksOpen((o) => !o)}
            disabled={!isMyTurn || stealAuthorOnly}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            aria-expanded={booksOpen}
          >
            <span>
              {stealAuthorOnly && lockedBookId != null
                ? (() => {
                    const c = choices.find((x) => x.id === lockedBookId);
                    return c ? `${c.title} — Locked (they got the title)` : 'Book locked';
                  })()
                : selectedBookId != null
                  ? (() => {
                      const c = choices.find((x) => x.id === selectedBookId);
                      return c ? `${c.title} — Change` : 'Select the book (1 point)';
                    })()
                  : 'Select the book (1 point)'}
            </span>
            {!stealAuthorOnly && <span className="text-stone-400">{booksOpen ? '▼' : '▶'}</span>}
          </button>
          {booksOpen && !stealAuthorOnly && (
            <ul className="border-t border-stone-200 px-2 pb-2 pt-2 space-y-2">
              {choices.map((choice) => (
                <li key={choice.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookId(choice.id);
                      setBooksOpen(false);
                      setAuthorsOpen(true);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${
                      selectedBookId === choice.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    {choice.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setAuthorsOpen((o) => !o)}
            disabled={!isMyTurn}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            aria-expanded={authorsOpen}
          >
            <span>
              {selectedAuthorId != null
                ? (() => {
                    const c = choices.find((x) => x.id === selectedAuthorId);
                    return c ? `${c.author ?? 'Unknown'} — Change` : 'Select the author (1 point)';
                  })()
                : 'Select the author (1 point)'}
            </span>
            <span className="text-stone-400">{authorsOpen ? '▼' : '▶'}</span>
          </button>
          {authorsOpen && (
            <ul className="border-t border-stone-200 px-2 pb-2 pt-2 space-y-2">
              {choices.map((choice) => (
                <li key={`author-${choice.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAuthorId(choice.id);
                      setAuthorsOpen(false);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${
                      selectedAuthorId === choice.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    {choice.author ?? 'Unknown'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={!canSubmit}
          className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit answer'}
        </button>
      </div>
    </div>
  );
}
