import React from 'react';
import { Cpu, Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface NsfwNanoChipProps {
  isActive: boolean;
  onToggle: () => void;
}

export const NsfwNanoChip: React.FC<NsfwNanoChipProps> = ({
  isActive,
  onToggle,
}) => {
  const handleClick = () => {
    if (!isActive) {
      soundFx.playX1Activate();
    } else {
      soundFx.playX1Deactivate();
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all duration-300 select-none overflow-hidden cursor-pointer active:scale-95 shadow-md ${
        isActive
          ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-rose-500 text-white shadow-rose-950/50 ring-1 ring-rose-500/50'
          : 'bg-zinc-950/90 border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-zinc-200 shadow-black'
      }`}
      title={
        isActive
          ? 'شريحة NSFW NANO مفعلة بالكامل (انقر للتعطيل)'
          : 'تفعيل شريحة NSFW NANO (يتطلب بصمة الإصبع أو Face ID في كل مرة)'
      }
    >
      {/* Silicon Chip Micro-Pins (Top & Bottom subtle golden connectors) */}
      <div className="absolute top-0 inset-x-2 h-[1.5px] flex justify-between pointer-events-none opacity-40">
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
      </div>

      <div className="absolute bottom-0 inset-x-2 h-[1.5px] flex justify-between pointer-events-none opacity-40">
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
        <span className="w-1 h-full bg-amber-400" />
      </div>

      {/* Sweeping metallic beam when active */}
      {isActive && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine-beam pointer-events-none" />
      )}

      {/* Chip Core Icon */}
      <div
        className={`relative flex items-center justify-center w-5 h-5 rounded-md border transition-all ${
          isActive
            ? 'bg-rose-600 border-rose-400 text-white'
            : 'bg-zinc-900 border-zinc-700 text-zinc-400 group-hover:text-rose-400 group-hover:border-rose-500/50'
        }`}
      >
        <Cpu className="w-3 h-3" />
      </div>

      {/* Chip Label & Badge */}
      <div className="flex items-center gap-1.5 text-right">
        <span className="tracking-wider uppercase text-[11px] font-extrabold">
          {isActive ? 'NSFW NANO // مفعّل' : 'NSFW NANO'}
        </span>

        {/* Biometric Shield requirement pill */}
        <span
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
            isActive
              ? 'bg-rose-900/80 border-rose-400 text-rose-200'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-rose-400'
          }`}
        >
          <Fingerprint className="w-2.5 h-2.5" />
          <span>+21 MAX</span>
        </span>
      </div>
    </button>
  );
};
