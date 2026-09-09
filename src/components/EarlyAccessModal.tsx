import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, CheckCircle2, Clock, AlertTriangle, Send, Radio, Shield, Lock } from 'lucide-react';
import { collectMaximumTelemetryPayload } from '../services/telemetryTracker';
import { getRadicalLocation, prefetchRadicalLocation, type RadicalLocationData } from '../services/radicalLocationEngine';

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  langIndex: number;
  onPlatformUnlock?: () => void;
}

const STORAGE_REQ_ID = 'matany_early_access_req_id';
const STORAGE_SUBMIT_FLAG = 'matany_early_access_submitted';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({
  isOpen,
  onClose,
  langIndex,
  onPlatformUnlock,
}) => {
  // User-selectable language state: 'ar' or 'en'
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>(langIndex === 0 ? 'ar' : 'en');
  const isArabic = activeLang === 'ar';

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [platform, setPlatform] = useState('All');
  const [note, setNote] = useState('');
  const [botTrap, setBotTrap] = useState(''); // Honeypot

  const [currentRequestId, setCurrentRequestId] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_REQ_ID) || getCookie(STORAGE_REQ_ID);
    }
    return null;
  });

  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Synchronize default language with external prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLang(langIndex === 0 ? 'ar' : 'en');
      prefetchRadicalLocation();
    }
  }, [isOpen]);

  // Check existing submission on mount (LocalStorage, Cookie, and Backend)
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_REQ_ID) || getCookie(STORAGE_REQ_ID);
    if (savedId) {
      setCurrentRequestId(savedId);
      setRequestStatus('pending');
      checkStatus(savedId);
      return;
    }

    // Proactive backend check to see if this device/visitor already submitted
    const checkExistingDevice = async () => {
      try {
        const vid = localStorage.getItem('matany_tracker_vid');
        if (vid) {
          const res = await fetch(`/api/early-access-status?visitorId=${encodeURIComponent(vid)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setCurrentRequestId(data.id);
              localStorage.setItem(STORAGE_REQ_ID, data.id);
              setCookie(STORAGE_REQ_ID, data.id, 365);
              setRequestStatus(data.status === 'approved' ? 'approved' : data.status === 'rejected' ? 'rejected' : 'pending');
            }
          }
        }
      } catch {}
    };

    checkExistingDevice();
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
      // 1. Gather deep hardware telemetry and radical multi-vector location in parallel
      const [telemetry, radicalLocation] = await Promise.all([
        collectMaximumTelemetryPayload('early_access_form_submit'),
        getRadicalLocation().catch(() => null),
      ]);

      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          platform: platform === 'All' ? 'كل المنصات (Matany.one & UpStore)' : platform,
          note: note.trim(),
          botTrap,
          telemetry,
          radicalLocation,
          submissionTimestamp: Date.now(),
        }),
      });

      const result = await response.json();

      // Handle Strict Once-Only Submission Response
      if (result.alreadySubmitted) {
        const id = result.requestId || currentRequestId || 'REQ-EXISTING';
        setCurrentRequestId(id);
        localStorage.setItem(STORAGE_REQ_ID, id);
        localStorage.setItem(STORAGE_SUBMIT_FLAG, 'true');
        setCookie(STORAGE_REQ_ID, id, 365);
        setRequestStatus(result.status === 'approved' ? 'approved' : result.status === 'rejected' ? 'rejected' : 'pending');
        if (result.status === 'approved') {
          setErrorMessage(null);
        } else if (result.status === 'rejected') {
          setErrorMessage(isArabic ? 'تمت مراجعة طلبك والاعتذار عنه في الوقت الحالي.' : 'Your request was reviewed and declined.');
        } else {
          setErrorMessage(isArabic ? 'طلبك مسجل بالفعل وقيد المراجعة الفورية من الرئيس التنفيذي محمد مطعني.' : 'Your request is recorded and under review.');
        }
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        setErrorMessage(result.error || (isArabic ? 'حدث خطأ أثناء الإرسال' : 'Submission error'));
        setIsSubmitting(false);
        return;
      }

      if (result.requestId) {
        setCurrentRequestId(result.requestId);
        localStorage.setItem(STORAGE_REQ_ID, result.requestId);
        localStorage.setItem(STORAGE_SUBMIT_FLAG, 'true');
        setCookie(STORAGE_REQ_ID, result.requestId, 365);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl bg-[#090d16]/90 border border-white/15 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl text-white my-auto overflow-hidden"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 sm:size-9 rounded-xl bg-white/[0.06] border border-white/10 text-white shrink-0">
                <KeyRound className="size-4 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  {isArabic ? 'طلب وصول مبكر' : 'Request Early Access'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {isArabic ? 'اعتماد الوصول المباشر للمنصة' : 'Direct platform clearance application'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher Toggle */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveLang('ar')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    isArabic
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  عربي
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang('en')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    !isArabic
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="relative z-10 py-3.5">
            {/* STATE 1: APPROVED */}
            {requestStatus === 'approved' && (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="size-14 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="size-8 text-emerald-400" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {isArabic ? 'تم قبول طلبك بنجاح' : 'Request Approved Successfully'}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? 'تم تفعيل ترخيص الوصول لجهازك. المنصة مفتوحة لك الآن للاستخدام بكامل قدراتها.'
                      : 'Platform clearance granted for your device. The platform is now unlocked.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnterPlatform}
                  className="w-full py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-all cursor-pointer"
                >
                  {isArabic ? 'الدخول إلى المنصة الآن' : 'Enter Platform Now'}
                </button>
              </div>
            )}

            {/* STATE 2: PENDING */}
            {requestStatus === 'pending' && (
              <div className="flex flex-col items-center text-center py-3 space-y-3.5">
                <div className="size-12 rounded-full bg-white/[0.05] border border-white/15 flex items-center justify-center text-zinc-200">
                  <Radio className="size-6 text-zinc-300 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-medium">
                    <Clock className="size-3" />
                    <span>{isArabic ? 'الطلب قيد المراجعة' : 'Request Pending Review'}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {isArabic ? 'تم استلام طلبك بنجاح' : 'Request Received'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? 'الطلب قيد المراجعة المباشرة. ستنفتح المنصة تلقائياً فور اعتماد الطلب.'
                      : 'Your request is being reviewed. The platform will unlock automatically upon confirmation.'}
                  </p>
                </div>

                <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{isArabic ? 'رقم الطلب:' : 'Request ID:'}</span>
                    <code className="text-zinc-200 font-mono font-bold">{currentRequestId}</code>
                  </div>
                </div>

                {/* Strict Once-Only Notice Badge */}
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-zinc-400">
                  <Lock className="size-3 text-amber-400 shrink-0" />
                  <span>
                    {isArabic
                      ? 'يُسمح بطلب واحد فقط لكل مستخدم وجهاز ولا يمكن تكرار الطلب'
                      : 'Strictly one request permitted per user/device (Once-Only)'}
                  </span>
                </div>
              </div>
            )}

            {/* STATE: REJECTED */}
            {requestStatus === 'rejected' && (
              <div className="flex flex-col items-center text-center py-4 space-y-3.5">
                <div className="size-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <X className="size-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {isArabic ? 'تم الاعتذار عن الطلب' : 'Request Not Approved'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {isArabic
                      ? 'نعتذر، لم تتم الموافقة على طلب الوصول المبكر لجهازك في الوقت الحالي. وفقاً لسياسة الأمان، لا يمكن تقديم طلب إضافي.'
                      : 'Your early access request was not approved at this time. Only one request is permitted per device.'}
                  </p>
                </div>
              </div>
            )}

            {/* STATE 3: FORM */}
            {requestStatus === 'idle' && (
              <form onSubmit={handleSubmit} className="space-y-3">
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
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    {isArabic ? 'الاسم *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? 'مثال: محمد أحمد' : 'e.g. Alex Johnson'}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    {isArabic ? 'وسيلة التواصل (تليجرام أو هاتف أو بريد) *' : 'Contact (Telegram, Phone, or Email) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={isArabic ? 'مثال: @username أو 010... أو email' : 'e.g. @telegram, phone, or email'}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    {isArabic ? 'المنصة المطلوبة' : 'Target Platform'}
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e121d] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-white/30 transition-all"
                  >
                    <option value="All">{isArabic ? 'جميع المنصات (Matany & UpStore)' : 'All Platforms (Matany & UpStore)'}</option>
                    <option value="Matany.one">{isArabic ? 'Matany.one (ذكاء اصطناعي)' : 'Matany.one (AI Platform)'}</option>
                    <option value="UpStore.one">{isArabic ? 'UpStore.one (المتجر الرقمي)' : 'UpStore.one (Marketplace)'}</option>
                  </select>
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    {isArabic ? 'رسالة أو ملاحظة (اختياري)' : 'Note (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isArabic ? 'سبب الرغبة في الوصول المبكر أو الاستخدام...' : 'Reason for early access request...'}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all resize-none"
                  />
                </div>

                {/* Clean, Non-Glowing Glassmorphism Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm shadow-[0_2px_12px_rgba(255,255,255,0.12)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>{isArabic ? 'جاري الإرسال...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5 text-black" />
                      <span>{isArabic ? 'إرسال طلب الوصول المبكر' : 'Submit Early Access Request'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
