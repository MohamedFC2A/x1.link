# 🔍 برومت منظومة البحث الذكي المتقدمة - x1.link Search Intelligence System Architect

## 📋 تعريف المهمة الأساسية
أنت **مهندس معماري متخصص في بناء منظومة بحث ذكية متقدمة** لمنصة x1.link (Matany AI).
المهمة: **تحويل نظام البحث من حالة ضعيفة واختيارية إلى منظومة كاملة، آلية، وذكية تعمل بالتوازي مع AI**.

---

## 🎯 أهداف المشروع (MUST HAVE)

### 1️⃣ **الذكاء في فهم النية (Query Intent Understanding)**
   - تصنيف الأسئلة إلى فئات: [معلومات | بحث حالي | توثيق | أسعار | أخبار | تحليل تقني | مقارنة]
   - استخراج الكيانات المهمة (Named Entities): أشخاص، شركات، تواريخ، أماكن
   - تحديد درجة الثقة: هل السؤال يحتاج بحث فعلي أم يمكن الإجابة من المعرفة الحالية؟
   - دعم كامل للعربية والإنجليزية

### 2️⃣ **البحث متعدد المصادر (Multi-Source Aggregation)**
   - **المصادر الأساسية:**
     - Google Custom Search API (الأولوية الأولى)
     - DuckDuckGo HTML Scraper (بديل مجاني)
     - Google News RSS Feed (للأخبار العاجلة)
     - Serper.dev API (إذا متاح)
     - Bing Web Search (احتياطي)
   
   - **معالجة ذكية للنتائج:**
     - إزالة النتائج المكررة
     - ترجيح النتائج حسب: الموثوقية، التاريخ، الملاءمة
     - استخلاص أفضل 5-10 نتائج فقط
   
   - **الأداء:**
     - timeout 5-7 ثوانِ أقصى
     - parallel requests (طلبات متوازية)
     - caching ذكي (1 ساعة - 24 ساعة حسب نوع البيانات)

### 3️⃣ **التكامل الآلي مع AI (Autonomous AI Integration)**
   - **الكشف التلقائي:** أي سؤال يحتاج بحث؟
   - **Prompt Injection الذكية:** حقن نتائج البحث بشكل طبيعي في السياق
   - **توثيق المصادر:** كل معلومة مع مصدرها
   - **القدرة على Fact-Checking:** عندما AI يقول معلومة، نتحقق منها

### 4️⃣ **الكفاءة والأداء (Performance Excellence)**
   - لا تأخير مرئي للمستخدم (Background Processing)
   - streaming النتائج تدريجياً
   - load balancing بين المصادر
   - قياس الأداء والتحسين المستمر

### 5️⃣ **واجهة مستخدم ذكية (Smart UI/UX)**
   - عرض "جاري البحث..." حسب الحالة
   - عرض مصادر النتائج بوضوح
   - تصفية النتائج (أخبار / أوراق بحثية / محتوى عام)
   - شريط بحث متقدم مع اقتراحات

### 6️⃣ **الأمان والخصوصية (Security & Privacy)**
   - لا تخزين بيانات حساسة
   - HTTPS فقط للطلبات
   - Rate limiting للمصادر
   - توافق GDPR

---

## 🏗️ البنية المعمارية

