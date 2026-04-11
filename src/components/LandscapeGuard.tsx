import { ReactNode, useEffect, useState } from 'react';

export default function LandscapeGuard({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth >= window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="min-h-screen bg-[#3c3c3c] text-white">
      {children}
      {!isLandscape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 text-center">
          <div className="max-w-md rounded-3xl border border-white/10 bg-slate-950/95 px-8 py-10 shadow-glow">
            <p className="text-2xl font-semibold tracking-wide text-white">Rotate to Landscape</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Global Horizon is optimized for horizontal viewing. Please rotate your device to continue in the cinematic feed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
