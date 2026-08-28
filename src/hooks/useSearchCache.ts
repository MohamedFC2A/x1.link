/**
 * Search Intelligence System — Client-Side Cache Hook
 * Matany AI (Matany)
 */

import { useState, useCallback } from 'react';
import { SearchAggregationResult } from '../types/search';

const CACHE_STORAGE_KEY = 'matany_search_client_cache_v2';
const MAX_CLIENT_CACHE_ITEMS = 50;

interface ClientCacheEntry {
  data: SearchAggregationResult;
  timestamp: number;
  ttlMs: number;
}

export function useSearchCache() {
  const [memoryCache] = useState<Map<string, ClientCacheEntry>>(() => new Map());

  const getCacheKey = useCallback((query: string, hl: string = 'ar', deepSearch: boolean = false) => {
    return `${hl}:${deepSearch ? 'DEEP' : 'STD'}:${query.trim().toLowerCase()}`;
  }, []);

  const getCachedResult = useCallback((key: string): SearchAggregationResult | null => {
    // 1. Check in-memory
    const memoryHit = memoryCache.get(key);
    if (memoryHit) {
      if (Date.now() < memoryHit.timestamp + memoryHit.ttlMs) {
        return memoryHit.data;
      }
      memoryCache.delete(key);
    }

    // 2. Check localStorage
    try {
      const raw = localStorage.getItem(`${CACHE_STORAGE_KEY}_${key}`);
      if (raw) {
        const parsed: ClientCacheEntry = JSON.parse(raw);
        if (Date.now() < parsed.timestamp + parsed.ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
        localStorage.removeItem(`${CACHE_STORAGE_KEY}_${key}`);
      }
    } catch {}

    return null;
  }, [memoryCache]);

  const setCachedResult = useCallback((
    key: string,
    data: SearchAggregationResult,
    ttlMs: number = 30 * 60 * 1000 // 30 mins
  ) => {
    const entry: ClientCacheEntry = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    memoryCache.set(key, entry);

    try {
      localStorage.setItem(`${CACHE_STORAGE_KEY}_${key}`, JSON.stringify(entry));
    } catch {}
  }, [memoryCache]);

  const clearCache = useCallback(() => {
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_STORAGE_KEY)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, [memoryCache]);

  return {
    getCacheKey,
    getCachedResult,
    setCachedResult,
    clearCache,
  };
}
