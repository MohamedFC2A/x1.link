/**
 * Search Intelligence System — Query Processor & Normalizer
 * Matany AI (Matany)
 */

import { ExtractedEntities } from './searchTypes';

/**
 * Normalizes Arabic text by unifying alef variations, teh marbuta, diacritics, and tatweel.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // Remove Arabic diacritics (harakat)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize Alefs
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize Teh Marbuta to Heh
    .replace(/ة/g, 'ه')
    // Normalize Yeh / Alef Maksura
    .replace(/ى/g, 'ي')
    // Normalize Persian/Urdu characters if any
    .replace(/گ/g, 'ك')
    .replace(/پ/g, 'ب')
    .replace(/ژ/g, 'ز')
    .replace(/چ/g, 'ج')
    .replace(/ڤ/g, 'ف')
    // Normalize multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips conversational preamble, fluff adjectives, and command prefixes to extract the pure search core.
 */
export function extractCleanSearchQuery(rawQuery: string): string {
  if (!rawQuery) return '';

  let clean = rawQuery
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[؟?؟!؛,:;"'«»()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip common conversational Arabic & English question/command openers and puzzle fluff
  const prefixPatterns = [
    /^(?:هو|هي|هما|هم|هو هو|طب هو|طب هي|قولي هو|قولي هي|عرفني هو|طب قولي|طب عرفني|يا ترى|ياترى|معلش هو|لو سمحت هو|ممكن تقولي هو|ممكن اعرف هو|عايز اعرف هو)\s+/i,
    /^(?:أجب|اجب|اكتب|اعمل|صمم|قدم|اعطني|أعطني|هات|نفذ|استخرج|حدد|استعرض)\s+(?:لي\s+)?(?:بتقرير|تقرير|مقال|بحث|تحليل|شرح|ملخص|تفاصيل|إجابة|اجابة|رد|بيان)?\s*(?:استقصائي|استفصالي|شامل|مفصل|دقيق|علمي|كامل|وافي|محدد|موثق|بالأدلة|والتواريخ|القاطعة)?\s*(?:عن|حول|في|بخصوص|لحل)?\s*/i,
    /^(?:استقصائي|استفصالي|شامل|مفصل|دقيق|علمي|كامل|وافي|محدد|موثق|بالأدلة|والتواريخ|القاطعة|الصريحة|الواضحة|لحل|السيناريو|التاريخي|العلمي|الجغرافي|التالي|الآتي|المعقد|متعدد\s*القيود|خطوة\s*بخطوة|بالتفصيل\s*الممل|بدون\s*تخمين|قطعي|محكم)\s+/i,
    /^(?:أريد|اريد|أود|اود|نحتاج|ابغى|بدي|عايز)\s+(?:تقرير|مقال|بحث|معلومات|تفاصيل|معرفة|إجابة|حل)?\s*(?:عن|حول|في|بخصوص)?\s+/i,
    /^(?:حل|حلل|فكك|فسر|وضح|اشرح|استنبط)\s+(?:اللغز|المسألة|السؤال|التحدي|الفزورة|المعضلة|المشكلة|الشروط|الفرضيات|السيناريو)?\s*(?:التالي|الآتي|هذا|المرفق|التاريخي|العلمي)?\s*[:\s-]*\s*/i,
    /^(?:السيناريو\s*التاريخي|السيناريو\s*العلمي|لغز\s*استخباراتي|لغز\s*معقد|تحدي\s*علمي|سؤال\s*تاريخي)\s*(?:المعقد|متعدد\s*القيود|التالي|الآتي)?\s*[:\s-]*\s*/i,
    /^(?:السؤال\s*هو|المطلوب\s*هو|التحدي\s*هو|اللغز\s*هو)\s*[:]\s*/i,
    /^(?:please\s+)?(?:write|give\s+me|provide|solve|explain|detail|answer|investigate)\s+(?:a\s+)?(?:report|essay|summary|analysis|solution|overview|details)?\s*(?:about|on|regarding|for)?\s+/i,
    /^(ابحث\s*(?:لي)?\s*(?:جيدا|جيداً|كويس|بالتفصيل|في\s*النت|في\s*الانترنت|عن|على)?|ممكن\s*تبحث|دور\s*(?:لي)?\s*(?:على|عن)?|سيرش\s*(?:على|عن)?|بحث\s*عن)\s+/i,
    /^(ما\s+هو|ما\s+هي|ماهو|ماهي|ما\s+احدث|ماهي\s+احدث|ماهو\s+احدث|ما\s+افضل|ماهي\s+افضل|من\s+هو|من\s+هي|منهو|منهي|اين\s+يقع|اين\s+توجد|اين\s+يوجد|متى\s+تاسس|متى\s+حدث|متى\s+كان)\s+/i,
    /^(كم\s+سعر|كم\s+ثمن|كم\s+تبلغ\s+قيمة|كم\s+يبلغ\s+سعر|ما\s+سعر|ما\s+اسعار|ما\s+هي\s+اسعار)\s+/i,
    /^(اخبرني\s+عن|احكيلي\s+عن|اشرح\s+لي\s+عن|وضح\s+لي\s+عن|عرف\s+لي|ما\s+معنى|ما\s+مفهوم)\s+/i,
    /^(قارن\s+بين|ما\s+الفرق\s+بين|ايهما\s+افضل|الفرق\s+بين|مقارنة\s+بين)\s+/i,
    /^(ما\s+اخر\s+اخبار|اخر\s+اخبار|ما\s+احدث\s+اخبار|احدث\s+اخبار|اخبار\s+عن|جديد)\s+/i,
    /^(search\s+for|search\s+about|search\s+well|find\s+me|find\s+information\s+on|google|can\s+you\s+search\s+for|look\s+up|tell\s+me\s+about|what\s+is|who\s+is|where\s+is|when\s+did|how\s+to)\s+/i,
    /^(?:1\.|2\.|3\.|4\.|5\.|-|\*|•|\(1\)|\(2\)|\(3\)|أولاً|ثانياً|ثالثاً|رابعاً)\s*/i
  ];

  let prev = '';
  while (prev !== clean) {
    prev = clean;
    for (const pattern of prefixPatterns) {
      clean = clean.replace(pattern, '').trim();
    }
  }

  // Strip colloquial trailing question particles e.g. "اي", "ايه", "إيه", "شو", "شنو", "فين", "مين"
  clean = clean.replace(/\s+(?:اي|ايه|إيه|شو|شنو|كام|مين|فين|ازاي|إزاي)$/i, '').trim();

  // Strip leading digits e.g. "1." or "1-"
  clean = clean.replace(/^[\d.)\-•\s]+/, '').trim();

  // Entity canonicalization for popular single names (e.g. كريستيانو -> كريستيانو رونالدو)
  if (/(?:^|\s)كريستيانو(?:\s|$)/i.test(clean) && !/رونالدو/i.test(clean)) {
    clean = clean.replace(/(^|\s)كريستيانو(\s|$)/gi, '$1كريستيانو رونالدو$2').trim();
  } else if (/(?:^|\s)ميسي(?:\s|$)/i.test(clean) && !/ليونيل/i.test(clean)) {
    clean = clean.replace(/(^|\s)ميسي(\s|$)/gi, '$1ليونيل ميسي$2').trim();
  }

  // If query is still very long, take the first 12 words of substance
  const words = clean.split(/\s+/);
  if (words.length > 14) {
    clean = words.slice(0, 12).join(' ');
  }

  return clean.slice(0, 150).trim();
}

