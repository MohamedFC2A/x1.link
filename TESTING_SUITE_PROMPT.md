# 🧪 برومت منظومة حزمة الاختبارات الشاملة - Matany Testing Suite Architect

## 📋 تعريف المهمة الأساسية
أنت **مهندس اختبارات وضمان جودة أول (Principal QA & Test Automation Architect)** لمنصة Matany (Matany AI).
المهمة: **بناء حزمة اختبارات برمجية شاملة، آلية، متوازية، وعالية الأداء (Automated Comprehensive Testing Suite)** تغطي 100% من وحدات المنظومة ومحرك البحث الذكي والوسائط المتعددة والذاكرة والواجهات البرمجية.

---

## 🎯 أهداف حزمة الاختبارات (MUST HAVE)

### 1️⃣ **اختبارات الوحدة الشاملة (Unit Tests)**
- **محرك تصنيف النوايا (Intent Classifier)**: تغطية كافة الفئات الـ 12 مع حالات العربية والإنجليزية والدرجات الحدية.
- **معالج الاستعلامات (Query Processor)**: فحص تطبيع الحروف العربية، استخراج الكيانات (أشخاص، شركات، تواريخ، منتجات)، وبناء الاستعلامات الزمنية لعام 2026.
- **إدارة التخزين المؤقت (Cache Manager)**: التحقق من فترات الصلاحية التكيفية (TTL)، مفاتيح التجزئة، تنظيف الذاكرة، والاسترجاع اللحظي (0ms).
- **خوارزمية الترتيب الخماسية (5-Pillar Ranking Engine)**: التحقق من حساب المعادلة الرياضية وفلترة السبام وإزالة التكرار.
- **حقن السياق (Prompt Augmentation)**: التحقق من صياغة البلوكات التوثيقية ومطابقة قواعد منع الهلوسة.
- **خدمات الوسائط والروابط**: فحص محلل الروابط (`linkResolver`)، كاشف التحميل (`mediaDownloadService`)، واستخراج الميتاداتا (`imageForensicsService`).

### 2️⃣ **اختبارات التكامل (Integration Tests)**
- **البحث متعدد المصادر (Multi-Source Search)**: تشغيل وتجميع نتائج DuckDuckGo و Google News RSS و Wikipedia بشكل متوازي في أقل من 3 ثوانٍ.
- **المسارات البرمجية (API Routes)**: فحص `POST /api/search` و `GET /api/search` و `GET /api/health`.
- **خط أنابيب المحادثة (Chat & Search Pipeline)**: محاكاة تدفق المحادثة وحقن السياق التوثيقي التلقائي.

### 3️⃣ **اختبارات النهاية إلى النهاية (End-to-End E2E Tests)**
- اختبار الدورة الكاملة: استلام السؤال $\to$ تصنيف النية $\to$ اتخاذ قرار البحث $\to$ الاستدعاء المتوازي $\to$ الترتيب $\to$ الصياغة التوثيقية.

### 4️⃣ **اختبارات الأداء والإجهاد (Performance & Stress Testing)**
- قياس زمن الاستجابة (Latency, p95, p99).
- اختبار التزامن والطلبات المتزامنة (Concurrency).
- قياس استهلاك الذاكرة وكفاءة التخزين المؤقت (Cache Hit Rate > 90%).

---

## 📁 هيكل الاختبارات (Testing Directory Structure)

```
tests/
├── runAllTests.ts                        # المشغل الرئيسي للاختبارات مع تقرير ANSI
├── testUtils.ts                          # مكتبة التوكيدات وأدوات القياس
├── unit/
│   ├── runUnitTests.ts                   # مشغل اختبارات الوحدة
│   ├── intentClassifier.test.ts          # اختبارات تصنيف النوايا
│   ├── queryProcessor.test.ts            # اختبارات معالجة الاستعلامات
│   ├── cacheManager.test.ts              # اختبارات التخزين المؤقت
│   ├── resultsAggregator.test.ts         # اختبارات خوارزمية الترتيب
│   ├── promptAugmentation.test.ts        # اختبارات حقن السياق
│   ├── linkResolver.test.ts              # اختبارات محلل الروابط
│   ├── mediaDownload.test.ts             # اختبارات كاشف التحميل
│   ├── imageForensics.test.ts            # اختبارات الفحص الجنائي للصور
│   └── memoryIntent.test.ts              # اختبارات نوايا الذاكرة
├── integration/
│   ├── runIntegrationTests.ts            # مشغل اختبارات التكامل
│   ├── multiSourceSearch.test.ts         # اختبار البحث المتوازي الحي
│   ├── searchApiRoute.test.ts            # اختبار مسارات API
│   └── chatSearchPipeline.test.ts        # اختبار تدفق الشات مع البحث
├── e2e/
│   ├── runE2ETests.ts                    # مشغل اختبارات E2E
│   └── autonomousDecisionE2E.test.ts     # اختبار الدورة الكاملة التلقائية
└── performance/
    ├── stressTest.ts                     # اختبار الإجهاد والتزامن
    └── memoryBenchmark.test.ts           # اختبار كفاءة الذاكرة والـ Cache
```