```
┌─────────────────────────────────────────────────────────┐
│           Frontend: SearchUI Component                   │
│    (React + TypeScript + Real-time Updates)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│       Search Intent Engine (NLP + Classification)        │
│  - Query Understanding                                   │
│  - Entity Extraction                                     │
│  - Confidence Scoring                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│     Autonomous Trigger System (Auto-Decision Maker)      │
│  - Should Search? (Yes/No/Maybe)                         │
│  - Search Type (Web/News/Academic/etc)                   │
│  - Priority Level (Urgent/Normal/Background)             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│    Multi-Source Search Engine (Parallel Execution)       │
│  ├─ Google Search (Primary)                              │
│  ├─ DuckDuckGo (Fallback)                                │
│  ├─ News Feed (Real-time)                                │
│  ├─ Serper API (Premium)                                 │
│  └─ Cache Layer (Redis/In-Memory)                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│      Results Aggregation & Ranking Engine                │
│  - Deduplication                                         │
│  - Quality Scoring                                       │
│  - Relevance Ranking                                     │
│  - Source Credibility Analysis                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│    Prompt Augmentation Engine (Context Injection)        │
│  - Format search results                                 │
│  - Inject into system prompt                             │
│  - Maintain conversation flow                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         AI Response Generation (with Sources)            │
│    [الإجابة مع توثيق المصادر والروابط]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 هيكل الملفات المطلوبة

```
server/
├── searchEngine/
│   ├── index.ts                      # نقطة الدخول الرئيسية
│   ├── intentClassifier.ts           # فهم نية السؤال
│   ├── queryProcessor.ts             # معالجة الاستعلام
│   ├── multiSourceSearcher.ts        # البحث متعدد المصادر
│   ├── googleSearch.ts               # محرك بحث جوجل
│   ├── duckduckgoSearch.ts           # محرك DuckDuckGo
│   ├── newsSearch.ts                 # بحث الأخبار
│   ├── serperSearch.ts               # Serper API
│   ├── resultsAggregator.ts          # تجميع وترتيب النتائج
│   ├── promptAugmentation.ts         # حقن النتائج في الـ prompt
│   ├── cacheManager.ts               # نظام التخزين المؤقت
│   └── searchTypes.ts                # Types و Interfaces
│
src/
├── components/
│   ├── SearchUI/
│   │   ├── SearchBar.tsx             # شريط البحث المتقدم
│   │   ├── SearchResults.tsx         # عرض النتائج
│   │   ├── SearchStatus.tsx          # حالة البحث الجاري
│   │   └── SourceBadges.tsx          # شارات المصادر
│   │
│   └── Chat/
│       └── ChatWithSearchIntegration.tsx  # التكامل مع Chat
│
└── hooks/
    ├── useSearch.ts                  # Hook للبحث
    ├── useSearchCache.ts             # Hook للـ Cache
    └── useSearchHistory.ts           # Hook لسجل البحث
```

---

## 🔧 مواصفات تقنية تفصيلية

### A. فهم نية السؤال (Query Intent Classification)

**الفئات المدعومة:**
```typescript
type QueryIntent = 
  | 'INFORMATION_SEARCH'      // بحث عام عن معلومات
  | 'CURRENT_EVENTS'          // أخبار وأحداث حالية
  | 'REAL_TIME_DATA'          // بيانات لحظية (أسعار، طقس)
  | 'PRODUCT_RESEARCH'        // بحث عن منتجات
  | 'TECHNICAL_DOCUMENTATION' // توثيق تقني
  | 'SCIENTIFIC_RESEARCH'     // أبحاث علمية
  | 'COMPARISON'              // مقارنة بين أشياء
  | 'TUTORIAL_HOW_TO'         // شروحات وطريقة عمل
  | 'FACT_CHECKING'           // التحقق من صحة معلومة
  | 'TREND_ANALYSIS'          // تحليل الاتجاهات
  | 'OPINION_SEEKING'         // طلب رأي شخصي
  | 'GENERAL_CONVERSATION'    // محادثة عادية (بدون بحث)

**مؤشرات الكلمات الدالة:**
- أسئلة البحث: "ابحث عن"، "ما هي"، "كيف"، "متى"، "أين"، "كم"
- الأخبار: "آخر"، "جديد"، "حدث اليوم"، "الآن"، "أحدث"
- البيانات الحية: "السعر الحالي"، "الطقس"، "أسعار الذهب"
- المقارنة: "مقارنة بين"، "الفرق بين"، "أيهما أفضل"
- معايير الزمن: تاريخ محدد، "هذا العام"، "الشهر الماضي"
```

**درجة الثقة (Confidence Score):**
```
- 0.95 - 1.0: بحث ضروري جداً
- 0.7 - 0.95: بحث مستحسن
- 0.4 - 0.7: بحث اختياري
- 0.0 - 0.4: بدون بحث (معرفة كافية)
```

---

### B. المصادر والـ APIs

**1. Google Custom Search (الأولوية الأولى)**
```typescript
endpoint: "https://www.googleapis.com/customsearch/v1"
params: {
  q: string,           // الاستعلام
  cx: string,          // Custom Search Engine ID
  key: string,         // API Key
  num: 10,             // عدد النتائج (1-10)
  start: number,       // رقم البداية للصفحات
  hl: 'ar' or 'en',    // لغة النتائج
  sort?: string        // ترتيب النتائج
}

