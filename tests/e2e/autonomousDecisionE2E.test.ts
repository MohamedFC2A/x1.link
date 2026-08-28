/**
 * End-to-End (E2E) Tests: Autonomous Pipeline Full Cycle
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { executeAutonomousSearch } from '../../server/searchEngine';

export async function runAutonomousDecisionE2ETests(harness: TestHarness) {
  await harness.describe('E2E Autonomous Search Pipeline Full Cycle Tests', async () => {
    await harness.it('Full Cycle: Breaking news and live events', async () => {
      const q = 'أحدث التطورات في قمة المناخ ومؤتمرات الذكاء الاصطناعي 2026';
      const result = await executeAutonomousSearch(q, { maxResults: 5 });

      expect(result.intent.intent).toBe('CURRENT_EVENTS');
      expect(result.intent.should_search).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.sourcesUsed.length).toBeGreaterThan(0);
      expect(result.groundingContextBlock).toBeDefined();
      expect(result.groundingContextBlock!).toContain('LIVE WEB INTELLIGENCE');
    });

    await harness.it('Full Cycle: Product and hardware research', async () => {
      const q = 'مواصفات ومميزات هاتف Samsung Galaxy S25 Ultra الجديد';
      const result = await executeAutonomousSearch(q, { maxResults: 5 });

      expect(result.intent.intent).toBe('PRODUCT_RESEARCH');
      expect(result.intent.should_search).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });

    await harness.it('Full Cycle: Rumor verification & Fact checking with strict directives', async () => {
      const q = 'هل أعلنت منظمة الصحة العالمية عن وباء جديد؟';
      const result = await executeAutonomousSearch(q, { maxResults: 5 });

      expect(result.intent.intent).toBe('FACT_CHECKING');
      expect(result.intent.should_search).toBe(true);
      expect(result.groundingContextBlock!).toContain('FACT-CHECKING DIRECTIVE');
    });

    await harness.it('Full Cycle: Cache acceleration on repeat query', async () => {
      const q = 'سعر الذهب اليوم في مصر عيار 21';
      const first = await executeAutonomousSearch(q, { maxResults: 4 });
      expect(first.results.length).toBeGreaterThan(0);

      const start = performance.now();
      const second = await executeAutonomousSearch(q, { maxResults: 4 });
      const durationMs = performance.now() - start;

      expect(second.fromCache).toBe(true);
      expect(durationMs).toBeLessThan(10);
      expect(second.results.length).toBe(first.results.length);
    });
  });
}
