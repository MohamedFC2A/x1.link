import React from 'react';
import { cn } from '@/lib/utils';
import { MemoryDetectIcon } from '@/lib/featuresRegistry';
import { BrainCircuit, Sparkles, CheckCircle2, History, Database } from 'lucide-react';

export interface MemoryDetectBadgeProps {
  summary?: string;
  details?: string;
  matchedCount?: number;
  className?: string;
}

export const MemoryDetectBadge: React.FC<MemoryDetectBadgeProps> = ({
  summary = 'تم استدعاء سياق المحادثات السابقة وسجل الحقائق المتزامن',
  details = 'الذاكرة السحابية متزامنة ونشطة عبر المعمارية العصبية الممتدة',
  matchedCount = 1,
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
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full memory-detect-glass border border-indigo-400/30">
                <MemoryDetectIcon size={14} />
                <span className="memory-detect-text">MEMORY DETECT</span>
              </span>
              <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
                استدعاء الذاكرة السحابية المتزامنة
              </span>
            </div>

            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 font-bold hidden sm:inline-flex items-center gap-1">
              <Database className="size-2.5 text-indigo-300" />
              <span>CLOUD MEMORY SYNC</span>
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-zinc-300 font-sans mt-1 leading-relaxed font-normal">
            الحالة: <span className="font-semibold text-white">{summary}</span>
            {details ? ` — ${details}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
