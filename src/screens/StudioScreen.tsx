import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FileVideo2, Film, UploadCloud, X } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_DURATION_SECONDS = 5 * 60;

export function StudioScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setError('');
    setDuration(null);
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!['mp4', 'mov'].includes(extension ?? '')) {
      setFile(null);
      setError('Choose an MP4 or MOV video.');
    } else if (selected.size > MAX_BYTES) {
      setFile(null);
      setError('This video exceeds the 50 MB limit.');
    } else {
      setFile(selected);
    }
    event.target.value = '';
  };

  return (
    <div className="scroll-slim h-full overflow-y-auto px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#287CFF]/30 bg-[#287CFF]/10 text-[#38C9FF]">
            <Film size={21} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-[#F5F7FF]">VADO Studio</h1>
            <p className="text-xs text-[#AAB8D0]">Preview a video on this device. Publishing is not connected yet.</p>
          </div>
        </div>

        <section className="mt-7 grid gap-5">
          <div className="vado-glass-card flex min-h-[380px] flex-col items-center justify-center overflow-hidden border-dashed border-white/25 p-5 text-center">
            {previewUrl ? (
              <div className="w-full max-w-sm">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="mx-auto max-h-[58vh] w-full rounded-2xl bg-black object-contain"
                  onLoadedMetadata={(event) => {
                    const length = event.currentTarget.duration;
                    setDuration(length);
                    if (length > MAX_DURATION_SECONDS) setError('This video is longer than the 5-minute limit.');
                  }}
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-left">
                  <span className="min-w-0 truncate text-xs text-[#F5F7FF]">{file?.name}</span>
                  <button type="button" onClick={() => { setFile(null); setDuration(null); setError(''); }} aria-label="Remove video" className="shrink-0 rounded-full p-2 text-[#AAB8D0] hover:bg-white/10 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                {duration !== null && <p className="mt-1 text-left text-[11px] text-[#AAB8D0]">Duration: {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</p>}
              </div>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#38C9FF]/20 bg-[#287CFF]/10 text-[#38C9FF]">
                  <FileVideo2 size={26} />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-[#F5F7FF]">Start with a video</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#AAB8D0]">Select a video to preview locally. Your file stays in this browser session; it is not uploaded.</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#287CFF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1769e8]">
                  <UploadCloud size={17} /> Choose video
                </button>
              </>
            )}
            <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" onChange={chooseFile} className="sr-only" aria-label="Choose MP4 or MOV video" />
          </div>

          <aside className="vado-glass-card rounded-3xl p-5">
            <h2 className="text-sm font-semibold text-[#F5F7FF]">Upload requirements</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#AAB8D0]">
              <li className="flex justify-between gap-3"><span>Formats</span><span className="text-[#F5F7FF]">MP4, MOV</span></li>
              <li className="flex justify-between gap-3"><span>Maximum size</span><span className="text-[#F5F7FF]">50 MB</span></li>
              <li className="flex justify-between gap-3"><span>Maximum duration</span><span className="text-[#F5F7FF]">5 minutes</span></li>
            </ul>
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2.5 text-xs leading-5 text-red-200">{error}</p>}
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-[#AAB8D0]">
              Video publishing, drafts and editing tools will be available when VADO is connected to its media services. Nothing has been uploaded or published.
            </p>
          </aside>
        </section>
      </div>
    </div>
  );
}
