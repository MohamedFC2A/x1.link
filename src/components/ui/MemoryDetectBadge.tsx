import React from 'react';
import { cn } from '@/lib/utils';
import { MemoryDetectIcon } from '@/lib/featuresRegistry';
import { BrainCircuit, Sparkles, CheckCircle2, History, Database, Cpu, Network, GitMerge, Shield, Atom } from 'lucide-react';

export interface MemoryDetectBadgeProps {
  summary?: string;
  details?: string;
  matchedCount?: number;
  tiersActive?: {
    working?: boolean;
    episodic?: boolean;
    semantic?: boolean;
    conflictReconciliation?: boolean;
    discoveryAura?: boolean;
  };
  className?: string;
}

export const MemoryDetectBadge: React.FC<MemoryDetectBadgeProps> = ({
  summary = 'تم استدعاء سياق المحادثات السابقة وشبكة المفاهيم التراكمية',
  details = 'الذاكرة العرضية والدلالية متزامنة ونشطة عبر المعمارية المعرفية ثلاثية المستويات',
  matchedCount = 1,
  tiersActive = { working: true, episodic: true, semantic: true, conflictReconciliation: false, discoveryAura: false },
  className
}) => {
  return (
    <div
      className={cn(
        "my-3 p-3.5 sm:px-4 sm:py-3.5 rounded-2xl memory-detect-glass text-right animate-in fade-in duration-200 select-none shadow-2xl border border-indigo-500/25",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full memory-detect-glass border border-indigo-400/30">
                <MemoryDetectIcon size={14} />
                <span className="memory-detect-text">MEMORY DETECT 2.0</span>
              </span>
              <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
                الذاكرة العرضية والدلالية ثلاثية المستويات
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 font-bold inline-flex items-center gap-1">
                <Cpu className="size-2.5 text-cyan-300" />
                <span>WORKING</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 font-bold inline-flex items-center gap-1">
                <History className="size-2.5 text-purple-300" />
                <span>EPISODIC</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 font-bold inline-flex items-center gap-1">
                <Network className="size-2.5 text-indigo-300" />
                <span>SEMANTIC</span>
              </span>
              {tiersActive?.conflictReconciliation && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 font-bold inline-flex items-center gap-1">
                  <GitMerge className="size-2.5 text-emerald-300" />
                  <span>RESOLVED</span>
                </span>
              )}
              {tiersActive?.discoveryAura && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-bold inline-flex items-center gap-1 shadow-sm">
                  <Atom className="size-2.5 text-cyan-300 animate-spin" />
                  <span>DISCOVERY AURA</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-zinc-300 font-sans mt-0.5 leading-relaxed font-normal">
            الحالة: <span className="font-semibold text-white">{summary}</span>
            {details ? ` — ${details}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

