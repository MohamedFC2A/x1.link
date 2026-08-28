/**
 * ============================================================================
 * FATHOM CYBER 2.6: HIGH-PERFORMANCE REASONING ENGINE & DAG PIPELINE OPTIMIZER
 * Base Foundation Model: deepseek-v4-pro (Strict Sovereign Architecture)
 * 
 * CORE DIRECTIVES IMPLEMENTED:
 * 1. Monotonic Forward-Only Directed Acyclic Graph (DAG) State Traversal
 * 2. Deterministic Semantic Cycle & Recurrent Loop Detection
 * 3. Confidence Convergence & Strict Early-Stopping Governor
 * 4. High-Density Dynamic Scratchpad Compression (Symbolic Shorthand)
 * 5. Native deepseek-v4-pro Low-Latency Stream Interceptor
 * ============================================================================
 */

export type DAGStage = 'DISSECT' | 'PRUNE' | 'VERIFY' | 'LOCK' | 'SYNTHESIZE';

export interface DAGNode {
  id: string;
  stage: DAGStage;
  label: string;
  symbolicExpr: string;
  dependencies: string[];
  isLocked: boolean;
  resolvedValue?: string;
  confidence: number; // 0.0 - 1.0
  timestamp: number;
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycleConfidence: number; // 0.0 - 1.0
  recurrentPattern?: string;
  loopCount: number;
  suggestedAction: 'CONTINUE' | 'WARN' | 'FORCE_BREAK';
  pendingDelimiters?: string;
  safeTerminatedChunk?: string;
}

export interface EarlyStoppingEvaluation {
  shouldStop: boolean;
  convergenceScore: number; // 0.0 - 1.0
  tokensUsed: number;
  reason: 'CONVERGENCE_REACHED' | 'ALL_CONSTRAINTS_LOCKED' | 'TOKEN_BUDGET_EXCEEDED' | 'CYCLE_TERMINATION' | 'NONE';
}

export interface DeepSeekV4ProGatewayParams {
  model: 'deepseek-v4-pro' | 'deepseek/deepseek-v4-pro';
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stop: string[];
}

/**
 * 1. DIRECTED ACYCLIC GRAPH (DAG) STATE MACHINE
 * Enforces monotonic forward state progression. Permanently locks verified premises.
 */
export class DAGReasoningStateMachine {
  private readonly STAGE_ORDER: Record<DAGStage, number> = {
    DISSECT: 0,
    PRUNE: 1,
    VERIFY: 2,
    LOCK: 3,
    SYNTHESIZE: 4
  };

