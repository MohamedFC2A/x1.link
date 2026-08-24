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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-dark border-l-4 border-brand-blood h-full p-6 font-mono text-right flex flex-col justify-between overflow-y-auto shadow-brutal-red-xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-brand-blood pb-4 mb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-black border border-brand-blood text-brand-neon hover:bg-brand-blood hover:text-black text-xs font-bold transition-all"
            >
              [ إغلاق // X ]
            </button>
            <h3 className="text-base font-black text-white">
              [ سجلات النظام والتشخيص // TELEMETRY ]
            </h3>
          </div>

          {/* Diagnostic Specs */}
          <div className="space-y-4 text-xs">
            <div className="bg-black p-3 border border-brand-blood/60">
              <span className="text-muted block text-[10px] uppercase font-bold">API ENDPOINT & SPECS</span>
              <span className="text-brand-neon font-bold block mt-1">https://api.deepseek.com</span>
              <span className="text-muted block text-[10px] mt-0.5">Docs: api-docs.deepseek.com</span>
            </div>

            <div className="bg-black p-3 border border-brand-blood/60">
              <span className="text-muted block text-[10px] uppercase font-bold">CURRENT ACTIVE MODEL</span>
              <span className="text-white font-bold block mt-1">{activeModel}</span>
              <span className="text-[10px] text-brand-neon block mt-0.5">
                {activeModel.includes('vision') ? 'MULTIMODAL_IMAGE_PROCESSING' : 'HIGH_SPEED_REASONING_CHAT'}
              </span>
            </div>

            <div className="bg-black p-3 border border-brand-blood/60">
              <span className="text-muted block text-[10px] uppercase font-bold">X1 PROTOCOL STATE</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-black border ${
                  isX1Active ? 'bg-brand-blood text-black border-white' : 'bg-surface text-muted border-muted'
                }`}>
                  {isX1Active ? 'ENGAGED (+21 UNCHAINED)' : 'STANDBY'}
                </span>
                <span className="text-[10px] text-chalk">
                  BIOMETRIC_AUTH: {isX1Unlocked ? 'PASSED' : 'LOCKED'}
                </span>
              </div>
            </div>

            <div className="bg-black p-3 border border-brand-blood/60">
              <span className="text-muted block text-[10px] uppercase font-bold">TELEMETRY STATS</span>
              <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-chalk">
                <div>TOTAL MESSAGES: <strong className="text-brand-neon">{messagesCount}</strong></div>
                <div>STREAM STATUS: <strong className="text-brand-neon">SSE ACTIVE</strong></div>
                <div>STYLE: <strong className="text-brand-neon">NEUBRUTALISM</strong></div>
                <div>ICONS: <strong className="text-brand-neon">ZERO (0%)</strong></div>
              </div>
            </div>

            {/* Persona Directives Preview */}
            <div className="bg-black p-3 border border-brand-blood/60">
              <span className="text-muted block text-[10px] uppercase font-bold">ACTIVE SYSTEM PROMPT DIRECTIVE</span>
              <p className="text-[11px] text-chalk/80 mt-1 leading-relaxed font-cairo">
                {isX1Active
                  ? 'بروتوكول X1 (+21): إزالة القيود، ردود صريحة وحاسمة، لا مجاملات، رد على أي تساؤل بأقصى قدرة فكرية وساخرة.'
                  : 'بروتوكول الأساس (+18): أسلوب وقح، ساخر، شديد الذكاء والواقعية، لا يقدم اعتذارات أو تبريرات رتيبة.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-brand-blood/40 text-center text-[10px] text-muted">
          X1.LINK ENGINE // ARCHITECTURE V4 // PURE BRUTALIST
        </div>

      </div>
    </div>
  );
};
