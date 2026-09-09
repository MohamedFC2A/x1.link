import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { Mail, Headphones, X } from 'lucide-react';
import { captureAndDispatchTelemetry, isUserApprovedOrUnlocked } from '../services/telemetryTracker';
import { AuraEarlyAccessButton } from './AuraEarlyAccessButton';
import { EarlyAccessModal } from './EarlyAccessModal';

export interface EcosystemEntity {
  id: string;
  name: string;
  badge: string;
  gradientId: string;
  dotColor: string;
  descriptionAr: string;
  descriptionEn: string;
  year: string;
}

const ECOSYSTEM_ENTITIES: EcosystemEntity[] = [
  {
    id: 'fathom-ultra',
    name: 'Fathom Cyber Ultra 2.6',
    badge: 'Advanced Cyber & Systems AI',
    gradientId: 'grad-ultra',
    dotColor: '#22d3ee',
    descriptionAr: 'النموذج الأكثر تطوراً لتحليل الأنظمة البرمجية، واكتشاف الثغرات الأمنية، والمساعدة في بناء الحلول الدفاعية.',
    descriptionEn: 'Flagship model for software architecture analysis, vulnerability assessment, and robust security engineering.',
    year: '2027',
  },
  {
    id: 'fathom-flash-26',
    name: 'Fathom Cyber Flash 2.6',
    badge: 'Fast & Low-Latency Model',
    gradientId: 'grad-flash',
    dotColor: '#38bdf8',
    descriptionAr: 'نموذج فائق السرعة مخصص للمهام اللحظية وفحص الأكواد البرمجية وتقديم استجابات فورية بدون تأخير.',
    descriptionEn: 'A lightweight, high-speed model optimized for real-time code analysis and instant low-latency responses.',
    year: '2027',
  },
  {
    id: 'fathom-cyber',
    name: 'Fathom Cyber',
    badge: 'Cybersecurity Division',
    gradientId: 'grad-cyber',
    dotColor: '#818cf8',
    descriptionAr: 'منظومة أدوات وتقنيات متكاملة لحماية التطبيقات والأنظمة الرقمية وإدارة المخاطر الأمنية بفاعلية.',
    descriptionEn: 'A comprehensive suite of cybersecurity tools designed to protect digital platforms and manage security risks.',
    year: '2027',
  },
  {
    id: 'fathom-1.1',
    name: 'Fathom 1.1',
    badge: 'Foundation AI Model',
    gradientId: 'grad-11',
    dotColor: '#2dd4bf',
    descriptionAr: 'نموذج لغوي تأسيسي يتميز بالفهم العميق للنصوص، والكتابة الذكية، وحل المشكلات المنطقية المتنوعة.',
    descriptionEn: 'A foundation language model engineered for deep text understanding, smart synthesis, and general logical reasoning.',
    year: '2027',
  },
  {
    id: 'upstore',
    name: 'upstore.one',
    badge: 'Cloud Platform',
    gradientId: 'grad-upstore',
    dotColor: '#34d399',
    descriptionAr: 'منصة سحابية حديثة تتيح استضافة ونشر التطبيقات والحلول البرمجية وإدارتها بكل سهولة وموثوقية.',
    descriptionEn: 'A modern cloud platform for hosting, deploying, and seamlessly managing web applications and digital tools.',
    year: '2027',
  },
  {
    id: 'fathom-cam',
    name: 'Fathom Cam',
    badge: 'Computer Vision Model',
    gradientId: 'grad-cam',
    dotColor: '#fbbf24',
    descriptionAr: 'نموذج متخصص في تحليل وفهم الصور والمشاهد البصرية، واستخراج النصوص والعناصر بدقة وسرعة عالية.',
    descriptionEn: 'An advanced computer vision model for analyzing images, scene understanding, and extracting visual data with high precision.',
    year: '2027',
  },
  {
    id: 'matany-one',
    name: 'Matany.one',
    badge: 'Official Platform Gateway',
    gradientId: 'grad-matany',
    dotColor: '#cbd5e1',
    descriptionAr: 'الموقع الرسمي والبوابة المركزية التي تجمع كافة نماذج وأدوات الذكاء الاصطناعي في منصة واحدة متكاملة.',
    descriptionEn: 'The official flagship portal unifying all artificial intelligence models and tools in one seamless platform.',
    year: '2027',
  },
  {
    id: 'fathom-spark',
    name: 'Fathom Spark',
    badge: 'Code & Document Inspector',
    gradientId: 'grad-spark',
    dotColor: '#c084fc',
    descriptionAr: 'أداة ذكية وسريعة لفحص الملفات والأكواد البرمجية، وتلخيص المستندات واستخراج البيانات المهمة منها.',
    descriptionEn: 'A fast analysis tool for inspecting source code, summarizing documents, and extracting structured data.',
    year: '2027',
  },
  {
    id: 'fathom-quant',
    name: 'Fathom Quant 3',
    badge: 'Math & Data Analysis',
    gradientId: 'grad-quant',
    dotColor: '#fb7185',
    descriptionAr: 'نموذج متخصص في حل المسائل الرياضية المعقدة، والتحليل الإحصائي، والحسابات العلمية والمالية بدقة عالية.',
    descriptionEn: 'A specialized model designed for solving complex mathematical problems, statistical analysis, and data calculations.',
    year: '2027',
  },
];

