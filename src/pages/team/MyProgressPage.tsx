import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import type { MyProgressResponse } from '../../api/client';

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function MyProgressPage() {
  const [data, setData] = useState<MyProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyProgress()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Build 30-day calendar grid
  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; active: boolean }[] = [];
    const activeDates = new Set(data?.activity.recent_dates ?? []);
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      days.push({ date: iso, label: dayLabel, active: activeDates.has(iso) });
    }
    return days;
  }, [data?.activity.recent_dates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-stone-600">Unable to load progress data.</p>
          <Link to="/team/dashboard" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { quiz, matches, reading, activity } = data;
  const matchWinRate = matches.total > 0 ? Math.round((matches.wins / matches.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="px-4 py-8 mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-900">My Progress</h2>
          <Link
            to="/team/dashboard"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        {/* Lifetime stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          <Card padding="p-4" className="text-center">
            <p className="text-2xl font-bold text-primary-700">{quiz.total_attempts}</p>
            <p className="text-xs font-medium text-stone-500 mt-1">Quizzes taken</p>
          </Card>
          <Card padding="p-4" className="text-center">
            <p className="text-2xl font-bold text-violet-700">{matches.total}</p>
            <p className="text-xs font-medium text-stone-500 mt-1">Matches played</p>
          </Card>
          <Card padding="p-4" className="text-center">
            <p className="text-2xl font-bold text-emerald-700">{reading.books_completed}/{reading.books_total}</p>
            <p className="text-xs font-medium text-stone-500 mt-1">Books completed</p>
          </Card>
          <Card padding="p-4" className="text-center">
            <p className="text-2xl font-bold text-amber-700">{activity.total_active_days}</p>
            <p className="text-xs font-medium text-stone-500 mt-1">Days active (all time)</p>
          </Card>
        </div>

        {/* Quiz score trend */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-stone-900 mb-1">Quiz score trend</h3>
          {quiz.recent.length === 0 ? (
            <p className="text-sm text-stone-500 py-4">No quiz attempts yet. Take a quiz to see your progress!</p>
          ) : (
            <>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm text-stone-500">
                  High score: <span className="font-semibold text-stone-700">{quiz.high_score}/{quiz.max_possible}</span>
                </span>
                <span className="text-sm text-stone-500">
                  Average: <span className="font-semibold text-stone-700">{quiz.avg_percent}%</span>
                </span>
              </div>
              <div className="flex items-end gap-1 h-32">
                {quiz.recent.map((attempt, i) => {
                  const pct = attempt.total_count > 0 ? (attempt.correct_count / attempt.total_count) * 100 : 0;
                  const height = Math.max(pct, 4); // minimum visible bar
                  const color =
                    pct >= 80 ? 'bg-emerald-500' :
                    pct >= 60 ? 'bg-primary-500' :
                    pct >= 40 ? 'bg-amber-500' :
                    'bg-red-400';
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                      title={`${attempt.correct_count}/${attempt.total_count} (${Math.round(pct)}%) — ${new Date(attempt.created_at).toLocaleDateString()}`}
                    >
                      <div
                        className={`w-full rounded-t ${color} transition-all duration-300`}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-400">Oldest</span>
                <span className="text-[10px] text-stone-400">Most recent</span>
              </div>
            </>
          )}
        </Card>

        {/* Match record */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-stone-900 mb-3">Match record</h3>
          {matches.total === 0 ? (
            <p className="text-sm text-stone-500 py-2">No matches played yet. Challenge a teammate!</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              {/* Win/Loss/Tie bars */}
              <div className="flex-1">
                <div className="flex h-6 rounded-full overflow-hidden bg-stone-100">
                  {matches.wins > 0 && (
                    <div
                      className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(matches.wins / matches.total) * 100}%` }}
                    >
                      {matches.wins}W
                    </div>
                  )}
                  {matches.ties > 0 && (
                    <div
                      className="bg-stone-400 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(matches.ties / matches.total) * 100}%` }}
                    >
                      {matches.ties}T
                    </div>
                  )}
                  {matches.losses > 0 && (
                    <div
                      className="bg-red-400 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(matches.losses / matches.total) * 100}%` }}
                    >
                      {matches.losses}L
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-stone-500">
                  <span>{matches.wins} {matches.wins === 1 ? 'win' : 'wins'}</span>
                  <span>{matches.ties} {matches.ties === 1 ? 'tie' : 'ties'}</span>
                  <span>{matches.losses} {matches.losses === 1 ? 'loss' : 'losses'}</span>
                </div>
              </div>
              {/* Win rate */}
              <div className="text-center shrink-0">
                <p className="text-3xl font-bold text-stone-900">{matchWinRate}%</p>
                <p className="text-xs text-stone-500">Win rate</p>
              </div>
            </div>
          )}
        </Card>

        {/* Reading progress */}
        {reading.books_total > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-3">Reading progress</h3>
            <ul className="space-y-3">
              {reading.assignments.map((a, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-stone-900 text-sm">{a.book_title}</span>
                      {a.book_author && <span className="ml-2 text-xs text-stone-500">— {a.book_author}</span>}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        a.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.status === 'in_progress'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          a.status === 'completed' ? 'bg-emerald-500' : a.progress_percent > 0 ? 'bg-primary-500' : 'bg-stone-200'
                        }`}
                        style={{ width: `${a.status === 'completed' ? 100 : a.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-stone-400 tabular-nums w-7 text-right">
                      {a.status === 'completed' ? 100 : a.progress_percent}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Activity calendar (last 30 days) */}
        <Card className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-lg font-semibold text-stone-900">Activity (last 30 days)</h3>
            {activity.current_streak > 0 && (
              <span className="text-sm font-medium text-amber-700">{activity.current_streak}-day streak</span>
            )}
          </div>
          <div className="grid grid-cols-10 gap-1 sm:grid-cols-15">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                className={`aspect-square rounded-sm transition ${
                  day.active
                    ? 'bg-emerald-500'
                    : 'bg-stone-200'
                }`}
                title={`${day.label}${day.active ? ' — active' : ''}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-stone-200" />
              <span className="text-[10px] text-stone-500">Inactive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-[10px] text-stone-500">Active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
