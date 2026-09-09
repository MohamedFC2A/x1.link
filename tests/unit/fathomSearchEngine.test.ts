/**
 * Unit Tests: Fathom Search Cognitive & Multi-Branch Architecture
 * Matany AI (Matany)
 *
 * Verifies:
 * 1. Model branding exclusivity (Zero leak of qwen/qwen3.7-flash on frontend)
 * 2. DynamicParameterTuner resolution, hyperparameter tuning & gateway tools payload
 * 3. Complete eradication of Serper AI from providers and types
 * 4. Dynamic Contextual Thinking Header & Stepper (Web, AI Vid/Img, Memory, Time, Code, Conversation)
 */

import { TestHarness, expect } from '../testUtils';
import { getModelDisplayName } from '../../src/lib/modelUtils';
import { DynamicParameterTuner } from '../../server/dynamicParameterTuner';
import { getFathomSearchContextualInfo, parseReasoningMilestones } from '../../src/components/ui/chat-reasoning';
import fs from 'fs';
import path from 'path';

export async function runFathomSearchEngineTests(harness: TestHarness) {
  await harness.describe('Fathom Search Cognitive Engine & Zero-Leak Branding', async () => {
    // ── 1. Model Branding & Zero-Leak Guarantee ──────────────────────────────
    await harness.it('should display Fathom Search in the frontend with zero leak of qwen', () => {
      const displayName = getModelDisplayName('fathom-search');
      expect(displayName).toBe('Fathom Search');
      expect(displayName.toLowerCase()).not.toContain('qwen');
      expect(displayName.toLowerCase()).not.toContain('flash');
    });

    // ── 2. DynamicParameterTuner Model Family & Gateway Payload ──────────────
    await harness.it('should resolve fathom-search and qwen models to fathom-search family', () => {
      const family1 = DynamicParameterTuner.resolveModelFamily('fathom-search');
      const family2 = DynamicParameterTuner.resolveModelFamily('qwen/qwen3.7-flash');
      const family3 = DynamicParameterTuner.resolveModelFamily('qwen/qwen3.7-flash:online');

      expect(family1).toBe('fathom-search');
      expect(family2).toBe('fathom-search');
      expect(family3).toBe('fathom-search');
    });

    await harness.it('should tune hyperparameters for fathom-search with deterministic precision', () => {
      const params = DynamicParameterTuner.tuneHyperparameters(
        'FACTUAL_SEARCH_AND_REALTIME_GROUNDING',
        'STANDARD',
        'fathom-search'
      );

      expect(params.temperature).toBe(0.3);
      expect(params.top_p).toBe(0.95);
      expect(params.max_tokens).toBe(16384);
    });

    await harness.it('should inject openrouter:web_search tools in tuneGatewayPayload for qwen models', () => {
      const basePayload = { messages: [{ role: 'user', content: 'test query' }] };
      const tuningResult = DynamicParameterTuner.tune({
        userPrompt: 'أحدث أسعار الذهب اليوم',
        requestedModel: 'fathom-search',
        deepSearch: true
      });

      const tunedPayload = DynamicParameterTuner.tuneGatewayPayload(
        'qwen/qwen3.7-flash',
        basePayload,
        tuningResult
      );

      expect(tunedPayload.tools).toBeDefined();
      expect(Array.isArray(tunedPayload.tools)).toBe(true);
      expect(tunedPayload.tools[0].type).toBe('openrouter:web_search');
      expect(tunedPayload.temperature).toBe(0.3);
    });

    // ── 3. Complete Eradication of Serper AI ──────────────────────────────────
    await harness.it('should verify serperSearch.ts file is deleted and eradicated from codebase', () => {
      const serperFilePath = path.join(process.cwd(), 'server', 'searchEngine', 'serperSearch.ts');
      const exists = fs.existsSync(serperFilePath);
      expect(exists).toBe(false);
    });

    // ── 4. Dynamic Contextual Headers & Tailored Smart Sentences ─────────────
    await harness.it('should detect Fathom Search of Web for live web search queries', () => {
      const info = getFathomSearchContextualInfo('ما هي أحدث أخبار التكنولوجيا لعام 2026؟', []);
      expect(info.domain).toBe('web');
      expect(info.title).toBe('Fathom Search of Web');
      expect(info.contextSentence).toContain('استطلاع فائق وموسع للويب الحي');
    });

    await harness.it('should detect Fathom Search of AI Vid or Img for deepfake/forensic checks', () => {
      const info = getFathomSearchContextualInfo('هل هذه الصورة حقيقية أم ذكاء اصطناعي وفحص التزييف العميق؟', [
        { id: 'ai_detect', name: 'AI Detect', nameAr: 'فحص الذكاء الاصطناعي', badgeLabel: 'AI DETECT', summary: '', details: '', statusPill: '', confidence: 1, category: 'actionable' }
      ]);
      expect(info.domain).toBe('ai_detect');
      expect(info.title).toBe('Fathom Search of AI Vid or Img');
      expect(info.contextSentence).toContain('الكشف الجنائي المتقدم');
    });

    await harness.it('should detect Fathom Search of Neural Memory for cross-session recall', () => {
      const info = getFathomSearchContextualInfo('ماذا قلت لك في محادثتنا السابقة عن مشروعي؟', [
        { id: 'memory_detect', name: 'Memory Detect', nameAr: 'الذاكرة', badgeLabel: 'MEMORY DETECT', summary: '', details: '', statusPill: '', confidence: 1, category: 'actionable' }
      ]);
      expect(info.domain).toBe('memory');
      expect(info.title).toBe('Fathom Search of Neural Memory');
      expect(info.contextSentence).toContain('الذاكرة العصبية');
    });

    await harness.it('should detect Fathom Search of Temporal Context for time and date queries', () => {
      const info = getFathomSearchContextualInfo('كم الساعة الآن وما تاريخ اليوم في مصر؟', [
        { id: 'time_detect', name: 'Time Detect', nameAr: 'التوقيت', badgeLabel: 'TIME DETECT', summary: '', details: '', statusPill: '', confidence: 1, category: 'actionable' }
      ]);
      expect(info.domain).toBe('temporal');
      expect(info.title).toBe('Fathom Search of Temporal Context');
      expect(info.contextSentence).toContain('معايرة الإحداثيات الزمنية');
    });

    await harness.it('should detect Fathom Search of Code & Architecture for code refactoring', () => {
      const info = getFathomSearchContextualInfo('اشرح معمارية الـ Clean Architecture وكيفية تقسيم الدوال في المشروع', []);
      expect(info.domain).toBe('code');
      expect(info.title).toBe('Fathom Search of Code & Architecture');
      expect(info.contextSentence).toContain('استكشاف وتشريح معماريات البرمجيات');
    });

    await harness.it('should detect Fathom Search of Conversation & Context for multi-turn dialogue synthesis', () => {
      const info = getFathomSearchContextualInfo('بناءً على سياق المحادثة والملفات المرفقة لخص ما اتفقنا عليه', []);
      expect(info.domain).toBe('conversation');
      expect(info.title).toBe('Fathom Search of Conversation & Context');
      expect(info.contextSentence).toContain('استيعاب متعدد الطبقات لسياق المحادثة');
    });

    // ── 5. Milestones Integration with Dynamic Contextual Titles ──────────────
    await harness.it('should set contextual title and tailored details in parseReasoningMilestones', () => {
      const streamText = '[الاستعلام الشبكي]: [البحث عن: "سعر الدولار اليوم"]\n• المصدر [1]: 50 جنيهاً.';
      const milestones = parseReasoningMilestones(streamText, false, false, false, true, []);

      expect(milestones.length).toBeGreaterThanOrEqual(1);
      const searchMilestone = milestones.find(m => m.specialType === 'search');
      expect(searchMilestone).toBeDefined();
      expect(searchMilestone?.title).toBe('Fathom Search of Web');
      expect(searchMilestone?.title).not.toContain('Serper');
    });
  });
}
