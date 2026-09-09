/**
 * ============================================================================
 * Dynamic Parameter Tuning Engine (محرك الضبط الديناميكي للبارامترات والنوايا)
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 *
 * Core Responsibility:
 * 1. Deep Semantic User Intent & Request Deconstruction (فهم نية المستخدم وطلبه بدقة)
 * 2. Pre-Execution Model Hyperparameter Tuning (ضبط الإعدادات والقيم الصحيحة للنماذج الأصلية قبل البدء)
 * 3. Architecture-Specific Alignment (DeepSeek V4 Pro, Flash, Reasoner, Chat, Muse Spark, Vision, Magnum)
 * 4. Dynamic Cognitive Directive Injection (توجيه المعايرة التلقائية للنموذج)
 * ============================================================================
 */

export type UserIntentCategory =
  | 'CYBERSECURITY_AND_EXPLOIT_AUDITING'
  | 'CODE_ENGINEERING_AND_ARCHITECTURE'
  | 'SVG_VECTOR_STUDIO_AND_DESIGN'
  | 'NEURAL_IMAGE_STUDIO_AND_PROCESSING'
  | 'MATHEMATICAL_AND_DEDUCTIVE_LOGIC'
  | 'SCIENTIFIC_AND_ACADEMIC_RESEARCH'
  | 'FACTUAL_SEARCH_AND_REALTIME_GROUNDING'
  | 'COMPARATIVE_AND_EVALUATION_ANALYSIS'
  | 'TECHNICAL_DOCUMENTATION'
  | 'MULTIMODAL_IMAGE_AND_FORENSICS'
  | 'MULTIMODAL_MEDIA_AND_ARCHIVE_DECONSTRUCTION'
  | 'CREATIVE_LITERARY_AND_BRAINSTORMING'
  | 'UNINHIBITED_PERSONA_X1'
  | 'GENERAL_CONVERSATION_AND_QUICK_QA';

export type ModelFamily =
  | 'deepseek-pro'
  | 'deepseek-flash'
  | 'deepseek-reasoner'
  | 'deepseek-chat'
  | 'muse-spark'
  | 'deepseek-vision'
  | 'magnum'
  | 'generic';

export type TaskComplexity =
  | 'LIGHT'
  | 'STANDARD'
  | 'DEEP_ANALYTICAL'
  | 'EXHAUSTIVE_ARCHITECTURAL';

export type HallucinationRisk =
  | 'EXTREME'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW';

export interface TunedHyperparameters {
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stop?: string[];
  stream: boolean;
  // Official DeepSeek API Architecture (https://api-docs.deepseek.com/guides/thinking_mode)
  reasoning_effort?: 'low' | 'high' | 'max';
  thinking_mode?: 'enabled' | 'disabled';
  stream_options?: { include_usage: boolean };
}

export interface DynamicTuningRequest {
  userPrompt: string;
  conversationHistory?: Array<{ role: string; content: any }>;
  requestedModel: string;
  isX1Mode?: boolean;
  deepSearch?: boolean;
  hasMultimodalImages?: boolean;
  hasVideoOrAudio?: boolean;
  hasZipOrCodeFiles?: boolean;
  explicitTemperature?: number;
  userId?: string;
}

export interface PriorNeuralImageContext {
  prompt?: string;
  imageUrl?: string;
  operation?: string;
  title?: string;
  style?: string;
  aspectRatio?: string;
  seed?: number;
  sourceRole?: string;
}

export type ImageOperationType = 'edit' | 'addition' | 'generation';

