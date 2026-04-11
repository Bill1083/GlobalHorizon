import { X } from 'lucide-react';

export default function CommentsPanel({ onClose }: { onClose: () => void }) {
  const mockComments = [
    { id: 1, text: 'comment about the location' },
    { id: 2, text: 'comment about the location' },
    { id: 3, text: 'comment about the location' }
  ];

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-start bg-black/50">
      <div className="relative h-full w-72 rounded-r-3xl border-r border-white/10 bg-slate-700/90 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold text-white">Comments</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Comments list */}
        <div className="space-y-4 overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {mockComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-500" />
              <p className="text-sm text-slate-200">{comment.text}</p>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-700/80 px-6 py-4">
          <input
            type="text"
            placeholder="Add a comment..."
            className="w-full rounded-2xl bg-slate-600/60 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:bg-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
