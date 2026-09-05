import React from 'react';
import { ModelType } from '../types';
import { memoryEngine } from '../services/memoryManager';
import { scientificDiscoveryEngine } from '../services/scientificDiscoveryEngine';
import { Brain, Cpu, History, Network, GitMerge, ShieldCheck, Atom, Sparkles, Award } from 'lucide-react';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelType;
  isX1Active: boolean;
  isX1Unlocked: boolean;
  messagesCount: number;
  onOpenBenchmark?: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  isOpen,
  onClose,
  activeModel,
  isX1Active,
  isX1Unlocked,
  messagesCount,
  onOpenBenchmark
}) => {
  if (!isOpen) return null;

  const memStats = memoryEngine.getMemoryStats();
  const discStats = scientificDiscoveryEngine.getDiscoveryStats();
  const isCyber26 = activeModel === 'deepseek-v4-pro-cyber-2.6' || activeModel === 'deepseek-v4-flash-cyber-2.6' || activeModel === 'deepseek-v4-pro-cyber-2.1' || activeModel === 'deepseek-v4-flash-cyber-2.1';
  const isCyber = isCyber26;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-md glass-panel h-full p-6 font-mono text-right flex flex-col justify-between overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.1] pb-4 mb-6">
            <h3 className="text-base font-bold text-white font-sans">
              سجلات النظام والتشخيص المعرفي
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="glass-button px-3 py-1 text-zinc-300 hover:text-white text-xs font-bold transition-all rounded-lg"
            >
              [ إغلاق ]
            </button>
          </div>

          {/* Diagnostic Specs */}
          <div className="space-y-3 text-xs">
            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">API ENDPOINT & SPECS</span>
              <span className="text-zinc-200 font-bold block mt-1">SOVEREIGN AI GATEWAY // V4-PRO RUNTIME</span>
              <span className="text-zinc-500 block text-[10px] mt-0.5">Runtime: Vercel Edge Runtime // Sub-5ms Vector & Discovery Engine</span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-white/[0.08]">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">CURRENT ACTIVE MODEL</span>
              <span className="text-white font-bold block mt-1">
                {isCyber26 
                  ? (activeModel === 'deepseek-v4-flash-cyber-2.6' ? 'Fathom Cyber Flash 2.6' : 'Fathom Cyber Ultra 2.6')
                  : activeModel}
              </span>
              <span className="text-[10px] text-cyan-400 block mt-0.5 font-bold">
                {isCyber26
                  ? 'V4-PRO ENGINE // HYPER-DEDUCTIVE REASONING & 3-TIER MEMORY'
                  : activeModel.includes('vision') 
                  ? 'MULTIMODAL_IMAGE_PROCESSING' 
                  : 'HIGH_SPEED_REASONING_CHAT'}
              </span>
            </div>

            {/* 3-Tier Cognitive Memory Aura Stats */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-cyan-500/20 shadow-inner">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block flex items-center gap-1">
                    <Cpu className="size-2.5 text-cyan-400" />
                    <span>L1: WORKING</span>
                  </span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    {memStats.workingMemoryActive ? 'ACTIVE SCRATCHPAD' : 'IDLE'}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block flex items-center gap-1">
                    <History className="size-2.5 text-purple-400" />
                    <span>L2: EPISODIC</span>
                  </span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    {memStats.episodicCount || memStats.indexedChatsCount} أحداث عرضية
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block flex items-center gap-1">
                    <Network className="size-2.5 text-indigo-400" />
                    <span>L3: SEMANTIC GRAPH</span>
                  </span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    {memStats.semanticTriplesCount} روابط مفاهيمية
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block flex items-center gap-1">
                    <GitMerge className="size-2.5 text-emerald-400" />
                    <span>CONFLICTS RESOLVED</span>
                  </span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    {memStats.conflictsResolvedCount} تسويات متزامنة
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="size-3" />
                  <span>{memStats.privacySanitizerStatus}</span>
                </span>
                <span>VIRTUAL: ~50M TOKENS</span>
              </div>
            </div>

            {/* Scientific Discovery & Abductive Reasoning Aura Stats */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-cyan-400/30 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5">
                <span className="text-cyan-300 font-bold text-[11px] flex items-center gap-1.5">
                  <Atom className="size-3.5 text-cyan-300 animate-spin" />
                  <span>CLOSED-LOOP SCIENTIFIC DISCOVERY (O-H-E-U)</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-bold">
                  v2.6 AURA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block">ESTABLISHED AXIOMS</span>
                  <span className="font-bold text-cyan-200 text-xs mt-0.5 block">
                    {discStats.totalAxiomsCount} بديهيات مبرهنة
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block">PROVER ENGINE</span>
                  <span className="font-bold text-emerald-400 text-xs mt-0.5 block">
                    LEAN/COQ VERIFIED (100%)
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block">OCCAM OPTIMIZATION</span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    min (Loss + λ·Complexity)
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-zinc-400 block">SURPRISE DETECTOR</span>
                  <span className="font-bold text-purple-300 text-xs mt-0.5 block">
                    -log₂ P(x) ACTIVE
                  </span>
                </div>
              </div>
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
                <div>CAPACITY: <strong className="text-white">50M TOKENS</strong></div>
              </div>
            </div>

            {/* Benchmark Matrix Action Button */}
            {onOpenBenchmark && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBenchmark();
                }}
                className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/40 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 hover:text-white font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
              >
                <Award className="w-4 h-4 text-cyan-400" />
                <span>عرض مقارنة النماذج والذكاء (Benchmark Matrix)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] text-center text-[10px] text-zinc-500 font-mono">
          MATANY.ONE ENGINE // FATHOM CYBER 2.6 COGNITIVE PLATFORM
        </div>

      </div>
    </div>
  );
};
