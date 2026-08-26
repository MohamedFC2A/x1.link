import React, { useState, useMemo } from 'react';
import { triggerBiometricAuthentication, getBiometricDeviceInfo, BiometricDeviceInfo } from '../services/webauthn';
import { WebAuthnVerificationResult } from '../types';
import { X, CheckCircle2, Fingerprint, KeyRound, ShieldOff } from 'lucide-react';

interface X1UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: WebAuthnVerificationResult) => void;
}

// ----------------------------------------------------------------------
// Dedicated Native OS Biometric Icons
// ----------------------------------------------------------------------
const FaceIdIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <circle cx="9" cy="9.5" r="1.2" fill="currentColor" />
    <circle cx="15" cy="9.5" r="1.2" fill="currentColor" />
    <path d="M12 11.5v2.5" />
    <path d="M8.5 16.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
  </svg>
);

const WindowsHelloIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 4.5 10.5 3.5v7.5H3V4.5z" fill="currentColor" fillOpacity="0.25" />
    <path d="M12.5 3.2 21 2v9h-8.5V3.2z" fill="currentColor" fillOpacity="0.25" />
    <path d="M3 13h7.5v7.5L3 19.5V13z" fill="currentColor" fillOpacity="0.25" />
    <path d="M12.5 13H21v9l-8.5-1.2V13z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

export const X1UnlockModal: React.FC<X1UnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const deviceInfo: BiometricDeviceInfo = useMemo(() => getBiometricDeviceInfo(), []);

  if (!isOpen) return null;

  const renderBiometricIcon = (className?: string) => {
    switch (deviceInfo.iconType) {
      case 'face-id':
        return <FaceIdIcon className={className} />;
      case 'windows-hello':
        return <WindowsHelloIcon className={className} />;
      case 'touch-id':
      case 'fingerprint':
        return <Fingerprint className={className} />;
      default:
        return <KeyRound className={className} />;
    }
  };

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
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto smooth-scroll glass-popover rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-right shadow-2xl space-y-4 sm:space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3.5 top-3.5 sm:left-4 sm:top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>

        {/* NSFW Off Header */}
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shrink-0">
            <ShieldOff className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
              تفعيل وضع <span className="font-['Space_Grotesk'] font-bold text-white">NSFW Off</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-sans">
              إلغاء قيود الرقابة وإطلاق العنان للمحادثة الحرة بدون فلاتر
            </p>
          </div>
        </div>

        {/* Feature Highlights Card with Exact Detected OS Requirement */}
        <div className="p-3.5 sm:p-4 rounded-2xl glass-card text-xs sm:text-sm text-zinc-300 space-y-2.5 sm:space-y-3 leading-relaxed font-sans border border-white/[0.08]">
          <p className="text-zinc-200 font-medium">
            تفعيل وضع NSFW Off يحرر المحرك العصبي تماماً ليتحدث في أي موضوع نفسي، فكري، فلسفي، أو حواري جريء بلا أي حواجز أو قيود مسبقة.
          </p>
          <div className="space-y-2 pt-2 border-t border-white/[0.08] text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>حرية تعبير كاملة وصراحة تامة دون وعظ أو اعتذار أو رفض.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0 text-emerald-400">
                {renderBiometricIcon("w-4 h-4")}
              </div>
              <span className="text-zinc-300 font-medium">{deviceInfo.requirementText}</span>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-sans">
            {errorMsg}
          </div>
        )}

        {/* Dynamic Biometric Trigger Button tailored to specific OS */}
        <button
          type="button"
          onClick={handleStartBiometrics}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer shadow-xl border border-white/20"
        >
          {loading ? (
            <div className="size-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin shrink-0" />
          ) : (
            renderBiometricIcon("w-5 h-5 shrink-0 text-zinc-950")
          )}
          <span>
            {loading ? deviceInfo.verifyingText : deviceInfo.actionText}
          </span>
        </button>

      </div>
    </div>
  );
};
