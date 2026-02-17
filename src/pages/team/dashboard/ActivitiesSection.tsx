import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/Card';
import type { ChallengeableTeammate, Team, QuizDifficulty } from '../../../api/client';

interface ActivitiesSectionProps {
  team: Team;
  matchingGameHighScore: number | null;
  flashcardDeckTimesCompleted: number;
  quizHighScore: number | null;
  sortedTeammates: ChallengeableTeammate[];
  challengeableTeammates: ChallengeableTeammate[];
  onlineUserIds: Set<number>;
  challengeSubmitting: boolean;
  onChallenge: (teammateId: number, difficulty: QuizDifficulty) => void;
}

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
];

export function ActivitiesSection({
  team,
  matchingGameHighScore,
  flashcardDeckTimesCompleted,
  quizHighScore,
  sortedTeammates,
  challengeableTeammates,
  onlineUserIds,
  challengeSubmitting,
  onChallenge,
}: ActivitiesSectionProps) {
  const [pickingDifficultyFor, setPickingDifficultyFor] = useState<number | null>(null);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">Activities</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: '800px' }}>
        <Card hover className="animate-fade-in-up stagger-1">
          <h4 className="font-semibold text-stone-900">Matching Game</h4>
          <p className="mt-1 text-sm text-stone-600">Match each book title to its author. Earn points for each correct match.</p>
          <p className="mt-2 text-sm text-stone-700">
            {matchingGameHighScore !== null && matchingGameHighScore > 0
              ? `High score: ${matchingGameHighScore}`
              : 'Ready to test your memory? Give it a try!'}
          </p>
          <Link
            to="/team/matching-game"
            className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 active:scale-[0.97] focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Play
          </Link>
        </Card>
        <Card hover className="animate-fade-in-up stagger-2">
          <h4 className="font-semibold text-stone-900">Flashcards</h4>
          <p className="mt-1 text-sm text-stone-600">Learn book titles and authors. Flip each card to see the author, then advance through the deck.</p>
          <p className="mt-2 text-sm text-stone-700">
            {flashcardDeckTimesCompleted > 0
              ? `Times completed: ${flashcardDeckTimesCompleted}`
              : 'Start here to learn all the titles and authors.'}
          </p>
          <Link
            to="/team/flashcards"
            className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 active:scale-[0.97] focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Practice
          </Link>
        </Card>
        <Card hover className="animate-fade-in-up stagger-3">
          <h4 className="font-semibold text-stone-900">Quiz</h4>
          <p className="mt-1 text-sm text-stone-600">Answer &quot;In which book does&hellip;?&quot; for each question; select the book and author.</p>
          <p className="mt-2 text-sm text-stone-700">
            {team?.book_list_id != null
              ? (quizHighScore !== null && quizHighScore > 0
                  ? `High score: ${quizHighScore}`
                  : 'Think you know the books? Put yourself to the test!')
              : 'Choose a book list to get started.'}
          </p>
          <Link
            to="/team/quiz"
            className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 active:scale-[0.97] focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Play
          </Link>
        </Card>
        {team?.book_list_id != null && (
          <Card hover className="flex flex-col animate-fade-in-up stagger-4">
            <h4 className="font-semibold text-stone-900">Challenge a teammate</h4>
            <p className="mt-1 text-sm text-stone-600">Play a real-time 20-question quiz head-to-head.</p>
            {challengeableTeammates.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">Once your team lead adds more teammates, you can challenge them here.</p>
            ) : (
              <ul className="mt-3 space-y-2 flex-1">
                {sortedTeammates.map((t) => {
                  const isOnline = onlineUserIds.has(t.id);
                  const isPicking = pickingDifficultyFor === t.id;
                  return (
                    <li key={t.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-medium text-stone-900">
                          <span className="relative inline-flex h-2 w-2" title={isOnline ? 'Online' : 'Offline'}>
                            {isOnline && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                          </span>
                          {t.avatar_emoji && (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm shrink-0"
                              style={t.avatar_color ? { backgroundColor: t.avatar_color } : undefined}
                              aria-hidden
                            >
                              {t.avatar_emoji}
                            </span>
                          )}
                          {t.username}
                        </span>
                        <button
                          type="button"
                          disabled={challengeSubmitting}
                          onClick={() => setPickingDifficultyFor(isPicking ? null : t.id)}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
                        >
                          {challengeSubmitting && isPicking ? 'Creating\u2026' : 'Challenge'}
                        </button>
                      </div>
                      {isPicking && !challengeSubmitting && (
                        <div className="mt-2 flex gap-2 pl-4">
                          {DIFFICULTY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                onChallenge(t.id, opt.value);
                                setPickingDifficultyFor(null);
                              }}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${opt.color}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPickingDifficultyFor(null)}
                            className="rounded-full px-2 py-1 text-xs text-stone-500 hover:text-stone-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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
  );
}
