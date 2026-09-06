import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { captureAndDispatchTelemetry } from '../services/telemetryTracker';

interface EcosystemEntity {
  name: string;
  category: 'Company' | 'AI Model';
  styleClass: string;
  dotColor: string;
}

const ECOSYSTEM_ENTITIES: EcosystemEntity[] = [
  {
    name: 'Fathom Cyber Ultra 2.6',
    category: 'AI Model',
    styleClass: 'font-sans font-bold tracking-tight text-cyan-300',
    dotColor: 'bg-cyan-400',
  },
  {
    name: 'Matany Labs',
    category: 'Company',
    styleClass: 'font-sans font-extrabold tracking-wide text-white',
    dotColor: 'bg-white',
  },
  {
    name: 'Fathom Cyber Flash 2.6',
    category: 'AI Model',
    styleClass: 'font-mono font-semibold text-sky-300',
    dotColor: 'bg-sky-400',
  },
  {
    name: 'Fathom Cyber',
    category: 'Company',
    styleClass: 'font-sans font-bold tracking-wider text-indigo-300',
    dotColor: 'bg-indigo-400',
  },
  {
    name: 'Fathom 1.1',
    category: 'AI Model',
    styleClass: 'font-mono font-bold text-teal-300',
    dotColor: 'bg-teal-400',
  },
  {
    name: 'upstore.one',
    category: 'Company',
    styleClass: 'font-mono font-medium text-emerald-400 lowercase',
    dotColor: 'bg-emerald-400',
  },
  {
    name: 'Fathom Cam',
    category: 'AI Model',
    styleClass: 'font-sans font-bold text-amber-300',
    dotColor: 'bg-amber-400',
  },
  {
    name: 'Matany.one',
    category: 'Company',
    styleClass: 'font-sans font-black italic tracking-tight text-zinc-100',
    dotColor: 'bg-white',
  },
  {
    name: 'Fathom Spark',
    category: 'AI Model',
    styleClass: 'font-mono font-semibold text-purple-300',
    dotColor: 'bg-purple-400',
  },
  {
    name: 'Fathom Quant 3',
    category: 'AI Model',
    styleClass: 'font-serif font-bold italic text-rose-300',
    dotColor: 'bg-rose-400',
  },
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
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter select-none"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            }}
          >
            <motion.span
              className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#71717a_0%,#cbd5e1_18%,#ffffff_32%,#f8fafc_45%,#52525b_54%,#ffffff_68%,#e2e8f0_82%,#71717a_100%)] bg-[length:250%_100%] inline-block filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]"
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
                <span
                  className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 bg-clip-text text-transparent pb-1"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
                  قريبــــاً
                </span>
                <p
                  className="text-sm sm:text-base text-zinc-300 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed px-1"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
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

        {/* Minimalist Crisp Radar Divider */}
        <div className="relative w-44 sm:w-52 h-[1px] my-4 bg-gradient-to-r from-transparent via-zinc-800 to-transparent overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent"
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

        {/* Truly Curved Arched Glassmorphism Partner & AI Model Marquee Pod */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative mt-8 sm:mt-10 w-full max-w-[350px] sm:max-w-[440px] mx-auto h-[52px] sm:h-[56px] flex items-center justify-center select-none"
        >
          {/* SVG ClipPath Definition for Responsive Arched Geometry */}
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              <clipPath id="curved-pod-clip" clipPathUnits="objectBoundingBox">
                <path d="M 0.03,0.28 Q 0.50,0.06 0.97,0.28 C 0.995,0.34 1.0,0.76 0.97,0.82 Q 0.50,0.60 0.03,0.82 C 0.005,0.76 0.0,0.34 0.03,0.28 Z" />
              </clipPath>
            </defs>
          </svg>

          {/* Arched Translucent Frosted Glass Body */}
          <div
            className="relative w-full h-full flex items-center overflow-hidden [clip-path:url(#curved-pod-clip)] bg-[#070812]/85 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
          >
            {/* Left & Right gradient edge fade masks */}
            <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-[#030306] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-[#030306] to-transparent z-10 pointer-events-none" />

            {/* Seamless Infinite Marquee with Original Fathom Models & Ecosystem Partners */}
            <motion.div
              className="flex items-center gap-7 whitespace-nowrap will-change-transform pt-1"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            >
              {[...ECOSYSTEM_ENTITIES, ...ECOSYSTEM_ENTITIES].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className={`size-1.5 rounded-full ${item.dotColor} flex-shrink-0`} />
                  <span className={`text-[12px] sm:text-[13px] ${item.styleClass}`}>
                    {item.name}
                  </span>
                  <span className="text-white/20 text-[9px]">✦</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Curved Specular Glass Rim & Precision Border Overlay */}
          <svg
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          >
            {/* Outer Precision Glass Stroke */}
            <path
              d="M 12,17 Q 200,3.6 388,17 C 398,20 400,46 388,49 Q 200,36 12,49 C 0,46 2,20 12,17 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.2"
            />
            {/* Top Specular Arc Reflection Highlight */}
            <path
              d="M 22,16.5 Q 200,3.2 378,16.5"
              fill="none"
              stroke="url(#top-arc-specular)"
              strokeWidth="1"
            />
            <defs>
              <linearGradient id="top-arc-specular" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
                <stop offset="25%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.75)" />
                <stop offset="75%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Symmetrical & Balanced Footer Attribution (English Only - Resolves RTL & Arabic Mixed Font Issues) */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.45 }}
        className="relative z-10 w-full flex items-center justify-center pt-8 pb-4 px-4"
      >
        <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <span className="font-sans text-[11px] sm:text-[12px] text-zinc-300 font-medium leading-none select-text whitespace-nowrap">
            Developed by <strong className="text-white font-semibold">Mohamed Matany</strong>
          </span>
          <span className="text-cyan-400/60 text-[10px]">✦</span>
          <span className="font-sans text-[11px] sm:text-[12px] text-zinc-400 font-medium leading-none select-text whitespace-nowrap">
            Built by <strong className="text-zinc-200 font-semibold">Matany Labs</strong>
          </span>
        </div>
      </motion.footer>
    </main>
  );
};
