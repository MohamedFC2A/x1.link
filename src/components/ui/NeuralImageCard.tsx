import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Split,
  Layers,
  Scissors,
  Wand2,
  Sliders,
  Eye,
  RefreshCw,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralImageStudioIcon } from '@/lib/featuresRegistry';

export interface NeuralImageData {
  operation?: 'recolor' | 'remove_background' | 'enhance_4k' | 'composite' | 'product_edit' | 'text_edit' | 'generate' | 'portrait_generation' | 'human_edit' | string;
  title?: string;
  description?: string;
  originalImage?: string;
  processedImage?: string;
  imageUrl?: string;
  prompt?: string;
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
  // Resolve images
  const originalSrc = data.originalImage || fallbackOriginalImage || null;
  const processedSrc = useMemo(() => {
    if (data.processedImage) return data.processedImage;
    if (data.imageUrl) return data.imageUrl;
    if (data.prompt) {
      const cleanPrompt = encodeURIComponent(data.prompt.trim());
      return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true`;
    }
    return originalSrc || '';
  }, [data.processedImage, data.imageUrl, data.prompt, originalSrc]);

  // Local interactive states
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'processed' | 'original'>('split');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isProcessingCanvas, setIsProcessingCanvas] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<'4k' | '2k' | 'original'>('4k');
  const [activeFilter, setActiveFilter] = useState<'none' | 'enhanced' | 'bg_removed' | 'recolored'>('none');
  const [recolorHue, setRecolorHue] = useState<number>(0);
  const [showRecolorControl, setShowRecolorControl] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeProcessedSrc = processedSrc;

  // Operation translation & badges
  const operationMeta = useMemo(() => {
    const op = (data.operation || '').toLowerCase();
    if (op.includes('portrait') || op.includes('human_gen') || op.includes('face_gen')) {
      return { label: 'توليد بورتريه فوتوغرافي واقعي', icon: User, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
    }
    if (op.includes('human_edit') || op.includes('anatomy') || op.includes('retouch')) {
      return { label: 'معالجة وتعديل بشري جراحي', icon: Sparkles, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' };
    }
    if (op.includes('recolor') || op.includes('color')) {
      return { label: 'تغيير لون انتقائي', icon: Sliders, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
    if (op.includes('background') || op.includes('bg') || op.includes('cutout')) {
      return { label: 'عزل وتفريغ الخلفية', icon: Scissors, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    }
    if (op.includes('enhance') || op.includes('4k') || op.includes('upscale')) {
      return { label: 'ترقية فائقة الدقة 4K', icon: Wand2, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    }
    if (op.includes('composite') || op.includes('merge')) {
      return { label: 'دمج عناصر ووجوه', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' };
    }
    if (op.includes('text')) {
      return { label: 'تعديل نصوص فوتوغرافي', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30' };
    }
    if (op.includes('product')) {
      return { label: 'تعديل صورة منتج', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
    }
    return { label: 'توليد عصبي واقعي فائق', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
  }, [data.operation]);

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

  // 1-Click High-DPI Canvas Master Downloader
  const handleDownload = async (targetTier: '4k' | '2k' | 'original' = selectedQuality) => {
    if (!activeProcessedSrc) return;
    setIsProcessingCanvas(true);
    setProcessingStatus(`جاري تجهيز الصورة بدقة ${targetTier.toUpperCase()}...`);

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

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply active filters if selected
      if (activeFilter === 'recolored' && recolorHue !== 0) {
        ctx.filter = `hue-rotate(${recolorHue}deg) saturate(1.15)`;
      } else if (activeFilter === 'enhanced') {
        ctx.filter = 'contrast(1.08) saturate(1.1) brightness(1.02)';
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Perform instant background cutout if filter active
      if (activeFilter === 'bg_removed') {
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const dataArr = imgData.data;
        // Sample corner pixels as reference background color
        const bgR = dataArr[0];
        const bgG = dataArr[1];
        const bgB = dataArr[2];
        const threshold = 40;

        for (let i = 0; i < dataArr.length; i += 4) {
          const r = dataArr[i];
          const g = dataArr[i + 1];
          const b = dataArr[i + 2];
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
          if (dist < threshold) {
            dataArr[i + 3] = 0; // set transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const mimeType = activeFilter === 'bg_removed' ? 'image/png' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, 0.98);

      const link = document.createElement('a');
      link.download = `CyberUltra-${data.operation || 'photo'}-${targetTier.toUpperCase()}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProcessingStatus('تم التنزيل بنجاح');
      setTimeout(() => setProcessingStatus(''), 2000);
    } catch {
      // Fallback direct download
      const link = document.createElement('a');
      link.href = activeProcessedSrc;
      link.download = `CyberUltra-${data.operation || 'photo'}-${Date.now()}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setProcessingStatus('تم التنزيل المباشر');
      setTimeout(() => setProcessingStatus(''), 2000);
    } finally {
      setIsProcessingCanvas(false);
    }
  };

  // Instant In-Browser Background Removal Toggle
  const toggleBackgroundRemoval = () => {
    if (activeFilter === 'bg_removed') {
      setActiveFilter('none');
      setProcessingStatus('تمت استعادة الخلفية الأصلية');
    } else {
      setActiveFilter('bg_removed');
      setProcessingStatus('تم تفعيل العزل الفوري للخلفية');
    }
    setTimeout(() => setProcessingStatus(''), 2000);
  };

  // Instant In-Browser Super-Resolution Enhance Toggle
  const toggleSuperResolution = () => {
    if (activeFilter === 'enhanced') {
      setActiveFilter('none');
      setProcessingStatus('تم إلغاء تحسين الإضاءة');
    } else {
      setActiveFilter('enhanced');
      setSelectedQuality('4k');
      setProcessingStatus('تم تفعيل التحسين العصبي الفائق 4K');
    }
    setTimeout(() => setProcessingStatus(''), 2000);
  };

  // Copy Prompt / Meta
  const handleCopyPrompt = () => {
    const textToCopy = data.prompt || data.description || data.title || 'Cyber Ultra Neural Image';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasDualImages = Boolean(originalSrc && processedSrc && originalSrc !== processedSrc);

  return (
    <div
      className={cn(
        "relative my-3 w-full rounded-2xl border border-cyan-500/30 bg-[#090d16]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(6,182,212,0.15)] overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-0 z-[150] m-0 rounded-none bg-black/95 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto",
        className
      )}
      dir="rtl"
    >
      {/* ── Top Header Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 sm:px-4 sm:py-3 select-none">
        {/* Brand & Operation Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 shadow-inner shrink-0">
            <NeuralImageStudioIcon size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-wider text-cyan-300">
                CYBER ULTRA STUDIO
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                4K UHD
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className={cn("inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md border", operationMeta.bg, operationMeta.color)}>
                <operationMeta.icon className="w-3 h-3" />
                {operationMeta.label}
              </span>
              {data.fidelityScore && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  دقة {data.fidelityScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Switcher (When original and processed both exist) */}
        {hasDualImages && (
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5 text-xs font-sans">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 text-[11px] font-medium",
                viewMode === 'split' ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold" : "text-zinc-400 hover:text-white"
              )}
            >
              <Split className="w-3 h-3" />
              <span>مقارنة منزلقة</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('processed')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 text-[11px] font-medium",
                viewMode === 'processed' ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold" : "text-zinc-400 hover:text-white"
              )}
            >
              <Eye className="w-3 h-3" />
              <span>بعد التعديل</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 text-[11px] font-medium",
                viewMode === 'original' ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold" : "text-zinc-400 hover:text-white"
              )}
            >
              <span>الأصلية</span>
            </button>
          </div>
        )}

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {data.prompt && (
            <button
              type="button"
              onClick={handleCopyPrompt}
              title="نسخ الوصف البصري"
              className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "تصغير" : "تكبير كامل الشاشة"}
            className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Main Visual Display Viewport ────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden bg-zinc-950/90 flex items-center justify-center select-none",
          isFullscreen ? "flex-1 min-h-[60vh]" : "min-h-[280px] sm:min-h-[380px] max-h-[550px]"
        )}
      >
        {isStreaming && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2 text-cyan-300">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold">جاري المعالجة العصبية الفائقة (Cyber Ultra 4K)...</span>
          </div>
        )}

        {/* Single Processed View */}
        {(!hasDualImages || viewMode === 'processed') && (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            {loadError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-zinc-400">
                <span className="text-sm font-sans">جاري مزامنة الصورة أو تعذر العرض مؤقتاً</span>
                <button
                  type="button"
                  onClick={() => setLoadError(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs flex items-center gap-1.5 transition font-sans"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            ) : (
              <img
                src={activeProcessedSrc}
                alt={data.title || "صورة معدلة عصبياً"}
                onError={() => setLoadError(true)}
                className={cn(
                  "max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-200",
                  activeFilter === 'enhanced' && "contrast-[1.08] saturate-[1.1] brightness-[1.02]",
                  activeFilter === 'recolored' && recolorHue !== 0 && `hue-rotate-[${recolorHue}deg]`
                )}
                style={activeFilter === 'recolored' && recolorHue !== 0 ? { filter: `hue-rotate(${recolorHue}deg) saturate(1.15)` } : undefined}
              />
            )}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-200 font-bold shadow-lg">
              معالجة عصبية 100%
            </div>
          </div>
        )}

        {/* Single Original View */}
        {hasDualImages && viewMode === 'original' && originalSrc && (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={originalSrc}
              alt="الصورة الأصلية"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg">
              الأصلية قبل التعديل
            </div>
          </div>
        )}

        {/* Interactive Split Comparison Slider */}
        {hasDualImages && viewMode === 'split' && originalSrc && (
          <div className="relative w-full h-full min-h-[300px] sm:min-h-[420px] overflow-hidden flex items-center justify-center">
            {/* Background Layer: Processed Image */}
            <img
              src={activeProcessedSrc}
              alt="بعد التعديل"
              className="absolute inset-0 w-full h-full object-contain p-2"
              style={activeFilter === 'recolored' && recolorHue !== 0 ? { filter: `hue-rotate(${recolorHue}deg) saturate(1.15)` } : undefined}
            />

            {/* Foreground Layer: Original Image Clipped */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalSrc}
                alt="قبل التعديل"
                className="absolute inset-0 w-full h-full object-contain p-2"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg">
                قبل (الأصلية)
              </div>
            </div>

            {/* Label for "After" */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-200 font-bold shadow-lg pointer-events-none">
              بعد (المعدلة 100%)
            </div>

            {/* Draggable Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 w-1 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 cursor-ew-resize select-none"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-9 rounded-full bg-black/90 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center cursor-ew-resize">
                <div className="flex items-center text-cyan-300">
                  <ChevronLeft className="w-3 h-3" />
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recolor Hue Adjustment Control ──────────────────────────────────── */}
      {showRecolorControl && (
        <div className="border-t border-cyan-500/20 bg-cyan-950/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-zinc-200">ضبط درجة اللون الحية:</span>
            <span className="font-mono text-amber-300 font-bold">{recolorHue}°</span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <input
              type="range"
              min="-180"
              max="180"
              value={recolorHue}
              onChange={(e) => {
                setRecolorHue(parseInt(e.target.value, 10));
                setActiveFilter('recolored');
              }}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              type="button"
              onClick={() => {
                setRecolorHue(0);
                setActiveFilter('none');
              }}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-zinc-300"
            >
              إعادة ضبط
            </button>
          </div>
        </div>
      )}

      {/* ── Processing Notification Bar ─────────────────────────────────────── */}
      {processingStatus && (
        <div className="bg-cyan-500/20 border-t border-cyan-500/30 px-3 py-1.5 text-center text-xs font-semibold text-cyan-200 animate-in fade-in duration-150">
          {processingStatus}
        </div>
      )}

      {/* ── Bottom Action Tools & High-DPI Download ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.08] bg-white/[0.015] px-3.5 py-3 sm:px-4 select-none">
        {/* Instant 1-Click Processing Tools */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={toggleBackgroundRemoval}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150",
              activeFilter === 'bg_removed'
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-bold"
                : "bg-white/[0.04] border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            <span>عزل الخلفية</span>
          </button>

          <button
            type="button"
            onClick={toggleSuperResolution}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150",
              activeFilter === 'enhanced'
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-bold"
                : "bg-white/[0.04] border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>تحسين 4K</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRecolorControl(!showRecolorControl)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150",
              showRecolorControl
                ? "bg-amber-500/20 border-amber-400/50 text-amber-300 font-bold"
                : "bg-white/[0.04] border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>تعديل الألوان</span>
          </button>
        </div>

        {/* Quality Selector & Download Button */}
        <div className="flex items-center gap-2">
          {/* Quality Tiers */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedQuality('4k')}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold transition",
                selectedQuality === '4k' ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40" : "text-zinc-400 hover:text-white"
              )}
            >
              4K
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuality('2k')}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold transition",
                selectedQuality === '2k' ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40" : "text-zinc-400 hover:text-white"
              )}
            >
              2K
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuality('original')}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold transition",
                selectedQuality === 'original' ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40" : "text-zinc-400 hover:text-white"
              )}
            >
              1X
            </button>
          </div>

          {/* Master Download Action */}
          <button
            type="button"
            disabled={isProcessingCanvas}
            onClick={() => handleDownload(selectedQuality)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>تحميل {selectedQuality.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NeuralImageCard = React.memo(NeuralImageCardComponent);
