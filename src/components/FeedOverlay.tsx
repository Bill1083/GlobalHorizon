import { MapPin, Heart, Eye, MessageCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import CommentsPanel from './CommentsPanel';

export function FeedOverlay() {
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      {/* Right-side overlay controls */}
      <div className="pointer-events-none fixed right-0 top-0 z-30 flex h-full w-20 flex-col items-center justify-between bg-gradient-to-l from-black/40 to-transparent px-2 py-8">
        {/* Top controls */}
        <div className="pointer-events-auto flex flex-col items-center gap-8">
          <button className="rounded-full border border-white/30 p-3 transition hover:border-white/60 hover:bg-white/10">
            <MapPin className="h-5 w-5 text-white" />
            <span className="mt-1 block text-xs text-white">map</span>
          </button>
          <button className="rounded-full border border-white/30 p-3 transition hover:border-white/60 hover:bg-white/10">
            <Heart className="h-5 w-5 text-white" />
            <span className="mt-1 block text-xs text-white">like</span>
          </button>
        </div>

        {/* Middle swipe indicator */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 text-white">
          <ChevronRight className="h-6 w-6" />
          <span className="text-[11px] font-medium">swipe</span>
        </div>

        {/* Bottom controls */}
        <div className="pointer-events-auto flex flex-col items-center gap-8">
          <button className="rounded-full border border-white/30 p-3 transition hover:border-white/60 hover:bg-white/10">
            <Eye className="h-5 w-5 text-white" />
            <span className="mt-1 block text-xs text-white">hide</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="rounded-full border border-white/30 p-3 transition hover:border-white/60 hover:bg-white/10"
          >
            <MessageCircle className="h-5 w-5 text-white" />
            <span className="mt-1 block text-xs text-white">comments</span>
          </button>
        </div>
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
