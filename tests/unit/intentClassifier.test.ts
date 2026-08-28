/**
 * Unit Tests: Intent Classifier & Autonomous Trigger
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { classifyQueryIntent } from '../../server/searchEngine/intentClassifier';

export async function runIntentClassifierTests(harness: TestHarness) {
  await harness.describe('Intent Classifier & Autonomous Trigger Unit Tests', async () => {
    await harness.it('should classify REAL_TIME_DATA for currency and live prices', () => {
      const res = classifyQueryIntent('كم سعر الدولار مقابل الجنيه المصري في البنك الآن؟');
      expect(res.intent).toBe('REAL_TIME_DATA');
      expect(res.should_search).toBe(true);
      expect(res.priority).toBe('urgent');
      expect(res.confidence).toBeGreaterThanOrEqual(0.90);
    });

    await harness.it('should classify CURRENT_EVENTS for breaking and latest news', () => {
      const res = classifyQueryIntent('آخر أخبار إطلاق نموذج DeepSeek V4 الجديد ومميزاته');
      expect(res.intent).toBe('CURRENT_EVENTS');
      expect(res.should_search).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.85);
    });

    await harness.it('should classify PRODUCT_RESEARCH for device specs and reviews', () => {
      const res = classifyQueryIntent('مواصفات ومميزات لابتوب Dell XPS 15 الجديد');
      expect(res.intent).toBe('PRODUCT_RESEARCH');
      expect(res.should_search).toBe(true);
    });

    await harness.it('should classify COMPARISON for versus and differences', () => {
      const res = classifyQueryIntent('مقارنة بين معالجات Intel Core Ultra و AMD Ryzen 9');
      expect(res.intent).toBe('COMPARISON');
      expect(res.should_search).toBe(true);
    });

    await harness.it('should classify FACT_CHECKING for rumor verification and truth checking', () => {
      const res = classifyQueryIntent('هل صحيح أن هناك هبوط اضطراري لمركبة الفضاء؟');
      expect(res.intent).toBe('FACT_CHECKING');
      expect(res.should_search).toBe(true);
      expect(res.priority).toBe('urgent');
    });

    await harness.it('should classify TECHNICAL_DOCUMENTATION for API, code and libraries', () => {
      const res = classifyQueryIntent('توثيق ودليل استخدام Express 5 ومكتبات TypeScript');
      expect(res.intent).toBe('TECHNICAL_DOCUMENTATION');
      expect(res.should_search).toBe(true);
    });

    await harness.it('should classify SCIENTIFIC_RESEARCH for academic papers and discoveries', () => {
      const res = classifyQueryIntent('بحث علمي حديث عن الموصلات فائقة التوصيل في مجلة Nature');
      expect(res.intent).toBe('SCIENTIFIC_RESEARCH');
      expect(res.should_search).toBe(true);
    });

    await harness.it('should classify TUTORIAL_HOW_TO for step by step guides', () => {
      const res = classifyQueryIntent('كيف أتعلم الذكاء الاصطناعي وبناء النماذج التوليدية؟');
      expect(res.intent).toBe('TUTORIAL_HOW_TO');
      expect(res.should_search).toBe(true);
    });

    await harness.it('should classify GENERAL_CONVERSATION and disable search for greetings and chit-chat', () => {
      const res = classifyQueryIntent('صباح الخير، كيف حالك وكيف كان يومك؟');
      expect(res.intent).toBe('GENERAL_CONVERSATION');
      expect(res.should_search).toBe(false);
      expect(res.confidence).toBeLessThan(0.40);
    });

    await harness.it('should classify GENERAL_CONVERSATION for creative writing and math requests', () => {
      const res = classifyQueryIntent('اكتب لي قصة خيالية قصيرة عن رائد فضاء');
      expect(res.intent).toBe('GENERAL_CONVERSATION');
      expect(res.should_search).toBe(false);
    });

    await harness.it('should enforce should_search = true when explicitDeepSearch is requested', () => {
      const res = classifyQueryIntent('مرحبا كيف الحال', { explicitDeepSearch: true });
      expect(res.should_search).toBe(true);
      expect(res.confidence).toBe(1.0);
    });

    await harness.it('should autonomously trigger search for zero-keyword factual inquiries without explicit search terms', () => {
      const res = classifyQueryIntent('من هو أول عالم فلكي رصد المذنب ووثق مداره؟');
      expect(res.should_search).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.85);
      expect(res.priority).toBe('urgent');
    });

    await harness.it('should classify complex scientific puzzles with DEEP_CYBER complexity and multi-entity extraction', () => {
      const res = classifyQueryIntent('ما هو المذنب الذي رُصد عام 1957 وعلاقته بالعالم ديراك والاتحاد الفلكي الدولي IAU ونادي RNA Tie Club؟');
      expect(res.should_search).toBe(true);
      expect(res.complexityLevel).toBe('DEEP_CYBER');
      expect(res.knowledgeDomain).toBe('ASTRONOMY_PHYSICS');
      expect(res.entities.years).toContain(1957);
      expect(res.entities.people).toContain('Paul Dirac');
      expect(res.entities.organizations).toContain('IAU');
      expect(res.entities.organizations).toContain('RNA Tie Club');
      expect(res.entities.concepts).toContain('Comet');
      expect(res.subQueries && res.subQueries.length).toBeGreaterThan(0);
    });
  });
}
