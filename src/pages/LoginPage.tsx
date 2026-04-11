import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-[#0e1219] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 sm:px-10">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Global Horizon</p>
            <h1 className="mt-4 text-4xl font-semibold">Sign in</h1>
            <p className="mt-3 text-sm text-slate-400">Portrait login for cinematic travel creators.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Email
              <input
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Continue
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
          <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-400">
            <p>Admin test account: <span className="text-white">admin@test.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
