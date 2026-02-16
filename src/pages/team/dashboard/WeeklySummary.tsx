import { Card } from '../../../components/Card';
import type { WeeklySummaryResponse } from '../../../api/client';

interface WeeklySummaryProps {
  weeklySummary: WeeklySummaryResponse;
}

export function WeeklySummary({ weeklySummary }: WeeklySummaryProps) {
  const hasActivity = weeklySummary.quizzes_completed > 0
    || weeklySummary.matches_played > 0
    || weeklySummary.books_finished > 0
    || weeklySummary.days_active > 0;

  if (!hasActivity) return null;

  return (
    <Card className="mb-8">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">This week</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-center transition hover:scale-[1.03] animate-fade-in-up stagger-1">
          <p className="text-2xl font-bold text-primary-700">{weeklySummary.quizzes_completed}</p>
          <p className="text-xs font-medium text-primary-600 mt-1">
            {weeklySummary.quizzes_completed === 1 ? 'Quiz' : 'Quizzes'}
          </p>
          {weeklySummary.quizzes_completed > 0 && (
            <p className="text-[10px] text-primary-500 mt-0.5">avg {weeklySummary.quiz_avg_score}%</p>
          )}
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center transition hover:scale-[1.03] animate-fade-in-up stagger-2">
          <p className="text-2xl font-bold text-violet-700">{weeklySummary.matches_played}</p>
          <p className="text-xs font-medium text-violet-600 mt-1">
            {weeklySummary.matches_played === 1 ? 'Match' : 'Matches'}
          </p>
          {weeklySummary.matches_played > 0 && (
            <p className="text-[10px] text-violet-500 mt-0.5">{weeklySummary.matches_won} won</p>
          )}
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center transition hover:scale-[1.03] animate-fade-in-up stagger-3">
          <p className="text-2xl font-bold text-emerald-700">{weeklySummary.books_finished}</p>
          <p className="text-xs font-medium text-emerald-600 mt-1">
            {weeklySummary.books_finished === 1 ? 'Book finished' : 'Books finished'}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center transition hover:scale-[1.03] animate-fade-in-up stagger-4">
          <p className="text-2xl font-bold text-amber-700">{weeklySummary.days_active}</p>
          <p className="text-xs font-medium text-amber-600 mt-1">
            {weeklySummary.days_active === 1 ? 'Day active' : 'Days active'}
          </p>
        </div>
      </div>
    </Card>
  );
}