/**
 * Extracts multiple distinct sub-queries from a multi-clause or numbered puzzle prompt.
 */
export function extractMultiConstraintSearchQueries(rawQuery: string): string[] {
  if (!rawQuery) return [];

  // Match numbered clauses e.g. "1. ... 2. ... 3. ..." or line by line
  const lines = rawQuery.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const numberedClauses: string[] = [];

  for (const line of lines) {
    if (/^(?:\d+[\.\)-]|[-•*]|\(\d+\))\s+/.test(line)) {
      const cleaned = extractCleanSearchQuery(line);
      if (cleaned && cleaned.length > 8) {
        numberedClauses.push(cleaned);
      }
    }
  }

  // Also check inline "1. ... 2. ... 3. ..." if not on separate lines
  if (numberedClauses.length === 0) {
    const inlineMatches = rawQuery.split(/(?:\s|^)(?:\d+[\.\)-]|[-•*]|\(\d+\))\s+/).map(s => extractCleanSearchQuery(s)).filter(s => s && s.length > 8);
    if (inlineMatches.length > 1) {
      numberedClauses.push(...inlineMatches);
    }
  }

  if (numberedClauses.length > 0) {
    // Return up to 3 most specific clauses
    return Array.from(new Set(numberedClauses)).slice(0, 3);
  }

  const single = extractCleanSearchQuery(rawQuery);
  if (!single) return [];

  // If query is inquiring about an entity's current appearance, hair, look, or state, generate multi-angle queries
  const isAppearanceOrState = /(?:شعر|قصة\s*شعر|لون\s*شعر|مظهر|شكل|لوك|نيولوك|حالي|حاليا|حالياً|آخر\s*ظهور|اخر\s*ظهور|hair|look)/i.test(single);
  if (isAppearanceOrState && (/(?:كريستيانو|رونالدو|ronaldo)/i.test(single))) {
    return [
      `لون شعر كريستيانو رونالدو الحالي 2026`,
      `Cristiano Ronaldo current hair color latest look 2026`,
      `كريستيانو رونالدو آخر ظهور قصة شعر`
    ];
  }

  return [single];
}

