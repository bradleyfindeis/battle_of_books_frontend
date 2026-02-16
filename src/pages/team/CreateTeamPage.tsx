import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';

const inputClass =
  'w-full px-3 py-2.5 border border-stone-300 rounded-lg bg-white text-stone-900 shadow-sm transition duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary outline-none';

export function CreateTeamPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createTeam, user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'team_lead') {
    return <div className="p-8 text-center text-stone-500">Only team leads can create a new team.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim() || !teamName.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await createTeam(inviteCode.trim(), teamName.trim());
      navigate('/team/choose-list', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card padding="p-8" className="w-full max-w-md animate-scale-in">
        <button
          type="button"
          onClick={() => navigate('/team/dashboard')}
          className="inline-flex items-center text-sm text-stone-500 hover:text-stone-700 mb-4 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg outline-none transition duration-200"
        >
          &larr; Back to dashboard
        </button>
        <h1 className="text-2xl font-bold text-center mb-2 tracking-tight text-stone-900">Create a new team</h1>
        <p className="text-stone-600 text-center mb-6">
          You&apos;ll use your existing account ({user.email}) to lead this new team.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm animate-shake">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Invite code *</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className={`${inputClass} font-mono`}
              required
              placeholder="Enter your invite code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Team name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className={inputClass}
              required
              placeholder="Choose a name for your new team"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 outline-none font-medium"
          >
            {loading ? 'Creating team...' : 'Create team'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-stone-400">
          After creating your team, you&apos;ll choose a book list and add teammates.
        </p>
      </Card>
    </div>
  );
}
