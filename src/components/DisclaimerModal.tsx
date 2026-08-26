import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen?: boolean;
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen = true, onAccept }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto smooth-scroll bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-right shadow-2xl space-y-4 sm:space-y-5">
        
        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
              تأكيد الوصول وشروط الاستخدام
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans">
              منصة الذكاء الاصطناعي التجريدي X1.link
            </p>
          </div>
        </div>

        {/* Notice description */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 space-y-2.5 leading-relaxed font-sans">
          <p>
            أنت على وشك الدخول إلى نظام ذكاء اصطناعي فائق الصراحة والواقعية مصمم للتحليل المتقدم، الفلسفة العميقة، والنقد غير المقيد.
          </p>
          <div className="flex items-center gap-2 text-zinc-400 text-xs pt-1.5 border-t border-zinc-800">
            <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>الموافقة على شروط الاستخدام والأمان.</span>
          </div>
        </div>

        {/* Accept Button */}
        <button
          type="button"
          onClick={onAccept}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
        >
          <span>أوافق وأتابع إلى المنصة</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>

      </div>
    </div>
  );
};