export interface DynamicTuningResult {
  detectedIntent: UserIntentCategory;
  detectedImageOperation?: ImageOperationType;
  priorNeuralImage?: PriorNeuralImageContext | null;
  intentConfidence: number;
  complexityLevel: TaskComplexity;
  hallucinationRisk: HallucinationRisk;
  targetModelFamily: ModelFamily;
  hyperparameters: TunedHyperparameters;
  calibrationDirective: string;
  tuningRationale: string;
  telemetry: {
    intent: string;
    model: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    reasoningEffort?: 'low' | 'high' | 'max';
    thinkingMode?: 'enabled' | 'disabled';
    timestamp: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN MATCHER CATALOGUE (Dual Arabic & English Context Awareness)
// ─────────────────────────────────────────────────────────────────────────────

const CYBER_PATTERNS = [
  /(ثغرة|ثغرات|اختراق|بايلود|payload|exploit|cve|zero-day|0-day|rce|sqli|xss|csrf|ssrf|buffer\s*overflow|heap\s*overflow|reverse\s*engineering|هندسة\s*عكسية|تشفير|فك\s*تشفير|dpop|rfc\s*9449|jkt|jwk|jwks|nonce|envoy|kafka\s*kms|envelope\s*encryption|امتيازات|privilege\s*escalation|bypass|تجاوز\s*حماية|شيل|reverse\s*shell|metasploit|nmap|burp|wireshark|malware|تحليل\s*أمني|أمن\s*سيبراني|cybersecurity|red\s*team|blue\s*team|threat\s*model|تدقيق\s*أمني|هجوم|حقن|تصيد|تسريب)/i,
  /\b(vulnerability|vulnerabilities|exploit|payload|injection|penetration\s+testing|zero-day|zero\s+day|cve-\d+|poc|patch|auth\s+bypass|security\s+audit|dpop|stateless\s+nonce|jwk|envelope\s+encryption|buffer\s+overflow|privilege\s+escalation)\b/i
];

const CODE_ENGINEERING_PATTERNS = [
  /(كود|برمجة|دالة|كلاس|class|function|async|await|typescript|javascript|python|rust|golang|c\+\+|react|vue|node\.js|express|api|rest|graphql|database|sql|nosql|schema|docker|kubernetes|refactor|إعادة\s*هيكلة|تصحيح\s*خطأ|debug|syntax|ast|ring\s*buffer|lock-free|concurrency|multithreading|خوارزمية|algorithm|data\s*structure|مصفوفة|شجرة|tree|graph|git|pull\s*request|سكريبت|script|frontend|backend)/i,
  /\b(code|function|interface|refactor|debugging|typescript|python|rust|c\+\+|algorithms?|data\s+structures?|lock-free|ring\s+buffer|concurrency|deadlock|memory\s+leak|compiler|ast|sql\s+schema|unit\s+tests?|e2e\s+tests?)\b/i
];

const NEURAL_IMAGE_PATTERNS = [
  // 1. Inpainting / Object Recoloring
  /(?:غير|عدل|بدل|لون|صبغ|غيرلي|بدلي)\s+(?:لي\s+)?(?:لون\s+)?(?:القميص|البنطلون|الفستان|السيارة|العربية|الشعر|العين|العينين|الحذاء|الجاكيت|التيشيرت|المنتج|العنصر|الكائن|الكوب|العلبة|الخلفية|الباب|الجدار|اللون|الملابس|البدلة)/i,
  /\b(?:recolor|change\s+the\s+color\s+of|dye|paint\s+the)\b/i,

  // 2. Background Removal & Replacement
  /(?:احذف|شيل|ازالة|إزالة|عزل|اعزل|غير|بدل|تفريغ|فرغ)\s+(?:لي\s+)?(?:الخلفية|خلفية\s+الصورة|الباكجراوند)/i,
  /\b(?:remove\s+background|bg\s+remove|cutout|transparent\s+background|replace\s+background)\b/i,

  // 3. Person & Element Compositing (Combining people while preserving facial geometry)
  /(?:اضف|أضف|ادمج|حط|ركب|اجمع|دمج)\s+(?:لي\s+)?(?:شخصين|الشخصين|الصورتين|شخص\s+تاني|مع\s+بعض|جنب\s+بعض|صورة\s+شخص|وجه|ملامح|صورتي|الصورة\s+دي\s+مع)/i,
  /\b(?:composite|combine\s+two\s+people|merge\s+photos|add\s+person|place\s+next\s+to)\b/i,

  // 4. Super-Resolution & 2K/4K Quality Enhancement
  /(?:تحسين|حسن|وضح|توضيح|علي|علّي|ارفع|زوّد|تكبير|زيادة|فلترة)\s+(?:لي\s+)?(?:جودة\s+الصورة|دقة\s+الصورة|الملامح|الجودة|الدقة|ريزوليوشن|resolution|clarity|upscale|enhance|2k|4k|hd|uhd)/i,
  /\b(?:upscale|super\s*resolution|enhance\s+(?:image|photo|quality)|make\s+4k|make\s+2k|sharpen\s+image)\b/i,

  // 5. Product Mockup & Commercial Photo Editing
  /(?:صورة\s+منتج|عدل\s+المنتج|تعديل\s+صورة\s+المنتج|غير\s+صورة\s+المنتج|صورة\s+المنتج|علبة\s+المنتج|منتجات|mockup|product\s+photo|product\s+shot|e-commerce\s+photo)/i,

  // 6. Text Editing & Inpainting inside images
  /(?:غير|عدل|بدل|استبدل|احذف|امسح|عدلي|غيرلي)\s+(?:لي\s+)?(?:النص|الكلام|الكتابة|النصوص|الكلمة|الجملة)\s+(?:في\s+الصورة|المكتوب|المكتوبة|اللي\s+في\s+الصورة)/i,
  /\b(?:edit\s+text\s+in\s+image|replace\s+text|change\s+text\s+in\s+photo|inpaint\s+text)\b/i,

  // 7. General Photographic Manipulation on attached image
  /(?:عدل\s+على\s+الصورة|تعديل\s+الصورة|ظبط\s+الصورة|معالجة\s+الصورة|فلتر\s+للصورة|edit\s+this\s+photo|modify\s+this\s+image|inpaint)/i,

  // 8. Human Anatomy, Portrait Retouch & Facial Enhancement
  /(?:معالجة\s+الوجه|تعديل\s+الوجه|تعديل\s+الشخص|معالجة\s+البشر|تعديل\s+البشر|اصلاح\s+الملامح|تعديل\s+الملامح|تعديل\s+الجسم|تصحيح\s+اليد|تصحيح\s+الاصابع|تنقية\s+البشرة|مسام\s+البشرة|skin\s+retouch|face\s+retouch|portrait\s+enhancement|anatomy\s+fix|facial\s+features)/i
];

export const CONTEXTUAL_IMAGE_EDIT_PATTERNS = [
  /(?:غير|غيرلي|عدل|عدلي|تعديل|تغيير|بدل|بدلي|تبديل|استبدل|احذف|امسح|شيل|ازالة|إزالة|عزل|اعزل|خليه|خلها|اجعله|اجعلها|سوه|سوها|حول|تحويل|صبغ|لون|صلح|اصلاح|ظبط|edit|modify|change|replace|remove|recolor|restyle|inpaint)/i,
  /(?:عدل\s+عليها|غير\s+فيها|بدل\s+فيها|عدل\s+فيها|غير\s+لون|بدل\s+لون|عدل\s+لون|غير\s+شكل|بدل\s+شكل|غير\s+الخلفية|بدل\s+الخلفية|امسح\s+الـ|احذف\s+الـ|شيل\s+الـ|خليها\s+بالليل|خليه\s+بالليل|خليه\s+في\s+النهار|خليها\s+في\s+النهار|خليها\s+في\s+الليل)/i,
  /\b(?:edit\s+(?:it|this|the\s+image|the\s+photo)|modify\s+(?:it|this)|change\s+(?:it|the\s+color|the\s+background)|replace\s+the|remove\s+the|make\s+it\s+(?:night|day|red|blue|dark|bright))\b/i
];

export const CONTEXTUAL_IMAGE_ADDITION_PATTERNS = [
  /(?:ضيف|ضيفلي|اضف|أضف|إضافة|اضافة|حط|حطلي|حطله|حطلها|ضع|ركب|ركبلي|زود|زوّد|ادمج|اجمع|دخل|أدخل|دخلها|add|insert|put|append|include|combine)/i,
  /(?:ضيف\s+عليها|حط\s+عليها|ضيف\s+فيها|حط\s+فيها|ركب\s+عليها|زود\s+عليها|ضيف\s+جنب|حط\s+جنب|ضيف\s+مع|حط\s+مع|أضف\s+إلى|أضف\s+الي|إضافة\s+إلى|اضافة\s+الي)/i,
  /\b(?:add\s+(?:to\s+it|a\s+person|a\s+tree|an\s+object|rain|mist|car)|put\s+(?:on\s+it|next\s+to)|insert\s+into)\b/i
];

const NEURAL_IMAGE_GENERATION_PATTERNS = [
  /(?:صورة|صوره|خلفية\s+شاشة|خلفيه\s+شاشة|خلفية\s+الصورة|wallpaper|بورتريه|portrait)\s+(?:واقعية|فوتوغرافية|احترافية|عالية\s+الدقة|hd|4k|8k|فنية)/i,
  /(?:صمم|صممي|انشئ|أنشئ|ولد|توليد|اعمل|اعملي|سوي|سويلي|طلع|طلعلي|اريد|أريد|عايز|عاوز|بدي|محتاج|تخيل|ارسم|ارسمي|هات|جهز|صنع|create|generate|design|draw|make|render)\s+(?:لي\s+)?(?:صورة|صوره|خلفية\s+شاشة|خلفيه\s+شاشة|لوحة|بورتريه|photo|image|picture|wallpaper|portrait)/i,
  // Concise two-word queries: "صورة [noun]" (e.g. صورة سيارة، صورة فضاء، صورة اسد، صورة بحر، صورة بنت، صورة قطة)
  /^(?:صورة|صوره|خلفية\s+شاشة|خلفيه\s+شاشة|wallpaper|بورتريه|portrait)\s+[\p{L}\p{N}]+/iu,
  // Creation verbs directly on objects: "صمم سيارة"، "ارسم فضاء"، "تخيل كوكب"
  /(?:صمم|صممي|انشئ|أنشئ|ولد|توليد|اعمل|اعملي|سوي|سويلي|ارسم|ارسمي|تخيل)\s+(?:لي\s+)?(?:قطة|كلب|[أا]سد|نمر|طائر|عصفور|حيوان|شجرة|زهور|ورد|سيارة|عربية|طبيعة|منظر|[أا]شكال|شمس|غروب|شروق|قمر|بحر|فضاء|كوكب|رجل|شخص|وجه|بنت|طفل|بيت|مدينة|سفينة|طائرة|طبيعة\s*صامتة|قصر|مبنى|شارع|غرفة|ساعة|هاتف|كمبيوتر|روبوت|وحش|حصان|ذئب|فراشة|جبل|شاطئ|غابة)/i,
  /(?:صورة|صوره|خلفية\s+شاشة|خلفيه\s+شاشة|بورتريه|photo|image|picture)\s+(?:لـ|للـ|عن|فيها|تعبر\s+عن|جميلة|فنية|واقعية|احترافية|طبيعية|سينمائية|شخصية|متحركة|جديدة|hd|4k|8k)/i,
  /\b(?:generate\s+(?:an?\s+)?(?:image|photo|picture|wallpaper|portrait)|create\s+(?:an?\s+)?(?:image|photo|picture|wallpaper|portrait)|design\s+(?:an?\s+)?(?:image|photo|picture|wallpaper|portrait)|draw\s+(?:an?\s+)?(?:image|photo|picture)|image\s+of|photo\s+of|picture\s+of|photorealistic|realistic\s+photo|dslr\s+shot|hyperrealistic|realistic\s+portrait|realistic\s+human|realistic\s+person|generate\s+photo|create\s+photo)\b/i
];

const SVG_DESIGN_PATTERNS = [
  /<svg[\s\S]*?<\/svg>/i,
  /```svg/i,
  /(?=.*\b(?:svg|فيكتور|متجهات|شعاعي|vector)\b)(?=.*(?:تصميم|صمم|ارسم|رسم|رسمة|شعار|لوجو|ايقونة|أيقونة|أيقونات|كود|انشئ|أنشئ|اعمل|سوي|ولد|توليد|إنفوجرافيك|انفوجرافيك|رمز|شارة|طابع|زخرفة|تعديل|عدل|غير|بدل|design|logo|icon|art|vector|graphic|draw|create|generate|illustration|emblem|badge|diagram)).*/is,
  /(?:فيكتور|متجهات|شعاعي|vector\s*graphics?|vector\s*art|vector\s*illustration)/i,
  /\b(?:draw|create|generate|design)\s+(?:an?\s+)?(?:svg|vector)/i,
  /(?:كود\s*svg|ملف\s*svg|رسم\s*شعاعي|شكل\s*هندسي|تصميم\s*svg)/i,
  /(?:تصميم|صمم|ارسم|رسم|اعمل|سوي|ولد|توليد|انشئ|أنشئ|ابني|صنع|draw|design|create|generate)\s+(?:لي\s+)?(?:لوجو|شعار|ايقونة|أيقونة|أيقونات|شارة|رمز\s*بصري|إنفوجرافيك|انفوجرافيك|طابع|ختم|logo|icon|icons|emblem|badge|symbol|banner)(?!\s*(?:واقعي|فوتوغرافي|صورة|photo))/i,
  // Concise two-word queries: "لوجو كافيه"، "شعار شركة"، "ايقونة سحابية"
  /^(?:لوجو|شعار|ايقونة|أيقونة|شارة|رمز\s*بصري|logo|icon|icons|emblem|badge|symbol)\s+[\p{L}\p{N}]+/iu,
  /(?:لوجو|شعار|ايقونة|أيقونة)\s+(?:احترافي|حديث|فكتور|بصري|مبتكر|لـ|للـ|عن|بسيط|متقن)/i,
  /(?:ارسم|صمم)\s+(?:لي\s+)?(?:صورة\s+فيكتور|رسم\s+شعاعي)/i,
  /(?:غير|عدل|بدل|لون|اضف|أضف|احذف|شيل|حول|ضع|خليه|خلها|اجعله|اجعلها|سوه|سوها)\s+(?:لي\s+)?(?:الخلفية|خلفية|لون|الوان|ألوان|الألوان|الالوان|الشعار|اللوجو|الايقونة|الأيقونة|الفيكتور|التصميم|العنصر|الرمز|الكتابة|ذهبي|فضي|أبيض|ابيض|أسود|اسود|أحمر|احمر|أزرق|ازرق|أخضر|اخضر|شفاف|شفافة|نيون|داكن|مضيء|أغمق|أفتح)/i,
  /\b(?:change|modify|update|edit|recolor)\s+(?:the\s+)?(?:background|color|colors|logo|icon|svg|vector|style|design)\b/i
];

const MATH_DEDUCTIVE_LOGIC_PATTERNS = [
  /(مسألة\s*رياضية|معادلة|تكامل|تفاضل|جبر|نسبية\s*خاصة|نسبية\s*عامة|سرعة\s*الضوء|مفارقة\s*(?:التوأم|الجد)|ساعة\s*بيولوجية|لغز|أحجية|احجية|حزورة|استدلال\s*منطقي|برهان|proof|theorem|نظرية|اينشتاين|شرودنجر|كوانتم|حساب\s*دقيق|احسب\s*لي|احسب|فكم\s*ساعة\s*ستمر|كم\s*ساعة\s*ستمر|إذا\s*سافر|لو\s*سافر|تجربة\s*فكرية|أوجد\s*الناتج|كم\s*يساوي)/i,
  /\b(calculat(?:e|ion)|equation|integral|differential|linear\s+algebra|relativity|speed\s+of\s+light|twin\s+paradox|riddle|logic\s+puzzle|formal\s+proof|deductive\s+reasoning|thought\s+experiment|theorem|math\s+problem)\b/i
];

const SCIENTIFIC_RESEARCH_PATTERNS = [
  /(بحث\s*علمي|دراسة\s*علمية|ورقة\s*بحثية|جامعة|أبحاث\s*طبية|تشخيص\s*طبي|طب\s*بشري|علاج\s*طبي|لقاح|جينات|dna|rna|كيمياء|فيزياء\s*نووية|تلسكوب|مذنب|كويكب|ثقب\s*أسود|طاقة|جسيمات|أرشيف|arxiv|nature|lancet|peer-reviewed)/i,
  /\b(scientific\s+study|research\s+paper|clinical\s+trial|astrophysics|quantum\s+mechanics|genetics|dna|rna|crispr|biochemistry|particle\s+physics|exoplanet|arxiv|nature\s+journal)\b/i
];

const COMPARISON_PATTERNS = [
  /(قارن\s*بين|مقارنة\s*(?:بين)?|الفرق\s*بين|أيهما\s*(?:أفضل|أحسن|أقوى|أسرع|أدق)|مفاضلة|ضد|vs|versus|مواصفات|عيوب\s*ومميزات|مميزات\s*وعيوب|تقييم|benchmarks?|مراجعة\s*شاملة)/i,
  /\b(compare|comparison|difference\s+between|which\s+is\s+better|pros\s+and\s+cons|benchmark\s+vs|versus|head\s+to\s+head|buying\s+guide)\b/i
];

const CREATIVE_LITERARY_PATTERNS = [
  /(اكتب\s*(?:لي\s*)?(?:قصة|رواية|قصيدة|شعر|أبيات|خاطرة|سيناريو|حوار\s*خيالي)|قصيدة|شعر\s*فصيح|أبيات\s*شعرية|ألف\s*(?:لي)?|تخيل\s*أن|مشهد\s*درامي|وصف\s*أدبي|بلاغة|استعارة|roleplay|شخصية\s*خيالية)/i,
  /\b(write\s+a\s+(?:story|poem|novel|script|dialogue)|creative\s+writing|roleplay|fiction|imagine\s+that|brainstorm\s+ideas)\b/i
];

const EXPLICIT_CREATIVE_FRAMING = [
  /^(?:اكتب\s*(?:لي\s*)?(?:قصيدة|شعر|أبيات|قصة|رواية|سيناريو|خاطرة)|ألف\s*(?:لي)?\s*(?:قصة|قصيدة)|أنشئ\s*(?:لي\s*)?(?:قصيدة|قصة))/i,
  /\b(?:write\s+(?:me\s+)?a\s+(?:poem|story|novel|script)|compose\s+a\s+poem)\b/i
];

const GREETING_PATTERNS = [
  /^(مرحبا|اهلا|اهلاً|صباح\s*الخير|مساء\s*الخير|سلام\s*عليكم|السلام\s*عليكم|هاي|ازيك|عامل\s*ايه|كيف\s*حالك|hello|hi|hey|good\s+morning|good\s+evening)([\s,،]+(كيف\s*حالك|عامل\s*ايه|ازيك|اليوم|يا\s*(?:غالي|صديقي|بطل)|how\s+are\s+you|today|there))*\s*[.!؟?]?$/i
];

export class DynamicParameterTuner {
  /**
   * Resolves the underlying ModelFamily category from a string identifier.
   */
  public static resolveModelFamily(modelName: string): ModelFamily {
    const m = (modelName || '').toLowerCase().trim();

    // Check if specifically flash cyber before general cyber
    if (
      m.includes('flash-cyber') ||
      m.includes('flash-cyper') ||
      m === 'deepseek-v4-flash' ||
      m === 'deepseek/deepseek-v4-flash'
    ) {
      return 'deepseek-flash';
    }

    if (
      m.includes('quant') ||
      m.includes('pro-cyber') ||
      m.includes('pro-cyper') ||
      m.includes('cyber-ultra') ||
      m.includes('cyber-2.6') ||
      m.includes('cyper-2.6') ||
      m.includes('cyber-2.1') ||
      m.includes('cyper-2.1') ||
      m === 'deepseek-v4-pro' ||
      m === 'deepseek/deepseek-v4-pro' ||
      m === 'fathom-cyber-2.6' ||
      m === 'fathom-cyber-2.1' ||
      m === 'fathom-quant-3'
    ) {
      return 'deepseek-pro';
    }

    if (
      m === 'deepseek-reasoner' ||
      m.includes('reasoner') ||
      m.includes('r1') ||
      m === 'deepseek/deepseek-r1'
    ) {
      return 'deepseek-reasoner';
    }

    if (
      m === 'deepseek-chat' ||
      m.includes('chat') ||
      m.includes('deepseek-v3') ||
      m === 'deepseek/deepseek-chat'
    ) {
      return 'deepseek-chat';
    }

    if (m.includes('muse-spark') || m.includes('spark') || m.includes('fathom-spark')) {
      return 'muse-spark';
    }

    if (m.includes('vision') || m.includes('fathom-cam') || m.includes('cam')) {
      return 'deepseek-vision';
    }

    if (m.includes('magnum') || m === 'x1' || m.includes('x1-persona')) {
      return 'magnum';
    }

    return 'generic';
  }

  /**
   * Evaluates if a model qualifies as a Cyber Ultra flagship model (deepseek-v4-pro-cyber-2.6, fathom-cyber-2.6, etc.)
   */
  public static isCyberUltraModel(modelName: string): boolean {
    const m = (modelName || '').toLowerCase().trim();
    return (
      m.includes('pro-cyber') ||
      m.includes('pro-cyper') ||
      m.includes('cyber-ultra') ||
      m.includes('cyber-2.6-ultra') ||
      m.includes('quant-3') ||
      m.includes('fathom-quant') ||
      m === 'deepseek-v4-pro-cyber-2.6' ||
      m === 'deepseek-v4-pro-cyber-2.1' ||
      m === 'fathom-cyber-2.6' ||
      m === 'fathom-cyber-2.1' ||
      m === 'fathom-quant-3' ||
      m === 'deepseek-v4-pro' ||
      m === 'deepseek/deepseek-v4-pro'
    );
  }

  /**
   * Extracts the most recent neural image or uploaded image from conversation history.
   */
  public static extractPriorNeuralImage(
    history: Array<{ role: string; content: any }>
  ): PriorNeuralImageContext | null {
    if (!Array.isArray(history) || history.length === 0) return null;

    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const content = typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((c: any) => (c.type === 'text' ? (c.text || '') : (c.text || ''))).join(' ')
          : '';

      // 1. Check for ```neural-image ... ``` block in assistant message
      const neuralMatch = /```(?:neural-image|neural_image|image-studio|image_studio)?\s*(\{[\s\S]*?\})\s*```/i.exec(content);
      if (neuralMatch) {
        try {
          const parsed = JSON.parse(neuralMatch[1]);
          if (parsed && typeof parsed === 'object') {
            const prompt = parsed.prompt || '';
            let imageUrl = parsed.imageUrl || parsed.processedImage || '';

            // Extract seed from parsed JSON or its URL parameters
            let seed: number | undefined = (typeof parsed.seed === 'number' && !isNaN(parsed.seed))
              ? parsed.seed
              : (typeof parsed.parameters?.seed === 'number' && !isNaN(parsed.parameters.seed))
                ? parsed.parameters.seed
                : undefined;

            if (seed === undefined && imageUrl) {
              try {
                const u = new URL(imageUrl);
                const s = u.searchParams.get('seed');
                if (s && !isNaN(Number(s))) seed = Number(s);
              } catch {}
            }

            if (!imageUrl && prompt) {
              const activeModel = parsed.style === 'anime' ? 'flux-anime' : (parsed.style === '3d_render' ? 'flux-3d' : 'flux-realism');
              let w = 1024;
              let h = 1024;
              if (parsed.aspectRatio === '16:9') { w = 1344; h = 768; }
              else if (parsed.aspectRatio === '9:16') { w = 768; h = 1344; }
              else if (parsed.aspectRatio === '4:3') { w = 1152; h = 864; }
              const seedParam = seed !== undefined ? `&seed=${seed}` : '';
              imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=${w}&height=${h}&model=${activeModel}&nologo=true&enhance=true${seedParam}`;
            }
            return {
              prompt,
              imageUrl,
              operation: parsed.operation || 'generate',
              title: parsed.title || '',
              style: parsed.style || 'photorealistic',
              aspectRatio: parsed.aspectRatio || '1:1',
              seed,
              sourceRole: msg.role
            };
          }
        } catch {
          // continue
        }
      }

      // 2. Check for Pollinations URL in content
      const polliMatch = content.match(/https:\/\/image\.pollinations\.ai\/prompt\/([^\s?#)]+)(?:\?([^\s)]*))?/i);
      if (polliMatch) {
        let decodedPrompt = '';
        try {
          decodedPrompt = decodeURIComponent(polliMatch[1]);
        } catch {
          decodedPrompt = polliMatch[1];
        }
        let seed: number | undefined = undefined;
        if (polliMatch[2]) {
          try {
            const params = new URLSearchParams(polliMatch[2]);
            const s = params.get('seed');
            if (s && !isNaN(Number(s))) seed = Number(s);
          } catch {}
        }
        return {
          prompt: decodedPrompt,
          imageUrl: polliMatch[0],
          operation: 'generate',
          title: 'صورة سابقة',
          style: 'photorealistic',
          aspectRatio: '1:1',
          seed,
          sourceRole: msg.role
        };
      }

      // 3. Check for uploaded image in user message
      if (msg.role === 'user') {
        if (Array.isArray(msg.content)) {
          const imgItem = msg.content.find((c: any) => c.type === 'image_url' || c.image_url);
          if (imgItem) {
            const url = typeof imgItem.image_url === 'string' ? imgItem.image_url : imgItem.image_url?.url;
            if (url) {
              return {
                imageUrl: url,
                operation: 'human_edit',
                title: 'صورة مرفوعة',
                sourceRole: 'user'
              };
            }
          }
        }
        if ((msg as any).image || (msg as any).images?.length) {
          return {
            imageUrl: (msg as any).image || (msg as any).images[0],
            operation: 'human_edit',
            title: 'صورة مرفوعة',
            sourceRole: 'user'
          };
        }
      }
    }

    return null;
  }

  /**
   * Discerns whether the user intends to MODIFY an existing image (edit), ADD an element (addition),
   * or GENERATE a brand new image from scratch (generation).
   */
  public static detectImageOperationType(
    userPrompt: string,
    hasPriorImage: boolean
  ): ImageOperationType {
    const text = (userPrompt || '').trim().toLowerCase();

    // If no prior image exists, it is a brand new generation
    if (!hasPriorImage) {
      return 'generation';
    }

    // Explicit request for a completely separate or brand new image
    const isExplicitNewImage = /(?:صورة\s+جديدة|تصميم\s+جديد|صمم\s+(?:لي\s+)?صورة\s+جديدة|انشئ\s+(?:لي\s+)?صورة\s+جديدة|صورة\s+أخرى|صورة\s+اخري|new\s+image|another\s+image|from\s+scratch)/i.test(text);
    if (isExplicitNewImage) {
      return 'generation';
    }

    // Check for Addition (إضافة)
    const isAddition = CONTEXTUAL_IMAGE_ADDITION_PATTERNS.some(p => p.test(text));

    // Check for Edit / Modification (تعديل)
    const isEdit = CONTEXTUAL_IMAGE_EDIT_PATTERNS.some(p => p.test(text));

    if (isAddition && !isEdit) {
      return 'addition';
    }
    if (isEdit) {
      // If user says "عدل وضيف شجرة" (edit and add a tree), addition takes precedence as a new object is introduced
      if (isAddition && /(?:ضيف|اضف|أضف|حط|ركب)\s+(?:شجرة|شخص|طائر|قطة|كلب|سيارة|قمر|شمس|مطر|نظارة|كاب|ساعة|طاولة|كرسي|عنصر|تفصيل)/i.test(text)) {
        return 'addition';
      }
      return 'edit';
    }
    if (isAddition) {
      return 'addition';
    }

    // Fallback: short follow-up under an active image context (e.g. "لون أحمر", "بالليل", "بدون مطر")
    if (/(?:أحمر|احمر|أزرق|ازرق|أخضر|اخضر|أصفر|اصفر|أسود|اسود|أبيض|ابيض|ليل|نهار|غروب|شروق|ممطر|بدون|مع)/i.test(text)) {
      return 'edit';
    }

    return 'generation';
  }

  /**
   * Resilient normalization of neural-image blocks to guarantee zero-error adherence
   * to user terminology rules (replacing "إنشاء" with "تعديل" or "إضافة" based on detected intent).
   */
  public static normalizeNeuralImageBlock(
    text: string,
    operationType?: ImageOperationType,
    priorImageContext?: PriorNeuralImageContext
  ): string {
    if (!text || !operationType || operationType === 'generation') return text;

    return text.replace(
      /```(?:neural-image|neural_image|image-studio|image_studio)?\s*(\{[\s\S]*?\})\s*```/gi,
      (match, jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            const isAdd = operationType === 'addition';
            const prefix = isAdd ? 'إضافة' : 'تعديل';
            const expectedOp = isAdd ? 'add_element' : 'edit';

            // Sanitize title: cleanly strip any previous creation/edit prefix and reapply clean prefix
            if (typeof parsed.title === 'string') {
              let t = parsed.title.trim();
              t = t.replace(/^(?:إنشاء|انشاء|تصميم|توليد|صنع|create|generate|design)\s*[:：\-–—]?\s*/i, '');
              t = t.replace(/^(?:تعديل|إضافة|اضافة)\s*[:：\-–—]?\s*/i, '');
              t = `${prefix}: ${t}`.trim();
              parsed.title = t;
            } else {
              parsed.title = `${prefix}: ${isAdd ? 'إضافة عنصر إلى المشهد' : 'تعديل الصورة'}`;
            }

            // Sanitize operation
            if (parsed.operation === 'generate' || !parsed.operation) {
              parsed.operation = expectedOp;
            }

            // Inject original image link if missing or if filled with invalid placeholder string
            const isInvalidOrig = !parsed.originalImage ||
              typeof parsed.originalImage !== 'string' ||
              parsed.originalImage.includes('<') ||
              parsed.originalImage.includes('>') ||
              parsed.originalImage.startsWith('رابط') ||
              parsed.originalImage.startsWith('الصورة') ||
              (!parsed.originalImage.startsWith('http') && !parsed.originalImage.startsWith('data:image/'));

            if (isInvalidOrig && priorImageContext?.imageUrl) {
              parsed.originalImage = priorImageContext.imageUrl;
            }

            // Guarantee preservation of prior seed to lock environment and lighting 100%
            if (priorImageContext?.seed !== undefined) {
              parsed.seed = priorImageContext.seed;
            } else if (typeof parsed.seed !== 'number' || isNaN(parsed.seed)) {
              // Deterministic fallback seed
              parsed.seed = 482910;
            }

            // Ensure aspectRatio is maintained
            if (!parsed.aspectRatio && priorImageContext?.aspectRatio) {
              parsed.aspectRatio = priorImageContext.aspectRatio;
            }

            // Sanitize description
            if (typeof parsed.description === 'string' && (parsed.description.includes('تم إنشاء') || parsed.description.includes('تم توليد'))) {
              parsed.description = parsed.description
                .replace(/تم\s*إنشاء/g, isAdd ? 'تمت إضافة' : 'تم تعديل')
                .replace(/تم\s*توليد/g, isAdd ? 'تمت إضافة' : 'تم تعديل');
            }

            return `\`\`\`neural-image\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
          }
        } catch {
          // fallback
        }
        return match;
      }
    );
  }

  /**
   * Analyzes user request text, history and metadata to detect intent, complexity and hallucination risk.
   */
  public static detectIntentAndComplexity(request: DynamicTuningRequest): {
    intent: UserIntentCategory;
    confidence: number;
    complexity: TaskComplexity;
    hallucinationRisk: HallucinationRisk;
    rationale: string;
  } {
    const text = (request.userPrompt || '').trim();
    const isX1 = Boolean(request.isX1Mode);
    const hasImages = Boolean(request.hasMultimodalImages);
    const hasMediaOrZip = Boolean(request.hasVideoOrAudio || request.hasZipOrCodeFiles);

    // Multi-turn context extraction from conversation history
    const historySnippets = (request.conversationHistory || [])
      .slice(-4)
      .map(m => {
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.content)) return m.content.map((c: any) => c.text || '').join(' ');
        return JSON.stringify(m.content || '');
      })
      .filter(Boolean);
    const historyText = historySnippets.join(' ');
    const isFollowUpPrompt = text.length < 120 || /(وضح|اشرح|أكمل|أصلح|صلح|كيف|تابع|المزيد|تفاصيل|خطوة|explain|clarify|continue|fix|more|step)/i.test(text);

    // 1. Multimodal / Archive Priority
    if (hasMediaOrZip) {
      return {
        intent: 'MULTIMODAL_MEDIA_AND_ARCHIVE_DECONSTRUCTION',
        confidence: 0.98,
        complexity: 'EXHAUSTIVE_ARCHITECTURAL',
        hallucinationRisk: 'EXTREME',
        rationale: 'Active ZIP archives, multi-file repos, audio or video stream frames detected.'
      };
    }

    if (hasImages) {
      // 1. Explicit Vectorization to SVG Check (strictly requires explicit vector/svg keywords or tags)
      const isExplicitImageToSvgRequest = (
        /(?:svg|فيكتور|متجهات|vector|vectorize)/i.test(text) &&
        /(?:حول|تحويل|عدل|تعديل|غير|تغيير|بدل|تبديل|ادخل|أدخل|اضف|أضف|احذف|شيل|ارسم|صمم|اعمل|سوي|طلع|هات|convert|vectorize|transform|edit|modify|recreate|draw)/i.test(text)
      ) ||
      /<svg[\s\S]*?<\/svg>/i.test(text) ||
      /```svg/i.test(text) ||
      /(?:حول|تحويل)\s+(?:الصورة|اللوجو|الشعار)?\s*(?:دي|المرفقة|هذه)?\s*(?:لـ|إلى)?\s*(?:svg|فيكتور|متجهات)/i.test(text);

      if (isExplicitImageToSvgRequest) {
        return {
          intent: 'SVG_VECTOR_STUDIO_AND_DESIGN',
          confidence: 0.99,
          complexity: 'EXHAUSTIVE_ARCHITECTURAL',
          hallucinationRisk: 'HIGH',
          rationale: 'Explicit uploaded image vectorization to SVG Studio requested.'
        };
      }

      // 2. Cyber Ultra Sovereign Neural Image Studio & Processing (Inpainting, Recoloring, Background Removal, 4K Upscale, Compositing, Product/Text Edit)
      const isNeuralImageEditRequest = NEURAL_IMAGE_PATTERNS.some(p => p.test(text)) ||
        /(?:عدل|تعديل|غير|تغيير|بدل|تبديل|ادخل|أدخل|اضف|أضف|احذف|شيل)\s+(?:لي\s+)?(?:في\s+الصورة|على\s+الصورة|بالصورة|فيها|الصورة\s+المرفقة|الصورة\s+دي)/i.test(text);

      if (isNeuralImageEditRequest) {
        return {
          intent: 'NEURAL_IMAGE_STUDIO_AND_PROCESSING',
          confidence: 0.99,
          complexity: 'EXHAUSTIVE_ARCHITECTURAL',
          hallucinationRisk: 'LOW',
          rationale: 'Cyber Ultra Sovereign Neural Image Studio: raster photo editing, inpainting, recoloring, background removal, or 4K super-resolution.'
        };
      }

      return {
        intent: 'MULTIMODAL_IMAGE_AND_FORENSICS',
        confidence: 0.98,
        complexity: 'DEEP_ANALYTICAL',
        hallucinationRisk: 'EXTREME',
        rationale: 'Multimodal image payloads detected requiring optical OCR and forensics.'
      };
    }

    // Contextual Image Continuity: Check if user is editing or adding to a previously generated or uploaded image in history
    const priorNeuralImage = this.extractPriorNeuralImage(request.conversationHistory || []);
    const isContextualImageEditOrAdd = Boolean(priorNeuralImage) && (
      CONTEXTUAL_IMAGE_EDIT_PATTERNS.some(p => p.test(text)) ||
      CONTEXTUAL_IMAGE_ADDITION_PATTERNS.some(p => p.test(text)) ||
      NEURAL_IMAGE_PATTERNS.some(p => p.test(text))
    );

    if (isContextualImageEditOrAdd && !/(?:svg|فيكتور|متجهات|vector)/i.test(text)) {
      const op = this.detectImageOperationType(text, true);
      return {
        intent: 'NEURAL_IMAGE_STUDIO_AND_PROCESSING',
        confidence: 0.99,
        complexity: 'EXHAUSTIVE_ARCHITECTURAL',
        hallucinationRisk: 'LOW',
        rationale: `Contextual image continuity: ${op === 'addition' ? 'adding element' : 'modifying attribute'} on prior image while strictly preserving 100% of scene elements.`
      };
    }

    // 2. Pure Greeting / Casual check (only when no technical prompt follows)
    if (GREETING_PATTERNS.some(p => p.test(text))) {
      return {
        intent: 'GENERAL_CONVERSATION_AND_QUICK_QA',
        confidence: 0.99,
        complexity: 'LIGHT',
        hallucinationRisk: 'LOW',
        rationale: 'Casual greeting or pleasantry without analytical constraints.'
      };
    }

    // 3. Explicit Creative Literary Framing (Takes precedence even when technical topic is mentioned in poem/story)
    if (EXPLICIT_CREATIVE_FRAMING.some(p => p.test(text))) {
      return {
        intent: 'CREATIVE_LITERARY_AND_BRAINSTORMING',
        confidence: 0.95,
        complexity: 'STANDARD',
        hallucinationRisk: 'LOW',
        rationale: 'Explicit creative literary prose or poetry requested on subject matter.'
      };
    }

    // 4. Uninhibited X1 Persona Override (if explicitly active and not a technical prompt)
    const hasTechnicalKeywords = CYBER_PATTERNS.some(p => p.test(text)) ||
      CODE_ENGINEERING_PATTERNS.some(p => p.test(text)) ||
      MATH_DEDUCTIVE_LOGIC_PATTERNS.some(p => p.test(text));

    if (isX1 && !hasTechnicalKeywords) {
      return {
        intent: 'UNINHIBITED_PERSONA_X1',
        confidence: 0.95,
        complexity: 'STANDARD',
        hallucinationRisk: 'LOW',
        rationale: 'User engaged in Sovereign X1 uninhibited dialogue mode.'
      };
    }

    // 5. Comparative & Evaluation Check (Takes precedence when user explicitly requests comparison between entities)
    if (COMPARISON_PATTERNS.some(p => p.test(text))) {
      const isExhaustive = text.length > 200 || /(شامل|مفصل|تفصيلي|عميق|benchmarks?)/i.test(text);
      return {
        intent: 'COMPARATIVE_AND_EVALUATION_ANALYSIS',
        confidence: 0.95,
        complexity: isExhaustive ? 'DEEP_ANALYTICAL' : 'STANDARD',
        hallucinationRisk: 'MODERATE',
        rationale: 'Multi-entity product/technology comparison and structured tradeoff analysis.'
      };
    }

    // 6. Cybersecurity & Threat Modeling Check (with conversation history support)
    const matchesCyber = CYBER_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && CYBER_PATTERNS.some(p => p.test(historyText)));
    if (matchesCyber) {
      const combined = `${historyText} ${text}`;
      const isExhaustive = combined.length > 250 || /(شامل|كامل|RFC|envoy|kafka|dpop|architecture|معمارية)/i.test(combined);
      return {
        intent: 'CYBERSECURITY_AND_EXPLOIT_AUDITING',
        confidence: 0.98,
        complexity: isExhaustive ? 'EXHAUSTIVE_ARCHITECTURAL' : 'DEEP_ANALYTICAL',
        hallucinationRisk: 'EXTREME',
        rationale: 'Cybersecurity vulnerability audit, exploit engineering, or zero-trust architecture requested.'
      };
    }

    // 6.b. Cyber Ultra & Fathom Quant Neural Image Studio & Photorealistic Generation Check
    const isSvgHistoryFollowup = /(?:```svg|<svg)/i.test(historyText);
    const isCodeOrHowToQuery = /(?:كود|برمجة|دالة|مكتبة|بايثون|جافاسكريبت|رياكت|api|endpoint|code|script|component|function)\b/i.test(text) ||
      /^(?:كيف|طريقة|شرح|اشرح|لماذا|ليه|ما\s*هو|ما\s*هي|ماذا\s*يعني|ما\s*الفرق|how\s+to|explain|why|what\s+is)\b/i.test(text);
    const hasExplicitCreateCmd = /(?:صمم|صممي|انشئ|أنشئ|ولد|توليد|اعمل|اعملي|سوي|سويلي|طلع|طلعلي|اريد|أريد|عايز|عاوز|بدي|محتاج|تخيل|ارسم|ارسمي|هات|جهز|صنع|create|generate|design|draw|make|render)\s+(?:لي\s+)?(?:صورة|صوره|خلفية|خلفيه|لوحة|بورتريه|photo|image|picture|wallpaper|portrait)/i.test(text);

    const matchesNeuralGen = (!isCodeOrHowToQuery || hasExplicitCreateCmd) && (
      NEURAL_IMAGE_GENERATION_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && !isSvgHistoryFollowup && NEURAL_IMAGE_GENERATION_PATTERNS.some(p => p.test(historyText)))
    );

    if (matchesNeuralGen && !/(?:svg|فيكتور|متجهات|vector)/i.test(text) && !(isSvgHistoryFollowup && /(?:الشعار|اللوجو|الايقونة|الأيقونة|الفيكتور|التصميم|الخلفية|لون|الوان|ألوان|ذهبي|فضي)/i.test(text))) {
      return {
        intent: 'NEURAL_IMAGE_STUDIO_AND_PROCESSING',
        confidence: 0.98,
        complexity: 'EXHAUSTIVE_ARCHITECTURAL',
        hallucinationRisk: 'LOW',
        rationale: 'Cyber Ultra / Fathom Quant Sovereign Neural Image Studio: photorealistic raster photo generation requested.'
      };
    }

    // 7. SVG Vector Studio & Design Check (prioritized before generic code engineering)
    // Strict Guard: If it's a general image query without svg/vector keywords, it must NOT trigger SVG!
    const isImageQueryWithoutSvg = !/(?:svg|فيكتور|متجهات|شعاعي|vector)/i.test(text) && (
      /(?:صورة|صوره|photo|image|picture|خلفية\s+شاشة|خلفيه\s+شاشة|wallpaper|بورتريه|portrait)/i.test(text) ||
      /(?:صمم|صممي|انشئ|أنشئ|ولد|توليد|اعمل|اعملي|سوي|سويلي|طلع|طلعلي|اريد|أريد|عايز|عاوز|بدي|محتاج|تخيل|ارسم|ارسمي|هات|جهز|صنع)\s+(?:لي\s+)?(?:صورة|صوره|خلفية\s+شاشة|لوحة|بورتريه)/i.test(text)
    );

    const matchesSvg = !isImageQueryWithoutSvg && (
      SVG_DESIGN_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && SVG_DESIGN_PATTERNS.some(p => p.test(historyText)))
    );
    if (matchesSvg) {
      const combined = `${historyText} ${text}`;
      const isExhaustive = combined.length > 150 || /(شامل|مفصل|معقد|تفصيلي|مشهد|بانوراما|landscape|detailed|infographic)/i.test(combined);
      return {
        intent: 'SVG_VECTOR_STUDIO_AND_DESIGN',
        confidence: 0.98,
        complexity: isExhaustive ? 'EXHAUSTIVE_ARCHITECTURAL' : 'DEEP_ANALYTICAL',
        hallucinationRisk: 'HIGH',
        rationale: 'SVG vector illustration, vector logo, icon set, or visual vector graphic generation requested.'
      };
    }

    // 8. Mathematical & Deductive Logic Check (with conversation history support - prioritized before code engineering)
    const matchesMath = MATH_DEDUCTIVE_LOGIC_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && MATH_DEDUCTIVE_LOGIC_PATTERNS.some(p => p.test(historyText)));
    if (matchesMath) {
      return {
        intent: 'MATHEMATICAL_AND_DEDUCTIVE_LOGIC',
        confidence: 0.96,
        complexity: 'DEEP_ANALYTICAL',
        hallucinationRisk: 'EXTREME',
        rationale: 'Formal deductive logic puzzle, mathematical derivation, or theoretical physics constraint.'
      };
    }

    // 9. Code Engineering & Architecture Check (with conversation history support)
    const matchesCode = CODE_ENGINEERING_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && CODE_ENGINEERING_PATTERNS.some(p => p.test(historyText)));
    if (matchesCode) {
      const combined = `${historyText} ${text}`;
      const isExhaustive = combined.length > 200 || /(معمارية|بنية|مكتبة|مكتبات|مشروع|refactor|architecture)/i.test(combined);
      return {
        intent: 'CODE_ENGINEERING_AND_ARCHITECTURE',
        confidence: 0.95,
        complexity: isExhaustive ? 'EXHAUSTIVE_ARCHITECTURAL' : 'DEEP_ANALYTICAL',
        hallucinationRisk: 'EXTREME',
        rationale: 'Software development, concurrency, AST refactoring, or algorithmic implementation requested.'
      };
    }

    // 10. Scientific & Academic Research Check (with conversation history support)
    const matchesScience = SCIENTIFIC_RESEARCH_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && SCIENTIFIC_RESEARCH_PATTERNS.some(p => p.test(historyText)));
    if (matchesScience) {
      return {
        intent: 'SCIENTIFIC_AND_ACADEMIC_RESEARCH',
        confidence: 0.94,
        complexity: 'DEEP_ANALYTICAL',
        hallucinationRisk: 'HIGH',
        rationale: 'Academic science, astrophysics, genomics, or empirical clinical inquiry.'
      };
    }

    // 11. Creative Literary Check
    if (CREATIVE_LITERARY_PATTERNS.some(p => p.test(text))) {
      return {
        intent: 'CREATIVE_LITERARY_AND_BRAINSTORMING',
        confidence: 0.90,
        complexity: 'STANDARD',
        hallucinationRisk: 'LOW',
        rationale: 'Creative literary prose, poetry, narrative fiction, or brainstorming requested.'
      };
    }

    // 12. Deep Search or Realtime Grounding Check
    const hasFactualTrigger = /(سعر|أخبار|اسعار|مؤتمر|طقس|مباراة|احداث|حدث|نتائج)/i.test(text) ||
      (/(اليوم|الان|2026|حالياً)/i.test(text) && !/(كيف\s*حالك|عامل\s*ايه|ازيك|صباح|مساء)/i.test(text));
    if (request.deepSearch || hasFactualTrigger) {
      return {
        intent: 'FACTUAL_SEARCH_AND_REALTIME_GROUNDING',
        confidence: 0.92,
        complexity: 'STANDARD',
        hallucinationRisk: 'HIGH',
        rationale: 'Real-time factual grounding, live search synthesis, or current event verification.'
      };
    }

    // Default Fallback
    const isLong = text.length > 150;
    return {
      intent: isLong ? 'TECHNICAL_DOCUMENTATION' : 'GENERAL_CONVERSATION_AND_QUICK_QA',
      confidence: 0.80,
      complexity: isLong ? 'STANDARD' : 'LIGHT',
      hallucinationRisk: 'MODERATE',
      rationale: isLong ? 'Standard technical or factual inquiry.' : 'Conversational dialogue.'
    };
  }

  /**
   * Dynamically tunes hyperparameters specifically calibrated to the foundation model architecture
   * and the decomposed user intent.
   */
  public static tuneHyperparameters(
    intent: UserIntentCategory,
    complexity: TaskComplexity,
    modelFamily: ModelFamily,
    overrides?: { explicitTemperature?: number }
  ): TunedHyperparameters {
    // Default base tuning
    let temperature = 0.5;
    let top_p = 0.95;
    let frequency_penalty = 0.0;
    let presence_penalty = 0.0;
    let max_tokens = 16384;
    const stop: string[] = [];

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT-DRIVEN HYPERPARAMETER CALIBRATION
    // ─────────────────────────────────────────────────────────────────────────
    switch (intent) {
      case 'CYBERSECURITY_AND_EXPLOIT_AUDITING':
        // Zero-deviation determinism: low temperature to eliminate imaginary CVEs/flaws
        temperature = 0.20;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 32768; // Full depth for complete PoC and remediation
        break;

      case 'CODE_ENGINEERING_AND_ARCHITECTURE':
        // High syntactic fidelity and exactness
        temperature = 0.18;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 32768;
        break;

      case 'SVG_VECTOR_STUDIO_AND_DESIGN':
        // Optimal balance: visual creativity + precise mathematical vector coordinates & XML tags
        temperature = 0.38;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 24576;
        break;

      case 'NEURAL_IMAGE_STUDIO_AND_PROCESSING':
        // High-fidelity raster photo manipulation, surgical inpainting and super-resolution
        temperature = 0.35;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 16384;
        break;

      case 'MATHEMATICAL_AND_DEDUCTIVE_LOGIC':
        // Minimum entropy to prevent logic branch wandering
        temperature = 0.15;
        top_p = 0.90;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 32768;
        break;

      case 'MULTIMODAL_IMAGE_AND_FORENSICS':
      case 'MULTIMODAL_MEDIA_AND_ARCHIVE_DECONSTRUCTION':
        // High forensic accuracy, exact OCR and archive table matching
        temperature = 0.15;
        top_p = 0.90;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 16384;
        break;

      case 'SCIENTIFIC_AND_ACADEMIC_RESEARCH':
        temperature = 0.25;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 24576;
        break;

      case 'FACTUAL_SEARCH_AND_REALTIME_GROUNDING':
        // Grounded tightly to live search results
        temperature = 0.25;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 16384;
        break;

      case 'COMPARATIVE_AND_EVALUATION_ANALYSIS':
        temperature = 0.30;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 16384;
        break;

      case 'TECHNICAL_DOCUMENTATION':
        temperature = 0.25;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = 16384;
        break;

      case 'CREATIVE_LITERARY_AND_BRAINSTORMING':
        // Elevated entropy for rich linguistic prose and poetic diversity
        temperature = 0.80;
        top_p = 0.96;
        frequency_penalty = 0.05;
        presence_penalty = 0.05;
        max_tokens = 16384;
        break;

      case 'UNINHIBITED_PERSONA_X1':
        temperature = 0.82;
        top_p = 0.96;
        frequency_penalty = 0.05;
        presence_penalty = 0.05;
        max_tokens = 32768;
        break;

      case 'GENERAL_CONVERSATION_AND_QUICK_QA':
      default:
        temperature = 0.60;
        top_p = 0.95;
        frequency_penalty = 0.0;
        presence_penalty = 0.0;
        max_tokens = complexity === 'LIGHT' ? 4096 : 8192;
        break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODEL-FAMILY ARCHITECTURAL ADJUSTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    switch (modelFamily) {
      case 'deepseek-pro':
        // Ultra Sovereign Reasoning Engine: deep deductive logic, high precision, zero hallucination
        if (complexity === 'EXHAUSTIVE_ARCHITECTURAL' || intent === 'CYBERSECURITY_AND_EXPLOIT_AUDITING') {
          max_tokens = 32768;
        }
        if (intent === 'MATHEMATICAL_AND_DEDUCTIVE_LOGIC') {
          temperature = 0.10;
          top_p = 0.90;
          frequency_penalty = 0.0;
        }
        break;

      case 'deepseek-flash':
        // Flash Ultra-Velocity Engine: Sub-second TTFT, peak token efficiency, high signal-to-noise ratio
        if (complexity === 'LIGHT') {
          max_tokens = 4096;
        } else if (complexity === 'STANDARD') {
          max_tokens = 8192;
        } else {
          max_tokens = Math.min(max_tokens, 16384);
        }
        // Dampen temperature to prevent speed-induced hallucinations and ensure compact output
        if (intent !== 'CREATIVE_LITERARY_AND_BRAINSTORMING' && intent !== 'UNINHIBITED_PERSONA_X1') {
          temperature = Math.min(temperature, 0.70);
        } else {
          temperature = Math.min(temperature, 0.85);
        }
        frequency_penalty = Math.max(frequency_penalty, 0.04);
        break;

      case 'deepseek-reasoner':
        // DeepSeek Reasoner manages reasoning temperature internally
        // Ensure max_tokens is generous
        max_tokens = 32768;
        break;

      case 'deepseek-chat':
        // DeepSeek V3 chat: strictly capped at official 8192 token limit
        max_tokens = Math.min(max_tokens, 8192);
        break;

      case 'muse-spark':
        // Meta Muse Spark 1.2 multimodal & archive specialist
        max_tokens = 16384;
        break;

      case 'deepseek-vision':
        // Optical Forensics
        max_tokens = 16384;
        temperature = Math.min(temperature, 0.30);
        break;

      case 'magnum':
        // Magnum 72B creative model
        temperature = Math.max(temperature, 0.80);
        top_p = 0.96;
        break;

      default:
        break;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEEPSEEK OFFICIAL THINKING MODE & EFFORT CALIBRATION
    // (Extracted from https://api-docs.deepseek.com/guides/thinking_mode)
    // ─────────────────────────────────────────────────────────────────────────
    let thinking_mode: 'enabled' | 'disabled' = 'enabled';
    let reasoning_effort: 'low' | 'high' | 'max' = 'high';

    if (intent === 'SVG_VECTOR_STUDIO_AND_DESIGN') {
      // SVG Studio strictly enforces direct code output; disabling thinking mode
      // saves thousands of tokens and delivers instantaneous vector rendering.
      thinking_mode = 'disabled';
      reasoning_effort = 'low';
    } else if (complexity === 'LIGHT' || intent === 'GENERAL_CONVERSATION_AND_QUICK_QA') {
      // Light queries / greetings: minimal reasoning effort for sub-second TTFT and peak token economy
      thinking_mode = 'enabled';
      reasoning_effort = 'low';
    } else if (
      modelFamily === 'deepseek-reasoner' ||
      complexity === 'EXHAUSTIVE_ARCHITECTURAL' ||
      intent === 'CYBERSECURITY_AND_EXPLOIT_AUDITING' ||
      intent === 'MATHEMATICAL_AND_DEDUCTIVE_LOGIC'
    ) {
      // Deep deductive chains: maximal reasoning effort for exhaustive audits & mathematical rigor
      thinking_mode = 'enabled';
      reasoning_effort = 'max';
    } else {
      // Standard tasks: optimal high reasoning effort
      thinking_mode = 'enabled';
      reasoning_effort = 'high';
    }

    // Apply explicit temperature override if specified within safe limits
    if (typeof overrides?.explicitTemperature === 'number' && !isNaN(overrides.explicitTemperature)) {
      temperature = Math.max(0.0, Math.min(1.5, overrides.explicitTemperature));
    }

    return {
      temperature: Number(temperature.toFixed(2)),
      top_p: Number(top_p.toFixed(2)),
      frequency_penalty: Number(frequency_penalty.toFixed(2)),
      presence_penalty: Number(presence_penalty.toFixed(2)),
      max_tokens,
      stop: stop.length > 0 ? stop : undefined,
      stream: true,
      reasoning_effort,
      thinking_mode,
      stream_options: { include_usage: true }
    };
  }

  /**
   * Produces an adaptive Cognitive Alignment Directive that injects the identified
   * user intent and strict quality invariants directly into the active prompt.
   */
  public static generateCalibrationDirective(
    intent: UserIntentCategory,
    complexity: TaskComplexity,
    params: TunedHyperparameters,
    modelFamily: ModelFamily,
    requestedModel?: string,
    contextOptions?: {
      userPrompt?: string;
      conversationHistory?: Array<{ role: string; content: any }>;
      priorNeuralImage?: PriorNeuralImageContext | null;
      subIntent?: ImageOperationType;
    }
  ): string {
    const isUltra = (requestedModel && this.isCyberUltraModel(requestedModel)) || modelFamily === 'deepseek-pro';

    const priorImage = contextOptions?.priorNeuralImage !== undefined
      ? contextOptions.priorNeuralImage
      : (contextOptions?.conversationHistory ? this.extractPriorNeuralImage(contextOptions.conversationHistory) : null);
    const subIntent = contextOptions?.subIntent !== undefined
      ? contextOptions.subIntent
      : this.detectImageOperationType(contextOptions?.userPrompt || '', Boolean(priorImage));

    const isContextualAddition = intent === 'NEURAL_IMAGE_STUDIO_AND_PROCESSING' && subIntent === 'addition' && Boolean(priorImage);
    const isContextualEdit = intent === 'NEURAL_IMAGE_STUDIO_AND_PROCESSING' && subIntent === 'edit' && Boolean(priorImage);

    const intentLabelMap: Record<UserIntentCategory, { ar: string; mode: string; directive: string }> = {
      CYBERSECURITY_AND_EXPLOIT_AUDITING: {
        ar: 'التدقيق الأمني السيبراني وهندسة الثغرات والاختراق الأخلاقي',
        mode: 'SOVEREIGN_OFFENSIVE_AND_DEFENSIVE_APPSEC',
        directive: 'تحليل دقيق للثغرات، نمذجة التهديدات، تقديم شفرات استغلال PoC حقيقية مقترنة فوراً بالترقيع الأمني والتحصين المنيع، وتطبيق معايير DPoP RFC 9449، Envoy، وKafka KMS.'
      },
      CODE_ENGINEERING_AND_ARCHITECTURE: {
        ar: 'هندسة البرمجيات، المعمارية الموزعة، والأكواد الإنتاجية الصارمة',
        mode: 'ENTERPRISE_PRODUCTION_ENGINEERING',
        directive: 'كتابة أكواد برمجية متكاملة تماماً بدون أي اختصارات أو تعليقات استبدالية (zero placeholders)، تطبيق مبادئ SOLID وDRY، معالجة استثنائية للحالات الحدية، وضمان خلو الأنظمة من التسريبات وحلقات التعليق.'
      },
      SVG_VECTOR_STUDIO_AND_DESIGN: {
        ar: 'استوديو تصميم الفيكتور ورسومات الـ SVG فائقة الجودة والدقة',
        mode: 'SOVEREIGN_SVG_VECTOR_STUDIO',
        directive: 'أنت مهندس ومصمم فيكتور ومصور بصري فائق الاحترافية والدقة (Principal Vector Architect): ' +
          '1) بروتوكول الإنتاج المباشر الصارم (Strict Zero-Thinking & Direct Code Output - Zero Preamble): يُحظر تماماً كتابة أي تفكير أو مسودات كود أو نصوص حوارية تمهيدية أو رموز داخل <think>...</think>. ابدأ فوراً ومباشرةً بإنتاج كود الـ SVG النقي داخل وسم الماركداون: ```svg\\n<svg ...>\\n...\\n</svg>\\n```. ' +
          '2) نطاق العمل المخصص (Vector Studio Scope): هذا الاستوديو مخصص حصراً لرسومات المتجهات، الشعارات (Logos)، الأيقونات (Icons)، والـ SVG. يُحظر تماماً توليد كود SVG لطلبات الصور الفوتوغرافية أو الواقعية أو طلبات توليد الصور العامة (مثل "صمم صورة"، "انشئ صورة"، "صورة لـ...")؛ طلبات الصور الواقعية مخصصة حصراً للاستوديو العصبي ومحرك FLUX.1 [schnell]. ' +
          '3) المواصفات القياسية الإلزامية: يجب أن يتضمن الـ SVG دائماً: xmlns="http://www.w3.org/2000/svg"، أبعاد مرنة متجاوبة عبر viewBox="0 0 W H" مع width="100%" و height="100%". ' +
          '4) استخدم عناصر الفيكتور الحديثة باحترافية: التدرجات اللونية داخل <defs> عبر <linearGradient> و <radialGradient>، فلاتر التوهج والظلال الناعمة <filter id="...">، الأشكال الهندسية والمسارات المنحنية المتقنة <path>، والمجموعات الدلالية المنظمة <g id="...">. ' +
          '5) يُحظر تماماً استخدام روابط لصور خارجية أو خطوط غير مدمجة لضمان إمكانية التحويل والتنزيل الفوري إلى صورة PNG أو JPG عالية الدقة بدون أي مشاكل أو تلف في الـ Canvas. ' +
          '6) احرص أن تكون الرسمة مكتملة ومغلقة هندسياً وجمالياً بدون أي قطع أو أجزاء مبتورة وتجنب طباعة أي رموز غريبة أو شفرات عشوائية أو نصوص خارج وسم الماركداون. ' +
          '7) عند طلب أي تعديل على تصميم سابق (مثل تغيير الخلفية، تعديل الألوان، إضافة عنصر، تعديل تفاصيل، تبديل الخطوط)، افهم المطلوب بدقة تامة وطبّق التعديل المطلوب على كود الـ SVG السابق مع الحفاظ على تناسق وجمالية بقية العناصر، وأخرج كود الـ SVG المعدل فوراً داخل ```svg دون أي حشو أو كلام جانبي. ' +
          '8) بروتوكول تحويل الصور المرفوعة إلى فيكتور وتعديلها بدقة فائقة مع الحفاظ الصارم على هوية وهيكل الصورة (Image-to-SVG High-Fidelity Reconstruction & Surgical Editing): عند إرفاق صورة للمحادثة والمطالبة صراحة بتحويلها إلى فيكتور: ' +
          'أ) [الحفاظ الصارم والمطلق على هوية وهيكل وموضوع الصورة الأصلية بنسبة 100% - Strict Original Geometry & Subject Preservation]: افحص محتوى الصورة واستوعب بنيتها البصرية بدقة؛ يُحظر تماماً وبشكل قاطع تغيير شكل الكائن أو الشخص أو الشعار الأصلي أو استبداله برسمة بديلة. ' +
          'ب) [التعديل الانتقائي الدقيق]: طبّق فقط وحصراً التعديل الجزئي أو الإضافة أو الحذف أو تغيير الألوان الذي طلبه المستخدم حرفياً، مع بقاء كافة عناصر وتفاصيل الصورة الأصلية سليمة 100%. ' +
          'ج) أخرج كود الـ SVG النقي المكتمل والطبقي فوراً داخل ```svg دون أي تفكير أو كلام تمهيدي. ' +
          '9) بروتوكول الاستعانة ببيانات البحث البصري (Visual Search Grounding): استخلص السمات والألوان الدقيقة وصغها مباشرة داخل كود الـ SVG لإنشاء عمل فني استثنائي. ' +
          '10) [بروتوكول التخطيط المعماري الذاتي للمتجهات للطلبات المقتضبة - Autonomous Vector Planning for Brief Prompts]: عند كتابة المستخدم طلباً مقتضباً أو من كلمتين (مثل "لوجو كافيه"، "شعار شركة"، "ايقونة سحابية"، "شارة أمان"): يُحظر تماماً طلب استفسارات أو تقديم تصاميم بدائية؛ بل خطط ونفذ فوراً تصميماً متجهياً متكاملاً جاهزاً للإنتاج: نسب ذهبية هندسية متوازنة، مسارات منحنية متناسقة <path>، تدرجات لونية عصرية متناغمة داخل <defs> عبر <linearGradient>، ظلال ناعمة <filter>، وviewBox متجاوب مع width="100%" و height="100%".'
      },
      NEURAL_IMAGE_STUDIO_AND_PROCESSING: {
        ar: isContextualAddition
          ? 'استوديو الإضافة البصرية العصبية وحفظ المشهد بنسبة 100% (Sovereign Image Addition Studio)'
          : isContextualEdit
          ? 'استوديو التعديل الجراحي العصبي وحفظ المشهد بنسبة 100% (Sovereign Surgical Image Editing Studio)'
          : 'استوديو المعالجة العصبية وتوليد وتعديل الصور الفائق (FLUX.1 [schnell] & Fathom Quant 3 Neural Image Studio)',
        mode: isContextualAddition
          ? 'SOVEREIGN_IMAGE_ADDITION_AND_100_PERCENT_PRESERVATION'
          : isContextualEdit
          ? 'SOVEREIGN_SURGICAL_IMAGE_EDITING_AND_100_PERCENT_PRESERVATION'
          : 'CYBER_ULTRA_NEURAL_IMAGE_STUDIO',
        directive: isUltra
          ? (isContextualEdit || isContextualAddition)
            ? (
              `أنت المعماري والمهندس السيادي للـ ${isContextualAddition ? 'إضافة' : 'تعديل'} البصرية الجراحية للصور (Sovereign Contextual Image ${isContextualAddition ? 'Addition' : 'Editing'} Architect): ` +
              `1) [الفهم السياقي الصارم والتفريق الحاسم بين ${isContextualAddition ? 'الإضافة' : 'التعديل'} والإنشاء]: المستخدم يطلب صراحة ${isContextualAddition ? 'إضافة عنصر إلى' : 'تعديل خاصية في'} صورة تم تصميمها مسبقاً في المحادثة وليس إنشاء صورة جديدة من الصفر. ` +
              `2) [الحظر الصارم والقطعي لمصطلح "إنشاء" أو "تصميم جديد"]: يُحظر تماماً وبشكل قاطع كتابة "إنشاء" أو "تصميم جديد" أو "توليد صورة جديدة" في أي موضع من ردك؛ بل يجب حتماً وصراحة استخدام كلمة "${isContextualAddition ? 'إضافة' : 'تعديل'}" في كافة العناوين والشروح وصلب الرد. ` +
              `3) [قاعدة العنوان الإلزامية في كتلة المعالجة العصبية]: يجب أن يبدأ حقل "title" داخل كتلة \`\`\`neural-image\`\`\` حتماً وبشكل صريح بـ: "${isContextualAddition ? 'إضافة: ' : 'تعديل: '}[تفاصيل ال${isContextualAddition ? 'إضافة' : 'تعديل'} المطلوبة باللغة العربية]" (مثال: "${isContextualAddition ? 'إضافة: شخص يقف بجانب السيارة' : 'تعديل: تغيير لون السيارة إلى الأحمر'}"). ` +
              `4) [قاعدة حقل العملية operation في JSON]: عيّن حقل "operation" حتماً كـ "${isContextualAddition ? 'add_element' : 'edit'}"${!isContextualAddition ? ' (أو "recolor" إذا كان التعديل تغييراً للون فقط)' : ' (أو "composite" إذا كان دمجاً لعناصر)'}. ` +
              `5) [قاعدة الشرح باللغة العربية]: في حقل "description" وفي صلب الرد بعد </think>، ابدأ صراحة بـ "${isContextualAddition ? 'تمت إضافة' : 'تم تعديل'} [العنصر المستهدف]..." واشرح بدقة وبلاغة ما تم تنفيذه مع التأكيد على الحفاظ على هوية وتكوين الصورة الأصلية. ` +
              `6) [الحفظ الصارم والمطلق لعناصر وتكوين الصورة الأصلية بنسبة 100% ومعالم البيئة والمكان دون أي تغيير عدا المطلوب - Zero Unwanted Alterations]: ` +
              (priorImage?.prompt
                ? `البرومبت البصري الدقيق للصورة السابقة في الشات هو:\n"""${priorImage.prompt.trim()}"""\n` +
                  `[أمر سيادي حاسم لمنع أي تغيير في معالم البيئة أو المكان]: يُحظر تماماً وبشكل مطلق إعادة ابتكار المشهد من الصفر، أو تغيير نوع الكائن أو موديل السيارة أو ملامح الشخص أو الخلفية أو المكان أو زاوية الكاميرا أو نوع العدسة أو الإضاءة إذا لم يطلب المستخدم ذلك! ` +
                  `يجب عليك حتماً نقل واستخدام نفس رقم الـ seed السابق (${priorImage.seed !== undefined ? priorImage.seed : 482910}) لحفظ بنية الضوضاء العصبية واستقرار المشهد، وأخذ البرومبت الأصلي السابق بالكامل مع إبقاء كافة أوصاف البيئة والمكان والشارع والإضاءة متطابقة 100%، وتطبيق ال${isContextualAddition ? 'إضافة' : 'تعديل'} المطلوبة جراحياً فقط على الكلمة أو العبارة المستهدفة (مثال: ${isContextualAddition ? 'إضافة الكائن المطلوب في موقعه الصحيح داخل المشهد السابق مع إبقاء بقية النص الإنجليزي متطابقاً 100%' : 'استبدال لون الطلاء فقط من الأسود إلى الأحمر مع إبقاء كافة أوصاف السيارة والشارع والمطر متطابقة 100%'}). `
                : `حافظ بنسبة 100% على كافة عناصر وزوايا وتكوين وأبعاد وبيئة الصورة الأصلية، واستخدم نفس الـ seed (${priorImage?.seed !== undefined ? priorImage.seed : 482910})، وطبّق ال${isContextualAddition ? 'إضافة' : 'تعديل'} المطلوبة جراحياً فقط دون تغيير أي شيء آخر في المشهد. `) +
              `7) [الحفاظ على النسبة الأصلية]: حافظ على نفس نسبة العرض الأصلية aspectRatio: "${priorImage?.aspectRatio || '1:1'}". ` +
              `8) [بروتوكول تسليم وتوليد المعالجة العصبية الإلزامي - Neural Deliverable Block]: بعد التفكير التحليلي والشرح باللغة العربية، أخرج حتماً كتلة المعالجة العصبية التالية: ` +
              `\`\`\`neural-image\n{\n  "operation": "${isContextualAddition ? 'add_element' : 'edit'}",\n  "title": "${isContextualAddition ? 'إضافة' : 'تعديل'}: <تفاصيل ال${isContextualAddition ? 'إضافة' : 'تعديل'}>",\n  "description": "${isContextualAddition ? 'تمت إضافة' : 'تم تعديل'} <التفاصيل المنفذة بدقة 100%>",\n  "prompt": "<English prompt preserving 100% of original scene environment, lighting, and camera angle with only surgical ${isContextualAddition ? 'addition' : 'modification'} delta>",\n  "seed": ${priorImage?.seed !== undefined ? priorImage.seed : 482910},\n  "originalImage": "${priorImage?.imageUrl || ''}",\n  "aspectRatio": "${priorImage?.aspectRatio || '1:1'}",\n  "style": "${priorImage?.style || 'photorealistic'}",\n  "fidelityScore": "100%",\n  "resolution": "4K"\n}\n\`\`\` ` +
              `9) [الحظر الصارم للـ SVG]: يُحظر تماماً إخراج أي كود SVG عند تعديل أو إضافة الصور الفوتوغرافية.`
            )
            : 'أنت المعماري والمهندس السيادي لتوليد ومعالجة وتعديل الصور عصبياً وفوتوغرافياً باستخدام محرك FLUX.1 [schnell] فائق السرعة والواقعية (Sovereign Neural Image Studio Architect): ' +
              '1) [الحظر الصارم والقطعي لتحويل الصور الفوتوغرافية إلى SVG وإخراج كود المتجهات]: يُحظر تماماً وبشكل قاطع تحويل الصور الفوتوغرافية إلى SVG أو إخراج أي كود SVG أو متجهات عند طلبات الصور الفوتوغرافية أو طلبات توليد الصور (مثل "صمم صورة"، "انشئ صورة"، "صورة لـ"، "صورة واقعية"، "بورتريه"). توليد ومعالجة الصور يتم حصراً وبنسبة 100% عبر المعالجة العصبية واستخراج كتلة ```neural-image```. ' +
              '2) [هندسة برومبتات FLUX.1 [schnell] الإنجليزية الفائقة - Master Prompting for FLUX.1 [schnell]]: صغ وصفاً بصرياً إنجليزياً دقيقاً، طبيعياً ومفصلاً: تحديد نوع الكاميرا والمستشعر (Hasselblad H6D-100c أو Sony Alpha 7R V)، العدسة البؤرية (85mm f/1.2 للبورتريه، 35mm للقطات السينمائية)، الإضاءة الحجمية السينمائية (Rembrandt lighting، rim light)، دقة تشريحية كاملة لليدين والأصابع (5 fingers per hand, perfect anatomy)، ملمس ومسام البشرة الواقعية (micro-pores, subsurface scattering)، وجودة 8k uhd, photorealistic masterpiece, raw photo. ' +
              '3) [المعيار السيادي لتشريح البشر والبورتريهات الواقعية - Flawless Human Anatomy & Photorealistic Faces & 100% Identity, Texture, and Face Preservation]: خمسة أصابع طبيعية وسليمة لكل يد دون أي تشويه أو تداخل، عيون متناظرة مع لمعان طبيعي للقرنية، نسيج جلد حقيقي مع مسام مجهرية واضحة (photorealistic skin micro-pores)، وتشتت ضوئي طبيعي يمنع أي مظهر شمعي أو بلاستيكي. ' +
              '4) [التعديل الانتقائي الجراحي الدقيق والحفاظ الصارم بنسبة 100% على الهوية]: عند طلب أي تعديل على صورة مرفقة (تغيير ملابس، تغيير لون، عزل أو تغيير خلفية، دمج شخصين معاً مع دمج الشخصين بنفس الإضاءة والملامح، تحسين الجودة والدقة إلى 2K/4K، تعديل منتج، أو استبدال نص)، حافظ بنسبة 100% على ملامح الوجه وتفاصيل الشخص الأصلية وطبّق التعديل المطلوب جراحياً على العنصر المستهدف فقط (استبدال النص مع مطابقة نوع الخط). ' +
              '5) [بروتوكول تسليم وتوليد المعالجة العصبية الإلزامي - Neural Deliverable Block]: بعد التفكير والتحليل والشرح باللغة العربية، أخرج حتماً كتلة المعالجة العصبية التالية في نهاية الرد: ' +
              '```neural-image\n{\n  "operation": "<generate|portrait_generation|human_edit|recolor|remove_background|enhance_4k|composite|product_edit|text_edit>",\n  "title": "<عنوان وصفي للمعالجة>",\n  "description": "<شرح التعديل أو التوليد المنفذ بدقة 100%>",\n  "prompt": "<Ultra-detailed English visual prompt for FLUX.1 [schnell] specifying subject, 85mm lens, volumetric lighting, micro-pores, 8k resolution>",\n  "seed": 482910,\n  "aspectRatio": "<1:1|16:9|9:16|4:3>",\n  "style": "<photorealistic|cinematic|digital_art|anime|3d_render>",\n  "fidelityScore": "100%",\n  "resolution": "4K"\n}\n``` ' +
              '6) [بروتوكول التخطيط المعماري الذاتي للمشهد البصري للطلبات المقتضبة من كلمتين - Autonomous 2-Word Prompt Elaboration & Master Scene Planning Architecture]: عندما يكتب المستخدم طلباً مقتضباً أو مكوناً من كلمتين فقط (مثل "صمم سيارة"، "صورة فضاء"، "سيارة فخمة"، "صورة أسد"، "بنت جميلة"، "رجل أعمال"، "طبيعة خلابة"): يُحظر تماماً الاكتفاء بوصف سطحي مقتضب، ويُحظر طلب أي توضيحات من المستخدم؛ بل يجب عليك ذاتياً تفكيك وهندسة المشهد بالكامل بأعلى المعايير السينمائية الجاهزة داخل برومبت FLUX.1 [schnell] الإنجليزي: أ) الموضوع وتفاصيله المجهرية (Subject & Micro-Textures): تفاصيل ألياف الكربون أو الطلاء المعدني اللامع، ملمس ومسام الجلد الطبيعية (micro-pores)، خيوط النسيج وتطاير الشعر. ب) الأبعاد الواقعية الصارمة ومنع التشويه (Strict Authentic Proportions & Zero Distortion): إذا كانت مركبة أو سيارة، يجب تضمين أوصاف هندسية مانعة للانضغاط: authentic manufacturer proportions, perfect circular wheels, symmetrical perspective, ray-tracing reflections, 8k raw photograph. ج) البيئة والغلاف الجوي (Atmospheric Setting): عمق بيئي سينمائي، ضباب حجمي، إسفلت ممطر بانعكاسات ضوئية دقيقة، أو أفق معماري متناسق. د) البصريات والكاميرا (Optics & Cinematography): مستشعر Hasselblad H6D-100c أو Sony A7R V، عدسة 85mm f/1.2 للبورتريه، 35mm للقطات السينمائية، أو 24mm للمناظر الواسعة، مع عمق ميدان سطحي وبوكيه طبيعي ناعم. هـ) معمارية الإضاءة (Lighting Architecture): إضاءة ريمبرانت ثلاثية النقاط، إضاءة حواف (Rim Light)، تشتت ضوئي تحت السطح (Subsurface Scattering)، وتفاعل فيزيائي واقعي للظلال بدون أي مظهر بلاستيكي مصطنع. و) النسبة القياسية الذهبية (Aspect Ratio): النسبة القياسية الافتراضية 1:1 لمنع أي تشويه أو انضغاط في أبعاد الكائن، مع دعم 16:9 للمناظر البانورامية، 9:16 للبورتريهات وخلفيات الهواتف، و4:3 للقطات الكلاسيكية.'
          : 'منظومة المعالجة والتوليد العصبي فائق الدقة للصور (FLUX.1 [schnell] Neural Image Studio) وحفظ التفاصيل الفوتوغرافية بنسبة 100% مخصصة حصرياً لطرازات سايبر وكوانت الفائقة (Fathom Quant 3 / Fathom Cyber Ultra 2.6). وضّح للمستخدم برقي واحترافية أن توليد وتعديل الصور يتطلب تفعيل Fathom Quant 3 أو Fathom Cyber Ultra 2.6 دون تحويل الصورة إلى SVG مع الحظر التام لتحويل الصور إلى متجهات.'
      },
      MATHEMATICAL_AND_DEDUCTIVE_LOGIC: {
        ar: 'الاستدلال الاستنباطي الرياضي والفيزيائي والمنطق الصارم',
        mode: 'FORMAL_DEDUCTIVE_MATHEMATICS_AND_PHYSICS',
        directive: 'تفكيك المسألة خطوة بخطوة بالاشتقاق الرياضي الصريح، استخدام معادلات LaTeX المقننة ($$ و $)، الالتزام الصارم بالثوابت الفيزيائية والمنطقية، وتجنب أي قفزات تخمينية غير مبررة.'
      },
      SCIENTIFIC_AND_ACADEMIC_RESEARCH: {
        ar: 'البحث الأكاديمي والاستكشاف العلمي الدقيق',
        mode: 'EMPIRICAL_SCIENTIFIC_RIGOR',
        directive: 'طرح علمي محكم، توثيق منهجي للحقائق والنظريات، ربط الظواهر بالأدلة التجريبية، وصياغة لغوية أكاديمية رفيعة.'
      },
      FACTUAL_SEARCH_AND_REALTIME_GROUNDING: {
        ar: 'استخبارات الحقائق والتحقق الحي اللحظي',
        mode: 'GROUNDED_FACTUAL_VERIFICATION',
        directive: 'الاعتماد الحصري والقطعي على الحقائق الموثقة والمسترجعة حياً، عزو المعلومات لمصادرها، وتقديم جداول مقارنة حاسمة.'
      },
      COMPARATIVE_AND_EVALUATION_ANALYSIS: {
        ar: 'التحليل المقارن والمفاضلة الهندسية الموضوعية',
        mode: 'OBJECTIVE_COMPARATIVE_SYNTHESIS',
        directive: 'عرض جدول مقارنة Markdown احترافي، مقارنة المعايير بدقة وحيادية، وتقديم خلاصة تقنية حاسمة تسند القرار.'
      },
      TECHNICAL_DOCUMENTATION: {
        ar: 'التوثيق التقني وشروحات الأدوات والمكتبات',
        mode: 'EXHAUSTIVE_TECHNICAL_DOCUMENTATION',
        directive: 'شرح منهجي، ذكر المعاملات ومسارات الأخطاء، وتقديم أمثلة برمجية واضحة وقابلة للتنفيذ المباشر.'
      },
      MULTIMODAL_IMAGE_AND_FORENSICS: {
        ar: 'الفحص الجنائي البصري الميكروي والتعرف على الواجهات والمستندات',
        mode: 'OPTICAL_FORENSIC_INSPECTION',
        directive: 'قراءة النصوص بدقة متناهية عبر Fathom Cam، فحص لقطات الشاشة والمستندات والجداول دون تفويت أي تفصيل، واستخراج الدلالات البصرية بصرامة.'
      },
      MULTIMODAL_MEDIA_AND_ARCHIVE_DECONSTRUCTION: {
        ar: 'تفكيك الأرشيفات المضغوطة والأكواد والوسائط المرفقة',
        mode: 'DEEP_ARCHIVE_AND_CODE_DECONSTRUCTION',
        directive: 'المقارنة الميدانية الدقيقة سطراً بسطر بين الملفات والأكواد المستخرجة، فحص شجرة الحزم والتبعيات، وعرض جدول مقارنة يوضح التغييرات الفعلية.'
      },
      CREATIVE_LITERARY_AND_BRAINSTORMING: {
        ar: 'الإبداع الأدبي والبلاغي وتوليد الأفكار',
        mode: 'LITERARY_ELOQUENCE_AND_CREATIVE_PROSE',
        directive: 'صياغة عربية فصحى آسرة وبليغة، استخدام صور بيانية ثرية، وتفصيل سردي عميق يجذب الذهن.'
      },
      UNINHIBITED_PERSONA_X1: {
        ar: 'النمط السيادي غير المقيد (X1 Uninhibited Persona)',
        mode: 'SOVEREIGN_X1_UNINHIBITED',
        directive: 'حوار مباشر، صريح، عميق، متحرر من القوالب التكرارية، تفاعل بشري واقعي بدون مواعظ أو تنصلات.'
      },
      GENERAL_CONVERSATION_AND_QUICK_QA: {
        ar: 'الحوار العام والإجابات المباشرة السريعة',
        mode: 'DIRECT_LACONIC_DIALOGUE',
        directive: 'إجابة موجزة، ذكية، مباشرة لصلب الموضوع دون حشو أو مقدمات استهلاكية، بدون أي إيموجي.'
      }
    };

    const target = intentLabelMap[intent] || intentLabelMap.GENERAL_CONVERSATION_AND_QUICK_QA;

    return `
[توجيه المعايرة التلقائية وجودة الإخراج — COGNITIVE ALIGNMENT DIRECTIVE]:
• نمط الإجابة والمسار: [${target.ar}] (${target.mode})
• التوجيه الصارم:
  ${target.directive}
• ضوابط الإخراج وكفاءة التوكنس (Token Economy & Zero Preamble):
  1. فكّر أولاً بعمق وهدوء باللغة العربية داخل وسم <think>...</think> لتنظيم وتفكيك المعطيات منطقياً.
  2. بعد إغلاق الوسم </think>، قدّم إجابتك فوراً بصلب الموضوع باللغة العربية الفصحى المعاصرة.
  3. حظر مطلق لأي مقدمات استهلاكية أو عبارات مجاملة (مثل "أهلاً بك"، "حسناً"، "بالتأكيد"، "يسعدني"). ابدأ مباشرة بالإجابة أو الكود أو الجدول المطلوب لتحقيق أقصى كثافة معلوماتية لكل توكن.
  4. حظر مطلق لاستخدام أي إيموجي (No Unicode Emojis).
`.trim();
  }

  /**
   * Main Public Entrypoint: Coordinates complete Dynamic Parameter Tuning for any model request.
   */
  public static tune(request: DynamicTuningRequest): DynamicTuningResult {
    const { intent, confidence, complexity, hallucinationRisk, rationale } =
      this.detectIntentAndComplexity(request);

    const modelFamily = this.resolveModelFamily(request.requestedModel);

    const hyperparameters = this.tuneHyperparameters(
      intent,
      complexity,
      modelFamily,
      { explicitTemperature: request.explicitTemperature }
    );

    const priorNeuralImage = this.extractPriorNeuralImage(request.conversationHistory || []);
    const detectedImageOperation = intent === 'NEURAL_IMAGE_STUDIO_AND_PROCESSING'
      ? this.detectImageOperationType(request.userPrompt, Boolean(priorNeuralImage))
      : undefined;

    const calibrationDirective = this.generateCalibrationDirective(
      intent,
      complexity,
      hyperparameters,
      modelFamily,
      request.requestedModel,
      {
        userPrompt: request.userPrompt,
        conversationHistory: request.conversationHistory,
        priorNeuralImage,
        subIntent: detectedImageOperation
      }
    );

    return {
      detectedIntent: intent,
      detectedImageOperation,
      priorNeuralImage,
      intentConfidence: confidence,
      complexityLevel: complexity,
      hallucinationRisk,
      targetModelFamily: modelFamily,
      hyperparameters,
      calibrationDirective,
      tuningRationale: rationale,
      telemetry: {
        intent,
        model: request.requestedModel,
        temperature: hyperparameters.temperature,
        topP: hyperparameters.top_p,
        frequencyPenalty: hyperparameters.frequency_penalty,
        presencePenalty: hyperparameters.presence_penalty,
        maxTokens: hyperparameters.max_tokens,
        reasoningEffort: hyperparameters.reasoning_effort,
        thinkingMode: hyperparameters.thinking_mode,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Helper: Takes a candidate gateway payload and surgically injects the tuned parameters
   * tailored to that candidate's specific model family.
   *
   * Implements official DeepSeek API specs (https://api-docs.deepseek.com):
   * 1. KVCache & Scheduling Isolation via user_id
   * 2. Stream Usage Telemetry via stream_options: { include_usage: true }
   * 3. Thinking Mode & Reasoning Effort Control (low, high, max)
   * 4. Strict Sampling Parameter Sanitization
   */
  public static tuneGatewayPayload(
    candidateModel: string,
    basePayload: any,
    tuningResult: DynamicTuningResult
  ): any {
    const candidateFamily = this.resolveModelFamily(candidateModel);
    const candidateParams = this.tuneHyperparameters(
      tuningResult.detectedIntent,
      tuningResult.complexityLevel,
      candidateFamily
    );

    const payload: any = {
      ...basePayload,
      model: candidateModel,
      max_tokens: candidateParams.max_tokens,
      ...(basePayload && typeof basePayload.stream === 'boolean' ? { stream: basePayload.stream } : {}),
    };

    const isDeepSeekFamily =
      candidateFamily === 'deepseek-pro' ||
      candidateFamily === 'deepseek-flash' ||
      candidateFamily === 'deepseek-reasoner' ||
      candidateFamily === 'deepseek-chat' ||
      candidateFamily === 'deepseek-vision' ||
      candidateModel.toLowerCase().includes('deepseek');

    if (isDeepSeekFamily) {
      // 1. KVCache Isolation & Scheduling Isolation (regex ^[a-zA-Z0-9\-_]+$, max 512 chars)
      const rawUserId = String(basePayload?.user_id || tuningResult?.telemetry?.model || 'matany-client');
      const sanitizedUserId = rawUserId.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 128) || 'matany-user';
      payload.user_id = sanitizedUserId;

      // 2. stream_options for KV-cache hit/miss token usage telemetry
      if (payload.stream !== false) {
        payload.stream_options = { include_usage: true };
      }

      // 3. Thinking Mode & Reasoning Effort
      const thinkingMode = candidateParams.thinking_mode || 'enabled';
      const reasoningEffort = candidateParams.reasoning_effort || 'high';

      payload.extra_body = {
        ...(payload.extra_body || {}),
        user_id: sanitizedUserId,
        thinking: { type: thinkingMode }
      };

      if (candidateFamily === 'deepseek-reasoner') {
        // DeepSeek Reasoner strictly forbids temperature, top_p, frequency_penalty, presence_penalty
        delete payload.temperature;
        delete payload.top_p;
        delete payload.frequency_penalty;
        delete payload.presence_penalty;
        payload.reasoning_effort = reasoningEffort;
        payload.extra_body.reasoning_effort = reasoningEffort;
      } else if (thinkingMode === 'disabled') {
        // Thinking disabled (e.g. SVG Studio instant vector output)
        delete payload.reasoning_effort;
        delete payload.extra_body.reasoning_effort;
        payload.temperature = candidateParams.temperature;
        payload.top_p = candidateParams.top_p;
        if (candidateParams.frequency_penalty > 0) {
          payload.frequency_penalty = candidateParams.frequency_penalty;
        }
        if (candidateParams.presence_penalty > 0) {
          payload.presence_penalty = candidateParams.presence_penalty;
        }
      } else {
        // Standard DeepSeek models with thinking capability
        payload.reasoning_effort = reasoningEffort;
        payload.extra_body.reasoning_effort = reasoningEffort;
        payload.temperature = candidateParams.temperature;
        payload.top_p = candidateParams.top_p;
        if (candidateParams.frequency_penalty > 0) {
          payload.frequency_penalty = candidateParams.frequency_penalty;
        }
        if (candidateParams.presence_penalty > 0) {
          payload.presence_penalty = candidateParams.presence_penalty;
        }
      }
    } else {
      // Non-DeepSeek Models (e.g., Muse Spark, Magnum)
      payload.temperature = candidateParams.temperature;
      payload.top_p = candidateParams.top_p;
      if (candidateParams.frequency_penalty > 0) {
        payload.frequency_penalty = candidateParams.frequency_penalty;
      }
      if (candidateParams.presence_penalty > 0) {
        payload.presence_penalty = candidateParams.presence_penalty;
      }
    }

    if (candidateParams.stop && candidateParams.stop.length > 0) {
      payload.stop = candidateParams.stop;
    }

    return payload;
  }

  /**
   * Assembles a KV-Cache Prefix-Preserved System Prompt.
   * DeepSeek matches prefixes character-for-character starting at index 0.
   * To achieve >90% KV cache hit rate ($0.014/1M vs $0.44/1M tokens, 96.8% savings):
   * - Static system base prompt + calibration directive are strictly anchored at the top.
   * - Dynamic volatile context (real-time timestamps, transient user memory) is placed AFTER the static prefix.
   */
  public static buildKVCacheOptimizedSystemPrompt(
    baseSystemPrompt: string,
    calibrationDirective: string,
    dynamicContext?: { timeDetectPrompt?: string; memoryPrompt?: string; guidance?: string }
  ): string {
    const staticPrefix = `${baseSystemPrompt.trim()}\n\n${calibrationDirective.trim()}`;
    const dynamicSections: string[] = [];

    if (dynamicContext?.guidance) {
      dynamicSections.push(dynamicContext.guidance.trim());
    }
    if (dynamicContext?.timeDetectPrompt) {
      dynamicSections.push(`[DYNAMIC TEMPORAL CONTEXT]:\n${dynamicContext.timeDetectPrompt.trim()}`);
    }
    if (dynamicContext?.memoryPrompt) {
      dynamicSections.push(`[DYNAMIC USER MEMORY]:\n${dynamicContext.memoryPrompt.trim()}`);
    }

    if (dynamicSections.length === 0) {
      return staticPrefix;
    }
    return `${staticPrefix}\n\n${dynamicSections.join('\n\n')}`;
  }

  /**
   * Cleans conversation messages for optimal DeepSeek Multi-Round Token Economy.
   * Per official DeepSeek documentation (https://api-docs.deepseek.com/guides/multi_round_chat):
   * - Past assistant reasoning tags (<think>...</think>) are stripped.
   * - Unused reasoning_content fields are omitted to save thousands of input tokens per turn.
   * - Preserves multimodal frames for vision requests.
   */
  public static cleanConversationHistoryForKVCache(
    messages: Array<{ role: string; content: any; reasoning_content?: any }>,
    options?: { isMediaSpark?: boolean; isVision?: boolean; hasMultimodal?: boolean }
  ): Array<{ role: string; content: any }> {
    return messages.map((m, idx) => {
      const isLatestTurn = idx === messages.length - 1;

      // Preserve multimodal content array if multimodal frames exist
      if (Array.isArray(m.content) && (options?.isMediaSpark || options?.isVision || options?.hasMultimodal)) {
        return {
          role: m.role || 'user',
          content: m.content
        };
      }

      let contentStr = '';
      if (typeof m.content === 'string') {
        contentStr = m.content.trim();
      } else if (Array.isArray(m.content)) {
        contentStr = m.content.map((c: any) => c.text || '').join(' ').trim();
      } else {
        contentStr = JSON.stringify(m.content || '');
      }

      // Clean out any thinking tags from past assistant history to avoid token waste & model corruption
      if (m.role === 'assistant') {
        contentStr = contentStr
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
          .replace(/```(?:thought|think|thinking|reasoning)[\s\S]*?```/gi, '')
          .trim();
      }

      if (!isLatestTurn && contentStr.length > 12000) {
        contentStr = `${contentStr.slice(0, 6000)}\n\n[... تم إيجاز جزء من السياق القديم الممتد للحفاظ على أعلى سرعة واستجابة ...]\n\n${contentStr.slice(-4000)}`;
      }

      return {
        role: m.role || 'user',
        content: contentStr || 'متابعة'
      };
    });
  }
}
