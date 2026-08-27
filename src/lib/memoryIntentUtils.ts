/**
 * Pure TypeScript utility for Personal Memory Recall intent classification
 * Completely decoupled from React/DOM/Tailwind for 100% Vercel Edge Runtime compatibility.
 */

export const MEMORY_CONCEPTUAL_BLACKLIST: RegExp[] = [
  // Human Biology & Neuroscience
  /(?:ذاكرة\s*(?:الإنسان|البشر|الدماغ|المخ|الحيوان|الخلايا|العصبية|الحسية|القصيرة|الطويلة|العضلية))/i,
  /(?:الذاكرة\s*(?:البشرية|الحسية|العضلية|المكانية|العاطفية|الإجرائية|الدلالية|العرضية|الصورية|السماعية)\s*(?:في\s*(?:علم\s*النفس|الدماغ|طب\s*الأعصاب|الفلسفة))?)/i,
  /(?:كيف\s*(?:تعمل|تخزن|تتشكل|تتكون|تعالج)\s*الذاكرة\s*(?:في\s*(?:دماغ|مخ|عقل))?)/i,
  /(?:human\s*memory|brain\s*memory|neuroscience|hippocampus|biological\s*memory|memory\s*consolidation|synaptic\s*plasticity|cognitive\s*psychology)/i,
  /(?:علم\s*الأعصاب|الخلايا\s*العصبية|الحصين|قرن\s*آمون|فقدان\s*الذاكرة\s*المرضي|مرض\s*الزهايمر|النسيان\s*المرضي)/i,
  
  // Computer Hardware & Electronic Storage
  /(?:ذاكرة\s*(?:الوصول\s*العشوائي|العشوائية|المؤقتة|المخبأة|المخبئية|الوميضية|الرئيسية|الظاهرية|الخارجية|المومري|الميموري|الفلاش|التخزين))/i,
  /(?:الذاكرة\s*(?:العشوائية|المخبئية|المؤقتة|الرئيسية|الوميضية|الصلبة|الافتراضية))/i,
  /(?:كارت\s*ميموري|بطاقة\s*ذاكرة|فلاش\s*ميموري|شريحة\s*ذاكرة|وحدة\s*تخزين)/i,
  /(?:\b(?:ram|rom|ddr\d|sram|dram|vram|nvram|flash\s*memory|virtual\s*memory|cache\s*memory|sd\s*card|memory\s*card|memory\s*leak|memory\s*corruption|buffer\s*overflow)\b)/i,
  
  // History & Essays / Definitions
  /(?:تاريخ\s*(?:الذاكرة|ساعات|الحواسيب|الكمبيوتر))/i,
  /(?:شرح\s*(?:الذاكرة|أنواع\s*الذاكرة|كيف\s*تعمل\s*الذاكرة))/i,
  /(?:أنواع\s*الذاكرة\s*(?:في\s*(?:علم\s*النفس|الحاسوب|الدماغ))?)/i,
  /(?:اكتب\s*مقال(?:اً)?\s*عن\s*الذاكرة)/i,
  /(?:بحث\s*عن\s*الذاكرة|مفهوم\s*الذاكرة|تعريف\s*الذاكرة)/i
];

