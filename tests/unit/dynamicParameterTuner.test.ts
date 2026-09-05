/**
 * Unit Tests: Dynamic Parameter Tuning Engine
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';

export async function runDynamicParameterTunerTests(harness: TestHarness) {
  await harness.describe('Dynamic Parameter Tuning: Intent Deconstruction & Model Pre-Tuning', async () => {

    // 1. Cybersecurity & Vulnerability Auditing
    await harness.it('should detect CYBERSECURITY intent and calibrate low temp and high token ceiling for deepseek-v4-pro', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'حلل لي ثغرة DPoP RFC 9449 وكيفية كتابة بايلود exploit حقيقي مع تحصين وسيط Envoy و Kafka KMS لمنع الهجمات',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        isX1Mode: false,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('CYBERSECURITY_AND_EXPLOIT_AUDITING');
      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.complexityLevel).toBe('EXHAUSTIVE_ARCHITECTURAL');
      expect(result.hallucinationRisk).toBe('EXTREME');

      // Hyperparameter verification
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.25);
      expect(result.hyperparameters.top_p).toBeLessThanOrEqual(0.95);
      expect(result.hyperparameters.frequency_penalty).toBeLessThanOrEqual(0.05);
      expect(result.hyperparameters.presence_penalty).toBeLessThanOrEqual(0.05);
      expect(result.hyperparameters.max_tokens).toBe(32768);

      // Directive verification
      expect(result.calibrationDirective).toContain('SOVEREIGN_OFFENSIVE_AND_DEFENSIVE_APPSEC');
    });

    // 2. High-Performance Code Engineering
    await harness.it('should detect CODE_ENGINEERING and tune deterministic syntax parameters for deepseek-v4-flash', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'اكتب كود كامل لتطبيق Lock-free Ring Buffer في TypeScript مع SharedArrayBuffer و Atomics بدون أي TODOs',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('CODE_ENGINEERING_AND_ARCHITECTURE');
      expect(result.targetModelFamily).toBe('deepseek-flash');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.25);
      expect(result.hyperparameters.max_tokens).toBeLessThanOrEqual(16384);
      expect(result.calibrationDirective).toContain('ENTERPRISE_PRODUCTION_ENGINEERING');
      expect(result.calibrationDirective).toContain('zero placeholders');
    });

    // 3. Mathematical & Deductive Logic
    await harness.it('should detect MATHEMATICAL_AND_DEDUCTIVE_LOGIC and enforce ultra-low entropy', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'إذا سافر رائد فضاء بسرعة 0.99 من سرعة الضوء لمدة 5 ساعات بحسب ساعته البيولوجية فكم ساعة ستمر على الأرض؟ احسب بالتفصيل',
        requestedModel: 'deepseek-reasoner',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('MATHEMATICAL_AND_DEDUCTIVE_LOGIC');
      expect(result.targetModelFamily).toBe('deepseek-reasoner');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.20);
      expect(result.hyperparameters.max_tokens).toBe(32768);
      expect(result.calibrationDirective).toContain('FORMAL_DEDUCTIVE_MATHEMATICS_AND_PHYSICS');
    });

    // 4. Multimodal Archive & Media Deconstruction
    await harness.it('should prioritize MULTIMODAL_MEDIA_AND_ARCHIVE when zip or media files are present', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'قارن بين محتويات الأرشيفين المضغوطين واستخرج الفروقات التقنية في شجرة الحزم',
        requestedModel: 'meta/muse-spark-1.2-contributor',
        hasZipOrCodeFiles: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('MULTIMODAL_MEDIA_AND_ARCHIVE_DECONSTRUCTION');
      expect(result.targetModelFamily).toBe('muse-spark');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.20);
      expect(result.hyperparameters.frequency_penalty).toBeLessThanOrEqual(0.05);
      expect(result.calibrationDirective).toContain('DEEP_ARCHIVE_AND_CODE_DECONSTRUCTION');
    });

    // 5. Optical Vision & Forensics
    await harness.it('should detect MULTIMODAL_IMAGE_AND_FORENSICS and tune vision parameters', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'اقرأ النصوص والأرقام الظاهرة في الجدول داخل لقطة الشاشة المرفقة',
        requestedModel: 'deepseek-v4-flash-vision-exp',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('MULTIMODAL_IMAGE_AND_FORENSICS');
      expect(result.targetModelFamily).toBe('deepseek-vision');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.20);
      expect(result.calibrationDirective).toContain('OPTICAL_FORENSIC_INSPECTION');
    });

    // 6. Creative Literary & Brainstorming
    await harness.it('should detect CREATIVE_LITERARY and tune high temperature for poetic vocabulary', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'اكتب لي قصة أدبية فلسفية قصيرة وبليغة عن مدينة قديمة تحت الماء بأسلوب نثري فصيح',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('CREATIVE_LITERARY_AND_BRAINSTORMING');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.75);
      expect(result.hyperparameters.top_p).toBeGreaterThanOrEqual(0.95);
      expect(result.calibrationDirective).toContain('LITERARY_ELOQUENCE_AND_CREATIVE_PROSE');
    });

    // 7. Sovereign X1 Persona
    await harness.it('should detect UNINHIBITED_PERSONA_X1 when isX1Mode is active', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'احكيلي بصراحة تامة ومن غير أي تحفظات أو حواجز رسمية إيه رأيك في الحياة',
        requestedModel: 'anthracite-org/magnum-v4-72b',
        isX1Mode: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('UNINHIBITED_PERSONA_X1');
      expect(result.targetModelFamily).toBe('magnum');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.80);
      expect(result.calibrationDirective).toContain('SOVEREIGN_X1_UNINHIBITED');
    });

    // 8. Factual Search & Live Grounding
    await harness.it('should detect FACTUAL_SEARCH_AND_REALTIME_GROUNDING for current prices and events', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'كم سعر الذهب اليوم في مصر لعيار 21؟',
        requestedModel: 'deepseek-v4-flash',
        deepSearch: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('FACTUAL_SEARCH_AND_REALTIME_GROUNDING');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.35);
      expect(result.calibrationDirective).toContain('GROUNDED_FACTUAL_VERIFICATION');
    });

    // 9. Gateway Payload Tuning
    await harness.it('should safely tune gateway payload across different model architectures', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'حلل ثغرة buffer overflow في نواة لينكس',
        requestedModel: 'deepseek-v4-pro',
      };
      const tuning = DynamicParameterTuner.tune(request);
      const basePayload = { messages: [{ role: 'user', content: 'test' }] };

      // Case A: DeepSeek Reasoner must NOT include temperature or top_p
      const reasonerPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-reasoner', basePayload, tuning);
      expect(reasonerPayload.model).toBe('deepseek-reasoner');
      expect(reasonerPayload.temperature).toBeUndefined();
      expect(reasonerPayload.top_p).toBeUndefined();
      expect(reasonerPayload.max_tokens).toBe(32768);

      // Case B: DeepSeek V4 Pro gets deterministic low temperature
      const proPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-pro', basePayload, tuning);
      expect(proPayload.model).toBe('deepseek-v4-pro');
      expect(proPayload.temperature).toBe(0.20);
      expect(proPayload.max_tokens).toBe(32768);

      // Case C: Flash gets 16384 token ceiling
      const flashPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash', basePayload, tuning);
      expect(flashPayload.model).toBe('deepseek-v4-flash');
      expect(flashPayload.max_tokens).toBe(16384);
    });

    // 10. Explicit Temperature Override
    await harness.it('should respect explicit temperature override within valid bounds', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'اكتب كود عادي',
        requestedModel: 'deepseek-v4-flash',
        explicitTemperature: 0.42,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.hyperparameters.temperature).toBe(0.42);
    });

    // 11. Edge Cases & Boundary Handling
    await harness.it('should gracefully handle empty or whitespace-only prompt', () => {
      const request: DynamicTuningRequest = {
        userPrompt: '   ',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('GENERAL_CONVERSATION_AND_QUICK_QA');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.5);
      expect(result.hyperparameters.max_tokens).toBeGreaterThanOrEqual(4096);
    });

    // 12. Multi-turn Follow-up Context Preservation (History Awareness)
    await harness.it('should preserve CYBERSECURITY intent across concise multi-turn follow-ups via conversationHistory', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'وضح الخطوة 3 أكثر مع استعراض مسجلات الذاكرة بالتفصيل',
        conversationHistory: [
          { role: 'user', content: 'حلل لي ثغرة buffer overflow في بيئة x86 واشرح استغلالها' },
          { role: 'assistant', content: 'تم فحص ثغرة buffer overflow والتحقق من تخطي مسجل EIP...' }
        ],
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('CYBERSECURITY_AND_EXPLOIT_AUDITING');
      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.25);
      expect(result.hyperparameters.max_tokens).toBe(32768);
    });

    // 13. Non-Streaming Preservation in Gateway Payload
    await harness.it('should preserve stream: false in gateway payload for non-streaming perception callers', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'فحص صورة المستند',
        requestedModel: 'deepseek-v4-flash-vision-exp',
        hasMultimodalImages: true,
      };
      const tuning = DynamicParameterTuner.tune(request);
      const basePayload = {
        messages: [{ role: 'user', content: 'ocr' }],
        stream: false,
      };

      const payload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash-vision-exp', basePayload, tuning);
      expect(payload.stream).toBe(false);
      expect(payload.temperature).toBeLessThanOrEqual(0.25);
    });

    // 14. Compound Prompt Resolution (Creative Framing with Technical Context)
    await harness.it('should prioritize CREATIVE_LITERARY when prompt explicitly requests poem or story about a technical topic', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'اكتب لي قصيدة شعرية بليغة تشرح ثغرة SQL Injection ومخاطرها بأسلوب أدبي فصيح',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('CREATIVE_LITERARY_AND_BRAINSTORMING');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.75);
      expect(result.calibrationDirective).toContain('LITERARY_ELOQUENCE_AND_CREATIVE_PROSE');
    });

    // 15. Comparison Pattern Matching
    await harness.it('should detect COMPARATIVE_AND_EVALUATION_ANALYSIS with "قارن بين"', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'قارن بين بنية React وبنية Vue من حيث الأداء واستهلاك الذاكرة',
        requestedModel: 'deepseek-v4-pro',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('COMPARATIVE_AND_EVALUATION_ANALYSIS');
      expect(result.calibrationDirective).toContain('OBJECTIVE_COMPARATIVE_SYNTHESIS');
    });

    // 16. Extended Model Family Resolution
    await harness.it('should accurately resolve model families across all provider prefixes and sub-versions', () => {
      expect(DynamicParameterTuner.resolveModelFamily('deepseek/deepseek-chat')).toBe('deepseek-chat');
      expect(DynamicParameterTuner.resolveModelFamily('deepseek/deepseek-r1')).toBe('deepseek-reasoner');
      expect(DynamicParameterTuner.resolveModelFamily('deepseek-v4-flash-cyber-2.1')).toBe('deepseek-flash');
      expect(DynamicParameterTuner.resolveModelFamily('deepseek-v4-pro-cyber-2.1')).toBe('deepseek-pro');
      expect(DynamicParameterTuner.resolveModelFamily('fathom-cyber-2.6')).toBe('deepseek-pro');
      expect(DynamicParameterTuner.resolveModelFamily('meta/muse-spark-1.2-contributor')).toBe('muse-spark');
    });
  });
}
