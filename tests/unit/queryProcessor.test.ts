/**
 * Unit Tests: Query Processor & Normalizer
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import {
  normalizeArabicText,
  extractCleanSearchQuery,
  extractEntitiesFromQuery,
  buildTemporalSearchQuery,
  resolveMultiTurnQuery
} from '../../server/searchEngine/queryProcessor';

export async function runQueryProcessorTests(harness: TestHarness) {
  await harness.describe('Query Processor & Arabic Normalization Unit Tests', async () => {
    await harness.it('should normalize Arabic alefs, teh marbuta, and remove diacritics', () => {
      const raw = 'إِنَّ الأُمُورَ المُمَيَّزَةُ فِي مَدِينَةِ الإِسْكَنْدَرِيَّةِ';
      const normalized = normalizeArabicText(raw);
      expect(normalized).toContain('الامور');
      expect(normalized).toContain('المميزه');
      expect(normalized).toContain('الاسكندريه');
    });

    await harness.it('should strip conversational question prefixes in Arabic and English', () => {
      const q1 = extractCleanSearchQuery('ابحث لي عن سعر هاتف iPhone 16');
      expect(q1).toBe('سعر هاتف iPhone 16');

      const q2 = extractCleanSearchQuery('ما هي عاصمة أستراليا وسكانها؟');
      expect(q2).toBe('عاصمة أستراليا وسكانها');

      const q3 = extractCleanSearchQuery('can you search for latest deepseek news');
      expect(q3).toBe('latest deepseek news');
    });

    await harness.it('should extract tech organizations and companies', () => {
      const entities = extractEntitiesFromQuery('مقارنة بين نماذج OpenAI و Google و DeepSeek الجديدة');
      expect(entities.organizations).toContain('OpenAI');
      expect(entities.organizations).toContain('Google');
      expect(entities.organizations).toContain('DeepSeek');
    });

    await harness.it('should extract explicit 4-digit years', () => {
      const entities = extractEntitiesFromQuery('أحداث حرب أكتوبر سنة 1973 وتطوراتها حتى عام 2026');
      expect(entities.years).toContain(1973);
      expect(entities.years).toContain(2026);
    });

    await harness.it('should augment modern queries with current year 2026 recency bias', () => {
      const currentYear = new Date().getUTCFullYear();
      const res = buildTemporalSearchQuery('أحدث أسعار الذهب والفضة');
      expect(res.isRecencyBiased).toBe(true);
      expect(res.query).toContain(String(currentYear));
    });

    await harness.it('should preserve historical queries without appending modern recency year', () => {
      const res = buildTemporalSearchQuery('تاريخ بناء الأهرامات في مصر القديمة سنة 1920');
      expect(res.isRecencyBiased).toBe(false);
      expect(res.query).toBe('تاريخ بناء الأهرامات في مصر القديمة سنة 1920');
    });

    await harness.it('should resolve multi-turn conversational pronoun queries with prior context', () => {
      const history = [
        { role: 'user', content: 'ماذا قدم محمد صلاح في مباراة طرابزون سبور وفيرينكفاروس؟' },
        { role: 'assistant', content: 'شارك محمد صلاح أساسياً في مباراة طرابزون سبور وفيرينكفاروس في ملحق الدوري الأوروبي.' }
      ];
      const resolved = resolveMultiTurnQuery('سجل كم هدف فيها', history);
      expect(resolved).toContain('محمد صلاح');
      expect(resolved).toContain('طرابزون سبور');
      expect(resolved).toContain('سجل كم هدف فيها');
    });
  });
}
