/**
 * Unit Tests: Adaptive Cache Manager
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import { SearchCacheManager } from '../../server/searchEngine/cacheManager';
import { SearchResult } from '../../server/searchEngine/searchTypes';

export async function runCacheManagerTests(harness: TestHarness) {
  await harness.describe('Adaptive Cache Manager Unit Tests', async () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'نتيجة اختبارية',
        url: 'https://example.com/test',
        snippet: 'مقتطف تجريبي للاختبارات البرمجية',
        source: 'Google Search',
        sourceType: 'google',
        score: 0.95
      }
    ];

    await harness.it('should generate deterministic cache keys', () => {
      const cache = new SearchCacheManager();
      const key1 = cache.generateKey('سعر الذهب اليوم', 'ar', 'REAL_TIME_DATA');
      const key2 = cache.generateKey('سعر   الذهب  اليوم  ', 'ar', 'REAL_TIME_DATA');
      expect(key1).toBe(key2);
      expect(key1).toContain('REAL_TIME_DATA:ar:سعر الذهب اليوم');
    });

    await harness.it('should assign adaptive TTL based on query intent', () => {
      const cache = new SearchCacheManager();
      expect(cache.getDefaultTTL('REAL_TIME_DATA')).toBe(15 * 60 * 1000); // 15 mins
      expect(cache.getDefaultTTL('CURRENT_EVENTS')).toBe(60 * 60 * 1000); // 1 hour
      expect(cache.getDefaultTTL('TECHNICAL_DOCUMENTATION')).toBe(24 * 60 * 60 * 1000); // 24 hours
    });

    await harness.it('should store, retrieve, and track cache hit rates', () => {
      const cache = new SearchCacheManager();
      const key = 'test_key_1';

      expect(cache.get(key)).toBeNull(); // Miss
      cache.set(key, mockResults, 'INFORMATION_SEARCH');

      const hit = cache.get(key);
      expect(hit).toBeDefined();
      expect(hit?.[0].title).toBe('نتيجة اختبارية');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('50.0%');
    });

    await harness.it('should expire entries when custom TTL elapses', async () => {
      const cache = new SearchCacheManager();
      const key = 'test_expired_key';

      // Set with 20ms TTL
      cache.set(key, mockResults, 'REAL_TIME_DATA', 20);
      expect(cache.get(key)).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 30));
      expect(cache.get(key)).toBeNull();
    });

    await harness.it('should invalidate specific keys and clear cache', () => {
      const cache = new SearchCacheManager();
      cache.set('key_a', mockResults);
      cache.set('key_b', mockResults);

      expect(cache.has('key_a')).toBe(true);
      cache.invalidate('key_a');
      expect(cache.has('key_a')).toBe(false);
      expect(cache.has('key_b')).toBe(true);

      cache.clear();
      expect(cache.has('key_b')).toBe(false);
    });
  });
}
