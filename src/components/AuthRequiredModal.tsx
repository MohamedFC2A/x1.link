import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck, Database, BrainCircuit, Lock } from 'lucide-react';
import { signInWithGoogle } from '../services/supabase';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('[Google Sign In Error]:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none" dir="rtl">
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl border border-white/[0.14] bg-[#0a0c16]/95 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] text-right space-y-5 overflow-hidden">
        {/* Glow decorative element */}
        <div className="absolute -top-24 -right-24 size-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="size-11 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shadow-inner shrink-0">
            <Lock className="size-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-sans font-bold text-white tracking-tight">
              تسجيل الدخول إلزامي للمتابعة
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              منظومة matany.one المحمية سحابياً
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 text-xs text-zinc-300 font-sans">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <BrainCircuit className="size-4 text-indigo-400 shrink-0" />
            <span>مزامنة الذاكرة السحابية المتزامنة واستدعاء 50 محادثة سابقة</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Database className="size-4 text-cyan-400 shrink-0" />
            <span>حفظ واسترجاع سجل المحادثات والملفات والوسائط بأمان</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>حماية الخصوصية وتأمين الجلسات الرقمية والمصادقة الموحدة</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-sans font-bold text-sm transition-all duration-200 cursor-pointer active:scale-98 shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block size-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>تسجيل الدخول والمتابعة باستخدام Google</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors text-center font-sans font-medium"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
