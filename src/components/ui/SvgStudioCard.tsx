import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Eye, 
  Code, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Palette, 
  FileCode, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightCode } from '@/lib/syntaxHighlighter';

export interface SvgStudioCardProps {
  svgCode: string;
  className?: string;
  isStreaming?: boolean;
  title?: string;
}

type CanvasBgType = 'transparent' | 'dark' | 'white' | 'slate' | 'gradient';
type ExportScale = 1 | 2 | 4;

interface SvgMetrics {
  width: number;
  height: number;
  viewBox: string;
  elementCount: number;
  sizeBytes: number;
  aspectRatio: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts and sanitizes raw SVG code from markdown or text
 */
function extractAndSanitizeSvg(rawText: string): { cleanSvg: string; isComplete: boolean } {
  let text = (rawText || '').trim();

  // Strip code fences if present
  const codeBlockMatch = /```(?:svg|xml|html|markup)?\s*([\s\S]*?)```/i.exec(text);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Extract from <svg to </svg>
  const svgStartIndex = text.indexOf('<svg');
  if (svgStartIndex === -1) {
    return { cleanSvg: text, isComplete: false };
  }

  const svgEndIndex = text.lastIndexOf('</svg>');
  if (svgEndIndex === -1) {
    // Incomplete or streaming SVG
    const partial = text.substring(svgStartIndex).trim();
    return { cleanSvg: partial, isComplete: false };
  }

  const fullSvg = text.substring(svgStartIndex, svgEndIndex + 6).trim();
  return { cleanSvg: fullSvg, isComplete: true };
}

/**
 * Normalizes SVG DOM attributes (ensures xmlns, viewBox, responsive width/height)
 */
function normalizeSvgXml(rawSvg: string): { normalizedSvg: string; metrics: SvgMetrics } {
  const defaultMetrics: SvgMetrics = {
    width: 800,
    height: 600,
    viewBox: '0 0 800 600',
    elementCount: 0,
    sizeBytes: new Blob([rawSvg]).size,
    aspectRatio: '4:3',
    isValid: false
  };

  if (typeof window === 'undefined' || !rawSvg) {
    return { normalizedSvg: rawSvg, metrics: defaultMetrics };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');

    if (parserError) {
      return {
        normalizedSvg: rawSvg,
        metrics: {
          ...defaultMetrics,
          error: parserError.textContent || 'خطأ في بنية كود الـ SVG'
        }
      };
    }

    const svgEl = doc.documentElement;
    if (svgEl.tagName.toLowerCase() !== 'svg') {
      return {
        normalizedSvg: rawSvg,
        metrics: { ...defaultMetrics, error: 'العنصر الجذري ليس وسم SVG صالح' }
      };
    }

    // Ensure core namespaces
    if (!svgEl.getAttribute('xmlns')) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!svgEl.getAttribute('xmlns:xlink')) {
      svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    // Extract or synthesize viewBox
    let viewBox = svgEl.getAttribute('viewBox');
    let width = 800;
    let height = 600;

    const widthAttr = svgEl.getAttribute('width');
    const heightAttr = svgEl.getAttribute('height');

    const numWidth = widthAttr ? parseFloat(widthAttr) : NaN;
    const numHeight = heightAttr ? parseFloat(heightAttr) : NaN;

    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
        width = Math.round(parts[2]);
        height = Math.round(parts[3]);
      }
    } else if (!isNaN(numWidth) && !isNaN(numHeight) && numWidth > 0 && numHeight > 0) {
      viewBox = `0 0 ${numWidth} ${numHeight}`;
      svgEl.setAttribute('viewBox', viewBox);
      width = Math.round(numWidth);
      height = Math.round(numHeight);
    } else {
      viewBox = '0 0 800 600';
      svgEl.setAttribute('viewBox', viewBox);
      width = 800;
      height = 600;
    }

    // Ensure responsive attributes for container rendering
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Count child graphical elements
    const elementCount = svgEl.querySelectorAll('path, circle, rect, polygon, polyline, ellipse, line, text, g').length;

    // Aspect ratio description
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height) || 1;
    const ratioW = Math.round(width / divisor);
    const ratioH = Math.round(height / divisor);
    const aspectRatio = ratioW <= 16 && ratioH <= 16 ? `${ratioW}:${ratioH}` : `${(width / height).toFixed(2)}:1`;

    const serializer = new XMLSerializer();
    const normalizedSvg = serializer.serializeToString(svgEl);

    return {
      normalizedSvg,
      metrics: {
        width,
        height,
        viewBox: viewBox || `0 0 ${width} ${height}`,
        elementCount,
        sizeBytes: new Blob([normalizedSvg]).size,
        aspectRatio,
        isValid: true
      }
    };
  } catch (err: any) {
    return {
      normalizedSvg: rawSvg,
      metrics: {
        ...defaultMetrics,
        error: err?.message || 'تعذر تحليل ومعالجة كود الـ SVG'
      }
    };
  }
}

