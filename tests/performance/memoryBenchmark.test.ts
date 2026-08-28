/**
 * Memory Footprint & Rapid Cache Benchmark
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { SearchCacheManager } from '../../server/searchEngine/cacheManager';
import { SearchResult } from '../../server/searchEngine/searchTypes';

export async function runMemoryBenchmarkTests(harness: TestHarness) {
  await harness.describe('Memory Footprint & Rapid Insertion Benchmark Tests', async () => {
    await harness.it('should handle 500 rapid cache insertions with sub-millisecond retrieval', () => {
      const cache = new SearchCacheManager();
      const mockResult: SearchResult[] = [
        {
          id: '1',
          title: 'نتيجة اختبارية للذاكرة والتخزين',
          url: 'https://example.com/item',
          snippet: 'نص عالي الكثافة لاختبار سعة التخزين المؤقت في الذاكرة',
          source: 'Live Store',
          sourceType: 'news',
          score: 0.95
        }
      ];

      const insertStart = performance.now();
      for (let i = 0; i < 500; i++) {
        cache.set(`test_query_${i}`, mockResult, 'REAL_TIME_DATA');
      }
      const insertDuration = performance.now() - insertStart;
      expect(insertDuration).toBeLessThan(100); // 500 inserts in < 100ms

      const readStart = performance.now();
      for (let i = 0; i < 500; i++) {
        const hit = cache.get(`test_query_${i}`);
        expect(hit).toBeDefined();
      }
      const readDuration = performance.now() - readStart;
      expect(readDuration).toBeLessThan(50); // 500 reads in < 50ms

      const stats = cache.getStats();
      expect(stats.hits).toBe(500);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe('100.0%');
    });
  });
}

if (process.argv[1] && process.argv[1].includes('memoryBenchmark')) {
  const harness = new TestHarness();
  runMemoryBenchmarkTests(harness).then(() => {
    harness.printSummary('MEMORY BENCHMARK SUMMARY');
  });
}