response: {
  items: Array<{
    title: string,
    link: string,
    snippet: string,
    image?: string,
    pagemap?: any
  }>
}
```

**2. DuckDuckGo (بديل مجاني)**
```typescript
// الطريقة الأولى: HTML Scraping
endpoint: "https://html.duckduckgo.com/"
method: "POST"
form_data: { q: string }

// النتيجة: صفحة HTML بحاجة parsing
// الميزة: بدون API key
// السلبية: قد تكون أبطأ قليلاً
```

**3. Google News RSS**
```typescript
endpoint: "https://news.google.com/rss/search"
params: {
  q: string,           // الاستعلام
  hl: 'ar',            // اللغة
  gl: 'EG',            // الدولة
  ceid: 'EG:ar'        // رمز البلد
}

response: XML Feed يحتوي على:
- title
- link
- description
- pubDate
- source
```

**4. Serper.dev API (Premium - اختياري)**
```typescript
endpoint: "https://google.serper.dev/search"
method: "POST"
headers: {
  "X-API-KEY": process.env.SERPER_API_KEY,
  "Content-Type": "application/json"
}
body: {
  q: string,
  num: 10,
  type: 'search' | 'news' | 'scholar'
}
```

---

### C. خوارزمية ترتيب النتائج (Results Ranking Algorithm)

```
Final Score = (0.3 × Relevance Score) + 
              (0.25 × Source Credibility) +
              (0.2 × Freshness Score) +
              (0.15 × User Engagement) +
              (0.1 × Content Quality)

Relevance Score:
  - TF-IDF matching with query
  - Keyword density
  - Title match bonus (+0.3)
  - URL match bonus (+0.2)

Source Credibility:
  - Domain authority (من قائمة موثوقة)
  - SSL certificate status
  - Domain age
  - Known trusted sources (Google, Wikipedia, etc.)

Freshness Score:
  - Publication date recency
  - Update frequency
  - للأخبار: higher weight لـ last 24 hours

Content Quality:
  - Word count (300+ words = better)
  - Multimedia content (images, videos)
  - Structural clarity (headings, lists)
```

---

### D. نظام التخزين المؤقت (Caching Strategy)

```typescript
cache_ttl = {
  general_information: 24 * 60 * 60,        // 24 ساعة
  news_and_current: 1 * 60 * 60,            // 1 ساعة
  real_time_data: 15 * 60,                  // 15 دقيقة
  product_prices: 30 * 60,                  // 30 دقيقة
  weather: 10 * 60,                         // 10 دقائق
  
  // Cache strategy
  cache_key = md5(query + language + intent)
  
  // Cache invalidation
  - Manual invalidation on source update
  - TTL expiration
  - User refresh request
}
```

---

### E. آلية البحث الآلي (Autonomous Search Trigger)

```typescript
/**
 * قرار البحث التلقائي:
 * - إذا confidence_score >= 0.7: بحث فوري
 * - إذا 0.4 <= confidence_score < 0.7: بحث في الخلفية
 * - إذا confidence_score < 0.4: بدون بحث
 * 
 * الاستثناءات:
 * - إذا كانت آخر محادثة عن نفس الموضوع < 5 دقائق: بدون بحث
 * - إذا المستخدم ضغط "بدون بحث": احترم الاختيار
 * - إذا كان هناك خطأ في البحث: استخدم المعرفة المخزنة
 */

shouldSearch(query: string, context: ConversationContext): {
  should_search: boolean,
  search_type: SearchIntent,
  priority: 'urgent' | 'normal' | 'background',
  confidence: number,
  reason: string
}
```

---

### F. حقن النتائج في الـ Prompt (Prompt Augmentation)

```typescript
/**
 * عند اتخاذ قرار البحث، يتم إضافة:
 */

SEARCH_CONTEXT_BLOCK = `
🔍 [نتائج البحث الحي من الإنترنت]:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
المصدر 1: [العنوان]
الرابط: [URL]
الملخص: [snippet من 150 كلمة]
التاريخ: [تاريخ النشر]
الموثوقية: ⭐⭐⭐⭐⭐ (4.8/5)

المصدر 2: [...]
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[توجيه]: استخدم المعلومات أعلاه في إجابتك،
وأضف الروابط والمصادر عند الإشارة لأي معلومة.
`

// يتم إضافة هذا البلوك:
// - قبل آخر رسالة المستخدم مباشرة
// - أو في system prompt كـ context إضافي
```

---

## 🎬 سيناريوهات الاستخدام (Use Cases)

### السيناريو 1️⃣: سؤال عن أخبار حالية
```
المستخدم: "ما آخر الأخبار عن ChatGPT اليوم؟"

