/**
 * Unit Tests: Chat Reasoning Milestones Parser
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { parseReasoningMilestones } from '../../src/components/ui/chat-reasoning';

export async function runChatReasoningMilestonesTests(harness: TestHarness) {
  await harness.describe('Chat Reasoning Milestones Unit Tests', async () => {
    await harness.it('should return clean universal milestones for math/algorithm queries with no search', () => {
      const mathReasoning = `المستخدم يطلب حساب حاصل ضرب 17 في 23.
نقوم بتفكيك العدد 23 إلى (20 + 3).
17 × 20 = 340.
17 × 3 = 51.
340 + 51 = 391.
التحقق بطريقة المتطابقة: (20 - 3) × (20 + 3) = 400 - 9 = 391.
النتيجة متطابقة تماماً.`;

      const milestones = parseReasoningMilestones(mathReasoning, false, false, false, false);
      expect(milestones.length).toBeGreaterThanOrEqual(1);

      // Verify NO fake search titles are generated
      for (const m of milestones) {
        expect(m.title).not.toContain('مصادر البحث');
        expect(m.title).not.toContain('البحث الميدانية');
        expect(m.title).not.toContain('تدقيق ومقاطعة');
        expect(m.specialType).toBeUndefined();
      }

      // First milestone should be analysis/deconstruction
      expect(milestones[0].title).toBe('تفكيك وتحليل معطيات المسألة');
    });

    await harness.it('should consolidate and attribute real search queries to Serper AI and Fathom Search', () => {
      const searchReasoning = `[الاستعلام الشبكي]: [البحث عن: "سعر الذهب اليوم في مصر 2026"]
• المصدر [1]: عيار 21 يسجل 3850 جنيهاً مصرياً.
• المصدر [2]: تقرير البورصة المصرية للذهب اليوم.
بناءً على المصادر المسترجعة، نقوم بصياغة الإجابة بدقة.`;

      const milestones = parseReasoningMilestones(searchReasoning, false, false, false, true);
      expect(milestones.length).toBeGreaterThanOrEqual(1);

      const searchMilestone = milestones.find(m => m.specialType === 'search');
      expect(searchMilestone).toBeDefined();
      expect(searchMilestone?.title).toContain('Serper AI');
      expect(searchMilestone?.title).toContain('Fathom Search');
      expect(searchMilestone?.searchQuery).toBe('سعر الذهب اليوم في مصر 2026');
    });

    await harness.it('should properly recognize Fathom Cam when vision is active', () => {
      const visionReasoning = `المستخدم أرفق لقطة شاشة لجدول التنسيق الإلكتروني.
نقوم بفحص الخانات وقراءة الرغبة الأولى ومطابقتها.`;

      const milestones = parseReasoningMilestones(visionReasoning, false, true, false, false);
      const camMilestone = milestones.find(m => m.specialType === 'cam');
      expect(camMilestone).toBeDefined();
      expect(camMilestone?.title).toContain('Fathom Cam');
      expect(camMilestone?.title).toContain('المسح البصري');
    });

    await harness.it('should provide stable IDs across progressive streaming tokens', () => {
      const chunk1 = 'المستخدم يطلب حساب حاصل ضرب 17 في 23.';
      const chunk2 = `${chunk1}\nنقوم بتفكيك العدد 23 إلى 20 + 3.\n17 × 20 = 340.`;
      const chunk3 = `${chunk2}\n17 × 3 = 51.\nالناتج 391.`;

      const m1 = parseReasoningMilestones(chunk1, true);
      const m2 = parseReasoningMilestones(chunk2, true);
      const m3 = parseReasoningMilestones(chunk3, true);

      // All progressive steps should use predictable step-reasoning-N IDs
      expect(m1[0].id).toBe('step-reasoning-0');
      expect(m2[0].id).toBe('step-reasoning-0');
      expect(m3[0].id).toBe('step-reasoning-0');
    });

    await harness.it('should order search as step 1 followed by deconstruction as step 2 when search is active', () => {
      const searchReasoning = `[الاستعلام الشبكي]: [البحث عن: "سعر الفضة اليوم"]\n• المصدر [1]: جرام الفضة يسجل 50 جنيهاً.\nتفكيك: نريد حساب سعر السبيكة.\nاستدلال: سبيكة 100 جرام تساوي 5000 جنيه.\nصياغة: إعداد الإجابة.`;
      const milestones = parseReasoningMilestones(searchReasoning, false, false, false, true);
      
      expect(milestones.length).toBe(4);
      expect(milestones[0].id).toBe('step-fathom-search');
      expect(milestones[0].specialType).toBe('search');
      expect(milestones[1].id).toBe('step-reasoning-0');
      expect(milestones[2].id).toBe('step-reasoning-1');
      expect(milestones[3].id).toBe('step-reasoning-2');
    });

    await harness.it('should correctly parse structured numbered steps written by the model', () => {
      const structured = `1. تفكيك المعطيات: تحديد أطول 3 لاعبين بدقة.
2. الاستدلال والتدقيق: جورجي موريسان ومانوت بول بطول 231 سم، وشون برادلي 229 سم.
3. استخلاص النتيجة: تقديم الرد بشكل فصيح وموجز.`;
      const milestones = parseReasoningMilestones(structured, false, false, false, false);
      expect(milestones.length).toBeGreaterThanOrEqual(3);
      expect(milestones[0].details).toContain('تحديد أطول 3 لاعبين');
      expect(milestones[1].details).toContain('231 سم');
    });

    await harness.it('should never split words in half during segmentation', () => {
      const text = 'هذه جملة استدلالية أولى للتأكد من عدم قص الكلمات في المنتصف. وهذه جملة ثانية لاختبار التقطيع المنطقي للجمل. وهذه جملة ثالثة للتحقق النهائي.';
      const milestones = parseReasoningMilestones(text, false);
      for (const m of milestones) {
        if (m.details) {
          // Verify no broken characters or clipped tokens
          expect(m.details.endsWith('-')).toBe(false);
          expect(m.details.length).toBeGreaterThan(5);
        }
      }
    });
  });
}
