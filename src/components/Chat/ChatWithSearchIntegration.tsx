/**
 * Search Intelligence System — Chat Grounding & Verified Sources Panel
 * Matany AI (Matany)
 */

import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Sparkles, Copy, Check, Newspaper, BookOpen, Search } from 'lucide-react';
import { SearchResult } from '../../types/search';
import { SourceBadge } from '../SearchUI/SourceBadges';

interface ChatWithSearchIntegrationProps {
  sources?: SearchResult[];
  query?: string;
  className?: string;
  isStreaming?: boolean;
}

export const ChatWithSearchIntegration: React.FC<ChatWithSearchIntegrationProps> = ({
  sources = [],
  query,
  className = '',
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!sources || sources.length === 0) {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 animate-pulse my-2">
          <Globe className="w-3.5 h-3.5 animate-spin" />
          <span>جاري استدعاء وفحص نتائج البحث الحي من الإنترنت...</span>
        </div>
      );
    }
    return null;
  }

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className={`my-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden shadow-lg backdrop-blur-md ${className}`}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-950/30 via-zinc-900/40 to-transparent hover:bg-zinc-800/50 transition-colors text-right"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              المصادر الموثقة من البحث الحي ({sources.length})
            </span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              محدث لعام 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <span>{isExpanded ? 'إخفاء المصادر' : 'عرض المصادر'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Sources Grid */}
      {isExpanded && (
        <div className="p-3.5 space-y-2.5 border-t border-zinc-800/60 bg-zinc-950/40 divide-y divide-zinc-800/40">
          {sources.map((src, idx) => (
            <div key={src.id || idx} className="pt-2 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <SourceBadge
                  sourceType={src.sourceType}
                  sourceName={src.source}
                  credibilityScore={src.credibilityScore}
                />

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopyLink(e, src.url)}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
                    title="نسخ الرابط"
                  >
                    {copiedLink === src.url ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-zinc-400 hover:text-cyan-300 rounded hover:bg-zinc-800 transition-colors"
                    title="زيارة المصدر"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs font-medium text-cyan-300 hover:underline line-clamp-1"
              >
                {src.title}
              </a>

              {src.snippet && (
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {src.snippet}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
