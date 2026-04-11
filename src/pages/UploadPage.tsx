import { FormEvent, ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setIsLoading(true);
    setToast('');
    setTimeout(() => {
      setIsLoading(false);
      setToast('Your landscape story is now live!');
      setTimeout(() => navigate('/app', { replace: true }), 1500);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Upload</p>
          <h1 className="mt-4 text-4xl font-semibold">Share a moment</h1>
          <p className="mt-3 text-sm text-slate-400">Pick or capture a landscape photo/video (16:9 or 21:9)</p>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </label>
        </div>

        {/* Status Messages */}
        {isLoading && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-500" />
            <p className="text-sm text-slate-300">Uploading your story...</p>
          </div>
        )}

        {toast && (
          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 px-6 py-3 text-center text-sm text-cyan-100">
            {toast}
          </div>
        )}

        {fileName && !isLoading && !toast && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Selected: {fileName}
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
