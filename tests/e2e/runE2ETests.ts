/**
 * E2E Test Suite Orchestrator
 * Matany AI (x1.link)
 */

import { TestHarness } from '../testUtils';
import { runAutonomousDecisionE2ETests } from './autonomousDecisionE2E.test';

export async function runAllE2ETests(): Promise<boolean> {
  const harness = new TestHarness();

  console.log('\n\x1b[1m\x1b[32m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m🚀 RUNNING END-TO-END (E2E) TEST SUITE (x1.link)\x1b[0m');
  console.log('\x1b[1m\x1b[32m====================================================================\x1b[0m');

  await runAutonomousDecisionE2ETests(harness);

  const passed = harness.printSummary('E2E TEST SUITE SUMMARY');
  return passed;
}

runAllE2ETests().then(passed => {
  if (!passed) process.exit(1);
});
