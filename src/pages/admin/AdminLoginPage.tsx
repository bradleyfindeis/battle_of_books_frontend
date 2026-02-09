import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { Card } from '../../components/Card';

const inputClass =
  'w-full px-3 py-2.5 border border-stone-300 rounded-lg bg-white text-stone-900 shadow-sm transition duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary outline-none';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid email or password');
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
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-stone-900">Admin Login</h1>
        <p className="text-stone-600 text-center mb-6">Battle of the Books</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 outline-none font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </Card>
    </div>
  );
}