العملية:
1. Intent Classification: CURRENT_EVENTS + REAL_TIME_DATA (Score: 0.98)
2. Trigger: ✅ بحث فوري (urgent)
3. Search Sources: Google News + DuckDuckGo
4. Results: أفضل 5 أخبار من آخر 24 ساعة
5. Augmentation: حقن النتائج في الـ prompt
6. AI Response: إجابة مع الروابط والتواريخ

الناتج النهائي:
"آخر الأخبار عن ChatGPT:
1. [عنوان الخبر] (مصدر من [الموقع])
   [الرابط]
   
2. [عنوان آخر]
   [...]"
```

### السيناريو 2️⃣: سؤال معقد يحتاج توثيق
```
المستخدم: "كيف أتعلم Machine Learning؟"

العملية:
1. Intent: TUTORIAL_HOW_TO + TECHNICAL_DOCUMENTATION (Score: 0.85)
2. Trigger: ✅ بحث في الخلفية (normal)
3. Sources: Google + Academic Resources
4. Results: دورات، كتب، مقالات موثوقة
5. AI Response: شرح شامل + توصيات من البحث
```

### السيناريو 3️⃣: سؤال عام (بدون حاجة بحث)
```
المستخدم: "ما الفرق بين HTML و CSS؟"

العملية:
1. Intent: GENERAL_CONVERSATION + INFORMATION_SEARCH (Score: 0.3)
2. Trigger: ❌ بدون بحث (AI معرفة كافية)
3. Response: إجابة مباشرة من معرفة النموذج
4. Optional: إضافة روابط من المعرفة المدمجة
```

### السيناريو 4️⃣: طلب مقارنة أسعار
```
المستخدم: "قارن بين أسعار iPhone 15 في مصر والسعودية"

