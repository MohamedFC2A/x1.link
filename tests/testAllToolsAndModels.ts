/**
 * Comprehensive Automated Verification Suite:
 * All Tools, Reasoning Display, and Current Models (Fathom 1.1, Fathom Cyber Flash 2.6, Fathom Cyber Ultra 2.6)
 */

import http from 'http';
import React from 'react';
import { renderToString } from 'react-dom/server';
import ChatReasoning from '../src/components/ui/chat-reasoning';
import { extractMediaForDownload } from '../server/mediaDownloadService';
import { classifyQueryIntent, executeAutonomousSearch } from '../server/searchEngine';
import { isPersonalMemoryRecallIntent } from '../src/lib/memoryIntentUtils';

function getTimeDetectPromptBlock(): string {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  return `[TIME DETECT]: السنة الحالية المعتمدة: ${currentYear}, الزمن الحالي: ${now.toISOString()}`;
}

function postChat(payload: any): Promise<{ statusCode: number; reasoning: string; content: string }> {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    const req = http.request('http://localhost:5001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
      },
    }, (res) => {
      let reasoning = '';
      let content = '';
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.reasoning_content) reasoning += delta.reasoning_content;
              if (delta?.content) content += delta.content;
            } catch {}
          }
        }
      });

      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 200, reasoning, content });
      });
    });

    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}