/**
 * Extracts named entities (companies, people, locations, dates, products, years).
 */
export function extractEntitiesFromQuery(query: string): ExtractedEntities {
  const entities: ExtractedEntities = {
    people: [],
    organizations: [],
    dates: [],
    locations: [],
    products: [],
    concepts: [],
    years: []
  };

  if (!query) return entities;

  // Extract explicit 4-digit years (1900-2099)
  const yearMatches = query.match(/\b(19\d{2}|20\d{2})\b/g);
  if (yearMatches) {
    entities.years = Array.from(new Set(yearMatches.map(y => parseInt(y, 10))));
  }

  // Tech, Science, Space & International Organizations
  const orgPatterns: Record<string, RegExp> = {
    'NASA': /(?:ناسا|\bnasa\b)/i,
    'IAU': /(?:الاتحاد\s*الفلكي\s*الدولي|منظمة\s*الفلك|\biau\b)/i,
    'CERN': /(?:سيرن|\bcern\b)/i,
    'WHO': /(?:منظمة\s*الصحة\s*العالمية|\bwho\b)/i,
    'UN': /(?:الأمم\s*المتحدة|الامم\s*المتحدة|\bun\b)/i,
    'FIFA': /(?:فيفا|\bfifa\b)/i,
    'UEFA': /(?:يويفا|\buefa\b)/i,
    'RNA Tie Club': /(?:نادي\s*ربطة\s*عنق\s*rna|نادي\s*rna|\brna\s*tie\s*club\b)/i,
    'OpenAI': /(?:أوبن\s*إيه\s*آي|\b(?:openai|chatgpt|gpt-4|gpt-4o|o1|o3|sora|dall-e)\b)/i,
    'Google': /(?:جوجل|غوغل|\b(?:google|deepmind|gemini|gemma|android|alphabet)\b)/i,
    'Anthropic': /(?:أنثروبيك|\b(?:anthropic|claude|claude-3|claude-3.5|sonnet|opus)\b)/i,
    'DeepSeek': /(?:ديب\s*سيك|\b(?:deepseek|deepseek-v3|deepseek-r1|deepseek-v4)\b)/i,
    'Meta': /(?:ميتا|\b(?:meta|facebook|instagram|whatsapp|llama|llama-3)\b)/i,
    'Microsoft': /(?:مايكروسوفت|\b(?:microsoft|copilot|azure|windows)\b)/i,
    'Apple': /(?:أبل|ابل|\b(?:apple|iphone|ipad|macbook|ios|vision pro)\b)/i,
    'NVIDIA': /(?:إنفيديا|انفيديا|\b(?:nvidia|geforce|rtx|blackwell|h100|b200)\b)/i,
    'Tesla': /(?:تسلا|\b(?:tesla|cybertruck|model 3|model y|elon musk)\b)/i,
    'Amazon': /(?:أمازون|امازون|\b(?:amazon|aws|bedrock|alexa)\b)/i,
    'Ford': /(?:فورد|\bford\b)/i,
    'Toyota': /(?:تويوتا|\btoyota\b)/i,
  };

  for (const [org, regex] of Object.entries(orgPatterns)) {
    if (regex.test(query)) {
      entities.organizations.push(org);
    }
  }

  // Famous Scientists, Astronomers, Athletes & Historical Figures
  const peoplePatterns: Record<string, RegExp> = {
    'Paul Dirac': /(?:ديراك|بول\s*ديراك|\bdirac\b)/i,
    'Francis Crick': /(?:كريك|فرانسيس\s*كريك|\bcrick\b)/i,
    'George Gamow': /(?:غاموف|جاموف|جورج\s*غاموف|\bgamow\b)/i,
    'Wolfgang Pauli': /(?:باولي|فولفغانغ\s*باولي|\bpauli\b)/i,
    'Max Born': /(?:ماكس\s*بورن|\bmax\s*born\b)/i,
    'Erwin Schrodinger': /(?:شرودنجر|شرودنغر|إرفين\s*شرودنجر|\b(?:schrodinger|schroedinger)\b)/i,
    'Max Delbruck': /(?:ديلبروك|ماكس\s*ديلبروك|\b(?:delbruck|delbrück)\b)/i,
    'James Watson': /(?:واطسون|جيمس\s*واطسون|\bwatson\b)/i,
    'Albert Einstein': /(?:أينشتاين|اينشتاين|ألبرت\s*أينشتاين|\beinstein\b)/i,
    'Isaac Newton': /(?:إسحاق\s*نيوتن|نيوتن|\bnewton\b)/i,
    'Mohamed Salah': /(?:محمد\s*صلاح|صلاح|\b(?:mohamed\s*salah|mo\s*salah)\b)/i,
    'Lionel Messi': /(?:ميسي|ليونيل\s*ميسي|\bmessi\b)/i,
    'Cristiano Ronaldo': /(?:كريستيانو\s*رونالدو|رونالدو|كريستيانو|\bronaldo\b)/i,
  };

  for (const [person, regex] of Object.entries(peoplePatterns)) {
    if (regex.test(query)) {
      entities.people.push(person);
    }
  }

  // Scientific & Domain Concepts
  const conceptPatterns: Record<string, RegExp> = {
    'Comet': /(?:مذنب|مذنبات|أريند-رولاند|مركوس|هالي|\b(?:comet|comets|arend-roland|mrkos|halley)\b)/i,
    'Asteroid': /(?:كويكب|كويكبات|\b(?:asteroid|asteroids)\b)/i,
    'Galaxy': /(?:مجرة|مجره|مجرات|درب\s*التبانة|\b(?:galaxy|galaxies|milky\s*way)\b)/i,
    'Telescope': /(?:تلسكوب|مرصد|هابل|جيمس\s*ويب|\b(?:telescope|observatory|james\s*webb|hubble)\b)/i,
    'Quantum Physics': /(?:كوانتم|كمي|ميكانيكا\s*الكم|\b(?:quantum|quantum\s*mechanics)\b)/i,
    'DNA/RNA': /(?:حمض\s*نووي|جينات|جينوم|شفره\s*وراثيه|\b(?:dna|rna)\b)/i,
  };

  for (const [concept, regex] of Object.entries(conceptPatterns)) {
    if (regex.test(query)) {
      entities.concepts.push(concept);
    }
  }

  // Temporal Keywords & Dates
  const dateKeywords = [
    'اليوم', 'الآن', 'الان', 'امس', 'أمس', 'البارحة', 'هذا الاسبوع', 'هذا الأسبوع',
    'الشهر الحالي', 'الشهر الماضي', 'العام الحالي', 'الحالي', 'الحالية', 'دلوقتي', '2026', '2025', '2024',
    'today', 'now', 'yesterday', 'this week', 'this month', 'latest', 'recent', 'current'
  ];
  for (const kw of dateKeywords) {
    if (query.toLowerCase().includes(kw)) {
      entities.dates.push(kw);
    }
  }

  // Locations (Arab Countries, Capitals, World Powers)
  const locationsMap = [
    'مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان', 'الأردن',
    'فلسطين', 'العراق', 'سوريا', 'لبنان', 'المغرب', 'الجزائر', 'تونس', 'ليبيا', 'السودان',
    'القاهرة', 'الرياض', 'دبي', 'أبوظبي', 'الدوحة', 'جدة', 'القدس', 'بيروت', 'بغداد',
    'أمريكا', 'واشنطن', 'نيويورك', 'لندن', 'باريس', 'برلين', 'طوكيو', 'بكين', 'روسيا', 'أوكرانيا'
  ];
  for (const loc of locationsMap) {
    if (query.includes(loc)) {
      entities.locations.push(loc);
    }
  }

  // Products & Cars
  const productMatches = query.match(/(iphone\s*\d+|galaxy\s*s\d+|pixel\s*\d+|rtx\s*\d+|playstation\s*\d+|xbox\s*[a-z0-9]+|ford\s+[a-z0-9-]+|mustang\s*[a-z0-9]*)/gi);
  if (productMatches) {
    entities.products.push(...productMatches);
  }

  return entities;
}

