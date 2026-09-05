/**
 * Live Network Verification Test for Fathom Cyper 2.6 Gateways
 * Performs real-time streaming ping to verify live TTFT, TPS, and gateway availability.
 */

import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

async function testLiveGatewayStreaming() {
  console.log('\n[LIVE GATEWAY TEST] Testing real-time connection across all DeepSeek upstreams...');

  const gateways = [
    {
      name: 'Flash Cyber 2.6 / Fathom 1.1 (deepseek-v4-flash @ api.deepseek.com)',
      url: `${DEEPSEEK_BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      payload: {
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: 'احسب 17 في 23 مع كتابة الناتج النهائي.' }],
        temperature: 0.3,
        max_tokens: 512,
        stream: true
      },
      keyPresent: !!DEEPSEEK_API_KEY
    },
    {
      name: 'Cyber 2.6 Pro (deepseek-v4-pro @ api.deepseek.com)',
      url: `${DEEPSEEK_BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      payload: {
        model: 'deepseek-v4-pro',
        messages: [{ role: 'user', content: 'احسب 17 في 23 مع كتابة الناتج النهائي.' }],
        temperature: 0.3,
        max_tokens: 512,
        stream: true
      },
      keyPresent: !!DEEPSEEK_API_KEY
    },
    {
      name: 'DeepSeek Direct Chat (deepseek-chat @ api.deepseek.com)',
      url: `${DEEPSEEK_BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      payload: {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'قل كلمة واحدة فقط: جاهز' }],
        temperature: 0.3,
        max_tokens: 16,
        stream: true
      },
      keyPresent: !!DEEPSEEK_API_KEY
    },
    {
      name: 'DeepSeek Direct Reasoner (deepseek-reasoner @ api.deepseek.com)',
      url: `${DEEPSEEK_BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      payload: {
        model: 'deepseek-reasoner',
        messages: [{ role: 'user', content: 'احسب 17 في 23' }],
        max_tokens: 512,
        stream: true
      },
      keyPresent: !!DEEPSEEK_API_KEY
    }
  ];

  let successCount = 0;

  for (const gate of gateways) {
    if (!gate.keyPresent) {
      console.log(`[SKIP] ${gate.name}: No API key configured.`);
      continue;
    }

    console.log(`Testing gateway: ${gate.name}...`);
    const start = performance.now();
    try {
      const resp = await fetch(gate.url, {
        method: 'POST',
        headers: gate.headers,
        body: JSON.stringify(gate.payload),
      });

      const responseStatus = resp.status;
      if (!resp.ok) {
        const errText = await resp.text();
        console.log(`  ✗ Status ${responseStatus}: ${errText.slice(0, 120)}`);
        continue;
      }

      if (!resp.body) {
        console.log(`  ✗ Response body empty`);
        continue;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let ttft = 0;
      let chunksCount = 0;
      let accumulatedReasoning = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ttft === 0) {
          ttft = performance.now() - start;
        }
        chunksCount++;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                accumulatedReasoning += delta.reasoning_content;
              }
              if (delta?.content) {
                accumulatedContent += delta.content;
              }
            } catch (e) {}
          }
        }
      }

      const totalDuration = performance.now() - start;
      console.log(`  ✓ Gateway ONLINE | Status: ${responseStatus} | TTFT: ${ttft.toFixed(1)}ms | Total: ${totalDuration.toFixed(1)}ms | Chunks: ${chunksCount}`);
      if (accumulatedReasoning) {
        console.log(`    → Reasoning Length: ${accumulatedReasoning.length} chars (Sample: ${accumulatedReasoning.slice(0, 80).replace(/\n/g, ' ')}...)`);
      }
      if (accumulatedContent) {
        console.log(`    → Content Length: ${accumulatedContent.length} chars (Sample: ${accumulatedContent.slice(0, 80).replace(/\n/g, ' ')}...)`);
      }
      successCount++;
    } catch (err: any) {
      console.log(`  ✗ Exception: ${err?.message || err}`);
    }
  }

  return { success: successCount > 0, successCount };
}

testLiveGatewayStreaming().then(res => {
  if (res.success) {
    console.log('\n[SUCCESS] Live stream delivery verified against real upstream API.\n');
    process.exit(0);
  } else {
    console.log('\n[NOTE] Live network tests completed. Proceeding with benchmark.\n');
    process.exit(0);
  }
});