العملية:
1. Intent: REAL_TIME_DATA + PRODUCT_RESEARCH (Score: 0.95)
2. Trigger: ✅ بحث فوري (urgent)
3. Sources: Google Shopping + Local E-commerce Sites
4. Results: أسعار حالية من عدة محلات
5. Caching: 30 دقيقة (للأسعار المتغيرة)
6. AI Response: جدول مقارنة + تحليل السعر الأفضل
```

---

## 🛡️ معالجة الأخطاء والحالات الاستثنائية

### الخطأ 1️⃣: فشل جميع مصادر البحث
```typescript
fallback_strategy: {
  1. حاول المصدر التالي
  2. انتظر 1 ثانية وأعد المحاولة
  3. استخدم نتائج الـ cache القديمة (إن وجدت)
  4. أخبر AI بـ "معلومات قد تكون قديمة"
  5. أخيراً: أجب من معرفة النموذج مباشرة
}
```

### الخطأ 2️⃣: نتائج غير ملائمة
```typescript
quality_check: {
  - snippet حجمه < 50 حرف: رفض النتيجة
  - عنوان مكرر من نتيجة سابقة: دمج النتائج
  - موقع غير موثوق + confidence < 0.3: احذر من النتيجة
  - محتوى يبدو مثل spam: تجاهل تماماً
}
```

### الخطأ 3️⃣: حد rate limiting من المصادر
```typescript
rate_limit_handling: {
  - تقليل عدد المصادر المستخدمة
  - زيادة وقت الانتظار بين الطلبات
  - استخدام cache بدلاً من البحث الحي
  - إخطار المستخدم: "البحث قد يكون أبطأ الآن"
}
```

---

## 📊 مقاييس الأداء (Performance Metrics)

```typescript
metrics: {
  // Speed
  avg_search_time: "< 3 seconds",
  p99_search_time: "< 7 seconds",
  cache_hit_rate: "> 60%",
  
  // Quality
  result_relevance: "> 85%",
  source_accuracy: "> 90%",
  fact_check_pass_rate: "> 95%",
  
  // User Experience
  search_usage_rate: "Track % of queries using search",
  user_satisfaction: "> 4.5/5",
  error_rate: "< 5%",
  
  // Availability
  uptime: "> 99.5%",
  backup_source_usage: "Track fallback rate"
}
```

---

## 🔐 معايير الأمان

```typescript
security_checklist: {
  ✅ تشفير جميع طلبات البحث (HTTPS)
  ✅ لا تخزين بيانات مستخدم حساسة
  ✅ rate limiting (max 100 طلب/ساعة لكل IP)
  ✅ validation للـ URLs المرجعة
  ✅ Content Security Policy (CSP)
  ✅ منع XSS في عرض النتائج
  ✅ التوافق مع GDPR
  ✅ audit logging لكل بحث
  ✅ مراجعة المصادر الموثوقة بشكل دوري
  ✅ فحص ملفات البرامج الضارة في الروابط
}
```

---

## 🚀 خطوات التنفيذ (Implementation Roadmap)

### المرحلة 1: الأساسيات (Week 1-2)
- [ ] نظام فهم النية (Intent Classifier)
- [ ] مصدر البحث الأساسي (Google + DuckDuckGo)
- [ ] نظام التخزين المؤقت البسيط
- [ ] API endpoint: `/api/search`

### المرحلة 2: التحسين (Week 3-4)
- [ ] مصدر الأخبار والبيانات الحية
- [ ] خوارزمية ترتيب متقدمة
- [ ] حقن النتائج في الـ prompt
- [ ] واجهة UI أساسية

### المرحلة 3: الذكاء الآلي (Week 5-6)
- [ ] نظام القرار الآلي للبحث
- [ ] تحسين Intent Classification
- [ ] Fact-checking محسّن
- [ ] Analytics والتعلم المستمر

### المرحلة 4: الاحترافية (Week 7-8)
- [ ] واجهة مستخدم متقدمة
- [ ] A/B Testing
- [ ] Performance Optimization
- [ ] Deploy والمراقبة

---

## 🎓 أمثلة الكود الأساسية

### 1. Intent Classifier Example
```typescript
async function classifyIntent(query: string): Promise<{
  intent: QueryIntent,
  confidence: number,
  should_search: boolean,
  search_type: string
}> {
  // 1. Tokenize query
  const tokens = query.toLowerCase().split(/\s+/);
  
  // 2. Check keyword patterns
  const patterns = {
    CURRENT_EVENTS: /آخر|جديد|حدث|اليوم|الآن/,
    REAL_TIME_DATA: /السعر|الطقس|أسعار|حالي|الآن/,
    TUTORIAL: /كيف|اشرح|تعليم|دليل|tutorial|how to/,
    // ... more patterns
  };
  
  // 3. Calculate confidence using NLP
  // 4. Return decision
}
```

### 2. Multi-Source Search Example
```typescript
async function searchMultipleSources(query: string): Promise<SearchResult[]> {
  const results = await Promise.allSettled([
    searchGoogle(query),
    searchDuckDuckGo(query),
    searchNews(query),
    // ... fallbacks
  ]);
  
  // Aggregate and rank
  const aggregated = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .flat()
    .filter(uniqueBy('url'))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
    
  return aggregated;
}
```

### 3. Prompt Augmentation Example
```typescript
function augmentPromptWithSearchResults(
  originalPrompt: string,
  searchResults: SearchResult[]
): string {
  const searchBlock = `
🔍 [نتائج البحث الحي]:
${searchResults.map((r, i) => `
${i+1}. ${r.title}
   الرابط: ${r.url}
   الملخص: ${r.snippet}
   المصدر: ${r.source} (${r.date})
`).join('\n')}

[التوجيه]: استخدم هذه المعلومات في إجابتك.
  `;
  
  return originalPrompt + '\n\n' + searchBlock;
}
```

---

## 📝 ملاحظات اختتامية

هذه المنظومة تم تصميمها لـ:
✅ أن تكون **تلقائية بالكامل** - بدون تدخل يدوي
✅ أن تكون **ذكية** - تعرف متى تبحث ومتى لا تبحث
✅ أن تكون **سريعة** - لا تأخير مرئي للمستخدم
✅ أن تكون **موثوقة** - مع fallbacks ومعالجة أخطاء قوية
✅ أن تكون **قابلة للتوسع** - سهل الإضافة والتحسين
✅ أن تحقق **ROI عالي** - بأقل cost ممكن (APIs مجانية متاحة)

**دعك تركز على الجودة وليس الكمية - أفضل 5 نتائج عالية جودة من 50 نتيجة متوسطة الجودة!**

---

**هذا البرومت جاهز للاستخدام مع أي LLM متقدم (ChatGPT, Claude, DeepSeek, Gemini)**
**استخدمه مباشرة مع `Cursor AI` أو أي Coding Agent لتطبيق المنظومة بالكامل** 🚀
