/**
 * Search Intelligence System — Prompt Augmentation & Grounding Engine
 * Matany AI (x1.link)
 */

import { SearchResult, IntentClassificationResult } from './searchTypes';

/**
 * Converts numeric credibility score (0.0 - 1.0) into star rating indicators.
 */
function formatCredibilityStars(score?: number): string {
  const s = score ?? 0.85;
  if (s >= 0.95) return '⭐⭐⭐⭐⭐ (موثوقية فائقة ومصدر رسمي)';
  if (s >= 0.85) return '⭐⭐⭐⭐☆ (موثوقية عالية)';
  if (s >= 0.70) return '⭐⭐⭐☆☆ (مصدر عام موثق)';
  return '⭐⭐☆☆☆ (مصدر ثانوي)';
}

/**
 * Formats a list of search hits into a structured grounding context block for LLM prompt injection.
 */
export function buildSearchGroundingContextBlock(
  results: SearchResult[],
  intentResult: IntentClassificationResult,
  query: string
): string {
  if (!results || results.length === 0) {
    return '';
  }

  const currentYear = new Date().getUTCFullYear();
  const bar = '━'.repeat(55);

  const lines: string[] = [
    `🔍 [نتائج البحث الحي المباشر من الإنترنت وفحص الحداثة — ${currentYear} LIVE WEB INTELLIGENCE]`,
    `• الاستعلام الموجه: "${query}"`,
    `• تصنيف النية: ${intentResult.intent} (درجة الثقة: ${(intentResult.confidence * 100).toFixed(0)}%)`,
    `• توجيه الحداثة الزمنية: ${intentResult.temporalBias ? 'أولوية قصوى لبيانات وأخبار عام ' + currentYear : 'بحث سياقي شامل'}`,
    bar
  ];

  results.forEach((item, idx) => {
    lines.push(`المصدر رقم (${idx + 1}): ${item.title}`);
    lines.push(`- الرابط: ${item.url}`);
    if (item.source) lines.push(`- جهة النشر: ${item.source}`);
    if (item.date) lines.push(`- تاريخ النشر: ${item.date}`);
    lines.push(`- درجة الموثوقية: ${formatCredibilityStars(item.credibilityScore)}`);
    lines.push(`- المقتطف التوثيقي: ${item.snippet}`);
    if (item.fullContent && item.fullContent.length > item.snippet.length) {
      lines.push(`- التفاصيل والنصوص الكاملة المستخرجة من الصفحة:\n"""\n${item.fullContent}\n"""`);
    }
    lines.push(bar);
  });

  // Tailored instructions based on intent
  if (intentResult.intent === 'FACT_CHECKING') {
    lines.push(
      `[توجيه التدقيق والتحقق من الحقائق (FACT-CHECKING DIRECTIVE)]:`,
      `1. قارن بدقة بين الادعاء المطروح والمعلومات الواردة في المصادر أعلاه.`,
      `2. حدد بوضوح في بداية ردك: هل الادعاء (صحيح | غير صحيح / شائعة | مضلل / غير مؤكد) مع ذكر الأدلة الدامغة.`,
      `3. وثق إجابتك بروابط المصادر المباشرة باستخدام صيغة Markdown: [اسم المصدر](الرابط).`
    );
  } else if (intentResult.intent === 'REAL_TIME_DATA') {
    lines.push(
      `[توجيه البيانات الحية والأسعار (REAL-TIME DATA DIRECTIVE)]:`,
      `1. استند بشكل حصري وفوري إلى أحدث الأرقام، الأسعار، أو الإحصائيات لعام ${currentYear} الواردة في النتائج أعلاه.`,
      `2. اعرض البيانات في جداول مقارنة منسقة ومنظمة باللغة العربية الفصحى مع توثيق المصادر والروابط.`
    );
  } else {
    lines.push(
      `[توجيه الصياغة والتوثيق الحي (GROUNDING DIRECTIVE)]:`,
      `1. تمتلك الآن وصولاً كاملاً ومحدثاً لمعلومات الإنترنت والويب لعام ${currentYear}.`,
      `2. أجب عن سؤال المستخدم بشكل مباشر وشامل ومفصل وموضوعي استناداً إلى نتائج البحث أعلاه دون أي اعتذار أو ادعاء بانقطاع الاتصال بالإنترنت.`,
      `3. وثق كل معلومة جوهرية بوضع رابط مصدرها بصيغة Markdown المناسبة مثل [اسم المصدر أو عنوان الموقع](الرابط).`
    );
  }

  return lines.join('\n');
}

/**
 * Injects search grounding block into the system prompt or user conversation context.
 */
export function augmentPromptWithSearchResults(
  originalPrompt: string,
  searchGroundingBlock: string
): string {
  if (!searchGroundingBlock) return originalPrompt;
  return `${originalPrompt}\n\n${searchGroundingBlock}`;
}