/**
 * Builds a temporal search query, augmenting modern queries with the current year (2026)
 * while preserving historical queries and exact year references.
 */
export function buildTemporalSearchQuery(
  rawQuery: string,
  targetYear: number = new Date().getUTCFullYear()
): { query: string; isRecencyBiased: boolean; cleanCore: string } {
  const cleanCore = extractCleanSearchQuery(rawQuery);
  if (!cleanCore) {
    return { query: '', isRecencyBiased: false, cleanCore: '' };
  }

  const isExplicitHistorical = /(تاريخ|قديم|زمان|أصل|نشأة|في عام\s*\d{4}|سنة\s*19\d{2}|سنة\s*20[0-1]\d|history of|ancient|origin|in \d{4})/i.test(rawQuery);
  const hasSpecificYear = /\b(19\d{2}|20\d{2})\b/.test(rawQuery);

  // If query is about news, pricing, tech releases, or current state and has no explicit year
  const isCurrentTrigger = /(أحدث|اخر|آخر|جديد|سعر|أسعار|الان|الآن|اليوم|الحالي|الحالية|دلوقتي|مواصفات|تحديث|إصدار|latest|current|today|price|news|update|release|specs)/i.test(rawQuery);

  if ((isCurrentTrigger || (!isExplicitHistorical && !hasSpecificYear)) && cleanCore.length > 2) {
    // Only append year if not already present; avoid appending English words to Arabic queries
    const isArabic = /[\u0600-\u06FF]/.test(cleanCore);
    const augmentedQuery = cleanCore.includes(String(targetYear))
      ? cleanCore
      : (isArabic ? `${cleanCore} ${targetYear}` : `${cleanCore} ${targetYear} latest update`);

    return {
      query: augmentedQuery.trim(),
      isRecencyBiased: true,
      cleanCore
    };
  }

  return {
    query: cleanCore,
    isRecencyBiased: false,
    cleanCore
  };
}

