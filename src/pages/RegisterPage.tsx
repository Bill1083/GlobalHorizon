import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-[#0e1219] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 sm:px-10">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Global Horizon</p>
            <h1 className="mt-4 text-4xl font-semibold">Create account</h1>
            <p className="mt-3 text-sm text-slate-400">Start sharing cinematic landscape stories.</p>
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
                minLength={6}
                disabled={loading}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Confirm Password
              <input
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-wait disabled:opacity-50 hover:bg-cyan-400"
            >
              {loading ? 'Creating account...' : 'Start exploring'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              Already registered?{' '}
              <Link to="/login" className="text-cyan-300 hover:text-cyan-100">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
