import React from 'react';
import { Cpu, Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { motion } from 'framer-motion';

interface NsfwNanoChipProps {
  isActive: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export const NsfwNanoChip: React.FC<NsfwNanoChipProps> = ({
  isActive,
  onToggle,
  onClick,
}) => {
  const handleClick = () => {
    if (!isActive) {
      soundFx.playX1Activate();
    } else {
      soundFx.playX1Deactivate();
    }
    if (onClick) onClick();
    else if (onToggle) onToggle();
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={`group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-mono font-bold transition-colors duration-200 select-none overflow-hidden cursor-pointer shrink-0 ${
        isActive
          ? 'bg-white/[0.1] border-white/20 text-white shadow-sm'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
      }`}
      title={
        isActive
          ? 'شريحة NSFW NANO مفعلة بالكامل (انقر للتعطيل)'
          : 'تفعيل شريحة NSFW NANO (يتطلب بصمة الإصبع أو Face ID في كل مرة)'
      }
    >

      {/* Silicon Chip Micro-Pins */}
      <div className="absolute top-0 inset-x-2 h-[1.5px] flex justify-between pointer-events-none opacity-30">
        <span className="w-1 h-full bg-zinc-400" />
        <span className="w-1 h-full bg-zinc-400" />
        <span className="w-1 h-full bg-zinc-400" />
        <span className="w-1 h-full bg-zinc-400" />
      </div>

      {/* Chip Core Icon */}
      <div
        className={`relative flex items-center justify-center size-4 sm:size-5 rounded-md border transition-all shrink-0 ${
          isActive
            ? 'bg-white text-zinc-950 border-white shadow-sm'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-white'
        }`}
      >
        <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </div>

      {/* Chip Label & Badge */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-right relative z-10">
        <span className="tracking-wider uppercase text-[9px] sm:text-[11px] font-bold">
          {isActive ? 'NSFW NANO' : 'NSFW NANO'}
        </span>

        {/* Biometric Shield requirement pill */}
        <span
          className={`flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold border transition-colors ${
            isActive
              ? 'bg-white/[0.12] border-white/20 text-white'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}
        >
          <Fingerprint className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
          <span>BIO</span>
        </span>
      </div>
    </motion.button>
  );
};
