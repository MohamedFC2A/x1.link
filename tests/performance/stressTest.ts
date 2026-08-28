/**
 * Performance & High-Concurrency Stress Test
 * Matany AI (Matany)
 */

import { executeAutonomousSearch } from '../../server/searchEngine';

async function runPerformanceStressTest() {
  console.log('\n\x1b[1m\x1b[33m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[33m⚡ HIGH-CONCURRENCY STRESS & LATENCY BENCHMARK (Matany)\x1b[0m');
  console.log('\x1b[1m\x1b[33m====================================================================\x1b[0m\n');

  const testQueries = [
    'سعر الذهب اليوم في مصر 2026',
    'أحدث أخبار الذكاء الاصطناعي اليوم',
    'مواصفات وسعر هاتف iPhone 16 Pro',
    'مقارنة بين معالجات Intel و AMD',
    'توثيق مكتبة React Router 7',
    'أحدث دراسة فيزياء في مجلة Nature',
    'توقعات سوق العملات المشفرة لعام 2026',
    'من هو مخترع شبكة الويب العالمية؟',
    'سعر الدولار مقابل الجنيه المصري اليوم',
    'مواصفات لابتوب MacBook Pro M4'
  ];

  const concurrency = 20; // 20 concurrent requests
  const requests: Array<Promise<{ latency: number; success: boolean; fromCache: boolean }>> = [];

  console.log(`► Firing \x1b[1m${concurrency}\x1b[0m concurrent search pipeline queries across live & cache stores...`);
  const overallStart = performance.now();

  for (let i = 0; i < concurrency; i++) {
    const query = testQueries[i % testQueries.length];
    const task = (async () => {
      const start = performance.now();
      try {
        const res = await executeAutonomousSearch(query, { maxResults: 4 });
        const latency = performance.now() - start;
        return { latency, success: res.results.length > 0 || !res.intent.should_search, fromCache: res.fromCache };
      } catch {
        const latency = performance.now() - start;
        return { latency, success: false, fromCache: false };
      }
    })();
    requests.push(task);
  }

  const results = await Promise.all(requests);
  const totalDuration = performance.now() - overallStart;

  const latencies = results.map(r => r.latency).sort((a, b) => a - b);
  const successful = results.filter(r => r.success).length;
  const cacheHits = results.filter(r => r.fromCache).length;

  const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(2);
  const p90 = latencies[Math.floor(latencies.length * 0.90)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[latencies.length - 1].toFixed(2);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const throughput = ((concurrency / (totalDuration / 1000))).toFixed(1);

  console.log('\n' + '─'.repeat(68));
  console.log(`\x1b[1m\x1b[36m📊 BENCHMARK METRICS SUMMARY:\x1b[0m`);
  console.log('─'.repeat(68));
  console.log(`  Total Requests:       \x1b[1m${concurrency}\x1b[0m`);
  console.log(`  Successful Requests:  \x1b[32m${successful} / ${concurrency}\x1b[0m (${((successful / concurrency) * 100).toFixed(1)}%)`);
  console.log(`  Cache Hits:           \x1b[36m${cacheHits}\x1b[0m (${((cacheHits / concurrency) * 100).toFixed(1)}%)`);
  console.log(`  Total Wall Time:      \x1b[1m${totalDuration.toFixed(2)}ms\x1b[0m`);
  console.log(`  Throughput:           \x1b[1m\x1b[32m${throughput} req/sec\x1b[0m`);
  console.log(`  Average Latency:      \x1b[1m${avgLatency}ms\x1b[0m`);
  console.log(`  p50 Latency (Median): \x1b[90m${p50}ms\x1b[0m`);
  console.log(`  p90 Latency:          \x1b[90m${p90}ms\x1b[0m`);
  console.log(`  p95 Latency:          \x1b[90m${p95}ms\x1b[0m`);
  console.log(`  p99 Latency (Max):    \x1b[90m${p99}ms\x1b[0m`);
  console.log('─'.repeat(68) + '\n');

  if (successful < concurrency * 0.90) {
    console.error('❌ STRESS TEST FAILED: Success rate fell below 90%');
    process.exit(1);
  }
}

runPerformanceStressTest();
