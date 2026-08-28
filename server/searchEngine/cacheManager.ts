/**
 * Search Intelligence System — Adaptive Cache Manager
 * Matany AI (x1.link)
 */

import { QueryIntent, CacheEntry, SearchResult } from './searchTypes';

export class SearchCacheManager {
  private cache = new Map<string, CacheEntry<SearchResult[]>>();
  private maxEntries = 500;
  private totalHits = 0;
  private totalMisses = 0;

  /**
   * Generates a deterministic cache key based on query, language, and intent.
   */
  public generateKey(query: string, language: string = 'ar', intent?: QueryIntent): string {
    const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
    return `${intent || 'GEN'}:${language}:${normalized}`;
  }

  /**
   * Returns default TTL (in milliseconds) based on the query intent.
   */
  public getDefaultTTL(intent?: QueryIntent): number {
    switch (intent) {
      case 'REAL_TIME_DATA':
        return 15 * 60 * 1000; // 15 minutes
      case 'CURRENT_EVENTS':
      case 'FACT_CHECKING':
        return 60 * 60 * 1000; // 1 hour
      case 'PRODUCT_RESEARCH':
      case 'COMPARISON':
      case 'TREND_ANALYSIS':
        return 2 * 60 * 60 * 1000; // 2 hours
      case 'TECHNICAL_DOCUMENTATION':
      case 'SCIENTIFIC_RESEARCH':
      case 'TUTORIAL_HOW_TO':
      case 'INFORMATION_SEARCH':
      default:
        return 24 * 60 * 60 * 1000; // 24 hours
    }
  }

  /**
   * Retrieves results from cache if present and unexpired.
   */
  public get(key: string): SearchResult[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.totalMisses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.totalMisses++;
      return null;
    }

    entry.hitCount++;
    this.totalHits++;
    return entry.data;
  }

  /**
   * Stores results in cache with calculated or custom TTL.
   */
  public set(
    key: string,
    results: SearchResult[],
    intent?: QueryIntent,
    customTtlMs?: number
  ): void {
    if (!results || results.length === 0) return;

    // Prune if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.pruneOldest();
    }

    const now = Date.now();
    const ttl = customTtlMs ?? this.getDefaultTTL(intent);

    this.cache.set(key, {
      data: results,
      cachedAt: now,
      expiresAt: now + ttl,
      hitCount: 0
    });
  }

  /**
   * Checks if an unexpired entry exists for the key.
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidates a specific key or pattern.
   */
  public invalidate(keyOrPrefix: string): void {
    for (const k of this.cache.keys()) {
      if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
        this.cache.delete(k);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  public clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  /**
   * Returns cache analytics and metrics.
   */
  public getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: string;
  } {
    const total = this.totalHits + this.totalMisses;
    const hitRate = total > 0 ? `${((this.totalHits / total) * 100).toFixed(1)}%` : '0.0%';
    return {
      size: this.cache.size,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRate
    };
  }

  /**
   * Prunes oldest / expired entries when reaching capacity.
   */
  private pruneOldest(): void {
    const now = Date.now();
    // 1. Delete all expired
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // 2. If still full, delete first 20% oldest entries
    if (this.cache.size >= this.maxEntries) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxEntries * 0.2));
      keysToDelete.forEach(k => this.cache.delete(k));
    }
  }
}

export const globalSearchCache = new SearchCacheManager();
