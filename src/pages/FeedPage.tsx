import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockFeed } from '../data/mockFeed';
import { FullscreenFeed } from '../components/FullscreenFeed';

export default function FeedPage() {
  const navigate = useNavigate();
  const uploadBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FullscreenFeed feed={mockFeed} />
      <button
        ref={uploadBtnRef}
        data-upload-btn
        onClick={() => navigate('/app/upload')}
        className="hidden"
      >
        Upload
      </button>
    </div>
  );
}
