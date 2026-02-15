import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { LeaderboardEntry } from '../../api/client';

type Category = 'quiz' | 'matches' | 'reading';

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'quiz', label: 'Quiz scores', icon: '📝' },
  { key: 'matches', label: 'Head-to-head', icon: '⚔️' },
  { key: 'reading', label: 'Reading', icon: '📚' },
];

function medalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

export function LeaderboardPage() {
  const { user, team } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('quiz');

  // Redirect if leaderboard is disabled
  if (team?.leaderboard_enabled === false) {
    return <Navigate to="/team/dashboard" replace />;
  }

  useEffect(() => {
    let cancelled = false;
    api
      .getLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Sort entries based on selected category
  const sorted = [...entries].sort((a, b) => {
    switch (category) {
      case 'quiz':
        // Primary: high score desc, secondary: avg desc, tertiary: attempts desc
        if (b.quiz_high_score !== a.quiz_high_score) return b.quiz_high_score - a.quiz_high_score;
        if (b.quiz_avg_score !== a.quiz_avg_score) return b.quiz_avg_score - a.quiz_avg_score;
        return b.quiz_attempt_count - a.quiz_attempt_count;
      case 'matches':
        // Primary: wins desc, secondary: fewest losses
        if (b.match_wins !== a.match_wins) return b.match_wins - a.match_wins;
        return a.match_losses - b.match_losses;
      case 'reading':
        // Primary: books completed desc, secondary: avg progress desc
        if (b.books_completed !== a.books_completed) return b.books_completed - a.books_completed;
        return b.avg_reading_progress - a.avg_reading_progress;
    }
  });

  // Assign ranks (handling ties)
  const getRank = (index: number): number => {
    if (index === 0) return 1;
    const prev = sorted[index - 1];
    const curr = sorted[index];
    const same = category === 'quiz'
      ? curr.quiz_high_score === prev.quiz_high_score && curr.quiz_avg_score === prev.quiz_avg_score
      : category === 'matches'
        ? curr.match_wins === prev.match_wins && curr.match_losses === prev.match_losses
        : curr.books_completed === prev.books_completed && curr.avg_reading_progress === prev.avg_reading_progress;
    return same ? getRank(index - 1) : index + 1;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Team Leaderboard</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                category === cat.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span aria-hidden>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3" aria-hidden>🏆</p>
            <h2 className="text-lg font-semibold text-stone-900">No data yet</h2>
            <p className="mt-2 text-stone-600">Once your team starts playing, rankings will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-stone-100 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Teammate</th>
                  {category === 'quiz' && (
                    <>
                      <th className="px-4 py-3 text-right">High score</th>
                      <th className="px-4 py-3 text-right">Avg score</th>
                      <th className="px-4 py-3 text-right">Quizzes</th>
                    </>
                  )}
                  {category === 'matches' && (
                    <>
                      <th className="px-4 py-3 text-right">Wins</th>
                      <th className="px-4 py-3 text-right">Losses</th>
                      <th className="px-4 py-3 text-right">Win rate</th>
                    </>
                  )}
                  {category === 'reading' && (
                    <>
                      <th className="px-4 py-3 text-right">Completed</th>
                      <th className="px-4 py-3 text-right">Assigned</th>
                      <th className="px-4 py-3 text-right">Avg progress</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, i) => {
                  const rank = getRank(i);
                  const isMe = entry.user_id === user?.id;
                  const medal = medalEmoji(rank);
                  const totalMatches = entry.match_wins + entry.match_losses;
                  const winRate = totalMatches > 0 ? Math.round((entry.match_wins / totalMatches) * 100) : 0;

                  return (
                    <tr
                      key={entry.user_id}
                      className={`border-b border-stone-100 last:border-b-0 transition ${
                        isMe ? 'bg-primary-50/60' : 'hover:bg-stone-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-stone-500">
                        {medal ? (
                          <span className="text-base" aria-label={`Rank ${rank}`}>{medal}</span>
                        ) : (
                          rank
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.avatar_emoji && (
                            <span className="text-base" aria-hidden>{entry.avatar_emoji}</span>
                          )}
                          <span className={`text-sm font-medium ${isMe ? 'text-primary-700' : 'text-stone-900'}`}>
                            {entry.username}
                          </span>
                          {isMe && (
                            <span className="text-xs font-medium text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">You</span>
                          )}
                          {entry.role === 'team_lead' && (
                            <span className="text-xs text-stone-400">Lead</span>
                          )}
                        </div>
                      </td>
                      {category === 'quiz' && (
                        <>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
                            {entry.quiz_high_score}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-stone-600">
                            {entry.quiz_avg_score > 0 ? entry.quiz_avg_score.toFixed(1) : '--'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-stone-600">
                            {entry.quiz_attempt_count}
                          </td>
                        </>
                      )}
                      {category === 'matches' && (
                        <>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                            {entry.match_wins}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">
                            {entry.match_losses}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-stone-600">
                            {totalMatches > 0 ? `${winRate}%` : '--'}
                          </td>
                        </>
                      )}
                      {category === 'reading' && (
                        <>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
                            {entry.books_completed}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-stone-600">
                            {entry.books_assigned}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-stone-600">
                            {entry.books_assigned > 0 ? `${entry.avg_reading_progress}%` : '--'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
