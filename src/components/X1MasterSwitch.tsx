import React from 'react';
import { Zap } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface X1MasterSwitchProps {
  isX1Active: boolean;
  isX1Unlocked: boolean;
  onToggle: () => void;
}

export const X1MasterSwitch: React.FC<X1MasterSwitchProps> = ({
  isX1Active,
  isX1Unlocked,
  onToggle,
}) => {
  const handleClick = () => {
    if (!isX1Active) {
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
      className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 select-none ${
        isX1Active
          ? 'bg-white text-zinc-950 border-white shadow-sm font-bold'
          : isX1Unlocked
          ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      title={isX1Active ? "وضع Matany MAX مفعّل (انقر للتعطيل)" : "تفعيل وضع Matany MAX"}
    >
      <span className={`inline-block w-2 h-2 rounded-full transition-colors ${
        isX1Active ? 'bg-zinc-950' : isX1Unlocked ? 'bg-white' : 'bg-zinc-600'
      }`} />

      <span className="font-sans text-xs font-medium">
        {isX1Active ? 'وضع Matany MAX مفعّل' : isX1Unlocked ? 'تفعيل Matany MAX' : 'فتح وضع Matany MAX'}
      </span>

      <Zap className={`w-3.5 h-3.5 transition-transform ${
        isX1Active ? 'text-zinc-950 fill-current scale-105' : 'text-zinc-400'
      }`} />
    </button>
  );
};
