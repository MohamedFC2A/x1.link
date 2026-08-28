/**
 * Search Intelligence System — Intent Classifier & Autonomous Trigger
 * Matany AI (Matany)
 * Zero-Keyword Semantic Architecture & Anti-Hallucination Decision Engine
 */

import {
  QueryIntent,
  IntentClassificationResult,
  SearchPriority,
  SearchComplexityLevel,
  KnowledgeDomain,
  ExtractedEntities
} from './searchTypes';
import {
  normalizeArabicText,
  extractCleanSearchQuery,
  extractEntitiesFromQuery,
  buildTemporalSearchQuery
} from './queryProcessor';

interface IntentRule {
  intent: QueryIntent;
  domain: KnowledgeDomain;
  weight: number;
  priority: SearchPriority;
  complexity: SearchComplexityLevel;
  patterns: RegExp[];
}

// Normalized-aware regex patterns for multi-domain intelligence
const INTENT_RULES: IntentRule[] = [
  {
    intent: 'REAL_TIME_DATA',
    domain: 'FINANCE_ECONOMICS',
    weight: 0.98,
    priority: 'urgent',
    complexity: 'DEEP_CYBER',
    patterns: [
      /(سعر|اسعار|كم\s*سعر|كم\s*يبلغ\s*سعر|ثمن|تكلفه|دولار|يورو|ريال|جنيه|ذهب|فضه|عملات|بورصه|اسهم|تداول|بيتكوين|كريبتو|الطقس|درجه\s*الحراره|مباراه\s*اليوم|نتائج\s*المباريات)/i,
      /\b(price|prices|how\s+much\s+is|cost\s+of|weather|temperature|stock|stocks|nasdaq|crypto|bitcoin|btc|eth|exchange\s+rate|gold\s+price|live\s+score|match\s+result)\b/i
    ]
  },
  {
    intent: 'CURRENT_EVENTS',
    domain: 'GENERAL_FACT',
    weight: 0.96,
    priority: 'urgent',
    complexity: 'DEEP_CYBER',
    patterns: [
      /(اخر\s*اخبار|احدث\s*اخبار|اخبار\s*اليوم|حدث\s*اليوم|الان|عاجل|ماذا\s*حدث|مستجدات|احدث\s*تطورات|بيان\s*رسمي|صفقه|زلزال|حرب|مؤتمر|الحالي|الحاليه|الحالية|دلوقتي|آخر\s*ظهور|اخر\s*ظهور|مظهره\s*الحالي|شكله\s*الحالي|لونه\s*الحالي|لون\s*شعره|قصة\s*شعر|نيولوك|فريقه\s*الحالي|وضعه\s*الحالي)/i,
      /\b(latest\s+news|breaking\s+news|today's\s+news|happened\s+today|current\s+events|recent\s+updates|just\s+announced|press\s+release|current\s+look|current\s+hair|latest\s+appearance|current\s+team|current\s+status)\b/i
    ]
  },
  {
    intent: 'FACT_CHECKING',
    domain: 'GENERAL_FACT',
    weight: 0.95,
    priority: 'urgent',
    complexity: 'DEEP_CYBER',
    patterns: [
      /(هل\s*صحيح\s*ان|تحقق\s*من\s*صحه|هل\s*مات|هل\s*توفي|حقيقه\s*خبر|اشاعه|شائعه|هل\s*فعلا|صحه\s*حديث|كشف\s*حقيقه|فبركه|هل\s*(?:اعلنت|أعلنت|صرحت|اكدت|أكدت|نفت|انتشر|اعلن|أعلن|صرح|قال))/i,
      /\b(is\s+it\s+true\s+that|fact\s+check|debunk|verify|did\s+really\s+happen|is\s+it\s+fake|hoax|rumor|did\s+(?:who|nasa|cdc|fda|gov)\s+announce)\b/i
    ]
  },
  {
    intent: 'SCIENTIFIC_RESEARCH',
    domain: 'ASTRONOMY_PHYSICS',
    weight: 0.94,
    priority: 'urgent',
    complexity: 'DEEP_CYBER',
    patterns: [
      /(بحث\s*علمي|دراسه\s*حديثه|ورقه\s*بحثيه|جامعه|طبي|علاج\s*جديد|لقاح|فضاء|ناسا|iau|كوانتم|فيزياء|كيمياء|مذنب|كويكب|مجرة|مجره|تلسكوب|ديراك|باولي|بورن|شرودنجر|شرودنغر|غاموف|جاموف|اينشتاين|هايزنبرج|هايزنبرغ|كريك|ديلبروك|واطسون|rna|dna|rna\s*tie\s*club|اشعاع|ثقب\s*اسود|نسبيه|نووي|تسارع|جزيء|بروتين|انزيم|arxiv|nature|lancet)/i,
      /\b(scientific\s+study|research\s+paper|published\s+in|clinical\s+trial|arxiv|nature|lancet|medical\s+discovery|nasa|iau|telescope|peer-reviewed|comet|asteroid|astronomy|quantum|physics|dirac|pauli|born|schrodinger|gamow|einstein|heisenberg|crick|delbruck|watson|dna|rna\s+tie\s+club|black\s+hole|relativity|nuclear|protein|enzyme)\b/i
    ]
  },
  {
    intent: 'PRODUCT_RESEARCH',
    domain: 'TECHNOLOGY_COMPUTING',
    weight: 0.95,
    priority: 'urgent',
    complexity: 'STANDARD',
    patterns: [
      /(مواصفات|مراجعه|عيوب|مميزات|شراء|افضل\s*(?:هاتف|لابتوب|سياره|سيارة|عربيه|عربية|شاشه|كاميرا|سماعه|ساعه)|احدث\s*(?:سياره|سيارة|هاتف|موبايل|لابتوب|اصدار|موديل|طراز|نسخه|جهاز|عربيه|عربية)|سياره|سيارة|سيارات|عربيه|عربية|عربيات|موديل|طراز|سلسله|اصدار|تحديث\s*جديد|فتح\s*صندوق|تقييم|بروسيسور|كارت\s*شاشه|فورد|تويوتا|مرسيدس|بي\s*ام|هيونداي|كيا|تسلا|نيسان|شيفروليه|ford|toyota|mercedes|bmw|tesla|honda|audi|porsche|ferrari|lamborghini|hyundai|kia|nissan|chevrolet)/i,
      /\b(specs|specifications|review|reviews|best\s+laptop|best\s+phone|best\s+car|latest\s+car|newest\s+car|car\s+model|buying\s+guide|unboxing|pros\s+and\s+cons|benchmark|gpu|cpu|ford|mustang|toyota|bmw|mercedes|tesla)\b/i
    ]
  },
  {
    intent: 'COMPARISON',
    domain: 'GENERAL_FACT',
    weight: 0.90,
    priority: 'normal',
    complexity: 'STANDARD',
    patterns: [
      /(مقارنه\s*بين|الفرق\s*بين|ايهما\s*افضل|ايهما\s*احسن|مقارنه|ضد|vs|versus|مفاضله)/i,
      /\b(compare|comparison|difference\s+between|which\s+is\s+better|vs|versus|head\s+to\s+head)\b/i
    ]
  },
  {
    intent: 'TECHNICAL_DOCUMENTATION',
    domain: 'TECHNOLOGY_COMPUTING',
    weight: 0.88,
    priority: 'normal',
    complexity: 'STANDARD',
    patterns: [
      /(توثيق|دليل\s*استخدام|مكتبه|اطار\s*عمل|داله|خطا\s*برمجي|اصدار\s*جديد|changelog|sdk|api|npm|github|release\s*notes|syntax)/i,
      /\b(documentation|docs|api\s+reference|library|framework|sdk|changelog|error\s+code|npm\s+package|github\s+repo|syntax\s+guide)\b/i
    ]
  },
  {
    intent: 'TUTORIAL_HOW_TO',
    domain: 'GENERAL_FACT',
    weight: 0.82,
    priority: 'normal',
    complexity: 'LIGHT',
    patterns: [
      /(كيف\s*اتعلم|طريقه\s*عمل|خطوات|شرح|دليل\s*شامل|كيفيه\s*تثبيت|طريقه\s*تسطيب|دوره|كورس)/i,
      /\b(how\s+to|step\s+by\s+step|tutorial|guide|how\s+do\s+i|getting\s+started\s+with|setup\s+guide)\b/i
    ]
  },
  {
    intent: 'TREND_ANALYSIS',
    domain: 'FINANCE_ECONOMICS',
    weight: 0.80,
    priority: 'normal',
    complexity: 'STANDARD',
    patterns: [
      /(ترند|احدث\s*الاتجاهات|مستقبل|توقعات|احصائيات|سوق\s*الـ|نمو\s*سوق)/i,
      /\b(trends|market\s+trends|future\s+of|industry\s+analysis|market\s+growth|forecast\s+2026)\b/i
    ]
  },
  {
    intent: 'INFORMATION_SEARCH',
    domain: 'GENERAL_FACT',
    weight: 0.92,
    priority: 'urgent',
    complexity: 'STANDARD',
    patterns: [
      /(ابحث|ابحث\s*جيدا|ابحث\s*لي|دور\s*على|سيرش|معلومات\s*عن|ما\s*هي\s*احدث|ما\s*هو\s*احدث|ماهي\s*احدث|ماهو\s*احدث|من\s*هو|من\s*هي|من\s*هم|متى\s*تاسس|اين\s*يقع|ما\s*هو|ما\s*هي|ماذا\s*تعرف\s*عن|ما\s*اسم|حل\s*اللغز|من\s*صاحب|من\s*الفائز|من\s*المؤلف)/i,
      /\b(search|search\s+for|search\s+well|look\s+up|find\s+out|what\s+is\s+the\s+latest|who\s+is|who\s+was|where\s+is|when\s+was|what\s+is|history\s+of|name\s+of|solve\s+this|winner\s+of)\b/i
    ]
  },
  {
    intent: 'OPINION_SEEKING',
    domain: 'GENERAL_FACT',
    weight: 0.45,
    priority: 'background',
    complexity: 'LIGHT',
    patterns: [
      /(ما\s*رايك|شايف\s*ايه|تنصحني|وجهه\s*نظرك|اقتراحك|افضل\s*خيار\s*بالنسبه\s*لي)/i,
      /\b(what\s+do\s+you\s+think|your\s+opinion|what\s+is\s+better\s+for\s+me|would\s+you\s+recommend)\b/i
    ]
  }
];

// Universal Inquiry & Question Interrogatives (Zero-Keyword Decision)
const FACTUAL_INQUIRY_PATTERNS = [
  /(?:^|[^\w\u0621-\u064A])(من\s*(?:هو|هي|هم|ذا|الذي|التي|اول|أول|صاحب|مؤلف|مخترع|مكتشف|عالم|فلكي)|ما\s*(?:هو|هي|ذا|اسم|حقيقة|أصل|تاريخ|علاقة|سر|سبب|نوع)|ماهو|ماهي|ماذا|متى\s*(?:حدث|تأسس|ولد|توفي|اكتشف|ظهر|انعقد)|أين|اين|كيف\s*(?:تم|حدث|اكتشف|بدأ)|لماذا|أي\s*(?:عالم|مذنب|دولة|منظمة|نادي|كتاب|معاهدة|حدث|جزيرة|قمر|صاروخ|عنصر|جزيء)|في\s*أي\s*(?:عام|سنة|تاريخ)|حل\s*(?:اللغز|المسألة|السيناريو)|باحث\s*استقصائي|بيانات\s*متقاطعة|مصادر\s*حية|تواريخ\s*قطعية|سيناريو\s*تحليلي|الطرف\s*الأول|الطرف\s*الثاني|الطرف\s*الثالث)(?:[^\w\u0621-\u064A]|$)/i,
  /(?:^|[^\w])(who\s+(?:is|was|were|discovered|invented|founded)|what\s+(?:is|was|caused|happened)|which\s+(?:scientist|comet|organization|year|event|island|satellite|molecule|element)|when\s+(?:did|was|were)|where\s+(?:is|was|did)|why\s+did|how\s+did|name\s+of|solve\s+the\s+riddle|investigative|cross-data|verified\s+sources)(?:[^\w]|$)/i
];

const PURE_CONVERSATIONAL_PATTERNS = [
  /^(مرحبا|اهلا|اهلاً|صباح\s*الخير|مساء\s*الخير|سلام\s*عليكم|السلام\s*عليكم|هاي|ازيك|عامل\s*ايه|كيف\s*حالك|hello|hi|hey|good\s+morning|good\s+evening)\b/i,
  /(اكتب\s*لي\s*(?:قصه|قصة|روايه|رواية|قصيده|قصيدة|شعر|خاطره|خاطرة)|الف\s*لي\s*قصه|نكته|احكي\s*نكته|سيناريو\s*خيالي|roleplay|write\s+a\s+poem|write\s+a\s+story|tell\s+a\s+joke)/i,
  /(حل\s*المعادله|احسب\s*لي|ما\s*ناتج|2\s*\+\s*2|calculate|solve\s+for\s+x|math\s+problem)/i,
  /(بدون\s*بحث|لا\s*تبحث|من\s*معلوماتك|بدون\s*نت|بدون\s*انترنت|no\s+search|without\s+search|offline\s+mode)/i,
  /^(من\s*انت|عرف\s*عن\s*نفسك|who\s+are\s+you|what\s+is\s+your\s+name)\b/i
];

const PURE_REASONING_AND_LOGIC_PATTERNS = [
  /(إذا\s*سافر|لو\s*سافر|افترض\s*أن|لغز|أحجية|احجية|حزورة|مسألة\s*منطقية|تجربة\s*فكرية|ساعة\s*بيولوجية|مفارقة\s*(?:التوأم|الجد)|النسبية\s*الخاصة\s*(?:إذا|لو|احسب)|القيود\s*الصارمة|خطوة\s*التفكير|جدول\s*Markdown|فكم\s*ساعة\s*ستمر|كم\s*ساعة\s*ستمر|سرعة\s*الضوء\s*لمدة)/i,
  /\b(logic\s+puzzle|riddle|thought\s+experiment|twin\s+paradox|special\s+relativity\s+(?:if|calculate)|hypothetical\s+scenario|strict\s+constraints)\b/i
];

/**
 * Classifies user query into structured intent, computes confidence score,
 * evaluates search complexity & knowledge domain, and makes the autonomous search trigger decision.
 */
export function classifyQueryIntent(
  rawQuery: string,
  options?: { explicitDeepSearch?: boolean; previousIntent?: QueryIntent }
): IntentClassificationResult {
  const query = (rawQuery || '').trim();
  const normalized = normalizeArabicText(query);
  const entities = extractEntitiesFromQuery(query);
  const { query: temporalQuery, isRecencyBiased } = buildTemporalSearchQuery(query);
  const cleanCore = extractCleanSearchQuery(query);

  // 1. Explicit User Override: Force Deep Search
  if (options?.explicitDeepSearch) {
    return {
      intent: 'INFORMATION_SEARCH',
      confidence: 1.0,
      should_search: true,
      search_type: 'INFORMATION_SEARCH',
      priority: 'urgent',
      complexityLevel: 'DEEP_CYBER',
      knowledgeDomain: 'GENERAL_FACT',
      entities,
      reason: 'Explicit deep search commanded by user switch.',
      temporalBias: isRecencyBiased,
      targetYear: entities.years[0] || new Date().getUTCFullYear(),
      extractedQuery: temporalQuery || cleanCore || query
    };
  }

  // 2. Pure Conversational / Casual Greeting Check
  const isPureGreeting = PURE_CONVERSATIONAL_PATTERNS.some(p => p.test(normalized) || p.test(query));
  const hasRealtimeOrSearchKeyword = /(سعر|اسعار|اخبار|اخر\s*اخبار|اليوم|الان|عاجل|2026|weather|price|news|latest|من\s*هو|ما\s*هو|متى|اين|لماذا)/i.test(normalized);

  if (isPureGreeting && !hasRealtimeOrSearchKeyword) {
    return {
      intent: 'GENERAL_CONVERSATION',
      confidence: 0.1,
      should_search: false,
      search_type: 'GENERAL_CONVERSATION',
      priority: 'background',
      complexityLevel: 'NONE',
      knowledgeDomain: 'GENERAL_FACT',
      entities,
      reason: 'Casual conversation, greeting, math, or creative roleplay.',
      temporalBias: false,
      extractedQuery: cleanCore || query
    };
  }

  // 2.b. Pure Deductive Reasoning, Logic Puzzle, or Theoretical Physics Check
  const isPureReasoning = PURE_REASONING_AND_LOGIC_PATTERNS.some(p => p.test(normalized) || p.test(query));
  const hasLiveNewsOrMarketRequest = /(سعر|اسعار|اخبار|اخر\s*اخبار|اليوم|الان|عاجل|2026|weather|price|breaking\s+news)/i.test(normalized);

  if (isPureReasoning && !hasLiveNewsOrMarketRequest) {
    return {
      intent: 'GENERAL_CONVERSATION',
      confidence: 0.95,
      should_search: false,
      search_type: 'GENERAL_CONVERSATION',
      priority: 'background',
      complexityLevel: 'NONE',
      knowledgeDomain: 'ASTRONOMY_PHYSICS',
      entities,
      reason: 'Pure deductive reasoning, logic puzzle, or theoretical thought experiment. No web search needed.',
      temporalBias: false,
      extractedQuery: cleanCore || query
    };
  }

  // 3. Very short query (< 3 chars)
  if (cleanCore.length < 3) {
    return {
      intent: 'GENERAL_CONVERSATION',
      confidence: 0.2,
      should_search: false,
      search_type: 'GENERAL_CONVERSATION',
      priority: 'background',
      complexityLevel: 'NONE',
      knowledgeDomain: 'GENERAL_FACT',
      entities,
      reason: 'Query too short for meaningful web search.',
      temporalBias: false,
      extractedQuery: cleanCore
    };
  }

  // 4. Match against structured intent rules
  let highestScore = 0.0;
  let matchedIntent: QueryIntent = 'GENERAL_CONVERSATION';
  let matchedPriority: SearchPriority = 'normal';
  let matchedComplexity: SearchComplexityLevel = 'STANDARD';
  let matchedDomain: KnowledgeDomain = 'GENERAL_FACT';
  let matchReason = 'General knowledge evaluation.';

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized) || pattern.test(query)) {
        if (rule.weight > highestScore) {
          highestScore = rule.weight;
          matchedIntent = rule.intent;
          matchedPriority = rule.priority;
          matchedComplexity = rule.complexity;
          matchedDomain = rule.domain;
          matchReason = `Matched pattern for ${rule.intent} (${rule.domain}) with priority ${rule.priority}.`;
        }
      }
    }
  }

  // 5. Zero-Keyword Autonomous Inquiry Detection:
  // Any query starting with interrogative question structures (من هو, ما هو, أي عالم, متى, أين, حل اللغز...)
  const isFactualInquiry = FACTUAL_INQUIRY_PATTERNS.some(p => p.test(normalized) || p.test(query));
  if (isFactualInquiry) {
    if (highestScore < 0.85) {
      highestScore = 0.88;
      matchedIntent = 'INFORMATION_SEARCH';
      matchedPriority = 'urgent';
      matchedComplexity = 'STANDARD';
      matchReason = 'Universal factual inquiry structure detected (Zero-Keyword Autonomous Trigger).';
    }
  }

  // 6. Multi-Entity Intersection & Scientific / Historical Trivia Detection
  const entityCount = entities.people.length + entities.organizations.length + entities.products.length + entities.concepts.length;
  const hasMultipleEntities = entityCount >= 2 || (entityCount >= 1 && entities.years.length > 0);

  if (hasMultipleEntities || (entities.years.length > 0 && isFactualInquiry)) {
    highestScore = Math.max(highestScore, 0.95);
    matchedPriority = 'urgent';
    matchedComplexity = 'DEEP_CYBER';
    if (matchedIntent === 'GENERAL_CONVERSATION') {
      matchedIntent = 'INFORMATION_SEARCH';
    }
    matchReason = 'High-density multi-entity intersection & factual correlation detected (Deep Cyber Priority).';
  }

  // Boost confidence if entity extraction detected companies, products, or modern dates
  if (entities.organizations.length > 0 || entities.products.length > 0) {
    if (highestScore === 0) {
      highestScore = 0.75;
      matchedIntent = 'INFORMATION_SEARCH';
    } else {
      highestScore = Math.min(1.0, highestScore + 0.10);
    }
  }

  // If query mentions current year (2026/2025) or explicit "now", boost
  if (isRecencyBiased && highestScore > 0) {
    highestScore = Math.max(highestScore, 0.95);
    matchedPriority = 'urgent';
  }

  // Generate sub-queries for multi-angle web intelligence
  const subQueries: string[] = [temporalQuery || cleanCore || query];
  if (entities.people.length > 0 && entities.years.length > 0) {
    subQueries.push(`${entities.people[0]} ${entities.years[0]}`);
  }
  if (entities.organizations.length > 0 && entities.concepts.length > 0) {
    subQueries.push(`${entities.organizations[0]} ${entities.concepts[0]}`);
  }

  const should_search = highestScore >= 0.40;

  return {
    intent: matchedIntent,
    confidence: Number(highestScore.toFixed(2)),
    should_search,
    search_type: matchedIntent,
    priority: matchedPriority,
    complexityLevel: should_search ? matchedComplexity : 'NONE',
    knowledgeDomain: matchedDomain,
    subQueries: subQueries.slice(0, 3),
    entities,
    reason: matchReason,
    temporalBias: isRecencyBiased,
    targetYear: entities.years[0] || new Date().getUTCFullYear(),
    extractedQuery: temporalQuery || cleanCore || query
  };
}
