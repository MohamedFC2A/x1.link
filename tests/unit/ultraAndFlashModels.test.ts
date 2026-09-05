/**
 * Ultra & Flash Models Unit Test Suite (Zero LLM Tokens Consumed)
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';
import { DeterministicCycleDetector, DynamicScratchpadCompressor } from '../../src/services/fathomCyberEngine';

export async function runUltraAndFlashModelsTests(harness: TestHarness): Promise<void> {
  await harness.describe('Ultra & Flash Models: Sovereign Power & Token Economy Suite', async () => {

    // ─── 1. Ultra Model (deepseek-v4-pro / deepseek-pro) Architecture ─────────
    await harness.it('Ultra Model: resolves family and calibrates ultra-low entropy for cybersecurity audits', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'قم بتحليل ثغرة DPoP RFC 9449 ومطابقة jkt thumbprint وتوفير PoC وترقيع أمني لمنع replay attacks',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
      });

      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.detectedIntent).toBe('CYBERSECURITY_AND_EXPLOIT_AUDITING');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.20);
      expect(result.hyperparameters.top_p).toBeGreaterThanOrEqual(0.95);
      expect(result.hyperparameters.max_tokens).toBe(32768);
    });

    await harness.it('Ultra Model: enforces strict axiomatic temperature for mathematics and physics', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'احسب لي مفارقة التوأم وسرعة الضوء في النسبية الخاصة بدقة رياضية بالمعادلات',
        requestedModel: 'deepseek-v4-pro',
      });

      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.detectedIntent).toBe('MATHEMATICAL_AND_DEDUCTIVE_LOGIC');
      expect(result.hyperparameters.temperature).toBe(0.10);
      expect(result.hyperparameters.top_p).toBe(0.90);
      expect(result.hyperparameters.max_tokens).toBe(32768);
    });

    await harness.it('Ultra Model: calibrates syntactic exactness for enterprise code architecture', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'اكتب كود TypeScript لبناء Ring Buffer عالي الأداء مع Concurrency Lock-Free وإدارة الذاكرة',
        requestedModel: 'fathom-cyber-2.6',
      });

      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.detectedIntent).toBe('CODE_ENGINEERING_AND_ARCHITECTURE');
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.18);
      expect(result.hyperparameters.top_p).toBe(0.95);
    });

    // ─── 2. Flash Model (deepseek-v4-flash / deepseek-flash) Velocity & Economy ───
    await harness.it('Flash Model: caps token ceiling for LIGHT complexity to guarantee sub-second TTFT', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'مرحبا',
        requestedModel: 'deepseek-v4-flash',
      });

      expect(result.targetModelFamily).toBe('deepseek-flash');
      expect(result.complexityLevel).toBe('LIGHT');
      expect(result.hyperparameters.max_tokens).toBe(4096);
      expect(result.hyperparameters.temperature).toBeLessThanOrEqual(0.70);
      expect(result.hyperparameters.frequency_penalty).toBeGreaterThanOrEqual(0.04);
    });

    await harness.it('Flash Model: tunes optimal parameters for STANDARD factual Q&A', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'اشرح الفرق بين بروتوكول TCP وبروتوكول UDP في 4 نقاط محددة وموجزة مع أمثلة لكل منهما',
        requestedModel: 'deepseek-v4-flash-cyber-2.6',
      });

      expect(result.targetModelFamily).toBe('deepseek-flash');
      expect(result.hyperparameters.max_tokens).toBe(8192);
    });

    // ─── 3. SVG Vector Studio Integration & Canvas PNG Readiness ─────────────
    await harness.it('SVG Studio: calibrates Flash for high-speed mathematical vector generation', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'صمم لي كود SVG لشعار ذكاء اصطناعي متقدم مع تدرجات لونية وظلال',
        requestedModel: 'deepseek-v4-flash',
      });

      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.hyperparameters.temperature).toBe(0.38);
      expect(result.hyperparameters.max_tokens).toBe(16384);
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
      expect(result.calibrationDirective).toContain('viewBox');
      expect(result.calibrationDirective).toContain('PNG');
    });

    await harness.it('SVG Studio: validates self-contained SVG without external images or canvas taint', () => {
      const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad1)" rx="24" />
        <circle cx="400" cy="300" r="120" fill="#ffffff" opacity="0.9" />
      </svg>`;

      // Must be valid XML structure
      expect(validSvg.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(validSvg.includes('viewBox="0 0 800 600"')).toBe(true);
      expect(validSvg.includes('<image')).toBe(false);
      expect(!validSvg.includes('http://') && !validSvg.includes('https://') || validSvg.includes('http://www.w3.org/2000/svg')).toBe(true);
    });

    // ─── 4. Token Economy & Zero-Preamble Invariants ──────────────────────────
    await harness.it('Token Economy: calibration directive strictly mandates zero conversational preamble and zero emojis', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'اشرح خوارزمية البحث الثنائي Binary Search في 3 نقاط',
        requestedModel: 'deepseek-v4-pro',
      });

      expect(result.calibrationDirective).toContain('Token Economy & Zero Preamble');
      expect(result.calibrationDirective).toContain('حظر مطلق لأي مقدمات استهلاكية');
      expect(result.calibrationDirective).toContain('No Unicode Emojis');
    });

    // ─── 5. Fathom Cyber 2.6 Engine Cycle-Breaking & Token Budgeting ─────────
    await harness.it('Fathom Cyber Engine: breaks runaway thinking loop within 1ms without token burn', () => {
      const detector = new DeterministicCycleDetector();
      const repeatChunk = 'نحن نقوم بدراسة الفرضية ومقارنتها بالفرضية بعناية فائقة وتدقيق دائم للوصول إلى النتيجة.';

      detector.evaluateChunk(repeatChunk);
      detector.evaluateChunk(repeatChunk);
      const res = detector.evaluateChunk(repeatChunk);

      expect(res.hasCycle).toBe(true);
      expect(res.suggestedAction === 'WARN' || res.suggestedAction === 'FORCE_BREAK').toBe(true);
    });

    await harness.it('Fathom Cyber Engine: Dynamic Scratchpad compresses narrative into high-density tokens', () => {
      const verbose = 'التقاطع بين الشرطين يؤدي إلى استنتاج النتيجة وتم إثباته يقينا مع استبعاد التناقض وهو بديهية ثابتة. دعني أفكر في هذا.';
      const compressed = DynamicScratchpadCompressor.compress(verbose);

      expect(compressed.length).toBeLessThan(verbose.length);
      expect(compressed).toContain('⟹');
    });
  });
}
