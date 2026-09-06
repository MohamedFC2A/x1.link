import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowLeft, ArrowRight } from 'lucide-react';

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
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className={`relative inline-flex items-center justify-center group select-none ${className}`}
    >
      {/* Sleek, Clean Glassmorphic Button with Zero Neon Bloom */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isArabic ? 'طلب وصول مبكر' : 'Request Early Access'}
        className="relative flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] text-white border border-white/20 hover:border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-200 transform active:scale-95 cursor-pointer overflow-hidden"
      >
        {/* Subtle Specular Light Sweep on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

        {/* Smart Minimalist Icon */}
        <div className="flex items-center justify-center size-5.5 rounded-full bg-white/[0.08] border border-white/15 text-zinc-300 group-hover:text-white transition-colors shrink-0">
          <KeyRound className="size-3" />
        </div>

        {/* Distinctive Typography (ONLY "طلب وصول مبكر" / "Request Early Access") */}
        <div className="h-5 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {isArabic ? (
              <motion.span
                key="ar-btn"
                dir="rtl"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-[13px] sm:text-[14px] text-white tracking-wide whitespace-nowrap"
                style={{ fontFamily: "'Cairo', 'Segoe UI', -apple-system, sans-serif" }}
              >
                طلب وصول مبكر
              </motion.span>
            ) : (
              <motion.span
                key="en-btn"
                dir="ltr"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-[12px] sm:text-[13px] text-white tracking-wide whitespace-nowrap"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                Request Early Access
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Smart Direction Arrow */}
        <div className="text-zinc-400 group-hover:text-white transition-colors">
          {isArabic ? (
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </div>
      </button>
    </motion.div>
  );
};
