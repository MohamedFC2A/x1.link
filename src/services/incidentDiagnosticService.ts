/**
 * ============================================================================
 * Sovereign Passive Incident Diagnostic & Defect Intelligence Engine (GPAENG 2.0)
 * Matany AI (Matany) — Continuous Learning & Self-Healing Architecture
 *
 * Core Responsibility:
 * 1. 100% Passive Error, Defect & Crash Capture (Hard errors, Quality defects, User friction).
 * 2. Millimeter-level Image Studio & SVG Studio Observation (Render flaws, Canvas taints,
 *    DOM parser errors, unclosed XML tags, rapid revariations, download drops).
 * 3. Implicit User Friction Detection (Rage reprompts, aborts, corrective prompts, code copy failures).
 * 4. Zero-Latency Asynchronous Dispatch (requestIdleCallback + keepalive fetch).
 * 5. Deduplication & Circuit Breaking to protect client resources.
 * ============================================================================
 */

export type IncidentCategory =
  | 'CLIENT_CRASH'
  | 'NETWORK_ERROR'
  | 'API_5XX'
  | 'TOOL_FAILURE'
  | 'STREAM_TIMEOUT'
  | 'STREAM_ABORT_FRICTION'
  | 'USER_FRICTION_REPROMPT'
  | 'RATE_LIMIT'
  | 'IMAGE_GENERATION_DEFECT'
  | 'IMAGE_RENDER_DEFECT'
  | 'IMAGE_FRICTION_REVARIATION'
  | 'IMAGE_DOWNLOAD_FAILURE'
  | 'SVG_PARSER_ERROR'
  | 'SVG_TRUNCATION_DEFECT'
  | 'SVG_EXPORT_FAILURE'
  | 'CODE_COPY_DEFECT_REPROMPT'
  | 'STREAM_LATENCY_SPIKE'
  | 'UNKNOWN_FAILURE';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentType = 'HARD_ERROR' | 'QUALITY_DEFECT' | 'USER_FRICTION' | 'PERFORMANCE_ANOMALY';

export type ComponentSubsystem =
  | 'IMAGE_STUDIO'
  | 'SVG_STUDIO'
  | 'CHAT_STREAM'
  | 'SEARCH_ENGINE'
  | 'MEDIA_RESOLVER'
  | 'VPS_BRIDGE'
  | 'CLIENT_UI';

export interface DiagnosticIncidentInput {
  category: IncidentCategory;
  severity?: IncidentSeverity;
  incidentType?: IncidentType;
  component?: ComponentSubsystem;
  durationMs?: number | null;
  userPrompt?: string;
  modelUsed?: string;
  errorCode?: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  sessionId?: string | null;
  userId?: string | null;
  metadata?: Record<string, any>;
  clientMetrics?: Record<string, any>;
}

class IncidentDiagnosticService {
  private static instance: IncidentDiagnosticService | null = null;
  private recentIncidentHashes: Map<string, number> = new Map();
  private lastAssistantResponseTime: number = 0;
  private lastStreamStartTime: number = 0;
  private lastCodeCopyTime: number = 0;
  private lastCodeCopyLanguage: string = '';
  private isListening: boolean = false;

  private readonly FRICTION_PATTERNS = [
    /مش كدا/i,
    /مش ده/i,
    /مش شغال/i,
    /كود غلط/i,
    /فيه خطأ/i,
    /خطأ في الكود/i,
    /الكود بايظ/i,
    /مش كامل/i,
    /مقطوع/i,
    /ما بيشتغلش/i,
    /غلط/i,
    /كود غير صحيح/i,
    /syntax error/i,
    /not working/i,
    /broken/i,
    /failed to/i,
    /incomplete/i,
    /error:/i,
    /الصورة مش مظبوطة/i,
    /الصورة مش طالعة/i,
    /الرسمة مش كاملة/i,
    /اللوجو مش ظاهر/i,
    /صلح الكود/i,
    /أعد المحاولة/i,
    /غيرها مش حلوة/i,
    /طلع مشوه/i,
  ];

