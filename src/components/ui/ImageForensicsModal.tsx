import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Compass, 
  Calendar, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Search, 
  X, 
  FileSearch, 
  Sliders, 
  HardDrive,
  Info,
  Sparkles,
  Lock,
  Eye,
  Crosshair
} from 'lucide-react';
import { 
  ImageForensicsResult, 
  extractImageForensics, 
  stripImageMetadata, 
  RawTagItem 
} from '@/lib/imageForensics';
import { formatFileSize } from '@/lib/mediaExtractor';
import { cn } from '@/lib/utils';

interface ImageForensicsModalProps {
  imageSrc: string | File | Blob | null;
  isOpen: boolean;
  onClose: () => void;
  onSanitizedImageReady?: (sanitizedDataUrl: string) => void;
}

export const ImageForensicsModal: React.FC<ImageForensicsModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onSanitizedImageReady
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'camera' | 'gps' | 'raw'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [forensics, setForensics] = useState<ImageForensicsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [tagCategoryFilter, setTagCategoryFilter] = useState<string>('ALL');
  const [isStripping, setIsStripping] = useState<boolean>(false);
  const [stripSuccess, setStripSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setForensics(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setStripSuccess(false);

    extractImageForensics(imageSrc)
      .then((res) => {
        if (isMounted) {
          setForensics(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('فشل استخراج الميتاداتا: ' + (err.message || 'الملف تالف أو غير مدعوم'));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, imageSrc]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStripAndDownload = async () => {
    if (!imageSrc) return;
    setIsStripping(true);
    try {
      const sanitized = await stripImageMetadata(imageSrc);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = sanitized.dataUrl;
      a.download = `sanitized_${forensics?.fileName || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStripSuccess(true);
      if (onSanitizedImageReady) {
        onSanitizedImageReady(sanitized.dataUrl);
      }
    } catch (err: any) {
      alert('فشل تطهير الميتاداتا: ' + err.message);
    } finally {
      setIsStripping(false);
    }
  };

  if (!isOpen) return null;

  const filteredRawTags = forensics?.rawTags.filter((tag) => {
    const matchesCategory = tagCategoryFilter === 'ALL' || tag.category === tagCategoryFilter;
    const matchesSearch = 
      !searchFilter || 
      tag.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
      tag.value.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            مخاطر حرجة (موقع مكشوف)
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            تحذير أمني (بصمة عتاد)
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            مستوى منخفض (معلومات عادية)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            آمن ومطهر (خالٍ من الميتاداتا)
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#090b12] border border-white/[0.12] shadow-[0_24px_70px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden text-zinc-100"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
                <FileSearch className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-sans text-white">
                    الفحص الجنائي الرقمي وميتاداتا الصورة
                  </h3>
                  {forensics && getRiskBadge(forensics.security.riskLevel)}
                </div>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  استخراج وتحليل وسوم EXIF, IPTC, XMP، كشف العتاد، وإحداثيات الـ GPS
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-2 border-b border-white/[0.06] overflow-x-auto no-scrollbar bg-black/20 text-xs font-sans font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                activeTab === 'overview'
                  ? "bg-white/10 text-white font-bold border border-white/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>نظرة عامة والمخاطر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                activeTab === 'camera'
                  ? "bg-white/10 text-white font-bold border border-white/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>العتاد والكاميرا</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gps')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                activeTab === 'gps'
                  ? "bg-white/10 text-white font-bold border border-white/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>الموقع الجغرافي (GPS)</span>
              {forensics?.gps.hasGps && (
                <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                activeTab === 'raw'
                  ? "bg-white/10 text-white font-bold border border-white/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>جميع الوسوم الخام ({forensics?.rawTags.length || 0})</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 select-text no-scrollbar">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-xs text-zinc-400 font-sans">
                  جاري فك تشفير وفحص وسوم EXIF و IPTC و XMP واستخراج الإحداثيات...
                </p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-center text-sm space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <div className="font-bold">{error}</div>
              </div>
            ) : forensics ? (
              <>
                {/* 1. Overview & Security Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* Security Alert Banner */}
                    <div className={cn(
                      "p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-right",
                      forensics.security.riskLevel === 'CRITICAL'
                        ? "bg-rose-950/30 border-rose-500/40 text-rose-100"
                        : forensics.security.riskLevel === 'WARNING'
                        ? "bg-amber-950/30 border-amber-500/40 text-amber-100"
                        : "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                    )}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          {forensics.security.riskLevel === 'CRITICAL' ? (
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                          ) : forensics.security.riskLevel === 'WARNING' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          <span>تقرير الأمان الجنائي الرقمي (درجة المخاطرة: {forensics.security.riskScore}/100)</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                          {forensics.security.summary}
                        </p>
                      </div>

                      {/* Sanitize & Strip EXIF Button */}
                      <button
                        type="button"
                        onClick={handleStripAndDownload}
                        disabled={isStripping}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-sans flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {isStripping ? (
                          <>
                            <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>جاري التطهير...</span>
                          </>
                        ) : stripSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>تم التحميل بنجاح</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>تطهير وتنزيل نسخة آمنة</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Metadata Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-right">
                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-zinc-400 font-sans">الكاميرا / الجهاز</span>
                        <div className="text-xs font-bold text-white truncate">
                          {forensics.camera.make || forensics.camera.model ? `${forensics.camera.make || ''} ${forensics.camera.model || ''}` : 'غير معروف'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-zinc-400 font-sans">الأبعاد والدقة</span>
                        <div className="text-xs font-bold text-white font-mono dir-ltr text-right">
                          {forensics.imageWidth ? `${forensics.imageWidth}x${forensics.imageHeight} (${forensics.megapixels})` : 'غير متوفر'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-zinc-400 font-sans">تاريخ الالتقاط</span>
                        <div className="text-xs font-bold text-white font-mono truncate dir-ltr text-right">
                          {forensics.rights.originalDate || forensics.rights.createDate || 'غير مسجل'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                        <span className="text-[10px] text-zinc-400 font-sans">الموقع الجغرافي (GPS)</span>
                        <div className="text-xs font-bold truncate">
                          {forensics.gps.hasGps ? (
                            <span className="text-rose-400 flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3" />
                              {forensics.gps.latitude?.toFixed(3)}, {forensics.gps.longitude?.toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-emerald-400">محمي (غير مكشوف)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Security Findings */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-zinc-300 font-sans flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>الملاحظات الأمنية ونقاط الانكشاف الجنائي</span>
                      </h4>

                      <div className="space-y-2">
                        {forensics.security.findings.map((finding, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "p-3.5 rounded-2xl border text-right space-y-1",
                              finding.level === 'CRITICAL'
                                ? "bg-rose-950/20 border-rose-500/30"
                                : finding.level === 'WARNING'
                                ? "bg-amber-950/20 border-amber-500/30"
                                : "bg-white/[0.02] border-white/[0.08]"
                            )}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className={cn(
                                finding.level === 'CRITICAL' ? "text-rose-300" : finding.level === 'WARNING' ? "text-amber-300" : "text-zinc-200"
                              )}>
                                {finding.title}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                                {finding.level}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              {finding.description}
                            </p>
                            {finding.recommendation && (
                              <p className="text-[11px] text-zinc-500 pt-1 font-sans border-t border-white/[0.04]">
                                نصيحة: {finding.recommendation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Camera & Hardware Tab */}
                {activeTab === 'camera' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      <div className="p-3.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-sans flex items-center gap-2">
                          <Camera className="w-4 h-4 text-cyan-400" />
                          <span>عتاد التصوير والمستشعر البصري</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {forensics.camera.make || 'Standard Device'}
                        </span>
                      </div>

                      <div className="divide-y divide-white/[0.06] text-xs font-sans">
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-zinc-400">الشركة المصنعة (Make):</span>
                          <span className="font-bold text-white">{forensics.camera.make || 'غير متوفر'}</span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-zinc-400">طراز الكاميرا/الهاتف (Model):</span>
                          <span className="font-bold text-white">{forensics.camera.model || 'غير متوفر'}</span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-zinc-400">نظام التشغيل/السوفتوير (Software):</span>
                          <span className="font-mono text-zinc-200 dir-ltr">{forensics.camera.software || 'غير متوفر'}</span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-zinc-400">موديل العدسة (Lens Model):</span>
                          <span className="font-mono text-zinc-200 dir-ltr">{forensics.camera.lensModel || 'غير متوفر'}</span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-zinc-400">الرقم التسلسلي للجهاز (Serial Number):</span>
                          <span className="font-mono text-amber-300 dir-ltr">{forensics.camera.serialNumber || 'غير مكشوف'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      <div className="p-3.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-sans flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-400" />
                          <span>إعدادات التعريض والبصريات (Exposure & Optics)</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 text-xs font-sans">
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">حساسية الضوء (ISO)</span>
                          <div className="font-mono font-bold text-white">{forensics.camera.iso || 'تلقائي'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">سرعة الغالق (Shutter Speed)</span>
                          <div className="font-mono font-bold text-white">{forensics.camera.exposureTime || 'غير محدد'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">فتحة العدسة (Aperture / F-Stop)</span>
                          <div className="font-mono font-bold text-white">{forensics.camera.aperture ? `f/${forensics.camera.aperture}` : 'غير محدد'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">البعد البؤري (Focal Length)</span>
                          <div className="font-mono font-bold text-white">{forensics.camera.focalLength || 'غير محدد'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">مكافئ 35mm</span>
                          <div className="font-mono font-bold text-white">{forensics.camera.focalLength35mm || 'غير محدد'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                          <span className="text-[10px] text-zinc-400">الفلاش (Flash)</span>
                          <div className="font-sans font-bold text-white">{forensics.camera.flash || 'بدون فلاش'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GPS & Geolocation Tab */}
                {activeTab === 'gps' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {forensics.gps.hasGps ? (
                      <>
                        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-right space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                              <MapPin className="w-5 h-5 text-rose-400" />
                              <span>تم استخراج إحداثيات GPS الدقيقة للموقع</span>
                            </div>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                              HIGH ACCURACY
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 font-mono">
                            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
                              <span className="text-[10px] text-zinc-400 font-sans">خط العرض (Latitude)</span>
                              <div className="text-sm font-bold text-white">{forensics.gps.latitude} ({forensics.gps.latitudeRef})</div>
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
                              <span className="text-[10px] text-zinc-400 font-sans">خط الطول (Longitude)</span>
                              <div className="text-sm font-bold text-white">{forensics.gps.longitude} ({forensics.gps.longitudeRef})</div>
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
                              <span className="text-[10px] text-zinc-400 font-sans">الارتفاع عن سطح البحر (Altitude)</span>
                              <div className="text-sm font-bold text-white">{forensics.gps.altitudeMeters ? `${forensics.gps.altitudeMeters} m (${forensics.gps.altitudeFeet} ft)` : 'غير متوفر'}</div>
                            </div>
                          </div>

                          {/* Interactive Map Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {forensics.gps.googleMapsUrl && (
                              <a
                                href={forensics.gps.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح في خرائط Google</span>
                              </a>
                            )}
                            {forensics.gps.appleMapsUrl && (
                              <a
                                href={forensics.gps.appleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Compass className="w-3.5 h-3.5 text-zinc-300" />
                                <span>خرائط Apple</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopy(`${forensics.gps.latitude}, ${forensics.gps.longitude}`, 'gps-coords')}
                              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 hover:text-white text-xs font-sans flex items-center gap-1.5 transition-colors cursor-pointer mr-auto"
                            >
                              {copiedKey === 'gps-coords' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">تم نسخ الإحداثيات</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>نسخ الإحداثيات</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* OpenStreetMap Live Preview */}
                        <div className="rounded-2xl border border-white/[0.08] overflow-hidden h-64 bg-black/60 relative">
                          <iframe
                            title="Location Map"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight={0}
                            marginWidth={0}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(forensics.gps.longitude || 0) - 0.01}%2C${(forensics.gps.latitude || 0) - 0.01}%2C${(forensics.gps.longitude || 0) + 0.01}%2C${(forensics.gps.latitude || 0) + 0.01}&amp;layer=mapnik&amp;marker=${forensics.gps.latitude}%2C${forensics.gps.longitude}`}
                            className="opacity-90 grayscale-[20%] contrast-[110%]"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-3">
                        <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white font-sans">
                          لا توجد إحداثيات GPS مضمنة في هذه الصورة
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto leading-relaxed">
                          الموقع الجغرافي محمي وغير مكشوف في ميتاداتا الملف، أو تم تجريده مسبقاً قبل الرفع.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Raw Tags & Search Tab */}
                {activeTab === 'raw' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="ابحث في أسماء وقيم الوسوم (EXIF, IPTC, XMP)..."
                          className="w-full pl-3 pr-9 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px] font-sans">
                        {['ALL', 'EXIF', 'IPTC', 'XMP', 'MakerNotes', 'File'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTagCategoryFilter(cat)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0",
                              tagCategoryFilter === cat
                                ? "bg-white/15 text-white font-bold"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags Table */}
                    <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden max-h-[45vh] overflow-y-auto no-scrollbar">
                      {filteredRawTags.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500 font-sans">
                          لا توجد وسوم تطابق معايير البحث
                        </div>
                      ) : (
                        <table className="w-full text-right text-xs font-mono">
                          <thead className="bg-white/[0.04] border-b border-white/[0.08] text-zinc-400 sticky top-0 backdrop-blur-md">
                            <tr>
                              <th className="p-2.5 font-bold">اسم الوسم (Tag Name)</th>
                              <th className="p-2.5 font-bold">القسم</th>
                              <th className="p-2.5 font-bold">القيمة المستخرجة (Value)</th>
                              <th className="p-2.5 font-bold text-center w-12">نسخ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {filteredRawTags.map((tag, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-2.5 text-cyan-300 font-bold max-w-[160px] truncate">
                                  {tag.name}
                                </td>
                                <td className="p-2.5 text-zinc-400 font-sans text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06]">
                                    {tag.category}
                                  </span>
                                </td>
                                <td className="p-2.5 text-zinc-200 max-w-[280px] break-all">
                                  {tag.value}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(tag.value, `tag-${idx}`)}
                                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedKey === `tag-${idx}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-zinc-400 font-sans">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono">
                {forensics ? `${forensics.fileName} (${formatFileSize(forensics.fileSize)})` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-colors cursor-pointer font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
