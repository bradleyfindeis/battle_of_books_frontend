import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { Book } from '../../api/client';

interface CardItem {
  id: number;
  title: string;
  author: string;
}

export function FlashcardDeckPage() {
  const { user, team } = useAuth();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<'deck' | 'completed'>('deck');
  const startRecorded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getBooks()
      .then((data: Book[]) => {
        if (cancelled) return;
        const withAuthor = data
          .filter((b) => b.author != null && String(b.author).trim() !== '')
          .map((b) => ({ id: b.id, title: b.title, author: String(b.author).trim() }));
        setCards(withAuthor);
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || cards.length === 0 || startRecorded.current) return;
    startRecorded.current = true;
    api.recordFlashcardDeckStart();
  }, [loading, cards.length]);

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

  if (cards.length === 0) {
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
          <p className="text-stone-600">Add books with authors to use flashcards.</p>
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

  if (phase === 'completed') {
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
            <h2 className="text-lg font-semibold text-stone-900">You&apos;ve completed the deck!</h2>
            <p className="mt-2 text-stone-600">You went through all {cards.length} cards.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/team/dashboard"
                className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Back to dashboard
              </Link>
              <Link
                to="/team/matching-game"
                className="inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Play Match Game
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPhase('deck');
                  setCurrentIndex(0);
                  setFlipped(false);
                }}
                className="inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Go again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;

  const handleNext = () => {
    if (isLast) {
      api.recordFlashcardDeckComplete();
      setPhase('completed');
    } else {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Flashcards</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-4 text-center text-sm text-stone-600">
          Card {currentIndex + 1} of {cards.length}. Click the card to flip.
        </p>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="relative mx-auto block w-full max-w-md"
          style={{ perspective: '1000px' }}
          aria-label={flipped ? `Author: ${card.author}` : `Book: ${card.title}`}
        >
          <div
            className={`relative h-48 w-full rounded-2xl border border-stone-200 bg-white shadow-card transition-transform duration-300 ${
              flipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-6"
              style={{ backfaceVisibility: 'hidden' }}
              aria-hidden={flipped}
            >
              <p className="text-center text-lg font-medium text-stone-900">{card.title}</p>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl border border-stone-200 bg-primary-50 px-6"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              aria-hidden={!flipped}
            >
              <p className="text-center text-lg font-medium text-stone-900">{card.author}</p>
            </div>
          </div>
        </button>

        <p className="mt-2 text-center text-xs text-stone-500">Click to flip</p>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirst}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isLast ? 'Finish deck' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
