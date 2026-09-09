/**
 * ============================================================================
 * Sovereign Passive Incident Diagnostic & Friction Engine
 * Matany AI (Matany) — Continuous Learning & Self-Healing Architecture
 *
 * Core Responsibility:
 * 1. 100% Passive Error & Crash Capture (window.onerror, unhandledrejection, API failures).
 * 2. Implicit User Friction Detection (Rage reprompts, aborts, corrective prompts).
 * 3. Zero-Latency Asynchronous Dispatch (requestIdleCallback + keepalive fetch).
 * 4. Deduplication & Circuit Breaking to prevent client overhead.
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
  | 'UNKNOWN_FAILURE';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiagnosticIncidentInput {
  category: IncidentCategory;
  severity?: IncidentSeverity;
  userPrompt?: string;
  modelUsed?: string;
  errorCode?: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  sessionId?: string | null;
  userId?: string | null;
  metadata?: Record<string, any>;
}

class IncidentDiagnosticService {
  private static instance: IncidentDiagnosticService | null = null;
  private recentIncidentHashes: Map<string, number> = new Map();
  private lastAssistantResponseTime: number = 0;
  private lastStreamStartTime: number = 0;
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
      // Ignore cross-origin resize / script noise
      if (event.message?.includes('ResizeObserver') || event.message?.includes('Script error')) return;

      this.reportIncident({
        category: 'CLIENT_CRASH',
        severity: 'HIGH',
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
        errorMessage: reason?.message || String(reason) || 'Unhandled Promise Rejection',
        errorStack: reason?.stack || undefined,
        endpoint: window.location.pathname,
      });
    });
  }

  /**
   * Marks the start of a stream turn (to calculate stream abort friction)
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
   * Checks if user prompt represents friction (e.g. corrective reprompt shortly after response)
   */
  public evaluateUserPromptFriction(promptText: string, activeModel?: string, chatId?: string | null): void {
    if (!promptText || typeof promptText !== 'string') return;
    const now = Date.now();
    const timeSinceLastResponseSec = (now - this.lastAssistantResponseTime) / 1000;

    // If within 25 seconds of assistant response and contains friction triggers
    if (this.lastAssistantResponseTime > 0 && timeSinceLastResponseSec <= 25) {
      const hasFrictionTrigger = this.FRICTION_PATTERNS.some((pattern) => pattern.test(promptText));
      if (hasFrictionTrigger) {
        this.reportIncident({
          category: 'USER_FRICTION_REPROMPT',
          severity: 'MEDIUM',
          userPrompt: promptText.slice(0, 300),
          modelUsed: activeModel,
          sessionId: chatId,
          errorMessage: 'User friction detected: immediate corrective reprompt after assistant turn',
          metadata: {
            timeDeltaSeconds: Math.round(timeSinceLastResponseSec),
            detectedPattern: promptText.slice(0, 100),
          },
        });
      }
    }
  }

  /**
   * Evaluates if user aborting a stream represents friction (aborted within 3 seconds of starting)
   */
  public evaluateStreamAbort(activeModel?: string, chatId?: string | null): void {
    const elapsedSec = (Date.now() - this.lastStreamStartTime) / 1000;
    if (this.lastStreamStartTime > 0 && elapsedSec <= 3.5) {
      this.reportIncident({
        category: 'STREAM_ABORT_FRICTION',
        severity: 'LOW',
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

      // Deduplicate identical incidents within 30 seconds window
      const lastSeen = this.recentIncidentHashes.get(dedupKey);
      if (lastSeen && now - lastSeen < 30000) {
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

      // Collect lightweight device context safely
      const deviceInfo = this.getBasicDeviceContext();

      const payload = {
        category: incident.category,
        severity: incident.severity || 'MEDIUM',
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

      // Dispatch non-blockingly using requestIdleCallback or setTimeout
      const dispatchFn = () => {
        try {
          fetch('/api/telemetry/incident', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {
            // Silently swallow network reporting failures to guarantee zero user impact
          });
        } catch {
          // Fire and forget
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
