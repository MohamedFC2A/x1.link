import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowRight } from 'lucide-react';

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
      {/* Sleek, Stable Glassmorphic Button with Zero Dimensional Jitter */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isArabic ? 'طلب وصول مبكر' : 'Request Early Access'}
        className="relative flex items-center justify-between w-[236px] sm:w-[246px] h-[46px] px-3.5 sm:px-4 rounded-full bg-white/[0.05] hover:bg-white/[0.10] text-white border border-white/20 hover:border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-xl transition-colors duration-200 transform active:scale-95 cursor-pointer overflow-hidden"
      >
        {/* Subtle Specular Light Sweep on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

        {/* Smart Minimalist Icon */}
        <div className="flex items-center justify-center size-6 rounded-full bg-white/[0.08] border border-white/15 text-zinc-300 group-hover:text-white transition-colors shrink-0">
          <KeyRound className="size-3" />
        </div>

        {/* Stable-Width Distinctive Typography Container (Zero Pop / Jump on Language Change) */}
        <div className="w-[148px] sm:w-[154px] h-5 relative flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {isArabic ? (
              <motion.span
                key="ar-btn"
                dir="rtl"
                initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="font-bold text-[13px] sm:text-[14px] text-white tracking-wide whitespace-nowrap"
                style={{ fontFamily: "'Cairo', 'Segoe UI', -apple-system, sans-serif" }}
              >
                طلب وصول مبكر
              </motion.span>
            ) : (
              <motion.span
                key="en-btn"
                dir="ltr"
                initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="font-bold text-[12px] sm:text-[13px] text-white tracking-wide whitespace-nowrap"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                Request Early Access
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Smart Smooth-Rotating Direction Arrow */}
        <motion.div
          animate={{ rotate: isArabic ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="size-6 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0"
        >
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
        </motion.div>
      </button>
    </motion.div>
  );
};
