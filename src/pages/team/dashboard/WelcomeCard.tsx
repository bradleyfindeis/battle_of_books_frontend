import { Link } from 'react-router-dom';
import { Card } from '../../../components/Card';

interface WelcomeCardProps {
  username: string;
  onDismiss: () => void;
}

export function WelcomeCard({ username, onDismiss }: WelcomeCardProps) {
  return (
    <Card className="mb-8 relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-primary-100 opacity-50" />
      <div className="absolute bottom-0 left-0 w-20 h-20 -ml-6 -mb-6 rounded-full bg-amber-100 opacity-40" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              Welcome to Battle of the Books, {username}!
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Get ready to learn, compete, and have fun with your team. Here's how to get started:
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
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
            onClick={onDismiss}
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
            onClick={onDismiss}
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
            onClick={onDismiss}
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
  );
}
