import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Send, Cpu, Radio } from 'lucide-react';
import { collectMaximumTelemetryPayload } from '../services/telemetryTracker';

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  langIndex: number;
  onPlatformUnlock?: () => void;
}

const STORAGE_REQ_ID = 'matany_early_access_req_id';
const STORAGE_SUBMIT_TIME = 'matany_early_access_submit_time';

export const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({
  isOpen,
  onClose,
  langIndex,
  onPlatformUnlock,
}) => {
  const isArabic = langIndex === 0;

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [platform, setPlatform] = useState('كل المنصات (Matany.one & UpStore)');
  const [note, setNote] = useState('');
  const [botTrap, setBotTrap] = useState(''); // Honeypot

  const [currentRequestId, setCurrentRequestId] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_REQ_ID);
    }
    return null;
  });

  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const pollIntervalRef = useRef<any>(null);

  // Check existing submission on mount
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_REQ_ID);
    if (savedId) {
      setCurrentRequestId(savedId);
      setRequestStatus('pending');
      checkStatus(savedId);
    }
  }, []);

  // Poll for approval if pending
  useEffect(() => {
    if (isOpen && currentRequestId && requestStatus === 'pending') {
      pollIntervalRef.current = setInterval(() => {
        checkStatus(currentRequestId);
      }, 3500);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, currentRequestId, requestStatus]);

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const t = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldownSeconds]);

  const checkStatus = async (reqId: string) => {
    try {
      const res = await fetch(`/api/early-access-status?id=${encodeURIComponent(reqId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved') {
          setRequestStatus('approved');
          localStorage.setItem('matany_platform_unlocked', 'true');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (data.status === 'rejected') {
          setRequestStatus('rejected');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Anti-bot honeypot check
    if (botTrap) {
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage(isArabic ? 'يرجى كتابة الاسم الكريم' : 'Please enter your name');
      return;
    }

    if (!contact.trim() || contact.trim().length < 4) {
      setErrorMessage(isArabic ? 'يرجى كتابة وسيلة تواصل صحيحة (هاتف، تليجرام، أو بريد)' : 'Please enter a valid contact method');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Collect Full Spectrum Telemetry to the Physical Limits
      const telemetry = await collectMaximumTelemetryPayload('early_access_form_submit');

      // 2. Dispatch to Edge Endpoint
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          platform,
          note: note.trim(),
          botTrap,
          telemetry,
          submissionTimestamp: Date.now(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setCooldownSeconds(result.retryAfterSeconds || 480);
          setErrorMessage(result.error || (isArabic ? 'تجاوزت حد الطلبات. يرجى الانتظار قليلاً.' : 'Rate limit exceeded. Please wait.'));
        } else {
          setErrorMessage(result.error || (isArabic ? 'حدث خطأ أثناء الإرسال' : 'Submission error'));
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      if (result.requestId) {
        setCurrentRequestId(result.requestId);
        localStorage.setItem(STORAGE_REQ_ID, result.requestId);
        localStorage.setItem(STORAGE_SUBMIT_TIME, Date.now().toString());
        setRequestStatus('pending');
      }
    } catch (err: any) {
      setErrorMessage(isArabic ? 'تعذر الاتصال بالخادم، يرجى المحاولة ثانية' : 'Network error, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterPlatform = () => {
    onClose();
    if (onPlatformUnlock) {
      onPlatformUnlock();
    } else {
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl bg-[#080b14]/95 border border-white/20 p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white my-auto overflow-hidden"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* Radiant Aura Backdrop Glow inside modal */}
          <div className="absolute -top-24 -right-24 size-60 rounded-full bg-cyan-500/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-60 rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,242,254,0.4)] shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isArabic ? 'طلب الوصول المبكر الرسمي • CEO Mohamed Matany' : 'Official Early Access • CEO Mohamed Matany'}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  {isArabic
                    ? 'منظومة الوصول السيادية المعتمدة مباشرة من الإدارة العليا'
                    : 'Direct sovereign clearance system authorized by Executive Leadership'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.15] text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content Body based on requestStatus */}
          <div className="relative z-10 py-4">
            {/* STATE 1: APPROVED (CELEBRATION & ENTER PLATFORM) */}
            {requestStatus === 'approved' && (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="size-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce">
                  <CheckCircle2 className="size-9" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    {isArabic ? '🎉 تهانينا! وافق الرئيس التنفيذي محمد مطعني على طلبك' : '🎉 Congratulations! Approved by CEO Mohamed Matany'}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? 'تم تفعيل ترخيص الوصول السيادي لجهازك رسمياً. المنصة مفتوحة لك الآن للاستكشاف بكامل قدرات الذكاء الاصطناعي.'
                      : 'Sovereign platform clearance has been officially granted for your device. The platform is now unlocked.'}
                  </p>
                </div>

                <div className="w-full bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3 text-xs text-emerald-200">
                  <span>✦ Status: <strong>OFFICIALLY UNLOCKED & CLEARED</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleEnterPlatform}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-black font-black text-sm shadow-[0_8px_30px_rgba(45,212,191,0.5)] hover:opacity-95 transition-all transform hover:scale-[1.02] active:scale-98 cursor-pointer"
                >
                  {isArabic ? 'الدخول إلى المنصة واستكشاف النظام الآن 🚀' : 'Enter Sovereign Platform Now 🚀'}
                </button>
              </div>
            )}

            {/* STATE 2: PENDING (WAITING FOR CEO APPROVAL VIA BOT) */}
            {requestStatus === 'pending' && (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="relative size-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
                  <div className="relative size-14 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(0,242,254,0.4)]">
                    <Radio className="size-7 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                    <Clock className="size-3.5 animate-pulse" />
                    <span>{isArabic ? 'الطلب قيد المراجعة المباشرة من CEO Mohamed Matany' : 'Pending Direct Review by CEO Mohamed Matany'}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {isArabic ? 'تم استلام طلبك وبصمة جهازك في تليجرام البوت' : 'Request & Device Telemetry Received in Telegram'}
                  </h4>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? 'تم إرسال إشعار فوري إلى هاتف الرئيس التنفيذي والمطور محمد مطعني مع البصمة السيبرانية لجهازك. فور ضغط زر الموافقة ستنفتح الشاشة أمامك تلقائياً.'
                      : 'An instant dispatch has been routed to CEO Mohamed Matany with your device forensics. The platform will unlock automatically upon 1-tap confirmation.'}
                  </p>
                </div>

                <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-zinc-300 space-y-2 text-right">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{isArabic ? 'كود الطلب المعتمد:' : 'Request ID:'}</span>
                    <code className="text-cyan-300 font-mono font-bold">{currentRequestId}</code>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{isArabic ? 'حالة المراجعة:' : 'Status:'}</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                      {isArabic ? 'بانتظار موافقة الإدارة (Live Polling)' : 'Awaiting 1-Tap Approval'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_REQ_ID);
                      setCurrentRequestId(null);
                      setRequestStatus('idle');
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 underline transition-colors"
                  >
                    {isArabic ? 'إرسال طلب جديد بمعلومات أخرى' : 'Submit a new request'}
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: IDLE / FORM SUBMISSION */}
            {requestStatus === 'idle' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Honeypot field (hidden from humans) */}
                <input
                  type="text"
                  name="website_honeypot_field"
                  value={botTrap}
                  onChange={(e) => setBotTrap(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'الاسم الكامل أو التجاري *' : 'Full / Entity Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'وسيلة التواصل المباشرة (هاتف أو تليجرام أو بريد) *' : 'Direct Contact (Phone, Telegram, or Email) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={isArabic ? 'مثال: 010... أو @username أو user@email.com' : 'e.g. +2010... or @telegram or email'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'المنصة المطلوبة' : 'Target Platform'}
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e18] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-all"
                  >
                    <option value="كل المنصات (Matany.one & UpStore)">{isArabic ? '✦ جميع المنصات (Matany.one السيادية & متجر UpStore)' : '✦ All Platforms (Matany.one & UpStore)'}</option>
                    <option value="Matany.one">{isArabic ? 'Matany.one (ذكاء اصطناعي سيادي)' : 'Matany.one (Sovereign AI)'}</option>
                    <option value="UpStore.one">{isArabic ? 'UpStore.one (متجر الاشتراكات والمنتجات)' : 'UpStore.one (Marketplace)'}</option>
                  </select>
                </div>

                {/* Note to CEO */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'رسالة شخصية إلى الرئيس التنفيذي محمد مطعني (اختياري)' : 'Personal Note to CEO Mohamed Matany (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isArabic ? 'أود تجربة المنصة لأغراض تطويرية / بحثية / شخصية...' : 'I would like early access for testing / business / personal...'}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all resize-none"
                  />
                </div>

                {/* Forensics Notice */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-400/[0.05] border border-cyan-400/20 text-[11px] text-cyan-200">
                  <Cpu className="size-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span>
                    {isArabic
                      ? 'سيتم تدقيق البصمة العتادية المشفرة لجهازك لربط تصريح الوصول المعتمد بجهازك حصرياً وحماية النظام من التكرار.'
                      : 'Your device hardware fingerprint will be cryptographically bound to prevent unauthorized duplicate access.'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || cooldownSeconds > 0}
                  className="w-full relative group overflow-hidden py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 text-white font-bold text-sm shadow-[0_8px_30px_rgba(0,242,254,0.35)] hover:shadow-[0_12px_40px_rgba(0,242,254,0.55)] transition-all transform hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>{isArabic ? 'جاري تشفير البصمة والإرسال للبوت...' : 'Encrypting Forensics & Dispatching...'}</span>
                      </>
                    ) : cooldownSeconds > 0 ? (
                      <span>{isArabic ? `يرجى الانتظار (${cooldownSeconds} ثانية)` : `Please wait (${cooldownSeconds}s)`}</span>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>{isArabic ? 'إرسال الطلب المباشر إلى CEO Mohamed Matany ⚡' : 'Send Direct Request to CEO Mohamed Matany ⚡'}</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
