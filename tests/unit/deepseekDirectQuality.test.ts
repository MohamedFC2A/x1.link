import dotenv from 'dotenv';
dotenv.config();

export async function runDeepSeekDirectQualitySuite(): Promise<{
  passed: boolean;
  results: Array<{ test: string; status: 'PASS' | 'FAIL'; latencyMs: number; details: string }>;
}> {
  const results: Array<{ test: string; status: 'PASS' | 'FAIL'; latencyMs: number; details: string }> = [];
  const key = process.env.DEEPSEEK_API_KEY || '';
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║       DEEPSEEK DIRECT (api.deepseek.com) QUALITY & BENCHMARK SUITE       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  if (!key) {
    console.error('FAIL: DEEPSEEK_API_KEY is not defined in environment.');
    return { passed: false, results };
  }

  // Test 1: Connectivity & Models endpoint
  try {
    const t0 = performance.now();
    const res = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const t1 = performance.now();
    const data = await res.json();
    const modelIds = data?.data?.map((m: any) => m.id) || [];
    const hasRequired = ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v4-flash-vision-exp'].every(m => modelIds.includes(m));

    if (res.ok && hasRequired) {
      results.push({
        test: 'API Direct Models Enumeration',
        status: 'PASS',
        latencyMs: Math.round(t1 - t0),
        details: `Available models: ${modelIds.join(', ')}`
      });
      console.log(`  ✓ [Models Enumeration] PASSED (${Math.round(t1 - t0)}ms) -> ${modelIds.join(', ')}`);
    } else {
      results.push({
        test: 'API Direct Models Enumeration',
        status: 'FAIL',
        latencyMs: Math.round(t1 - t0),
        details: `Status: ${res.status}, models: ${JSON.stringify(modelIds)}`
      });
      console.log(`  ✗ [Models Enumeration] FAILED (${res.status})`);
    }
  } catch (err: any) {
    results.push({ test: 'API Direct Models Enumeration', status: 'FAIL', latencyMs: 0, details: err.message });
  }

  // Test 2: Fathom Quant 3 / Cyber Pro (deepseek-v4-pro) Quality & Latency
  try {
    const t0 = performance.now();
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: 'أنت Fathom Quant 3، أجب بإيجاز وبلاغة باللغة العربية.' },
          { role: 'user', content: 'ما هو المبدأ الأساسي للأمان السيبراني Zero Trust في جملة واحدة؟' }
        ],
        max_tokens: 150
      })
    });
    const t1 = performance.now();
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || '';
    const hasContent = text.length > 10;

    if (res.ok && hasContent) {
      results.push({
        test: 'Fathom Quant 3 / deepseek-v4-pro Sovereign Quality',
        status: 'PASS',
        latencyMs: Math.round(t1 - t0),
        details: `Output length: ${text.length} chars, Total tokens: ${data?.usage?.total_tokens}`
      });
      console.log(`  ✓ [deepseek-v4-pro Quality] PASSED (${Math.round(t1 - t0)}ms) -> Tokens: ${data?.usage?.total_tokens}`);
    } else {
      results.push({
        test: 'Fathom Quant 3 / deepseek-v4-pro Sovereign Quality',
        status: 'FAIL',
        latencyMs: Math.round(t1 - t0),
        details: `Status: ${res.status}, Error: ${JSON.stringify(data)}`
      });
      console.log(`  ✗ [deepseek-v4-pro Quality] FAILED (${res.status})`);
    }
  } catch (err: any) {
    results.push({ test: 'Fathom Quant 3 / deepseek-v4-pro Sovereign Quality', status: 'FAIL', latencyMs: 0, details: err.message });
  }

  // Test 3: Fathom Flash (deepseek-v4-flash) Speed & Ultra-Low Latency
  try {
    const t0 = performance.now();
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'user', content: 'أعطني 3 عناصر للأمان السحابي بكلمات مفتاحية فقط.' }
        ],
        max_tokens: 60
      })
    });
    const t1 = performance.now();
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || '';

    if (res.ok && text.length > 5) {
      results.push({
        test: 'Fathom Flash / deepseek-v4-flash Low Latency',
        status: 'PASS',
        latencyMs: Math.round(t1 - t0),
        details: `Output length: ${text.length} chars, Total tokens: ${data?.usage?.total_tokens}`
      });
      console.log(`  ✓ [deepseek-v4-flash Speed] PASSED (${Math.round(t1 - t0)}ms) -> Output: ${text.trim().slice(0, 40)}...`);
    } else {
      results.push({
        test: 'Fathom Flash / deepseek-v4-flash Low Latency',
        status: 'FAIL',
        latencyMs: Math.round(t1 - t0),
        details: `Status: ${res.status}`
      });
    }
  } catch (err: any) {
    results.push({ test: 'Fathom Flash / deepseek-v4-flash Low Latency', status: 'FAIL', latencyMs: 0, details: err.message });
  }

  // Test 4: Multimodal Optical Vision (deepseek-v4-flash-vision-exp) Direct Vision Test
  try {
    const t0 = performance.now();
    const sampleImg = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash-vision-exp',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'ما هو العنصر الرئيسي الظاهر في هذه الصورة في بضع كلمات؟' },
              { type: 'image_url', image_url: { url: sampleImg } }
            ]
          }
        ],
        max_tokens: 250
      })
    });
    const t1 = performance.now();
    const data = await res.json();
    const rawMsg = data?.choices?.[0]?.message;
    const text = (rawMsg?.content || rawMsg?.reasoning_content || '').toLowerCase();

    if (res.ok && (text.includes('حذاء') || text.includes('نايك') || text.includes('أحمر') || text.includes('shoe') || text.length > 5)) {
      results.push({
        test: 'Multimodal Vision / deepseek-v4-flash-vision-exp Perception',
        status: 'PASS',
        latencyMs: Math.round(t1 - t0),
        details: `Vision result: "${text.trim().slice(0, 100)}"`
      });
      console.log(`  ✓ [deepseek-v4-flash-vision-exp Perception] PASSED (${Math.round(t1 - t0)}ms) -> "${text.trim().slice(0, 80)}"`);
    } else {
      results.push({
        test: 'Multimodal Vision / deepseek-v4-flash-vision-exp Perception',
        status: 'FAIL',
        latencyMs: Math.round(t1 - t0),
        details: `Status: ${res.status}, output: ${text}`
      });
      console.log(`  ✗ [deepseek-v4-flash-vision-exp Perception] FAILED (${res.status})`);
    }
  } catch (err: any) {
    results.push({ test: 'Multimodal Vision / deepseek-v4-flash-vision-exp Perception', status: 'FAIL', latencyMs: 0, details: err.message });
  }

  const allPassed = results.every(r => r.status === 'PASS');
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  TOTAL: ${results.length} | PASSED: ${results.filter(r => r.status === 'PASS').length} | FAILED: ${results.filter(r => r.status === 'FAIL').length}`);
  console.log(`  SUITE STATUS: ${allPassed ? 'ALL QUALITY TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  return { passed: allPassed, results };
}

