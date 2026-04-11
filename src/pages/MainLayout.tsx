import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import LandscapeGuard from '../components/LandscapeGuard';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isFeedPage = location.pathname === '/app';

  const content = (
    <div className="relative min-h-screen overflow-hidden bg-[#161b24] text-white">
      {!isFeedPage && (
        <header className="flex items-end justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Global Horizon</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-semibold tracking-tight">
                {user?.isAdmin ? 'Admin Feed' : 'Cinematic Feed'}
              </span>
              {user?.isAdmin && (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
                  Admin
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-400">Swipe horizontally through landscape stories.</p>
          </div>
          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Logout
          </button>
        </header>
      )}
      <main className={isFeedPage ? '' : 'pb-32'}>
        <Outlet />
      </main>
      {!isFeedPage && <BottomNav />}
    </div>
  );

  // Only apply landscape guard to feed page
  if (isFeedPage) {
    return <LandscapeGuard>{content}</LandscapeGuard>;
  }

  return content;
}
