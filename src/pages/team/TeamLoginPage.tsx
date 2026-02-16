import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import { Card } from '../../components/Card';

interface TeamOption {
  id: number;
  name: string;
}

const inputClass =
  'w-full px-3 py-2.5 border border-stone-300 rounded-lg bg-white text-stone-900 shadow-sm transition duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary outline-none';

export function TeamLoginPage() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamId, setTeamId] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getTeams().then((data: TeamOption[]) => setTeams(data)).catch(() => setTeams([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tid = parseInt(teamId, 10);
      if (Number.isNaN(tid) || !teamId) {
        setError('Please select your team');
        setLoading(false);
        return;
      }
      await login(username.trim(), tid, pinCode.trim());
      navigate('/team', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid team, username, or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-200 px-4">
      <Card padding="p-8" className="w-full max-w-md animate-scale-in">
        <Link to="/" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-700 mb-4 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg outline-none transition duration-200">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-stone-900">Team login</h1>
        <p className="text-stone-600 text-center mb-6">Battle of the Books</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm animate-shake">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Team *</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select your team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password or PIN *</label>
            <input
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 outline-none font-medium"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          New team? <Link to="/team/register" className="text-primary-600 hover:text-primary-700 font-medium transition duration-200">Register</Link>
        </p>
      </Card>
    </div>
  );
}
