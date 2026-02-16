import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/useAuth';
import type {
  MatchingGameTeamStatsResponse,
  FlashcardDeckTeamStatsResponse,
  QuizTeamStatsResponse,
} from '../../api/client';

type Tab = 'quiz' | 'flashcards' | 'matching';

const TABS: { key: Tab; label: string }[] = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'matching', label: 'Matching Game' },
];

export function TeamActivityPage() {
  const { team } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('quiz');
  const [loading, setLoading] = useState(true);

  const [quizStats, setQuizStats] = useState<QuizTeamStatsResponse | null>(null);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardDeckTeamStatsResponse | null>(null);
  const [matchingStats, setMatchingStats] = useState<MatchingGameTeamStatsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetches: Promise<void>[] = [];

    if (team?.book_list_id) {
      fetches.push(
        api.getTeamQuizStats().then((data) => { if (!cancelled) setQuizStats(data); }).catch(() => {}),
      );
    }
    fetches.push(
      api.getTeamFlashcardDeckStats().then((data) => { if (!cancelled) setFlashcardStats(data); }).catch(() => {}),
    );
    fetches.push(
      api.getTeamMatchingGameStats().then((data) => { if (!cancelled) setMatchingStats(data); }).catch(() => {}),
    );

    Promise.all(fetches).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [team?.book_list_id]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="px-4 py-8 mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-900">Team activity</h2>
          <Link
            to="/team/dashboard"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
          </div>
        ) : (
          <>
            {activeTab === 'quiz' && (
              <div className="animate-fade-in-up-fast">
                <QuizStatsTable stats={quizStats} hasBookList={team?.book_list_id != null} />
              </div>
            )}
            {activeTab === 'flashcards' && (
              <div className="animate-fade-in-up-fast">
                <FlashcardStatsTable stats={flashcardStats} />
              </div>
            )}
            {activeTab === 'matching' && (
              <div className="animate-fade-in-up-fast">
                <MatchingStatsTable stats={matchingStats} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuizStatsTable({ stats, hasBookList }: { stats: QuizTeamStatsResponse | null; hasBookList: boolean }) {
  if (!hasBookList) {
    return (
      <Card>
        <p className="text-sm text-stone-500 py-4 text-center">Choose a book list to enable quizzes.</p>
      </Card>
    );
  }
  if (!stats || stats.teammates.length === 0) {
    return (
      <Card>
        <p className="text-sm text-stone-500 py-4 text-center">No quiz activity yet.</p>
      </Card>
    );
  }
  return (
    <Card>
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
            {stats.teammates.map((t) => (
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
  );
}

function FlashcardStatsTable({ stats }: { stats: FlashcardDeckTeamStatsResponse | null }) {
  if (!stats || stats.teammates.length === 0) {
    return (
      <Card>
        <p className="text-sm text-stone-500 py-4 text-center">No flashcard activity yet.</p>
      </Card>
    );
  }
  return (
    <Card>
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
            {stats.teammates.map((t) => (
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
  );
}

function MatchingStatsTable({ stats }: { stats: MatchingGameTeamStatsResponse | null }) {
  if (!stats || stats.teammates.length === 0) {
    return (
      <Card>
        <p className="text-sm text-stone-500 py-4 text-center">No matching game activity yet.</p>
      </Card>
    );
  }
  return (
    <Card>
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
            {stats.teammates.map((t) => (
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
  );
}
