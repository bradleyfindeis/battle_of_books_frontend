import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { BookAssignment } from '../../../api/client';

const STATUS_LABELS: Record<BookAssignment['status'], string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

interface ReadingProgressProps {
  myBooks: BookAssignment[];
  onEditProgress: (assignment: BookAssignment) => void;
}

export function ReadingProgress({ myBooks, onEditProgress }: ReadingProgressProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="mb-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <h3 className="text-lg font-semibold text-stone-900">My reading progress</h3>
        <ChevronDown
          className={`h-5 w-5 text-stone-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div className={`collapse-grid ${expanded ? 'expanded' : ''}`}>
        <div>
          <div className="mt-2">
            {myBooks.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2" aria-hidden>{'\u{1F4DA}'}</p>
                <p className="font-medium text-stone-900">No books assigned yet</p>
                <p className="mt-1 text-sm text-stone-500">Your team lead will assign books to you soon. In the meantime, try the activities above!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {myBooks.map((a) => (
                  <li
                    key={a.id}
                    className="py-3 border-b border-stone-100 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-stone-900">{a.book?.title ?? 'Unknown book'}</span>
                        {a.book?.author && <span className="ml-2 text-sm text-stone-600">&mdash; {a.book.author}</span>}
                        {a.progress_notes && (
                          <p className="mt-1 text-sm text-stone-500 line-clamp-2">{a.progress_notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            a.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'in_progress'
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {STATUS_LABELS[a.status]}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditProgress(a)}
                          className="text-sm text-primary-600 hover:text-primary-700 focus:outline"
                          title="Update progress"
                        >
                          Update progress
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            a.status === 'completed' || (a.progress_percent ?? 0) === 100
                              ? 'bg-emerald-500'
                              : (a.progress_percent ?? 0) > 0
                                ? 'bg-primary-500'
                                : 'bg-stone-200'
                          }`}
                          style={{ width: `${a.status === 'completed' ? 100 : (a.progress_percent ?? 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-stone-500 tabular-nums w-8 text-right">
                        {a.status === 'completed' ? 100 : (a.progress_percent ?? 0)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface EditProgressModalProps {
  assignment: BookAssignment;
  status: BookAssignment['status'];
  setStatus: (s: BookAssignment['status']) => void;
  notes: string;
  setNotes: (n: string) => void;
  percent: number;
  setPercent: (p: number) => void;
  submitting: boolean;
  error: string | null;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function EditProgressModal({
  assignment,
  status,
  setStatus,
  notes,
  setNotes,
  percent,
  setPercent,
  submitting,
  error,
  onSave,
  onClose,
}: EditProgressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-animate" role="dialog" aria-modal="true" aria-labelledby="edit-progress-title">
      <Card asModal className="max-w-md w-full p-6 shadow-lg animate-scale-in">
        <h2 id="edit-progress-title" className="text-lg font-semibold text-stone-900 mb-4">
          Update progress{assignment.book ? `: ${assignment.book.title}` : ''}
        </h2>
        <form onSubmit={onSave}>
          <div className="mb-4">
            <label htmlFor="edit-progress-status" className="block text-sm font-medium text-stone-700 mb-1">Status</label>
            <select
              id="edit-progress-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BookAssignment['status'])}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
            >
              <option value="assigned">{STATUS_LABELS.assigned}</option>
              <option value="in_progress">{STATUS_LABELS.in_progress}</option>
              <option value="completed">{STATUS_LABELS.completed}</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-progress-percent" className="block text-sm font-medium text-stone-700 mb-1">
              Progress: {percent}%
            </label>
            <input
              id="edit-progress-percent"
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="edit-progress-notes" className="block text-sm font-medium text-stone-700 mb-1">Progress notes (optional)</label>
            <textarea
              id="edit-progress-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chapter 5, halfway through\u2026"
              rows={3}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
