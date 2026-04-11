import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your travel persona</h1>
          </div>
          <div className="rounded-3xl bg-white/5 px-5 py-3 text-sm text-slate-200">
            {user?.isAdmin ? 'Admin access granted' : 'Standard creator access'}
          </div>
        </div>
        <div className="mt-8 grid gap-6 rounded-[1.75rem] border border-white/10 bg-slate-900 p-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Email</p>
            <p className="mt-4 text-lg text-white">{user?.email}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Role</p>
            <p className="mt-4 text-lg text-white">{user?.isAdmin ? 'Administrator' : 'Traveler'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
