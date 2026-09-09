import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  FileCode, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightCode } from '@/lib/syntaxHighlighter';
import { Quant3PerfectionIcon } from '@/components/ui/Quant3PerfectionIcon';

export interface SvgStudioCardProps {
  svgCode: string;
  className?: string;
  isStreaming?: boolean;
  title?: string;
}

export type ExportQuality = '2K' | '4K';
export type ExportFormat = 'png' | 'jpg' | 'svg';

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

export const SvgStudioCardComponent: React.FC<SvgStudioCardProps> = ({
  svgCode,
  className,
  isStreaming = false,
  title = 'FATHOM QUANT 3 • SVG STUDIO'
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>('2K');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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

  // ───────────────────────────────────────────────────────────────────────────
  // High-Resolution & Flawless Raster Converter Engine (2K & 4K | PNG & JPG)
  // ───────────────────────────────────────────────────────────────────────────
  const generateRasterBlob = useCallback(
    async (quality: ExportQuality, format: 'png' | 'jpg'): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(normalizedSvg, 'image/svg+xml');
          const svgEl = doc.documentElement;

          // Target long edge: 2K = 2048px, 4K = 3840px
          const maxDimension = quality === '4K' ? 3840 : 2048;
          const svgW = metrics.width || 800;
          const svgH = metrics.height || 600;
          const svgAspect = svgW / svgH;

          let targetWidth = maxDimension;
          let targetHeight = Math.round(maxDimension / svgAspect);
          if (svgAspect < 1) {
            targetHeight = maxDimension;
            targetWidth = Math.round(maxDimension * svgAspect);
          }
          targetWidth = Math.max(100, Math.round(targetWidth));
          targetHeight = Math.max(100, Math.round(targetHeight));

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

              if (format === 'jpg') {
                // JPG has no alpha transparency: use clean solid white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, targetWidth, targetHeight);
              } else {
                // PNG: transparent canvas
                ctx.clearRect(0, 0, targetWidth, targetHeight);
              }

              // Render SVG onto Canvas
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              URL.revokeObjectURL(blobUrl);

              const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
              const qualityFactor = format === 'jpg' ? 0.95 : 1.0;

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error(`فشل تصدير صورة الـ ${format.toUpperCase()} من الـ Canvas`));
                  }
                },
                mimeType,
                qualityFactor
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
    [normalizedSvg, metrics]
  );

  // Trigger Raster (PNG or JPG) download
  const handleDownloadRaster = async () => {
    try {
      setIsExporting(true);
      const targetFmt = exportFormat === 'jpg' ? 'jpg' : 'png';
      const blob = await generateRasterBlob(exportQuality, targetFmt);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `FathomQuant3-design-${timestamp}-${exportQuality}.${targetFmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDownloadSuccess(`تم تنزيل صورة ${targetFmt.toUpperCase()} بدقة (${exportQuality}) بنجاح!`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err: any) {
      console.error('[SVG Studio] Error downloading image:', err);
      alert(err?.message || 'حدث خطأ أثناء تنزيل الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Image Copy to Clipboard (PNG)
  const handleCopyImageToClipboard = async () => {
    try {
      if (!navigator.clipboard || !(window as any).ClipboardItem) {
        throw new Error('متصفحك لا يدعم نسخ الصور مباشرة إلى الحافظة');
      }
      setIsExporting(true);
      const pngBlob = await generateRasterBlob(exportQuality, 'png');
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err: any) {
      console.error('[SVG Studio] Error copying image:', err);
      alert(err?.message || 'تعذر نسخ الصورة إلى الحافظة مباشرة.');
    } finally {
      setIsExporting(false);
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
      a.download = `FathomQuant3-vector-${timestamp}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDownloadSuccess('تم تنزيل ملف SVG الفيكتور بنجاح!');
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

  // Primary Download Dispatcher
  const handlePrimaryDownload = async () => {
    if (exportFormat === 'svg') {
      handleDownloadSvg();
    } else {
      await handleDownloadRaster();
    }
  };

  // Secondary Copy Dispatcher
  const handleSecondaryCopy = async () => {
    if (exportFormat === 'svg') {
      handleCopyCode();
    } else {
      await handleCopyImageToClipboard();
    }
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
        "my-3 sm:my-4 rounded-2xl border border-white/[0.08] bg-[#090b11]/95 backdrop-blur-xl overflow-hidden shadow-2xl select-none",
        isFullscreen && "fixed inset-0 z-[150] m-0 rounded-none bg-black/95 backdrop-blur-2xl flex flex-col",
        className
      )}
      dir="rtl"
    >
      {/* ── 1. Header Toolbar (Official Minimal Glassmorphism) ────────────── */}
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/[0.02] border-b border-white/[0.08]">
        {/* Title & Vector Specs */}
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
                SVG STUDIO
              </span>
            </div>
            {metrics.isValid && (
              <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-400">
                <span>{metrics.width}×{metrics.height}</span>
                <span>•</span>
                <span>{metrics.aspectRatio}</span>
                <span className="hidden xs:inline">•</span>
                <span>{metrics.elementCount} عنصر</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls, Tab Switcher & Fullscreen */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom Controls (Desktop / Tablet only to prevent mobile clutter) */}
          {activeTab === 'preview' && (
            <div className="hidden sm:flex items-center gap-0.5 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="font-mono text-[11px] text-zinc-300 px-1.5 min-w-[36px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="إعادة ضبط 100%"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          )}

          {/* Tab Switcher: Preview vs Code */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'preview'
                  ? "bg-white/[0.1] text-white shadow-sm"
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
                "flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'code'
                  ? "bg-white/[0.1] text-white shadow-sm"
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
            {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4" /> : <Maximize2 className="size-3.5 sm:size-4" />}
          </button>
        </div>
      </div>

      {/* ── 2. Main Stage / Content Area (Proportional, Uncompressed & Responsive) ──────── */}
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center transition-all duration-300",
          isFullscreen 
            ? "flex-1 min-h-0 w-full" 
            : "w-full min-h-[320px] sm:min-h-[420px] md:min-h-[500px] max-h-[75vh]",
          activeTab === 'preview' ? "svg-checkerboard-bg" : "bg-[#05070b]"
        )}
      >
        {activeTab === 'preview' ? (
          isCurrentlyStreamingPartial ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
              <div className="size-11 sm:size-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shadow-lg text-zinc-200">
                <Sparkles className="size-5 sm:size-6 text-zinc-200 animate-spin" />
              </div>
              <div className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
                جاري رسم وتوليد متجهات الفيكتور بدقة...
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-400 font-sans max-w-xs">
                يتم بناء شفرة التصميم والأشكال المتجهة والتدرجات؛ ستظهر المعاينة فور اكتمال التوليد.
              </div>
            </div>
          ) : metrics.error ? (
            <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center text-amber-400">
              <AlertCircle className="size-7 text-amber-400" />
              <div className="text-xs sm:text-sm font-bold font-sans">تنبيه في بنية الـ SVG</div>
              <div className="text-[11px] text-zinc-400 max-w-md font-mono">{metrics.error}</div>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="mt-2 text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                فحص كود المصدر
              </button>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
              style={{
                cursor: zoomLevel > 1 ? 'grab' : 'default'
              }}
            >
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center shadow-2xl rounded-xl"
                style={{
                  transform: `scale(${zoomLevel})`,
                  aspectRatio: `${metrics.width} / ${metrics.height}`,
                  width: `${metrics.width}px`,
                  maxWidth: '100%',
                  maxHeight: isFullscreen ? 'calc(100vh - 140px)' : '68vh'
                }}
                dangerouslySetInnerHTML={{ __html: normalizedSvg }}
              />
            </div>
          )
        ) : (
          /* Code View */
          <div className="w-full h-full overflow-auto p-3 sm:p-4 font-mono text-xs text-left" dir="ltr">
            <div className="flex items-center justify-end pb-2 mb-2 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy SVG XML'}</span>
              </button>
            </div>
            <pre className="text-zinc-200 text-xs leading-relaxed selection:bg-cyan-500/30">
              <code dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
            </pre>
          </div>
        )}
      </div>

      {/* ── 3. Unified Action Footer Dock (Clean, Organized, Mobile-First) ── */}
      <div className="px-3.5 sm:px-5 py-3 bg-[#0a0d14]/95 border-t border-white/[0.08] flex flex-col gap-2.5">
        {/* Row 1: Unified Config Dock (Format & Quality) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Format Selector: PNG | JPG | SVG */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 sm:p-1 rounded-xl border border-white/[0.07]">
            <span className="text-[10px] sm:text-[11px] font-sans font-medium text-zinc-400 px-1.5">الصيغة:</span>
            {(['png', 'jpg', 'svg'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={cn(
                  "px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase transition-all cursor-pointer",
                  exportFormat === fmt
                    ? "bg-white/[0.12] text-white border border-white/[0.2] shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                )}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Resolution Selector: 2K vs 4K (Shown for Raster PNG/JPG) */}
          {exportFormat !== 'svg' ? (
            <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 sm:p-1 rounded-xl border border-white/[0.07]">
              <span className="text-[10px] sm:text-[11px] font-sans font-medium text-zinc-400 px-1.5">الدقة:</span>
              {(['2K', '4K'] as ExportQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setExportQuality(q)}
                  className={cn(
                    "px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer",
                    exportQuality === q
                      ? "bg-white/[0.12] text-white border border-white/[0.2] shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                  )}
                  title={q === '2K' ? 'دقة 2K فائقة (2048px)' : 'دقة 4K فائقة الوضوح (3840px)'}
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-white/[0.02] px-2.5 py-1 rounded-xl border border-white/[0.05]">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>فيكتور هندسي نقي</span>
            </div>
          )}
        </div>

        {/* Row 2: Streamlined 2-Button Action Bar (100% Mobile Responsive) */}
        <div className="flex items-center gap-2">
          {/* Primary Download Button */}
          <button
            type="button"
            onClick={handlePrimaryDownload}
            disabled={isExporting || !metrics.isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-sans font-bold shadow-lg shadow-black/40 border border-white/[0.14] backdrop-blur-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Sparkles className="size-4 animate-spin text-zinc-300" />
                <span>جاري معالجة الصورة...</span>
              </>
            ) : (
              <>
                <Download className="size-4 text-zinc-200" />
                <span>
                  {exportFormat === 'svg'
                    ? 'تنزيل ملف SVG'
                    : `تنزيل ${exportFormat.toUpperCase()} (${exportQuality})`}
                </span>
              </>
            )}
          </button>

          {/* Secondary Action: Copy Image or Copy Code */}
          <button
            type="button"
            onClick={handleSecondaryCopy}
            disabled={isExporting || !metrics.isValid}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs sm:text-sm font-sans font-medium transition-all cursor-pointer active:scale-[0.99] shrink-0"
            title={exportFormat === 'svg' ? "نسخ كود الـ SVG" : "نسخ الصورة كـ PNG مباشرة إلى الحافظة"}
          >
            {(exportFormat === 'svg' ? copiedCode : copiedImage) ? (
              <>
                <Check className="size-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-zinc-300" />
                <span>{exportFormat === 'svg' ? 'نسخ الكود' : 'نسخ الصورة'}</span>
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

export const SvgStudioCard = React.memo(SvgStudioCardComponent);

