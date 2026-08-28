/**
 * Search Intelligence System — React useSearch Hook
 * Matany AI (x1.link)
 */

import { useState, useCallback, useRef } from 'react';
import {
  SearchResult,
  SearchAggregationResult,
  SearchEngineOptions,
  IntentClassificationResult,
  SearchSourceType
} from '../types/search';
import { useSearchCache } from './useSearchCache';
import { useSearchHistory } from './useSearchHistory';

export function useSearch(defaultOptions?: SearchEngineOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [intent, setIntent] = useState<IntentClassificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const { getCacheKey, getCachedResult, setCachedResult } = useSearchCache();
  const { addHistoryItem } = useSearchHistory();

  const abortSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStatusMessage('تم إلغاء البحث');
    }
  }, []);

  const clearResults = useCallback(() => {
    abortSearch();
    setQuery('');
    setResults([]);
    setIntent(null);
    setError(null);
    setStatusMessage('');
    setExecutionTimeMs(0);
    setSourcesUsed([]);
    setFromCache(false);
  }, [abortSearch]);

  const search = useCallback(async (
    searchQuery: string,
    overrideOptions?: SearchEngineOptions
  ): Promise<SearchAggregationResult | null> => {
    const q = searchQuery.trim();
    if (!q) {
      clearResults();
      return null;
    }

    // Cancel pending search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setQuery(q);
    setIsLoading(true);
    setError(null);
    setStatusMessage('جاري تحليل الاستعلام وتحديد نية البحث...');

    const opts: SearchEngineOptions = {
      ...defaultOptions,
      ...overrideOptions,
    };

    const cacheKey = getCacheKey(q, opts.hl || 'ar', !!opts.explicitDeepSearch);

    // Check client-side cache
    if (!opts.disableCache && !opts.forceFresh) {
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setResults(cached.results);
        setIntent(cached.intent);
        setExecutionTimeMs(cached.executionTimeMs);
        setSourcesUsed(cached.sourcesUsed);
        setFromCache(true);
        setIsLoading(false);
        setStatusMessage(`تم استرجاع (${cached.results.length}) نتائج موثوقة من التخزين المؤقت`);
        return cached;
      }
    }

    try {
      setStatusMessage('جاري البحث المتزامن عبر مصادر الويب الحية...');

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          options: opts,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`خطأ في خادم البحث (${res.status})`);
      }

      const data: SearchAggregationResult & { success: boolean; error?: string } = await res.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      setResults(data.results || []);
      setIntent(data.intent || null);
      setExecutionTimeMs(data.executionTimeMs || 0);
      setSourcesUsed(data.sourcesUsed || []);
      setFromCache(data.fromCache || false);
      setIsLoading(false);
      setStatusMessage(
        data.results.length > 0
          ? `تم العثور على (${data.results.length}) نتائج موثوقة في ${data.executionTimeMs}ms`
          : 'لم يتم العثور على نتائج مباشرة'
      );

      // Save to client cache & history
      if (data.results && data.results.length > 0) {
        setCachedResult(cacheKey, data);
        addHistoryItem(q, data.intent?.intent, data.results.length);
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error('[useSearch Error]:', err);
      setError(err?.message || 'تعذر إتمام عملية البحث');
      setIsLoading(false);
      setStatusMessage('فشل الاتصال بمحركات البحث');
      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, [defaultOptions, getCacheKey, getCachedResult, setCachedResult, addHistoryItem, clearResults]);

  const filterByCategory = useCallback((sourceType: SearchSourceType | 'all') => {
    if (sourceType === 'all') return results;
    return results.filter(r => r.sourceType === sourceType);
  }, [results]);

  return {
    query,
    results,
    intent,
    isLoading,
    executionTimeMs,
    sourcesUsed,
    fromCache,
    error,
    statusMessage,
    search,
    abortSearch,
    clearResults,
    filterByCategory,
  };
}
