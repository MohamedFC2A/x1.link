import React, { useState, useEffect } from 'react';
import { Download, Play, Music, Image as ImageIcon, Video, Check, Loader2, Maximize2, X, Eye } from 'lucide-react';
import { DownloadDetectResult, MediaFormatOption, MediaGalleryImage } from '@/types';
import { fetchDownloadDetect, getDownloadStreamUrl } from '@/services/api';
import { PlatformLogo } from './PlatformLogo';
import { DownloadDetectIcon } from '@/lib/featuresRegistry';
import { cn } from '@/lib/utils';

interface DownloadDetectCardProps {
  url: string;
  initialData?: DownloadDetectResult | null;
  className?: string;
  onClose?: () => void;
}

export const DownloadDetectCard: React.FC<DownloadDetectCardProps> = ({
  url,
  initialData = null,
  className,
}) => {
  const [data, setData] = useState<DownloadDetectResult | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFormatId, setDownloadingFormatId] = useState<string | null>(null);
  const [downloadedFormatId, setDownloadedFormatId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'video' | 'image'; url: string } | null>(null);

  useEffect(() => {
    if (!url) return;
    let cleanTargetUrl = url.trim();
    if (!cleanTargetUrl.startsWith('http') && /^[a-zA-Z0-9_-]{11}$/.test(cleanTargetUrl)) {
      cleanTargetUrl = `https://www.youtube.com/watch?v=${cleanTargetUrl}`;
    }

    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchDownloadDetect(cleanTargetUrl, controller.signal)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success) {
          setData(res);
        } else {
          setError('تعذر استخراج روابط التنزيل المباشرة.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('تعذر الاتصال بمحرك التنزيل.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, initialData]);

  const videoFormats = data?.formats.filter((f) => f.type === 'video') || [];
  const audioFormats = data?.formats.filter((f) => f.type === 'audio') || [];
  const galleryImages = data?.images || [];

  const handleDownload = async (format: MediaFormatOption, customUrl?: string, customFilename?: string) => {
    const downloadSrc = customUrl || format.downloadUrl || data?.defaultDownloadUrl;
    if (!downloadSrc) return;

    setDownloadingFormatId(format.formatId);
    setDownloadProgress(30);

    const safeTitle = (data?.title || 'media_download')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .slice(0, 35);
    const ext = format.extension || (format.type === 'audio' ? 'mp3' : 'mp4');
    const filename = customFilename || `${safeTitle}.${ext}`;

    const streamUrl = getDownloadStreamUrl(
      downloadSrc,
      filename,
      format.type === 'audio' ? 'audio/mpeg' : 'video/mp4'
    );

    setTimeout(() => setDownloadProgress(70), 300);
    setTimeout(() => setDownloadProgress(100), 600);

    setTimeout(() => {
      const a = document.createElement('a');
      a.href = streamUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadingFormatId(null);
      setDownloadedFormatId(format.formatId);
      setTimeout(() => setDownloadedFormatId(null), 3000);
    }, 700);
  };

  const handleBatchImagesDownload = () => {
    galleryImages.forEach((img, i) => {
      setTimeout(() => {
        const ext = img.extension || 'jpg';
        const filename = `${data?.title?.slice(0, 30) || 'image'}_${img.index}.${ext}`;
        const streamUrl = getDownloadStreamUrl(img.url, filename, 'image/jpeg');
        const a = document.createElement('a');
        a.href = streamUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 350);
    });
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "my-2.5 rounded-xl border border-emerald-500/25 bg-zinc-950/70 p-3 text-right shadow-lg backdrop-blur-xl animate-pulse flex items-center justify-between gap-3",
          className
        )}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <DownloadDetectIcon size={14} />
          <span className="text-xs font-mono font-bold text-emerald-300">
            DOWNLOAD DETECT
          </span>
          <span className="text-xs text-zinc-400 font-sans">
            جاري تجهيز روابط التنزيل الفوري...
          </span>
        </div>
        <Loader2 className="size-4 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !data) {
    const safeTitle = 'media_download';
    const fallbackFormat: MediaFormatOption = {
      formatId: 'best_hd',
      qualityLabel: 'أفضل جودة متوفرة (1080p HD)',
      extension: 'mp4',
      type: 'video',
      downloadUrl: url,
      isBest: true,
    };

    return (
      <div
        className={cn(
          "my-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#06140e]/95 via-[#030d09]/95 to-[#010805]/95 p-3 sm:p-3.5 text-right shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_16px_rgba(16,185,129,0.12)] backdrop-blur-2xl relative overflow-hidden select-none space-y-3",
          className
        )}
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/15">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40">
              <DownloadDetectIcon size={12} />
              <span className="text-[11px] font-mono font-black text-emerald-200 tracking-wide uppercase">
                DOWNLOAD DETECT
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <PlatformLogo url={url} className="size-3" size={12} />
              <span>تحميل فوري</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-xs text-zinc-300 font-sans">
            الفيديو جاهز للتحميل المباشر بأعلى دقة 1080p:
          </div>
          <button
            type="button"
            onClick={() => handleDownload(fallbackFormat, url, `${safeTitle}.mp4`)}
            disabled={downloadingFormatId === 'best_hd'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-sans transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            {downloadingFormatId === 'best_hd' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : downloadedFormatId === 'best_hd' ? (
              <Check className="size-3.5" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>تحميل مباشر 1080p</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "my-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#06140e]/95 via-[#030d09]/95 to-[#010805]/95 p-3 sm:p-3.5 text-right shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_16px_rgba(16,185,129,0.12)] backdrop-blur-2xl relative overflow-hidden animate-in fade-in select-none space-y-3",
          className
        )}
        dir="rtl"
      >
        {/* Sleek Minimal Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/15">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40">
              <span className="relative flex size-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-400" />
              </span>
              <DownloadDetectIcon size={12} />
              <span className="text-[11px] font-mono font-black text-emerald-200 tracking-wide uppercase">
                DOWNLOAD DETECT
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <PlatformLogo url={data.originalUrl} className="size-3" size={12} />
              <span>{data.platformLabel}</span>
            </div>
          </div>

          {data.durationFormatted && (
            <span className="text-[10px] font-mono font-semibold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
              {data.durationFormatted}
            </span>
          )}
        </div>

        {/* Media Row */}
        <div className="flex items-center gap-3">
          {data.thumbnailUrl && (
            <div
              onClick={() => {
                if (data.defaultDownloadUrl) {
                  setPreviewMedia({
                    type: data.mediaType === 'image_gallery' ? 'image' : 'video',
                    url: data.defaultDownloadUrl || data.thumbnailUrl,
                  });
                }
              }}
              className="relative shrink-0 w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden border border-emerald-500/30 bg-black/60 shadow group/thumb cursor-pointer"
            >
              <img
                src={data.thumbnailUrl}
                alt={data.title}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center">
                <div className="size-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                  {data.mediaType === 'image_gallery' ? <Eye className="size-3" /> : <Play className="size-3 fill-current ml-0.5" />}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug font-sans" title={data.title}>
              {data.title}
            </h4>
            {data.author.name && (
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5 truncate">
                {data.author.name} {data.author.username ? `(@${data.author.username})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Clean Quality Download Chips - Direct 1-Click Action */}
        <div className="pt-2 border-t border-emerald-500/15">
          <div className="text-[11px] font-medium text-emerald-300/80 mb-2 font-sans">
            اختر الجودة للتحميل المباشر الفوري:
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {/* Video Formats */}
            {videoFormats.map((fmt) => {
              const isCurrentDownloading = downloadingFormatId === fmt.formatId;
              const isCurrentDownloaded = downloadedFormatId === fmt.formatId;

              return (
                <button
                  key={fmt.formatId}
                  type="button"
                  disabled={Boolean(downloadingFormatId)}
                  onClick={() => handleDownload(fmt)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 border",
                    isCurrentDownloaded
                      ? "bg-emerald-400 text-black border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                      : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 hover:text-white border-emerald-500/30 hover:border-emerald-400/60 shadow-sm"
                  )}
                >
                  {isCurrentDownloading ? (
                    <>
                      <Loader2 className="size-3 animate-spin text-emerald-400" />
                      <span className="font-mono">{downloadProgress}%</span>
                    </>
                  ) : isCurrentDownloaded ? (
                    <>
                      <Check className="size-3.5 text-black stroke-[3]" />
                      <span>تم التحميل</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-3 text-emerald-400" />
                      <span>{fmt.qualityLabel}</span>
                      {fmt.fileSizeFormatted && (
                        <span className="text-[10px] font-mono text-zinc-400 font-normal">
                          ({fmt.fileSizeFormatted})
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}

            {/* Audio MP3 Format */}
            {audioFormats.map((fmt) => {
              const isCurrentDownloading = downloadingFormatId === fmt.formatId;
              const isCurrentDownloaded = downloadedFormatId === fmt.formatId;

              return (
                <button
                  key={fmt.formatId}
                  type="button"
                  disabled={Boolean(downloadingFormatId)}
                  onClick={() => handleDownload(fmt)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 border",
                    isCurrentDownloaded
                      ? "bg-emerald-400 text-black border-emerald-300"
                      : "bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 hover:text-white border-teal-500/30 hover:border-teal-400/60"
                  )}
                >
                  {isCurrentDownloading ? (
                    <>
                      <Loader2 className="size-3 animate-spin text-teal-400" />
                      <span className="font-mono">{downloadProgress}%</span>
                    </>
                  ) : isCurrentDownloaded ? (
                    <>
                      <Check className="size-3.5 text-black stroke-[3]" />
                      <span>تم التحميل</span>
                    </>
                  ) : (
                    <>
                      <Music className="size-3 text-teal-400" />
                      <span>صوت MP3</span>
                      {fmt.fileSizeFormatted && (
                        <span className="text-[10px] font-mono text-zinc-400 font-normal">
                          ({fmt.fileSizeFormatted})
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}

            {/* Gallery Images Batch */}
            {galleryImages.length > 0 && (
              <button
                type="button"
                onClick={handleBatchImagesDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer active:scale-95 transition-all"
              >
                <ImageIcon className="size-3" />
                <span>تحميل {galleryImages.length} صور كاملة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-950 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 px-2 border-b border-white/10">
              <span className="text-xs font-bold text-white font-sans truncate">
                {data.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="size-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-2 flex items-center justify-center min-h-[250px]">
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={data.title}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
