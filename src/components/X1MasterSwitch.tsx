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
          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
          : isX1Unlocked
          ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      title={isX1Active ? "وضع X1 مفعّل (انقر للتعطيل)" : "تفعيل وضع X1 (+21)"}
    >
      <span className={`inline-block w-2 h-2 rounded-full transition-colors ${
        isX1Active ? 'bg-white' : isX1Unlocked ? 'bg-rose-500' : 'bg-zinc-600'
      }`} />

      <span className="font-sans text-xs font-medium">
        {isX1Active ? 'وضع X1 مفعّل (+21)' : isX1Unlocked ? 'تفعيل X1' : 'فتح وضع X1 (+21)'}
      </span>

      <Zap className={`w-3.5 h-3.5 transition-transform ${
        isX1Active ? 'text-white fill-current scale-105' : 'text-rose-500'
      }`} />
    </button>
  );
};