export const MEMORY_RECALL_WHITELIST: RegExp[] = [
  // Direct Arabic personal recall cues
  /(?:افتكر|فاكر|فاكرة|فكرني|ذكرني|تذكر|هل\s*تتذكر|هل\s*تذكر)\s*(?:إيه|ايه|شو|ايش|ماذا|لما|البورت|السيرفر|المشروع|الرابط|الكود|اسمي|بياناتي|اللي|شات|محادثة|كلامنا|حديثنا)/i,
  /(?:قلت\s*لك|قلتلك|أخبرتك|اخبرتك|حكيت\s*لك)\s*(?:قبل\s*كده|سابقاً|سابقا|في\s*الشات|في\s*المحادثة|عن)/i,
  /(?:في\s*(?:المحادثة|الجلسة|الشات)\s*(?:السابقة|السابق|الماضية|الماضي|اللي\s*فات|اللي\s*فاتت|قبل\s*السابقة))/i,
  /(?:المحادثة\s*السابقة\s*مباشرة|الشات\s*اللي\s*فات\s*مباشرة|الجلسة\s*السابقة|المحادثة\s*التي\s*قبل\s*السابقة)/i,
  /(?:مشروعنا\s*(?:القديم|السابق|المشترك)|شاتنا\s*السابق|محادثاتنا\s*السابقة|جلساتنا\s*السابقة)/i,
  /(?:ماذا\s*(?:قلنا|فعلنا|ناقشنا|قررنا)\s*(?:في\s*(?:الجلسة|المحادثة|الشات)\s*(?:الماضية|السابقة|الماضي|السابق))?)/i,
  /(?:سجل\s*محادثاتنا|أكثر\s*شيء\s*تم\s*ذكره|اكثر\s*شئ\s*اتكرر\s*بيننا)/i,
  /(?:فاكر\s*(?:البورت|السيرفر|الموقع|الرابط|الكود|المشروع|اسم|إيميلي|رقمي|عنوان|الـ\s*ip))/i,
  
  // English Personal Recall
  /(?:remember\s*(?:what\s*i\s*(?:said|told\s*you)|when\s*we|our\s*previous|the\s*server|the\s*port|my\s*name|my\s*project))/i,
  /(?:in\s*our\s*(?:previous|last|past)?\s*(?:chat|conversation|session|discussion|meeting|project))/i,
  /(?:what\s*did\s*we\s*(?:discuss|talk\s*about|agree\s*on|do)\s*(?:last|previously|in\s*the\s*past|before)?)/i,
  /(?:what\s*was\s*(?:the\s*)?(?:server\s*)?(?:port|server|api|ip|database|preference|setting|config|code)\s*(?:that\s*)?(?:we\s*)?(?:used|mentioned|discussed|talked\s*about)?)/i,
  /(?:(?:discussed|talked\s*about|mentioned)\s*(?:last|previously|earlier|in\s*our\s*project|in\s*our\s*chat|before))/i,
  /(?:recall\s*(?:our|my|the\s*previous)\s*(?:chat|conversation|project|setting|discussion))/i
];

/**
 * Disambiguates personal session recall from conceptual / scientific memory queries
 */
export function isPersonalMemoryRecallIntent(prompt: string = ''): boolean {
  if (!prompt) return false;
  const p = prompt.trim();

  // 1. Strict Blacklist check
  const isBlacklisted = MEMORY_CONCEPTUAL_BLACKLIST.some(regex => regex.test(p));
  
  // 2. Strict Whitelist check
  const hasStrongWhitelistCue = MEMORY_RECALL_WHITELIST.some(regex => regex.test(p));

  // If matched conceptual blacklist without explicit personal recall whitelist cue, reject immediately
  if (isBlacklisted && !hasStrongWhitelistCue) {
    return false;
  }

  // 3. Pure informational query guard
  if (isPureInformationalQuery(p) && !hasStrongWhitelistCue) {
    return false;
  }

  // 4. Must match strong whitelist cue
  return hasStrongWhitelistCue;
}

/**
 * Checks whether a prompt is purely conceptual/informational/theoretical
 */
export function isPureInformationalQuery(prompt: string): boolean {
  if (!prompt) return false;
  const p = prompt.toLowerCase();
  
  // Informational patterns
  const informationalPatterns = [
    /^(?:what is|what are|explain|how does|how do|write an essay|tell me about the history of|overview of|define|difference between)\b/i,
    /^(?:ما هو|ما هي|ماذا يعني|اشرح|كيف يعمل|كيف تعمل|اكتب مقال|حدثني عن تاريخ|نبذة عن|تاريخ الساعات|ما مفهوم|ما معنى|ما الفرق بين)\b/i,
    /(?:in the 19th century|in history|history of watches|video compression work|how ai detectors work|humans have working and episodic memory|what is an exif header|how memory works in the human brain|دماغ الإنسان|في دماغ الإنسان|الذاكرة العشوائية)/i
  ];

  return informationalPatterns.some(pattern => pattern.test(p));
}
