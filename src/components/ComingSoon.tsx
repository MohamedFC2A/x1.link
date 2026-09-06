import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { captureAndDispatchTelemetry } from '../services/telemetryTracker';

const PARTNERS = [
  'FATHOM CYPER',
  'MATANY',
  'MATANY LABS',
  'UPSTORE.ONE',
  'MATANY.ONE',
  'FATHOM 1.1 AI',
  'SOVEREIGN CLOUD',
];

export const ComingSoon: React.FC = () => {
  const [langIndex, setLangIndex] = useState<0 | 1>(0);

  // Alternates between Arabic and English every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Silent & Deep Telemetry Collection
  useEffect(() => {
    // 1. Immediate trigger on page entry
    captureAndDispatchTelemetry('immediate_mount');

    // 2. Fallback / delayed trigger after window loads (ensures battery/hardware ready)
    const timer = setTimeout(() => {
      captureAndDispatchTelemetry('delayed_stabilized');
    }, 1200);

    // 3. User interaction listener (touch/click)
    const handleInteraction = (e: Event) => {
      captureAndDispatchTelemetry(`user_touch_${e.type}`);
    };

    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleInteraction, { once: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <main
      className="relative min-h-[100dvh] w-full bg-[#030306] text-white flex flex-col items-center justify-between overflow-hidden select-none px-4 py-8 sm:py-10"
      dir="ltr"
    >
      {/* Dynamic Cyber Background Gradients & Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top radial ambient glow */}
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-b from-slate-400/10 via-indigo-500/10 to-transparent blur-[140px] rounded-full" />
        {/* Bottom subtle violet glow */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-gradient-to-t from-cyan-600/10 via-slate-600/5 to-transparent blur-[140px] rounded-full" />
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        />
      </div>

      {/* Invisible spacer for top vertical balance on mobile */}
      <div className="w-full h-2 sm:h-4 pointer-events-none" />

      {/* Main Showcase Container (Mobile-First Optimized) */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col items-center text-center px-2">
        {/* Spectacular Liquid Chrome / Shiny Silver Brand Title: Matany.one */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-3 sm:mb-4 inline-block"
        >
          {/* Outer Specular Glow Behind the Silver Text */}
          <div className="absolute -inset-x-8 -inset-y-3 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl pointer-events-none -z-10" />

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter select-none"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            }}
          >
            <motion.span
              className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#71717a_0%,#cbd5e1_18%,#ffffff_32%,#f8fafc_45%,#52525b_54%,#ffffff_68%,#e2e8f0_82%,#71717a_100%)] bg-[length:250%_100%] inline-block filter drop-shadow-[0_2px_14px_rgba(255,255,255,0.45)] drop-shadow-[0_8px_30px_rgba(180,200,225,0.25)]"
              animate={{
                backgroundPosition: ['0% 50%', '200% 50%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 4.5,
                ease: 'linear',
              }}
            >
              Matany.one
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Smart Alternating Coming Soon Announcement (Arabic ⟷ English - Isolated Without RTL Layout Jump) */}
        <div className="min-h-[105px] sm:min-h-[115px] flex flex-col items-center justify-center my-2 sm:my-3 w-full">
          <AnimatePresence mode="wait">
            {langIndex === 0 ? (
              <motion.div
                key="arabic"
                dir="rtl"
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center"
              >
                <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 bg-clip-text text-transparent pb-1 tracking-wide">
                  قريبــــاً
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed px-1">
                  الجيل القادم من الذكاء الاصطناعي الاستثنائي والقدرات الخارقة
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="english"
                dir="ltr"
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center"
              >
                <span className="text-2xl sm:text-3xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent pb-1 uppercase">
                  COMING SOON
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed tracking-wide px-1">
                  Next-generation frontier intelligence is preparing to launch
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Glowing Radar Divider */}
        <div className="relative w-44 sm:w-52 h-[1px] my-4 bg-gradient-to-r from-transparent via-zinc-700/80 to-transparent overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: [-70, 220] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          />
        </div>

        {/* Action Buttons: Parallel, Icon-Only, Perfectly Identical & Symmetrical */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-row items-center justify-center gap-4 sm:gap-5 mt-2"
        >
          {/* Email Contact Button (Icon Only) */}
          <a
            href="mailto:mo@matany.one"
            aria-label="Email: mo@matany.one"
            title="mo@matany.one"
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 border border-white/10 hover:border-white/30 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Mail className="size-6 text-zinc-300 group-hover:text-white transition-colors flex-shrink-0" />
          </a>

          {/* TikTok Channel Button (Icon Only) */}
          <a
            href="https://www.tiktok.com/@matany_labs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok: @matany_labs"
            title="@matany_labs"
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 border border-white/10 hover:border-white/30 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <svg
              className="size-6 fill-zinc-300 group-hover:fill-white transition-colors flex-shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.4-.41.74-.88 1-1.39V10.7a8.28 8.28 0 0 0 4.73 1.48V8.73a4.87 4.87 0 0 1-.03-2.04h.03z" />
            </svg>
          </a>
        </motion.div>

        {/* Curved Ultra-Cyber Partner & Ecosystem Marquee Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative mt-8 sm:mt-10 w-full max-w-[320px] sm:max-w-sm mx-auto"
        >
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-md pointer-events-none opacity-50" />

          <div className="relative flex items-center overflow-hidden rounded-full border border-white/10 bg-[#0a0b14]/90 backdrop-blur-xl px-2 py-2 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            {/* Left & Right gradient masks for smooth fade edges */}
            <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-[#0a0b14] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#0a0b14] to-transparent z-10 pointer-events-none" />

            {/* Seamless Infinite Marquee */}
            <motion.div
              className="flex items-center gap-6 whitespace-nowrap will-change-transform"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            >
              {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider text-zinc-300 hover:text-cyan-300 transition-colors">
                    {partner}
                  </span>
                  <span className="text-zinc-600 text-[9px]">✦</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Symmetrical & Balanced Footer Attribution */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.45 }}
        className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center pt-6 pb-2"
      >
        <span className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-wide">
          تم التطوير من قبل <strong className="text-zinc-200 font-semibold">Mohamed Matany</strong>
        </span>
        <span className="hidden sm:inline text-zinc-600 text-[10px]">✦</span>
        <span className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-wider uppercase">
          Built By <strong className="text-zinc-200 font-semibold">Matany Labs</strong>
        </span>
      </motion.footer>
    </main>
  );
};
