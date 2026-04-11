import { useState, useEffect } from 'react';
import { Eye, Plus } from 'lucide-react';
import { feedAPI } from '../utils/apiClient';

type FeedPost = {
  id: string;
  media_url: string;
  caption?: string;
  location?: string;
  creator_email: string;
  created_at: string;
  likes?: number;
};

export function FullscreenFeed({ onUploadClick }: { onUploadClick: () => void }) {
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch feed on mount
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        const response = await feedAPI.getPopular();
        setFeed(response.posts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full border-4 border-slate-600 border-t-cyan-500 h-12 w-12" />
      </div>
    );
  }

  if (error || feed.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
        <p className="text-slate-400">{error || 'No posts available'}</p>
      </div>
    );
  }

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

  const creatorName = currentItem.creator_email?.split('@')[0] || 'Unknown';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Image Container */}
      <div
        className="absolute inset-0 h-full w-full cursor-pointer"
        onClick={handleScreenTap}
      >
        <img
          src={currentItem.media_url}
          alt="Feed post"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* Creator Name - Bottom Left */}
      {showOverlay && (
        <div className="absolute bottom-6 right-20 z-10">
          <button
            onClick={() => setSelectedPost(currentItem)}
            className="text-white text-sm font-medium"
          >
            {creatorName}
          </button>
        </div>
      )}

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
                <p className="mt-2 text-lg font-semibold text-white">{creatorName}</p>
              </div>
              {selectedPost.location && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Location</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedPost.location}</p>
                </div>
              )}
              {selectedPost.caption && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Caption</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedPost.caption}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Posted</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </p>
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
              onClick={onUploadClick}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/20 backdrop-blur-md transition hover:bg-slate-200/30"
              title="Upload"
            >
              <Plus className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Bottom - Hide Button & Navigation */}
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                onClick={() => handleSwipe('prev')}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/20 backdrop-blur-md transition hover:bg-slate-200/30"
                title="Previous post"
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
                title="Next post"
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
