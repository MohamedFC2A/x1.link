/**
 * Master Test Suite Orchestrator & Comprehensive Validation Runner
 * Matany AI (x1.link)
 */

import { TestHarness } from './testUtils';
import { runIntentClassifierTests } from './unit/intentClassifier.test';
import { runQueryProcessorTests } from './unit/queryProcessor.test';
import { runCacheManagerTests } from './unit/cacheManager.test';
import { runResultsAggregatorTests } from './unit/resultsAggregator.test';
import { runPromptAugmentationTests } from './unit/promptAugmentation.test';
import { runLinkResolverTests } from './unit/linkResolver.test';
import { runMediaDownloadTests } from './unit/mediaDownload.test';
import { runImageForensicsTests } from './unit/imageForensics.test';
import { runMemoryIntentTests } from './unit/memoryIntent.test';
import { runDeepContentExtractorTests } from './unit/deepContentExtractor.test';
import { runMultiSourceSearchIntegrationTests } from './integration/multiSourceSearch.test';
import { runSearchApiRouteIntegrationTests } from './integration/searchApiRoute.test';
import { runChatSearchPipelineIntegrationTests } from './integration/chatSearchPipeline.test';
import { runAutonomousDecisionE2ETests } from './e2e/autonomousDecisionE2E.test';
import { runMemoryBenchmarkTests } from './performance/memoryBenchmark.test';
import { runComparativeBenchmark } from './benchmark/runBenchmark';

async function runMasterTestSuite() {
  const harness = new TestHarness();
  const suiteStartTime = performance.now();

  console.log('\n\x1b[1m\x1b[35m╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║   🧪 x1.link MASTER COMPREHENSIVE AUTOMATED TESTING SUITE          ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚════════════════════════════════════════════════════════════════════╝\x1b[0m');

  // 1. Unit Tests
  console.log('\n\x1b[1m\x1b[34m[STAGE 1/5]: Executing Unit Tests Battery...\x1b[0m');
  await runIntentClassifierTests(harness);
  await runQueryProcessorTests(harness);
  await runCacheManagerTests(harness);
  await runResultsAggregatorTests(harness);
  await runPromptAugmentationTests(harness);
  await runLinkResolverTests(harness);
  await runMediaDownloadTests(harness);
  await runImageForensicsTests(harness);
  await runMemoryIntentTests(harness);
  await runDeepContentExtractorTests(harness);

  // 2. Integration Tests
  console.log('\n\x1b[1m\x1b[36m[STAGE 2/5]: Executing Live Integration Tests Battery...\x1b[0m');
  await runMultiSourceSearchIntegrationTests(harness);
  await runSearchApiRouteIntegrationTests(harness);
  await runChatSearchPipelineIntegrationTests(harness);

  // 3. E2E Tests
  console.log('\n\x1b[1m\x1b[32m[STAGE 3/5]: Executing Full-Cycle E2E Tests Battery...\x1b[0m');
  await runAutonomousDecisionE2ETests(harness);

  // 4. Performance & Memory Tests
  console.log('\n\x1b[1m\x1b[33m[STAGE 4/5]: Executing Memory & Performance Benchmark...\x1b[0m');
  await runMemoryBenchmarkTests(harness);

  // 5. Artificial Analysis Core Benchmark Matrix
  console.log('\n\x1b[1m\x1b[35m[STAGE 5/5]: Executing Model Benchmark Comparison Matrix...\x1b[0m');
  await runComparativeBenchmark();

  const totalTime = (performance.now() - suiteStartTime).toFixed(2);
  const passed = harness.printSummary(`MASTER TESTING SUITE SUMMARY (Total Elapsed: ${totalTime}ms)`);

  if (!passed) {
    console.error('\x1b[1m\x1b[31m❌ MASTER TEST SUITE FAILED: Some tests did not pass.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[1m\x1b[32m✨ ALL TEST BATTERIES PASSED PERFECTLY (100% SUCCESS).\x1b[0m\n');
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal Master Test Runner Error:', err);
  process.exit(1);
});
