/**
 * Unit Tests: Neural Image Studio & Sovereign Photo Inpainting Engine
 * Matany AI (Matany) — Cyber Ultra Multimodal Architecture
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';
import { detectIntentsMulti, routeFeatureIntent } from '../../src/lib/featuresRegistry';

export async function runNeuralImageStudioTests(harness: TestHarness) {
  await harness.describe('Neural Image Studio & Cyber Ultra Inpainting Suite', async () => {

    // 1. Photo Recoloring with Attached Image -> MUST be NEURAL_IMAGE_STUDIO_AND_PROCESSING
    await harness.it('should route photo recoloring with attached image to NEURAL_IMAGE_STUDIO_AND_PROCESSING and NEVER to SVG', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'غير لون القميص في الصورة المرفقة إلى كحلي مع الحفاظ على كل تفاصيل القماش',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.hyperparameters.temperature).toBe(0.35);
      expect(result.hyperparameters.max_tokens).toBe(32768);
      expect(result.calibrationDirective).toContain('CYBER_ULTRA_NEURAL_IMAGE_STUDIO');
      expect(result.calibrationDirective).toContain('الحظر الصارم والقطعي لتحويل الصور الفوتوغرافية إلى SVG');
      expect(result.calibrationDirective).toContain('100% Identity, Texture, and Face Preservation');
      expect(result.calibrationDirective).toContain('```neural-image');
    });

    // 2. Background Removal & Isolation with Attached Image
    await harness.it('should route background removal with attached image to NEURAL_IMAGE_STUDIO_AND_PROCESSING', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'احذف خلفية الصورة دي واعزل الشخص بدقة متناهية 100%',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.calibrationDirective).toContain('التعديل الانتقائي الجراحي الدقيق');
    });

    // 3. Super-Resolution 4K/2K Enhancement with Attached Image
    await harness.it('should route image upscaling and quality enhancement to NEURAL_IMAGE_STUDIO_AND_PROCESSING', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'حسن جودة الصورة دي واعملها دقة 4K فائقة الوضوح مع تنقية التفاصيل',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.calibrationDirective).toContain('4K');
    });

    // 4. Compositing Two People Together with Attached Image
    await harness.it('should route compositing two people together to NEURAL_IMAGE_STUDIO_AND_PROCESSING', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'ادمج الصورتين دول واضف الشخصين مع بعض في صورة واحدة بنفس الإضاءة',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.calibrationDirective).toContain('دمج الشخصين بنفس الإضاءة والملامح');
    });

    // 5. Product Mockup & Text Editing with Attached Image
    await harness.it('should route product mockup text replacement to NEURAL_IMAGE_STUDIO_AND_PROCESSING', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'غير النص اللي في صورة المنتج واكتب Matany AI مع الحفاظ على نفس الخط والألوان',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.calibrationDirective).toContain('استبدال النص مع مطابقة نوع الخط');
    });

    // 6. Explicit SVG Request with Attached Image -> MUST be SVG_VECTOR_STUDIO_AND_DESIGN
    await harness.it('should route explicit vectorization request to SVG_VECTOR_STUDIO_AND_DESIGN', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'حول الصورة المرفقة إلى فيكتور svg شعاعي احترافي',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: true,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
      expect(result.calibrationDirective).toContain('Image-to-SVG High-Fidelity Reconstruction');
    });

    // 7. Photorealistic Generation Prompt (Without Attached Image)
    await harness.it('should route photorealistic image generation to NEURAL_IMAGE_STUDIO_AND_PROCESSING', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'ولد لي صورة فوتوغرافية واقعية لرجل عجوز بدقة 4K مع إضاءة سينمائية مذهلة',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
        hasMultimodalImages: false,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
    });

    // 8. Cyber Ultra Model Exclusivity Check
    await harness.it('should strictly enforce Cyber Ultra exclusivity for neural photo manipulation', () => {
      expect(DynamicParameterTuner.isCyberUltraModel('deepseek-v4-pro-cyber-2.6')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('fathom-cyber-2.6')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('fathom-quant-3')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('deepseek-v4-pro-cyber-2.1')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('deepseek-v4-flash')).toBe(false);
      expect(DynamicParameterTuner.isCyberUltraModel('meta/muse-spark-1.2-contributor')).toBe(false);

      // Non-Ultra model gets sovereign notification guiding them to Cyber Ultra, NOT SVG conversion
      const nonUltraRequest: DynamicTuningRequest = {
        userPrompt: 'غير لون القميص في الصورة المرفقة إلى أزرق',
        requestedModel: 'deepseek-v4-flash',
        hasMultimodalImages: true,
      };

      const nonUltraResult = DynamicParameterTuner.tune(nonUltraRequest);
      expect(nonUltraResult.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(nonUltraResult.calibrationDirective).toContain('Fathom Cyber Ultra 2.6');
      expect(nonUltraResult.calibrationDirective).toContain('دون تحويل الصورة إلى SVG');
    });

    // 9. Feature Registry routeFeatureIntent for neural_image_studio
    await harness.it('should route neural_image_studio with high confidence in feature registry', () => {
      const plan = routeFeatureIntent('neural_image_studio', 'غير لون الشيء في الصورة دي وحسن جودتها بدقة 4K', '', '');
      expect(plan.confidence).toBeGreaterThanOrEqual(0.95);
      expect(plan.category).toBe('actionable');
      expect(plan.shouldRenderWidget).toBe(true);
    });

    // 10. Multi-Intent Arbiter Pipeline Order for neural_image_studio
    await harness.it('should include neural_image_studio in active features and execution pipeline order', () => {
      const multi = detectIntentsMulti('عدل الصورة المرفقة وازل الخلفية بدقة 4K فائقة');
      const hasNeural = multi.activeFeatures.some(f => f.id === 'neural_image_studio');
      expect(hasNeural).toBe(true);
      expect(multi.executionPipelineOrder).toContain('neural_image_studio');
    });

    // 11. Separation from SVG Studio: Photo edits MUST NOT trigger svg_studio in Feature Registry
    await harness.it('should NOT trigger svg_studio when a pure photo edit or upscaling is requested', () => {
      const planSvg = routeFeatureIntent('svg_studio', 'غير لون القميص في الصورة دي ونقي البشرة', '', '');
      expect(planSvg.confidence).toBeLessThan(0.5);
    });

    // 12. Deliverable Block JSON Schema Validation
    await harness.it('should correctly parse standard neural-image deliverable JSON block', () => {
      const sampleDeliverable = {
        operation: 'recolor',
        title: 'تغيير لون القميص إلى كحلي داكن',
        description: 'تم تغيير لون القميص مع الحفاظ على كافة تفاصيل النسيج والظلال بنسبة 100%',
        prompt: 'a man in dark navy blue cotton shirt, preserving exact facial features, skin texture, studio lighting, ultra-high resolution 4k',
        fidelityScore: '100%',
        resolution: '4K'
      };

      const blockText = `\`\`\`neural-image\n${JSON.stringify(sampleDeliverable, null, 2)}\n\`\`\``;
      const match = /```(?:neural-image|neural_image)?\s*(\{[\s\S]*?\})\s*```/i.exec(blockText);
      expect(match).toBeTruthy();
      if (match) {
        const parsed = JSON.parse(match[1]);
        expect(parsed.operation).toBe('recolor');
        expect(parsed.fidelityScore).toBe('100%');
        expect(parsed.resolution).toBe('4K');
      }
    });

    // 13. General "صمم صورة" command MUST route to Neural Image Studio and NEVER to SVG
    await harness.it('should route "صمم صورة" to NEURAL_IMAGE_STUDIO_AND_PROCESSING and NOT to SVG', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'صمم صورة لسيارة رياضية فارهة تسير في شوارع طوكيو ليلاً',
        requestedModel: 'fathom-quant-3',
        hasMultimodalImages: false,
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.calibrationDirective).toContain('FLUX.1 [schnell]');

      // Check Feature Registry
      const planSvg = routeFeatureIntent('svg_studio', 'صمم صورة لسيارة رياضية فارهة', '', '');
      expect(planSvg.confidence).toBe(0.0);

      const planNeural = routeFeatureIntent('neural_image_studio', 'صمم صورة لسيارة رياضية فارهة', '', '');
      expect(planNeural.confidence).toBeGreaterThanOrEqual(0.95);
    });

    // 14. Strict Context Perception: Informational/coding queries mentioning "صورة" MUST NOT trigger Neural Image Studio (0% error rate)
    await harness.it('should strictly suppress Neural Image Studio for informational and coding queries mentioning image concepts', () => {
      const nonImagePrompts = [
        'كيف اعرض صورة في ريأكت؟',
        'ما هي مكونات الصورة الرقمية ومصفوفة البكسل؟',
        'اشرح لي تاريخ التصوير والصورة الفوتوغرافية',
        'اكتب كود بايثون لقراءة ملف صورة واستخراج حجمها',
        'ما مفهوم الصورة النمطية في علم الاجتماع؟'
      ];

      for (const prompt of nonImagePrompts) {
        const plan = routeFeatureIntent('neural_image_studio', prompt, '', '', {});
        expect(plan.confidence).toBe(0.0);
        expect(plan.shouldRenderWidget).toBe(false);

        const tuning = DynamicParameterTuner.tune({ userPrompt: prompt, requestedModel: 'fathom-quant-3' });
        expect(tuning.detectedIntent).not.toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      }
    });

    // 15. Verify NeuralImageCard has clean Glassmorphism styling with zero clutter and zero loud neon
    await harness.it('should verify NeuralImageCard has clean Glassmorphism styling without loud colors or duplicate badges', async () => {
      const fs = await import('fs');
      const cardSource = fs.readFileSync('c:/Best Projects/Matany/src/components/ui/NeuralImageCard.tsx', 'utf-8');

      // Zero loud cyan/sky/blue gradient buttons
      expect(cardSource).not.toContain('from-cyan-600/90');
      expect(cardSource).not.toContain('via-sky-600/90');

      // Pure Glassmorphism styling on primary button
      expect(cardSource).toContain('bg-white/[0.08]');
      expect(cardSource).toContain('hover:bg-white/[0.14]');

      // No duplicate IMAGE STUDIO badge or aspect ratio pills
      expect(cardSource).not.toContain("selectedRatio === r");
      expect(cardSource).not.toContain("تنويع بصري");
    });

    // 16. Autonomous Deep Context Understanding for brief/2-word requests ("صورة سيارة", "صورة فضاء", "صمم سيارة")
    await harness.it('should detect concise two-word requests and provide Autonomous Master Scene Planning directive', () => {
      const briefPrompts = ['صورة سيارة', 'صورة فضاء', 'صمم سيارة', 'صورة بحر', 'صورة قطة'];

      for (const prompt of briefPrompts) {
        const tuning = DynamicParameterTuner.tune({ userPrompt: prompt, requestedModel: 'fathom-quant-3' });
        expect(tuning.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
        expect(tuning.calibrationDirective).toContain('Autonomous 2-Word Prompt Elaboration & Master Scene Planning Architecture');
        expect(tuning.calibrationDirective).toContain('FLUX.1 [schnell]');

        const featurePlan = routeFeatureIntent('neural_image_studio', prompt, '', '');
        expect(featurePlan.confidence).toBeGreaterThanOrEqual(0.95);
        expect(featurePlan.shouldRenderWidget).toBe(true);
      }
    });

    // 17. Uncompressed Aspect Ratio Viewports in NeuralImageCard and SvgStudioCard
    await harness.it('should verify uncompressed viewports and strict aspect ratios in NeuralImageCard and SvgStudioCard', async () => {
      const fs = await import('fs');
      const neuralCard = fs.readFileSync('c:/Best Projects/Matany/src/components/ui/NeuralImageCard.tsx', 'utf-8');
      const svgCard = fs.readFileSync('c:/Best Projects/Matany/src/components/ui/SvgStudioCard.tsx', 'utf-8');

      // Neither card should have the old rigid cramped h-[250px]
      expect(neuralCard).not.toContain('h-[250px]');
      expect(svgCard).not.toContain('h-[250px]');

      // Both cards have generous minimum heights
      expect(neuralCard).toContain('min-h-[320px]');
      expect(svgCard).toContain('min-h-[320px]');

      // High quality rendering styles
      expect(neuralCard).toContain('imageRendering: \'-webkit-optimize-contrast\'');
      expect(neuralCard).toContain('aspectRatio: `${currentDimensions.width} / ${currentDimensions.height}`');

      // SVG card maintains strict aspect ratio
      expect(svgCard).toContain('aspectRatio: `${metrics.width} / ${metrics.height}`');
    });

    // 18. Photorealistic FLUX Realism engine and dynamic ratio framing
    await harness.it('should verify flux-realism engine and dynamic card bounding in NeuralImageCard and ChatMessage', async () => {
      const fs = await import('fs');
      const neuralCard = fs.readFileSync('c:/Best Projects/Matany/src/components/ui/NeuralImageCard.tsx', 'utf-8');
      const chatMessage = fs.readFileSync('c:/Best Projects/Matany/src/components/ChatMessage.tsx', 'utf-8');

      // NeuralImageCard defaults to flux-realism and handles fallback to flux
      expect(neuralCard).toContain("return 'flux-realism'");
      expect(neuralCard).toContain("setModelName('flux')");
      expect(neuralCard).toContain('cardMaxWidthClass');

      // ChatMessage provisions flux-realism for realistic styles
      expect(chatMessage).toContain('flux-realism');
    });

    // 19. Distortion-Free 1024x1024 Pollinations generation, HD tier naming, and removal of "جاهز للتنزيل المباشر"
    await harness.it('should verify HD tier label, removal of direct download text, and 1024x1024 square generation to eliminate distortion', async () => {
      const fs = await import('fs');
      const neuralCard = fs.readFileSync('c:/Best Projects/Matany/src/components/ui/NeuralImageCard.tsx', 'utf-8');
      const chatMessage = fs.readFileSync('c:/Best Projects/Matany/src/components/ChatMessage.tsx', 'utf-8');

      // "جاهز للتنزيل المباشر" must be completely removed
      expect(neuralCard).not.toContain('جاهز للتنزيل المباشر');

      // 1X must be replaced by HD
      expect(neuralCard).toContain("'HD'");
      expect(neuralCard).not.toContain("'1X'");

      // Proportional cropping in canvas downloader
      expect(neuralCard).toContain('imgAspect > targetAspect');
      expect(neuralCard).toContain('imgAspect < targetAspect');

      // Pollinations requests are locked to 1024x1024 square to prevent server-side stretching
      expect(chatMessage).toContain('width=1024&height=1024');
      expect(neuralCard).toContain("urlObj.searchParams.set('width', '1024')");
      expect(neuralCard).toContain("urlObj.searchParams.set('height', '1024')");
    });

  });
}


