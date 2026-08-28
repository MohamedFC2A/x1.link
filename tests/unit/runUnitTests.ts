/**
 * Unit Test Suite Orchestrator
 * Matany AI (x1.link)
 */

import { TestHarness } from '../testUtils';
import { runIntentClassifierTests } from './intentClassifier.test';
import { runQueryProcessorTests } from './queryProcessor.test';
import { runCacheManagerTests } from './cacheManager.test';
import { runResultsAggregatorTests } from './resultsAggregator.test';
import { runPromptAugmentationTests } from './promptAugmentation.test';
import { runLinkResolverTests } from './linkResolver.test';
import { runMediaDownloadTests } from './mediaDownload.test';
import { runImageForensicsTests } from './imageForensics.test';
import { runMemoryIntentTests } from './memoryIntent.test';
import { runDeepContentExtractorTests } from './deepContentExtractor.test';
import { runFathomCyberEngineTests } from './fathomCyberEngine.test';

export async function runAllUnitTests(): Promise<boolean> {
  const harness = new TestHarness();

  console.log('\n\x1b[1m\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[34m🧪 RUNNING UNIT TEST SUITE (x1.link)\x1b[0m');
  console.log('\x1b[1m\x1b[34m====================================================================\x1b[0m');

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
  await runFathomCyberEngineTests(harness);

  const passed = harness.printSummary('UNIT TEST SUITE SUMMARY');
  return passed;
}

runAllUnitTests().then(passed => {
  if (!passed) process.exit(1);
});
