/**
 * Integration Test Suite Orchestrator
 * Matany AI (x1.link)
 */

import { TestHarness } from '../testUtils';
import { runMultiSourceSearchIntegrationTests } from './multiSourceSearch.test';
import { runSearchApiRouteIntegrationTests } from './searchApiRoute.test';
import { runChatSearchPipelineIntegrationTests } from './chatSearchPipeline.test';

export async function runAllIntegrationTests(): Promise<boolean> {
  const harness = new TestHarness();

  console.log('\n\x1b[1m\x1b[35m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m🌐 RUNNING INTEGRATION TEST SUITE (x1.link)\x1b[0m');
  console.log('\x1b[1m\x1b[35m====================================================================\x1b[0m');

  await runMultiSourceSearchIntegrationTests(harness);
  await runSearchApiRouteIntegrationTests(harness);
  await runChatSearchPipelineIntegrationTests(harness);

  const passed = harness.printSummary('INTEGRATION TEST SUITE SUMMARY');
  return passed;
}

runAllIntegrationTests().then(passed => {
  if (!passed) process.exit(1);
});
