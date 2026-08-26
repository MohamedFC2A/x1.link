import React from 'react';
import { ShieldOff, Fingerprint, ShieldAlert } from 'lucide-react';
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
      className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-sans font-bold transition-all duration-200 select-none overflow-hidden cursor-pointer shrink-0 shadow-sm ${
        isActive
          ? 'bg-white text-zinc-950 border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
          : 'bg-zinc-900/80 border-white/[0.1] hover:border-white/30 text-zinc-300 hover:text-white'
      }`}
      title={
        isActive
          ? 'وضع NSFW Off مفعّل (انقر للتعطيل)'
          : 'تفعيل وضع NSFW Off (يتطلب التحقق البيومتري)'
      }
    >

      {/* Core Icon */}
      <div
        className={`relative flex items-center justify-center size-4 sm:size-5 rounded-lg border transition-all shrink-0 ${
          isActive
            ? 'bg-zinc-950 text-white border-zinc-900'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-white'
        }`}
      >
        <ShieldOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </div>

      {/* Label & Badge */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-right relative z-10">
        <span className="font-['Space_Grotesk'] tracking-tight font-bold text-[11px] sm:text-xs">
          NSFW Off
        </span>

        {/* Biometric Shield requirement pill */}
        <span
          className={`flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold border transition-colors ${
            isActive
              ? 'bg-zinc-900 text-white border-zinc-800'
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
