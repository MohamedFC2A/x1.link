import React, { useEffect, useState } from 'react';
import { Zap, Flame, ShieldAlert, Cpu } from 'lucide-react';

interface X1TransformationOverlayProps {
  isActive: boolean;
}

export const X1TransformationOverlay: React.FC<X1TransformationOverlayProps> = ({ isActive }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Shockwave Flash */}
      <div className="absolute inset-0 bg-rose-950/30 animate-in fade-in zoom-in-110 duration-500 ease-out" />

      {/* Cyber Sweep Scanline */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent top-1/2 -translate-y-1/2" />

      {/* Centered High-Tech Transformation Badge */}
      <div className="relative flex flex-col items-center gap-3 p-6 rounded-3xl bg-[#0d0d12] border border-rose-800/80 shadow-2xl animate-in zoom-in-90 fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-800/80 flex items-center justify-center text-rose-500">
          <Flame className="w-8 h-8 fill-current" />
        </div>

        <div className="text-center space-y-1">
          <div className="text-sm font-mono font-bold tracking-widest text-rose-400">
            X1 PROTOCOL UNCHAINED
          </div>
          <div className="text-xs font-sans text-zinc-300">
            تم إطلاق محرك الذكاء الاصطناعي بكامل طاقته التحليلية (MAX)
          </div>
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-rose-400" />
            1M MEMORY
          </span>
          <span>•</span>
          <span className="text-rose-400 font-bold">FILTERS: OFF</span>
          <span>•</span>
          <span className="text-emerald-400">LATENCY: 0.00ms</span>
        </div>
      </div>
    </div>
  );
};
