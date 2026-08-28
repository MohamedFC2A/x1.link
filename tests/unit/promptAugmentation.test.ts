/**
 * Unit Tests: Prompt Augmentation Engine
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import {
  buildSearchGroundingContextBlock,
  augmentPromptWithSearchResults
} from '../../server/searchEngine/promptAugmentation';
import { SearchResult, IntentClassificationResult } from '../../server/searchEngine/searchTypes';

export async function runPromptAugmentationTests(harness: TestHarness) {
  await harness.describe('Prompt Augmentation & Grounding Unit Tests', async () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'تقرير أسعار العملات في البنك المركزي المصري',
        url: 'https://cbe.org.eg/rates',
        snippet: 'سعر الدولار اليوم 48.50 جنيهاً وسعر اليورو 52.30 جنيهاً',
        source: 'البنك المركزي المصري',
        sourceType: 'news',
        credibilityScore: 0.98,
        date: '2026-08-28'
      }
    ];

    const mockIntent: IntentClassificationResult = {
      intent: 'REAL_TIME_DATA',
      confidence: 0.98,
      should_search: true,
      search_type: 'REAL_TIME_DATA',
      priority: 'urgent',
      entities: { people: [], organizations: [], dates: [], locations: ['مصر'], products: [], concepts: [], years: [2026] },
      reason: 'Live prices',
      temporalBias: true,
      extractedQuery: 'سعر الدولار اليوم في مصر'
    };

    await harness.it('should generate structured grounding markdown context block', () => {
      const block = buildSearchGroundingContextBlock(mockResults, mockIntent, 'سعر الدولار اليوم');
      expect(block).toContain('LIVE WEB INTELLIGENCE');
      expect(block).toContain('المصدر رقم (1): تقرير أسعار العملات في البنك المركزي المصري');
      expect(block).toContain('https://cbe.org.eg/rates');
      expect(block).toContain('[5/5]');
      expect(block).toContain('توجيه البيانات الحية والأسعار');
    });

    await harness.it('should inject fact-checking directives when intent is FACT_CHECKING', () => {
      const factIntent: IntentClassificationResult = {
        ...mockIntent,
        intent: 'FACT_CHECKING'
      };
      const block = buildSearchGroundingContextBlock(mockResults, factIntent, 'هل انخفض سعر الدولار؟');
      expect(block).toContain('FACT-CHECKING DIRECTIVE');
      expect(block).toContain('صحيح | غير صحيح / شائعة | مضلل / غير مؤكد');
    });

    await harness.it('should augment user or system prompt cleanly', () => {
      const basePrompt = 'أنت مساعد ذكي.';
      const block = '[نتائج البحث الحي]: معلومات مؤكدة';
      const combined = augmentPromptWithSearchResults(basePrompt, block);
      expect(combined).toBe(`${basePrompt}\n\n${block}`);
    });
  });
}
