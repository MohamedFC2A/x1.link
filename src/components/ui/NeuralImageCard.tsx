// FATHOM QP3 Sovereign Neural Studio Engine
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
  ChevronRight,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Quant3PerfectionIcon } from '@/components/ui/Quant3PerfectionIcon';
import { incidentDiagnosticService } from '@/services/incidentDiagnosticService';

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
  // Detect truncated or invalid base64 data URIs
  if (trimmed.startsWith('data:image/')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1 || commaIdx === trimmed.length - 1) return false;
    const base64Part = trimmed.slice(commaIdx + 1);
    if (base64Part.length < 500) return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

function simplePromptHash(str: string): string {
  const clean = (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function extractPromptString(raw: any): string {
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .filter((p: any) => p && (typeof p === 'string' || p.type === 'text'))
      .map((p: any) => (typeof p === 'string' ? p : p.text || ''))
      .join(' ')
      .trim();
  }
  if (typeof raw === 'object' && raw !== null) {
    return (raw.text || raw.prompt || '').trim();
  }
  return '';
}

function getGlobalImageCache(): Map<string, string> {
  if (typeof window === 'undefined') return new Map();
  return ((window as any).__FATHOM_IMAGE_CACHE__ = (window as any).__FATHOM_IMAGE_CACHE__ || new Map<string, string>());
}

export interface NeuralImageCardProps {
  data: NeuralImageData;
  messageId?: string;
  fallbackOriginalImage?: string;
  isStreaming?: boolean;
  className?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export const NeuralImageCardComponent: React.FC<NeuralImageCardProps> = ({
  data,
  messageId,
  fallbackOriginalImage,
  isStreaming = false,
  className,
  onImageGenerated
}) => {
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
    if (fallbackOriginalImage && isValidImageUri(fallbackOriginalImage)) {
      if (!isValidImageUri(data.originalImage) || (typeof data.originalImage === 'string' && data.originalImage.startsWith('data:image/') && data.originalImage.length < 5000)) {
        return fallbackOriginalImage.trim();
      }
    }
    if (isValidImageUri(data.originalImage)) return data.originalImage.trim();
    if (isValidImageUri(fallbackOriginalImage)) return fallbackOriginalImage.trim();
    return null;
  }, [data.originalImage, fallbackOriginalImage]);

  const promptText = useMemo(() => extractPromptString(data.prompt), [data.prompt]);

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
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const lastGenerationTimeRef = useRef<number>(Date.now());
  const generationStartTimeRef = useRef<number>(0);
  const [museImageUrl, setMuseImageUrl] = useState<string | null>(() => {
    const rawProp = data.imageUrl || data.processedImage;
    const isInputImg = (isEditOrAddition || Boolean(originalSrc)) && (rawProp === originalSrc || rawProp === fallbackOriginalImage);
    if (rawProp && !rawProp.includes('pollinations.ai') && (rawProp.startsWith('data:image') || rawProp.startsWith('http')) && !isInputImg) {
      return rawProp;
    }
    // Check in-memory global cache
    const gCache = getGlobalImageCache();
    if (messageId && gCache.has(messageId)) {
      const cached = gCache.get(messageId)!;
      if (isValidImageUri(cached) && !cached.includes('pollinations.ai') && (!isEditOrAddition || cached !== originalSrc)) return cached;
    }
    const cleanPrompt = extractPromptString(data.prompt);
    if (cleanPrompt) {
      const hashKey = simplePromptHash(cleanPrompt);
      if (gCache.has(hashKey)) {
        const cached = gCache.get(hashKey)!;
        if (isValidImageUri(cached) && !cached.includes('pollinations.ai') && (!isEditOrAddition || cached !== originalSrc)) return cached;
      }
    }
    // Instant 0ms cache retrieval on page refresh or component remount
    if (typeof window !== 'undefined' && window.localStorage) {
      if (messageId) {
        const cached = localStorage.getItem(`fathom_img_${messageId}`);
        if (cached && !cached.includes('pollinations.ai') && (cached.startsWith('data:image') || cached.startsWith('http')) && (!isEditOrAddition || cached !== originalSrc)) {
          gCache.set(messageId, cached);
          return cached;
        }
      }
      if (cleanPrompt) {
        const hashKey = simplePromptHash(cleanPrompt);
        const cachedByHash = localStorage.getItem(`fathom_img_${hashKey}`);
        if (cachedByHash && !cachedByHash.includes('pollinations.ai') && (cachedByHash.startsWith('data:image') || cachedByHash.startsWith('http')) && (!isEditOrAddition || cachedByHash !== originalSrc)) {
          gCache.set(hashKey, cachedByHash);
          return cachedByHash;
        }
      }
    }
    return null;
  });
  const modelName = 'meta/muse-image';

  // Synchronize museImageUrl from incoming data props instantly
  useEffect(() => {
    const nextUrl = data.imageUrl || data.processedImage;
    const isInputImg = (isEditOrAddition || Boolean(originalSrc)) && (nextUrl === originalSrc || nextUrl === fallbackOriginalImage);
    if (nextUrl && isValidImageUri(nextUrl) && !nextUrl.includes('pollinations.ai') && !isInputImg) {
      setMuseImageUrl(nextUrl);
      setIsImageLoading(false);
      setGenerationProgress(100);
      setLoadError(false);
      const gCache = getGlobalImageCache();
      if (messageId) gCache.set(messageId, nextUrl);
      if (promptText) gCache.set(simplePromptHash(promptText), nextUrl);
    }
  }, [data.imageUrl, data.processedImage, messageId, promptText, isEditOrAddition, originalSrc, fallbackOriginalImage]);

  // Keep seed synchronized if data.seed is updated from incoming stream/props
  useEffect(() => {
    if (typeof data.seed === 'number' && !isNaN(data.seed)) {
      setSeed(data.seed);
    }
  }, [data.seed]);

  // Natural image dimensions to adapt viewport and preserve 100% of non-standard or ultra-wide images without cropping
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  // Compute dimensions (dynamically reflects natural image dimensions when loaded to prevent cropping)
  const currentDimensions = useMemo(() => {
    if (naturalDimensions && naturalDimensions.width > 0 && naturalDimensions.height > 0) {
      return naturalDimensions;
    }
    if (selectedRatio === '16:9') return { width: 1344, height: 768 };
    if (selectedRatio === '9:16') return { width: 768, height: 1344 };
    if (selectedRatio === '4:3') return { width: 1152, height: 864 };
    return { width: 1024, height: 1024 };
  }, [selectedRatio, naturalDimensions]);

  // Active aspect ratio & numeric ratio calculated from real image dimensions
  const activeAspectRatio = useMemo(() => {
    return `${currentDimensions.width} / ${currentDimensions.height}`;
  }, [currentDimensions]);

  const numericRatio = useMemo(() => {
    return currentDimensions.width / currentDimensions.height;
  }, [currentDimensions]);

  // Dynamic max-width for the entire card based on aspect ratio to guarantee perfect framing
  // Ultra-wide images (e.g. 21:9, 32:9) expand up to max-w-6xl so they are never constrained or cropped
  const cardMaxWidthClass = useMemo(() => {
    if (isFullscreen) return 'w-full';
    if (numericRatio >= 2.0) return 'max-w-6xl w-full mx-auto';
    if (numericRatio >= 1.6) return 'max-w-5xl mx-auto';
    if (numericRatio <= 0.65) return 'max-w-[440px] mx-auto';
    if (numericRatio <= 0.85) return 'max-w-[540px] mx-auto';
    if (numericRatio <= 1.15) return 'max-w-[640px] mx-auto';
    return 'max-w-4xl mx-auto';
  }, [numericRatio, isFullscreen]);

  // Autonomous Sovereign Fathom QP3 Image Fetcher
  useEffect(() => {
    if (museImageUrl && retryCount === 0) return;

    // 1. Direct props check
    const existingPropUrl = data.imageUrl || data.processedImage;
    const isInputImg = (isEditOrAddition || Boolean(originalSrc)) && (existingPropUrl === originalSrc || existingPropUrl === fallbackOriginalImage);
    if (existingPropUrl && isValidImageUri(existingPropUrl) && !existingPropUrl.includes('pollinations.ai') && !isInputImg) {
      setMuseImageUrl(existingPropUrl);
      setIsImageLoading(false);
      setGenerationProgress(100);
      return;
    }

    if (!promptText) return;

    // 2. Memory and Storage multi-layer check before initiating generation
    const gCache = getGlobalImageCache();
    if (messageId && gCache.has(messageId)) {
      const cached = gCache.get(messageId)!;
      if (isValidImageUri(cached) && !cached.includes('pollinations.ai')) {
        setMuseImageUrl(cached);
        setIsImageLoading(false);
        setGenerationProgress(100);
        return;
      }
    }

    const promptHashKey = simplePromptHash(promptText);
    if (gCache.has(promptHashKey)) {
      const cached = gCache.get(promptHashKey)!;
      if (isValidImageUri(cached) && !cached.includes('pollinations.ai')) {
        setMuseImageUrl(cached);
        setIsImageLoading(false);
        setGenerationProgress(100);
        return;
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      if (messageId) {
        const cached = localStorage.getItem(`fathom_img_${messageId}`);
        if (cached && isValidImageUri(cached) && !cached.includes('pollinations.ai')) {
          gCache.set(messageId, cached);
          setMuseImageUrl(cached);
          setIsImageLoading(false);
          setGenerationProgress(100);
          return;
        }
      }
      const cachedByHash = localStorage.getItem(`fathom_img_${promptHashKey}`);
      if (cachedByHash && isValidImageUri(cachedByHash) && !cachedByHash.includes('pollinations.ai')) {
        gCache.set(promptHashKey, cachedByHash);
        setMuseImageUrl(cachedByHash);
        setIsImageLoading(false);
        setGenerationProgress(100);
        return;
      }
    }

    let isCancelled = false;
    setIsImageLoading(true);
    setLoadError(false);
    generationStartTimeRef.current = performance.now();

    const requestPayload = {
      action: 'generate_image',
      prompt: promptText,
      aspectRatio: selectedRatio,
      originalImage: originalSrc || data.originalImage || fallbackOriginalImage || undefined,
      referenceImages: (data as any)?.referenceImages || (originalSrc ? [originalSrc] : (fallbackOriginalImage ? [fallbackOriginalImage] : undefined)),
      messageId: messageId || undefined
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

    const executeGeneration = async () => {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.imageUrl) {
            return json;
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') throw e;
      }

      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (json?.imageUrl) return json;
        }
        throw new Error(`HTTP ${fallbackRes.status}`);
      } catch (err) {
        throw err;
      }
    };

    executeGeneration()
      .then((payload) => {
        clearTimeout(timeoutId);
        const durationMs = Math.round(performance.now() - (generationStartTimeRef.current || performance.now()));
        lastGenerationTimeRef.current = Date.now();

        if (durationMs > 25000) {
          incidentDiagnosticService.trackPerformanceMetric(
            'IMAGE_STUDIO',
            durationMs,
            { prompt: promptText.slice(0, 120), ratio: selectedRatio }
          );
        }

        if (!isCancelled && payload?.imageUrl) {
          setMuseImageUrl(payload.imageUrl);
          setIsImageLoading(false);
          setLoadError(false);
          setGenerationProgress(100);
          const gCache = getGlobalImageCache();
          if (messageId) gCache.set(messageId, payload.imageUrl);
          if (promptText) gCache.set(simplePromptHash(promptText), payload.imageUrl);
          if (typeof window !== 'undefined' && window.localStorage) {
            if (messageId) {
              try { localStorage.setItem(`fathom_img_${messageId}`, payload.imageUrl); } catch {}
            }
            if (promptText) {
              try { localStorage.setItem(`fathom_img_${simplePromptHash(promptText)}`, payload.imageUrl); } catch {}
            }
          }
          if (onImageGenerated) {
            onImageGenerated(payload.imageUrl);
          }
        } else if (!isCancelled) {
          throw new Error('No image returned from Fathom QP3');
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        const durationMs = Math.round(performance.now() - (generationStartTimeRef.current || performance.now()));
        if (!isCancelled) {
          console.error('[Fathom QP3 Image Generation Error]:', err);
          setIsImageLoading(false);
          setLoadError(true);
          incidentDiagnosticService.trackImageEvent(
            'IMAGE_GENERATION_DEFECT',
            {
              errorMessage: err?.message || 'Neural image generation API failed',
              errorCode: 'GENERATION_DISPATCH_FAILED',
              userPrompt: promptText.slice(0, 150),
              durationMs,
              severity: 'HIGH',
              metadata: {
                aspect_ratio: selectedRatio,
                retry_count: retryCount
              }
            }
          );
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [data.prompt, selectedRatio, retryCount, seed]);

  const processedSrc = useMemo(() => {
    if (museImageUrl && (!isEditOrAddition || (museImageUrl !== originalSrc && museImageUrl !== fallbackOriginalImage))) {
      return museImageUrl;
    }
    if (data.processedImage && !data.processedImage.includes('pollinations.ai') && (data.processedImage.startsWith('data:image') || data.processedImage.startsWith('http'))) {
      if (!isEditOrAddition || (data.processedImage !== originalSrc && data.processedImage !== fallbackOriginalImage)) {
        return data.processedImage;
      }
    }
    if (data.imageUrl && !data.imageUrl.includes('pollinations.ai') && (data.imageUrl.startsWith('data:image') || data.imageUrl.startsWith('http'))) {
      if (!isEditOrAddition || (data.imageUrl !== originalSrc && data.imageUrl !== fallbackOriginalImage)) {
        return data.imageUrl;
      }
    }
    return '';
  }, [museImageUrl, data.processedImage, data.imageUrl, isEditOrAddition, originalSrc, fallbackOriginalImage]);

  // Local interactive states
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [originalLoadError, setOriginalLoadError] = useState<boolean>(false);
  const activeProcessedSrc = processedSrc;
  const hasDualImages = Boolean(originalSrc && activeProcessedSrc && originalSrc !== activeProcessedSrc && !originalLoadError);

  const [viewMode, setViewMode] = useState<'split' | 'processed' | 'original'>(() => {
    if (hasDualImages && isEditOrAddition) return 'split';
    return 'processed';
  });

  // Automatically switch to split view when both images are ready for an edit or addition
  useEffect(() => {
    if (hasDualImages && isEditOrAddition) {
      setViewMode('split');
    }
  }, [hasDualImages, isEditOrAddition]);

  const [isProcessingCanvas, setIsProcessingCanvas] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<'4k' | '2k' | 'original'>('4k');

  const containerRef = useRef<HTMLDivElement>(null);

  // Realistic progress simulation matching Fathom QP3 generation lifecycle (~18-20s)
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  useEffect(() => {
    if (!isImageLoading && activeProcessedSrc) {
      setGenerationProgress(100);
      return;
    }
    if (isImageLoading) {
      setGenerationProgress(8);
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 95) return Math.min(97, prev + 0.2);
          if (prev >= 80) return prev + 0.8;
          if (prev >= 50) return prev + 1.8;
          if (prev >= 20) return prev + 2.5;
          return prev + 3.5;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isImageLoading, activeProcessedSrc]);

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
    const elapsedSinceLast = Date.now() - lastGenerationTimeRef.current;
    if (elapsedSinceLast < 20000 && activeProcessedSrc) {
      incidentDiagnosticService.trackImageEvent(
        'IMAGE_FRICTION_REVARIATION',
        {
          errorMessage: 'User triggered new variation within 20s of generation (aesthetic dissatisfaction or friction)',
          errorCode: 'USER_RAPID_REVARIATION',
          userPrompt: data.prompt ? data.prompt.slice(0, 150) : undefined,
          severity: 'LOW',
          metadata: {
            elapsed_ms: elapsedSinceLast,
            aspect_ratio: selectedRatio,
            previous_seed: seed
          }
        }
      );
    }
    lastGenerationTimeRef.current = Date.now();
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    setMuseImageUrl(null);
    setLoadError(false);
    setIsImageLoading(true);
  }, [activeProcessedSrc, data.prompt, selectedRatio, seed]);

  const handleRatioChange = useCallback((ratio: string) => {
    setSelectedRatio(ratio);
    setNaturalDimensions(null);
    setMuseImageUrl(null);
    setLoadError(false);
    setIsImageLoading(true);
  }, []);

  const handleImageLoaded = (e?: React.SyntheticEvent<HTMLImageElement>) => {
    setIsImageLoading(false);
    setLoadError(false);
    if (e?.currentTarget) {
      const nw = e.currentTarget.naturalWidth;
      const nh = e.currentTarget.naturalHeight;
      if (nw > 0 && nh > 0) {
        setNaturalDimensions({ width: nw, height: nh });
      }
    }
  };

  // Synchronize natural dimensions whenever activeProcessedSrc changes
  useEffect(() => {
    if (!activeProcessedSrc) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = activeProcessedSrc;
  }, [activeProcessedSrc]);

  const handleImageError = () => {
    setIsImageLoading(false);
    setLoadError(true);
    incidentDiagnosticService.trackImageEvent(
      'IMAGE_RENDER_DEFECT',
      {
        errorMessage: 'HTMLImageElement failed to render image URI in browser',
        errorCode: 'IMAGE_RENDER_FAILED',
        userPrompt: data.prompt ? data.prompt.slice(0, 150) : undefined,
        severity: 'MEDIUM',
        metadata: {
          uri_type: activeProcessedSrc?.startsWith('data:') ? 'base64' : activeProcessedSrc?.startsWith('blob:') ? 'blob' : 'http_url',
          uri_preview: activeProcessedSrc ? activeProcessedSrc.slice(0, 100) : null,
          aspect_ratio: selectedRatio
        }
      }
    );
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
      const imgW = img.naturalWidth || 1024;
      const imgH = img.naturalHeight || 1024;
      const targetAspect = (imgW && imgH) ? (imgW / imgH) : (currentDimensions.width / currentDimensions.height);

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

    } catch (err: any) {
      incidentDiagnosticService.trackImageEvent(
        'IMAGE_DOWNLOAD_FAILURE',
        {
          errorMessage: err?.message || 'Failed to export image canvas',
          errorCode: 'CANVAS_DOWNLOAD_ERROR',
          severity: 'MEDIUM',
          metadata: {
            targetTier,
            uri_preview: activeProcessedSrc ? activeProcessedSrc.slice(0, 100) : null
          }
        }
      );
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
        "my-2.5 sm:my-3.5 rounded-2xl border border-white/[0.08] bg-zinc-950/80 backdrop-blur-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none",
        cardMaxWidthClass,
        isFullscreen && "fixed inset-0 z-[150] m-0 rounded-none bg-black/98 backdrop-blur-2xl flex flex-col max-w-none",
        className
      )}
      dir="rtl"
    >
      {/* ── 1. Header Toolbar (Ultra-Minimal Sleek Glassmorphism) ────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/[0.02] border-b border-white/[0.06] overflow-hidden">
        {/* Title & Image Specs */}
        <div className="flex items-center gap-2 min-w-0 shrink overflow-hidden" dir="rtl">
          <div className="size-6 sm:size-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-300">
            <Quant3PerfectionIcon size={14} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <span className="hidden sm:inline font-mono text-xs font-semibold tracking-wider text-zinc-100 whitespace-nowrap">
              FATHOM QUANT 3
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold whitespace-nowrap">
              FATHOM QP3
            </span>
            <span className="text-zinc-600 text-[10px]">•</span>
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 whitespace-nowrap" dir="ltr">
              {currentDimensions.width}×{currentDimensions.height}
            </span>
            {selectedRatio && (
              <>
                <span className="text-zinc-600 text-[10px] hidden xs:inline">•</span>
                <span className="text-[10px] font-mono text-zinc-500 hidden xs:inline" dir="ltr">
                  {selectedRatio}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Dual Image View Mode Switcher (if both original & processed exist) */}
          {hasDualImages && (
            <div className="flex items-center bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  "flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[30px]",
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
                  "flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[30px]",
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
                  "flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[30px]",
                  viewMode === 'original' ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
                title="الصورة الأصلية قبل التعديل"
              >
                <History className="size-3" />
                <span className="hidden sm:inline">الأصلية</span>
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
            title={isFullscreen ? "تصغير النافذة" : "تكبير ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4" /> : <Maximize2 className="size-3.5 sm:size-4" />}
          </button>
        </div>
      </div>

      {/* Dynamic Title Bar */}
      {data.title && (
        <div className="px-3 sm:px-4 py-1.5 bg-white/[0.015] border-b border-white/[0.05] flex items-center justify-between gap-2 select-text" dir="rtl">
          <span className="text-xs font-sans font-medium text-zinc-200 truncate">
            {data.title}
          </span>
          {data.description && (
            <span className="text-[11px] font-sans text-zinc-400 hidden md:inline truncate max-w-[55%]">
              {data.description}
            </span>
          )}
        </div>
      )}

      {/* ── 2. Main Visual Display Viewport (Clean Deep Black Background) ───────── */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden flex items-center justify-center bg-[#040406] select-none transition-all duration-300 w-full",
          isFullscreen ? "flex-1 min-h-0 w-full" : "w-full min-h-[320px]"
        )}
        style={isFullscreen ? undefined : {
          aspectRatio: `${currentDimensions.width} / ${currentDimensions.height}`,
          maxHeight: '78vh'
        }}
      >
        {/* Subtle background preview of original image during edit/addition processing */}
        {isEditOrAddition && originalSrc && !activeProcessedSrc && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none opacity-30 blur-sm scale-105 transition-all">
            <img
              src={originalSrc}
              alt="معاينة الصورة الأصلية"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Loading / Streaming Overlay with clean, authentic Progress Bar */}
        {isImageLoading && !activeProcessedSrc && !loadError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#040406]/95 backdrop-blur-xl gap-4 p-8 text-center select-none" dir="rtl">
            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              {/* Header row with status and percentage */}
              <div className="flex items-center justify-between w-full text-xs text-zinc-400 font-sans px-0.5" dir="rtl">
                <span className="text-[11.5px] font-sans text-zinc-300 font-medium">
                  {operationInfo.type === 'addition' ? 'جارٍ إضافة العناصر...' : operationInfo.type === 'edit' ? 'جارٍ التعديل البصري...' : 'جارٍ المعالجة البصرية...'}
                </span>
                <span className="font-mono font-bold text-zinc-100 text-xs" dir="ltr">{Math.min(99, Math.round(generationProgress))}%</span>
              </div>

              {/* Standard Minimal Progress Bar (Zero glowing/neon, pure clean aesthetic) */}
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-200 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>

              {/* Dynamic contextual stage text */}
              <div className="text-xs font-sans text-zinc-300 font-medium mt-1">
                {generationProgress < 20
                  ? 'تحليل وتفكيك عناصر المشهد...'
                  : generationProgress < 50
                    ? 'معالجة التوليد العصبي عالي الدقة...'
                    : generationProgress < 85
                      ? 'تطبيق التفاصيل والإضاءة الواقعية...'
                      : 'إنهاء ترميز الصورة فائقة الدقة...'}
              </div>
            </div>
          </div>
        )}

        {/* Single Processed View */}
        {(!hasDualImages || viewMode === 'processed') && (
          <div className="relative w-full h-full flex items-center justify-center">
            {loadError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-zinc-400">
                <AlertCircle className="size-7 text-amber-400" />
                <span className="text-xs sm:text-sm font-sans text-zinc-300">تعذر إتمام المعالجة البصرية حالياً</span>
                <button
                  type="button"
                  onClick={() => {
                    setMuseImageUrl(null);
                    setLoadError(false);
                    setIsImageLoading(true);
                    setRetryCount((c) => c + 1);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.15] text-xs flex items-center gap-1.5 transition font-sans cursor-pointer active:scale-95"
                >
                  <RefreshCw className="size-3.5 text-zinc-200" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            ) : activeProcessedSrc ? (
              <img
                src={activeProcessedSrc}
                alt={data.title || (operationInfo.type === 'addition' ? "صورة مضاف إليها عناصر" : operationInfo.type === 'edit' ? "صورة معدلة عصبياً" : "صورة فوتوغرافية فائقة")}
                onLoad={handleImageLoaded}
                onError={handleImageError}
                className="max-w-full max-h-full w-auto h-auto object-contain mx-auto shadow-2xl transition-all duration-300"
                style={{ imageRendering: '-webkit-optimize-contrast' as any }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-zinc-400">
                <Sparkles className="size-6 animate-spin text-zinc-400" />
                <span className="text-xs sm:text-sm font-sans text-zinc-400">جارٍ استعراض الصورة...</span>
              </div>
            )}
          </div>
        )}

        {/* Single Original View */}
        {hasDualImages && viewMode === 'original' && originalSrc && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={originalSrc}
              alt="الصورة الأصلية"
              className="max-w-full max-h-full w-auto h-auto object-contain mx-auto shadow-2xl transition-all duration-300"
              style={{ imageRendering: '-webkit-optimize-contrast' as any }}
            />
          </div>
        )}

        {/* Interactive Split Comparison Slider (Strict Image Aspect Ratio & Millimeter Precision) */}
        {hasDualImages && viewMode === 'split' && originalSrc && (
          <div
            className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-ew-resize touch-none"
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
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
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
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
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

      {/* ── 3. Unified Action Footer Dock (Clean Deep Black Glassmorphism) ── */}
      <div className="px-3 sm:px-4 py-2.5 bg-black/40 border-t border-white/[0.06] flex flex-col gap-2">
        {/* Row 1: Resolution Config Dock */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Resolution Selector: 4K | 2K | HD */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
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

        {/* Row 2: Streamlined Full-Width Glassmorphism Action Bar */}
        <div className="w-full">
          {/* Primary Full-Width Download Button */}
          <button
            type="button"
            onClick={() => handleDownload(selectedQuality)}
            disabled={isProcessingCanvas}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-sans font-semibold shadow-lg shadow-black/40 border border-white/[0.12] backdrop-blur-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
