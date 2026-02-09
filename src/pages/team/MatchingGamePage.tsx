import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
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

export function MatchingGamePage() {
  const { user, team } = useAuth();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffledTitles, setShuffledTitles] = useState<BookItem[]>([]);
  const [shuffledAuthors, setShuffledAuthors] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Record<number, number>>({}); // bookId -> authorIndex
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedAuthorIndex, setSelectedAuthorIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<'playing' | 'submitted'>('playing');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getBooks()
      .then((data: Book[]) => {
        if (cancelled) return;
        const withAuthor = data
          .filter((b) => b.author != null && String(b.author).trim() !== '')
          .map((b) => ({ id: b.id, title: b.title, author: String(b.author).trim() }));
        setBooks(withAuthor);
        setShuffledTitles(shuffle(withAuthor));
        setShuffledAuthors(shuffle(withAuthor.map((b) => b.author)));
        setTotalCount(withAuthor.length);
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
  const allPaired = totalCount > 0 && pairedCount === totalCount;

  const handleCheckAnswers = async () => {
    if (!allPaired || checking) return;
    setChecking(true);
    let correct = 0;
    const correctMap = new Map(books.map((b) => [b.id, b.author]));
    for (const [bookId, authorIndex] of Object.entries(pairs)) {
      if (correctMap.get(Number(bookId)) === shuffledAuthors[authorIndex]) correct++;
    }
    setCorrectCount(correct);
    setScore(correct);
    setSubmitError('');
    try {
      const res = await api.submitMatchingGameAttempt(correct, totalCount, correct);
      setHighScore(res.high_score);
      if (correct === totalCount) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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

  if (books.length < 2) {
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
          <p className="text-stone-600">Add more books with authors to play the Matching Game.</p>
          <Link
            to="/team/dashboard"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium transition duration-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const resultMessage =
    score === totalCount
      ? 'Perfect! You got them all!'
      : score >= 15 && score <= 19
        ? 'Great Job!'
        : 'Keep going — every match you learn helps. Try again whenever you\'re ready!';

  if (phase === 'submitted') {
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
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-card border border-stone-100">
            <h2 className="text-lg font-semibold text-stone-900">Round complete</h2>
            <p className="mt-3 text-lg font-medium text-stone-900">{resultMessage}</p>
            <p className="mt-2 text-stone-600">
              You got {correctCount} out of {totalCount} correct. Score: {score}.
            </p>
            {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
            {highScore !== null && (
              <p className="mt-2 font-medium text-stone-900">Your high score: {highScore}</p>
            )}
            <Link
              to="/team/dashboard"
              className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Matching Game — Match book to author</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="mb-6 text-sm text-stone-600">
          Click a book title, then click the matching author. When all are paired, check your answers.
        </p>

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
                      {pairedAuthor != null && phase === 'playing' && (
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

        {allPaired && phase === 'playing' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={checking}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checking ? 'Saving…' : 'Check answers'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
