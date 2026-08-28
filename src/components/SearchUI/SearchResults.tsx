/**
 * Search Intelligence System — Search Results Display Component
 * Matany AI (Matany)
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Filter, Calendar, Globe, Sparkles } from 'lucide-react';
import { SearchResult, SearchSourceType } from '../../types/search';
import { SourceBadge } from './SourceBadges';

interface SearchResultsProps {
  results: SearchResult[];
  query?: string;
  className?: string;
  onSelectResult?: (result: SearchResult) => void;
  showFilters?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  className = '',
  onSelectResult,
  showFilters = true,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<SearchSourceType | 'all'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const filteredResults = results.filter(r => {
    if (selectedFilter === 'all') return true;
    return r.sourceType === selectedFilter;
  });

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const rawFilterOptions: Array<{ id: SearchSourceType | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'الكل', count: results.length },
    { id: 'news', label: 'أخبار حية', count: results.filter(r => r.sourceType === 'news').length },
    { id: 'duckduckgo', label: 'ويب مباشر', count: results.filter(r => r.sourceType === 'duckduckgo').length },
    { id: 'wiki', label: 'موسوعات', count: results.filter(r => r.sourceType === 'wiki').length },
    { id: 'google', label: 'Google', count: results.filter(r => r.sourceType === 'google' || r.sourceType === 'serper').length },
  ];
  const filterOptions = rawFilterOptions.filter(f => f.id === 'all' || f.count > 0);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Tabs */}
      {showFilters && filterOptions.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{f.label}</span>
              <span className="text-[10px] px-1 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results Cards List */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredResults.map((result, idx) => (
          <div
            key={result.id || idx}
            onClick={() => onSelectResult && onSelectResult(result)}
            className="group relative flex flex-col gap-2 p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/40 transition-all duration-200 shadow-sm cursor-pointer"
          >
            {/* Header: Source, Credibility, Domain & Actions */}
            <div className="flex items-center justify-between gap-2">
              <SourceBadge
                sourceType={result.sourceType}
                sourceName={result.source}
                credibilityScore={result.credibilityScore}
              />

              <div className="flex items-center gap-1">
                {result.domain && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                    <Globe className="w-3 h-3 text-zinc-500" />
                    <span className="truncate max-w-[120px]">{result.domain}</span>
                  </span>
                )}

                {/* Copy Link */}
                <button
                  onClick={(e) => handleCopyLink(e, result.url)}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="نسخ الرابط"
                >
                  {copiedUrl === result.url ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Open External */}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                  title="فتح في نافذة جديدة"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Title */}
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug"
            >
              {result.title}
            </a>

            {/* Snippet */}
            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
              {result.snippet}
            </p>

            {/* Footer Date / Score */}
            {result.date && (
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50 text-[11px] text-zinc-500">
                <Calendar className="w-3 h-3 text-zinc-500" />
                <span>{result.date}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
