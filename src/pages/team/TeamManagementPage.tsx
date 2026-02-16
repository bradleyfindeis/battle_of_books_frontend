import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import type { User } from '../../api/client';

export function TeamManagementPage() {
  const { user, team, logout, isDemoMode, exitDemo, refreshMe, managedTeams } = useAuth();
  const navigate = useNavigate();

  // Team settings
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(team?.leaderboard_enabled ?? true);
  const [settingSaving, setSettingSaving] = useState(false);

  useEffect(() => {
    setLeaderboardEnabled(team?.leaderboard_enabled ?? true);
  }, [team?.leaderboard_enabled]);

  const handleToggleLeaderboard = async () => {
    setSettingSaving(true);
    try {
      await api.updateMyTeamSettings({ leaderboard_enabled: !leaderboardEnabled });
      setLeaderboardEnabled(!leaderboardEnabled);
      await refreshMe();
    } catch {
      // revert on failure
    } finally {
      setSettingSaving(false);
    }
  };

  // Teammates
  const [teammates, setTeammates] = useState<User[]>([]);
  const [addTeammateOpen, setAddTeammateOpen] = useState(false);
  const [addTeammateUsername, setAddTeammateUsername] = useState('');
  const [addTeammateUseCustomPin, setAddTeammateUseCustomPin] = useState(false);
  const [addTeammateCustomPin, setAddTeammateCustomPin] = useState('');
  const [addTeammateSubmitting, setAddTeammateSubmitting] = useState(false);
  const [newTeammatePin, setNewTeammatePin] = useState<string | null>(null);
  const [addTeammateError, setAddTeammateError] = useState<string | null>(null);

  // Teammate PINs persisted in sessionStorage
  const TEAMMATE_PINS_KEY = (tid: number) => `team_${tid}_teammate_pins`;
  const [teammatePins, setTeammatePinsState] = useState<Record<number, string>>({});
  const setTeammatePins = (updater: (prev: Record<number, string>) => Record<number, string>) => {
    setTeammatePinsState((prev) => {
      const next = updater(prev);
      if (team?.id && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(TEAMMATE_PINS_KEY(team.id), JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };
  useEffect(() => {
    if (!team?.id || typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(TEAMMATE_PINS_KEY(team.id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      const byId: Record<number, string> = {};
      Object.entries(parsed).forEach(([k, v]) => { byId[Number(k)] = v; });
      setTeammatePinsState(byId);
    } catch {}
  }, [team?.id]);

  // Edit teammate modal
  const [editTeammate, setEditTeammate] = useState<User | null>(null);
  const [editTeammateUsername, setEditTeammateUsername] = useState('');
  const [editTeammateSubmitting, setEditTeammateSubmitting] = useState(false);
  const [editTeammateError, setEditTeammateError] = useState<string | null>(null);
  const [editTeammatePinFromReset, setEditTeammatePinFromReset] = useState<string | null>(null);
  const [resetPinSubmitting, setResetPinSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Fetch teammates
  useEffect(() => {
    if (user?.role !== 'team_lead') return;
    let cancelled = false;
    api
      .getTeammates()
      .then((data) => { if (!cancelled) setTeammates(data); })
      .catch(() => { if (!cancelled) setTeammates([]); });
    return () => { cancelled = true; };
  }, [user?.role, newTeammatePin]);

  const handleLogout = () => {
    logout();
    navigate('/team/login', { replace: true });
  };

  const handleExitDemo = () => {
    exitDemo();
    navigate('/admin', { replace: true });
  };

  const handleAddTeammate = (e: React.FormEvent) => {
    e.preventDefault();
    const username = addTeammateUsername.trim();
    if (!username) return;
    const customPin = addTeammateUseCustomPin ? addTeammateCustomPin.replace(/\D/g, '').slice(0, 4) : '';
    if (addTeammateUseCustomPin && customPin.length !== 4) {
      setAddTeammateError('Custom PIN must be exactly 4 digits');
      return;
    }
    setAddTeammateSubmitting(true);
    setAddTeammateError(null);
    setNewTeammatePin(null);
    const pinToSend = addTeammateUseCustomPin && customPin.length === 4 ? customPin : undefined;
    api
      .createTeammate(username, pinToSend)
      .then((data: { user?: User; pin?: string; errors?: string[] }) => {
        if (data.errors?.length) {
          setAddTeammateError(data.errors.join(', '));
          return;
        }
        setNewTeammatePin(data.pin ?? null);
        if (data.user && data.pin) setTeammatePins((prev) => ({ ...prev, [data.user!.id]: data.pin! }));
        setTeammates((prev) => (data.user ? [...prev, data.user] : prev));
        setAddTeammateUsername('');
        setAddTeammateCustomPin('');
      })
      .catch(() => setAddTeammateError('Failed to add teammate'))
      .finally(() => setAddTeammateSubmitting(false));
  };

  const closeAddTeammateModal = () => {
    setAddTeammateOpen(false);
    setAddTeammateUsername('');
    setAddTeammateUseCustomPin(false);
    setAddTeammateCustomPin('');
    setNewTeammatePin(null);
    setAddTeammateError(null);
  };

  const handleDeleteTeammate = (teammateId: number) => {
    if (!window.confirm('Remove this teammate? They will no longer be able to log in.')) return;
    api.deleteTeammate(teammateId).then(() => {
      setTeammates((prev) => prev.filter((t) => t.id !== teammateId));
      setTeammatePins((prev) => {
        const next = { ...prev };
        delete next[teammateId];
        return next;
      });
      if (editTeammate?.id === teammateId) setEditTeammate(null);
    }).catch(() => {});
  };

  const openEditTeammate = (t: User) => {
    setEditTeammate(t);
    setEditTeammateUsername(t.username);
    setEditTeammateError(null);
    setEditTeammatePinFromReset(null);
  };

  const handleSaveEditTeammate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeammate) return;
    const username = editTeammateUsername.trim();
    if (!username) return;
    setEditTeammateSubmitting(true);
    setEditTeammateError(null);
    api
      .updateTeammate(editTeammate.id, username)
      .then((updated) => {
        setTeammates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditTeammate(null);
        setEditTeammatePinFromReset(null);
        setEditTeammateError(null);
        setToastMessage('Saved successfully');
      })
      .catch(() => setEditTeammateError('Failed to update name'))
      .finally(() => setEditTeammateSubmitting(false));
  };

  const handleResetTeammatePin = () => {
    if (!editTeammate) return;
    setResetPinSubmitting(true);
    setEditTeammateError(null);
    api
      .resetTeammatePin(editTeammate.id)
      .then((data) => {
        setEditTeammatePinFromReset(data.pin);
        setTeammatePins((prev) => ({ ...prev, [editTeammate.id]: data.pin }));
      })
      .catch(() => setEditTeammateError('Failed to reset PIN'))
      .finally(() => setResetPinSubmitting(false));
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
            <h3 className="text-lg font-semibold text-stone-900">Team management</h3>
            <button
              type="button"
              onClick={() => setAddTeammateOpen(true)}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Add teammate
            </button>
          </div>
          {teammates.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2" aria-hidden>👥</p>
              <p className="font-medium text-stone-900">No teammates yet</p>
              <p className="mt-1 text-sm text-stone-500">Add your first teammate to start assigning books and tracking their progress.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {teammates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-stone-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-stone-900">{t.username}</span>
                    <span className="ml-2 text-sm text-stone-500 font-mono">
                      PIN: {teammatePins[t.id] ?? '——'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTeammate(t)}
                      className="text-sm text-primary-600 hover:text-primary-700 focus:outline"
                      title="Edit name and PIN"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeammate(t.id)}
                      className="text-sm text-red-600 hover:text-red-700 focus:outline"
                      title="Remove teammate"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Team settings */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Team settings</h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-stone-900">Team Leaderboard</p>
              <p className="text-sm text-stone-500">
                {leaderboardEnabled
                  ? 'Teammates can see rankings for quizzes, matches, and reading.'
                  : 'Leaderboard is hidden from teammates.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleLeaderboard}
              disabled={settingSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                leaderboardEnabled ? 'bg-primary-600' : 'bg-stone-300'
              }`}
              role="switch"
              aria-checked={leaderboardEnabled}
              aria-label="Toggle leaderboard"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  leaderboardEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {user.role === 'team_lead' && managedTeams.length < 2 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Create another team</h3>
                <p className="text-sm text-stone-500 mt-1">You can lead up to 2 teams. Create a second team and go through the full setup flow.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/team/create-team')}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0"
              >
                Create new team
              </button>
            </div>
          </Card>
        )}
      </div>
      {/* Add teammate modal */}
      {(addTeammateOpen || newTeammatePin) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-teammate-title">
          <Card asModal className="max-w-md w-full p-6 shadow-lg">
            <h2 id="add-teammate-title" className="text-lg font-semibold text-stone-900 mb-4">
              {newTeammatePin ? 'Teammate added' : 'Add teammate'}
            </h2>
            {newTeammatePin ? (
              <>
                <p className="text-stone-600 mb-2">Share this PIN with your teammate so they can log in:</p>
                <p className="text-2xl font-mono font-bold text-primary-700 bg-primary-50 rounded-lg p-4 text-center mb-4">{newTeammatePin}</p>
                <p className="text-sm text-stone-500 mb-4">They will use team &quot;{team?.name}&quot;, username, and this PIN to sign in.</p>
                <button
                  type="button"
                  onClick={() => { setNewTeammatePin(null); closeAddTeammateModal(); setAddTeammateOpen(false); }}
                  className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Done
                </button>
              </>
            ) : (
              <form onSubmit={handleAddTeammate}>
                <label htmlFor="add-teammate-username" className="block text-sm font-medium text-stone-700 mb-1">Username</label>
                <input
                  id="add-teammate-username"
                  type="text"
                  value={addTeammateUsername}
                  onChange={(e) => setAddTeammateUsername(e.target.value)}
                  placeholder="e.g. alice"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary mb-4"
                  autoFocus
                  required
                />
                <div className="mb-4">
                  <span className="block text-sm font-medium text-stone-700 mb-2">PIN</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="add-teammate-pin-mode"
                        checked={!addTeammateUseCustomPin}
                        onChange={() => setAddTeammateUseCustomPin(false)}
                        className="rounded border-stone-300 text-primary-600 focus:ring-primary"
                      />
                      <span className="text-stone-900">Generate PIN</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="add-teammate-pin-mode"
                        checked={addTeammateUseCustomPin}
                        onChange={() => setAddTeammateUseCustomPin(true)}
                        className="rounded border-stone-300 text-primary-600 focus:ring-primary"
                      />
                      <span className="text-stone-900">Set custom PIN</span>
                    </label>
                  </div>
                  {addTeammateUseCustomPin && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={addTeammateCustomPin}
                      onChange={(e) => setAddTeammateCustomPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4 digits"
                      className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary font-mono"
                      maxLength={4}
                    />
                  )}
                </div>
                {addTeammateError && <p className="text-sm text-red-600 mb-3">{addTeammateError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeAddTeammateModal}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addTeammateSubmitting}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    {addTeammateSubmitting ? 'Adding…' : 'Add teammate'}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
      {/* Edit teammate modal */}
      {editTeammate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-teammate-title">
          <Card asModal className="max-w-md w-full p-6 shadow-lg">
            <h2 id="edit-teammate-title" className="text-lg font-semibold text-stone-900 mb-4">Edit teammate</h2>
            <form onSubmit={handleSaveEditTeammate}>
              <div className="mb-4">
                <label htmlFor="edit-teammate-username" className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                <input
                  id="edit-teammate-username"
                  type="text"
                  value={editTeammateUsername}
                  onChange={(e) => setEditTeammateUsername(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <span className="block text-sm font-medium text-stone-700 mb-1">PIN</span>
                {editTeammatePinFromReset ? (
                  <p className="text-xl font-mono font-bold text-primary-700 bg-primary-50 rounded-lg p-3 text-center">
                    New PIN: {editTeammatePinFromReset}
                  </p>
                ) : teammatePins[editTeammate.id] ? (
                  <p className="text-stone-600 font-mono">Current PIN: {teammatePins[editTeammate.id]}</p>
                ) : (
                  <p className="text-sm text-stone-500">PIN not stored here. Reset to generate a new PIN and share it.</p>
                )}
                <button
                  type="button"
                  onClick={handleResetTeammatePin}
                  disabled={resetPinSubmitting}
                  className="mt-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {resetPinSubmitting ? 'Resetting…' : 'Reset PIN (generate new)'}
                </button>
              </div>
              {editTeammateError && <p className="text-sm text-red-600 mb-3">{editTeammateError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditTeammate(null); setEditTeammatePinFromReset(null); setEditTeammateError(null); }}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={editTeammateSubmitting}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {editTeammateSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