  private constructor() {
    this.initPassiveListeners();
  }

  public static getInstance(): IncidentDiagnosticService {
    if (!IncidentDiagnosticService.instance) {
      IncidentDiagnosticService.instance = new IncidentDiagnosticService();
    }
    return IncidentDiagnosticService.instance;
  }

  /**
   * Initializes passive window error and unhandled rejection listeners
   */
  private initPassiveListeners(): void {
    if (typeof window === 'undefined' || this.isListening) return;
    this.isListening = true;

    // Window global error handler
    window.addEventListener('error', (event: ErrorEvent) => {
      if (event.message?.includes('ResizeObserver') || event.message?.includes('Script error')) return;

      this.reportIncident({
        category: 'CLIENT_CRASH',
        severity: 'HIGH',
        incidentType: 'HARD_ERROR',
        component: 'CLIENT_UI',
        errorMessage: event.message || 'Window Global Error',
        errorStack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        endpoint: window.location.pathname,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled Promise rejection handler
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason?.name === 'AbortError' || reason?.message?.includes('aborted')) return;

      this.reportIncident({
        category: 'CLIENT_CRASH',
        severity: 'HIGH',
        incidentType: 'HARD_ERROR',
        component: 'CLIENT_UI',
        errorMessage: reason?.message || String(reason) || 'Unhandled Promise Rejection',
        errorStack: reason?.stack || undefined,
        endpoint: window.location.pathname,
      });
    });
  }

  /**
   * Marks the start of a stream turn
   */
  public markStreamStart(): void {
    this.lastStreamStartTime = Date.now();
  }

  /**
   * Marks the completion of an assistant response
   */
  public markAssistantResponse(): void {
    this.lastAssistantResponseTime = Date.now();
  }

  /**
   * Tracks when user copies a code block to catch follow-up execution friction
   */
  public trackCodeCopy(codeText: string, language?: string): void {
    this.lastCodeCopyTime = Date.now();
    this.lastCodeCopyLanguage = language || 'unknown';
  }

  /**
   * Granular millimeter observer for Neural Image Studio events & defects
   */
  public trackImageEvent(
    category: IncidentCategory,
    details: {
      errorMessage: string;
      errorCode?: string;
      userPrompt?: string;
      durationMs?: number;
      severity?: IncidentSeverity;
      metadata?: Record<string, any>;
      sessionId?: string | null;
    }
  ): void {
    const isFriction = category === 'IMAGE_FRICTION_REVARIATION';
    this.reportIncident({
      category,
      severity: details.severity || (isFriction ? 'LOW' : 'MEDIUM'),
      incidentType: isFriction ? 'USER_FRICTION' : 'QUALITY_DEFECT',
      component: 'IMAGE_STUDIO',
      errorMessage: details.errorMessage,
      errorCode: details.errorCode,
      userPrompt: details.userPrompt,
      durationMs: details.durationMs,
      sessionId: details.sessionId,
      metadata: details.metadata || {},
    });
  }

  /**
   * Granular millimeter observer for SVG Vector Studio events & defects
   */
  public trackSvgEvent(
    category: IncidentCategory,
    details: {
      errorMessage: string;
      errorCode?: string;
      svgLength?: number;
      durationMs?: number;
      severity?: IncidentSeverity;
      metadata?: Record<string, any>;
      sessionId?: string | null;
    }
  ): void {
    this.reportIncident({
      category,
      severity: details.severity || 'MEDIUM',
      incidentType: 'QUALITY_DEFECT',
      component: 'SVG_STUDIO',
      errorMessage: details.errorMessage,
      errorCode: details.errorCode,
      durationMs: details.durationMs,
      sessionId: details.sessionId,
      metadata: {
        ...(details.metadata || {}),
        svgLength: details.svgLength,
      },
    });
  }

  /**
   * Tracks performance anomalies & latency spikes
   */
  public trackPerformanceMetric(
    component: ComponentSubsystem,
    durationMs: number,
    metadata?: Record<string, any>
  ): void {
    if (durationMs > 8000) {
      this.reportIncident({
        category: 'STREAM_LATENCY_SPIKE',
        severity: durationMs > 15000 ? 'HIGH' : 'MEDIUM',
        incidentType: 'PERFORMANCE_ANOMALY',
        component,
        durationMs,
        errorMessage: `Subsystem ${component} latency spike detected: ${durationMs}ms`,
        metadata: metadata || {},
      });
    }
  }

  /**
   * Checks if user prompt represents friction (e.g. corrective reprompt shortly after response)
   */
  public evaluateUserPromptFriction(promptText: string, activeModel?: string, chatId?: string | null): void {
    if (!promptText || typeof promptText !== 'string') return;
    const now = Date.now();
    const timeSinceLastResponseSec = (now - this.lastAssistantResponseTime) / 1000;
    const timeSinceCodeCopySec = (now - this.lastCodeCopyTime) / 1000;

    // Check if within 25 seconds of response and matches friction patterns
    if (this.lastAssistantResponseTime > 0 && timeSinceLastResponseSec <= 25) {
      const hasFrictionTrigger = this.FRICTION_PATTERNS.some((pattern) => pattern.test(promptText));
      if (hasFrictionTrigger) {
        // Did the user copy code right before complaining?
        const isCodeCopyCorrelation = this.lastCodeCopyTime > 0 && timeSinceCodeCopySec <= 30;

        this.reportIncident({
          category: isCodeCopyCorrelation ? 'CODE_COPY_DEFECT_REPROMPT' : 'USER_FRICTION_REPROMPT',
          severity: 'MEDIUM',
          incidentType: 'USER_FRICTION',
          component: isCodeCopyCorrelation ? 'CHAT_STREAM' : 'CLIENT_UI',
          userPrompt: promptText.slice(0, 300),
          modelUsed: activeModel,
          sessionId: chatId,
          errorMessage: isCodeCopyCorrelation
            ? `User reported broken code within ${Math.round(timeSinceCodeCopySec)}s of copying snippet (${this.lastCodeCopyLanguage})`
            : 'User friction detected: immediate corrective reprompt after assistant turn',
          metadata: {
            timeDeltaSeconds: Math.round(timeSinceLastResponseSec),
            detectedPattern: promptText.slice(0, 100),
            copiedCodeLanguage: isCodeCopyCorrelation ? this.lastCodeCopyLanguage : undefined,
          },
        });
      }
    }
  }

  /**
   * Evaluates if user aborting a stream represents friction (aborted within 3.5 seconds of starting)
   */
  public evaluateStreamAbort(activeModel?: string, chatId?: string | null): void {
    const elapsedSec = (Date.now() - this.lastStreamStartTime) / 1000;
    if (this.lastStreamStartTime > 0 && elapsedSec <= 3.5) {
      this.reportIncident({
        category: 'STREAM_ABORT_FRICTION',
        severity: 'LOW',
        incidentType: 'USER_FRICTION',
        component: 'CHAT_STREAM',
        modelUsed: activeModel,
        sessionId: chatId,
        errorMessage: `Rapid stream abort detected within ${elapsedSec.toFixed(1)}s of generation`,
        metadata: {
          abortElapsedSeconds: elapsedSec,
        },
      });
    }
  }

  /**
   * Reports an incident with deduplication and 100% passive non-blocking dispatch
   */
  public reportIncident(incident: DiagnosticIncidentInput): void {
    try {
      const now = Date.now();
      const dedupKey = `${incident.category}:${incident.errorCode || ''}:${(incident.errorMessage || '').slice(0, 60)}`;

      // Deduplicate identical incidents within 20 seconds window
      const lastSeen = this.recentIncidentHashes.get(dedupKey);
      if (lastSeen && now - lastSeen < 20000) {
        return;
      }
      this.recentIncidentHashes.set(dedupKey, now);

      // Clean up stale cache keys periodically
      if (this.recentIncidentHashes.size > 50) {
        for (const [key, timestamp] of this.recentIncidentHashes.entries()) {
          if (now - timestamp > 60000) {
            this.recentIncidentHashes.delete(key);
          }
        }
      }

      // Infer component and incidentType if not specified
      let derivedComponent: ComponentSubsystem = incident.component || 'CLIENT_UI';
      let derivedType: IncidentType = incident.incidentType || 'HARD_ERROR';

      if (!incident.component) {
        if (incident.category.startsWith('IMAGE_')) derivedComponent = 'IMAGE_STUDIO';
        else if (incident.category.startsWith('SVG_')) derivedComponent = 'SVG_STUDIO';
        else if (incident.category === 'STREAM_TIMEOUT' || incident.category === 'STREAM_ABORT_FRICTION' || incident.category === 'STREAM_LATENCY_SPIKE') derivedComponent = 'CHAT_STREAM';
        else if (incident.category === 'TOOL_FAILURE') derivedComponent = 'MEDIA_RESOLVER';
      }

      if (!incident.incidentType) {
        if (incident.category.includes('FRICTION') || incident.category === 'CODE_COPY_DEFECT_REPROMPT') derivedType = 'USER_FRICTION';
        else if (incident.category.includes('DEFECT') || incident.category.includes('ERROR') && derivedComponent !== 'CLIENT_UI') derivedType = 'QUALITY_DEFECT';
        else if (incident.category.includes('LATENCY') || incident.category.includes('TIMEOUT')) derivedType = 'PERFORMANCE_ANOMALY';
      }

      const deviceInfo = this.getBasicDeviceContext();
      const clientMetrics = incident.clientMetrics || {
        memory: (performance as any)?.memory ? {
          usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1048576) + 'MB',
          totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1048576) + 'MB',
        } : undefined,
        connection: (navigator as any)?.connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
        } : undefined,
      };

