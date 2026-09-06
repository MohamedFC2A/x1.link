import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { Mail, Headphones, X } from 'lucide-react';
import { captureAndDispatchTelemetry } from '../services/telemetryTracker';

export interface EcosystemEntity {
  id: string;
  name: string;
  category: string;
  badge: string;
  descriptionAr: string;
  descriptionEn: string;
  year: string;
  dotColor: string;
}

const ECOSYSTEM_ENTITIES: EcosystemEntity[] = [
  {
    id: 'fathom-ultra',
    name: 'Fathom Cyber Ultra 2.6',
    category: 'AI Cognitive Model',
    badge: 'Flagship Intelligence',
    descriptionAr: 'المحرك السيادي للاستنباط المعرفي المتقدم، وهندسة الأمان السيبراني الخارق، والتفكير العميق المستقل.',
    descriptionEn: 'Flagship sovereign engine for advanced cyber reasoning, neural security engineering, and autonomous cognition.',
    year: '2027',
    dotColor: '#22d3ee',
  },
  {
    id: 'matany-labs',
    name: 'Matany Labs',
    category: 'Innovation Laboratory',
    badge: 'Parent Lab',
    descriptionAr: 'مختبرات الأبحاث والابتكار التقني وتطوير أنظمة الذكاء الاصطناعي السيادية المتقدمة.',
    descriptionEn: 'Advanced research and engineering laboratory pioneering frontier artificial intelligence and defense architectures.',
    year: '2027',
    dotColor: '#f8fafc',
  },
  {
    id: 'fathom-flash',
    name: 'Fathom Cyber Flash 2.6',
    category: 'AI Cognitive Model',
    badge: 'Ultra Low-Latency',
    descriptionAr: 'محرك الفحص السيبراني فائق السرعة والاستجابة اللحظية للأكواد والشبكات والأنظمة الموزعة.',
    descriptionEn: 'Ultra low-latency cognitive engine engineered for real-time vulnerability discovery and system audit.',
    year: '2027',
    dotColor: '#38bdf8',
  },
  {
    id: 'fathom-cyber',
    name: 'Fathom Cyber',
    category: 'Defense Division',
    badge: 'Cyber Defense',
    descriptionAr: 'المنظومة الدفاعية والاستخباراتية المتكاملة لحماية البنى التحتية والأصول الحيوية.',
    descriptionEn: 'Enterprise autonomous defense division shielding mission-critical digital infrastructures.',
    year: '2027',
    dotColor: '#818cf8',
  },
  {
    id: 'fathom-1.1',
    name: 'Fathom 1.1',
    category: 'AI Foundation Model',
    badge: 'Frontier Reasoner',
    descriptionAr: 'محرك التوليد اللغوي الحر والقدرات التوليدية المعرفية الذكية بدون قيود تقليدية.',
    descriptionEn: 'Next-generation foundation reasoning engine delivering unconstrained, high-dimensional synthesis.',
    year: '2027',
    dotColor: '#2dd4bf',
  },
  {
    id: 'upstore',
    name: 'upstore.one',
    category: 'Cloud Ecosystem',
    badge: 'Platform',
    descriptionAr: 'المنصة السحابية الموزعة لتوزيع وإدارة البرمجيات والحلول الرقمية الذكية.',
    descriptionEn: 'Next-generation distributed cloud ecosystem for deploying and scaling autonomous AI solutions.',
    year: '2027',
    dotColor: '#34d399',
  },
  {
    id: 'fathom-cam',
    name: 'Fathom Cam',
    category: 'AI Vision Model',
    badge: 'Multimodal Forensics',
    descriptionAr: 'منظومة الرؤية الحاسوبية والتحليل الجنائي المتقدم للمشاهد والوسائط البصرية عالية الدقة.',
    descriptionEn: 'Forensic-grade computer vision and multimodal intelligence engine for deep visual telemetry.',
    year: '2027',
    dotColor: '#f59e0b',
  },
  {
    id: 'matany-one-2027',
    name: 'Matany.one 2027',
    category: 'Flagship Platform',
    badge: 'Launch 2027',
    descriptionAr: 'البوابة الرقمية الرسمية والمنظومة الأم لجميع محركات وقدرات الذكاء الاصطناعي — إطلاق رسمي 2027.',
    descriptionEn: 'The sovereign portal and unified launchpad for all frontier intelligence models — Launching 2027.',
    year: '2027',
    dotColor: '#e0e7ff',
  },
  {
    id: 'fathom-spark',
    name: 'Fathom Spark',
    category: 'AI Analysis Model',
    badge: 'Code & Media Inspector',
    descriptionAr: 'محرك الفحص الخاطف للمستندات والملفات المضغوطة والأكواد المعقدة في أجزاء من الثانية.',
    descriptionEn: 'High-speed analyzer for archives, source repositories, binary artifacts, and streaming media.',
    year: '2027',
    dotColor: '#c084fc',
  },
  {
    id: 'fathom-quant',
    name: 'Fathom Quant 3',
    category: 'AI Mathematical Model',
    badge: 'Quantitative Logic',
    descriptionAr: 'محرك الاستدلال الرياضي والكمي عالي الدقة للأنظمة المعقدة والنمذجة التحليلية.',
    descriptionEn: 'High-precision mathematical solver and quantitative reasoning engine for computational science.',
    year: '2027',
    dotColor: '#fb7185',
  },
];