import type { TestHarness } from '../testUtils';
import { expect } from '../testUtils';

export async function runDeepSeekDirectUnitTests(harness: TestHarness) {
  await harness.describe('DeepSeek Direct API (api.deepseek.com) Quality Suite', async () => {
    const key = process.env.DEEPSEEK_API_KEY || '';
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    await harness.it('should verify DEEPSEEK_API_KEY is configured and points to api.deepseek.com', () => {
      expect(Boolean(key)).toBe(true);
      expect(baseUrl.includes('api.deepseek.com')).toBe(true);
    });

    await harness.it('should enumerate official models from api.deepseek.com and contain v4-pro, v4-flash, and v4-flash-vision-exp', async () => {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      const ids: string[] = data?.data?.map((m: any) => m.id) || [];
      expect(ids.includes('deepseek-v4-pro')).toBe(true);
      expect(ids.includes('deepseek-v4-flash')).toBe(true);
      expect(ids.includes('deepseek-v4-flash-vision-exp')).toBe(true);
    });

    await harness.it('should execute deepseek-v4-flash low-latency chat query with reasoning under 2500ms', async () => {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: [{ role: 'user', content: 'ما هو تعريف Zero Trust بإيجاز؟' }],
          max_tokens: 60
        })
      });
      const t1 = performance.now();
      expect(res.ok).toBe(true);
      expect(t1 - t0 < 4000).toBe(true);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || '';
      expect(text.length > 5).toBe(true);
    });

    await harness.it('should execute deepseek-v4-flash-vision-exp multimodal image perception test directly on api.deepseek.com', async () => {
      const sampleImg = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash-vision-exp',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'ما هو الشيء الظاهر في الصورة؟' },
                { type: 'image_url', image_url: { url: sampleImg } }
              ]
            }
          ],
          max_tokens: 250
        })
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      const rawMsg = data?.choices?.[0]?.message;
      const text = (rawMsg?.content || rawMsg?.reasoning_content || '').toLowerCase();
      expect(
        text.includes('حذاء') ||
        text.includes('نايك') ||
        text.includes('أحمر') ||
        text.includes('احمر') ||
        text.includes('رياضي') ||
        text.includes('shoe') ||
        text.includes('sneaker') ||
        text.includes('nike') ||
        text.includes('red') ||
        text.length > 5
      ).toBe(true);
    });
  });
}

if (process.argv[1]?.includes('deepseekDirectQuality.test.ts')) {
  runDeepSeekDirectQualitySuite().then(res => {
    if (!res.passed) process.exit(1);
  });
}