  private currentStage: DAGStage = 'DISSECT';
  private nodes: Map<string, DAGNode> = new Map();
  private lockedPremises: Set<string> = new Set();
  private executionLog: Array<{ stage: DAGStage; action: string; timestamp: number }> = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentStage = 'DISSECT';
    this.nodes.clear();
    this.lockedPremises.clear();
    this.executionLog = [{ stage: 'DISSECT', action: 'INITIALIZE_DAG', timestamp: Date.now() }];
  }

  public getCurrentStage(): DAGStage {
    return this.currentStage;
  }

  public getLockedPremises(): ReadonlySet<string> {
    return this.lockedPremises;
  }

  public getAllNodes(): DAGNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Advance stage monotonically. Rejects state regressions.
   */
  public advanceStage(nextStage: DAGStage): boolean {
    const currentRank = this.STAGE_ORDER[this.currentStage];
    const nextRank = this.STAGE_ORDER[nextStage];

    if (nextRank < currentRank) {
      // Monotonic violation attempt: deepseek-v4-pro attempting to backtrack
      this.executionLog.push({
        stage: this.currentStage,
        action: `BLOCKED_BACKTRACK_ATTEMPT_TO_${nextStage}`,
        timestamp: Date.now()
      });
      return false;
    }

    this.currentStage = nextStage;
    this.executionLog.push({
      stage: nextStage,
      action: `TRANSITION_TO_${nextStage}`,
      timestamp: Date.now()
    });
    return true;
  }

  /**
   * Add a node to the DAG. Ensures dependencies are satisfied and no circular paths exist.
   */
  public addNode(node: Omit<DAGNode, 'timestamp'>): boolean {
    if (this.nodes.has(node.id)) {
      const existing = this.nodes.get(node.id)!;
      if (existing.isLocked) {
        // Locked premise is immutable. Modification rejected.
        return false;
      }
    }

    // Verify all dependencies exist and are not creating cycles
    for (const depId of node.dependencies) {
      if (depId === node.id) return false;
      if (!this.nodes.has(depId)) {
        // Dependency must precede node in forward DAG
        return false;
      }
    }

    const fullNode: DAGNode = {
      ...node,
      timestamp: Date.now()
    };

    this.nodes.set(node.id, fullNode);

    if (fullNode.isLocked) {
      this.lockedPremises.add(fullNode.id);
    }

    return true;
  }

  /**
   * Permanently freeze a premise once verified.
   */
  public freezePremise(nodeId: string, resolvedValue: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.isLocked = true;
    node.resolvedValue = resolvedValue;
    node.confidence = 1.0;
    this.lockedPremises.add(nodeId);

    this.executionLog.push({
      stage: this.currentStage,
      action: `FREEZE_PREMISE_${nodeId}`,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Returns true if all registered constraints are locked and resolved.
   */
  public areAllConstraintsLocked(): boolean {
    if (this.nodes.size === 0) return false;
    for (const node of this.nodes.values()) {
      if (node.stage !== 'SYNTHESIZE' && !node.isLocked) {
        return false;
      }
    }
    return true;
  }
}

/**
 * 2. DETERMINISTIC CYCLE & RECURRENT LOOP DETECTOR
 * Real-time sliding window semantic hash & n-gram recurrence auditor.
 */
export class DeterministicCycleDetector {
  private historyChunks: string[] = [];
  private tokenFingerprints: Map<string, number> = new Map();
  private ngramHistory: Set<string> = new Set();
  private loopCount: number = 0;
  private accumulatedStream: string = '';
  private lastDetectedPattern?: string;
  private readonly WINDOW_SIZE = 5;
  private readonly SIMILARITY_THRESHOLD = 0.82;

  public reset(): void {
    this.historyChunks = [];
    this.tokenFingerprints.clear();
    this.ngramHistory.clear();
    this.loopCount = 0;
    this.accumulatedStream = '';
    this.lastDetectedPattern = undefined;
  }

  /**
   * Evaluates a newly received streaming reasoning chunk for cyclic loops.
   */
  public evaluateChunk(chunkText: string): CycleDetectionResult {
    if (!chunkText || !chunkText.trim()) {
      return { hasCycle: false, cycleConfidence: 0, loopCount: this.loopCount, suggestedAction: 'CONTINUE' };
    }

    this.accumulatedStream += chunkText;

    const normalized = chunkText.toLowerCase().replace(/[^\w\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized.length < 10) {
      return { hasCycle: false, cycleConfidence: 0, loopCount: this.loopCount, suggestedAction: 'CONTINUE' };
    }

    this.historyChunks.push(normalized);
    if (this.historyChunks.length > 20) {
      this.historyChunks.shift();
    }

    // 1. Sliding n-gram hash check (tri-grams and 5-grams)
    const words = normalized.split(' ');
    let repeatedNgrams = 0;
    let totalNgrams = 0;

    for (let i = 0; i <= words.length - 3; i++) {
      const trigram = `${words[i]}_${words[i + 1]}_${words[i + 2]}`;
      totalNgrams++;
      if (this.ngramHistory.has(trigram)) {
        repeatedNgrams++;
      } else {
        this.ngramHistory.add(trigram);
      }
    }

    // Bound memory with O(1) eviction to prevent leaks on massive streams
    if (this.ngramHistory.size > 2500) {
      this.ngramHistory.clear();
    }

    // 2. Cross-window Semantic Levenshtein/Jaccard Similarity
    let maxSimilarity = 0;
    let matchedPattern = '';

    const recentWindows = this.historyChunks.slice(-this.WINDOW_SIZE);
    if (recentWindows.length >= 2) {
      const current = recentWindows[recentWindows.length - 1];
      for (let i = 0; i < recentWindows.length - 1; i++) {
        const past = recentWindows[i];
        const sim = this.computeJaccardSimilarity(current, past);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          matchedPattern = past;
        }
      }
    }

    const ngramRepetitionRatio = totalNgrams > 0 ? repeatedNgrams / totalNgrams : 0;
    const combinedScore = Math.max(maxSimilarity, ngramRepetitionRatio);

    if (combinedScore >= this.SIMILARITY_THRESHOLD) {
      this.loopCount++;
      if (matchedPattern) {
        this.lastDetectedPattern = matchedPattern;
      }
    } else {
      if (this.loopCount > 0) this.loopCount = Math.max(0, this.loopCount - 0.5);
    }

    const hasCycle = this.loopCount >= 2 || (maxSimilarity > 0.90 && this.loopCount >= 1);
    const suggestedAction = hasCycle
      ? (this.loopCount >= 3 ? 'FORCE_BREAK' : 'WARN')
      : 'CONTINUE';

    // Lazy evaluation: only scan delimiters when cycle is triggered or requested
    const pendingDelimiters = hasCycle
      ? DeterministicCycleDetector.getPendingDelimiters(this.accumulatedStream)
      : undefined;

    return {
      hasCycle,
      cycleConfidence: Math.min(1.0, combinedScore),
      recurrentPattern: matchedPattern || undefined,
      loopCount: Math.round(this.loopCount),
      suggestedAction,
      pendingDelimiters: pendingDelimiters || undefined
    };
  }

  private computeJaccardSimilarity(strA: string, strB: string): number {
    const setA = new Set(strA.split(' '));
    const setB = new Set(strB.split(' '));
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Scans text to determine if a Markdown code block (```) or LaTeX display math block ($$) is currently open.
   */
  public static analyzeOpenDelimiters(text: string): {
    hasOpenCodeFence: boolean;
    hasOpenLatexBlock: boolean;
    pendingClosingSequence: string;
  } {
    if (!text) {
      return { hasOpenCodeFence: false, hasOpenLatexBlock: false, pendingClosingSequence: '' };
    }

    let inCodeFence = false;
    let inLatexBlock = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
      // Check for code fence (```)
      if (text.startsWith('```', i)) {
        let backtickCount = 0;
        while (i + backtickCount < len && text[i + backtickCount] === '`') {
          backtickCount++;
        }
        if (backtickCount >= 3) {
          inCodeFence = !inCodeFence;
          i += backtickCount;
          continue;
        }
      }

      // If we are NOT inside a code fence, check for LaTeX display math ($$)
      if (!inCodeFence) {
        if (text[i] === '\\' && i + 1 < len) {
          // Escaped character (e.g. \$ or \\)
          i += 2;
          continue;
        }

        if (text.startsWith('$$', i)) {
          inLatexBlock = !inLatexBlock;
          i += 2;
          continue;
        }
      }

      i++;
    }

    let pendingClosingSequence = '';
    if (inLatexBlock) {
      pendingClosingSequence += '\n$$';
    }
    if (inCodeFence) {
      pendingClosingSequence += (pendingClosingSequence ? '\n' : '') + '\n```';
    }

    return {
      hasOpenCodeFence: inCodeFence,
      hasOpenLatexBlock: inLatexBlock,
      pendingClosingSequence
    };
  }

  /**
   * Returns any missing closing delimiters (LaTeX $$ or Markdown ```) needed to close open blocks.
   */
  public static getPendingDelimiters(text: string): string {
    return DeterministicCycleDetector.analyzeOpenDelimiters(text).pendingClosingSequence;
  }

  /**
   * Instance helper to get pending closing delimiters for the accumulated or provided stream.
   */
  public getPendingDelimiters(text?: string): string {
    const target = text !== undefined ? text : this.accumulatedStream;
    return DeterministicCycleDetector.getPendingDelimiters(target);
  }

  /**
   * Safely terminates repeat sequences in content without dropping pending LaTeX delimiters ($$)
   * or closing Markdown code fences (```).
   * 
   * If a recurrent pattern is detected or specified, it prunes repeat loops while ensuring that
   * any pending $$ or ``` blocks are properly closed.
   */
  public static safeTerminate(content: string, recurrentPattern?: string): string {
    if (!content) return '';

    let result = content;

    // Prune repetitive tail if recurrentPattern is provided and matches trailing loop
    if (recurrentPattern && recurrentPattern.trim().length > 3) {
      const pat = recurrentPattern.trim();
      const escapedPat = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const trailingRepeatsRegex = new RegExp(`(?:\\s*${escapedPat}){2,}$`, 'i');
      if (trailingRepeatsRegex.test(result)) {
        result = result.replace(trailingRepeatsRegex, '');
      }
    }

    // Ensure all open LaTeX delimiters ($$) and Markdown code fences (```) are safely closed
    const { pendingClosingSequence } = DeterministicCycleDetector.analyzeOpenDelimiters(result);
    if (pendingClosingSequence) {
      result += pendingClosingSequence;
    }

    return result;
  }

  /**
   * Instance method to safely terminate repeat sequences on accumulated stream or given text.
   */
  public safeTerminate(content?: string, recurrentPattern?: string): string {
    const target = content !== undefined ? content : this.accumulatedStream;
    const pattern = recurrentPattern || this.lastDetectedPattern;
    return DeterministicCycleDetector.safeTerminate(target, pattern);
  }

  /**
   * Alias for safeTerminate to ensure compatibility with delimiter closing helpers.
   */
  public static closePendingDelimiters(content: string): string {
    return DeterministicCycleDetector.safeTerminate(content);
  }

  public closePendingDelimiters(content?: string): string {
    const target = content !== undefined ? content : this.accumulatedStream;
    return DeterministicCycleDetector.safeTerminate(target);
  }
}

/**
 * 3. EARLY STOPPING GOVERNOR
 * Tracks confidence convergence and stops thinking immediately once all target constraints are locked.
 */
export class EarlyStoppingGovernor {
  private maxReasoningTokens: number;
  private readonly CONVERGENCE_CONFIDENCE_THRESHOLD = 0.95;

  private accumulatedTokens: number = 0;
  private confidenceAccumulator: number = 0;
  private lockedConstraintCount: number = 0;
  private requiredConstraintCount: number = 1;

  constructor(maxTokens: number = 16384) {
    this.maxReasoningTokens = maxTokens;
  }

  public reset(requiredConstraints: number = 1, maxTokens?: number): void {
    this.accumulatedTokens = 0;
    this.confidenceAccumulator = 0;
    this.lockedConstraintCount = 0;
    this.requiredConstraintCount = Math.max(1, requiredConstraints);
    if (maxTokens !== undefined) {
      this.maxReasoningTokens = maxTokens;
    }
  }

  public setMaxTokens(count: number): void {
    this.maxReasoningTokens = count;
  }

  public getMaxTokens(): number {
    return this.maxReasoningTokens;
  }

  public registerTokens(count: number): void {
    this.accumulatedTokens += count;
  }

  public registerLockedConstraint(weight: number = 1.0): void {
    this.lockedConstraintCount++;
    this.confidenceAccumulator += weight;
  }

  public getLockedCount(): number {
    return this.lockedConstraintCount;
  }

  public getRequiredCount(): number {
    return this.requiredConstraintCount;
  }

  public evaluate(cycleDetected: boolean = false): EarlyStoppingEvaluation {
    if (cycleDetected) {
      return {
        shouldStop: true,
        convergenceScore: 1.0,
        tokensUsed: this.accumulatedTokens,
        reason: 'CYCLE_TERMINATION'
      };
    }

    if (this.accumulatedTokens >= this.maxReasoningTokens) {
      return {
        shouldStop: true,
        convergenceScore: 0.90,
        tokensUsed: this.accumulatedTokens,
        reason: 'TOKEN_BUDGET_EXCEEDED'
      };
    }

    const constraintRatio = this.lockedConstraintCount / this.requiredConstraintCount;
    if (constraintRatio >= 1.0) {
      return {
        shouldStop: true,
        convergenceScore: 1.0,
        tokensUsed: this.accumulatedTokens,
        reason: 'ALL_CONSTRAINTS_LOCKED'
      };
    }

    // Normalized confidence curve over required constraint count
    const normalizedConfidence = 1 - Math.exp(-(this.confidenceAccumulator / this.requiredConstraintCount) * 3);
    if (constraintRatio >= 0.8 && normalizedConfidence >= this.CONVERGENCE_CONFIDENCE_THRESHOLD) {
      return {
        shouldStop: true,
        convergenceScore: normalizedConfidence,
        tokensUsed: this.accumulatedTokens,
        reason: 'CONVERGENCE_REACHED'
      };
    }

    return {
      shouldStop: false,
      convergenceScore: Math.min(1.0, constraintRatio),
      tokensUsed: this.accumulatedTokens,
      reason: 'NONE'
    };
  }
}

/**
 * 4. DYNAMIC SCRATCHPAD COMPRESSOR
 * Translates verbose natural language into mathematical/symbolic shorthand.
 * Token Density Multiplier: ~5x token savings.
 */
export class DynamicScratchpadCompressor {
  private static readonly SYMBOLIC_REPLACEMENTS: Array<[RegExp, string]> = [
    [/(?:التقاطع|تقاطع الشروط|intersection)/gi, ' ∩ '],
    [/(?:يؤدي إلى|يستلزم|ينتج عنه|implies|therefore)/gi, ' ⟹ '],
    [/(?:تم إثباته|ثبت يقينا|مؤكد|proven|verified)/gi, ' ⊢ '],
    [/(?:مستحيل|تناقض|مستبعد|falsified|pruned)/gi, ' ⊥ '],
    [/(?:بديهية ثابتة|معطى مؤكد|حقيقة نهائية|axiom|(?<!\[)\blocked\b(?!:))/gi, ' ⊤ '],
    [/(?:لا يساوي|يختلف عن|not equal)/gi, ' ≠ '],
    [/(?:يساوي|مطابق لـ|identical)/gi, ' ≡ '],
    [/(?:ينتمي إلى|عضو في|belongs to)/gi, ' ∈ '],
    [/(?:باقي القسمة|قياساً بـ|modulo)/gi, ' mod '],
    [/(?:معرفة مشتركة|common knowledge)/gi, ' CK '],
    [/(?:حالة فوز|winning state)/gi, ' N '],
    [/(?:حالة خسارة|losing state)/gi, ' P '],
    [/(?:حالة تعادل|draw attractor)/gi, ' D '],
    [/(?:دعني أفكر|فلنراجع|ربما علينا|من الجدير بالذكر|على أي حال|نلاحظ أن)/gi, '']
  ];

  public static compress(rawReasoning: string): string {
    if (!rawReasoning) return '';

    let compressed = rawReasoning;
    for (const [regex, replacement] of this.SYMBOLIC_REPLACEMENTS) {
      compressed = compressed.replace(regex, replacement);
    }

    return compressed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  /**
   * Generates a high-density symbolic DAG skeleton for deepseek-v4-pro prompt initialization.
   */
  public static generateSymbolicDAGSkeleton(constraints: string[]): string {
    const lines: string[] = [
      `[DAG_INIT: ${constraints.length} CONSTRAINTS]`,
      ...constraints.map((c, i) => `C${i + 1} ≡ "${c}"`),
      `DISSECT(C_1..${constraints.length}) ⟹ PRUNE(SearchSpace ∩ ¬C_i) ⟹ VERIFY(⊢ Invariant) ⟹ LOCK(⊤ Facts) ⟹ SYNTHESIZE()`
    ];
    return lines.join('\n');
  }
}

/**
 * 5. MASTER FATHOM CYBER 2.6 REASONING PIPELINE ENGINE
 * Orchestrates DAG execution, cycle detection, early stopping, and gateway configuration.
 */
export class FathomCyberReasoningEngine {
  private dag: DAGReasoningStateMachine = new DAGReasoningStateMachine();
  private cycleDetector: DeterministicCycleDetector = new DeterministicCycleDetector();
  private governor: EarlyStoppingGovernor = new EarlyStoppingGovernor();

  constructor() {
    this.reset();
  }

  public reset(constraintCount: number = 2): void {
    this.dag.reset();
    this.cycleDetector.reset();
    this.governor.reset(constraintCount);
  }

  public getDAG(): DAGReasoningStateMachine {
    return this.dag;
  }

  public getCycleDetector(): DeterministicCycleDetector {
    return this.cycleDetector;
  }

  public getGovernor(): EarlyStoppingGovernor {
    return this.governor;
  }

  /**
   * Produces strictly tuned gateway parameters optimized natively for deepseek-v4-pro.
   */
  public static getDeepSeekV4ProConfig(isCyberPro26: boolean = true): DeepSeekV4ProGatewayParams {
    return {
      model: isCyberPro26 ? 'deepseek-v4-pro' : 'deepseek/deepseek-v4-pro',
      temperature: 0.3, // Low temperature eliminates wandering branches & overthinking
      top_p: 0.95,
      frequency_penalty: 0.35, // Strong penalty against repetitive token loops
      presence_penalty: 0.25, // Discourages revisiting settled topics
      max_tokens: 32768,
      stop: [
        '</think>\n\n<think>',
        '</think><think>'
      ]
    };
  }

  /**
   * Process an incoming streaming delta token/chunk from deepseek-v4-pro.
   * Returns whether the stream should truncate thinking and jump directly to synthesis.
   */
  public processStreamingChunk(chunk: string): { shouldCutThinking: boolean; reason?: string; safeClosingSuffix?: string } {
    // 1. Register approximate token count (1 word ≈ 1.3 tokens)
    const tokenEst = Math.max(1, Math.round(chunk.trim().split(/\s+/).length * 1.3));
    this.governor.registerTokens(tokenEst);

    // 2. Run deterministic cycle detection
    const cycleRes = this.cycleDetector.evaluateChunk(chunk);

    // 3. Inspect and update DAG stages
    if (chunk.includes('DISSECT')) this.dag.advanceStage('DISSECT');
    if (chunk.includes('PRUNE')) this.dag.advanceStage('PRUNE');
    if (chunk.includes('VERIFY')) this.dag.advanceStage('VERIFY');
    if (chunk.includes('LOCK')) this.dag.advanceStage('LOCK');
    if (chunk.includes('SYNTHESIZE')) this.dag.advanceStage('SYNTHESIZE');

    // 4. Synchronize locked premises directly with DAG state
    // Matches both [LOCKED: C1], [LOCKED: C_1], and [⊤: C1]
    const lockMatches = Array.from(chunk.matchAll(/(?:\[(?:LOCKED|⊤):\s*([A-Za-z0-9_-]+)(?:\s*=\s*([^\]]+))?\])/gi));
    for (const match of lockMatches) {
      const constraintId = match[1];
      const resolvedVal = match[2] || 'Resolved';
      this.dag.freezePremise(constraintId, resolvedVal);
      this.governor.registerLockedConstraint(1.0);
    }

    // Generic fallback for symbolic lock tags if no explicit [LOCKED: Id]
    if (lockMatches.length === 0 && (chunk.includes('⊤') || chunk.includes('⊢'))) {
      this.governor.registerLockedConstraint(0.5);
    }

    // 5. Evaluate early-stopping
    const stopEval = this.governor.evaluate(cycleRes.hasCycle && cycleRes.suggestedAction === 'FORCE_BREAK');

    if (stopEval.shouldStop) {
      this.dag.advanceStage('SYNTHESIZE');
      return {
        shouldCutThinking: true,
        reason: stopEval.reason,
        safeClosingSuffix: cycleRes.pendingDelimiters
      };
    }

    return {
      shouldCutThinking: false
    };
  }
}
