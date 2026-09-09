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
  operation?: 'recolor' | 'remove_background' | 'enhance_4k' | 'composite' | 'product_edit' | 'text_edit' | 'generate' | 'portrait_generation' | 'human_edit' | 'add_element' | 'edit' | string;
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
  seed?: number;
  parameters?: Record<string, any>;
}

export function isValidImageUri(uri: unknown): uri is string {
  if (typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed || trimmed.length < 5) return false;
  if (
    trimmed.includes('<') ||
    trimmed.includes('>') ||
    trimmed.startsWith('رابط') ||
    trimmed.startsWith('الصورة') ||
    trimmed === 'none' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
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
  const [seed, setSeed] = useState<number | null>(() => {
    if (typeof data.seed === 'number' && !isNaN(data.seed)) return data.seed;
    if (data.parameters?.seed && typeof data.parameters.seed === 'number') return data.parameters.seed;
    return null;
  });
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [museImageUrl, setMuseImageUrl] = useState<string | null>(() => {
    if (data.imageUrl && (data.imageUrl.startsWith('data:image') || data.imageUrl.startsWith('http') && !data.imageUrl.includes('pollinations.ai'))) {
      return data.imageUrl;
    }
    if (data.processedImage && (data.processedImage.startsWith('data:image') || data.processedImage.startsWith('http') && !data.processedImage.includes('pollinations.ai'))) {
      return data.processedImage;
    }
    return null;
  });
  const [modelName, setModelName] = useState<string>(() => {
    if (data.style === 'anime') return 'flux-anime';
    if (data.style === '3d_render') return 'flux-3d';
    // meta/muse-image via OpenRouter is the supreme primary image generation engine
    return 'meta/muse-image';
  });

  // Keep seed synchronized if data.seed is updated from incoming stream/props
  useEffect(() => {
    if (typeof data.seed === 'number' && !isNaN(data.seed)) {
      setSeed(data.seed);
    }
  }, [data.seed]);

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

  // Contextual operation classification
  const operationInfo = useMemo(() => {
    const op = (data.operation || '').toLowerCase();
    const title = (data.title || '').toLowerCase();
    if (op === 'add_element' || op === 'addition' || op.includes('add') || op === 'composite' || title.includes('إضافة') || title.includes('اضافة')) {
      return { label: 'إضافة ذكية', type: 'addition' as const };
    }
    if (op === 'edit' || op.includes('edit') || op === 'recolor' || op === 'remove_background' || op === 'human_edit' || title.includes('تعديل')) {
      return { label: 'تعديل دقيق', type: 'edit' as const };
    }
    return { label: 'إنشاء بصري', type: 'generation' as const };
  }, [data.operation, data.title]);

  const isEditOrAddition = operationInfo.type === 'addition' || operationInfo.type === 'edit';

  // Resolve images with robust validation against placeholder strings
  const originalSrc = useMemo(() => {
    if (isValidImageUri(data.originalImage)) return data.originalImage.trim();
    if (isValidImageUri(fallbackOriginalImage)) return fallbackOriginalImage.trim();
    return null;
  }, [data.originalImage, fallbackOriginalImage]);

  // Autonomous OpenRouter Meta: Muse Image Fetcher
  useEffect(() => {
    // If we already have a generated image (data uri or external non-pollinations url), skip
    if (museImageUrl) return;

    if (modelName === 'meta/muse-image' && data.prompt && data.prompt.trim()) {
      let isCancelled = false;
      setIsImageLoading(true);

      const requestPayload = {
        action: 'generate_image',
        prompt: data.prompt.trim(),
        aspectRatio: selectedRatio
      };

      // Try primary /api/generate-image first, fallback to /api/chat with generate_image action
      const executeGeneration = async () => {
        try {
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
          });
          if (res.ok) return await res.json();
        } catch {
          // Fall through to /api/chat
        }

        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });
        if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
        return await fallbackRes.json();
      };

      executeGeneration()
      .then((payload) => {
        if (!isCancelled && payload?.imageUrl) {
          setMuseImageUrl(payload.imageUrl);
          setIsImageLoading(false);
          setLoadError(false);
        }
      })
      .catch((err) => {
        console.warn('[Muse Image Generation Warning - Fallback to Flux Pro]:', err);
        if (!isCancelled) {
          // Gracefully fallback to flux-pro if Muse Image endpoint has network issue
          setModelName('flux-pro');
        }
      });

      return () => {
        isCancelled = true;
      };
    }
  }, [modelName, data.prompt, selectedRatio, museImageUrl]);

  const processedSrc = useMemo(() => {
    if (museImageUrl) return museImageUrl;
    const { width, height } = currentDimensions;
    const activeModel = modelName === 'meta/muse-image' ? 'flux-pro' : modelName;
    // For edits and additions, NEVER pass enhance=true to prevent Pollinations from hallucinating random new environments
    const enhanceParam = isEditOrAddition ? '&enhance=false' : '&enhance=true';

    // If user modified seed or ratio and we have a prompt, generate fresh at pristine proportional dimensions
    if (data.prompt && (seed !== null || (data.aspectRatio && selectedRatio !== data.aspectRatio))) {
      const cleanPrompt = encodeURIComponent(data.prompt.trim());
      const seedParam = seed !== null ? `&seed=${seed}` : '';
      return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${activeModel}&nologo=true${enhanceParam}${seedParam}`;
    }

    if (data.processedImage) {
      if (data.processedImage.includes('image.pollinations.ai/prompt/')) {
        try {
          const urlObj = new URL(data.processedImage);
          urlObj.searchParams.set('model', activeModel);
          urlObj.searchParams.set('width', width.toString());
          urlObj.searchParams.set('height', height.toString());
          if (isEditOrAddition) {
            urlObj.searchParams.set('enhance', 'false');
          }
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
          if (isEditOrAddition) {
            urlObj.searchParams.set('enhance', 'false');
          }
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
      return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${activeModel}&nologo=true${enhanceParam}${seedParam}`;
    }
    return originalSrc || '';
  }, [museImageUrl, data.processedImage, data.imageUrl, data.prompt, data.aspectRatio, selectedRatio, seed, originalSrc, currentDimensions, modelName, isEditOrAddition]);

  // Local interactive states
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [originalLoadError, setOriginalLoadError] = useState<boolean>(false);
  const activeProcessedSrc = processedSrc;
  const hasDualImages = Boolean(originalSrc && activeProcessedSrc && originalSrc !== activeProcessedSrc && !originalLoadError);

  const [viewMode, setViewMode] = useState<'split' | 'processed' | 'original'>(() => {
    if (originalSrc && isEditOrAddition) return 'split';
    return 'processed';
  });

  // Automatically switch to split view when both images are ready for an edit or addition
  useEffect(() => {
    if (hasDualImages && isEditOrAddition && viewMode === 'processed') {
      setViewMode('split');
    }
  }, [hasDualImages, isEditOrAddition]);

  const [isProcessingCanvas, setIsProcessingCanvas] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<'4k' | '2k' | 'original'>('4k');

  const containerRef = useRef<HTMLDivElement>(null);

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
    if (modelName === 'flux-pro') {
      // Graceful fallback to flux-realism if flux-pro is temporarily busy
      setModelName('flux-realism');
      setIsImageLoading(true);
      return;
    }
    if (modelName === 'flux-realism') {
      // Final fallback to standard flux
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

      let targetWidth = 1024;
      let targetHeight = 1024;
      const targetAspect = currentDimensions.width / currentDimensions.height;

      if (targetTier === '4k') {
        targetWidth = targetAspect >= 1 ? 3840 : Math.round(2160 * targetAspect);
        targetHeight = targetAspect >= 1 ? Math.round(3840 / targetAspect) : 2160;
      } else if (targetTier === '2k') {
        targetWidth = targetAspect >= 1 ? 2048 : Math.round(1152 * targetAspect);
        targetHeight = targetAspect >= 1 ? Math.round(2048 / targetAspect) : 1152;
      } else {
        // HD Tier (High Definition)
        targetWidth = targetAspect >= 1 ? 1280 : Math.round(720 * targetAspect);
        targetHeight = targetAspect >= 1 ? Math.round(1280 / targetAspect) : 720;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Proportional aspect-ratio crop: prevent any vertical or horizontal squishing
      const imgW = img.naturalWidth || 1024;
      const imgH = img.naturalHeight || 1024;
      const imgAspect = imgW / imgH;

      let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;
      if (imgAspect > targetAspect) {
        // Source is wider than canvas: crop sides
        sWidth = Math.round(imgH * targetAspect);
        sx = Math.round((imgW - sWidth) / 2);
      } else if (imgAspect < targetAspect) {
        // Source is taller than canvas: crop top/bottom
        sHeight = Math.round(imgW / targetAspect);
        sy = Math.round((imgH - sHeight) / 2);
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/png', 0.98);
      const tierLabel = targetTier === 'original' ? 'HD' : targetTier.toUpperCase();
      const link = document.createElement('a');
      link.download = `FathomQuant3-Image-${tierLabel}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(`تم تنزيل الصورة (${tierLabel}) بنجاح`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch {
      // Fallback direct download
      const link = document.createElement('a');
      link.href = activeProcessedSrc;
      link.download = `FathomQuant3-Image-HD-${Date.now()}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess('تم تنزيل الصورة بنجاح');
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
      {/* ── 1. Header Toolbar (Ultra-Minimal Claude/Apple Aesthetic) ────────────── */}
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/[0.02] border-b border-white/[0.07]">
        {/* Title & Image Specs */}
        <div className="flex items-center gap-2 min-w-0" dir="ltr">
          <span className="font-mono text-xs font-semibold tracking-wider text-zinc-100">
            FATHOM QUANT 3
          </span>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-[11px] font-mono text-zinc-400">
            {currentDimensions.width}×{currentDimensions.height}
          </span>
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
                title="مقارنة تفاعلية منزلقة"
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
                title="الصورة بعد التعديل"
              >
                <Eye className="size-3" />
                <span className="hidden sm:inline">المعدلة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === 'original' ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="الصورة الأصلية قبل التعديل"
              >
                <span className="hidden sm:inline">الأصلية</span>
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

      {/* Dynamic Title and Description Bar */}
      {data.title && (
        <div className="px-3.5 sm:px-5 py-2 bg-white/[0.015] border-b border-white/[0.06] flex items-center justify-between gap-2 select-text" dir="rtl">
          <span className="text-xs sm:text-[13px] font-sans font-semibold text-zinc-200 truncate">
            {data.title}
          </span>
          {data.description && (
            <span className="text-[11px] font-sans text-zinc-400 hidden md:inline truncate max-w-[55%]">
              {data.description}
            </span>
          )}
        </div>
      )}

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
              {operationInfo.type === 'addition'
                ? 'جارٍ إضافة العنصر للصورة بدقة فائقة...'
                : operationInfo.type === 'edit'
                  ? 'جارٍ تعديل الصورة بدقة فائقة...'
                  : 'جارٍ توليد الصورة بدقة فائقة...'}
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 font-sans max-w-xs">
              استدلال بصري وتوليد متقدم عبر Fathom Silicon
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
                alt={data.title || (operationInfo.type === 'addition' ? "صورة مضاف إليها عناصر" : operationInfo.type === 'edit' ? "صورة معدلة عصبياً" : "صورة فوتوغرافية فائقة")}
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
          <div
            className="relative w-full h-full overflow-hidden select-none cursor-ew-resize touch-none"
            dir="ltr"
            onMouseDown={(e) => {
              handleDrag(e.clientX);
              setIsDragging(true);
            }}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                handleDrag(e.touches[0].clientX);
                setIsDragging(true);
              }
            }}
          >
            {/* Background: Processed Image */}
            <img
              src={activeProcessedSrc}
              alt="بعد التعديل"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
                onError={() => setOriginalLoadError(true)}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ imageRendering: '-webkit-optimize-contrast' as any }}
              />
              <div
                className={cn(
                  "absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg transition-opacity duration-200 pointer-events-none",
                  isDragging && "opacity-30"
                )}
              >
                قبل
              </div>
            </div>

            {/* Label: After */}
            <div
              className={cn(
                "absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-zinc-300 font-bold shadow-lg transition-opacity duration-200 pointer-events-none",
                isDragging && "opacity-30"
              )}
            >
              بعد
            </div>

            {/* Draggable Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 w-1 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.7)] select-none pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-black/90 border border-white/40 shadow-2xl flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform">
                <div className="flex items-center text-zinc-200 pointer-events-none">
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
          {/* Resolution Selector: 4K | 2K | HD */}
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
                title={q === '4k' ? 'دقة 4K فائقة الوضوح (3840px)' : q === '2k' ? 'دقة 2K عالية (2048px)' : 'دقة HD عالية الجودة'}
              >
                {q === 'original' ? 'HD' : q.toUpperCase()}
              </button>
            ))}
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
                <span>جارٍ معالجة الصورة...</span>
              </>
            ) : (
              <>
                <Download className="size-4 text-zinc-200" />
                <span>
                  تنزيل الصورة ({selectedQuality === 'original' ? 'HD' : selectedQuality.toUpperCase()})
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
