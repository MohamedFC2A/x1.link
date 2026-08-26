import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft, Key } from 'lucide-react';
import { verifyAndActivateSubscription, getRateLimitStatus, RateLimitStatus } from '../services/subscriptionService';
import { User } from '@supabase/supabase-js';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlanId: 'pro-29' | 'elite-99';
  onSuccess: (planId: 'pro-29' | 'elite-99') => void;
  user: User | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  targetPlanId,
  onSuccess,
  user,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(getRateLimitStatus());

  const planName = targetPlanId === 'elite-99' ? 'باقة النخبة (Elite)' : 'باقة المحترف (Pro)';
  const planPrice = targetPlanId === 'elite-99' ? '$99' : '$29';
  const planTokens = targetPlanId === 'elite-99' ? '500,000,000 توكن (500M)' : '100,000,000 توكن (100M)';

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMessage(null);
      setIsSuccess(false);
      setRateLimit(getRateLimitStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading || isSuccess) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await verifyAndActivateSubscription(code, targetPlanId, user?.id || null);
    setIsLoading(false);
    setRateLimit(result.rateLimit);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(targetPlanId);
        onClose();
      }, 1000);
    } else {
      setErrorMessage(result.error || 'كود التفعيل غير صالح.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 text-white shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-200">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تفعيل الاشتراك المدفوع</h3>
              <p className="text-[11px] text-zinc-400 font-mono">التحقق المشفر من كود الاشتراك</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Summary Card */}
        <div className="p-4 rounded-2xl glass-card mb-5 text-right">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-white">{planName}</span>
            <span className="text-sm font-mono font-bold text-zinc-200">{planPrice} / شهرياً</span>
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            الحصة الممنوحة: <strong className="text-white">{planTokens}</strong>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center animate-in fade-in">
            <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">تم تفعيل الاشتراك بنجاح</h4>
            <p className="text-xs text-zinc-400 font-mono">تم رفع وتحديث بيانات الاشتراك على Supabase وتفعيل الحصص.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-2 text-right">
                أدخل كود تفعيل الباقة (Activation Passcode):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••"
                  disabled={rateLimit.isLocked || isLoading}
                  maxLength={12}
                  autoFocus
                  className="w-full bg-zinc-950 border border-white/20 focus:border-white focus:outline-none rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder:text-zinc-600 disabled:opacity-50"
                />
                <Key className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Error or Rate Limit Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-right flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {rateLimit.isLocked && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs text-right">
                تم قفل إدخال الكود مؤقتاً لحماية النظام. يرجى الانتظار {Math.ceil(rateLimit.lockoutRemainingMs / 60000)} دقيقة.
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
              <span>حماية ضد التخمين (Rate Limited)</span>
              <span>محاولات متبقية: {rateLimit.remainingAttempts} / 5</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!code.trim() || rateLimit.isLocked || isLoading}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>جاري التحقق من السيرفر...</span>
                ) : (
                  <>
                    <span>تأكيد وتفعيل الاشتراك</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
