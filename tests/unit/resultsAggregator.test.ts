/**
 * Unit Tests: Results Aggregator & 5-Factor Ranking Engine
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import {
  canonicalizeUrl,
  calculateDomainCredibility,
  aggregateAndRankResults
} from '../../server/searchEngine/resultsAggregator';
import { SearchResult } from '../../server/searchEngine/searchTypes';

export async function runResultsAggregatorTests(harness: TestHarness) {
  await harness.describe('Results Aggregator & 5-Factor Ranking Unit Tests', async () => {
    await harness.it('should canonicalize URLs and strip tracking and social click IDs', () => {
      const dirtyUrl = 'https://www.example.com/article/?utm_source=facebook&utm_medium=cpc&si=abc123xyz&fbclid=IwAR0987&igsh=123#top';
      const clean = canonicalizeUrl(dirtyUrl);
      expect(clean).toBe('https://www.example.com/article#top');
      expect(clean).not.toContain('utm_source');
      expect(clean).not.toContain('fbclid');
      expect(clean).not.toContain('si=');
    });

    await harness.it('should assign high credibility to authoritative domains and gov/edu TLDs', () => {
      expect(calculateDomainCredibility('https://who.int/news')).toBeGreaterThanOrEqual(0.95);
      expect(calculateDomainCredibility('https://mohp.gov.eg/updates')).toBeGreaterThanOrEqual(0.98);
      expect(calculateDomainCredibility('https://stanford.edu/paper')).toBeGreaterThanOrEqual(0.98);
      expect(calculateDomainCredibility('https://ar.wikipedia.org/wiki/AI')).toBeGreaterThanOrEqual(0.95);
      expect(calculateDomainCredibility('https://reuters.com/tech')).toBeGreaterThanOrEqual(0.95);
    });

    await harness.it('should deduplicate multiple hits pointing to the same canonical URL', () => {
      const rawHits: SearchResult[] = [
        {
          id: '1',
          title: 'خبر عن الذكاء الاصطناعي في مصر',
          url: 'https://example.com/ai-egypt?utm_source=google',
          snippet: 'تفاصيل هامة وشاملة عن تطور الذكاء الاصطناعي في مصر لعام 2026',
          source: 'Google',
          sourceType: 'google',
        },
        {
          id: '2',
          title: 'خبر عن الذكاء الاصطناعي في مصر',
          url: 'https://example.com/ai-egypt?fbclid=987654',
          snippet: 'تفاصيل هامة وشاملة عن تطور الذكاء الاصطناعي في مصر لعام 2026',
          source: 'DuckDuckGo',
          sourceType: 'duckduckgo',
        }
      ];

      const ranked = aggregateAndRankResults(rawHits, 'الذكاء الاصطناعي في مصر');
      expect(ranked).toHaveLength(1);
    });

    await harness.it('should rank results descending according to 5-factor mathematical formula', () => {
      const rawHits: SearchResult[] = [
        {
          id: 'low',
          title: 'موضوع غير ذي صلة',
          url: 'https://unknown-blog.xyz/post',
          snippet: 'نص عادي قصير جداً',
          source: 'Web',
          sourceType: 'other',
        },
        {
          id: 'high',
          title: 'أسعار الذهب الرسمية اليوم في مصر عيار 21',
          url: 'https://reuters.com/gold-egypt-2026',
          snippet: 'أحدث تقرير رسمي مفصل وشامل حول أسعار الذهب في مصر اليوم عيار 21 وتداولات السوق',
          source: 'Reuters',
          sourceType: 'news',
        }
      ];

      const ranked = aggregateAndRankResults(rawHits, 'أسعار الذهب اليوم في مصر');
      expect(ranked).toHaveLength(2);
      expect(ranked[0].id).toBe('high');
      expect(ranked[0].score).toBeGreaterThan(ranked[1].score || 0);
      expect(ranked[0].credibilityScore).toBeGreaterThanOrEqual(0.90);
    });
  });
}
