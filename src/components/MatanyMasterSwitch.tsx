import React from 'react';
import { Zap } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface MatanyMasterSwitchProps {
  isMatanyActive?: boolean;
  isMatanyUnlocked?: boolean;
  onToggle: () => void;
}

export const MatanyMasterSwitch: React.FC<MatanyMasterSwitchProps> = ({
  isMatanyActive,
  isMatanyUnlocked,
  onToggle,
}) => {
  const active = Boolean(isMatanyActive);
  const unlocked = Boolean(isMatanyUnlocked);

  const handleClick = () => {
    if (!active) {
      soundFx.playMatanyActivate();
    } else {
      soundFx.playMatanyDeactivate();
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 select-none ${
        active
          ? 'bg-white text-zinc-950 border-white shadow-sm font-bold'
          : unlocked
          ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      title={active ? "وضع Matany MAX مفعّل (انقر للتعطيل)" : "تفعيل وضع Matany MAX"}
    >
      <span className={`inline-block w-2 h-2 rounded-full transition-colors ${
        active ? 'bg-zinc-950' : unlocked ? 'bg-white' : 'bg-zinc-600'
      }`} />

      <span className="font-sans text-xs font-medium">
        {active ? 'وضع Matany MAX مفعّل' : unlocked ? 'تفعيل Matany MAX' : 'فتح وضع Matany MAX'}
      </span>

      <Zap className={`w-3.5 h-3.5 transition-transform ${
        active ? 'text-zinc-950 fill-current scale-105' : 'text-zinc-400'
      }`} />
    </button>
  );
};
