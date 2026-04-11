import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { mediaAPI } from '../utils/apiClient';

interface UploadSignature {
  cloud_name: string;
  api_key: string;
  public_id: string;
  timestamp: number;
  signature: string;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'select' | 'details'>('select');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select a valid image or video file');
        return;
      }
      setSelectedFile(file);
      setStage('details');
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Get upload signature from backend
      const signature: UploadSignature = await mediaAPI.getUploadSignature();

      // 2. Build FormData for Cloudinary direct upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('cloud_name', signature.cloud_name);
      formData.append('api_key', signature.api_key);
      formData.append('public_id', signature.public_id);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('signature', signature.signature);

      // 3. Upload directly to Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const mediaUrl = cloudinaryData.secure_url;

      // 4. Create post record in backend
      await mediaAPI.createPost({
        media_url: mediaUrl,
        caption: caption || null,
        location: location || null,
        media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
      });

      // 5. Success - navigate back to feed
      setIsLoading(false);
      navigate('/app', { replace: true });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  if (stage === 'details') {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 to-black text-white">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Details</p>
            <h1 className="mt-4 text-4xl font-semibold">Share your story</h1>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {/* Media Preview */}
            {selectedFile && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">File: {selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Caption Input */}
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-cyan-300">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind?"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                rows={3}
                maxLength={500}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-slate-500">{caption.length}/500</p>
            </div>

            {/* Location Input */}
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was this taken?"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStage('select');
                  setSelectedFile(null);
                  setCaption('');
                  setLocation('');
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>

            {isLoading && (
              <div className="flex justify-center pt-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-500" />
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Upload</p>
          <h1 className="mt-4 text-4xl font-semibold">Share a moment</h1>
          <p className="mt-3 text-sm text-slate-400">
            Pick or capture a photo/video (16:9 or 21:9)
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Camera Option */}
          <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-white/10 bg-slate-900/50 p-6 transition hover:border-cyan-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
              <Camera className="h-7 w-7 text-cyan-300" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Take a Photo</p>
              <p className="text-sm text-slate-400">Capture with your camera</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileChange}
            />
          </label>

          {/* Gallery Option */}
          <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-white/10 bg-slate-900/50 p-6 transition hover:border-cyan-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20">
              <ImageIcon className="h-7 w-7 text-purple-300" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Choose from Gallery</p>
              <p className="text-sm text-slate-400">Select from your device</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {error && (
          <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-3 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={() => navigate('/app')}
          className="mt-12 rounded-3xl border border-white/10 bg-white/5 px-6 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