      const payload = {
        category: incident.category,
        severity: incident.severity || 'MEDIUM',
        incidentType: derivedType,
        component: derivedComponent,
        durationMs: incident.durationMs || null,
        clientMetrics,
        userPrompt: incident.userPrompt,
        modelUsed: incident.modelUsed,
        errorCode: incident.errorCode,
        errorMessage: incident.errorMessage?.slice(0, 1000),
        errorStack: incident.errorStack?.slice(0, 2000),
        endpoint: incident.endpoint || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        sessionId: incident.sessionId,
        userId: incident.userId,
        deviceInfo,
        metadata: incident.metadata || {},
      };

      const dispatchFn = () => {
        try {
          fetch('/api/telemetry-incident', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => null);
          });
        } catch {
          // Silent non-blocking failover
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(dispatchFn, { timeout: 2000 });
      } else {
        setTimeout(dispatchFn, 50);
      }
    } catch {
      // Safeguard against any internal telemetry error
    }
  }

  private getBasicDeviceContext(): Record<string, any> {
    if (typeof window === 'undefined') return {};
    try {
      const ua = navigator.userAgent || '';
      let os = 'Unknown OS';
      if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
      else if (/Windows NT/i.test(ua)) os = 'Windows';
      else if (/Linux/i.test(ua)) os = 'Linux';

      let browser = 'Unknown Browser';
      if (/Edg/i.test(ua)) browser = 'Edge';
      else if (/Chrome/i.test(ua)) browser = 'Chrome';
      else if (/Safari/i.test(ua)) browser = 'Safari';
      else if (/Firefox/i.test(ua)) browser = 'Firefox';

      return {
        os,
        browser,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio || 1,
        language: navigator.language,
      };
    } catch {
      return {};
    }
  }
}

export const incidentDiagnosticService = IncidentDiagnosticService.getInstance();
