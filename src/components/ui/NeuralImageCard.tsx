import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Split,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Quant3PerfectionIcon } from '@/components/ui/Quant3PerfectionIcon';

export interface NeuralImageData {
  operation?: 'recolor' | 'remove_background' | 'enhance_4k' | 'composite' | 'product_edit' | 'text_edit' | 'generate' | 'portrait_generation' | 'human_edit' | string;
  title?: string;
  description?: string;
  originalImage?: string;
  processedImage?: string;
  imageUrl?: string;
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: '4K' | '2K' | 'Original' | string;
  fidelityScore?: string;
  parameters?: Record<string, any>;
}

export interface NeuralImageCardProps {
  data: NeuralImageData;
  fallbackOriginalImage?: string;
  isStreaming?: boolean;
  className?: string;
}

export const NeuralImageCardComponent: React.FC<NeuralImageCardProps> = ({
  data,
  fallbackOriginalImage,
  isStreaming = false,
  className
}) => {
  // Dynamic Aspect Ratio and Seed variation controls for Fathom Quant 3
  const [selectedRatio, setSelectedRatio] = useState<string>(() => {
    if (data.aspectRatio && ['1:1', '16:9', '9:16', '4:3'].includes(data.aspectRatio)) {
      return data.aspectRatio;
    }
    return '1:1';
  });
  const [seed, setSeed] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>(() => {
    if (data.style === 'anime') return 'flux-anime';
    if (data.style === '3d_render') return 'flux-3d';
    return 'flux-realism';
  });

  // Compute dimensions
  const currentDimensions = useMemo(() => {
    if (selectedRatio === '16:9') return { width: 1344, height: 768 };
    if (selectedRatio === '9:16') return { width: 768, height: 1344 };
    if (selectedRatio === '4:3') return { width: 1152, height: 864 };
    return { width: 1024, height: 1024 };
  }, [selectedRatio]);

  // Dynamic max-width for the entire card based on aspect ratio to guarantee perfect framing
  const cardMaxWidthClass = useMemo(() => {
    if (isFullscreen) return 'w-full';
    if (selectedRatio === '9:16') return 'max-w-[450px] mx-auto';
    if (selectedRatio === '1:1') return 'max-w-[620px] mx-auto';
    if (selectedRatio === '4:3') return 'max-w-[760px] mx-auto';
    return 'max-w-4xl mx-auto';
  }, [selectedRatio, isFullscreen]);

  // Resolve images
  const originalSrc = data.originalImage || fallbackOriginalImage || null;
  const processedSrc = useMemo(() => {
    const { width, height } = currentDimensions;
    const activeModel = modelName;

    // If user modified seed or ratio and we have a prompt, generate fresh
    if (data.prompt && (seed !== null || (data.aspectRatio && selectedRatio !== data.aspectRatio))) {
      const cleanPrompt = encodeURIComponent(data.prompt.trim());
      const seedParam = seed !== null ? `&seed=${seed}` : '';
      return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${activeModel}&nologo=true&enhance=true${seedParam}`;
    }

    if (data.processedImage) {
      if (data.processedImage.includes('image.pollinations.ai/prompt/')) {
        try {
          const urlObj = new URL(data.processedImage);
          urlObj.searchParams.set('model', activeModel);
          urlObj.searchParams.set('width', width.toString());
          urlObj.searchParams.set('height', height.toString());
          if (seed !== null) urlObj.searchParams.set('seed', seed.toString());
          return urlObj.toString();
        } catch {
          // ignore
        }
      }
      return data.processedImage;
    }
    if (data.imageUrl) {
      if (data.imageUrl.includes('image.pollinations.ai/prompt/')) {
        try {
          const urlObj = new URL(data.imageUrl);
          urlObj.searchParams.set('model', activeModel);
          urlObj.searchParams.set('width', width.toString());
          urlObj.searchParams.set('height', height.toString());
          if (seed !== null) urlObj.searchParams.set('seed', seed.toString());
          return urlObj.toString();
        } catch {
          // ignore
        }
      }
      return data.imageUrl;
    }
    if (data.prompt) {
      const cleanPrompt = encodeURIComponent(data.prompt.trim());
      const seedParam = seed !== null ? `&seed=${seed}` : '';
      return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${activeModel}&nologo=true&enhance=true${seedParam}`;
    }
    return originalSrc || '';
  }, [data.processedImage, data.imageUrl, data.prompt, data.aspectRatio, selectedRatio, seed, originalSrc, currentDimensions, modelName]);

  // Local interactive states
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'processed' | 'original'>('processed');
  const [isProcessingCanvas, setIsProcessingCanvas] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<'4k' | '2k' | 'original'>('4k');
  const [loadError, setLoadError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeProcessedSrc = processedSrc;
  const hasDualImages = Boolean(originalSrc && processedSrc && originalSrc !== processedSrc);

  // Handle slider mouse/touch drag
  const handleDrag = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const onMouseDown = useCallback(() => setIsDragging(true), []);
  const onTouchStart = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDrag(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleDrag(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, handleDrag]);

  const handleRegenerateVariation = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    setLoadError(false);
    setIsImageLoading(true);
  }, []);

  const handleRatioChange = useCallback((ratio: string) => {
    setSelectedRatio(ratio);
    setLoadError(false);
    setIsImageLoading(true);
  }, []);

  const handleImageLoaded = () => {
    setIsImageLoading(false);
    setLoadError(false);
  };

  const handleImageError = () => {
    if (modelName === 'flux-realism') {
      // Graceful fallback to standard flux if flux-realism is temporarily busy
      setModelName('flux');
      setIsImageLoading(true);
      return;
    }
    setIsImageLoading(false);
    setLoadError(true);
  };

  // High-Resolution Canvas Master Downloader (4K / 2K / 1X)
  const handleDownload = async (targetTier: '4k' | '2k' | 'original' = selectedQuality) => {
    if (!activeProcessedSrc) return;
    setIsProcessingCanvas(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeProcessedSrc;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for download'));
      });

      let targetWidth = img.naturalWidth || 1024;
      let targetHeight = img.naturalHeight || 1024;
      const aspect = targetWidth / targetHeight;

      if (targetTier === '4k') {
        targetWidth = aspect >= 1 ? 3840 : Math.round(2160 * aspect);
        targetHeight = aspect >= 1 ? Math.round(3840 / aspect) : 2160;
      } else if (targetTier === '2k') {
        targetWidth = aspect >= 1 ? 2048 : Math.round(1152 * aspect);
        targetHeight = aspect >= 1 ? Math.round(2048 / aspect) : 1152;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/png', 0.98);
      const link = document.createElement('a');
      link.download = `FathomQuant3-Image-${targetTier.toUpperCase()}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(`تم تنزيل الصورة (${targetTier === 'original' ? '1X' : targetTier.toUpperCase()}) بنجاح`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch {
      // Fallback direct download
      const link = document.createElement('a');
      link.href = activeProcessedSrc;
      link.download = `FathomQuant3-Image-${Date.now()}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess('تم التنزيل المباشر بنجاح');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } finally {
      setIsProcessingCanvas(false);
    }
  };

  // Copy Prompt
  const handleCopyPrompt = () => {
    const textToCopy = data.prompt || data.description || data.title || 'Fathom Quant 3 Neural Image';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "my-3 sm:my-4 rounded-2xl border border-white/[0.08] bg-[#090b11]/95 backdrop-blur-xl overflow-hidden shadow-2xl select-none",
        cardMaxWidthClass,
        isFullscreen && "fixed inset-0 z-[150] m-0 rounded-none bg-black/95 backdrop-blur-2xl flex flex-col max-w-none",
        className
      )}
      dir="rtl"
    >
      {/* ── 1. Header Toolbar (Official Minimal Glassmorphism) ────────────── */}
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/[0.02] border-b border-white/[0.08]">
        {/* Title & Image Specs */}
        <div className="flex items-center gap-2.5 min-w-0" dir="ltr">
          <div className="size-7 sm:size-8 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0 text-zinc-300">
            <Quant3PerfectionIcon size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-zinc-100">
                FATHOM QUANT 3
              </span>
              <span className="text-[9.5px] font-mono font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                IMAGE STUDIO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-400">
              <span>{currentDimensions.width}×{currentDimensions.height}</span>
              <span>•</span>
              <span>4K UHD</span>
              <span>•</span>
              <span>FLUX.1</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Fullscreen */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dual Image View Mode Switcher (if both original & processed exist) */}
          {hasDualImages && (
            <div className="flex items-center bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === 'split' ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="مقارنة منزلقة"
              >
                <Split className="size-3" />
                <span className="hidden sm:inline">مقارنة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('processed')}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === 'processed' ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="الصورة المعدلة"
              >
                <Eye className="size-3" />
                <span className="hidden sm:inline">المعدلة</span>
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            title={isFullscreen ? "تصغير النافذة" : "تكبير ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4" /> : <Maximize2 className="size-3.5 sm:size-4" />}
          </button>
        </div>
      </div>

      {/* ── 2. Main Visual Display Viewport (Clean, Uncompressed & Proportional) ───────── */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden flex items-center justify-center bg-[#05070b] select-none transition-all duration-300 w-full",
          isFullscreen ? "flex-1 min-h-0 w-full" : "w-full min-h-[320px]"
        )}
        style={isFullscreen ? undefined : {
          aspectRatio: `${currentDimensions.width} / ${currentDimensions.height}`,
          maxHeight: '74vh'
        }}
      >
        {/* Loading / Streaming Shimmer Overlay */}
        {(isStreaming || isImageLoading) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-3 p-6 text-center animate-pulse">
            <div className="size-11 sm:size-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shadow-lg text-zinc-200">
              <Sparkles className="size-5 sm:size-6 text-zinc-200 animate-spin" />
            </div>
            <div className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
              جاري توليد الصورة الفوتوغرافية بدقة 4K...
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 font-sans max-w-xs">
              توليد عصبي دقيق عبر Fathom Quant 3 والنسب الذهبية
            </div>
          </div>
        )}

        {/* Single Processed View */}
        {(!hasDualImages || viewMode === 'processed') && (
          <div className="relative w-full h-full flex items-center justify-center">
            {loadError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-zinc-400">
                <AlertCircle className="size-7 text-amber-400" />
                <span className="text-xs sm:text-sm font-sans text-zinc-300">تعذر تحميل الصورة مؤقتاً</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoadError(false);
                    setIsImageLoading(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs flex items-center gap-1.5 transition font-sans cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-cyan-400" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            ) : (
              <img
                src={activeProcessedSrc}
                alt={data.title || "صورة معدلة عصبياً"}
                onLoad={handleImageLoaded}
                onError={handleImageError}
                className="w-full h-full object-cover shadow-2xl transition-all duration-300"
                style={{ imageRendering: '-webkit-optimize-contrast' as any }}
              />
            )}
          </div>
        )}

        {/* Single Original View */}
        {hasDualImages && viewMode === 'original' && originalSrc && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={originalSrc}
              alt="الصورة الأصلية"
              className="w-full h-full object-cover shadow-2xl transition-all duration-300"
              style={{ imageRendering: '-webkit-optimize-contrast' as any }}
            />
          </div>
        )}

        {/* Interactive Split Comparison Slider (Strict Image Aspect Ratio & Millimeter Precision) */}
        {hasDualImages && viewMode === 'split' && originalSrc && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Background: Processed Image */}
            <img
              src={activeProcessedSrc}
              alt="بعد التعديل"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ imageRendering: '-webkit-optimize-contrast' as any }}
            />

            {/* Foreground: Original Image Clipped */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalSrc}
                alt="قبل التعديل"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ imageRendering: '-webkit-optimize-contrast' as any }}
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg">
                قبل
              </div>
            </div>

            {/* Label: After */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg pointer-events-none">
              بعد
            </div>

            {/* Draggable Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 w-0.5 bg-white/70 cursor-ew-resize select-none"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-black/90 border border-white/30 shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform">
                <div className="flex items-center text-zinc-200">
                  <ChevronLeft className="size-3" />
                  <ChevronRight className="size-3" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Unified Action Footer Dock (Clean, Official, Glassmorphism) ── */}
      <div className="px-3.5 sm:px-5 py-3 bg-[#0a0d14]/95 border-t border-white/[0.08] flex flex-col gap-2.5">
        {/* Row 1: Resolution Config Dock */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Resolution Selector: 4K | 2K | 1X */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 sm:p-1 rounded-xl border border-white/[0.07]">
            <span className="text-[10px] sm:text-[11px] font-sans font-medium text-zinc-400 px-1.5">الدقة:</span>
            {(['4k', '2k', 'original'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuality(q)}
                className={cn(
                  "px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase transition-all cursor-pointer",
                  selectedQuality === q
                    ? "bg-white/[0.12] text-white border border-white/[0.2] shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                )}
                title={q === '4k' ? 'دقة 4K فائقة الوضوح (3840px)' : q === '2k' ? 'دقة 2K عالية (2048px)' : 'الدقة الأصلية 1X'}
              >
                {q === 'original' ? '1X' : q.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-white/[0.02] px-2.5 py-1 rounded-xl border border-white/[0.05]">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>جاهز للتنزيل المباشر</span>
          </div>
        </div>

        {/* Row 2: Streamlined Official Glassmorphism Action Bar */}
        <div className="flex items-center gap-2">
          {/* Primary Download Button */}
          <button
            type="button"
            onClick={() => handleDownload(selectedQuality)}
            disabled={isProcessingCanvas}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-sans font-bold shadow-lg shadow-black/40 border border-white/[0.14] backdrop-blur-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingCanvas ? (
              <>
                <Sparkles className="size-4 animate-spin text-zinc-300" />
                <span>جاري معالجة الصورة...</span>
              </>
            ) : (
              <>
                <Download className="size-4 text-zinc-200" />
                <span>
                  تنزيل الصورة ({selectedQuality === 'original' ? '1X' : selectedQuality.toUpperCase()})
                </span>
              </>
            )}
          </button>

          {/* Secondary Action: Copy Description Button */}
          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={isProcessingCanvas}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs sm:text-sm font-sans font-medium transition-all cursor-pointer active:scale-[0.99] shrink-0"
            title="نسخ الوصف البصري"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-zinc-300" />
                <span>نسخ الوصف</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="px-4 py-1.5 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-300 text-xs font-sans flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}
    </div>
  );
};

export const NeuralImageCard = React.memo(NeuralImageCardComponent);
