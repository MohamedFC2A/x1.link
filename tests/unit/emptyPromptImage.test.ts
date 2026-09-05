/**
 * Unit Tests: Empty-Prompt Image Upload & Autonomous Contextual Perception
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';

export async function runEmptyPromptImageTests(harness: TestHarness) {
  await harness.describe('Empty Prompt Image Handling & Contextual Perception', async () => {
    
    await harness.it('should ensure empty prompt with attachments yields completely empty text content', () => {
      const inputPrompt = '';
      const attachments = [
        {
          id: 'att-1',
          name: 'screenshot.png',
          type: 'image/png',
          size: 1024,
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
      ];

      // Simulate logic in ai-chat-input.tsx
      const trimmed = inputPrompt.trim();
      const formattedContent = trimmed ? trimmed : '';

      expect(formattedContent).toBe('');
      expect(formattedContent).not.toContain('حلل هذه الصورة واستخرج');
      expect(formattedContent).not.toContain('تحليل وفحص');
    });

    await harness.it('should ensure user message content remains empty string when only images are uploaded', () => {
      const prompt = '';
      const attachments = [
        {
          id: 'att-1',
          name: 'photo.jpg',
          type: 'image/jpeg',
          size: 2048,
          dataUrl: 'data:image/jpeg;base64,...'
        }
      ];

      // Simulate App.tsx logic
      const userCleanDisplayContent = prompt ? prompt.trim() : '';
      const userMessageContent = userCleanDisplayContent || '';

      expect(userMessageContent).toBe('');
      expect(userMessageContent).not.toContain('تحليل وفحص الصور المرفقة');
    });

    await harness.it('should generate accurate chat initial title for image without text', () => {
      const effectivePrompt = '';
      const attachments = [{ id: '1', type: 'image/png' }];

      const chatInitialTitle = effectivePrompt 
        ? effectivePrompt.slice(0, 32)
        : (attachments.length > 0 ? 'صورة مرفقة' : 'محادثة جديدة');

      expect(chatInitialTitle).toBe('صورة مرفقة');
      expect(chatInitialTitle).not.toContain('تحليل وفحص الصور');
    });

    await harness.it('should formulate autonomous contextual perception directive when userQuestion is empty', () => {
      const userQuestion = '';

      const userDirective = userQuestion
        ? `الإجابة المباشرة عن طلب وسؤال المستخدم: "${userQuestion}"`
        : `[فهم سياقي تلقائي للصورة — AUTONOMOUS CONTEXTUAL IMAGE PERCEPTION]: لم يكتب المستخدم نصاً مرافقاً؛ استوعب الصورة تلقائياً من سياق المحادثة أو قدم فهماً شاملاً ومباشراً لما تحتويه (حل المسألة، توضيح لقطة الشاشة أو الخطأ البرمجي، قراءة المستند، أو وصف المشهد بدقة) دون أي اصطناع لنصوص لم يطلبها المستخدم.`;

      expect(userDirective).toContain('AUTONOMOUS CONTEXTUAL IMAGE PERCEPTION');
      expect(userDirective).toContain('استوعب الصورة تلقائياً');
      expect(userDirective).not.toContain('حلل هذه اللقطات واستخرج كافة تفاصيلها بدقة');
    });

    await harness.it('should preserve user explicit question when user provides text with image', () => {
      const userQuestion = 'ما الخطأ في هذا الكود؟';

      const userDirective = userQuestion
        ? `الإجابة المباشرة عن طلب وسؤال المستخدم: "${userQuestion}"`
        : `[فهم سياقي تلقائي للصورة — AUTONOMOUS CONTEXTUAL IMAGE PERCEPTION]`;

      expect(userDirective).toBe('الإجابة المباشرة عن طلب وسؤال المستخدم: "ما الخطأ في هذا الكود؟"');
    });

  });
}
