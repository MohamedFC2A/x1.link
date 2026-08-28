/**
 * Search Intelligence System — Search History Hook
 * Matany AI (x1.link)
 */

import { useState, useEffect, useCallback } from 'react';
import { SearchHistoryItem, QueryIntent } from '../types/search';

const HISTORY_STORAGE_KEY = 'matany_search_history_v2';
const MAX_HISTORY_ITEMS = 30;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const addHistoryItem = useCallback((query: string, intent?: QueryIntent, resultsCount: number = 0) => {
    const cleanQ = query.trim();
    if (!cleanQ) return;

    setHistory(prev => {
      const filtered = prev.filter(item => item.query.toLowerCase() !== cleanQ.toLowerCase());
      const newItem: SearchHistoryItem = {
        id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        query: cleanQ,
        timestamp: Date.now(),
        intent,
        resultsCount,
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
  }, []);

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
  };
}
