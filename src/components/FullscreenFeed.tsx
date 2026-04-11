import { useState } from 'react';
import { Heart, Eye, Plus } from 'lucide-react';
import { FeedItem } from '../data/mockFeed';

export function FullscreenFeed({ feed }: { feed: FeedItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);

  const currentItem = feed[currentIndex];

  const handleSwipe = (direction: 'next' | 'prev') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    if (direction === 'next' && currentIndex < feed.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleScreenTap = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Image Container */}
      <div
        className="absolute inset-0 h-full w-full cursor-pointer"
        onClick={handleScreenTap}
      >
        <img
          src={currentItem.image}
          alt={currentItem.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="mb-4 text-sm text-slate-400 hover:text-white"
            >
              ← Back
            </button>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Creator</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedPost.creator}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Title</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedPost.title}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Location</p>
                <p className="mt-2 text-sm text-slate-200">{selectedPost.location}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Engagement</p>
                <p className="mt-2 text-sm text-slate-200">{selectedPost.likes.toLocaleString()} likes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay UI */}
      {showOverlay && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6">
          {/* Top - Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                const uploadBtn = document.querySelector('[data-upload-btn]');
                if (uploadBtn) (uploadBtn as HTMLButtonElement).click();
              }}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/20 backdrop-blur-md transition hover:bg-slate-200/30"
              title="Upload"
            >
              <Plus className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Middle - Creator Info */}
          <div className="pointer-events-auto flex justify-center">
            <button
              onClick={() => setSelectedPost(currentItem)}
              className="rounded-full border border-white/20 bg-slate-950/40 px-5 py-2 backdrop-blur-md transition hover:border-white/40"
            >
              <span className="text-sm font-medium text-white">{currentItem.creator}</span>
            </button>
          </div>

          {/* Bottom - Navigation & Hide */}
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                onClick={() => handleSwipe('prev')}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/20 backdrop-blur-md transition hover:bg-slate-200/30"
                title="Previous"
              >
                <span className="text-lg text-white">‹</span>
              </button>
            )}
            {currentIndex === 0 && <div className="h-12 w-12" />}

            {/* Hide Button */}
            <button
              onClick={() => setShowOverlay(false)}
              className="pointer-events-auto flex flex-col items-center gap-1 transition hover:opacity-80"
              title="Hide overlay"
            >
              <Eye className="h-6 w-6 text-white" />
              <span className="text-xs text-white">hide</span>
            </button>

            {/* Next Button */}
            {currentIndex < feed.length - 1 && (
              <button
                onClick={() => handleSwipe('next')}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/20 backdrop-blur-md transition hover:bg-slate-200/30"
                title="Next"
              >
                <span className="text-lg text-white">›</span>
              </button>
            )}
            {currentIndex === feed.length - 1 && <div className="h-12 w-12" />}
          </div>
        </div>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-6 z-10 rounded-full bg-slate-950/50 px-3 py-1 text-xs text-slate-300 backdrop-blur-md">
        {currentIndex + 1} / {feed.length}
      </div>
    </div>
  );
}
