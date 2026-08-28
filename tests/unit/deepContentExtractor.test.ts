/**
 * Unit Tests: Deep Page Content Extractor
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { extractCleanArticleTextFromHtml, enrichSearchResultsWithDeepContent } from '../../server/searchEngine/deepContentExtractor';
import { SearchResult } from '../../server/searchEngine/searchTypes';

export async function runDeepContentExtractorTests(harness: TestHarness) {
  await harness.describe('Deep Page Content Extractor Unit Tests', async () => {
    await harness.it('should extract clean text and strip scripts, nav, footer from html', () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>تقرير المباراة</title></head>
        <body>
          <nav><a href="/">الرئيسية</a></nav>
          <article>
            <h1>محمد صلاح يقود طرابزون سبور أمام فيرينكفاروس</h1>
            <p>سجل اللاعب الدولي المصري محمد صلاح هدفين وصنع هدفاً في مباراة الذهاب التي انتهت بنتيجة 3-1.</p>
            <p>وقدم صلاح أداءً استثنائياً طوال شوطي اللقاء نال به إشادة واسعة من الجهاز الفني والجماهير.</p>
          </article>
          <script>console.log("ad script");</script>
          <footer>جميع الحقوق محفوظة 2026</footer>
        </body>
        </html>
      `;

      const text = extractCleanArticleTextFromHtml(mockHtml);
      expect(text).toContain('محمد صلاح يقود طرابزون سبور');
      expect(text).toContain('سجل اللاعب الدولي المصري محمد صلاح هدفين');
      expect(text).not.toContain('console.log');
      expect(text).not.toContain('جميع الحقوق محفوظة');
    });

    await harness.it('should enrich search results preserving existing structure', async () => {
      const results: SearchResult[] = [
        {
          id: 'test-1',
          title: 'ماذا قدم محمد صلاح في مباراة طرابزون سبور وفيرينكفاروس؟',
          url: 'https://example.com/article/1',
          snippet: 'ملخص قصير للخبر',
          source: 'Btolat',
          sourceType: 'news'
        }
      ];

      const enriched = await enrichSearchResultsWithDeepContent(results, 1, 1000);
      expect(enriched.length).toBe(1);
      expect(enriched[0].title).toBe('ماذا قدم محمد صلاح في مباراة طرابزون سبور وفيرينكفاروس؟');
    });
  });
}
