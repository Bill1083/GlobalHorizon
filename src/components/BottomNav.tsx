import { Home, MapPin, Upload, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/app/search', label: 'Search', icon: MapPin },
  { to: '/app/upload', label: 'Upload', icon: Upload },
  { to: '/app/profile', label: 'Profile', icon: User }
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
