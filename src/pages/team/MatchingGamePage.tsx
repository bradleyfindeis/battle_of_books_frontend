import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { celebrationBurst, smallBurst } from '../../utils/confetti';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { Book } from '../../api/client';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface BookItem {
  id: number;
  title: string;
  author: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function MatchingGamePage() {
  const { user, team } = useAuth();
  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffledTitles, setShuffledTitles] = useState<BookItem[]>([]);
  const [shuffledAuthors, setShuffledAuthors] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Record<number, number>>({}); // bookId -> authorIndex
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedAuthorIndex, setSelectedAuthorIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<'difficulty_select' | 'playing' | 'submitted'>('difficulty_select');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [checking, setChecking] = useState(false);
  const [pairResults, setPairResults] = useState<Record<number, boolean>>({}); // bookId -> correct?

  useEffect(() => {
    let cancelled = false;
    api
      .getBooks()
      .then((data: Book[]) => {
        if (cancelled) return;
        const withAuthor = data
          .filter((b) => b.author != null && String(b.author).trim() !== '')
          .map((b) => ({ id: b.id, title: b.title, author: String(b.author).trim() }));
        setAllBooks(withAuthor);
      })
      .catch(() => {
        if (!cancelled) setAllBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const startGame = (diff: Difficulty) => {
    const count = diff === 'easy' ? 5 : diff === 'medium' ? 10 : allBooks.length;
    const selected = shuffle(allBooks).slice(0, Math.min(count, allBooks.length));
    setDifficulty(diff);
    setBooks(selected);
    setShuffledTitles(shuffle(selected));
    setShuffledAuthors(shuffle(selected.map((b) => b.author)));
    setTotalCount(selected.length);
    setPairs({});
    setSelectedBookId(null);
    setSelectedAuthorIndex(null);
    setPairResults({});
    setCorrectCount(0);
    setScore(0);
    setSubmitError('');
    setPhase('playing');
  };

  const handleBookClick = (bookId: number) => {
    if (phase !== 'playing') return;
    setSelectedBookId((prev) => (prev === bookId ? null : bookId));
    setSelectedAuthorIndex(null);
  };

  const handleAuthorClick = (authorIndex: number) => {
    if (phase !== 'playing') return;
    if (selectedBookId !== null) {
      setPairs((prev) => {
        const next = { ...prev, [selectedBookId]: authorIndex };
        for (const [bid, idx] of Object.entries(next)) {
          if (Number(bid) !== selectedBookId && idx === authorIndex) delete next[Number(bid)];
        }
        return next;
      });
      setSelectedBookId(null);
      setSelectedAuthorIndex(null);
    } else {
      setSelectedAuthorIndex((prev) => (prev === authorIndex ? null : authorIndex));
    }
  };

  const pairedCount = Object.keys(pairs).length;

  const handleCheckAnswers = async () => {
    if (pairedCount === 0 || checking) return;
    setChecking(true);
    let correct = 0;
    const correctMap = new Map(books.map((b) => [b.id, b.author]));
    const results: Record<number, boolean> = {};
    for (const [bookId, authorIndex] of Object.entries(pairs)) {
      const isCorrect = correctMap.get(Number(bookId)) === shuffledAuthors[authorIndex];
      results[Number(bookId)] = isCorrect;
      if (isCorrect) correct++;
    }
    setPairResults(results);
    setCorrectCount(correct);
    setScore(correct);
    setSubmitError('');
    try {
      const res = await api.submitMatchingGameAttempt(correct, totalCount, correct);
      setHighScore(res.high_score);
      if (correct === totalCount) {
        celebrationBurst();
      } else if (totalCount > 0 && correct / totalCount >= 0.8) {
        smallBurst();
      }
      setPhase('submitted');
    } catch {
      setSubmitError('Failed to save score. You can try again from the dashboard.');
      setPhase('submitted');
    } finally {
      setChecking(false);
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

  if (allBooks.length < 2) {
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
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <p className="text-3xl mb-3" aria-hidden>🧩</p>
          <h2 className="text-lg font-semibold text-stone-900">Not enough books yet</h2>
          <p className="mt-2 text-stone-600">The Matching Game needs at least 2 books with authors. Ask your team lead to add more books to get started.</p>
          <Link
            to="/team/dashboard"
            className="mt-5 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- Difficulty selection screen ---
  if (phase === 'difficulty_select') {
    const easyCount = Math.min(5, allBooks.length);
    const mediumCount = Math.min(10, allBooks.length);

    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Matching Game</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-md px-4 py-12">
          <h2 className="text-lg font-semibold text-stone-900">Choose difficulty</h2>
          <p className="mt-2 text-stone-600">Match book titles to their authors. Pick how many pairs you want.</p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => startGame('easy')}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium text-stone-900">Easy</span>
              <span className="mt-1 block text-stone-500">{easyCount} pairs -- a quick warm-up</span>
            </button>
            {allBooks.length > 5 && (
              <button
                type="button"
                onClick={() => startGame('medium')}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="font-medium text-stone-900">Medium</span>
                <span className="mt-1 block text-stone-500">{mediumCount} pairs -- a solid challenge</span>
              </button>
            )}
            {allBooks.length > 10 && (
              <button
                type="button"
                onClick={() => startGame('hard')}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="font-medium text-stone-900">Hard</span>
                <span className="mt-1 block text-stone-500">All {allBooks.length} pairs -- the full list</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Results screen ---
  if (phase === 'submitted') {
    const ratio = totalCount > 0 ? correctCount / totalCount : 0;
    const resultMessage =
      correctCount === totalCount
        ? 'Perfect! You got them all!'
        : ratio >= 0.8
          ? 'Great job!'
          : ratio >= 0.5
            ? 'Good effort -- keep practicing!'
            : 'Keep going -- every match you learn helps. Try again whenever you\'re ready!';

    // Build ordered list of results for display
    const resultsList = shuffledTitles.map((book) => {
      const authorIndex = pairs[book.id];
      const chosenAuthor = authorIndex !== undefined ? shuffledAuthors[authorIndex] : null;
      const correct = pairResults[book.id] ?? false;
      const paired = authorIndex !== undefined;
      return { book, chosenAuthor, correct, paired };
    });

    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Matching Game</h1>
            <Link
              to="/team/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-2xl bg-white p-6 shadow-card border border-stone-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Round complete</h2>
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">{DIFFICULTY_LABELS[difficulty]}</span>
            </div>
            <p className="mt-3 text-lg font-medium text-stone-900">{resultMessage}</p>
            <p className="mt-2 text-stone-600">
              {correctCount} out of {totalCount} correct.
              {pairedCount < totalCount && ` (${totalCount - pairedCount} unpaired)`}
            </p>
            {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
            {highScore !== null && (
              <p className="mt-2 font-medium text-stone-900">Your high score: {highScore}</p>
            )}

            {/* Pair-by-pair breakdown */}
            <div className="mt-6 border-t border-stone-200 pt-4">
              <h3 className="text-sm font-medium text-stone-700 mb-3">Results</h3>
              <ul className="space-y-2 text-sm">
                {resultsList.map(({ book, chosenAuthor, correct, paired }) => (
                  <li
                    key={book.id}
                    className={`flex items-start gap-2 rounded-lg border p-3 ${
                      !paired
                        ? 'border-stone-200 bg-stone-50'
                        : correct
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {!paired ? (
                        <span className="text-stone-400">--</span>
                      ) : correct ? (
                        <span className="text-emerald-600">&#10003;</span>
                      ) : (
                        <span className="text-red-600">&#10007;</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900">{book.title}</p>
                      {paired ? (
                        correct ? (
                          <p className="text-emerald-700">{chosenAuthor}</p>
                        ) : (
                          <>
                            <p className="text-red-700 line-through">{chosenAuthor}</p>
                            <p className="text-stone-600">Correct: {book.author}</p>
                          </>
                        )
                      ) : (
                        <p className="text-stone-500">Not paired -- correct: {book.author}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPhase('difficulty_select')}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Play again
              </button>
              <Link
                to="/team/dashboard"
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Playing phase ---
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Matching Game</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            Click a book title, then click the matching author.
          </p>
          <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">
            {DIFFICULTY_LABELS[difficulty]} · {pairedCount}/{totalCount} paired
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500">Book titles</h3>
            <ul className="space-y-2" role="list">
              {shuffledTitles.map((book) => {
                const pairedAuthorIndex = pairs[book.id];
                const pairedAuthor = pairedAuthorIndex !== undefined ? shuffledAuthors[pairedAuthorIndex] : undefined;
                const isSelected = selectedBookId === book.id;
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => handleBookClick(book.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : pairedAuthor != null
                            ? 'border-stone-200 bg-stone-50 text-stone-700'
                            : 'border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={pairedAuthor != null ? `Book: ${book.title}, paired with ${pairedAuthor}` : `Book: ${book.title}`}
                    >
                      <span className="font-medium">{book.title}</span>
                      {pairedAuthor != null && (
                        <span className="ml-2 text-stone-500">→ {pairedAuthor}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500">Authors</h3>
            <ul className="space-y-2" role="list">
              {shuffledAuthors.map((author, index) => {
                const isSelected = selectedAuthorIndex === index;
                const isPaired = Object.values(pairs).includes(index);
                return (
                  <li key={`${author}-${index}`}>
                    <button
                      type="button"
                      onClick={() => handleAuthorClick(index)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : isPaired
                            ? 'border-stone-200 bg-stone-50 text-stone-600'
                            : 'border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`Author: ${author}`}
                    >
                      {author}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {pairedCount > 0 && phase === 'playing' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={checking}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checking ? 'Saving…' : pairedCount === totalCount ? 'Check answers' : `Check answers (${pairedCount}/${totalCount} paired)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