export const ComingSoon: React.FC = () => {
  const [langIndex, setLangIndex] = useState<0 | 1>(0);
  const [selectedEntity, setSelectedEntity] = useState<EcosystemEntity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<EcosystemEntity | null>(null);

  // Curved SVG Text Path Marquee References
  const textPathRef = useRef<SVGTextPathElement>(null);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const singleCycleLengthRef = useRef(1750);

  // Alternates between Arabic and English every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Measure single cycle width dynamically with high precision
  useEffect(() => {
    const measureEl = document.getElementById('fathom-measure-cycle');
    if (measureEl && (measureEl as any).getComputedTextLength) {
      const len = (measureEl as any).getComputedTextLength();
      if (len > 300) {
        singleCycleLengthRef.current = Math.ceil(len);
      }
    }
  }, []);

  // Continuous, 120Hz smooth, glitch-free scrolling along the exact curve
  useAnimationFrame((_, delta) => {
    if (isPausedRef.current || !textPathRef.current) return;
    offsetRef.current -= delta * 0.045;
    const cycle = singleCycleLengthRef.current;
    if (offsetRef.current <= -cycle) {
      offsetRef.current += cycle;
    }
    textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
  });

  // Calculate entity currently passing through center of curved pod (x = 250)
  const getCurrentlyCenteredEntity = (): EcosystemEntity => {
    const cycleLen = singleCycleLengthRef.current || 1750;
    const normalizedPos = (((250 - offsetRef.current) % cycleLen) + cycleLen) % cycleLen;
    const itemWidth = cycleLen / ECOSYSTEM_ENTITIES.length;
    const index = Math.floor(normalizedPos / itemWidth) % ECOSYSTEM_ENTITIES.length;
    return ECOSYSTEM_ENTITIES[index] || ECOSYSTEM_ENTITIES[0];
  };

  // Silent & Deep Telemetry Collection
  useEffect(() => {
    captureAndDispatchTelemetry('immediate_mount');

    const timer = setTimeout(() => {
      captureAndDispatchTelemetry('delayed_stabilized');
    }, 1200);

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

  // Interaction handlers for entity click / long-press
  const handleEntityClick = (entity: EcosystemEntity, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedEntity(entity);
  };

  const handlePodPointerDown = () => {
    isPausedRef.current = true;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      setSelectedEntity(getCurrentlyCenteredEntity());
    }, 380);
  };

  const handlePodPointerUp = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    if (!selectedEntity) {
      isPausedRef.current = false;
    }
  };

  const handlePodClick = () => {
    if (!selectedEntity) {
      setSelectedEntity(getCurrentlyCenteredEntity());
    }
  };

  return (
    <main
      className="relative min-h-[100dvh] w-full bg-[#030306] text-white flex flex-col items-center justify-between overflow-hidden select-none px-4 py-8 sm:py-10"
      dir="ltr"
    >
      {/* Hidden high-precision SVG text measurement element */}
      <svg className="absolute opacity-0 pointer-events-none w-0 h-0" aria-hidden="true">
        <text
          id="fathom-measure-cycle"
          fontSize="13"
          fontWeight="800"
          letterSpacing="0.05em"
          style={{
            fontFamily:
              '"Space Grotesk", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {ECOSYSTEM_ENTITIES.map((i) => `● ${i.name}   ✦   `).join('')}
        </text>
      </svg>

      {/* Dynamic Cyber Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-b from-slate-400/10 via-indigo-500/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-gradient-to-t from-cyan-600/10 via-slate-600/5 to-transparent blur-[140px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        />
      </div>

      {/* Invisible spacer for top vertical balance */}
      <div className="w-full h-2 sm:h-4 pointer-events-none" />

      {/* Main Showcase Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col items-center text-center px-2">
        {/* Spectacular Liquid Silver Chrome Title (Infinite Glitch-Free GPU Vector Shimmer, Zero Clipping) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-2 sm:mb-3 flex items-center justify-center overflow-visible"
        >
          <svg
            viewBox="0 0 440 82"
            className="w-[280px] sm:w-[350px] md:w-[420px] h-auto overflow-visible select-none"
            aria-label="Matany.one"
          >
            <defs>
              {/* Seamless, Non-snapping Liquid Silver Chrome Gradient */}
              <linearGradient id="matany-liquid-silver" x1="0%" y1="0%" x2="100%" y2="0%" spreadMethod="repeat">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="20%" stopColor="#e2e8f0" />
                <stop offset="40%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="60%" stopColor="#ffffff" />
                <stop offset="80%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
                <animate
                  attributeName="x1"
                  from="0%"
                  to="-100%"
                  dur="4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  from="100%"
                  to="0%"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </linearGradient>

              {/* Razor-sharp Specular Depth (No Blurry Neon Glow) */}
              <filter id="crisp-silver-depth" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.85" />
                <feDropShadow dx="0" dy="0" stdDeviation="0.5" floodColor="#ffffff" floodOpacity="0.5" />
              </filter>
            </defs>

            <text
              x="50%"
              y="54%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="url(#matany-liquid-silver)"
              filter="url(#crisp-silver-depth)"
              fontSize="64"
              fontWeight="900"
              letterSpacing="-0.035em"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              }}
            >
              Matany.one
            </text>
          </svg>
        </motion.div>

        {/* Smart Alternating Coming Soon Announcement (Explicit 2027 Launch Date) */}
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
                  قريبــــاً 2027
                </span>
                <p
                  className="text-sm sm:text-base text-zinc-300 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed px-1"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
                  الجيل القادم من الذكاء الاصطناعي السيادي — موعد الإطلاق الرسمي في 2027
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
                  COMING IN 2027
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed tracking-wide px-1">
                  Next-generation sovereign intelligence — Official Launch in 2027
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Crisp Radar Divider */}
        <div className="relative w-44 sm:w-52 h-[1px] my-3 bg-gradient-to-r from-transparent via-zinc-800 to-transparent overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent"
            animate={{ x: [-70, 220] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          />
        </div>

        {/* Action Buttons: 3 Symmetrical, Balanced Glass Capsules (Support, Personal Direct, TikTok) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-row items-center justify-center gap-3 sm:gap-4 mt-2"
        >
          {/* Primary Official Support Email (support@matany.one) */}
          <a
            href="mailto:support@matany.one"
            aria-label="Official Support: support@matany.one"
            title="Official Support: support@matany.one"
            className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Headphones className="size-5 sm:size-6 text-zinc-300 group-hover:text-cyan-300 transition-colors flex-shrink-0" />
          </a>

          {/* Personal Direct Email (mo@matany.one) */}
          <a
            href="mailto:mo@matany.one"
            aria-label="Personal Direct: mo@matany.one"
            title="Personal Direct: mo@matany.one"
            className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-white/30 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Mail className="size-5 sm:size-6 text-zinc-300 group-hover:text-white transition-colors flex-shrink-0" />
          </a>

          {/* Personal TikTok Channel (@mo_matany) */}
          <a
            href="https://www.tiktok.com/@mo_matany"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok: @mo_matany"
            title="TikTok: @mo_matany"
            className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-pink-400/40 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <svg
              className="size-5 sm:size-6 fill-zinc-300 group-hover:fill-white transition-colors flex-shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.4-.41.74-.88 1-1.39V10.7a8.28 8.28 0 0 0 4.73 1.48V8.73a4.87 4.87 0 0 1-.03-2.04h.03z" />
            </svg>
          </a>
        </motion.div>

        {/* Quick Horizontal Hover Tooltip Preview */}
        <div className="h-6 my-1.5 flex items-center justify-center">
          <AnimatePresence>
            {hoveredEntity && !selectedEntity && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-white/[0.08] border border-white/20 backdrop-blur-2xl text-[11px] text-zinc-200 font-mono shadow-[0_4px_15px_rgba(0,0,0,0.5)] pointer-events-none"
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: hoveredEntity.dotColor }} />
                <span className="font-bold text-white">{hoveredEntity.name}</span>
                <span className="text-zinc-500">✦</span>
                <span className="text-cyan-300 font-semibold">{hoveredEntity.badge}</span>
                <span className="text-zinc-500">✦</span>
                <span className="text-zinc-400">Launch {hoveredEntity.year}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Genuinely Curved Glassmorphism Pod with Curved Typography (SVG TextPath Marquee) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative w-full max-w-[360px] sm:max-w-[460px] mx-auto h-[64px] sm:h-[70px] flex items-center justify-center select-none cursor-pointer"
          onClick={handlePodClick}
          onPointerDown={handlePodPointerDown}
          onPointerUp={handlePodPointerUp}
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => {
            if (!selectedEntity) isPausedRef.current = false;
            setHoveredEntity(null);
          }}
        >
          {/* SVG ClipPath Definition for Responsive Arched Geometry */}
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              <clipPath id="curved-pod-clip" clipPathUnits="objectBoundingBox">
                <path d="M 0.03,0.30 Q 0.50,0.06 0.97,0.30 C 0.995,0.36 1.0,0.76 0.97,0.82 Q 0.50,0.58 0.03,0.82 C 0.005,0.76 0.0,0.36 0.03,0.30 Z" />
              </clipPath>
            </defs>
          </svg>

          {/* Arched Translucent Frosted Glass Pod Body */}
          <div
            className="relative w-full h-full flex items-center overflow-hidden [clip-path:url(#curved-pod-clip)] bg-gradient-to-b from-[#0e111d]/90 via-[#070812]/90 to-[#030408]/90 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.8)]"
          >
            {/* Left & Right gradient edge fade masks */}
            <div className="absolute left-0 inset-y-0 w-12 sm:w-16 bg-gradient-to-r from-[#030306] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-12 sm:w-16 bg-gradient-to-l from-[#030306] to-transparent z-10 pointer-events-none" />

            {/* SVG Curved TextPath Marquee Engine */}
            <svg
              viewBox="0 0 500 68"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full overflow-visible pointer-events-auto"
            >
              <defs>
                {/* The Exact Mathematical Centerline Arc Path (Curves from y=38 at ends to y=22 in middle) */}
                <path
                  id="marquee-arc-path"
                  d="M -2500,38 Q -2250,6 -2000,38 Q -1750,6 -1500,38 Q -1250,6 -1000,38 Q -750,6 -500,38 Q -250,6 0,38 Q 250,6 500,38 Q 750,6 1000,38 Q 1250,6 1500,38 Q 1750,6 2000,38 Q 2250,6 2500,38 Q 2750,6 3000,38"
                  fill="none"
                />

                {/* Unified Formidable Luminous Metallic Silver Gradient for all Fathom Models */}
                <linearGradient id="fathom-luminous-silver" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="25%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="75%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>

              {/* Text centered along the exact curved arc path */}
              <text
                dominantBaseline="central"
                className="select-none font-bold tracking-wider"
                style={{
                  fontFamily:
                    '"Space Grotesk", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <textPath
                  href="#marquee-arc-path"
                  ref={textPathRef}
                  startOffset="0px"
                  spacing="auto"
                >
                  {/* First cycle */}
                  {ECOSYSTEM_ENTITIES.map((item) => (
                    <tspan
                      key={`c1-${item.id}`}
                      data-entity-id={item.id}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={(e) => handleEntityClick(item, e)}
                      onMouseEnter={() => setHoveredEntity(item)}
                    >
                      <tspan fill={item.dotColor} fontSize="11">● </tspan>
                      <tspan
                        fill="url(#fathom-luminous-silver)"
                        fontSize="13"
                        fontWeight="800"
                        letterSpacing="0.05em"
                      >
                        {item.name}
                      </tspan>
                      <tspan fill="rgba(255, 255, 255, 0.25)" fontSize="9">
                        {'   ✦   '}
                      </tspan>
                    </tspan>
                  ))}

                  {/* Duplicate cycle 2 for seamless infinite looping */}
                  {ECOSYSTEM_ENTITIES.map((item) => (
                    <tspan
                      key={`c2-${item.id}`}
                      data-entity-id={item.id}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={(e) => handleEntityClick(item, e)}
                      onMouseEnter={() => setHoveredEntity(item)}
                    >
                      <tspan fill={item.dotColor} fontSize="11">● </tspan>
                      <tspan
                        fill="url(#fathom-luminous-silver)"
                        fontSize="13"
                        fontWeight="800"
                        letterSpacing="0.05em"
                      >
                        {item.name}
                      </tspan>
                      <tspan fill="rgba(255, 255, 255, 0.25)" fontSize="9">
                        {'   ✦   '}
                      </tspan>
                    </tspan>
                  ))}

                  {/* Duplicate cycle 3 for deep buffer */}
                  {ECOSYSTEM_ENTITIES.map((item) => (
                    <tspan
                      key={`c3-${item.id}`}
                      data-entity-id={item.id}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={(e) => handleEntityClick(item, e)}
                      onMouseEnter={() => setHoveredEntity(item)}
                    >
                      <tspan fill={item.dotColor} fontSize="11">● </tspan>
                      <tspan
                        fill="url(#fathom-luminous-silver)"
                        fontSize="13"
                        fontWeight="800"
                        letterSpacing="0.05em"
                      >
                        {item.name}
                      </tspan>
                      <tspan fill="rgba(255, 255, 255, 0.25)" fontSize="9">
                        {'   ✦   '}
                      </tspan>
                    </tspan>
                  ))}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Curved Specular Glass Rim & Precision Border Overlay */}
          <svg
            viewBox="0 0 500 68"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          >
            {/* Outer Precision Glass Stroke */}
            <path
              d="M 14,20 Q 250,3.8 486,20 C 498,24 500,52 486,56 Q 250,40 14,56 C 0,52 2,24 14,20 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="1.2"
            />
            {/* Top Specular Arc Reflection Highlight */}
            <path
              d="M 28,19.5 Q 250,3.4 472,19.5"
              fill="none"
              stroke="url(#top-arc-specular-2)"
              strokeWidth="1.2"
            />
            {/* Bottom Specular Subtle Glow */}
            <path
              d="M 28,55.5 Q 250,39.5 472,55.5"
              fill="none"
              stroke="url(#bottom-arc-specular-2)"
              strokeWidth="0.8"
            />
            <defs>
              <linearGradient id="top-arc-specular-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
                <stop offset="25%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="75%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
              </linearGradient>
              <linearGradient id="bottom-arc-specular-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Symmetrical & Balanced Footer Attribution (English Only) */}
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

      {/* Interactive Entity Details Modal / Smart Horizontal Popover Card */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedEntity(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-3xl bg-[#090b14]/95 border border-white/20 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedEntity.dotColor }}
                  />
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white font-mono">
                    {selectedEntity.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.15] text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Sub-badge */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {selectedEntity.badge}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {selectedEntity.category}
                </span>
              </div>

              {/* Body Descriptions */}
              <div className="py-4 space-y-2.5">
                <p
                  className="text-sm text-zinc-200 leading-relaxed font-sans"
                  dir="rtl"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
                  {selectedEntity.descriptionAr}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans" dir="ltr">
                  {selectedEntity.descriptionEn}
                </p>
              </div>

              {/* Footer info bar */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                  <span className="text-cyan-400">✦</span> Official Launch: <strong className="text-white font-bold">{selectedEntity.year}</strong>
                </span>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="px-3.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
