import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { Book } from '../../api/client';

/* ---------- TypeScript types for Web Speech API ---------- */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/* ---------- Helpers ---------- */

interface CardItem {
  id: number;
  title: string;
  author: string;
}

type FlashcardMode = 'title_to_author' | 'author_to_title';
type Rating = 'got_it' | 'needs_review';
type VoiceFeedback =
  | { kind: 'correct' | 'wrong'; transcript: string }
  | { kind: 'spell_check'; transcript: string }
  | { kind: 'error'; message: string }
  | null;

/** Fisher-Yates shuffle -- returns a new shuffled copy of the array. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

import { similarity, AUTO_CORRECT_THRESHOLD, NEAR_MISS_THRESHOLD } from '../../utils/similarity';

/** Detect browser support for SpeechRecognition. */
const speechSupported =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/** Create a SpeechRecognition instance (only call when speechSupported is true). */
function createRecognition(): SpeechRecognitionInstance {
  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!SR) throw new Error('SpeechRecognition not supported');
  const recognition = new SR();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  return recognition;
}

/* ---------- Component ---------- */

export function FlashcardDeckPage() {
  const { user, team } = useAuth();
  const [allCards, setAllCards] = useState<CardItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<'mode_select' | 'deck' | 'completed'>('mode_select');
  const [mode, setMode] = useState<FlashcardMode>('title_to_author');
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const startRecorded = useRef(false);

  // Voice mode state
  const [useVoice, setUseVoice] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedback>(null);
  const [spellInput, setSpellInput] = useState('');
  const spellInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getBooks()
      .then((data: Book[]) => {
        if (cancelled) return;
        const withAuthor = data
          .filter((b) => b.author != null && String(b.author).trim() !== '')
          .map((b) => ({ id: b.id, title: b.title, author: String(b.author).trim() }));
        setAllCards(withAuthor);
      })
      .catch(() => {
        if (!cancelled) setAllCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Cleanup recognition and timers on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  const startDeck = (selectedMode: FlashcardMode, cardSubset?: CardItem[]) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const deckCards = cardSubset ?? allCards;
    setMode(selectedMode);
    setCards(shuffle(deckCards));
    setCurrentIndex(0);
    setFlipped(false);
    setRatings({});
    setVoiceFeedback(null);
    setSpellInput('');
    setListening(false);
    setPhase('deck');

    if (!startRecorded.current) {
      startRecorded.current = true;
      api.recordFlashcardDeckStart();
    }
  };

  const handleRate = useCallback((rating: Rating) => {
    // Cancel any pending auto-advance timer from voice mode
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    setRatings((prev) => {
      const cardId = cards[currentIndex]?.id;
      if (cardId == null) return prev;
      return { ...prev, [cardId]: rating };
    });

    const isLast = currentIndex === cards.length - 1;
    if (isLast) {
      api.recordFlashcardDeckComplete();
      setPhase('completed');
    } else {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
      setVoiceFeedback(null);
    }
  }, [cards, currentIndex]);

  // Voice: start listening
  const startListening = useCallback(() => {
    if (!speechSupported) return;
    // Stop any previous instance
    recognitionRef.current?.abort();

    const recognition = createRecognition();
    recognitionRef.current = recognition;
    setListening(true);
    setVoiceFeedback(null);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setListening(false);
      // Check all alternatives for the best match
      const card = cards[currentIndex];
      if (!card) return;
      const correctAnswer = mode === 'title_to_author' ? card.author : card.title;

      let bestScore = 0;
      let bestTranscript = '';
      for (let i = 0; i < event.results[0].length; i++) {
        const t = event.results[0][i].transcript;
        const score = similarity(t, correctAnswer);
        if (score > bestScore) {
          bestScore = score;
          bestTranscript = t;
        }
      }

      console.log('[Voice] heard:', JSON.stringify(bestTranscript), '| expected:', JSON.stringify(correctAnswer), '| score:', bestScore.toFixed(3));

      if (bestScore >= AUTO_CORRECT_THRESHOLD) {
        // High confidence match → auto-correct
        setVoiceFeedback({ kind: 'correct', transcript: bestTranscript });
        setFlipped(true);
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleRate('got_it');
        }, 2000);
      } else if (bestScore >= NEAR_MISS_THRESHOLD) {
        // Near miss → ask the student to spell it
        setVoiceFeedback({ kind: 'spell_check', transcript: bestTranscript });
        setSpellInput('');
        // Focus the text input after React renders it
        setTimeout(() => spellInputRef.current?.focus(), 50);
      } else {
        // Clearly wrong
        setVoiceFeedback({ kind: 'wrong', transcript: bestTranscript });
        setFlipped(true);
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleRate('needs_review');
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      let message: string;
      switch (event.error) {
        case 'no-speech':
          message = "Didn't catch that — try again.";
          break;
        case 'not-allowed':
          message = 'Microphone access denied. Check your browser permissions.';
          break;
        case 'service-not-allowed':
        case 'network':
          message =
            'Speech recognition is not available on this device. Try using Chrome on a phone or computer.';
          break;
        case 'audio-capture':
          message = 'No microphone found. Check that a mic is connected.';
          break;
        default:
          message = "Didn't catch that — try again.";
      }
      setVoiceFeedback({ kind: 'error', message });
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setVoiceFeedback({
        kind: 'error',
        message:
          'Speech recognition is not available on this device. Try using Chrome on a phone or computer.',
      });
    }
  }, [cards, currentIndex, mode, handleRate]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    setVoiceFeedback(null);
  }, []);

  // Spell-check: student types the answer to confirm they know it
  const handleSpellSubmit = useCallback(() => {
    const card = cards[currentIndex];
    if (!card) return;
    const correctAnswer = mode === 'title_to_author' ? card.author : card.title;
    const score = similarity(spellInput, correctAnswer);
    const isCorrect = score >= AUTO_CORRECT_THRESHOLD;

    setFlipped(true);
    setVoiceFeedback({ kind: isCorrect ? 'correct' : 'wrong', transcript: spellInput });
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleRate(isCorrect ? 'got_it' : 'needs_review');
    }, 2000);
  }, [cards, currentIndex, mode, spellInput, handleRate]);

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

  if (allCards.length === 0) {
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
          <p className="text-3xl mb-3" aria-hidden>🃏</p>
          <h2 className="text-lg font-semibold text-stone-900">No flashcards available</h2>
          <p className="mt-2 text-stone-600">Your team needs books with authors before you can practice flashcards. Ask your team lead to set up the book list.</p>
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

  // --- Mode selection screen ---
  if (phase === 'mode_select') {
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
        <div className="mx-auto max-w-md px-4 py-12">
          <h2 className="text-lg font-semibold text-stone-900">Choose a mode</h2>
          <p className="mt-2 text-stone-600">Pick how you want to study the {allCards.length} cards.</p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => startDeck('title_to_author')}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium text-stone-900">Title → Author</span>
              <span className="mt-1 block text-stone-500">See the book title, guess the author</span>
            </button>
            <button
              type="button"
              onClick={() => startDeck('author_to_title')}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="font-medium text-stone-900">Author → Title</span>
              <span className="mt-1 block text-stone-500">See the author, guess the book title</span>
            </button>
          </div>

          {/* Voice toggle */}
          {speechSupported ? (
            <div className="mt-6 flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-stone-500">
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-stone-900">Use voice input</span>
                  <span className="block text-xs text-stone-500">Say the answer out loud</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useVoice}
                onClick={() => setUseVoice((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  useVoice ? 'bg-primary-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    useVoice ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
              <p className="text-sm text-amber-800">
                Voice input requires <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Safari</strong>.
                Open this page in one of those browsers to use the microphone.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Completion screen ---
  if (phase === 'completed') {
    const gotItCount = Object.values(ratings).filter((r) => r === 'got_it').length;
    const needsReviewCount = Object.values(ratings).filter((r) => r === 'needs_review').length;
    const needsReviewCards = cards.filter((c) => ratings[c.id] === 'needs_review');

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
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-card border border-stone-100">
            <h2 className="text-lg font-semibold text-stone-900">Deck complete!</h2>
            <p className="mt-2 text-stone-600">You went through all {cards.length} cards.</p>

            {/* Self-grade summary */}
            <div className="mt-4 flex gap-4">
              <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{gotItCount}</p>
                <p className="text-xs font-medium text-emerald-600">Got it</p>
              </div>
              <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{needsReviewCount}</p>
                <p className="text-xs font-medium text-amber-600">Needs review</p>
              </div>
            </div>

            {/* Cards that need review */}
            {needsReviewCards.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-stone-700 mb-2">Review these:</h3>
                <ul className="space-y-1 text-sm">
                  {needsReviewCards.map((c) => (
                    <li key={c.id} className="flex justify-between text-stone-600 py-1 border-b border-stone-100 last:border-0">
                      <span className="font-medium text-stone-900">{c.title}</span>
                      <span>{c.author}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/team/dashboard"
                className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Back to dashboard
              </Link>
              {needsReviewCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => startDeck(mode, needsReviewCards)}
                  className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white transition duration-200 hover:bg-amber-700 focus:outline focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Review missed ({needsReviewCards.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPhase('mode_select')}
                className="inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Go again
              </button>
              <Link
                to="/team/matching-game"
                className="inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Play Match Game
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Deck phase ---
  const card = cards[currentIndex];
  const isLast = currentIndex === cards.length - 1;

  const frontText = mode === 'title_to_author' ? card.title : card.author;
  const backText = mode === 'title_to_author' ? card.author : card.title;
  const frontLabel = mode === 'title_to_author' ? 'Book' : 'Author';
  const backLabel = mode === 'title_to_author' ? 'Author' : 'Book';

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
        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-500 tabular-nums shrink-0">
            {currentIndex + 1}/{cards.length}
          </span>
        </div>

        <p className="mb-4 text-center text-sm text-stone-600">
          {mode === 'title_to_author' ? 'Title → Author' : 'Author → Title'}
          {useVoice ? ' · Say the answer' : ' · Click the card to flip'}
        </p>

        <button
          type="button"
          onClick={() => { if (!useVoice || flipped) setFlipped((f) => !f); }}
          className="relative mx-auto block w-full max-w-md"
          style={{ perspective: '1000px' }}
          aria-label={flipped ? `${backLabel}: ${backText}` : `${frontLabel}: ${frontText}`}
        >
          <div
            className={`relative h-48 w-full rounded-2xl border border-stone-200 bg-white shadow-card transition-transform duration-300 ${
              flipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white px-6"
              style={{ backfaceVisibility: 'hidden' }}
              aria-hidden={flipped}
            >
              <p className="text-xs font-medium text-stone-400 mb-2">{frontLabel}</p>
              <p className="text-center text-lg font-medium text-stone-900">{frontText}</p>
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-primary-50 px-6"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              aria-hidden={!flipped}
            >
              <p className="text-xs font-medium text-primary-400 mb-2">{backLabel}</p>
              <p className="text-center text-lg font-medium text-stone-900">{backText}</p>
            </div>
          </div>
        </button>

        {!flipped && !useVoice && (
          <p className="mt-2 text-center text-xs text-stone-500">Click to flip</p>
        )}

        {/* Voice feedback banner */}
        {voiceFeedback && (voiceFeedback.kind === 'correct' || voiceFeedback.kind === 'wrong') && (
          <div
            className={`mt-4 rounded-lg border p-3 text-center text-sm font-medium ${
              voiceFeedback.kind === 'correct'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p>
              {voiceFeedback.kind === 'correct' ? 'Correct!' : 'Not quite.'}
              {voiceFeedback.transcript
                ? <>{' '}You said: &ldquo;{voiceFeedback.transcript}&rdquo;</>
                : null}
            </p>
          </div>
        )}
        {voiceFeedback && voiceFeedback.kind === 'spell_check' && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800 text-center">
              We heard &ldquo;{voiceFeedback.transcript}&rdquo; &mdash; close! Type the answer to confirm:
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSpellSubmit(); }}
              className="mt-3 flex gap-2"
            >
              <input
                ref={spellInputRef}
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                placeholder="Type your answer..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                disabled={!spellInput.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Check
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setVoiceFeedback({ kind: 'wrong', transcript: voiceFeedback.transcript });
                setFlipped(true);
                autoAdvanceTimerRef.current = setTimeout(() => {
                  handleRate('needs_review');
                }, 2000);
              }}
              className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-800 transition"
            >
              I don&apos;t know &mdash; show me the answer
            </button>
          </div>
        )}
        {voiceFeedback && voiceFeedback.kind === 'error' && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-center text-sm text-stone-600">
            <p>{voiceFeedback.message}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {voiceFeedback?.kind === 'spell_check' ? (
            /* Spell-check mode: input is shown above, hide action buttons */
            null
          ) : useVoice && !flipped ? (
            /* Voice mode: mic button when card is face-down */
            <>
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition duration-200 focus:outline focus:ring-2 focus:ring-offset-2 ${
                  listening
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                    : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary'
                }`}
                aria-label={listening ? 'Cancel listening' : 'Start speaking'}
              >
                {listening && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
                )}
                {listening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="relative h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="relative h-7 w-7">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-stone-500">
                {listening ? 'Tap to cancel' : 'Tap the mic and say your answer'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (listening) stopListening();
                  setFlipped(true);
                  setVoiceFeedback({ kind: 'wrong', transcript: '' });
                  autoAdvanceTimerRef.current = setTimeout(() => {
                    handleRate('needs_review');
                  }, 2000);
                }}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                I don&apos;t know
              </button>
            </>
          ) : flipped ? (
            /* Card is flipped: show self-grade buttons (unless voice already auto-rated) */
            voiceFeedback && voiceFeedback.kind !== 'error' ? (
              <p className="text-xs text-stone-500 animate-pulse">
                {isLast ? 'Finishing...' : 'Moving to next card...'}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleRate('needs_review')}
                  className="flex-1 max-w-[10rem] rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition duration-200 hover:bg-amber-100 focus:outline focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Needs review
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('got_it')}
                  className="flex-1 max-w-[10rem] rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition duration-200 hover:bg-emerald-100 focus:outline focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Got it
                </button>
              </div>
            )
          ) : (
            /* Manual mode: flip button */
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Flip card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
