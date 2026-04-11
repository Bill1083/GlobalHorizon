import { useNavigate } from 'react-router-dom';
import { FullscreenFeed } from '../components/FullscreenFeed';

export default function FeedPage() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <FullscreenFeed onUploadClick={() => navigate('/app/upload')} />
    </div>
  );
}
