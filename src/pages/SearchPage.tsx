export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Search</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Explore the cinematic map</h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          This placeholder search page simulates navigation through landscape stories and travel scenes.
        </p>
        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-slate-900 p-8 text-slate-300">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">Map preview</p>
          <div className="aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-cyan-600/10 via-transparent to-slate-950/10" />
        </div>
      </div>
    </div>
  );
}
