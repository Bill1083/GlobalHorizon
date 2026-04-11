import { FeedItem } from '../data/mockFeed';

export function CinematicFeed({ feed }: { feed: FeedItem[] }) {
  return (
    <section className="relative flex h-screen w-screen overflow-x-auto snap-x snap-mandatory scrollbar-hide bg-black">
      {feed.map((item) => (
        <article
          key={item.id}
          className="relative min-w-full snap-start"
        >
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-24 text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">{item.location}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{item.title}</h2>
            <p className="mt-5 text-sm text-slate-200">
              Captured by {item.creator} · {item.likes.toLocaleString()} likes
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
