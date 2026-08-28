/**
 * Search Intelligence System — Source & Credibility Badges
 * Matany AI (Matany)
 */

import React from 'react';
import { Globe, Newspaper, BookOpen, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SearchSourceType } from '../../types/search';

interface SourceBadgeProps {
  sourceType: SearchSourceType;
  sourceName?: string;
  credibilityScore?: number;
  className?: string;
  showCredibility?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceType,
  sourceName,
  credibilityScore,
  className = '',
  showCredibility = true,
}) => {
  const getSourceConfig = () => {
    switch (sourceType) {
      case 'google':
      case 'serper':
        return {
          icon: <Search className="w-3.5 h-3.5 text-blue-400" />,
          label: sourceName || 'Google Search',
          badgeClass: 'bg-blue-950/40 border-blue-500/30 text-blue-300',
        };
      case 'news':
        return {
          icon: <Newspaper className="w-3.5 h-3.5 text-emerald-400" />,
          label: sourceName || 'Google News',
          badgeClass: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
        };
      case 'wiki':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-purple-400" />,
          label: sourceName || 'Wikipedia',
          badgeClass: 'bg-purple-950/40 border-purple-500/30 text-purple-300',
        };
      case 'duckduckgo':
      default:
        return {
          icon: <Globe className="w-3.5 h-3.5 text-amber-400" />,
          label: sourceName || 'DuckDuckGo Index',
          badgeClass: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
        };
    }
  };

  const config = getSourceConfig();

  const getCredibilityBadge = () => {
    if (credibilityScore === undefined) return null;
    const pct = Math.round(credibilityScore * 100);
    const isUltra = pct >= 95;
    const isHigh = pct >= 85;

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
          isUltra
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : isHigh
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }`}
        title={`درجة الموثوقية: ${pct}%`}
      >
        <ShieldCheck className="w-3 h-3" />
        <span>{pct}%</span>
      </span>
    );
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border backdrop-blur-sm ${config.badgeClass}`}
      >
        {config.icon}
        <span className="truncate max-w-[130px]">{config.label}</span>
      </span>
      {showCredibility && getCredibilityBadge()}
    </div>
  );
};
