/**
 * Search Intelligence System — Advanced Search Bar Component
 * Matany AI (x1.link)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, Clock, Globe, ArrowRight, CornerDownLeft, Zap } from 'lucide-react';
import { useSearchHistory } from '../../hooks/useSearchHistory';

interface SearchBarProps {
  onSearch: (query: string, isDeepSearch?: boolean) => void;
  isLoading?: boolean;
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  isDeepSearchActive?: boolean;
  onToggleDeepSearch?: () => void;
}

const QUICK_SUGGESTIONS = [
  'آخر أخبار الذكاء الاصطناعي 2026',
  'سعر الدولار والذهب اليوم في مصر',
  'مقارنة بين DeepSeek V4 و Claude 3.7 Sonnet',
  'أحدث اكتشافات الفضاء وتلسكوب جيمس ويب',
  'توثيق ومكتبات React 19 و TypeScript',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  initialQuery = '',
  placeholder = 'ابحث في الويب الحي، الأخبار، الأسعار، والموسوعات...',
  className = '',
  isDeepSearchActive = false,
  onToggleDeepSearch,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const [internalDeepSearch, setInternalDeepSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, removeHistoryItem } = useSearchHistory();

  const isDeep = onToggleDeepSearch ? isDeepSearchActive : internalDeepSearch;

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = query.trim();
    if (!cleanQ || isLoading) return;
    setIsOpenSuggestions(false);
    onSearch(cleanQ, isDeep);
  };

  const handleSelectSuggestion = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    setIsOpenSuggestions(false);
    onSearch(suggestedQuery, isDeep);
  };

  const toggleDeep = () => {
    if (onToggleDeepSearch) {
      onToggleDeepSearch();
    } else {
      setInternalDeepSearch(prev => !prev);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border transition-all duration-300 backdrop-blur-xl ${
          isOpenSuggestions
            ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
            : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        {/* Search Icon */}
        <div className="pl-2 pr-3 flex items-center justify-center text-zinc-400">
          <Search className={`w-5 h-5 transition-colors ${isLoading ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpenSuggestions(true);
          }}
          onFocus={() => setIsOpenSuggestions(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none pr-1 text-right dir-rtl"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Deep Search Switch Button */}
        <button
          type="button"
          onClick={toggleDeep}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isDeep
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
          }`}
          title="تفعيل البحث العميق المتقدم"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">بحث عميق</span>
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className={`flex items-center justify-center p-2 rounded-xl text-white transition-all ${
            query.trim() && !isLoading
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md active:scale-95'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>

      {/* Suggestions & Recent History Dropdown */}
      {isOpenSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-2xl z-50 divide-y divide-zinc-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Recent History */}
          {history.length > 0 && (
            <div className="pb-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>عمليات البحث الأخيرة</span>
                </span>
              </div>
              <div className="space-y-1">
                {history.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 text-xs text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    onClick={() => handleSelectSuggestion(item.query)}
                  >
                    <span className="truncate">{item.query}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          <div className={history.length > 0 ? 'pt-2.5' : ''}>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2 px-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>اقتراحات البحث الشائعة لعام 2026</span>
            </div>
            <div className="space-y-1">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 text-xs text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <span className="truncate">{suggestion}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