interface ComingSoonProps {
  onPlatformUnlock?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onPlatformUnlock }) => {
  const [langIndex, setLangIndex] = useState<0 | 1>(0);
  const [selectedEntity, setSelectedEntity] = useState<EcosystemEntity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<EcosystemEntity | null>(null);
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);

  // Curved SVG Text Path Marquee References & Seamless Infinite Engine
  const PATH_PRE_LENGTH = 3000;
  const BASE_START_OFFSET = PATH_PRE_LENGTH - 200;
  const textPathRef = useRef<SVGTextPathElement>(null);
  const cycle1Ref = useRef<SVGTSpanElement>(null);
  const podContainerRef = useRef<HTMLDivElement>(null);
  const entitySegmentsRef = useRef<{ entity: EcosystemEntity; start: number; end: number }[]>([]);
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const offsetRef = useRef(BASE_START_OFFSET);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const dragMovedRef = useRef(false);
  const singleCycleLengthRef = useRef(1500);

  // Alternates between Arabic and English every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Measure rendered single cycle length and exact individual entity boundaries
  useEffect(() => {
    const measure = () => {
      if (cycle1Ref.current) {
        const tspans = cycle1Ref.current.querySelectorAll('[data-entity-id]');
        if (tspans && tspans.length > 0) {
          let cumulative = 0;
          const segments: { entity: EcosystemEntity; start: number; end: number }[] = [];
          tspans.forEach((el) => {
            const id = el.getAttribute('data-entity-id');
            const entity = ECOSYSTEM_ENTITIES.find((item) => item.id === id);
            let len = 0;
            try {
              len = (el as any).getComputedTextLength ? (el as any).getComputedTextLength() : 0;
            } catch {}
            if (len <= 0) {
              len = 166.6;
            }
            if (entity) {
              segments.push({
                entity,
                start: cumulative,
                end: cumulative + len,
              });
              cumulative += len;
            }
          });
          if (segments.length === ECOSYSTEM_ENTITIES.length && cumulative > 300) {
            entitySegmentsRef.current = segments;
            singleCycleLengthRef.current = cumulative;
            if (!isDraggingRef.current && textPathRef.current) {
              textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
            }
            return;
          }
        }

        if ((cycle1Ref.current as any).getComputedTextLength) {
          const len = (cycle1Ref.current as any).getComputedTextLength();
          if (len > 300) {
            singleCycleLengthRef.current = len;
            if (!isDraggingRef.current && textPathRef.current) {
              textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
            }
          }
        }
      }
    };
    measure();
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.ready.then(measure);
    }
  }, []);

  // Continuous, 120Hz smooth, mathematically glitch-free infinite scrolling
  useAnimationFrame((_, delta) => {
    if (isPausedRef.current || isDraggingRef.current || !textPathRef.current) return;
    const clampedDelta = Math.min(delta, 34);
    offsetRef.current -= clampedDelta * 0.045;
    const cycle = singleCycleLengthRef.current || 1500;
    if (cycle > 0) {
      // Seamless mathematical modulo wrapping in both directions
      if (offsetRef.current <= BASE_START_OFFSET - cycle) {
        offsetRef.current += cycle;
      } else if (offsetRef.current > BASE_START_OFFSET) {
        offsetRef.current -= cycle;
      }
    }
    textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
  });

  // Calculate entity from exact viewport (X, Y) touch or click coordinates
  const resolveEntityAtPoint = (clientX: number, clientY: number): EcosystemEntity => {
    // 1. Check DOM hit via elementFromPoint
    try {
      const el = document.elementFromPoint(clientX, clientY);
      const entityEl = el?.closest('[data-entity-id]');
      if (entityEl) {
        const id = entityEl.getAttribute('data-entity-id');
        const found = ECOSYSTEM_ENTITIES.find((item) => item.id === id);
        if (found) return found;
      }
    } catch {}

    // 2. High-Precision Mathematical Arc-Length Coordinate Hit-Testing
    const pod = podContainerRef.current;
    if (pod) {
      const rect = pod.getBoundingClientRect();
      if (rect.width > 0) {
        const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const svgX = relX * 500;
        // Along the path: M -3000,38 L 0,38 Q 250,6 500,38
        const arcDistance = PATH_PRE_LENGTH + (svgX * 1.016);
        const cycleLen = singleCycleLengthRef.current || 1500;
        const posInCycle = (((arcDistance - offsetRef.current) % cycleLen) + cycleLen) % cycleLen;

        if (entitySegmentsRef.current.length === ECOSYSTEM_ENTITIES.length) {
          for (const seg of entitySegmentsRef.current) {
            if (posInCycle >= seg.start && posInCycle < seg.end) {
              return seg.entity;
            }
          }
        }

        const itemWidth = cycleLen / ECOSYSTEM_ENTITIES.length;
        const index = Math.floor(posInCycle / itemWidth) % ECOSYSTEM_ENTITIES.length;
        return ECOSYSTEM_ENTITIES[index] || ECOSYSTEM_ENTITIES[0];
      }
    }

    return ECOSYSTEM_ENTITIES[0];
  };

  // Silent & Deep Telemetry Collection (Exempt for Approved Users)
  useEffect(() => {
    if (isUserApprovedOrUnlocked()) {
      return;
    }

    captureAndDispatchTelemetry('immediate_mount');

    const timer = setTimeout(() => {
      if (isUserApprovedOrUnlocked()) return;
      captureAndDispatchTelemetry('delayed_stabilized');
    }, 1200);

    const handleInteraction = (e: Event) => {
      if (isUserApprovedOrUnlocked()) return;
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

  // Interaction handlers for entity click / touch drag
  const handleEntityClick = (entity: EcosystemEntity, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedEntity(entity);
    isPausedRef.current = true;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isPausedRef.current = true;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    dragMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !textPathRef.current) return;
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    if (Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y) > 10) {
      dragMovedRef.current = true;
    }
    offsetRef.current += deltaX;
    const cycle = singleCycleLengthRef.current || 1500;
    if (cycle > 0) {
      if (offsetRef.current <= BASE_START_OFFSET - cycle) {
        offsetRef.current += cycle;
      } else if (offsetRef.current > BASE_START_OFFSET) {
        offsetRef.current -= cycle;
      }
    }
    textPathRef.current.setAttribute('startOffset', `${offsetRef.current}px`);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const elapsed = Date.now() - pointerStartRef.current.time;
    const dist = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y);
    isDraggingRef.current = false;

    // Precise Touch or Click Selection: if not dragged beyond micro-jitter threshold
    if (!dragMovedRef.current && dist < 12 && elapsed < 450) {
      const entity = resolveEntityAtPoint(e.clientX, e.clientY);
      if (entity) {
        setSelectedEntity(entity);
        isPausedRef.current = true;
        return;
      }
    }

    if (!selectedEntity) {
      isPausedRef.current = false;
    }
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    if (!selectedEntity) {
      isPausedRef.current = false;
    }
  };

  return (
    <main
      className="relative min-h-[100dvh] w-full bg-[#000000] text-white flex flex-col items-center justify-between overflow-hidden select-none px-4 py-8 sm:py-10"
      dir="ltr"
    >

      {/* Dynamic Cyber Background Gradients (Pure Obsidian Luxury, Zero Navy Tint) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Top Ambient Silver/Platinum Sheen */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-white/[0.04] via-zinc-500/[0.015] to-transparent blur-[150px] rounded-full" />
        
        {/* Center Spotlight */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* High-Precision Luxury Engineering Grid */}
        <div
          className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,#000_55%,transparent_100%)]"
        />

        {/* Precision Crosshair Intersection Dots for Ultra-High-End Grid Finish */}
        <div
          className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,#000_50%,transparent_100%)]"
        />

        {/* Bottom Pure Pitch-Black Fade */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/90 to-transparent" />
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

        {/* Smart Alternating Coming Soon Announcement (Zero Jitter, Pure In-Place Dissolve) */}
        <div className="relative w-full h-[88px] sm:h-[96px] flex items-center justify-center my-2 sm:my-3 overflow-hidden">
          <AnimatePresence initial={false}>
            {langIndex === 0 ? (
              <motion.div
                key="arabic"
                dir="rtl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none"
              >
                <span
                  className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent pb-1"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
                  قريبــــاً
                </span>
                <p
                  className="text-sm sm:text-base text-zinc-300 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed px-1"
                  style={{ fontFamily: "'Segoe UI', 'Cairo', -apple-system, sans-serif" }}
                >
                  الجيل القادم من أنظمة الذكاء الاصطناعي السيادي
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="english"
                dir="ltr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none"
              >
                <span className="text-2xl sm:text-3xl font-extrabold tracking-widest bg-gradient-to-r from-white via-cyan-200 to-sky-300 bg-clip-text text-transparent pb-1 uppercase">
                  COMING SOON
                </span>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 font-normal max-w-xs sm:max-w-sm leading-relaxed tracking-wide px-1">
                  Next-generation sovereign intelligence
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

        {/* Hyper-Luminous Aura VIP Early Access Button */}
        <div className="my-2 sm:my-2.5 z-20">
          <AuraEarlyAccessButton
            langIndex={langIndex}
            onClick={() => setIsEarlyAccessOpen(true)}
          />
        </div>

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
                <span className="font-semibold" style={{ color: hoveredEntity.dotColor }}>
                  {hoveredEntity.badge}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Genuinely Curved Glassmorphism Pod with Curved Typography (Infinite Seamless SVG TextPath Engine) */}
        <motion.div
          ref={podContainerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative w-full max-w-[360px] sm:max-w-[480px] mx-auto h-[66px] sm:h-[72px] flex items-center justify-center select-none cursor-pointer active:cursor-grabbing touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => {
            if (!selectedEntity && !isDraggingRef.current) isPausedRef.current = false;
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
            className="relative w-full h-full flex items-center overflow-hidden [clip-path:url(#curved-pod-clip)] bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.85)]"
          >
            {/* Pure CSS Edge Fade Overlays - Guaranteed 100% reliable across all browsers */}
            <div className="absolute left-0 inset-y-0 w-10 sm:w-14 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-10 sm:w-14 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            {/* SVG Curved TextPath Marquee Engine */}
            <svg
              viewBox="0 0 500 68"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full overflow-hidden pointer-events-auto"
            >
              <defs>
                {/* Mathematical Centerline Arc Path (Straight leads + perfectly curved pod arc) */}
                <path
                  id="marquee-arc-path"
                  d="M -3000,38 L 0,38 Q 250,6 500,38 L 4000,38"
                  fill="none"
                />

                {/* Individual Luminous Metallic/Neon Gradients for each Model */}
                {/* 1. Fathom Ultra: Electric Cyan */}
                <linearGradient id="grad-ultra" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="40%" stopColor="#a5f3fc" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#a5f3fc" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>

                {/* 2. Matany Labs: Pure Diamond Platinum */}
                <linearGradient id="grad-labs" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="40%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                {/* 3. Fathom Flash: Hyper Sky Blue */}
                <linearGradient id="grad-flash" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="40%" stopColor="#bae6fd" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#bae6fd" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* 4. Fathom Cyber: Imperial Indigo */}
                <linearGradient id="grad-cyber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="40%" stopColor="#c7d2fe" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#c7d2fe" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>

                {/* 5. Fathom 1.1: Emerald Mint Neural */}
                <linearGradient id="grad-11" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="40%" stopColor="#99f6e4" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#99f6e4" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>

                {/* 6. upstore.one: Cyber Jade */}
                <linearGradient id="grad-upstore" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="40%" stopColor="#a7f3d0" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#a7f3d0" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* 7. Fathom Cam: Solar Amber */}
                <linearGradient id="grad-cam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="40%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* 8. Matany.one: Liquid Mirror Silver */}
                <linearGradient id="grad-matany" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="40%" stopColor="#e2e8f0" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                {/* 9. Fathom Spark: Hyper Neon Violet */}
                <linearGradient id="grad-spark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="40%" stopColor="#f3e8ff" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f3e8ff" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>

                {/* 10. Fathom Quant 3: Vivid Coral Rose */}
                <linearGradient id="grad-quant" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="40%" stopColor="#fecdd3" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#fecdd3" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>

              {/* Direct Zero-Mask Marquee Text Group - Always 100% visible & crisp */}
              <g>
                <text
                  dominantBaseline="central"
                  className="select-none font-bold tracking-wider"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  <textPath
                    href="#marquee-arc-path"
                    ref={textPathRef}
                    startOffset="2800px"
                    spacing="auto"
                  >
                    {/* Primary Master Cycle 1 (Measured dynamically for exact modulo) */}
                    <tspan ref={cycle1Ref} id="fathom-cycle-1">
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
                            fill={`url(#${item.gradientId})`}
                            fontSize="14"
                            fontWeight="800"
                            letterSpacing="0.04em"
                          >
                            {item.name}
                          </tspan>
                          <tspan fill="rgba(255, 255, 255, 0.22)" fontSize="10">
                            {'       ✦       '}
                          </tspan>
                        </tspan>
                      ))}
                    </tspan>

                    {/* Cycle 2 (Identical seamless clone) */}
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
                          fill={`url(#${item.gradientId})`}
                          fontSize="14"
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          {item.name}
                        </tspan>
                        <tspan fill="rgba(255, 255, 255, 0.22)" fontSize="10">
                          {'       ✦       '}
                        </tspan>
                      </tspan>
                    ))}

                    {/* Cycle 3 (Buffer clone) */}
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
                          fill={`url(#${item.gradientId})`}
                          fontSize="14"
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          {item.name}
                        </tspan>
                        <tspan fill="rgba(255, 255, 255, 0.22)" fontSize="10">
                          {'       ✦       '}
                        </tspan>
                      </tspan>
                    ))}

                    {/* Cycle 4 (Extended continuous buffer) */}
                    {ECOSYSTEM_ENTITIES.map((item) => (
                      <tspan
                        key={`c4-${item.id}`}
                        data-entity-id={item.id}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(e) => handleEntityClick(item, e)}
                        onMouseEnter={() => setHoveredEntity(item)}
                      >
                        <tspan fill={item.dotColor} fontSize="11">● </tspan>
                        <tspan
                          fill={`url(#${item.gradientId})`}
                          fontSize="14"
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          {item.name}
                        </tspan>
                        <tspan fill="rgba(255, 255, 255, 0.22)" fontSize="10">
                          {'       ✦       '}
                        </tspan>
                      </tspan>
                    ))}

                    {/* Cycle 5 (Perpetual coverage buffer) */}
                    {ECOSYSTEM_ENTITIES.map((item) => (
                      <tspan
                        key={`c5-${item.id}`}
                        data-entity-id={item.id}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(e) => handleEntityClick(item, e)}
                        onMouseEnter={() => setHoveredEntity(item)}
                      >
                        <tspan fill={item.dotColor} fontSize="11">● </tspan>
                        <tspan
                          fill={`url(#${item.gradientId})`}
                          fontSize="14"
                          fontWeight="800"
                          letterSpacing="0.04em"
                        >
                          {item.name}
                        </tspan>
                        <tspan fill="rgba(255, 255, 255, 0.22)" fontSize="10">
                          {'       ✦       '}
                        </tspan>
                      </tspan>
                    ))}
                  </textPath>
                </text>
              </g>
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

      {/* Ultra-Luxury Obsidian Glass Footer (Mobile 2-Row Optimized Grid, Desktop 1-Row Pill) */}
      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45 }}
        className="relative z-10 w-full flex items-center justify-center pt-8 pb-4 px-3 sm:px-4 select-none"
      >
        <div className="w-full max-w-[360px] sm:max-w-none sm:w-auto p-3 sm:py-2.5 sm:px-6 rounded-2xl sm:rounded-full bg-zinc-950/85 border border-white/[0.12] backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {/* Mobile: Strict Unified 2-Column Parallel Grid | Desktop: Single Horizontal Pill */}
          <div className="grid grid-cols-[1fr_auto] sm:flex sm:items-center sm:gap-4 w-full items-center gap-y-2.5 sm:gap-y-0">
            {/* Developer Direct Attribution */}
            <div className="flex items-center text-left">
              <span className="font-sans text-[11.5px] sm:text-[12.5px] text-zinc-300 font-medium tracking-tight whitespace-nowrap">
                Developed by <strong className="text-white font-semibold tracking-normal">Mohamed Matany</strong>
              </span>
            </div>
            {/* Developer Icons: Strictly Pinned to Far Right Edge */}
            <div className="flex items-center justify-end gap-1.5 w-[64px] sm:w-[68px] shrink-0 justify-self-end ml-auto">
              <a
                href="mailto:mo@matany.one"
                aria-label="Direct Email: mo@matany.one"
                title="mo@matany.one"
                className="group relative flex items-center justify-center size-7 sm:size-7.5 rounded-xl bg-gradient-to-b from-white/[0.18] via-white/[0.07] to-white/[0.02] border border-white/25 hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <Mail className="size-3.5 text-zinc-200 group-hover:text-cyan-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors" />
              </a>
              <a
                href="https://www.tiktok.com/@mo_matany"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Personal TikTok: @mo_matany"
                title="@mo_matany"
                className="group relative flex items-center justify-center size-7 sm:size-7.5 rounded-xl bg-gradient-to-b from-white/[0.18] via-white/[0.07] to-white/[0.02] border border-white/25 hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <svg className="size-3.5 fill-zinc-200 group-hover:fill-cyan-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.4-.41.74-.88 1-1.39V10.7a8.28 8.28 0 0 0 4.73 1.48V8.73a4.87 4.87 0 0 1-.03-2.04h.03z" />
                </svg>
              </a>
            </div>

            {/* Delicate Mobile Divider (spans both columns) | Desktop Separator */}
            <div className="col-span-2 sm:hidden h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-0.5" />
            <span className="hidden sm:inline text-white/30 text-[10px] mx-1">✦</span>

            {/* Built by Matany Labs Attribution */}
            <div className="flex items-center text-left">
              <span className="font-sans text-[11.5px] sm:text-[12.5px] text-zinc-300 font-medium tracking-tight whitespace-nowrap">
                Built by <strong className="text-white font-semibold tracking-normal">Matany Labs</strong>
              </span>
            </div>
            {/* Labs Icons: Strictly Pinned to Far Right Edge */}
            <div className="flex items-center justify-end gap-1.5 shrink-0 justify-self-end ml-auto">
              <a
                href="mailto:support@matany.one"
                aria-label="Official Support Email: support@matany.one"
                title="support@matany.one"
                className="group relative flex items-center justify-center size-7 sm:size-7.5 rounded-xl bg-gradient-to-b from-white/[0.18] via-white/[0.07] to-white/[0.02] border border-white/25 hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <Headphones className="size-3.5 text-zinc-200 group-hover:text-cyan-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors" />
              </a>
              {/* Temporarily hidden: TikTok @matany_labs
              <a
                href="https://www.tiktok.com/@matany_labs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official TikTok: @matany_labs"
                title="@matany_labs"
                className="group relative flex items-center justify-center size-7 sm:size-7.5 rounded-xl bg-gradient-to-b from-white/[0.18] via-white/[0.07] to-white/[0.02] border border-white/25 hover:border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                <svg className="size-3.5 fill-zinc-200 group-hover:fill-cyan-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.4-.41.74-.88 1-1.39V10.7a8.28 8.28 0 0 0 4.73 1.48V8.73a4.87 4.87 0 0 1-.03-2.04h.03z" />
                </svg>
              </a>
              */}
            </div>
          </div>
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

              {/* Single Crisp Technical Badge (No Redundant Fluff) */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: `${selectedEntity.dotColor}18`,
                    color: selectedEntity.dotColor,
                    borderColor: `${selectedEntity.dotColor}40`,
                  }}
                >
                  {selectedEntity.badge}
                </span>
              </div>

              {/* Authoritative Technical Proof Descriptions */}
              <div className="py-4 space-y-3">
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
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIP Early Access System Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessOpen}
        onClose={() => setIsEarlyAccessOpen(false)}
        langIndex={langIndex}
        onPlatformUnlock={onPlatformUnlock}
      />
    </main>
  );
};
