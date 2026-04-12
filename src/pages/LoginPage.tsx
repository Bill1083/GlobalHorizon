import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    
    try {
      await login(email, password);
    } catch (err) {
        console.log(err);
      setLocalError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-[#0e1219] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 sm:px-10">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Global Horizon</p>
            <h1 className="mt-4 text-4xl font-semibold">Sign in</h1>
            <p className="mt-3 text-sm text-slate-400">Enter your credentials to continue.</p>
          </div>

          {displayError && (
            <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {displayError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Email
              <input
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                placeholder=""
              />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <input
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-wait disabled:opacity-50 hover:bg-cyan-400"
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              New to Global Horizon?{' '}
              <Link to="/register" className="text-cyan-300 hover:text-cyan-100">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