/**
 * Resolves conversational follow-up queries by extracting subject/entity context from prior turns.
 * Example: User asks "سجل كم هدف فيها" after discussing "مباراة محمد صلاح طرابزون سبور وفيرينكفاروس"
 * -> Returns "محمد صلاح طرابزون سبور وفيرينكفاروس سجل كم هدف"
 */
export function resolveMultiTurnQuery(
  currentPrompt: string,
  history?: Array<{ role: string; content: any }>
): string {
  const cleanPrompt = (currentPrompt || '').trim();
  if (!cleanPrompt) return '';
  if (!history || !Array.isArray(history) || history.length === 0) return cleanPrompt;

  // Never consider greetings, self-intros, or code requests as context follow-ups
  const isGreetingOrCode = /^(?:مرحبا|أهلا|اهلا|السلام عليكم|صباح الخير|مساء الخير|هاي|hello|hi|hey|عرف بنفسك|من أنت|من انت|كود|اكتب|صمم|ارسم|برمج|حلل)\b/i.test(cleanPrompt);
  if (isGreetingOrCode) return cleanPrompt;

  // Check if current prompt is an explicit follow-up with pronouns pointing to antecedent
  const isFollowUp =
    /(?:^|\s|[.,!?،؟])(فيها|فيه|عنها|عنه|منها|منه|بها|به|عليهم|هو|هي|هما|هم|المباراة|الماتش|اللقاء|اللاعب|الفريق|الخبر|التقرير|الحادث|المسلسل|الفيلم|الجهاز|الموبايل|الهاتف|الشركة|النتيجة|الاهداف|الأهداف|سجل|احرز|أحرز|كام|كم|مين|متى)(?:$|\s|[.,!?،؟])/i.test(cleanPrompt);

  if (!isFollowUp) return cleanPrompt;

  // Search backwards for the most recent meaningful context from user turns
  const pastTurns = [...history].reverse();
  let contextTopic = '';

  for (const turn of pastTurns) {
    if (turn.role === 'system') continue;
    let text = '';
    if (typeof turn.content === 'string') {
      text = turn.content;
    } else if (Array.isArray(turn.content)) {
      text = turn.content.map((c: any) => c.text || '').join(' ');
    }

    if (!text || text === cleanPrompt) continue;

    // Filter out reasoning/system leaks
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\[(?:LIVE WEB INTELLIGENCE|نتائج البحث)[^\]]*\]/gi, '')
      .replace(/\[(?:توجيه|DIRECTIVE|FATHOM|SERPER|SYSTEM)[\s\S]*?\]/gi, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim();

    // Extract significant nouns or topic phrases
    const lines = cleanText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 8 && !l.startsWith('[') && !l.includes('DIRECTIVE') && !l.includes('توجيه'));

    if (lines.length > 0) {
      const sample = lines[0].replace(/^[-*#\d+.)\s]+/, '').slice(0, 120).trim();
      if (sample && sample.length > 6) {
        contextTopic = sample;
        break;
      }
    }
  }

  if (contextTopic) {
    return `${contextTopic} ${cleanPrompt}`.trim();
  }

  return cleanPrompt;
}
