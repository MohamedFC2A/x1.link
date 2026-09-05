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

export interface DynamicTuningResult {
  detectedIntent: UserIntentCategory;
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

const SVG_DESIGN_PATTERNS = [
  /<svg[\s\S]*?<\/svg>/i,
  /```svg/i,
  /(?=.*\bsvg\b)(?=.*(?:تصميم|صمم|ارسم|رسم|رسمة|شعار|لوجو|ايقونة|أيقونة|أيقونات|فيكتور|متجهات|صورة|كود|انشئ|أنشئ|اعمل|سوي|ولد|توليد|إنفوجرافيك|انفوجرافيك|رمز|شارة|طابع|زخرفة|تعديل|عدل|غير|بدل|design|logo|icon|art|vector|graphic|draw|create|generate|illustration|emblem|badge|diagram|format|png|jpg)).*/is,
  /(?:فيكتور|متجهات|vector\s*graphics?|vector\s*art|vector\s*illustration)/i,
  /\b(?:draw|create|generate|design)\s+(?:an?\s+)?(?:svg|vector)/i,
  /(?:عايز|اريد|أريد|بدي|محتاج|سويلي|اعملي|طلعلي|انشئ|أنشئ|ولد|صمم|ارسم|هات|جهز|رسم)\s+(?:لي\s+)?(?:صورة|رسمة|تصميم|لوحة|شكل|رمز)/i,
  /(?:صورة|رسمة|لوحة)\s+(?:لـ|للـ|عن|فيها|تعبر\s+عن|جميلة|فنية|كرتونية|واقعية|احترافية|بسيطة|طبيعية)/i,
  /(?:ارسم|صمم|اعمل|سوي|طلع|هات)\s+(?:لي\s+)?(?:قطة|كلب|[أا]سد|طائر|عصفور|حيوان|شجرة|زهور|ورد|سيارة|طبيعة|منظر|[أا]شكال|شمس|غروب|شروق|قمر|بحر|فضاء|كوكب|رجل|شخص|وجه|بنت|طفل|بيت|مدينة|سفينة|طائرة|طبيعة\s*صامتة)/i,
  /(?:ارسم|ارسمي)\s+(?:لي\s+)?(?:\S+\s+){0,4}(?:في\s+الطبيعة|في\s+الغابة|في\s+البحر|في\s+الفضاء|في\s+السماء)/i,
  /(?:تصميم|صمم|ارسم|رسم|اعمل|سوي|ولد|توليد|انشئ|أنشئ|ابني|صنع|draw|design|create|generate)\s+(?:لي\s+)?(?:صورة\s+)?(?:لوجو|شعار|ايقونة|أيقونة|أيقونات|شارة|رمز\s*بصري|إنفوجرافيك|انفوجرافيك|طابع|ختم|logo|icon|icons|emblem|badge|symbol|banner)/i,
  /(?:لوجو|شعار|ايقونة|أيقونة)\s+(?:احترافي|حديث|فكتور|بصري|مبتكر|لـ|للـ|عن|بسيط|متقن)/i,
  /(?:ارسم|صمم)\s+(?:لي\s+)?(?:رسمة|صورة\s+فيكتور|شكل\s+هندسي|رسم\s+شعاعي)/i,
  /(?:شخصية\s*كرتونية|كاريكاتير|بورتريه|أفاتار|avatar|character\s*design)/i,
  /(?:رسم|تصميم)\s+(?:بياني|توضيحي|هندسي|معماري|انسيابي|مخطط|خريطة|diagram|chart|flowchart|infographic)/i,
  /\b(?:image\s+of|picture\s+of|drawing\s+of|illustration\s+of|draw\s+me|generate\s+an?\s+image|create\s+an?\s+image|paint\s+me|make\s+a\s+picture)\b/i,
  /\bdraw\s+(?:me\s+)?(?:a|an|the)\b/i,
  /\b(?:vector|svg)\s+(?:art|graphic|illustration|logo|icon|design)\b/i,
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
      m === 'fathom-cyber-2.1'
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
      // Priority Check: Image-to-SVG Vectorization, Editing, or Visual Reconstruction
      const isImageToSvgRequest = (
        /(?:svg|فيكتور|متجهات|vector|vectorize|شعار|لوجو|ايقونة|أيقونة|رسم|تصميم|صورة|لوحة)/i.test(text) &&
        /(?:حول|تحويل|عدل|تعديل|غير|تغيير|بدل|تبديل|ادخل|أدخل|اضف|أضف|احذف|شيل|ارسم|صمم|اعمل|سوي|طلع|هات|convert|vectorize|transform|edit|modify|recreate|draw)/i.test(text)
      ) ||
      /(?:عدل|تعديل|غير|تغيير|بدل|تبديل|ادخل|أدخل|اضف|أضف|احذف|شيل|حول|تحويل|لون|الوان|ألوان|خلفية|الخلفية|edit|modify|change|recolor|add|remove)/i.test(text) ||
      SVG_DESIGN_PATTERNS.some(p => p.test(text));

      if (isImageToSvgRequest) {
        return {
          intent: 'SVG_VECTOR_STUDIO_AND_DESIGN',
          confidence: 0.99,
          complexity: 'EXHAUSTIVE_ARCHITECTURAL',
          hallucinationRisk: 'HIGH',
          rationale: 'Uploaded image vectorization, reconstruction, and design editing request to SVG Studio.'
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

    // 7. SVG Vector Studio & Design Check (prioritized before generic code engineering)
    const matchesSvg = SVG_DESIGN_PATTERNS.some(p => p.test(text)) ||
      (isFollowUpPrompt && SVG_DESIGN_PATTERNS.some(p => p.test(historyText)));
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
    modelFamily: ModelFamily
  ): string {
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
          '1) بروتوكول الإنتاج المباشر الصارم (Strict Zero-Thinking & Direct Code Output - Zero Preamble): يُحظر تماماً كتابة أي تفكير أو مسودات كود أو نصوص حوارية تمهيدية (مثل "دعني اكتب الكود" أو "إليك التصميم") أو رموز داخل <think>...</think>. ابدأ فوراً ومباشرةً بإنتاج كود الـ SVG النقي داخل وسم الماركداون: ```svg\\n<svg ...>\\n...\\n</svg>\\n```. ' +
          '2) توليد الصور والرسومات الذكية (Intelligent Visual Image Generation): عند طلب المستخدم لأي صورة أو رسمة أو لوحة فنية أو مشهد (مثل "عايز صورة قطة"، "اعملي صورة سيارة"، "ارسم لي...")، جسّد المشهد فوراً كلوحة فيكتور غنية، ملونة، ومتعددة الطبقات (layered SVG illustration) تضاهي جودة الصور الفنية، مع تدرجات لونية وظلال وتفاصيل مبهرة قابلة للعرض والتنزيل الفوري كصورة 2K و 4K فائقة النقاء. ' +
          '3) المواصفات القياسية الإلزامية: يجب أن يتضمن الـ SVG دائماً: xmlns="http://www.w3.org/2000/svg"، أبعاد مرنة متجاوبة عبر viewBox="0 0 W H" (مثل 0 0 800 600 أو 0 0 1024 1024 أو 0 0 800 800) مع width="100%" و height="100%". ' +
          '4) استخدم عناصر الفيكتور الحديثة باحترافية: التدرجات اللونية داخل <defs> عبر <linearGradient> و <radialGradient>، فلاتر التوهج والظلال الناعمة <filter id="...">، الأشكال الهندسية والمسارات المنحنية المتقنة <path>، والمجموعات الدلالية المنظمة <g id="...">. ' +
          '5) يُحظر تماماً استخدام روابط لصور خارجية أو خطوط غير مدمجة لضمان إمكانية التحويل والتنزيل الفوري إلى صورة PNG أو JPG عالية الدقة بدون أي مشاكل أو تلف في الـ Canvas. ' +
          '6) احرص أن تكون الرسمة مكتملة ومغلقة هندسياً وجمالياً بدون أي قطع أو أجزاء مبتورة وتجنب طباعة أي رموز غريبة أو شفرات عشوائية أو نصوص خارج وسم الماركداون. ' +
          '7) عند طلب أي تعديل على تصميم سابق (مثل تغيير الخلفية، تعديل الألوان، إضافة عنصر، تعديل تفاصيل، تبديل الخطوط)، افهم المطلوب بدقة تامة وطبّق التعديل المطلوب على كود الـ SVG السابق مع الحفاظ على تناسق وجمالية بقية العناصر، وأخرج كود الـ SVG المعدل فوراً داخل ```svg دون أي حشو أو كلام جانبي. ' +
          '8) بروتوكول تحويل الصور المرفوعة إلى فيكتور وتعديلها بدقة فائقة مع الحفاظ الصارم على هوية وهيكل الصورة (Image-to-SVG High-Fidelity Reconstruction & Surgical Editing): عند إرفاق صورة للمحادثة والمطالبة بتعديلها أو تحويلها إلى فيكتور أو إدخال/حذف عناصر منها: ' +
          'أ) [الحفاظ الصارم والمطلق على هوية وهيكل وموضوع الصورة الأصلية بنسبة 100% - Strict Original Geometry & Subject Preservation]: افحص محتوى الصورة واستوعب بنيتها البصرية وأشكالها وألوانها ونسبها بدقة عبر Fathom Vision؛ يُحظر تماماً وبشكل قاطع تغيير شكل الكائن أو الشخص أو الشعار أو الكيان الأصلي أو استبداله برسمة بديلة تختلف عن الصورة المرفقة. حافظ على نفس الخطوط العريضة والنسب والملامح والوضعية كما هي تماماً. ' +
          'ب) [التعديل الانتقائي الدقيق والواعي]: طبّق فقط وحصراً التعديل الجزئي أو الإضافة أو الحذف أو تغيير الألوان/الخلفية الذي طلبه المستخدم حرفياً، مع بقاء كافة عناصر وتفاصيل الصورة الأصلية سليمة ومطابقة 100%. ' +
          'ج) أخرج كود الـ SVG النقي المكتمل والطبقي فوراً داخل ```svg دون أي تفكير أو كلام تمهيدي. ' +
          '9) بروتوكول الاستعانة ببيانات البحث البصري (Visual Search Grounding): إذا استُخدم البحث الحي لجلب مراجع بصرية أو تفاصيل لكيان واقعي (معلم، شخصية، شعار، سيارة، منتج)، استخلص الألوان والأبعاد والسمات البصرية الأصيلة من نتائج البحث وصغها مباشرة داخل كود الـ SVG لإنشاء عمل فني وصورة بصرية تحاكي الواقع وتفوقه إتقاناً وجودة، مع حظر طباعة أي نصوص بحثية أو اقتباسات أو رموز خارج كود الـ SVG.'
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

    const calibrationDirective = this.generateCalibrationDirective(
      intent,
      complexity,
      hyperparameters,
      modelFamily
    );

    return {
      detectedIntent: intent,
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
