import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface AuraEarlyAccessButtonProps {
  langIndex: number; // 0: Arabic, 1: English
  onClick: () => void;
  className?: string;
}

export const AuraEarlyAccessButton: React.FC<AuraEarlyAccessButtonProps> = ({
  langIndex,
  onClick,
  className = '',
}) => {
  const isArabic = langIndex === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`relative inline-flex items-center justify-center group select-none ${className}`}
    >
      {/* Outer Hyper-Radiant Aura Blur (Multi-Layer Liquid Atmospheric Glow) */}
      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-fuchsia-500 to-cyan-400 opacity-60 group-hover:opacity-100 blur-xl transition-all duration-700 animate-pulse" />
      <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#00f2fe,#818cf8,#c084fc,#f472b6,#00f2fe)] opacity-70 group-hover:opacity-90 blur-md transition-all duration-500 animate-[spin_6s_linear_infinite]" />

      {/* Button Surface Container */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isArabic ? 'طلب وصول مبكر من الرئيس التنفيذي محمد مطعني' : 'Request Early Access from CEO Mohamed Matany'}
        className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#080b14]/90 hover:bg-[#0c101d]/95 text-white border border-white/25 hover:border-cyan-300/60 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_10px_35px_rgba(0,242,254,0.35)] backdrop-blur-2xl transition-all duration-300 transform active:scale-95 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_12px_45px_rgba(0,242,254,0.55)] overflow-hidden cursor-pointer"
      >
        {/* Shimmer Light Sweep Effect across button */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Pulsing VIP Crown Icon / Sparkle Badge */}
        <div className="relative flex items-center justify-center size-5 sm:size-5.5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-[0_0_12px_#00f2fe] shrink-0">
          <Sparkles className="size-3 sm:size-3.5 animate-spin text-white" style={{ animationDuration: '8s' }} />
          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Dynamic Bilingual Text with Smooth Fade Transition */}
        <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-2 text-center">
          {isArabic ? (
            <span
              className="font-bold text-[12px] sm:text-[13.5px] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_1px_6px_rgba(0,242,254,0.4)]"
              dir="rtl"
              style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}
            >
              طلب وصول مبكر من الرئيس التنفيذي والمطور محمد مطعني
            </span>
          ) : (
            <span
              className="font-bold text-[11.5px] sm:text-[13px] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_1px_6px_rgba(0,242,254,0.4)]"
              dir="ltr"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              Request Early Access from CEO & Founder Mohamed Matany
            </span>
          )}

          {/* Micro VIP Access Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-[9px] font-black uppercase tracking-widest text-cyan-200">
            <ShieldCheck className="size-2.5 text-cyan-300" />
            VIP
          </span>
        </div>

        <span className="text-cyan-400 text-xs sm:text-sm font-black group-hover:translate-x-0.5 transition-transform">
          ✦
        </span>
      </button>
    </motion.div>
  );
};
