/**
 * Unit Tests: Official DeepSeek API Algorithms & Token Economy Suite
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 *
 * Implements verification against official DeepSeek API Documentation (https://api-docs.deepseek.com):
 * 1. Thinking Mode & Reasoning Effort Control (low, high, max)
 * 2. Strict Parameter Sanitization (No temperature/top_p during reasoning)
 * 3. Disk KV Cache Prefix Preservation Algorithm (Static System Prompt Anchoring)
 * 4. KVCache & Scheduling Isolation via user_id
 * 5. Stream Usage Telemetry (stream_options: { include_usage: true })
 * 6. Multi-Round Chat History Cleaning (<think> tag stripping & token economy)
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';

export async function runDeepSeekAlgorithmsTests(harness: TestHarness) {
  await harness.describe('DeepSeek Official API Algorithms & Token Economy Suite', async () => {

    // 1. Thinking Effort Calibration: SVG Studio Strict Zero-Thinking
    await harness.it('should disable thinking mode and assign low effort for SVG Studio to deliver instant direct output', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'صمم شعار فيكتور احترافي بصيغة SVG لشركة تقنية سحابية',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.hyperparameters.thinking_mode).toBe('disabled');
      expect(result.hyperparameters.reasoning_effort).toBe('low');
      expect(result.telemetry.thinkingMode).toBe('disabled');
      expect(result.telemetry.reasoningEffort).toBe('low');

      const payload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash', {}, result);
      expect(payload.extra_body?.thinking?.type).toBe('disabled');
      expect(payload.reasoning_effort).toBeUndefined();
      expect(payload.temperature).toBeDefined();
      expect(payload.top_p).toBeDefined();
    });

    // 2. Thinking Effort Calibration: Light / Greeting Tasks
    await harness.it('should assign low reasoning effort for light queries and greetings to achieve sub-second TTFT and save tokens', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'مرحبا، كيف حالك اليوم؟',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.hyperparameters.thinking_mode).toBe('enabled');
      expect(result.hyperparameters.reasoning_effort).toBe('low');

      const payload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash', {}, result);
      expect(payload.reasoning_effort).toBe('low');
      expect(payload.extra_body?.reasoning_effort).toBe('low');
      expect(payload.extra_body?.thinking?.type).toBe('enabled');
    });

    // 3. Thinking Effort Calibration: Cybersecurity & Mathematical Deductive Logic
    await harness.it('should assign max reasoning effort for cybersecurity audits and mathematical proofs', () => {
      const cyberRequest: DynamicTuningRequest = {
        userPrompt: 'حلل ثغرة DPoP Proof Replay عبر Envoy Gateway مع بايلود PoC حقيقي وترقيع أمني منيع',
        requestedModel: 'deepseek-v4-pro',
      };

      const cyberResult = DynamicParameterTuner.tune(cyberRequest);
      expect(cyberResult.detectedIntent).toBe('CYBERSECURITY_AND_EXPLOIT_AUDITING');
      expect(cyberResult.hyperparameters.reasoning_effort).toBe('max');

      const cyberPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-pro', {}, cyberResult);
      expect(cyberPayload.reasoning_effort).toBe('max');
      expect(cyberPayload.extra_body?.reasoning_effort).toBe('max');

      const mathRequest: DynamicTuningRequest = {
        userPrompt: 'أثبت رياضياً أن سرعة الإفلات من أفق حدث ثقب أسود دوار كير تساوي سرعة الضوء',
        requestedModel: 'deepseek-reasoner',
      };

      const mathResult = DynamicParameterTuner.tune(mathRequest);
      expect(mathResult.detectedIntent).toBe('MATHEMATICAL_AND_DEDUCTIVE_LOGIC');
      expect(mathResult.hyperparameters.reasoning_effort).toBe('max');

      const mathPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-reasoner', {}, mathResult);
      expect(mathPayload.reasoning_effort).toBe('max');
    });

    // 4. Strict DeepSeek Reasoner Parameter Sanitization
    await harness.it('should strictly eliminate temperature, top_p, and penalties for deepseek-reasoner to prevent 400 bad request', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'احسب التكامل المحدود من 0 إلى ما لا نهاية للدالة Gaussian e^(-x^2) dx',
        requestedModel: 'deepseek-reasoner',
      };

      const result = DynamicParameterTuner.tune(request);
      const basePayload = {
        messages: [{ role: 'user', content: 'calc' }],
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      };

      const payload = DynamicParameterTuner.tuneGatewayPayload('deepseek-reasoner', basePayload, result);
      expect(payload.model).toBe('deepseek-reasoner');
      expect(payload.temperature).toBeUndefined();
      expect(payload.top_p).toBeUndefined();
      expect(payload.frequency_penalty).toBeUndefined();
      expect(payload.presence_penalty).toBeUndefined();
      expect(payload.reasoning_effort).toBe('max');
    });

    // 5. KVCache Isolation & User ID Sanitization
    await harness.it('should sanitize user_id and inject into payload and extra_body for KVCache and scheduling isolation', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'سؤال تقني في هندسة البرمجيات',
        requestedModel: 'deepseek-v4-pro',
      };

      const result = DynamicParameterTuner.tune(request);
      const basePayload = {
        messages: [{ role: 'user', content: 'question' }],
        user_id: 'user#123@_session!',
      };

      const payload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-pro', basePayload, result);
      expect(payload.user_id).toBe('user123_session');
      expect(payload.extra_body?.user_id).toBe('user123_session');
    });

    // 6. Stream Options Telemetry Injection
    await harness.it('should inject stream_options: { include_usage: true } for streaming DeepSeek requests', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'شرح بسيط',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      const streamPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash', { stream: true }, result);
      expect(streamPayload.stream_options?.include_usage).toBe(true);

      const nonStreamPayload = DynamicParameterTuner.tuneGatewayPayload('deepseek-v4-flash', { stream: false }, result);
      expect(nonStreamPayload.stream_options).toBeUndefined();
    });

    // 7. Disk KV-Cache Prefix Preservation Algorithm
    await harness.it('should keep static system prefix strictly unchanged between calls with different timestamps and memories', () => {
      const baseSystemPrompt = 'YOU ARE MATANY AI — SOVEREIGN CORE SYSTEM.';
      const calibrationDirective = '[COGNITIVE ALIGNMENT DIRECTIVE]: Strict mode.';

      const call1Prompt = DynamicParameterTuner.buildKVCacheOptimizedSystemPrompt(
        baseSystemPrompt,
        calibrationDirective,
        {
          timeDetectPrompt: 'Current Time: 2026-09-05T10:00:00Z',
          memoryPrompt: 'User likes TypeScript'
        }
      );

      const call2Prompt = DynamicParameterTuner.buildKVCacheOptimizedSystemPrompt(
        baseSystemPrompt,
        calibrationDirective,
        {
          timeDetectPrompt: 'Current Time: 2026-09-05T10:05:30Z',
          memoryPrompt: 'User likes Rust'
        }
      );

      const staticPrefix = `${baseSystemPrompt}\n\n${calibrationDirective}`;
      expect(call1Prompt.startsWith(staticPrefix)).toBe(true);
      expect(call2Prompt.startsWith(staticPrefix)).toBe(true);
      expect(call1Prompt.slice(0, staticPrefix.length)).toBe(call2Prompt.slice(0, staticPrefix.length));
    });

    // 8. Multi-Round Chat History Token Economy (<think> stripping)
    await harness.it('should strip past <think> tags and code block thoughts from assistant history to save input tokens', () => {
      const messages = [
        { role: 'user', content: 'حلل الكود' },
        {
          role: 'assistant',
          content: '<think>هذا تفكير داخلي طويل يستهلك آلاف التوكنس ويجب عدم إعادته للنموذج</think>الكود نظيف ويعمل بكفاءة.',
          reasoning_content: 'أفكار داخلية سرية'
        },
        { role: 'user', content: 'وماذا عن الأداء؟' }
      ];

      const cleaned = DynamicParameterTuner.cleanConversationHistoryForKVCache(messages);
      expect(cleaned.length).toBe(3);
      expect(cleaned[1].role).toBe('assistant');
      expect(cleaned[1].content).toBe('الكود نظيف ويعمل بكفاءة.');
      expect((cleaned[1] as any).reasoning_content).toBeUndefined();
    });
  });
}
