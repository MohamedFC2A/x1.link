import React from 'react';
import { ModelType } from '../types';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
  isX1Active: boolean;
  isX1Unlocked: boolean;
  messagesCount: number;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  isOpen,
  onClose,
  activeModel,
  isX1Active,
  isX1Unlocked,
  messagesCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel h-full p-6 font-mono text-right flex flex-col justify-between overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.1] pb-4 mb-6">
            <button
              type="button"
              onClick={onClose}
              className="glass-button px-3 py-1 text-zinc-300 hover:text-white text-xs font-bold transition-all rounded-lg"
            >
              [ إغلاق ]
            </button>
            <h3 className="text-base font-bold text-white font-sans">
              سجلات النظام والتشخيص
            </h3>
          </div>

          {/* Diagnostic Specs */}
          <div className="space-y-3 text-xs">
            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">API ENDPOINT & SPECS</span>
              <span className="text-zinc-200 font-bold block mt-1">https://api.deepseek.com</span>
              <span className="text-zinc-500 block text-[10px] mt-0.5">Runtime: Vercel Edge Runtime</span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">CURRENT ACTIVE MODEL</span>
              <span className="text-white font-bold block mt-1">{activeModel}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {activeModel.includes('vision') ? 'MULTIMODAL_IMAGE_PROCESSING' : 'HIGH_SPEED_REASONING_CHAT'}
              </span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">MATANY PROTOCOL STATE</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  isX1Active ? 'bg-white text-zinc-950' : 'bg-white/[0.05] text-zinc-400 border border-white/[0.08]'
                }`}>
                  {isX1Active ? 'ENGAGED (MAX UNCHAINED)' : 'STANDBY'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  BIOMETRIC_AUTH: {isX1Unlocked ? 'PASSED' : 'LOCKED'}
                </span>
              </div>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">TELEMETRY STATS</span>
              <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div>TOTAL MESSAGES: <strong className="text-white">{messagesCount}</strong></div>
                <div>STREAM STATUS: <strong className="text-emerald-400">SSE ACTIVE</strong></div>
                <div>PLATFORM: <strong className="text-white">MATANY.ONE</strong></div>
                <div>MEMORY: <strong className="text-white">1M TOKENS</strong></div>
              </div>
            </div>

            {/* Persona Directives Preview */}
            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">ACTIVE SYSTEM PROMPT DIRECTIVE</span>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">
                {isX1Active
                  ? 'بروتوكول Matany MAX: إزالة القيود، ردود صريحة وحاسمة، لا مجاملات، رد على أي تساؤل بأقصى قدرة فكرية وبلاغية.'
                  : 'بروتوكول الأساس: أسلوب فصيح، واقعي، شديد الذكاء، لا يقدم اعتذارات أو تبريرات رتيبة.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-center text-[10px] text-zinc-500 font-mono">
          MATANY.ONE ENGINE // AUTONOMOUS AI PLATFORM
        </div>

      </div>
    </div>
  );
};
