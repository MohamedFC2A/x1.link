/**
 * Integration Tests: Multi-Source Search Aggregator
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { executeMultiSourceSearch } from '../../server/searchEngine/multiSourceSearcher';
import { searchWikipedia } from '../../server/searchEngine/wikiSearch';
import { searchGoogleNews } from '../../server/searchEngine/newsSearch';

export async function runMultiSourceSearchIntegrationTests(harness: TestHarness) {
  await harness.describe('Multi-Source Search Live Integration Tests', async () => {
    await harness.it('should fetch real-time news articles from Google News RSS feed', async () => {
      const results = await searchGoogleNews('سعر الدولار اليوم في مصر', { maxResults: 4 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBeDefined();
      expect(results[0].url).toContain('http');
      expect(results[0].sourceType).toBe('news');
      expect(results[0].snippet).toBeDefined();
    });

    await harness.it('should fetch encyclopedic knowledge summaries from Wikipedia Action API', async () => {
      const results = await searchWikipedia('الذكاء الاصطناعي', { maxResults: 3 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('ذكاء');
      expect(results[0].url).toContain('wikipedia.org');
      expect(results[0].sourceType).toBe('wiki');
      expect(results[0].snippet).toBeDefined();
    });

    await harness.it('should execute parallel multi-source search within latency thresholds (< 6000ms)', async () => {
      const start = Date.now();
      const { results, sourcesUsed } = await executeMultiSourceSearch('أحدث أخبار التقنية والذكاء الاصطناعي 2026', {
        maxResults: 6,
        hl: 'ar'
      });
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(sourcesUsed.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(6000);
      // Ensure at least one source returned structured data
      const hasValidHit = results.some(r => r.title.length > 5 && r.url.startsWith('http'));
      expect(hasValidHit).toBe(true);
    });
  });
}