export const SvgStudioCard: React.FC<SvgStudioCardProps> = ({
  svgCode,
  className,
  isStreaming = false,
  title = 'استوديو الفيكتور والتصميم الذكي — SVG Studio'
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [canvasBg, setCanvasBg] = useState<CanvasBgType>('dark');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exportScale, setExportScale] = useState<ExportScale>(2);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPng, setCopiedPng] = useState<boolean>(false);
  const [copiedDataUrl, setCopiedDataUrl] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [exportBgMode, setExportBgMode] = useState<'transparent' | 'solid'>('transparent');

  // Extract and normalize SVG
  const { cleanSvg, isComplete } = useMemo(() => {
    return extractAndSanitizeSvg(svgCode);
  }, [svgCode]);

  const { normalizedSvg, metrics } = useMemo(() => {
    return normalizeSvgXml(cleanSvg);
  }, [cleanSvg]);

  // Syntax-highlighted code for the Code tab
  const highlightedCodeHtml = useMemo(() => {
    return highlightCode(cleanSvg, 'markup');
  }, [cleanSvg]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2)))), []);
  const handleZoomOut = useCallback(() => setZoomLevel((z) => Math.max(0.25, Number((z - 0.25).toFixed(2)))), []);
  const handleResetZoom = useCallback(() => setZoomLevel(1), []);

  // Background color helper
  const getCanvasBgClass = (bg: CanvasBgType): string => {
    switch (bg) {
      case 'transparent':
        return 'svg-checkerboard-bg';
      case 'white':
        return 'bg-white text-zinc-900';
      case 'slate':
        return 'bg-[#182030] text-white';
      case 'gradient':
        return 'bg-gradient-to-br from-[#0c1222] via-[#1a1435] to-[#2b0e33] text-white';
      case 'dark':
      default:
        return 'bg-[#080b12] text-white';
    }
  };

  const getCanvasSolidColor = (bg: CanvasBgType): string => {
    switch (bg) {
      case 'white':
        return '#ffffff';
      case 'slate':
        return '#182030';
      case 'gradient':
        return '#131127';
      case 'dark':
      default:
        return '#080b12';
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // High-Resolution & Flawless SVG to PNG Converter Engine
  // ───────────────────────────────────────────────────────────────────────────
  const generatePngBlob = useCallback(
    async (scale: ExportScale, bgMode: 'transparent' | 'solid'): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(normalizedSvg, 'image/svg+xml');
          const svgEl = doc.documentElement;

          const targetWidth = Math.round(metrics.width * scale);
          const targetHeight = Math.round(metrics.height * scale);

          // Force explicit pixel dimensions for pristine rasterization
          svgEl.setAttribute('width', targetWidth.toString());
          svgEl.setAttribute('height', targetHeight.toString());
          if (!svgEl.getAttribute('viewBox')) {
            svgEl.setAttribute('viewBox', metrics.viewBox);
          }

          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(svgEl);

          const svgBlob = new Blob([xmlString], { type: 'image/svg+xml;charset=utf-8' });
          const blobUrl = URL.createObjectURL(svgBlob);

          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });

              if (!ctx) {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('تعذر إنشاء سياق رسم الـ Canvas'));
                return;
              }

              // Highest quality anti-aliasing
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              // Apply background
              if (bgMode === 'solid') {
                ctx.fillStyle = getCanvasSolidColor(canvasBg);
                ctx.fillRect(0, 0, targetWidth, targetHeight);
              } else {
                ctx.clearRect(0, 0, targetWidth, targetHeight);
              }

              // Render SVG onto Canvas
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              URL.revokeObjectURL(blobUrl);

              canvas.toBlob(
                (pngBlob) => {
                  if (pngBlob) {
                    resolve(pngBlob);
                  } else {
                    reject(new Error('فشل تصدير صورة الـ PNG من الـ Canvas'));
                  }
                },
                'image/png',
                1.0
              );
            } catch (canvasErr) {
              URL.revokeObjectURL(blobUrl);
              reject(canvasErr);
            }
          };

          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('فشل تحميل مسار الـ SVG لمعالج الرسم'));
          };

          img.src = blobUrl;
        } catch (err) {
          reject(err);
        }
      });
    },
    [normalizedSvg, metrics, canvasBg]
  );

  // Trigger PNG download
  const handleDownloadPng = async () => {
    try {
      setIsExportingPng(true);
      const pngBlob = await generatePngBlob(exportScale, exportBgMode);
      const pngUrl = URL.createObjectURL(pngBlob);

      const a = document.createElement('a');
      a.href = pngUrl;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `matany-design-${timestamp}-${exportScale}x.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
      setDownloadSuccess(`تم تنزيل صورة PNG (${exportScale}x) بنجاح!`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err: any) {
      console.error('[SVG Studio] Error downloading PNG:', err);
      alert(err?.message || 'حدث خطأ أثناء تنزيل الـ PNG. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Direct PNG Copy to Clipboard
  const handleCopyPngToClipboard = async () => {
    try {
      if (!navigator.clipboard || !(window as any).ClipboardItem) {
        throw new Error('متصفحك لا يدعم نسخ الصور مباشرة إلى الحافظة');
      }
      setIsExportingPng(true);
      const pngBlob = await generatePngBlob(exportScale, exportBgMode);
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2500);
    } catch (err: any) {
      console.error('[SVG Studio] Error copying PNG:', err);
      alert(err?.message || 'تعذر نسخ الصورة إلى الحافظة مباشرة.');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Trigger SVG file download
  const handleDownloadSvg = () => {
    try {
      const blob = new Blob([normalizedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `matany-vector-${timestamp}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDownloadSuccess('تم تنزيل ملف الـ SVG الفيكتور بنجاح!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err: any) {
      console.error('[SVG Studio] Error downloading SVG:', err);
    }
  };

  // Copy SVG Source Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanSvg);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy SVG Data URL (for CSS/HTML inline usage)
  const handleCopyDataUrl = () => {
    const encoded = encodeURIComponent(normalizedSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    const dataUrl = `data:image/svg+xml;utf8,${encoded}`;
    navigator.clipboard.writeText(dataUrl);
    setCopiedDataUrl(true);
    setTimeout(() => setCopiedDataUrl(false), 2000);
  };

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // If streaming and incomplete without closing tag
  const isCurrentlyStreamingPartial = isStreaming && !isComplete;

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-white/[0.1] bg-[#07090f] overflow-hidden shadow-2xl transition-all duration-200 select-none",
        isFullscreen && "fixed inset-0 z-[150] m-0 rounded-none bg-black/95 backdrop-blur-xl flex flex-col",
        className
      )}
      dir="rtl"
    >
      {/* ── 1. Header Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.08]">
        {/* Title & Vector Info Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="size-4 text-pink-400 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-sans font-bold text-white tracking-wide truncate">
                {title}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                VECTOR ENGINE
              </span>
            </div>
            {metrics.isValid && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>{metrics.width}×{metrics.height}px</span>
                <span>•</span>
                <span>{metrics.aspectRatio}</span>
                <span>•</span>
                <span>{(metrics.sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tab Switcher: Preview vs Code */}
          <div className="flex items-center bg-white/[0.06] p-0.5 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'preview'
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Eye className="size-3.5" />
              <span>المعاينة</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'code'
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Code className="size-3.5" />
              <span>الكود</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            title={isFullscreen ? "تصغير النافذة" : "تكبير ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* ── 2. Canvas Controls Sub-Toolbar (Active in Preview Tab) ────────── */}
      {activeTab === 'preview' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-black/40 border-b border-white/[0.05] text-xs">
          {/* Canvas Background Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-sans text-[11px] ml-1">خلفية الاستوديو:</span>
            {(['transparent', 'dark', 'white', 'slate', 'gradient'] as CanvasBgType[]).map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setCanvasBg(bg)}
                className={cn(
                  "size-5 rounded-md border transition-all cursor-pointer relative",
                  bg === 'transparent' && "svg-checkerboard-sample border-white/20",
                  bg === 'dark' && "bg-[#080b12] border-white/20",
                  bg === 'white' && "bg-white border-zinc-300",
                  bg === 'slate' && "bg-[#182030] border-white/20",
                  bg === 'gradient' && "bg-gradient-to-tr from-purple-700 to-pink-500 border-white/20",
                  canvasBg === bg && "ring-2 ring-pink-500 ring-offset-1 ring-offset-black scale-110"
                )}
                title={bg}
              />
            ))}
          </div>

          {/* Zoom & Inspection Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="font-mono text-[11px] text-zinc-300 px-1.5 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="إعادة ضبط الحجم الطبيعي 100%"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Main Stage / Content Area ─────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center min-h-[340px] sm:min-h-[420px] transition-colors",
          isFullscreen ? "flex-1" : "max-h-[70vh]",
          activeTab === 'preview' ? getCanvasBgClass(canvasBg) : "bg-[#06080d]"
        )}
      >
        {activeTab === 'preview' ? (
          isCurrentlyStreamingPartial ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center animate-pulse">
              <div className="size-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shadow-lg">
                <Sparkles className="size-6 text-pink-400 animate-spin" />
              </div>
              <div className="text-sm font-sans font-bold text-white">
                جاري رسم وتوليد متجهات الـ SVG الفائقة...
              </div>
              <div className="text-xs text-zinc-400 font-sans max-w-sm">
                يتم بناء كود الفيكتور الرياضي والتدرجات الآن؛ ستظهر المعاينة بدقة متناهية فور اكتمال التوليد.
              </div>
            </div>
          ) : metrics.error ? (
            <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center text-amber-400">
              <AlertCircle className="size-8 text-amber-400" />
              <div className="text-sm font-bold font-sans">تنبيه بنية الـ SVG</div>
              <div className="text-xs text-zinc-400 max-w-md font-mono">{metrics.error}</div>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="mt-2 text-xs text-pink-400 hover:underline cursor-pointer"
              >
                فحص كود المصدر
              </button>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-auto select-none transition-transform duration-100 ease-out"
              style={{
                cursor: zoomLevel > 1 ? 'grab' : 'default'
              }}
            >
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxWidth: '100%',
                  maxHeight: isFullscreen ? '85vh' : '440px',
                  width: `${metrics.width}px`,
                  height: `${metrics.height}px`
                }}
                dangerouslySetInnerHTML={{ __html: normalizedSvg }}
              />
            </div>
          )
        ) : (
          /* Code View */
          <div className="w-full h-full max-h-[500px] overflow-auto p-4 font-mono text-xs text-left" dir="ltr">
            <pre className="text-zinc-200 text-xs leading-relaxed selection:bg-pink-500/30">
              <code dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
            </pre>
          </div>
        )}
      </div>

      {/* ── 4. High-Performance Action Footer ────────────────────────────── */}
      <div className="px-3 sm:px-4 py-3 bg-white/[0.02] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        {/* Left (Export Options: Resolution & Background) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution Selector: 1x, 2x, 4x */}
          <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl border border-white/[0.08]">
            <span className="text-[11px] font-sans text-zinc-400 px-1.5">الدقة:</span>
            {([1, 2, 4] as ExportScale[]).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setExportScale(scale)}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                  exportScale === scale
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
                title={scale === 1 ? 'قياسية' : scale === 2 ? 'عالية HD' : 'فائقة 4K Ultra HD'}
              >
                {scale}x
              </button>
            ))}
          </div>

          {/* Background Toggle: Transparent vs Solid */}
          <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setExportBgMode('transparent')}
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer",
                exportBgMode === 'transparent'
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              شفافة
            </button>
            <button
              type="button"
              onClick={() => setExportBgMode('solid')}
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer",
                exportBgMode === 'solid'
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              مع الخلفية
            </button>
          </div>
        </div>

        {/* Right (Download & Copy Buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download PNG Button (Main Hero Action) */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExportingPng || !metrics.isValid}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:via-rose-500 hover:to-purple-500 text-white text-xs font-sans font-bold shadow-[0_2px_14px_rgba(244,63,94,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPng ? (
              <>
                <Sparkles className="size-3.5 animate-spin text-white" />
                <span>جاري المعالجة...</span>
              </>
            ) : (
              <>
                <ImageIcon className="size-3.5" />
                <span>تنزيل PNG ({exportScale}x)</span>
              </>
            )}
          </button>

          {/* Copy PNG Image to Clipboard */}
          <button
            type="button"
            onClick={handleCopyPngToClipboard}
            disabled={isExportingPng || !metrics.isValid}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.1] text-xs font-sans font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="نسخ الصورة كـ PNG مباشرة إلى الحافظة للصقها في التصاميم"
          >
            {copiedPng ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم نسخ الصورة</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-zinc-300" />
                <span>نسخ كـ PNG</span>
              </>
            )}
          </button>

          {/* Download SVG File */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!metrics.isValid}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.1] text-xs font-sans font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="تنزيل كود الفيكتور بصيغة ملف .svg"
          >
            <Download className="size-3.5 text-zinc-300" />
            <span>تنزيل SVG</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-sans font-medium transition-all cursor-pointer active:scale-95"
            title="نسخ كود الـ XML/SVG"
          >
            {copiedCode ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم نسخ الكود</span>
              </>
            ) : (
              <>
                <FileCode className="size-3.5" />
                <span>نسخ الكود</span>
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
