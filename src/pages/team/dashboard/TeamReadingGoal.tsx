import { Card } from '../../../components/Card';
import type { TeamReadingProgressResponse } from '../../../api/client';

interface TeamReadingGoalProps {
  teamReading: TeamReadingProgressResponse;
  currentUserId: number;
}

export function TeamReadingGoal({ teamReading, currentUserId }: TeamReadingGoalProps) {
  if (teamReading.total_assignments === 0) return null;

  return (
    <Card className="mb-8">
      <h3 className="text-lg font-semibold text-stone-900 mb-3">Team reading goal</h3>
      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-medium text-stone-700">
            {teamReading.completed_count} of {teamReading.total_assignments} books completed
          </span>
          <span className="text-sm font-semibold text-stone-900 tabular-nums">
            {teamReading.total_assignments > 0 ? Math.round((teamReading.completed_count / teamReading.total_assignments) * 100) : 0}%
          </span>
        </div>
        <div className="h-4 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${teamReading.total_assignments > 0 ? (teamReading.completed_count / teamReading.total_assignments) * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-stone-500">
          <span>{teamReading.completed_count} completed</span>
          <span>{teamReading.in_progress_count} in progress</span>
          <span>{teamReading.total_assignments - teamReading.completed_count - teamReading.in_progress_count} not started</span>
        </div>
      </div>

      {/* Per-teammate mini bars */}
      {teamReading.teammates.length > 0 && (
        <div className="border-t border-stone-100 pt-3">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Teammate progress</p>
          <div className="space-y-2">
            {teamReading.teammates.map((t) => (
              <div key={t.user_id} className="flex items-center gap-3">
                <span className={`text-sm w-28 truncate flex items-center gap-1.5 ${t.user_id === currentUserId ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                  {t.avatar_emoji && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs shrink-0"
                      style={t.avatar_color ? { backgroundColor: t.avatar_color } : undefined}
                      aria-hidden
                    >
                      {t.avatar_emoji}
                    </span>
                  )}
                  {t.user_id === currentUserId ? 'You' : t.username}
                </span>
                <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      t.avg_progress === 100 ? 'bg-emerald-500' : t.avg_progress > 0 ? 'bg-primary-500' : 'bg-stone-200'
                    }`}
                    style={{ width: `${t.avg_progress}%` }}
                  />
                </div>
                <span className="text-xs text-stone-500 tabular-nums w-16 text-right">
                  {t.books_completed}/{t.books_assigned}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently completed */}
      {teamReading.recently_completed.length > 0 && (
        <div className="border-t border-stone-100 pt-3 mt-3">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Recently finished</p>
          <ul className="space-y-1">
            {teamReading.recently_completed.map((rc, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500 shrink-0" aria-hidden>&#10003;</span>
                <span className="font-medium text-stone-800">{rc.username}</span>
                <span className="text-stone-500">finished</span>
                <span className="text-stone-700 italic truncate">{rc.book_title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
