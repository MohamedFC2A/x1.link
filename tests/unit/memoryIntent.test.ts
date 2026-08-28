/**
 * Unit Tests: Memory Intent Detection
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import { isPersonalMemoryRecallIntent } from '../../src/lib/memoryIntentUtils';

export async function runMemoryIntentTests(harness: TestHarness) {
  await harness.describe('Personal Memory Recall Intent Unit Tests', async () => {
    await harness.it('should detect memory recall requests about past conversations and user identity', () => {
      expect(isPersonalMemoryRecallIntent('ماذا تحدثنا في المحادثة السابقة؟')).toBe(true);
      expect(isPersonalMemoryRecallIntent('فاكر اسمي وبياناتي اللي قلتها لك؟')).toBe(true);
      expect(isPersonalMemoryRecallIntent('قلتلك قبل كده عن مشروعي')).toBe(true);
      expect(isPersonalMemoryRecallIntent('ما هو البورت الذي استخدمناه في الشات السابق؟')).toBe(true);
    });

    await harness.it('should distinguish general conceptual questions from personal memory recall', () => {
      expect(isPersonalMemoryRecallIntent('كيف تعمل ذاكرة الحاسوب العشوائية RAM؟')).toBe(false);
      expect(isPersonalMemoryRecallIntent('ما هي أنواع الذاكرة في علم النفس المعرفي؟')).toBe(false);
      expect(isPersonalMemoryRecallIntent('اشرح لي مفهوم التخزين السحابي')).toBe(false);
    });
  });
}
