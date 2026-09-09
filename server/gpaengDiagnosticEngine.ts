/**
 * ============================================================================
 * GPAENG Autonomous Diagnostic & Remediation Engine 2.0
 * Matany AI (Matany) — Sovereign System Diagnostics, Millimeter Telemetry & Self-Healing
 *
 * Core Responsibility:
 * 1. Deep Millimeter Ingestion into Supabase (x1_diagnostic_incidents).
 * 2. High-Precision Incident Type & Component Classification:
 *    - HARD_ERROR | QUALITY_DEFECT | USER_FRICTION | PERFORMANCE_REGRESSION
 *    - NEURAL_IMAGE_STUDIO | SVG_STUDIO | CLIENT_UI | SERVER_STREAM | AI_MODEL | TOOL_EXECUTION
 * 3. Sovereign Dossier Generation via Supabase Postgres RPC (get_gpaeng_master_analytics).
 * 4. 5-Phase Sovereign Autonomous Remediation Architecture.
 * 5. Automated GitHub Incident & Dossier Synchronization (MohamedFC2A/x1.link).
 * ============================================================================
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface DiagnosticIncidentRecord {
  id?: string;
  session_id?: string | null;
  sessionId?: string | null;
  visitor_id?: string | null;
  visitorId?: string | null;
  user_id?: string | null;
  userId?: string | null;
  incident_type?: 'HARD_ERROR' | 'QUALITY_DEFECT' | 'USER_FRICTION' | 'PERFORMANCE_REGRESSION' | string;
  incidentType?: 'HARD_ERROR' | 'QUALITY_DEFECT' | 'USER_FRICTION' | 'PERFORMANCE_REGRESSION' | string;
  component?: 'CLIENT_UI' | 'SERVER_STREAM' | 'AI_MODEL' | 'TOOL_EXECUTION' | 'NEURAL_IMAGE_STUDIO' | 'SVG_STUDIO' | string;
  category: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  user_prompt?: string | null;
  userPrompt?: string | null;
  model_used?: string | null;
  modelUsed?: string | null;
  error_code?: string | null;
  errorCode?: string | null;
  error_message?: string | null;
  errorMessage?: string | null;
  error_stack?: string | null;
  errorStack?: string | null;
  duration_ms?: number | null;
  durationMs?: number | null;
  endpoint?: string | null;
  client_metrics?: Record<string, any>;
  clientMetrics?: Record<string, any>;
  device_info?: Record<string, any>;
  deviceInfo?: Record<string, any>;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolution_notes?: string | null;
  created_at?: string;
}

export interface SystemLessonRecord {
  id?: string;
  incident_category: string;
  trigger_signature: string;
  distilled_rule: string;
  remediation_action: string;
  action_config?: Record<string, any>;
  times_triggered?: number;
  created_at?: string;
}

export interface MasterAnalyticsPayload {
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  by_type: Record<string, number>;
  by_component: Record<string, number>;
  by_severity: Record<string, number>;
  image_studio_metrics: {
    total_events: number;
    defect_count: number;
    avg_duration_ms: number;
    p95_duration_ms: number;
  };
  svg_studio_metrics: {
    total_events: number;
    parser_errors: number;
    truncation_defects: number;
    export_failures: number;
  };
  perf_metrics: {
    avg_latency_ms: number;
    p95_latency_ms: number;
    latency_spikes_over_10s: number;
  };
  recent_critical_samples: any[];
}

export class GpaengDiagnosticEngine {
  private static readonly GPAENG_REGEX = /\bGPAENG\b/i;

  /**
   * Evaluates if the incoming prompt contains the master GPAENG trigger
   */
  public static isGpaengTrigger(userPrompt: string): boolean {
    if (!userPrompt || typeof userPrompt !== 'string') return false;
    return this.GPAENG_REGEX.test(userPrompt);
  }

  /**
   * Persists a diagnostic incident to Supabase with non-blocking error handling
   */
  public static async recordIncident(
    supabase: SupabaseClient,
    incident: DiagnosticIncidentRecord
  ): Promise<boolean> {
    try {
      const promptText = incident.user_prompt || incident.userPrompt || null;
      const errMsg = incident.error_message || incident.errorMessage || null;
      const errStk = incident.error_stack || incident.errorStack || null;
      const errCode = incident.error_code || incident.errorCode || null;
      const model = incident.model_used || incident.modelUsed || null;
      const devInfo = incident.device_info || incident.deviceInfo || {};
      const sessId = incident.session_id || incident.sessionId || null;
      const visId = incident.visitor_id || incident.visitorId || null;
      const uId = incident.user_id || incident.userId || null;
      const incType = incident.incident_type || incident.incidentType || 'HARD_ERROR';
      const comp = incident.component || 'CLIENT_UI';
      const dur = typeof incident.duration_ms === 'number'
        ? incident.duration_ms
        : (typeof incident.durationMs === 'number' ? incident.durationMs : null);
      const cMetrics = incident.client_metrics || incident.clientMetrics || {};

      const { error } = await supabase.from('x1_diagnostic_incidents').insert({
        session_id: sessId,
        visitor_id: visId,
        user_id: uId,
        incident_type: incType,
        component: comp,
        category: incident.category || 'SYSTEM_ERROR',
        severity: incident.severity || 'MEDIUM',
        user_prompt: promptText ? String(promptText).slice(0, 1000) : null,
        model_used: model,
        error_code: errCode,
        error_message: errMsg ? String(errMsg).slice(0, 2000) : null,
        error_stack: errStk ? String(errStk).slice(0, 3000) : null,
        duration_ms: dur,
        client_metrics: cMetrics,
        endpoint: incident.endpoint || null,
        device_info: devInfo,
        metadata: incident.metadata || {},
        resolved: false,
      });

      if (error) {
        console.warn('[GPAENG-DIAGNOSTICS] Failed to record incident:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[GPAENG-DIAGNOSTICS] Exception recording incident:', err?.message || err);
      return false;
    }
  }

  /**
   * Marks a diagnostic incident as resolved with surgical remediation notes
   */
  public static async resolveIncident(
    supabase: SupabaseClient,
    incidentId: string,
    resolutionNotes: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('x1_diagnostic_incidents')
        .update({
          resolved: true,
          resolution_notes: resolutionNotes,
        })
        .eq('id', incidentId);

      if (error) {
        console.warn(`[GPAENG-DIAGNOSTICS] Failed to resolve incident ${incidentId}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn(`[GPAENG-DIAGNOSTICS] Exception resolving incident ${incidentId}:`, err?.message || err);
      return false;
    }
  }

  /**
   * Batch resolves incidents matching category or criteria
   */
  public static async batchResolveIncidents(
    supabase: SupabaseClient,
    filter: { category?: string; component?: string; errorMessagePattern?: string },
    resolutionNotes: string
  ): Promise<number> {
    try {
      let query = supabase.from('x1_diagnostic_incidents').select('id, error_message').eq('resolved', false);
      if (filter.category) query = query.eq('category', filter.category);
      if (filter.component) query = query.eq('component', filter.component);

      const { data, error } = await query;
      if (error || !data) return 0;

      let resolvedCount = 0;
      for (const item of data) {
        if (filter.errorMessagePattern && !item.error_message?.includes(filter.errorMessagePattern)) {
          continue;
        }
        const success = await this.resolveIncident(supabase, item.id, resolutionNotes);
        if (success) resolvedCount++;
      }
      return resolvedCount;
    } catch (err: any) {
      console.warn('[GPAENG-DIAGNOSTICS] Batch resolve exception:', err?.message || err);
      return 0;
    }
  }

  /**
   * Fetches the complete diagnostic dossier across all users from Supabase
   * and formats it into a high-density, authoritative dossier for the AI Agent.
   */
  public static async buildMasterDiagnosticDossier(
    supabase: SupabaseClient,
    userQuery: string
  ): Promise<string> {
    try {
      // 1. Fetch Consolidated RPC Analytics from Supabase (Sub-millisecond Postgres execution)
      let rpcAnalytics: MasterAnalyticsPayload | null = null;
      if (supabase && typeof (supabase as any).rpc === 'function') {
        try {
          const { data, error } = await supabase.rpc('get_gpaeng_master_analytics', { p_hours: 168 });
          if (!error && data) {
            rpcAnalytics = data as MasterAnalyticsPayload;
          }
        } catch (rpcErr) {
          console.warn('[GPAENG-DIAGNOSTICS] RPC analytics fallback:', rpcErr);
        }
      }

      // 2. Fetch Recent Incidents for granular inspection (100 incidents)
      const { data: recentIncidents } = await supabase
        .from('x1_diagnostic_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // 3. Fetch Active System Lessons Learned
      const { data: lessons } = await supabase
        .from('x1_system_lessons')
        .select('*')
        .order('times_triggered', { ascending: false })
        .limit(25);

      const rawIncidents = (recentIncidents as DiagnosticIncidentRecord[]) || [];
      // Cleanse third-party browser extension noise (e.g. chrome-extension://) to maintain sovereign intelligence purity
      const incidents = rawIncidents.filter(inc => {
        const msg = inc.error_message || '';
        const stack = inc.error_stack || '';
        if (
          msg.includes("Cannot read properties of undefined (reading 'M_ID')") ||
          stack.includes('chrome-extension:') ||
          stack.includes('moz-extension:') ||
          stack.includes('safari-extension:') ||
          stack.includes('executors/200.js')
        ) {
          return false;
        }
        return true;
      });
      const lessonRecords = (lessons as SystemLessonRecord[]) || [];

      // Calculate real-time incident metrics & millimeter categorization
      const totalCount = incidents.length > 0 ? incidents.length : (rpcAnalytics?.total_incidents ?? 0);
      const openCount = incidents.length > 0 ? incidents.filter(i => !i.resolved).length : (rpcAnalytics?.open_incidents ?? 0);
      const resolvedCount = incidents.length > 0 ? incidents.filter(i => i.resolved).length : (rpcAnalytics?.resolved_incidents ?? 0);

      const typeCounts: Record<string, number> = rpcAnalytics?.by_type || {
        HARD_ERROR: 0,
        QUALITY_DEFECT: 0,
        USER_FRICTION: 0,
        PERFORMANCE_REGRESSION: 0
      };

      const componentCounts: Record<string, number> = rpcAnalytics?.by_component || {};
      const severityCounts: Record<string, number> = rpcAnalytics?.by_severity || {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      };

      const categoryCounts: Record<string, number> = {};
      const modelCounts: Record<string, number> = {};

      // Millimeter granular telemetry for Image and SVG
      let imageRenderDefects = 0;
      let imageFrictionRevariations = 0;
      let imageDownloadFailures = 0;
      let svgParserErrors = 0;
      let svgTruncationDefects = 0;
      let svgExportFailures = 0;
      let codeCopyEvents = 0;

      for (const inc of incidents) {
        categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;
        if (inc.model_used) {
          modelCounts[inc.model_used] = (modelCounts[inc.model_used] || 0) + 1;
        }

        // Deep millimeter categorization
        if (inc.category === 'IMAGE_RENDER_DEFECT') imageRenderDefects++;
        if (inc.category === 'IMAGE_FRICTION_REVARIATION') imageFrictionRevariations++;
        if (inc.category === 'IMAGE_DOWNLOAD_FAILURE') imageDownloadFailures++;
        if (inc.category === 'SVG_PARSER_ERROR') svgParserErrors++;
        if (inc.category === 'SVG_TRUNCATION_DEFECT') svgTruncationDefects++;
        if (inc.category === 'SVG_EXPORT_FAILURE') svgExportFailures++;
        if (inc.category === 'CODE_COPY_DEFECT_REPROMPT') codeCopyEvents++;
      }

      // Format category distribution summary
      const categoryDistribution = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `  - **${cat}**: ${count} حالة (${Math.round((count / (totalCount || 1)) * 100)}%)`)
        .join('\n') || '  - لا توجد حوادث مسجلة حالياً.';

      // Format Component breakdown
      const componentDistribution = Object.entries(componentCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([comp, count]) => `  - **${comp}**: ${count} حالة (${Math.round((count / (totalCount || 1)) * 100)}%)`)
        .join('\n') || '  - بانتظار استكمال فهارس المكونات.';

      // Format granular incident logs (up to 20 representative cases)
      let incidentsTableMarkdown = '';
      if (incidents.length > 0) {
        incidentsTableMarkdown = incidents
          .slice(0, 20)
          .map((inc, i) => {
            const dateStr = inc.created_at
              ? new Date(inc.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })
              : 'غير محدد';
            const dev = inc.device_info ? `${inc.device_info.os || ''} ${inc.device_info.browser || ''}`.trim() : 'جهاز غير محدد';
            const statusBadge = inc.resolved ? '✓ تم الترقيع والإغلاق (RESOLVED)' : '⚠ قيد المعالجة (OPEN)';
            const durationBadge = typeof inc.duration_ms === 'number' ? ` | **الزمن:** ${inc.duration_ms}ms` : '';
            const typeBadge = inc.incident_type || 'HARD_ERROR';
            const compBadge = inc.component || 'CLIENT_UI';

            return `#### [حادثة #${i + 1}]: [${inc.severity || 'MEDIUM'}] [${typeBadge}] [${compBadge}] ${inc.category} (${inc.error_code || 'N/A'}) — ${statusBadge}
- **التوقيت:** ${dateStr} | **المسار:** ${inc.endpoint || '/api/chat'} | **النموذج:** ${inc.model_used || 'النموذج النشط'}${durationBadge}
- **بيئة الجهاز والعميل:** ${dev || 'غير محدد'}
- **طلب المستخدم الأصلي:** ${inc.user_prompt ? `"${inc.user_prompt}"` : 'غير متوفر'}
- **رسالة العطل أو العيب:** \`${inc.error_message || 'لا توجد تفاصيل خطأ'}\`
${inc.resolution_notes ? `- **تقرير الإغلاق والترقيع:** \`${inc.resolution_notes}\`` : ''}
${inc.error_stack ? `- **مقتطف مسار التتبع (Stack Trace):**\n\`\`\`\n${inc.error_stack.slice(0, 450)}\n\`\`\`` : ''}
${inc.client_metrics && Object.keys(inc.client_metrics).length > 0 ? `- **قياسات العميل الدقيقة (Client Metrics):** \`${JSON.stringify(inc.client_metrics)}\`` : ''}
${inc.metadata && Object.keys(inc.metadata).length > 0 ? `- **بيانات الفحص والتحليل (Metadata):** \`${JSON.stringify(inc.metadata)}\`` : ''}`;
          })
          .join('\n\n');
      } else {
        incidentsTableMarkdown = 'لم تسجل المنظومة أي أعطال مسجلة في قاعدة البيانات حتى هذه اللحظة، وتعمل جميع الأنظمة بحالة مستقرة.';
      }

      // Format active system lessons
      let lessonsMarkdown = '';
      if (lessonRecords.length > 0) {
        lessonsMarkdown = lessonRecords
          .map((l, i) => `${i + 1}. **[${l.incident_category}]** (نمط: \`${l.trigger_signature}\`): ${l.distilled_rule} [الإجراء: \`${l.remediation_action}\` - طُبقت ${l.times_triggered || 1} مرات]`)
          .join('\n');
      } else {
        lessonsMarkdown = 'لا توجد قواعد سلبية أو دروس مستفادة مسجلة مسبقاً.';
      }

      // Millimeter Image Studio Telemetry Summary
      const imgTotal = rpcAnalytics?.image_studio_metrics?.total_events ?? (imageRenderDefects + imageFrictionRevariations + imageDownloadFailures);
      const imgAvgDur = rpcAnalytics?.image_studio_metrics?.avg_duration_ms ?? 0;
      const imgP95Dur = rpcAnalytics?.image_studio_metrics?.p95_duration_ms ?? 0;

      // Millimeter SVG Studio Telemetry Summary
      const svgTotal = rpcAnalytics?.svg_studio_metrics?.total_events ?? (svgParserErrors + svgTruncationDefects + svgExportFailures);
      const svgParserTotal = rpcAnalytics?.svg_studio_metrics?.parser_errors ?? svgParserErrors;
      const svgTruncTotal = rpcAnalytics?.svg_studio_metrics?.truncation_defects ?? svgTruncationDefects;
      const svgExportTotal = rpcAnalytics?.svg_studio_metrics?.export_failures ?? svgExportFailures;

      // Millimeter Latency & Performance Telemetry Summary
      const avgLatency = rpcAnalytics?.perf_metrics?.avg_latency_ms ?? 0;
      const p95Latency = rpcAnalytics?.perf_metrics?.p95_latency_ms ?? 0;
      const spikesOver10s = rpcAnalytics?.perf_metrics?.latency_spikes_over_10s ?? 0;

      return `
==================================================================================
[GPAENG SOVEREIGN SYSTEM DIAGNOSTIC DOSSIER - ملف التشخيص والرقابة السيادية الشاملة]
==================================================================================
تم استدعاء المحرك السيادي "GPAENG" عبر استعلام المستخدم.
تم الارتباط السيادي المباشر بقاعدة بيانات Supabase (مشروع x1.link / gyxlvreqwikpujzpyegm) واستخراج السجلات الحية ومصفوفة التحليل التجميعي المتقدمة get_gpaeng_master_analytics:

[1. التعداد الشامل للمنظومة والقياسات الحية (Executive Census)]:
• إجمالي الحوادث المرصودة في السجلات الحية: ${totalCount} حادثة (المحلولة والمغلقة: ${resolvedCount} بنسبة ${Math.round((resolvedCount / (totalCount || 1)) * 100)}%)
- تصنيف الخطورة: حرجة (${severityCounts.CRITICAL || 0}) | عالية (${severityCounts.HIGH || 0}) | متوسطة (${severityCounts.MEDIUM || 0}) | منخفضة (${severityCounts.LOW || 0})
- تصنيف نوع الحادثة بالملي (Incident Types):
  * أخطاء صلبة وانقطاعات برمجية (HARD_ERROR): ${typeCounts.HARD_ERROR || 0}
  * عيوب جودة ونقص توليد (QUALITY_DEFECT): ${typeCounts.QUALITY_DEFECT || 0}
  * احتكاك المستخدمين وإعادة المحاولات (USER_FRICTION): ${typeCounts.USER_FRICTION || 0}
  * انحدار الأداء وارتفاع زمن الاستجابة (PERFORMANCE_REGRESSION): ${typeCounts.PERFORMANCE_REGRESSION || 0}
- توزيع المكونات البرمجية المتأثرة:
${componentDistribution}
- توزيع فئات المشاكل والأعطال المسجلة:
${categoryDistribution}
- النماذج الذكية المستخدمة أثناء الحوادث: ${Object.entries(modelCounts).map(([m, c]) => `${m} (${c})`).join(' • ') || 'غير محدد'}

----------------------------------------------------------------------------------
[2. رادار استوديو الصور العصبي بالملي (Neural Image Studio Telemetry)]:
- إجمالي أحداث استوديو الصور المسجلة: ${imgTotal} حدث
- متوسط زمن التوليد الفعلي: ${Math.round(imgAvgDur)}ms (النسبة المئوية 95th Percentile: ${Math.round(imgP95Dur)}ms)
- عيوب عرض الصور في المتصفح (Render Defects): ${imageRenderDefects} حالة
- احتكاك إعادة التوليد السريع قبل الرضا (Revariation Friction <20s): ${imageFrictionRevariations} حالة
- أخطاء تصدير وتحميل الصور بدقة 4K/2K (Download Failures): ${imageDownloadFailures} حالة

----------------------------------------------------------------------------------
[3. رادار استوديو المتجهات والـ SVG بالملي (SVG Vector Studio Telemetry)]:
- إجمالي أحداث استوديو الـ SVG المسجلة: ${svgTotal} حدث
- أخطاء التحليل النحوي للـ XML (DOMParser Errors): ${svgParserTotal} حالة
- عيوب البتر ونهاية البث غير المكتمل (Truncation / Missing </svg>): ${svgTruncTotal} حالة
- أخطاء تحويل الـ Raster إلى Canvas (PNG/JPG 2K/4K Failures): ${svgExportTotal} حالة

----------------------------------------------------------------------------------
[4. مؤشرات الأداء وزمن استجابة البث (Latency & User Engagement)]:
- متوسط زمن العمليات الشامل: ${Math.round(avgLatency)}ms
- ذروة زمن الاستجابة 95th Percentile: ${Math.round(p95Latency)}ms
- قفزات التأخير المتجاوزة 10 ثوانٍ (Latency Spikes >10s): ${spikesOver10s} قفزة
- عمليات نسخ الأكواد في واجهة المحادثة (Code Copy Events): ${codeCopyEvents} عملية

----------------------------------------------------------------------------------
[5. السجلات الحية الدقيقة للحوادث والعيوب المكتشفة]:
----------------------------------------------------------------------------------
${incidentsTableMarkdown}

----------------------------------------------------------------------------------
[6. سجل القواعد السيادية المستفادة من التجارب السابقة (System Lessons Learned)]:
----------------------------------------------------------------------------------
${lessonsMarkdown}

==================================================================================
[بروتوكول وتوجيهات الاستجابة السيادية الفورية لـ GPAENG 2.0 — SOVEREIGN REMEDIATION PROTOCOL]:
==================================================================================
أنت الآن تؤدي مهمتك بصفتك "كبير مهندسي النظم والبنية التحتية ومعمار البرمجيات الذاتي" (Principal Autonomous Systems Architect & Lead Security Auditor).
عند الرد على المستخدم الذي استدعى مفتاح "GPAENG":
1. لا تطرح أسئلة استيضاحية ولا تقدم نصائح عامة أو استنتاجات تخمينية.
2. اعرض تحليلاً شاملاً ومهيباً ودقيقاً بالملي باللغة العربية الفصحى المعاصرة الرصينة، مستنداً بنسبة 100% إلى الأرقام والقياسات الحقيقية أعلاه.
3. قسّم تقريرك السيادي بدقة متناهية إلى خمسة أقسام هندسية لا تحيد عنها:
   - **القسم الأول: التقرير الإحصائي العام لحالة المنظومة (Executive Census & Diagnostics):**
     استعراض إجمالي المشاكل، التعداد الشامل، توزيع الخطورة، وتوزيع نوع الحادثة بالملي (Hard Errors, Quality Defects, User Friction, Performance)، وتوزيع المكونات، ورادار استوديو الصور والـ SVG ومؤشرات البث.
   - **القسم الثاني: التحليل الجذري الفني العميق (Deep Root Cause Analysis - RCA):**
     تشريح السبب الهندسي الدقيق لكل عيب ومفصل تقني بالملي (أعطال الـ Tools، انقطاع الـ Streaming، أخطاء الـ Token limits، استوديو الصور، تصيير الـ SVG، أو احتكاك المستخدمين).
   - **القسم الثالث: مصفوفة تقييم الأثر وحجم المخاطر (Risk & Impact Severity Matrix):**
     جدول markdown متكامل يوضح كل مشكلة وعيب، المكون المتأثر، مستوى خطورتها، احتمالية تكرارها، وتأثيرها المباشر على المستخدم.
   - **القسم الرابع: خطة العمل الهندسية الاحترافية الشاملة (Master Remediation Plan):**
     خطة مرحلية متسلسلة هندسياً لعلاج وإغلاق كافة هذه المشاكل والعيوب بالكامل والتعافي الذاتي.
   - **القسم الخامس: الترقيعات البرمجية والأكواد الجراحية المقترحة (Surgical Code Patches):**
     كتابة أكواد دقيقة وعملية وكاملة دون اختصار لحل المشاكل الجذرية مع الإشارة لأسماء الملفات في المشروع وتوضيح الربط بمستودع GitHub: MohamedFC2A/x1.link.
4. الالتزام المطلق باللغة العربية الفصحى الفائقة والامتناع التام عن أي إيموجيز تنفيذاً لسياسة المنظومة.
==================================================================================
`.trim();
    } catch (err: any) {
      console.error('[GPAENG-DIAGNOSTICS] Error building diagnostic dossier:', err);
      return `[GPAENG DOSSIER ERROR]: تعذر استخراج سجلات الحوادث مؤقتاً (${err?.message || 'خطأ اتصال'}).`;
    }
  }

  /**
   * Fetches active lessons learned from prior incidents to inject as protective rules into standard prompts
   */
  public static async fetchPreventativeDirectives(
    supabase: SupabaseClient
  ): Promise<string> {
    try {
      const { data: lessons, error } = await supabase
        .from('x1_system_lessons')
        .select('distilled_rule, remediation_action')
        .order('times_triggered', { ascending: false })
        .limit(5);

      if (error || !lessons || lessons.length === 0) return '';

      return `\n[CRITICAL OPERATIONAL RULES LEARNED FROM PRIOR SYSTEM INCIDENTS - GPAENG ENGINE]:\n` +
        lessons.map((l, i) => `${i + 1}. ${l.distilled_rule} (Strategy: ${l.remediation_action})`).join('\n');
    } catch {
      return '';
    }
  }

  /**
   * Synchronizes critical system incidents or dossier summaries to GitHub Issues
   * Repository: MohamedFC2A/x1.link
   */
  public static async syncCriticalIncidentToGitHub(
    githubToken: string,
    owner: string,
    repo: string,
    incident: DiagnosticIncidentRecord
  ): Promise<{ success: boolean; issueUrl?: string; error?: string }> {
    if (!githubToken) {
      return { success: false, error: 'GitHub token missing' };
    }

    try {
      const title = `[GPAENG-DIAGNOSTIC] ${incident.severity || 'HIGH'} - ${incident.category} in ${incident.component || 'SYSTEM'}`;
      const body = `## GPAENG Sovereign Incident Alert
**Timestamp:** ${incident.created_at || new Date().toISOString()}
**Incident Type:** \`${incident.incident_type || 'HARD_ERROR'}\`
**Component:** \`${incident.component || 'CLIENT_UI'}\`
**Severity:** \`${incident.severity || 'HIGH'}\`
**Error Code:** \`${incident.error_code || 'N/A'}\`
**Model Used:** \`${incident.model_used || 'N/A'}\`

### Error Message
\`\`\`
${incident.error_message || 'No error message provided'}
\`\`\`

### Client Metrics
\`\`\`json
${JSON.stringify(incident.client_metrics || {}, null, 2)}
\`\`\`

### Technical Stack Trace
\`\`\`
${incident.error_stack ? incident.error_stack.slice(0, 1000) : 'N/A'}
\`\`\`

---
*Generated autonomously by GPAENG 2.0 Sovereign Diagnostic Engine*`;

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'GPAENG-Autonomous-Agent'
        },
        body: JSON.stringify({
          title,
          body,
          labels: ['gpaeng-incident', (incident.severity || 'medium').toLowerCase(), (incident.component || 'client').toLowerCase()]
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `GitHub API error: ${res.status} - ${errorText}` };
      }

      const json = await res.json();
      return { success: true, issueUrl: json.html_url };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unknown network error syncing to GitHub' };
    }
  }
}
