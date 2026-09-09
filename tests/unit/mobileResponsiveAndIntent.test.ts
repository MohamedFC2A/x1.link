/**
 * Unit & UX Invariant Tests: Mobile Responsive Layout, SVG Intent Precedence, and Reasoning-First Protocol
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 * Zero External Tokens Consumed (Local Deterministic Test Suite)
 */

import fs from 'fs';
import path from 'path';
import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';
import { routeFeatureIntent } from '../../src/lib/featuresRegistry';

export async function runMobileResponsiveAndIntentTests(harness: TestHarness) {
  await harness.describe('Mobile Responsive Layout, Strict SVG Intent & Thinking-First Protocol', async () => {

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Contextual Intent Disambiguation: SVG Precedence over "صمم صورة"
    // ──────────────────────────────────────────────────────────────────────────

    await harness.it('should strictly route "صمم صورة ... اجعلها SVG" to SVG Studio and NOT Neural Image', () => {
      const prompt = 'صمم صورة مرسيدس C200 سوداء matte اجعلها SVG';

      // 1. Dynamic Parameter Tuner classification
      const request: DynamicTuningRequest = {
        userPrompt: prompt,
        requestedModel: 'fathom-quant-3',
      };
      const tuningResult = DynamicParameterTuner.tune(request);
      expect(tuningResult.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(tuningResult.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
      expect(tuningResult.calibrationDirective).toContain('Sovereign Precedence');

      // 2. Feature Registry routeFeatureIntent for svg_studio
      const svgPlan = routeFeatureIntent('svg_studio', prompt, '', '');
      expect(svgPlan.confidence).toBe(1.0);
      expect(svgPlan.shouldRenderWidget).toBe(true);

      // 3. Feature Registry routeFeatureIntent for neural_image_studio MUST be suppressed
      const neuralPlan = routeFeatureIntent('neural_image_studio', prompt, '', '');
      expect(neuralPlan.confidence).toBe(0.0);
      expect(neuralPlan.shouldRenderWidget).toBe(false);
    });

    await harness.it('should route various mixed Arabic/English vector prompts with "صورة" strictly to SVG Studio', () => {
      const testCases = [
        'صمم لي صورة سيارة رياضية اجعلها فيكتور',
        'انشئ صورة كود svg لشعار شركة عقارات',
        'اريد صورة قطة لطيفة بصيغة svg ملونة',
        'صورة رمزية كـ svg مع تدرجات لونية',
        'design an image of a cybernetic dragon make it svg',
        'create a photo style emblem convert to vector',
      ];

      for (const p of testCases) {
        const tuning = DynamicParameterTuner.tune({ userPrompt: p, requestedModel: 'fathom-quant-3' });
        expect(tuning.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');

        const svgPlan = routeFeatureIntent('svg_studio', p, '', '');
        expect(svgPlan.confidence).toBe(1.0);
        expect(svgPlan.shouldRenderWidget).toBe(true);

        const neuralPlan = routeFeatureIntent('neural_image_studio', p, '', '');
        expect(neuralPlan.confidence).toBe(0.0);
        expect(neuralPlan.shouldRenderWidget).toBe(false);
      }
    });

    await harness.it('should route genuine realistic photo requests without SVG strictly to Neural Image Studio', () => {
      const realisticPrompt = 'صمم صورة واقعية لسيارة مرسيدس C200 سوداء matte في شوارع دبي ليلاً بدقة 4K';

      const tuning = DynamicParameterTuner.tune({ userPrompt: realisticPrompt, requestedModel: 'fathom-quant-3' });
      expect(tuning.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');

      const svgPlan = routeFeatureIntent('svg_studio', realisticPrompt, '', '');
      expect(svgPlan.confidence).toBe(0.0);
      expect(svgPlan.shouldRenderWidget).toBe(false);

      const neuralPlan = routeFeatureIntent('neural_image_studio', realisticPrompt, '', '');
      expect(neuralPlan.confidence).toBe(1.0);
      expect(neuralPlan.shouldRenderWidget).toBe(true);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Mobile Responsive Layout Invariants: NeuralImageCard Header
    // ──────────────────────────────────────────────────────────────────────────

    await harness.it('should enforce responsive mobile classes in NeuralImageCard to prevent header badge wrapping', () => {
      const cardPath = path.resolve(process.cwd(), 'src/components/ui/NeuralImageCard.tsx');
      const content = fs.readFileSync(cardPath, 'utf8');

      // 1. FATHOM QUANT 3 must be hidden on mobile (< 640px)
      expect(content).toContain('hidden sm:inline font-mono text-xs font-semibold tracking-wider text-zinc-100 whitespace-nowrap');

      // 2. FATHOM QP3 must have whitespace-nowrap and responsive text size
      expect(content).toContain('text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold whitespace-nowrap');

      // 3. Dimensions must have whitespace-nowrap
      expect(content).toContain('text-[10px] sm:text-[11px] font-mono text-zinc-400 whitespace-nowrap');

      // 4. Header toolbar must have overflow-hidden
      expect(content).toContain('overflow-hidden');

      // 5. Mobile action buttons must have minimum touch targets (at least 30px height)
      expect(content).toContain('min-h-[30px]');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. ChatWindow Scroll Threshold & Mobile UX Invariants
    // ──────────────────────────────────────────────────────────────────────────

    await harness.it('should enforce safe scroll threshold (>160px) and bottom clearance in ChatWindow', () => {
      const windowPath = path.resolve(process.cwd(), 'src/components/ChatWindow.tsx');
      const content = fs.readFileSync(windowPath, 'utf8');

      // 1. Scroll threshold must be increased from 30px to > 160px
      expect(content).toContain('distFromBottom > 160');

      // 2. Sub-pixel micro touch jitter must be guarded
      expect(content).toContain('distFromBottom > 60');

      // 3. Bottom anchor spacing must have clearance for mobile (h-6 sm:h-8)
      expect(content).toContain('h-6 sm:h-8');

      // 4. Scroll-to-bottom button must have WCAG touch target (min-h-[36px]) and safe margin (bottom-5 sm:bottom-6)
      expect(content).toContain('min-h-[36px]');
      expect(content).toContain('bottom-5 sm:bottom-6');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. ChatMessage Thinking-First Protocol & SVG Priority
    // ──────────────────────────────────────────────────────────────────────────

    await harness.it('should enforce reasoning-first display and strict SVG suppression in ChatMessage', () => {
      const msgPath = path.resolve(process.cwd(), 'src/components/ChatMessage.tsx');
      const content = fs.readFileSync(msgPath, 'utf8');

      // 1. ChatReasoning must be rendered when (hasReasoning || isThinking)
      expect(content).toContain('(hasReasoning || isThinking)');
      expect(content).toContain('<ChatReasoning');

      // 2. hasExplicitSvgKeyword regex must include svg and اجعلها svg
      expect(/اجعلها\\s\*svg/.test(content)).toBe(true);

      // 3. isNeuralImageStudioActive must return false when hasExplicitSvgKeyword is true
      expect(content).toContain('if (hasExplicitSvgKeyword && !extractedNeuralImageData) return false;');

      // 4. isSvgStudioActive must prioritize explicit SVG keywords
      expect(content).toContain('if (hasExplicitSvgKeyword && !extractedNeuralImageData) return true;');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 5. System Prompt Sovereign SVG Precedence Invariants
    // ──────────────────────────────────────────────────────────────────────────

    await harness.it('should verify system prompt SVG sovereign priority in api/chat.ts and server/index.ts', () => {
      const apiPath = path.resolve(process.cwd(), 'api/chat.ts');
      const serverPath = path.resolve(process.cwd(), 'server/index.ts');

      const apiContent = fs.readFileSync(apiPath, 'utf8');
      const serverContent = fs.readFileSync(serverPath, 'utf8');

      const expectedDirective = 'أسبقية سيادية مطلقة لطلبات SVG';

      expect(apiContent).toContain(expectedDirective);
      expect(serverContent).toContain(expectedDirective);
      expect(apiContent).toContain('صمم صورة مرسيدس ... اجعلها SVG');
      expect(serverContent).toContain('صمم صورة مرسيدس ... اجعلها SVG');
    });

  });
}
