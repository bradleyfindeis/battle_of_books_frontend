import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import type { BookAssignment, Book, User } from '../../api/client';

const STATUS_LABELS: Record<BookAssignment['status'], string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function BooksAssignmentsPage() {
  const { user, team, logout, isDemoMode, exitDemo } = useAuth();
  const navigate = useNavigate();

  const [teammates, setTeammates] = useState<User[]>([]);
  const [teamBooks, setTeamBooks] = useState<Book[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<BookAssignment[]>([]);

  // Assign book modal
  const [assignBookOpen, setAssignBookOpen] = useState(false);
  const [assignBookBookIds, setAssignBookBookIds] = useState<number[]>([]);
  const [assignBookUserIds, setAssignBookUserIds] = useState<number[]>([]);
  const [assignBookSubmitting, setAssignBookSubmitting] = useState(false);
  const [assignBookError, setAssignBookError] = useState<string | null>(null);

  // Edit progress modal
  const [editProgressAssignment, setEditProgressAssignment] = useState<BookAssignment | null>(null);
  const [editProgressStatus, setEditProgressStatus] = useState<BookAssignment['status']>('assigned');
  const [editProgressNotes, setEditProgressNotes] = useState('');
  const [editProgressPercent, setEditProgressPercent] = useState<number>(0);
  const [editProgressSubmitting, setEditProgressSubmitting] = useState(false);
  const [editProgressError, setEditProgressError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Fetch data
  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api.getTeammates()
      .then((data) => { if (!cancelled) setTeammates(data); })
      .catch(() => { if (!cancelled) setTeammates([]); });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api.getBooks()
      .then((data) => { if (!cancelled) setTeamBooks(data); })
      .catch(() => { if (!cancelled) setTeamBooks([]); });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api.getAssignments()
      .then((data) => { if (!cancelled) setTeamAssignments(data); })
      .catch(() => { if (!cancelled) setTeamAssignments([]); });
    return () => { cancelled = true; };
  }, [user?.role]);

  const refreshTeamAssignments = () => {
    api.getAssignments().then(setTeamAssignments).catch(() => setTeamAssignments([]));
  };

  const handleLogout = () => {
    logout();
    navigate('/team/login', { replace: true });
  };

  const handleExitDemo = () => {
    exitDemo();
    navigate('/admin', { replace: true });
  };

  const handleAssignBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignBookBookIds.length === 0 || assignBookUserIds.length === 0) return;
    const existingKeys = new Set(
      teamAssignments.map((a) => `${a.book_id}-${a.user_id}`)
    );
    const toCreate: { bookId: number; userId: number }[] = [];
    for (const bookId of assignBookBookIds) {
      for (const userId of assignBookUserIds) {
        if (!existingKeys.has(`${bookId}-${userId}`)) toCreate.push({ bookId, userId });
      }
    }
    if (toCreate.length === 0) {
      setAssignBookError('All selected book\u2013teammate pairs are already assigned.');
      return;
    }
    setAssignBookSubmitting(true);
    setAssignBookError(null);
    Promise.all(toCreate.map(({ bookId, userId }) => api.createAssignment(userId, bookId)))
      .then(() => {
        refreshTeamAssignments();
        setAssignBookOpen(false);
        setAssignBookBookIds([]);
        setAssignBookUserIds([]);
        setToastMessage(`Created ${toCreate.length} assignment${toCreate.length === 1 ? '' : 's'}`);
      })
      .catch(() => setAssignBookError('Failed to assign for one or more book\u2013teammate pairs.'))
      .finally(() => setAssignBookSubmitting(false));
  };

  const toggleAssignBook = (bookId: number) => {
    setAssignBookBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const toggleAssignTeammate = (userId: number) => {
    setAssignBookUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    if (!window.confirm('Remove this book assignment?')) return;
    api.deleteAssignment(assignmentId).then(() => refreshTeamAssignments()).catch(() => {});
  };

  const openEditProgress = (assignment: BookAssignment) => {
    setEditProgressAssignment(assignment);
    setEditProgressStatus(assignment.status);
    setEditProgressNotes(assignment.progress_notes ?? '');
    setEditProgressPercent(assignment.progress_percent ?? 0);
    setEditProgressError(null);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProgressAssignment) return;
    setEditProgressSubmitting(true);
    setEditProgressError(null);
    api
      .updateAssignment(editProgressAssignment.id, editProgressStatus, editProgressNotes || undefined, editProgressPercent)
      .then(() => {
        refreshTeamAssignments();
        setEditProgressAssignment(null);
        setToastMessage('Progress updated');
      })
      .catch(() => setEditProgressError('Failed to update progress'))
      .finally(() => setEditProgressSubmitting(false));
  };

  if (!user || !team) return null;
  if (user.role !== 'team_lead') return <Navigate to="/team/dashboard" replace />;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Battle of the Books</h1>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <button
                type="button"
                onClick={handleExitDemo}
                className="px-3 py-2 text-sm font-medium text-primary-700 rounded-lg border border-primary-300 bg-primary-50 hover:bg-primary-100 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
              >
                Exit demo
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-stone-700 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
      <div className="px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-stone-900">Team: {team.name}</h2>
          <p className="text-sm text-stone-500">
            Signed in as {user.username}
            <span className="ml-2 text-stone-400">· Team ID: {team.id} (use with your password to sign in)</span>
          </p>
        </div>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">Books and assignments</h3>
            <button
              type="button"
              onClick={() => {
                setAssignBookError(null);
                setAssignBookOpen(true);
              }}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={teammates.length === 0 || teamBooks.length === 0}
              title={teammates.length === 0 ? 'Add teammates first' : teamBooks.length === 0 ? 'Choose a book list first' : ''}
            >
              Assign book
            </button>
          </div>
          {teamBooks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2" aria-hidden>📖</p>
              <p className="font-medium text-stone-900">No books yet</p>
              <p className="mt-1 text-sm text-stone-500">
                Choose a book list first so your team has books to work with.
              </p>
              <Link
                to="/team/choose-list"
                className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Choose book list
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="py-3 px-4 font-medium text-stone-700">Book</th>
                    <th className="py-3 px-4 font-medium text-stone-700">Author</th>
                    <th className="py-3 px-4 font-medium text-stone-700">Assigned to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {teamBooks.map((book) => {
                    const assignments = teamAssignments.filter((a) => a.book_id === book.id);
                    return (
                      <tr key={book.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-medium text-stone-900">{book.title}</td>
                        <td className="py-3 px-4 text-stone-600">{book.author ?? '\u2014'}</td>
                        <td className="py-3 px-4">
                          {assignments.length === 0 ? (
                            <span className="text-stone-400">\u2014</span>
                          ) : (
                            <ul className="space-y-2">
                              {assignments.map((a) => (
                                <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="font-medium text-stone-900">{a.user?.username ?? 'Teammate'}</span>
                                  <span
                                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                                      a.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : a.status === 'in_progress'
                                          ? 'bg-primary-100 text-primary-800'
                                          : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {STATUS_LABELS[a.status]}
                                  </span>
                                  {(a.progress_percent ?? 0) > 0 && a.status !== 'completed' && (
                                    <span className="text-xs text-stone-500 tabular-nums">{a.progress_percent}%</span>
                                  )}
                                  {a.progress_notes && (
                                    <span className="text-stone-500 line-clamp-1 max-w-[12rem]" title={a.progress_notes}>
                                      {a.progress_notes}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openEditProgress(a)}
                                    className="text-primary-600 hover:text-primary-700 focus:outline text-xs"
                                    title="Edit progress"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(a.id)}
                                    className="text-red-600 hover:text-red-700 focus:outline text-xs"
                                    title="Remove assignment"
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      {/* Assign book modal */}
      {assignBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="assign-book-title">
          <Card asModal className="max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg">
            <h2 id="assign-book-title" className="text-lg font-semibold text-stone-900 mb-4">Assign book</h2>
            <form onSubmit={handleAssignBook}>
              <div className="mb-4">
                <span className="block text-sm font-medium text-stone-700 mb-2">Books</span>
                <div className="border border-stone-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2" role="group" aria-label="Books">
                  {teamBooks.map((book) => (
                    <label key={book.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignBookBookIds.includes(book.id)}
                        onChange={() => toggleAssignBook(book.id)}
                        className="rounded border-stone-300 text-primary-600 focus:ring-primary"
                      />
                      <span className="text-stone-900 text-sm">
                        {book.title}{book.author ? ` \u2014 ${book.author}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <span className="block text-sm font-medium text-stone-700 mb-2">Teammates</span>
                <div className="border border-stone-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2" role="group" aria-label="Teammates">
                  {teammates.map((t) => {
                    const alreadyHasAll =
                      assignBookBookIds.length > 0 &&
                      assignBookBookIds.every((bookId) =>
                        teamAssignments.some((a) => a.book_id === bookId && a.user_id === t.id)
                      );
                    return (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignBookUserIds.includes(t.id)}
                          onChange={() => toggleAssignTeammate(t.id)}
                          disabled={alreadyHasAll}
                          className="rounded border-stone-300 text-primary-600 focus:ring-primary"
                        />
                        <span className={alreadyHasAll ? 'text-stone-400' : 'text-stone-900'}>{t.username}</span>
                        {alreadyHasAll && <span className="text-xs text-stone-500">(already has all selected)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
              {assignBookError && <p className="text-sm text-red-600 mb-3">{assignBookError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setAssignBookOpen(false); setAssignBookError(null); setAssignBookBookIds([]); setAssignBookUserIds([]); }}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignBookSubmitting || assignBookBookIds.length === 0 || assignBookUserIds.length === 0}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {assignBookSubmitting ? 'Assigning\u2026' : 'Assign'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* Edit progress modal */}
      {editProgressAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-progress-title">
          <Card asModal className="max-w-md w-full p-6 shadow-lg">
            <h2 id="edit-progress-title" className="text-lg font-semibold text-stone-900 mb-4">
              Update progress{editProgressAssignment.book ? `: ${editProgressAssignment.book.title}` : ''}
              {editProgressAssignment.user ? ` \u2014 ${editProgressAssignment.user.username}` : ''}
            </h2>
            <form onSubmit={handleSaveProgress}>
              <div className="mb-4">
                <label htmlFor="edit-progress-status" className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                <select
                  id="edit-progress-status"
                  value={editProgressStatus}
                  onChange={(e) => setEditProgressStatus(e.target.value as BookAssignment['status'])}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
                >
                  <option value="assigned">{STATUS_LABELS.assigned}</option>
                  <option value="in_progress">{STATUS_LABELS.in_progress}</option>
                  <option value="completed">{STATUS_LABELS.completed}</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-progress-percent" className="block text-sm font-medium text-stone-700 mb-1">
                  Progress: {editProgressPercent}%
                </label>
                <input
                  id="edit-progress-percent"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={editProgressPercent}
                  onChange={(e) => setEditProgressPercent(Number(e.target.value))}
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
                  value={editProgressNotes}
                  onChange={(e) => setEditProgressNotes(e.target.value)}
                  placeholder="e.g. Chapter 5, halfway through…"
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
                />
              </div>
              {editProgressError && <p className="text-sm text-red-600 mb-3">{editProgressError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditProgressAssignment(null); setEditProgressError(null); }}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProgressSubmitting}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {editProgressSubmitting ? 'Saving\u2026' : 'Save'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
