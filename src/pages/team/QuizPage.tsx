import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { QuizQuestion } from '../../api/client';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const TIMER_SECONDS = 30;

function ChallengeModal({
  question,
  attemptId,
  onClose,
  onSubmitted,
  challengeSubmitting,
  setChallengeSubmitting,
  challengeResult,
}: {
  question: QuizQuestion;
  attemptId: number;
  onClose: () => void;
  onSubmitted: (upheld: boolean, newCorrectCount: number, newHighScore: number) => void;
  challengeSubmitting: boolean;
  setChallengeSubmitting: (v: boolean) => void;
  challengeResult: 'upheld' | 'denied' | null;
}) {
  const [chosenBookListItemId, setChosenBookListItemId] = useState<number | ''>('');
  const [pageNumber, setPageNumber] = useState('');
  const [justification, setJustification] = useState('');

  const correctItem = question.choices.find((c) => c.id === question.correct_book_list_item_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chosenBookListItemId === '' || !justification.trim()) return;
    setChallengeSubmitting(true);
    try {
      const res = await api.submitQuizChallenge(
        attemptId,
        question.id,
        chosenBookListItemId as number,
        pageNumber.trim(),
        justification.trim()
      );
      onSubmitted(res.upheld, res.new_correct_count, res.high_score);
    } catch {
      // leave modal open; user can retry or cancel
    } finally {
      setChallengeSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="challenge-modal-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl border border-stone-200">
        <div className="p-6">
          <h2 id="challenge-modal-title" className="text-lg font-semibold text-stone-900">Challenge this question</h2>
          <p className="mt-2 text-sm text-stone-600">{question.question_text}</p>
          <p className="mt-2 text-sm font-medium text-stone-700">
            Official answer: {correctItem?.title ?? '?'} by {correctItem?.author ?? '?'}
          </p>

          {challengeResult === 'upheld' && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">Upheld — point added.</p>
          )}
          {challengeResult === 'denied' && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">Not upheld.</p>
          )}

          {challengeResult == null && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="challenge-book" className="block text-sm font-medium text-stone-700">
                  Correct book and author
                </label>
                <select
                  id="challenge-book"
                  required
                  value={chosenBookListItemId}
                  onChange={(e) => setChosenBookListItemId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-primary-500 focus:outline focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select book</option>
                  {question.choices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} by {c.author ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="challenge-page" className="block text-sm font-medium text-stone-700">
                  Page number
                </label>
                <input
                  id="challenge-page"
                  type="text"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="e.g. 42"
                  className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-primary-500 focus:outline focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="challenge-justification" className="block text-sm font-medium text-stone-700">
                  Justification
                </label>
                <textarea
                  id="challenge-justification"
                  required
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Quote or describe where in the book the answer appears."
                  className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-primary-500 focus:outline focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={challengeSubmitting}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
                >
                  {challengeSubmitting ? 'Submitting…' : 'Submit challenge'}
                </button>
              </div>
            </form>
          )}

          {challengeResult != null && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuizPage() {
  const { user, team } = useAuth();
  const [quizMode, setQuizMode] = useState<'all' | 'my_books' | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { bookChoiceId: number | null; authorChoiceId: number | null }>>({});
  const [phase, setPhase] = useState<'playing' | 'submitted'>('playing');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challengeModalQuestion, setChallengeModalQuestion] = useState<QuizQuestion | null>(null);
  const [challengedQuestionIds, setChallengedQuestionIds] = useState<number[]>([]);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [challengeResult, setChallengeResult] = useState<'upheld' | 'denied' | null>(null);
  const [booksOpen, setBooksOpen] = useState(false);
  const [authorsOpen, setAuthorsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [hasMyBooks, setHasMyBooks] = useState<boolean | null>(null);
  const [showingFeedbackForQuestionId, setShowingFeedbackForQuestionId] = useState<number | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<'timer' | null>(null);
  const [bonusPointsFromChallenges, setBonusPointsFromChallenges] = useState(0);

  const currentQuestion = questions[currentIndex];

  // When we have a book list but no mode chosen, we're "loading" in the sense of waiting for user choice
  useEffect(() => {
    if (!team?.book_list_id) {
      setLoading(false);
      return;
    }
    setLoading(false);
    let cancelled = false;
    api.getMyBooks().then((list) => {
      if (!cancelled) setHasMyBooks(list.length > 0);
    }).catch(() => {
      if (!cancelled) setHasMyBooks(false);
    });
    return () => { cancelled = true; };
  }, [team?.book_list_id]);

  const startQuizWithMode = (mode: 'all' | 'my_books') => {
    if (!team?.book_list_id) return;
    setQuizMode(mode);
    setQuestionsLoading(true);
    api
      .getQuizQuestions(team.book_list_id, { mode })
      .then((data) => {
        setQuestions(shuffle(data));
        setTotalCount(data.length * 2);
        const total = data.length * 2;
        api.startQuizAttempt(team.book_list_id, total).then((res) => setAttemptId(res.attempt_id)).catch(() => {});
      })
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  };

  useEffect(() => {
    if (!team?.book_list_id) return;
    let cancelled = false;
    api
      .getMyQuizStats()
      .then((data) => {
        if (!cancelled) setHighScore(data.high_score);
      })
      .catch(() => {
        if (!cancelled) setHighScore(null);
      });
    return () => { cancelled = true; };
  }, [team?.book_list_id]);

  // On results screen with no attemptId (e.g. after refresh), restore from latest attempt so Challenge section appears
  useEffect(() => {
    if (phase !== 'submitted' || attemptId != null || questions.length === 0 || !team?.book_list_id) return;
    let cancelled = false;
    api
      .getMyQuizStats()
      .then((data) => {
        if (!cancelled && data.latest_attempt_id != null) setAttemptId(data.latest_attempt_id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [phase, attemptId, questions.length, team?.book_list_id]);

  // 30-second per-question timer: reset on question change, auto-advance or finish at 0
  useEffect(() => {
    if (phase !== 'playing' || questions.length === 0) return;
    setSecondsLeft(TIMER_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, phase, questions.length]);

  // When timer hits 0, show feedback (time's up) instead of advancing; user clicks Next question/Finish to continue
  const timerExpiredRef = useRef(false);
  useEffect(() => {
    if (phase !== 'playing' || questions.length === 0 || secondsLeft !== 0 || !currentQuestion) return;
    if (timerExpiredRef.current) return;
    timerExpiredRef.current = true;
    setFeedbackReason('timer');
    setShowingFeedbackForQuestionId(currentQuestion.id);
  }, [secondsLeft, phase, currentIndex, questions.length, currentQuestion]);
  // Reset timer-expired flag when changing question so next timeout can fire
  useEffect(() => {
    if (phase === 'playing' && questions.length > 0) timerExpiredRef.current = false;
  }, [currentIndex, phase, questions.length]);

  // Clear feedback when moving to a different question (e.g. after clicking Next question)
  useEffect(() => {
    setShowingFeedbackForQuestionId(null);
    setFeedbackReason(null);
  }, [currentIndex]);

  const questionAnswers = currentQuestion ? answers[currentQuestion.id] : undefined;
  const selectedBookId = questionAnswers?.bookChoiceId ?? null;
  const selectedAuthorId = questionAnswers?.authorChoiceId ?? null;
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => {
      const a = answers[q.id];
      return a != null && a.bookChoiceId != null && a.authorChoiceId != null;
    });

  const runningScore = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (!a) continue;
      const choices = Array.isArray(q.choices) ? q.choices : [];
      const correctItem = choices.find((c) => c.id === q.correct_book_list_item_id);
      if (a.bookChoiceId === q.correct_book_list_item_id) correct += 1;
      const selectedAuthorItem = choices.find((c) => c.id === a.authorChoiceId);
      if (correctItem && selectedAuthorItem && selectedAuthorItem.author === correctItem.author) correct += 1;
    }
    return correct;
  }, [questions, answers]);

  function getQuestionCorrect(
    q: QuizQuestion,
    ans: Record<number, { bookChoiceId: number | null; authorChoiceId: number | null }>
  ): boolean {
    const a = ans[q.id];
    if (!a?.bookChoiceId || !a?.authorChoiceId) return false;
    const choices = Array.isArray(q.choices) ? q.choices : [];
    const correctItem = choices.find((c) => c.id === q.correct_book_list_item_id);
    if (a.bookChoiceId !== q.correct_book_list_item_id) return false;
    const selectedAuthorItem = choices.find((c) => c.id === a.authorChoiceId);
    return !!(correctItem && selectedAuthorItem && selectedAuthorItem.author === correctItem.author);
  }

  const handleSelectBook = (choiceId: number) => {
    if (phase !== 'playing' || !currentQuestion) return;
    const prev = answers[currentQuestion.id] ?? { bookChoiceId: null, authorChoiceId: null };
    setAnswers((a) => ({ ...a, [currentQuestion.id]: { ...prev, bookChoiceId: choiceId } }));
    setBooksOpen(false);
    setAuthorsOpen(true); // open authors so user can select without an extra click
  };

  const handleSelectAuthor = (choiceId: number) => {
    if (phase !== 'playing' || !currentQuestion) return;
    const prev = answers[currentQuestion.id] ?? { bookChoiceId: null, authorChoiceId: null };
    setAnswers((a) => ({ ...a, [currentQuestion.id]: { ...prev, authorChoiceId: choiceId } }));
    setAuthorsOpen(false);
  };

  // Reset accordions when changing question
  useEffect(() => {
    setBooksOpen(false);
    setAuthorsOpen(false);
  }, [currentIndex]);

  const handleNextOrFinish = () => {
    if (phase !== 'playing') return;
    const inFeedbackView = showingFeedbackForQuestionId === currentQuestion?.id;
    if (inFeedbackView) {
      setShowingFeedbackForQuestionId(null);
      setFeedbackReason(null);
      if (isLastQuestion) {
        handleFinish();
      } else {
        setCurrentIndex((i) => i + 1);
      }
      return;
    }
    // Show feedback for current question first (user has answered; button is disabled otherwise)
    if (currentQuestion && selectedBookId != null && selectedAuthorId != null) {
      setShowingFeedbackForQuestionId(currentQuestion.id);
    }
  };

  const handleFinish = async () => {
    if (!team?.book_list_id || submitting || phase !== 'playing') return;
    const correct = runningScore + bonusPointsFromChallenges;
    setCorrectCount(correct);
    setSubmitting(true);
    setSubmitError('');
    try {
      const total = questions.length * 2;
      const res = await api.submitQuizAttempt(team.book_list_id, correct, total, attemptId ?? undefined);
      setHighScore(res.high_score);
      setAttemptId(res.attempt_id ?? null);
      if (correct === total) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      setPhase('submitted');
    } catch {
      setSubmitError('Failed to save score. You can try again from the dashboard.');
      setPhase('submitted');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !team) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading questions" />
      </div>
    );
  }

  if (team.book_list_id && quizMode === null) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-md px-4 py-12">
          <h2 className="text-lg font-semibold text-stone-900">Choose quiz</h2>
          <p className="mt-2 text-stone-600">Each quiz has 20 random questions.</p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => startQuizWithMode('all')}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-900 shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium">Random from all 20 books</span>
              <span className="mt-1 block text-stone-500">Questions from the full list</span>
            </button>
            <button
              type="button"
              onClick={() => startQuizWithMode('my_books')}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-900 shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium">Focus on my books</span>
              <span className="mt-1 block text-stone-500">
                {hasMyBooks === false ? 'No books assigned; will use random from all 20.' : 'About 60% from books assigned to you'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!team.book_list_id) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-stone-600">Your team has not chosen a book list yet. Only the team lead can choose a list.</p>
          <Link
            to="/team/dashboard"
            className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-700 transition duration-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (quizMode !== null && questions.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-stone-600">No quiz questions available for your book list.</p>
          <Link
            to="/team/dashboard"
            className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-700 transition duration-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'submitted') {
    const resultMessage =
      correctCount === totalCount
        ? 'Perfect! You got them all!'
        : correctCount >= totalCount * 0.8
          ? 'Great job!'
          : 'Keep going — try again whenever you\'re ready!';

    const getQuestionCorrect = (q: QuizQuestion) => {
      const a = answers[q.id];
      if (!a?.bookChoiceId || !a?.authorChoiceId) return false;
      const correctItem = q.choices.find((c) => c.id === q.correct_book_list_item_id);
      const selectedBook = a.bookChoiceId === q.correct_book_list_item_id;
      const selectedAuthorItem = q.choices.find((c) => c.id === a.authorChoiceId);
      const selectedAuthor = correctItem && selectedAuthorItem && selectedAuthorItem.author === correctItem.author;
      return selectedBook && selectedAuthor;
    };

    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-2xl bg-white p-6 shadow-card border border-stone-100">
            <h2 className="text-lg font-semibold text-stone-900">Quiz complete</h2>
            <p className="mt-3 text-lg font-medium text-stone-900">{resultMessage}</p>
            <p className="mt-2 text-stone-600">
              You got {correctCount} out of {totalCount} correct.
            </p>
            {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
            {highScore !== null && (
              <p className="mt-2 font-medium text-stone-900">Your high score: {highScore}</p>
            )}

            {attemptId != null && questions.length > 0 && (
              <div className="mt-8 border-t border-stone-200 pt-6">
                <h3 className="text-sm font-semibold text-stone-700">Review questions & challenge</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Think an answer should count? Challenge it with a book, page, and justification for AI review.
                </p>
                <ul className="mt-4 space-y-3">
                  {questions.map((q) => {
                    const correctItem = q.choices.find((c) => c.id === q.correct_book_list_item_id);
                    const gotRight = getQuestionCorrect(q);
                    const alreadyChallenged = challengedQuestionIds.includes(q.id);
                    return (
                      <li
                        key={q.id}
                        className="rounded-lg border border-stone-200 bg-stone-50/50 p-4"
                      >
                        <p className="text-sm font-medium text-stone-900">{q.question_text}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          Official answer: {correctItem?.title ?? '?'} by {correctItem?.author ?? '?'}
                        </p>
                        <p className="mt-1 text-sm">
                          {gotRight ? (
                            <span className="text-green-700">You got it right.</span>
                          ) : (
                            <span className="text-amber-700">You did not get this one.</span>
                          )}
                        </p>
                        <button
                          type="button"
                          disabled={alreadyChallenged}
                          onClick={() => {
                            setChallengeModalQuestion(q);
                            setChallengeResult(null);
                          }}
                          className="mt-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {alreadyChallenged ? 'Challenged' : 'Challenge'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <Link
              to="/team/dashboard"
              className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {challengeModalQuestion && (
          <ChallengeModal
            question={challengeModalQuestion}
            attemptId={attemptId!}
            onClose={() => {
              setChallengeModalQuestion(null);
              setChallengeResult(null);
            }}
            onSubmitted={(upheld, newCorrectCount, newHighScore) => {
              setCorrectCount(newCorrectCount);
              setHighScore(newHighScore);
              setChallengedQuestionIds((prev) => [...prev, challengeModalQuestion.id]);
              setChallengeResult(upheld ? "upheld" : "denied");
            }}
            challengeSubmitting={challengeSubmitting}
            setChallengeSubmitting={setChallengeSubmitting}
            challengeResult={challengeResult}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Quiz — In which book?</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-sm font-medium text-stone-700">
            Score: {runningScore + bonusPointsFromChallenges} / {totalCount}
          </p>
          <p
            className={`text-sm font-medium tabular-nums ${
              secondsLeft <= 5 ? 'text-red-600' : 'text-stone-600'
            }`}
            aria-live="polite"
          >
            0:{secondsLeft.toString().padStart(2, '0')}
          </p>
        </div>
        <h2 className="mb-6 text-lg font-medium text-stone-900">{currentQuestion?.question_text}</h2>

        {showingFeedbackForQuestionId === currentQuestion?.id && currentQuestion && (
          <div className="mb-6">
            {getQuestionCorrect(currentQuestion, answers) && feedbackReason !== 'timer' ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-medium text-green-800">Correct!</p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-800">
                  {feedbackReason === 'timer' ? "Time's up!" : 'Not quite.'}{' '}
                  The correct answer was{' '}
                  {(() => {
                    const choices = currentQuestion?.choices;
                    const correctItem = Array.isArray(choices)
                      ? choices.find((c) => c.id === currentQuestion.correct_book_list_item_id)
                      : null;
                    return correctItem
                      ? `${correctItem.title} by ${correctItem.author ?? 'Unknown'}`
                      : '—';
                  })()}
                </p>
                {attemptId != null && (
                  <div className="mt-3">
                    {challengedQuestionIds.includes(currentQuestion.id) ? (
                      <span className="text-sm text-amber-700">Challenged</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setChallengeModalQuestion(currentQuestion);
                          setChallengeResult(null);
                        }}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 transition duration-200 hover:bg-amber-100 focus:outline focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                      >
                        Challenge this answer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showingFeedbackForQuestionId !== currentQuestion?.id && currentQuestion && Array.isArray(currentQuestion.choices) && (
          <>
        {/* Books accordion */}
        <div className="mb-4 rounded-lg border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setBooksOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-inset"
            aria-expanded={booksOpen}
          >
            <span>
              {selectedBookId != null
                ? (() => {
                    const c = currentQuestion?.choices.find((x) => x.id === selectedBookId);
                    return c ? (
                      <>
                        <span className="text-stone-900">{c.title}</span>
                        <span className="ml-2 text-primary-600">— Change</span>
                      </>
                    ) : (
                      'Select the book (1 point)'
                    );
                  })()
                : 'Select the book (1 point)'}
            </span>
            <span className="text-stone-400" aria-hidden>
              {booksOpen ? '▼' : '▶'}
            </span>
          </button>
          {booksOpen && (
            <ul className="border-t border-stone-200 px-2 pb-2 pt-2 space-y-2" role="list">
              {currentQuestion?.choices.map((choice) => {
                const isSelected = selectedBookId === choice.id;
                return (
                  <li key={`book-${choice.id}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectBook(choice.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition duration-200 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`Book: ${choice.title}`}
                    >
                      <span className="font-medium">{choice.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Authors accordion */}
        <div className="rounded-lg border border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setAuthorsOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-inset"
            aria-expanded={authorsOpen}
          >
            <span>
              {selectedAuthorId != null
                ? (() => {
                    const c = currentQuestion?.choices.find((x) => x.id === selectedAuthorId);
                    const label = c?.author != null && c.author !== '' ? c.author : 'Unknown';
                    return (
                      <>
                        <span className="text-stone-900">{label}</span>
                        <span className="ml-2 text-primary-600">— Change</span>
                      </>
                    );
                  })()
                : 'Select the author (1 point)'}
            </span>
            <span className="text-stone-400" aria-hidden>
              {authorsOpen ? '▼' : '▶'}
            </span>
          </button>
          {authorsOpen && (
            <ul className="border-t border-stone-200 px-2 pb-2 pt-2 space-y-2" role="list">
              {currentQuestion?.choices.map((choice) => {
                const isSelected = selectedAuthorId === choice.id;
                const authorLabel = choice.author != null && choice.author !== '' ? choice.author : 'Unknown';
                return (
                  <li key={`author-${choice.id}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectAuthor(choice.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`Author: ${authorLabel}`}
                    >
                      {authorLabel}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
          </>
        )}

        {challengeModalQuestion && attemptId != null && (
          <ChallengeModal
            question={challengeModalQuestion}
            attemptId={attemptId}
            onClose={() => {
              setChallengeModalQuestion(null);
              setChallengeResult(null);
            }}
            onSubmitted={(upheld, newCorrectCount, newHighScore) => {
              setChallengedQuestionIds((prev) => [...prev, challengeModalQuestion.id]);
              setChallengeResult(upheld ? 'upheld' : 'denied');
              if (upheld) {
                setBonusPointsFromChallenges((prev) => prev + 2);
                setHighScore(newHighScore);
              }
            }}
            challengeSubmitting={challengeSubmitting}
            setChallengeSubmitting={setChallengeSubmitting}
            challengeResult={challengeResult}
          />
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            {showingFeedbackForQuestionId !== currentQuestion?.id && currentIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Previous
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleNextOrFinish}
            disabled={
              showingFeedbackForQuestionId === currentQuestion?.id
                ? submitting
                : (isLastQuestion ? !allAnswered : selectedBookId == null || selectedAuthorId == null) || submitting
            }
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Saving…'
              : showingFeedbackForQuestionId === currentQuestion?.id
                ? isLastQuestion
                  ? 'Finish'
                  : 'Next question'
                : isLastQuestion
                  ? 'Finish'
                  : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