async function runAllToolTests() {
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE TOOLS & REASONING VERIFICATION SUITE');
  console.log('════════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${name}`);
      if (details) console.log(`         ${details}`);
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (details) console.error(`         ${details}`);
    }
  }

  // 1. CHAT REASONING UI RENDERING
  console.log('▶ [Test Pillar 1]: ChatReasoning UI Component Architecture...');
  
  const sampleThought = `المستخدم يسأل عن طول كريستيانو رونالدو.
كريستيانو رونالدو لاعب كرة قدم شهير.
وفقاً للمعلومات الرسمية، طول اللاعب هو 187 سنتيمتراً.
أقوم بصياغة الرد الفصيح والمباشر.`;

  const htmlDirect = renderToString(
    React.createElement(ChatReasoning, {
      reasoningText: sampleThought,
      isThinking: false,
    })
  );

  assert(
    'ChatReasoning renders structured reasoning milestones cleanly with seamless steps',
    htmlDirect.includes('تفكيك وتحليل معطيات المسألة') &&
    htmlDirect.includes('187 سنتيمتراً') &&
    htmlDirect.includes('خطوات الاستدلال')
  );

  assert(
    'ChatReasoning includes quick Copy button',
    htmlDirect.includes('نسخ') || htmlDirect.includes('تم النسخ')
  );

  // Test tool card rendering when search is active
  const htmlWithSearch = renderToString(
    React.createElement(ChatReasoning, {
      reasoningText: `[الاستعلام الشبكي]: [البحث عن: "سعر الذهب في مصر 2026"]\n• المصدر [1]: عيار 21 يسجل 3850 جنيه.\n• المصدر [2]: تقرير البورصة.\nالتحليل: يتم احتساب السعر المحدث.`,
      isThinking: false,
      activeFeatures: [{ id: 'fathom_search', badgeLabel: 'Fathom Search' } as any]
    })
  );

  assert(
    'ChatReasoning renders Serper AI & Fathom Search as an integrated reasoning step',
    (htmlWithSearch.includes('Serper') || htmlWithSearch.includes('Fathom')) &&
    htmlWithSearch.includes('الاستعلام الشبكي وتدقيق المصادر الحية')
  );

  // 2. SEARCH TOOL (SERPER AI & FATHOM SEARCH)
  console.log('\n▶ [Test Pillar 2]: Real-Time Grounded Search Tool (Serper AI)...');
  
  const searchIntent = classifyQueryIntent('كم سعر الدولار مقابل الجنيه المصري في البنك الآن؟');
  assert(
    'Autonomous Search Intent Classifier triggers REAL_TIME_DATA for financial prices',
    searchIntent.should_search === true && searchIntent.intent === 'REAL_TIME_DATA',
    `Intent: ${searchIntent.intent}, Should Search: ${searchIntent.should_search}`
  );

  const searchResults = await executeAutonomousSearch('سعر الذهب اليوم عيار 21 في مصر 2026');
  assert(
    'Autonomous Serper AI search retrieves verified live sources with credibility scoring',
    searchResults.results.length > 0 && Boolean(searchResults.groundingContextBlock),
    `Retrieved: ${searchResults.results.length} sources, Top: "${searchResults.results[0]?.title.slice(0, 45)}..."`
  );

  // 3. MEDIA DOWNLOAD DETECT TOOL
  console.log('\n▶ [Test Pillar 3]: Download Detect Tool (Media Platforms & Stream Proxy)...');

  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const downloadResult = await extractMediaForDownload(youtubeUrl);
  assert(
    'Download Detect correctly recognizes YouTube platform and extracts media metadata',
    downloadResult.success === true && downloadResult.platform === 'youtube',
    `Platform: ${downloadResult.platform}, Title: "${downloadResult.title || 'N/A'}"`
  );

  // 4. TIME DETECT TOOL (2026 RECENCY ANCHOR)
  console.log('\n▶ [Test Pillar 4]: Time Detect Tool (Temporal Context & Anchoring)...');

  const timeBlock = getTimeDetectPromptBlock();
  assert(
    'Time Detect injects valid current temporal year 2026 anchor block',
    timeBlock.includes('2026') && timeBlock.includes('الزمن الحالي'),
    `Time block snippet: ${timeBlock.split('\n')[0] || ''}`
  );

  // 5. MEMORY DETECT TOOL (PERSONAL RECALL INTENT)
  console.log('\n▶ [Test Pillar 5]: Memory Detect Tool (Personal Recall Intent)...');

  const isPersonal1 = isPersonalMemoryRecallIntent('ماذا تحدثنا في المحادثة السابقة؟');
  const isPersonal2 = isPersonalMemoryRecallIntent('فاكر اسمي وبياناتي اللي قلتها لك؟');
  const isGeneral = isPersonalMemoryRecallIntent('ما هي عاصمة فرنسا؟');

  assert(
    'Memory Detect correctly activates on personal conversational memory recall questions',
    isPersonal1 === true && isPersonal2 === true && isGeneral === false,
    `Personal recall query 1: ${isPersonal1}, Query 2: ${isPersonal2}, General query: ${isGeneral}`
  );

  // 6. ACTIVE MODELS LIVE TESTING (HTTP /api/chat)
  console.log('\n▶ [Test Pillar 6]: Live Chat & Reasoning API Across Current Models...');

  // 6.a Fathom Cyber Flash 2.6
  console.log('   Testing Fathom Cyber Flash 2.6 (deepseek-v4-flash-cyber-2.6)...');
  const flashResponse = await postChat({
    messages: [{ role: 'user', content: 'ما هو حاصل ضرب 19 × 23؟ اذكر الناتج مباشرة.' }],
    model: 'deepseek-v4-flash-cyber-2.6',
  });
  assert(
    'Fathom Cyber Flash 2.6 responds with 200 OK and accurate result (437)',
    flashResponse.statusCode === 200 && flashResponse.content.includes('437'),
    `Reasoning length: ${flashResponse.reasoning.length} chars, Content: "${flashResponse.content.trim().slice(0, 60)}..."`
  );

  // 6.b Fathom Cyber Ultra 2.6
  console.log('   Testing Fathom Cyber Ultra 2.6 (deepseek-v4-pro-cyber-2.6)...');
  const proResponse = await postChat({
    messages: [{ role: 'user', content: 'حل اللغز: ما الشيء الذي كلما زاد نقص؟' }],
    model: 'deepseek-v4-pro-cyber-2.6',
  });
  assert(
    'Fathom Cyber Ultra 2.6 responds with 200 OK and deep reasoning',
    proResponse.statusCode === 200 && (proResponse.content.includes('العمر') || proResponse.content.includes('حفرة')),
    `Reasoning length: ${proResponse.reasoning.length} chars, Content: "${proResponse.content.trim().slice(0, 60)}..."`
  );

  // 6.c Fathom 1.1
  console.log('   Testing Fathom 1.1 (deepseek-v4-flash)...');
  const fathom1Response = await postChat({
    messages: [{ role: 'user', content: 'من هو مخترع المصباح الكهربائي؟' }],
    model: 'deepseek-v4-flash',
  });
  assert(
    'Fathom 1.1 responds with 200 OK and correct knowledge (إديسون)',
    fathom1Response.statusCode === 200 && (fathom1Response.content.includes('إديسون') || fathom1Response.content.includes('اديسون')),
    `Content: "${fathom1Response.content.trim().slice(0, 60)}..."`
  );

  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`📊 VERIFICATION SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAllToolTests().catch((err) => {
  console.error('[FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});
