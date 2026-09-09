/**
 * ============================================================================
 * GPAENG Autonomous Diagnostic & Remediation Engine
 * Matany AI (Matany) — Sovereign System Diagnostics & Continuous Self-Healing
 *
 * Core Responsibility:
 * 1. Live Diagnostic Ingestion into Supabase (x1_diagnostic_incidents).
 * 2. GPAENG Master Trigger Detection (/\bGPAENG\b/i).
 * 3. High-Density Telemetry & Failure Extraction (Incidents, RCA, Trends).
 * 4. Autonomous Dossier Generation & Remediation Directive Injection.
 * 5. Pre-Emptive System Lesson Retrieval for Standard Queries.
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
  category: string;
  severity?: string;
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
  endpoint?: string | null;
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

      const { error } = await supabase.from('x1_diagnostic_incidents').insert({
        session_id: sessId,
        visitor_id: visId,
        user_id: uId,
        category: incident.category || 'SYSTEM_ERROR',
        severity: incident.severity || 'MEDIUM',
        user_prompt: promptText ? String(promptText).slice(0, 1000) : null,
        model_used: model,
        error_code: errCode,
        error_message: errMsg ? String(errMsg).slice(0, 2000) : null,
        error_stack: errStk ? String(errStk).slice(0, 3000) : null,
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
   * Fetches the complete diagnostic dossier across all users from Supabase
   * and formats it into a high-density, authoritative dossier for the AI Agent.
   */
  public static async buildMasterDiagnosticDossier(
    supabase: SupabaseClient,
    userQuery: string
  ): Promise<string> {
    try {
      // 1. Fetch recent incidents
      const { data: recentIncidents, error: incidentsErr } = await supabase
        .from('x1_diagnostic_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Fetch system lessons learned
      const { data: lessons, error: lessonsErr } = await supabase
        .from('x1_system_lessons')
        .select('*')
        .order('times_triggered', { ascending: false })
        .limit(20);

      const incidents = (recentIncidents as DiagnosticIncidentRecord[]) || [];
      const lessonRecords = (lessons as SystemLessonRecord[]) || [];

      // Calculate real-time incident metrics
      const totalCount = incidents.length;
      const categoryCounts: Record<string, number> = {};
      const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      const modelCounts: Record<string, number> = {};

      for (const inc of incidents) {
        categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;
        const sev = inc.severity || 'MEDIUM';
        severityCounts[sev] = (severityCounts[sev] || 0) + 1;
        if (inc.model_used) {
          modelCounts[inc.model_used] = (modelCounts[inc.model_used] || 0) + 1;
        }
      }

      // Format category distribution summary
      const categoryDistribution = Object.entries(categoryCounts)
        .map(([cat, count]) => `• ${cat}: ${count} حادثة (${Math.round((count / (totalCount || 1)) * 100)}%)`)
        .join('\n') || '• لا توجد حوادث مسجلة حالياً.';

      // Format recent incident table
      let incidentsTableMarkdown = '';
      if (incidents.length > 0) {
        incidentsTableMarkdown = incidents
          .slice(0, 15)
          .map((inc, i) => {
            const dateStr = inc.created_at ? new Date(inc.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }) : 'غير محدد';
            const dev = inc.device_info ? `${inc.device_info.os || ''} ${inc.device_info.browser || ''}`.trim() : 'جهاز غير محدد';
            return `### [حادثة #${i + 1}]: [${inc.severity || 'MEDIUM'}] ${inc.category} (${inc.error_code || 'N/A'})
- **التوقيت:** ${dateStr} | **المسار:** ${inc.endpoint || '/api/chat'} | **النموذج:** ${inc.model_used || 'النموذج النشط'}
- **بيئة الجهاز والعميل:** ${dev || 'غير محدد'}
- **طلب المستخدم الأصلي:** ${inc.user_prompt ? `"${inc.user_prompt}"` : 'غير متوفر'}
- **رسالة العطل الأساسية:** \`${inc.error_message || 'لا توجد تفاصيل خطأ'}\`
${inc.error_stack ? `- **مقتطف مسار التتبع (Stack Trace):**\n\`\`\`\n${inc.error_stack.slice(0, 500)}\n\`\`\`` : ''}
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

      return `
==================================================================================
[GPAENG SOVEREIGN SYSTEM DIAGNOSTIC DOSSIER - ملف التشخيص والرقابة السيادية الشاملة]
==================================================================================
تم رصد واستدعاء المفتاح السيادي "GPAENG" في محادثة المستخدم.
تم الاتصال المباشر بقاعدة بيانات Supabase (مشروع x1.link / gyxlvreqwikpujzpyegm) واستخراج السجلات الحية لكافة مشاكل وأعطال المستخدمين:

• إجمالي الحوادث المرصودة في السجلات الحية: ${totalCount} حادثة
• تصنيف الخطورة: حرجة (${severityCounts.CRITICAL || 0}) | عالية (${severityCounts.HIGH || 0}) | متوسطة (${severityCounts.MEDIUM || 0}) | منخفضة (${severityCounts.LOW || 0})
• توزيع فئات المشاكل والأعطال:
${categoryDistribution}

• النماذج المرتبطة بالأعطال: ${Object.entries(modelCounts).map(([m, c]) => `${m} (${c})`).join(' • ') || 'غير محدد'}

----------------------------------------------------------------------------------
[تفاصيل الحوادث والأعطال المسجلة بالتفصيل من واقع قاعدة البيانات]:
----------------------------------------------------------------------------------
${incidentsTableMarkdown}

----------------------------------------------------------------------------------
[الدروس المستفادة والقواعد المحفوظة مسبقاً (System Lessons)]:
----------------------------------------------------------------------------------
${lessonsMarkdown}

==================================================================================
[بروتوكول وتوجيهات الاستجابة السيادية الفورية لـ GPAENG — SOVEREIGN REMEDIATION PROTOCOL]:
==================================================================================
أنت الآن في وضع "كبير مهندسي النظم والبنية التحتية ومعمار البرمجيات الذاتي" (Principal Autonomous Systems Architect & Lead Security Auditor).
عند الرد على المستخدم الذي استدعى مفتاح "GPAENG":
1. لا تسأله أسئلة سطحية، ولا تقدم نصائح عامة أو إجابات مبهمة.
2. قدم تحليلاً تشخيصياً وافياً وشاملاً ومهيباً باللغة العربية الفصحى المعاصرة الرصينة، مستنداً بنسبة 100% إلى الأرقام والحوادث أعلاه.
3. قسّم ردك إلى خمسة أقسام هندسية واضحة ومنظمة تماماً:
   - **القسم الأول: التقرير الإحصائي العام لحالة المنظومة (Executive Census & Diagnostics):**
     استعراض إجمالي المشاكل، توزيع الخطورة، الفئات الأكثر تكراراً، والأنظمة الأكثر تأثراً.
   - **القسم الثاني: التحليل الجذري الفني العميق (Deep Root Cause Analysis - RCA):**
     تشريح السبب الدقيق لكل فئة من المشاكل المرصودة (أعطال الـ Tools، انقطاع الـ Streaming، أخطاء الـ Token limits، أو احتكاك المستخدمين).
   - **القسم الثالث: مصفوفة تقييم الأثر وحجم المخاطر (Risk & Impact Severity Matrix):**
     جدول markdown يوضح كل مشكلة، مستوى خطورتها، احتمالية تكرارها، وتأثيرها على المستخدم.
   - **القسم الرابع: خطة العمل الهندسية الاحترافية الشاملة (Master Remediation Plan):**
     خطة مرحلية متسلسلة خطوة بخطوة لعلاج وإغلاق كافة هذه المشاكل بالكامل.
   - **القسم الخامس: الترقيعات البرمجية والأكواد الجراحية المقترحة (Surgical Code Patches):**
     كتابة أكواد دقيقة وعملية لحل المشاكل الجذرية مع الإشارة لأسماء الملفات في المشروع.
4. حافظ على نبرة واثقة، علمية، قاطعة، وفصيحة، دون استخدام أي إيموجيز إطلاقاً تنفيذاً لسياسة المنظومة.
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
}
