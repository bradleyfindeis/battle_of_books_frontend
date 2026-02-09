import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';

const MIN_PASSWORD_LENGTH = 6;

const inputClass =
  'w-full px-3 py-2.5 border border-stone-300 rounded-lg bg-white text-stone-900 shadow-sm transition duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary outline-none';

export function TeamRegisterPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await register(inviteCode.trim(), teamName.trim(), username.trim(), email.trim(), password);
      navigate('/team', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-200 px-4">
      <Card padding="p-8" className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-700 mb-4 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg outline-none transition duration-200">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-stone-900">Register your team</h1>
        <p className="text-stone-600 text-center mb-6">Battle of the Books</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Your username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-stone-500">At least {MIN_PASSWORD_LENGTH} characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Confirm password *</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={inputClass}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 outline-none font-medium"
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have a team? <Link to="/team/login" className="text-primary-600 hover:text-primary-700 font-medium transition duration-200">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
