/**
 * High-Performance Test Harness & Assertion Engine
 * Matany AI (x1.link)
 */

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error | string;
}

export class TestHarness {
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];

  public async describe(suiteName: string, fn: () => void | Promise<void>) {
    this.currentSuite = suiteName;
    console.log(`\n\x1b[1m\x1b[36m► ${suiteName}\x1b[0m`);
    await fn();
  }

  public async it(testName: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      const durationMs = Number((performance.now() - start).toFixed(2));
      this.results.push({
        suite: this.currentSuite,
        name: testName,
        passed: true,
        durationMs,
      });
      console.log(`  \x1b[32m✓\x1b[0m ${testName} \x1b[90m(${durationMs}ms)\x1b[0m`);
    } catch (err: any) {
      const durationMs = Number((performance.now() - start).toFixed(2));
      this.results.push({
        suite: this.currentSuite,
        name: testName,
        passed: false,
        durationMs,
        error: err,
      });
      console.log(`  \x1b[31m✗\x1b[0m ${testName} \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.error(`    \x1b[31mError: ${err?.message || err}\x1b[0m`);
    }
  }

  public getResults(): TestResult[] {
    return this.results;
  }

  public printSummary(title = 'TEST SUITE SUMMARY'): boolean {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((acc, r) => acc + r.durationMs, 0).toFixed(2);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    console.log('\n' + '═'.repeat(68));
    console.log(`\x1b[1m\x1b[35m📊 ${title}\x1b[0m`);
    console.log('═'.repeat(68));
    console.log(`  Total Tests:    \x1b[1m${total}\x1b[0m`);
    console.log(`  Passed:         \x1b[32m${passed}\x1b[0m`);
    console.log(`  Failed:         ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '\x1b[90m0\x1b[0m'}`);
    console.log(`  Pass Rate:      \x1b[1m${passRate}%\x1b[0m`);
    console.log(`  Total Time:     \x1b[90m${totalDuration}ms\x1b[0m`);
    console.log('═'.repeat(68) + '\n');

    return failed === 0;
  }
}

/**
 * Modern fluent assertions
 */
export function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new Error(`Expected deep equality:\nExpected: ${e}\nReceived: ${a}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(num: number) {
      if (typeof actual !== 'number' || actual <= num) {
        throw new Error(`Expected ${actual} to be greater than ${num}`);
      }
    },
    toBeLessThan(num: number) {
      if (typeof actual !== 'number' || actual >= num) {
        throw new Error(`Expected ${actual} to be less than ${num}`);
      }
    },
    toBeGreaterThanOrEqual(num: number) {
      if (typeof actual !== 'number' || actual < num) {
        throw new Error(`Expected ${actual} to be >= ${num}`);
      }
    },
    toContain(sub: any) {
      if (typeof actual === 'string') {
        if (!actual.includes(sub)) {
          throw new Error(`Expected string "${actual}" to contain "${sub}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(sub)) {
          throw new Error(`Expected array to contain ${JSON.stringify(sub)}`);
        }
      } else {
        throw new Error(`Cannot call toContain on type ${typeof actual}`);
      }
    },
    toHaveLength(len: number) {
      if (!actual || typeof (actual as any).length !== 'number' || (actual as any).length !== len) {
        throw new Error(`Expected length ${len}, but got ${(actual as any)?.length}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${JSON.stringify(actual)}`);
      }
    },
    toMatch(regex: RegExp) {
      if (typeof actual !== 'string' || !regex.test(actual)) {
        throw new Error(`Expected "${actual}" to match pattern ${regex}`);
      }
    },
    not: {
      toBe(expected: T) {
        if (actual === expected) {
          throw new Error(`Expected not ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toContain(sub: any) {
        if (typeof actual === 'string' && actual.includes(sub)) {
          throw new Error(`Expected string "${actual}" not to contain "${sub}"`);
        }
        if (Array.isArray(actual) && actual.includes(sub)) {
          throw new Error(`Expected array not to contain ${JSON.stringify(sub)}`);
        }
      }
    }
  };
}
