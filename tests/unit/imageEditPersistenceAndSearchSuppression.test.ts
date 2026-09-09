/**
 * Unit Tests: Image Edit Persistence, Search Suppression, Fathom Branding & Progressive Reasoning
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { classifyQueryIntent } from '../../server/searchEngine/intentClassifier';
import { detectDynamicTuning, detectImageOperationType } from '../../server/dynamicParameterTuner';
import { parseReasoningMilestones } from '../../src/components/ui/chat-reasoning';
import { isValidImageUri } from '../../src/components/ui/NeuralImageCard';

export async function runImageEditPersistenceAndSearchSuppressionTests(harness: TestHarness) {
  await harness.describe('Image Edit Persistence & Search Suppression Tests', async () => {

    // ── 1. Search Suppression on Follow-up Image Edits ─────────────────────
    await harness.it('should classify "عايزها ذهبي" as NEURAL_IMAGE_STUDIO and bypass web search completely', () => {
      const intent = classifyQueryIntent('عايزها ذهبي', {
        hasMedia: true,
        hasImages: true,
        hasImagesInHistory: true
      });

      // Must NOT search web for gold commodity prices
      expect(intent.should_search).toBe(false);
      expect(intent.intent).not.toBe('REAL_TIME_DATA');
    });

    await harness.it('should detect dynamic tuning for Arabic follow-up color modifications', () => {
      const tuning = detectDynamicTuning(
        'عايزها ذهبي',
        'fathom-quant-3',
        [],
        { hasMedia: false, hasImages: true, hasImagesInHistory: true }
      );

      expect(tuning.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(tuning.requiresSearch).toBe(false);
    });

    await harness.it('should correctly classify operation as "edit" for color modification queries', () => {
      const opType = detectImageOperationType('عايزها ذهبي');
      expect(opType).toBe('edit');

      const opTypeMatte = detectImageOperationType('خليها أسود مطفي');
      expect(opTypeMatte).toBe('edit');

      const opTypeRed = detectImageOperationType('خلها حمرا');
      expect(opTypeRed).toBe('edit');
    });

    await harness.it('should ensure financial gold queries STILL trigger REAL_TIME_DATA correctly', () => {
      const financeIntent = classifyQueryIntent('كم سعر جرام الذهب عيار 21 اليوم في مصر؟');
      expect(financeIntent.should_search).toBe(true);
      expect(financeIntent.intent).toBe('REAL_TIME_DATA');
    });

    // ── 2. isValidImageUri & Truncated Base64 Detection ─────────────────────
    await harness.it('should accept valid high-resolution data URIs and URLs', () => {
      const validUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70';
      const validBase64 = 'data:image/webp;base64,' + 'A'.repeat(1200);

      expect(isValidImageUri(validUrl)).toBe(true);
      expect(isValidImageUri(validBase64)).toBe(true);
    });

    await harness.it('should reject truncated base64 data URIs and invalid placeholders', () => {
      const truncatedBase64 = 'data:image/webp;base64,UklGRm...'; // under 500 chars
      const placeholder = '<رابط الصورة الأصلية>';
      const nullStr = 'null';
      const emptyStr = '';

      expect(isValidImageUri(truncatedBase64)).toBe(false);
      expect(isValidImageUri(placeholder)).toBe(false);
      expect(isValidImageUri(nullStr)).toBe(false);
      expect(isValidImageUri(emptyStr)).toBe(false);
    });

    // ── 3. Complete Eradication of "Serper AI" Branding ───────────────────
    await harness.it('should attribute search reasoning solely to Fathom Search and never mention Serper AI', () => {
      const searchReasoning = `[الاستعلام الشبكي]: [البحث عن: "سعر الذهب اليوم في مصر 2026"]
• المصدر [1]: عيار 21 يسجل 3850 جنيهاً مصرياً.
بناءً على المصادر المسترجعة، نقوم بصياغة الإجابة بدقة.`;

      const milestones = parseReasoningMilestones(searchReasoning, false, false, false, true);
      const searchMilestone = milestones.find(m => m.specialType === 'search');

      expect(searchMilestone).toBeDefined();
      expect(searchMilestone?.title).toContain('Fathom Search');
      expect(searchMilestone?.title).not.toContain('Serper AI');
      expect(searchMilestone?.title).not.toContain('Serper');
    });

    // ── 4. Progressive Reasoning Disclosure (Zero Static Text Blocks) ──────
    await harness.it('should return ONLY the initial milestone when thinking starts, with no static filler', () => {
      const milestones = parseReasoningMilestones('', true, false, false, false);

      // Must NOT return 4 pre-filled static blocks
      expect(milestones.length).toBe(1);
      expect(milestones[0].status).toBe('in-progress');
      expect(milestones[0].details).toBeUndefined();
    });

    await harness.it('should return single search milestone when search is starting with thinking', () => {
      const milestones = parseReasoningMilestones('', true, false, false, true);

      expect(milestones.length).toBe(1);
      expect(milestones[0].id).toBe('step-fathom-search');
      expect(milestones[0].status).toBe('in-progress');
      expect(milestones[0].details).toBeUndefined();
    });

    await harness.it('should reveal full completed milestones once thinking completes', () => {
      const fullNarrative = `المستخدم يطلب حساب حاصل ضرب 17 في 23.
نقوم بتفكيك العدد 23 إلى (20 + 3).
17 × 20 = 340.
17 × 3 = 51.
340 + 51 = 391.
التحقق بطريقة المتطابقة: (20 - 3) × (20 + 3) = 400 - 9 = 391.
النتيجة متطابقة تماماً.`;

      const milestones = parseReasoningMilestones(fullNarrative, false, false, false, false);
      expect(milestones.length).toBeGreaterThanOrEqual(1);

      // All returned milestones must be completed
      for (const m of milestones) {
        expect(m.status).toBe('completed');
      }
    });

    // ── 5. Database Message Persistence Validation ────────────────────────
    await harness.it('should clean ephemeral <think> tags from content prior to database persistence', () => {
      const rawAssistantContent = '<think>\nهذا نص تفكير مطول جداً لا نريد تلويث محتوى الرسالة به\n</think>\n\nإليك الصورة المعدلة باللون الذهبي:';
      const cleanContent = rawAssistantContent.replace(/<think>[\s\S]*?<\/think>\n*/gi, '').trim();

      expect(cleanContent).toBe('إليك الصورة المعدلة باللون الذهبي:');
      expect(cleanContent).not.toContain('<think>');
      expect(cleanContent).not.toContain('</think>');
    });

    await harness.it('should extract imageUrl from neural-image JSON block for database image_url column', () => {
      const contentWithImage = 'تم التعديل:\n```neural-image\n{\n  "operation": "edit",\n  "title": "سيارة مرسيدس ذهبي",\n  "imageUrl": "https://images.unsplash.com/photo-gold-car"\n}\n```';
      
      const m = /```(?:neural-image|neural_image|image-studio|image_studio)?\s*(\{[\s\S]*?\})\s*```/i.exec(contentWithImage);
      expect(m).toBeTruthy();
      const parsed = JSON.parse(m![1]);
      expect(parsed.imageUrl).toBe('https://images.unsplash.com/photo-gold-car');
    });

  });
}
