/**
 * Integration Tests: Chat & Search Pipeline Flow
 * Matany AI (x1.link)
 */

import { TestHarness, expect } from '../testUtils';
import { executeAutonomousSearch } from '../../server/searchEngine';

export async function runChatSearchPipelineIntegrationTests(harness: TestHarness) {
  await harness.describe('Chat & Search Pipeline Integration Flow Tests', async () => {
    await harness.it('should autonomously ground user question with verified search context', async () => {
      const userPrompt = 'ما هي آخر أخبار تطور نماذج الذكاء الاصطناعي اليوم؟';
      const searchRes = await executeAutonomousSearch(userPrompt, { maxResults: 4 });

      expect(searchRes.intent.should_search).toBe(true);
      expect(searchRes.intent.intent).toBe('CURRENT_EVENTS');
      expect(searchRes.results.length).toBeGreaterThan(0);
      expect(searchRes.groundingContextBlock).toBeDefined();
      expect(searchRes.groundingContextBlock).toContain('LIVE WEB INTELLIGENCE');
      expect(searchRes.groundingContextBlock).toContain('المصدر رقم (1)');
    });

    await harness.it('should cleanly bypass web search for pure conversational prompts', async () => {
      const userPrompt = 'أهلاً وسهلاً، كيف أصبحت اليوم؟';
      const searchRes = await executeAutonomousSearch(userPrompt);

      expect(searchRes.intent.should_search).toBe(false);
      expect(searchRes.intent.intent).toBe('GENERAL_CONVERSATION');
      expect(searchRes.results).toHaveLength(0);
      expect(searchRes.groundingContextBlock).toBeUndefined();
    });
  });
}
