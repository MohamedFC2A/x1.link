import React, { useState } from 'react';
import { Download, Check, Loader2, Music, Video, Sparkles } from 'lucide-react';
import { fetchDownloadDetect, getDownloadStreamUrl } from '@/services/api';
import { DownloadDetectIcon } from '@/lib/featuresRegistry';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  url: string;
  quality?: string;
  title?: string;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  url,
  quality = '1080p',
  title = '',
  className,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAudio = quality.toLowerCase().includes('mp3') || quality.toLowerCase().includes('audio') || quality.toLowerCase().includes('صوت');

  const handleDownload = async () => {
    if (!url || isDownloading) return;
    let cleanTargetUrl = url.trim();
    if (!cleanTargetUrl.startsWith('http') && /^[a-zA-Z0-9_-]{11}$/.test(cleanTargetUrl)) {
      cleanTargetUrl = `https://www.youtube.com/watch?v=${cleanTargetUrl}`;
    }
    setIsDownloading(true);
    setDownloadProgress(20);
    setError(null);

    try {
      const data = await fetchDownloadDetect(cleanTargetUrl);
      setDownloadProgress(50);

      if (!data || !data.success) {
        setError('تعذر استخراج الرابط المباشر');
        setIsDownloading(false);
        return;
      }

      let targetFormat = null;
      const qLower = quality.toLowerCase();

      if (isAudio) {
        targetFormat = data.formats.find(f => f.type === 'audio') || data.formats[0];
      } else if (qLower.includes('4k') || qLower.includes('2160')) {
        targetFormat = data.formats.find(f => f.qualityLabel.includes('2160') || f.qualityLabel.includes('4K')) || data.formats[0];
      } else if (qLower.includes('1080')) {
        targetFormat = data.formats.find(f => f.qualityLabel.includes('1080')) || data.formats[0];
      } else if (qLower.includes('720')) {
        targetFormat = data.formats.find(f => f.qualityLabel.includes('720')) || data.formats[0];
      } else if (qLower.includes('480')) {
        targetFormat = data.formats.find(f => f.qualityLabel.includes('480')) || data.formats[0];
      } else {
        targetFormat = data.defaultFormat || data.formats[0];
      }

      const downloadSrc = targetFormat?.downloadUrl || data.defaultDownloadUrl;
      if (!downloadSrc) {
        setError('رابط الوسائط غير متاح');
        setIsDownloading(false);
        return;
      }

      setDownloadProgress(80);

      const safeTitle = (title || data.title || 'media_download')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .slice(0, 40);
      const ext = targetFormat?.extension || (isAudio ? 'mp3' : 'mp4');
      const filename = `${safeTitle}.${ext}`;

      const streamUrl = getDownloadStreamUrl(downloadSrc, filename, isAudio ? 'audio/mpeg' : 'video/mp4');

      setDownloadProgress(100);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = streamUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setIsDownloading(false);
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 3500);
      }, 500);
    } catch {
      setError('حدث خطأ أثناء التنزيل');
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2 my-1.5 align-middle select-none", className)} dir="rtl">
      <button
        type="button"
        disabled={isDownloading}
        onClick={handleDownload}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-sans font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md border backdrop-blur-xl group/btn",
          isDownloaded
            ? "bg-emerald-400 text-black border-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.5)] font-black"
            : "bg-gradient-to-r from-emerald-600/90 via-emerald-500/90 to-teal-500/90 hover:from-emerald-500 hover:to-teal-400 text-black border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]"
        )}
      >
        {isDownloading ? (
          <>
            <Loader2 className="size-3.5 animate-spin text-black" />
            <span className="font-mono text-xs">جاري التنزيل ({downloadProgress}%)...</span>
          </>
        ) : isDownloaded ? (
          <>
            <Check className="size-4 text-black stroke-[3]" />
            <span>تم بدء التنزيل بنجاح</span>
          </>
        ) : (
          <>
            {isAudio ? (
              <Music className="size-3.5 text-black shrink-0" />
            ) : (
              <Download className="size-3.5 text-black shrink-0 group-hover/btn:translate-y-0.5 transition-transform" />
            )}
            <span>
              تحميل {isAudio ? 'الصوت (MP3)' : `الفيديو (${quality})`}
            </span>
          </>
        )}
      </button>

      {error && (
        <span className="text-[11px] text-red-400 font-sans">{error}</span>
      )}
    </div>
  );
};
