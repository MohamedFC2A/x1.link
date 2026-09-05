/**
 * Automated Verification Suite for Fathom Cyber 2.6 Reasoning Pipeline & deepseek-v4-pro Optimization
 */

import { TestHarness, expect } from '../testUtils';
import {
  DAGReasoningStateMachine,
  DeterministicCycleDetector,
  EarlyStoppingGovernor,
  DynamicScratchpadCompressor,
  FathomCyberReasoningEngine
} from '../../src/services/fathomCyberEngine';

export async function runFathomCyberEngineTests(harness: TestHarness) {
  await harness.describe('Fathom Cyber 2.6: Monotonic Forward DAG State Machine', async () => {
    await harness.it('initializes in DISSECT stage and supports valid forward transitions', () => {
      const dag = new DAGReasoningStateMachine();
      expect(dag.getCurrentStage()).toBe('DISSECT');

      expect(dag.advanceStage('PRUNE')).toBe(true);
      expect(dag.getCurrentStage()).toBe('PRUNE');

      expect(dag.advanceStage('VERIFY')).toBe(true);
      expect(dag.getCurrentStage()).toBe('VERIFY');

      expect(dag.advanceStage('LOCK')).toBe(true);
      expect(dag.getCurrentStage()).toBe('LOCK');

      expect(dag.advanceStage('SYNTHESIZE')).toBe(true);
      expect(dag.getCurrentStage()).toBe('SYNTHESIZE');
    });

    await harness.it('strictly blocks retrograde state regressions (backtracking violation)', () => {
      const dag = new DAGReasoningStateMachine();
      dag.advanceStage('VERIFY');

      // Attempt regression to DISSECT
      expect(dag.advanceStage('DISSECT')).toBe(false);
      expect(dag.getCurrentStage()).toBe('VERIFY');

      // Attempt regression to PRUNE
      expect(dag.advanceStage('PRUNE')).toBe(false);
      expect(dag.getCurrentStage()).toBe('VERIFY');
    });

    await harness.it('locks premises permanently and rejects subsequent mutation attempts', () => {
      const dag = new DAGReasoningStateMachine();
      dag.addNode({
        id: 'c1',
        stage: 'DISSECT',
        label: 'Auth Protocol',
        symbolicExpr: 'Protocol == OAuth2_PKCE',
        dependencies: [],
        isLocked: false,
        confidence: 0.5
      });

      const frozen = dag.freezePremise('c1', 'OAuth2_PKCE_Verified');
      expect(frozen).toBe(true);
      expect(dag.getLockedPremises().has('c1')).toBe(true);

      // Attempt to modify locked premise
      const modificationAttempt = dag.addNode({
        id: 'c1',
        stage: 'PRUNE',
        label: 'Mutated Auth Protocol',
        symbolicExpr: 'Protocol == BasicAuth',
        dependencies: [],
        isLocked: false,
        confidence: 0.1
      });
      expect(modificationAttempt).toBe(false);
    });
  });

  await harness.describe('Fathom Cyber 2.6: Deterministic Cycle Detection & Anti-Recursion', async () => {
    await harness.it('passes non-repeating progressive reasoning streams cleanly', () => {
      const detector = new DeterministicCycleDetector();
      const res1 = detector.evaluateChunk('تفكيك معطيات الاستطلاع السيبراني وفحص المنافذ المفتوحة');
      const res2 = detector.evaluateChunk('عزل منافذ بروتوكول SSH ومطابقة بصمة التشفير');
      expect(res1.hasCycle).toBe(false);
      expect(res2.hasCycle).toBe(false);
      expect(res2.suggestedAction).toBe('CONTINUE');
    });

    await harness.it('detects repetitive semantic loops and triggers FORCE_BREAK interrupt', () => {
      const detector = new DeterministicCycleDetector();
      const loopPhrase = 'فلنعد مراجعة المعطيات ونتحقق من الفرضية الأولى مجددا لنفس النقطة';

      detector.evaluateChunk(loopPhrase);
      detector.evaluateChunk(loopPhrase);
      const res3 = detector.evaluateChunk(loopPhrase);

      expect(res3.hasCycle).toBe(true);
      expect(res3.loopCount).toBeGreaterThanOrEqual(2);
    });

    await harness.it('safely terminates repeat sequences inside an unclosed Markdown code fence (```)', () => {
      const detector = new DeterministicCycleDetector();
      const codeSnippet = '```typescript\nfunction optimize() {\n  return true;\n  return true;';
      const safeOutput = detector.safeTerminate(codeSnippet);

      expect(safeOutput).toContain('```typescript');
      expect(safeOutput.endsWith('```')).toBe(true);
      const audit = DeterministicCycleDetector.analyzeOpenDelimiters(safeOutput);
      expect(audit.hasOpenCodeFence).toBe(false);
    });

    await harness.it('safely terminates repeat sequences inside an unclosed LaTeX math block ($$)', () => {
      const detector = new DeterministicCycleDetector();
      const latexSnippet = '$$\\oint_C \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}} + \\Delta B';
      const safeOutput = detector.safeTerminate(latexSnippet);

      expect(safeOutput).toContain('$$\\oint_C');
      expect(safeOutput.endsWith('$$')).toBe(true);
      const audit = DeterministicCycleDetector.analyzeOpenDelimiters(safeOutput);
      expect(audit.hasOpenLatexBlock).toBe(false);
    });

    await harness.it('preserves already balanced LaTeX ($$) and Markdown (```) fences without redundant duplication', () => {
      const balanced = '$$\\hbar\\omega$$\n```python\nprint("ok")\n```';
      const output = DeterministicCycleDetector.safeTerminate(balanced);

      expect(output).toBe(balanced);
      const audit = DeterministicCycleDetector.analyzeOpenDelimiters(output);
      expect(audit.hasOpenCodeFence).toBe(false);
      expect(audit.hasOpenLatexBlock).toBe(false);
    });
  });

  await harness.describe('Fathom Cyber 2.6: Early Stopping Governor & Convergence', async () => {
    await harness.it('terminates immediately when all target constraints are locked', () => {
      const governor = new EarlyStoppingGovernor();
      governor.reset(2);

      expect(governor.evaluate().shouldStop).toBe(false);

      governor.registerLockedConstraint(1.0);
      governor.registerLockedConstraint(1.0);

      const res = governor.evaluate();
      expect(res.shouldStop).toBe(true);
      expect(res.reason).toBe('ALL_CONSTRAINTS_LOCKED');
      expect(res.convergenceScore).toBe(1.0);
    });

    await harness.it('enforces hard reasoning token budget ceiling (250 tokens)', () => {
      const governor = new EarlyStoppingGovernor(250);
      governor.reset(10, 250);
      governor.registerTokens(255);

      const res = governor.evaluate();
      expect(res.shouldStop).toBe(true);
      expect(res.reason).toBe('TOKEN_BUDGET_EXCEEDED');
    });
  });

  await harness.describe('Fathom Cyber 2.6: Dynamic Scratchpad Compressor', async () => {
    await harness.it('compresses natural language monologue into dense symbolic logic', () => {
      const verbose = 'التقاطع بين الشرطين يؤدي إلى استنتاج النتيجة وتم إثباته يقينا مع استبعاد التناقض وهو بديهية ثابتة. دعني أفكر في هذا.';
      const compressed = DynamicScratchpadCompressor.compress(verbose);

      expect(compressed).toContain('∩');
      expect(compressed).toContain('⟹');
      expect(compressed).toContain('⊢');
      expect(compressed).toContain('⊥');
      expect(compressed).toContain('⊤');
      expect(compressed.includes('دعني أفكر')).toBe(false);
    });

    await harness.it('generates high-density symbolic DAG initialization skeleton', () => {
      const skeleton = DynamicScratchpadCompressor.generateSymbolicDAGSkeleton(['Target == CVE-2026', 'Payload == RCE']);
      expect(skeleton).toContain('[DAG_INIT: 2 CONSTRAINTS]');
      expect(skeleton).toContain('DISSECT(C_1..2)');
      expect(skeleton).toContain('LOCK(⊤ Facts)');
    });
  });

  await harness.describe('Fathom Cyber 2.6: deepseek-v4-pro Native Gateway Configuration', async () => {
    await harness.it('enforces low-latency and anti-hallucination hyperparameter contract', () => {
      const config = FathomCyberReasoningEngine.getDeepSeekV4ProConfig(true);
      expect(config.model).toBe('deepseek-v4-pro');
      expect(config.temperature).toBe(0.3);
      expect(config.top_p).toBe(0.95);
      expect(config.frequency_penalty).toBe(0.35);
      expect(config.presence_penalty).toBe(0.25);
      expect(config.max_tokens).toBe(32768);
      expect(config.stop).toContain('</think>\n\n<think>');
    });

    await harness.it('processes streaming chunks and cuts runaway thinking loop upon convergence', () => {
      const engine = new FathomCyberReasoningEngine();
      engine.reset(1);

      const chunkRes = engine.processStreamingChunk('C1 ∩ C2 ⟹ ⊢ Target Locked [LOCKED: C1]');
      expect(chunkRes.shouldCutThinking).toBe(true);
      expect(chunkRes.reason).toBe('ALL_CONSTRAINTS_LOCKED');
    });

    await harness.it('dynamically tunes deepseek-v4-pro hyperparameters based on context prompt', () => {
      const mathConfig = FathomCyberReasoningEngine.getDeepSeekV4ProConfig(true, 'احسب تكامل المعادلة الرياضية');
      expect(mathConfig.temperature).toBe(0.15);
      expect(mathConfig.top_p).toBe(0.90);

      const cyberConfig = FathomCyberReasoningEngine.getDeepSeekV4ProConfig(true, 'فحص ثغرة dpop rce exploit');
      expect(cyberConfig.temperature).toBe(0.20);
      expect(cyberConfig.top_p).toBe(0.92);

      const creativeConfig = FathomCyberReasoningEngine.getDeepSeekV4ProConfig(true, 'اكتب قصيدة شعرية أدبية');
      expect(creativeConfig.temperature).toBe(0.82);
    });

    await harness.it('universally tunes foundation model hyperparameters across models via getTunedModelConfig', () => {
      const flashConfig = FathomCyberReasoningEngine.getTunedModelConfig('deepseek-v4-flash', 'اكتب كود دالة سريعة');
      expect(flashConfig.temperature).toBe(0.18);
      expect(flashConfig.max_tokens).toBe(16384);

      const reasonerConfig = FathomCyberReasoningEngine.getTunedModelConfig('deepseek-reasoner', 'برهان رياضي معقد');
      expect(reasonerConfig.temperature).toBeUndefined();
      expect(reasonerConfig.max_tokens).toBe(32768);
    });
  });
}

// Standalone execution runner
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('fathomCyberEngine.test');
if (isDirectRun) {
  const harness = new TestHarness();
  runFathomCyberEngineTests(harness).then(() => {
    const passed = harness.printSummary('FATHOM CYBER 2.6 ENGINE TEST SUMMARY');
    process.exit(passed ? 0 : 1);
  });
}
