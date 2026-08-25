import React, { useState } from 'react';
import { triggerBiometricAuthentication } from '../services/webauthn';
import { WebAuthnVerificationResult } from '../types';
import { Fingerprint, X, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';

interface X1UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: WebAuthnVerificationResult) => void;
}

export const X1UnlockModal: React.FC<X1UnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartBiometrics = async () => {
    setLoading(true);
    setErrorMsg(null);

    const result = await triggerBiometricAuthentication();

    if (result.success) {
      setLoading(false);
      onSuccess(result);
    } else {
      setLoading(false);
      setErrorMsg(result.error || 'فشل التحقق الحيوي. يرجى المحاولة مجدداً.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto smooth-scroll bg-zinc-950 border border-rose-900/60 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-right shadow-2xl space-y-4 sm:space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3.5 top-3.5 sm:left-4 sm:top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Silicon Chip Header */}
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-br from-rose-600/30 to-red-900/40 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
                تفعيل شريحة NSFW NANO
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/80 text-rose-200 border border-rose-500">
                +21 MAX
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-sans">
              كسر كافة الحدود الرقابية وإطلاق العنان للحرية المطلقة
            </p>
          </div>
        </div>

        {/* Feature Highlights Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-zinc-300 space-y-2.5 sm:space-y-3 leading-relaxed font-sans">
          <p className="text-zinc-200 font-medium">
            تفعيل هذه الشريحة يحرر المحرك العصبي تماماً ليتحدث في أي موضوع حميمي، نفسي، جنسي، أو فكري جريء بلا أي حواجز أو قيود.
          </p>
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span>حرية تعبير مطلقة وصراحة تامة دون أي وعظ أو اعتذار.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
              <span>يلزم تأكيد بصمة الإصبع أو Face ID في كل عملية تفعيل لحماية خصوصيتك.</span>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-sans">
            {errorMsg}
          </div>
        )}

        {/* Biometric trigger button */}
        <button
          type="button"
          onClick={handleStartBiometrics}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-rose-950/50 active:scale-[0.98] cursor-pointer"
        >
          <Fingerprint className="w-5 h-5 animate-pulse shrink-0" />
          <span>
            {loading ? 'جاري مسح البصمة / Face ID...' : 'تأكيد البصمة أو Face ID لتفعيل الشريحة'}
          </span>
        </button>

      </div>
    </div>
  );
};
