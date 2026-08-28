/**
 * Search Intelligence System — Real-Time Search Status Indicator
 * Matany AI (Matany)
 */

import React from 'react';
import { Loader2, CheckCircle2, Zap, Database, Globe, Sparkles, X } from 'lucide-react';
import { IntentClassificationResult } from '../../types/search';

interface SearchStatusProps {
  isLoading: boolean;
  statusMessage?: string;
  executionTimeMs?: number;
  sourcesUsed?: string[];
  fromCache?: boolean;
  intent?: IntentClassificationResult | null;
  onCancel?: () => void;
  className?: string;
}

export const SearchStatus: React.FC<SearchStatusProps> = ({
  isLoading,
  statusMessage,
  executionTimeMs,
  sourcesUsed = [],
  fromCache,
  intent,
  onCancel,
  className = '',
}) => {
  if (!isLoading && !statusMessage && !executionTimeMs) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs backdrop-blur-md border transition-all ${
        isLoading
          ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
        ) : fromCache ? (
          <Database className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}

        <span className="font-medium truncate">
          {statusMessage || (isLoading ? 'جاري البحث الحي عبر مصادر الويب...' : 'اكتمل البحث')}
        </span>

        {/* Intent Pill */}
        {intent && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800/80 border border-zinc-700 text-zinc-300">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>{intent.intent}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Execution Timing */}
        {executionTimeMs !== undefined && executionTimeMs > 0 && !isLoading && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-700/50">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{executionTimeMs}ms</span>
          </span>
        )}

        {/* Sources count */}
        {sourcesUsed.length > 0 && !isLoading && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{sourcesUsed.length} مصادر</span>
          </span>
        )}

        {/* Cancel Button */}
        {isLoading && onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 transition-colors"
            title="إلغاء البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
