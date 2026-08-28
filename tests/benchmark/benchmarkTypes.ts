/**
 * Benchmark Types & Model Comparison Specifications
 * Matches Artificial Analysis Intelligence Index & Core LLM Benchmarks
 */

export interface ModelBenchmarkData {
  modelId: string;
  name: string;
  provider: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  intelligenceIndex: number;
  frontierCodeScore: number | null; // Production code quality (score %)
  deepSWEScore: number; // Long-horizon software engineering (%)
  codeArenaElo: number; // Web development (Elo)
  terminalBench21: number; // Agentic terminal coding (%)
  terminalBench30: number | null; // General agent capabilities (%)
  automationBench: number | null; // Enterprise workflow automation (%)
  gdpValAAElo: number; // Knowledge work (Elo)
  isOurEngine?: boolean;
}

export type BenchmarkCategory =
  | 'INTELLIGENCE_INDEX'
  | 'FRONTIER_CODE'
  | 'DEEP_SWE'
  | 'CODE_ARENA'
  | 'TERMINAL_BENCH_21'
  | 'TERMINAL_BENCH_30'
  | 'AUTOMATION_BENCH'
  | 'GDP_VAL_AA';

export interface BenchmarkTestCase {
  id: string;
  category: BenchmarkCategory;
  categoryName: string;
  title: string;
  weight: number;
  prompt: string;
  goldenSolution?: string;
  evaluator: (output: string, reasoning?: string) => {
    passed: boolean;
    score: number; // 0 to 100
    metrics: Record<string, any>;
    feedback: string;
  };
}

export interface BenchmarkExecutionResult {
  category: BenchmarkCategory;
  categoryName: string;
  testsCount: number;
  testsPassed: number;
  averageScore: number;
  scaledMetric: number;
  metricType: 'score' | 'percentage' | 'elo';
  unit: string;
  latencyAvgMs: number;
}

/**
 * Ground Truth Reference Data matching user's reference table
 */
export const REFERENCE_MODELS: Record<string, ModelBenchmarkData> = {
  'gemini-3.7-flash': {
    modelId: 'google/gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'Google',
    inputPricePerMillion: 0.75,
    outputPricePerMillion: 3.75,
    intelligenceIndex: 56,
    frontierCodeScore: 43.6,
    deepSWEScore: 65.3,
    codeArenaElo: 1588,
    terminalBench21: 85.8,
    terminalBench30: 14.9,
    automationBench: 30.4,
    gdpValAAElo: 1525,
  },
  'gemini-3.6-flash': {
    modelId: 'google/gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'Google',
    inputPricePerMillion: 0.75,
    outputPricePerMillion: 3.75,
    intelligenceIndex: 52,
    frontierCodeScore: 34.4,
    deepSWEScore: 48.6,
    codeArenaElo: 1538,
    terminalBench21: 78.0,
    terminalBench30: 5.4,
    automationBench: 17.0,
    gdpValAAElo: 1422,
  },
  'claude-sonnet-5': {
    modelId: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 10.00,
    intelligenceIndex: 55,
    frontierCodeScore: 42.7,
    deepSWEScore: 53.8,
    codeArenaElo: 1541,
    terminalBench21: 80.4,
    terminalBench30: 14.6,
    automationBench: 10.7,
    gdpValAAElo: 1598,
  },
  'gpt-5.6-terra': {
    modelId: 'openai/gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    provider: 'OpenAI',
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    intelligenceIndex: 57,
    frontierCodeScore: 41.3,
    deepSWEScore: 69.6,
    codeArenaElo: 1523,
    terminalBench21: 87.4,
    terminalBench30: 20.8,
    automationBench: 23.6,
    gdpValAAElo: 1578,
  },
  'muse-spark-1.2': {
    modelId: 'meta/muse-spark-1.2',
    name: 'Muse Spark 1.2',
    provider: 'Meta',
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 4.25,
    intelligenceIndex: 57,
    frontierCodeScore: null, // Dash in image
    deepSWEScore: 54.9,
    codeArenaElo: 1535,
    terminalBench21: 82.9,
    terminalBench30: null, // Dash in image
    automationBench: null, // Dash in image
    gdpValAAElo: 1628,
  },
  'fathom-cyber-2.0': {
    modelId: 'deepseek-v3-cyber-2.0',
    name: 'Fathom Cyber 2.0',
    provider: 'MatanyLabs (DeepSeek V4 Flash Engine)',
    inputPricePerMillion: 0.27,
    outputPricePerMillion: 1.10,
    intelligenceIndex: 50,
    frontierCodeScore: 35.8,
    deepSWEScore: 52.4,
    codeArenaElo: 1530,
    terminalBench21: 82.4,
    terminalBench30: 12.1,
    automationBench: null,
    gdpValAAElo: 1485,
    isOurEngine: true,
  },
  'fathom-cyber-2.6': {
    modelId: 'deepseek-v4-pro-cyber-2.6',
    name: 'Fathom Cyber 2.6',
    provider: 'MatanyLabs (DeepSeek V4 Pro Engine)',
    inputPricePerMillion: 0.55,
    outputPricePerMillion: 2.19,
    intelligenceIndex: 53,
    frontierCodeScore: 39.5,
    deepSWEScore: 62.7,
    codeArenaElo: 1552,
    terminalBench21: 87.9,
    terminalBench30: 18.5,
    automationBench: null, // Listed as No Data Available on snapshot
    gdpValAAElo: 1560,
    isOurEngine: true,
  },
};

/**
 * Computes the Composite Intelligence Index based on standard weighting:
 * Intelligence Index = 0.25 * FrontierCode + 0.25 * DeepSWE + 0.15 * CodeArena_scaled + 
 *                      0.10 * TerminalBench21 + 0.05 * TerminalBench30 + 0.10 * AutomationBench + 0.10 * GDPVal_scaled
 */
export function calculateIntelligenceIndex(metrics: {
  frontierCode: number;
  deepSWE: number;
  codeArenaElo: number;
  terminalBench21: number;
  terminalBench30: number;
  automationBench: number;
  gdpValAAElo: number;
}): number {
  const normCodeArena = Math.max(0, Math.min(100, (metrics.codeArenaElo - 1300) / 4.0));
  const normGDPVal = Math.max(0, Math.min(100, (metrics.gdpValAAElo - 1300) / 4.0));

  const composite = (
    (metrics.frontierCode * 0.25) +
    (metrics.deepSWE * 0.25) +
    (normCodeArena * 0.15) +
    (metrics.terminalBench21 * 0.10) +
    (metrics.terminalBench30 * 0.05) +
    (metrics.automationBench * 0.10) +
    (normGDPVal * 0.10)
  );

  return Number((composite * 0.85).toFixed(1));
}
