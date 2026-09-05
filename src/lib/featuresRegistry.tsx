import React from 'react';
import { Sparkles, ShieldCheck, Database, BrainCircuit, Clock, Flame, Zap } from 'lucide-react';
import { cn } from './utils';

export type FeatureIntentType = 'time_detect' | 'ai_detect' | 'metadata_detect' | 'memory_detect' | 'download_detect' | 'fathom_cam' | 'fathom_spark' | 'fathom_search' | 'svg_studio';

export type IntentCategory = 'actionable' | 'informational' | 'none';

export interface DetectedFeatureData {
  id: FeatureIntentType | string;
  name: string;
  nameAr: string;
  badgeLabel: string;
  summary: string;
  details?: string;
  score?: string;
  isAi?: boolean;
  statusPill?: string;
  matchedCount?: number;
  confidence?: number;
  category?: IntentCategory;
  shouldRenderWidget?: boolean;
  extractedParams?: Record<string, any>;
}

export interface FeatureActivationPlan {
  featureId: FeatureIntentType;
  confidence: number;
  category: IntentCategory;
  shouldRenderWidget: boolean;
  shouldInjectContext: boolean;
  extractedParams: Record<string, any>;
  reason: string;
}

export interface MultiIntentPlan {
  plans: Record<FeatureIntentType, FeatureActivationPlan>;
  activeFeatures: DetectedFeatureData[];
  actionableFeatures: DetectedFeatureData[];
  hasActionableIntent: boolean;
  executionPipelineOrder: FeatureIntentType[];
}

export interface FeatureDefinition {
  id: FeatureIntentType;
  name: string;
  nameAr: string;
  badgeLabel: string;
  textClassName: string;
  glassClassName: string;
  badgeClassName: string;
  accentColor: string;
  borderHoverColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  detectIntent: (prompt: string, reasoning?: string, content?: string, context?: any) => boolean;
  extractFeatureData: (prompt: string, reasoning?: string, content?: string, context?: any) => DetectedFeatureData | null;
}

// Multi-Color Radiant Gradient Icons matching each feature's exact typographic spectrum
export const MemoryDetectIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#memory-detect-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="memory-detect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="25%" stopColor="#818cf8" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="75%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
  </svg>
);

export const TimeDetectIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#time-detect-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="time-detect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="25%" stopColor="#93c5fd" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="75%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#6ee7b7" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const AiDetectIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#ai-detect-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="ai-detect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7de4ff" />
        <stop offset="25%" stopColor="#a5b4fc" />
        <stop offset="50%" stopColor="#fbcfe8" />
        <stop offset="75%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#8cf8d2" />
      </linearGradient>
    </defs>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const MetadataDetectIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#metadata-detect-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="metadata-detect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="35%" stopColor="#bae6fd" />
        <stop offset="70%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

export const DownloadDetectIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#download-detect-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="download-detect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="25%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#6ee7b7" />
        <stop offset="75%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const FathomCamIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#fathom-cam-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="fathom-cam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const FathomSparkIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#fathom-spark-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="fathom-spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const FathomSearchIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#fathom-search-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="fathom-search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="30%" stopColor="#38bdf8" />
        <stop offset="70%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M11 8a3 3 0 0 0-3 3" />
  </svg>
);

export const SvgStudioIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 14
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#svg-studio-grad)"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("inline-block shrink-0", className)}
  >
    <defs>
      <linearGradient id="svg-studio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" />
        <stop offset="35%" stopColor="#f43f5e" />
        <stop offset="70%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ─── Utility Helpers & Sanitizers ───────────────────────────────────────────

// Re-export pure memory classification functions and constants from decoupled memoryIntentUtils
export {
  MEMORY_CONCEPTUAL_BLACKLIST,
  MEMORY_RECALL_WHITELIST,
  isPersonalMemoryRecallIntent,
  isPureInformationalQuery
} from './memoryIntentUtils';
import {
  MEMORY_CONCEPTUAL_BLACKLIST,
  MEMORY_RECALL_WHITELIST,
  isPersonalMemoryRecallIntent,
  isPureInformationalQuery
} from './memoryIntentUtils';

// ─── Multi-Intent Feature Orchestrator (Intent Router & Arbiter) ────────────

export const FEATURES_REGISTRY: Record<string, FeatureDefinition> = {
  // ── 1. Memory Detect (pgvector 3-Tier Cognitive Engine)
  memory_detect: {
    id: 'memory_detect',
    name: 'Memory Detect',
    nameAr: 'استدعاء الذاكرة السحابية المتزامنة',
    badgeLabel: 'MEMORY DETECT',
    textClassName: 'memory-detect-text',
    glassClassName: 'memory-detect-glass',
    badgeClassName: 'memory-detect-badge',
    accentColor: '#818cf8',
    borderHoverColor: 'border-indigo-500/40',
    icon: MemoryDetectIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('memory_detect', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      const badgeMatch = content.match(/(?:\[MEMORY-DETECT-BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|MEMORY-DETECT-BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);
      
      const summary = badgeMatch
        ? (badgeMatch[1] || badgeMatch[3])?.trim()
        : context?.memoryDetectSummary || 'تم استدعاء سياق المحادثات السابقة وسجل الحقائق المتزامن سحابياً';

      const details = badgeMatch
        ? (badgeMatch[2] || badgeMatch[4])?.trim()
        : 'الذاكرة السحابية متزامنة ونشطة عبر المعمارية العصبية الممتدة (3-Tier pgvector Engine)';

      return {
        id: 'memory_detect',
        name: 'Memory Detect',
        nameAr: 'استدعاء الذاكرة السحابية المتزامنة',
        badgeLabel: 'MEMORY DETECT',
        summary: summary || 'الذاكرة السحابية متزامنة ونشطة عبر السحابة',
        details,
        statusPill: 'CLOUD MEMORY',
        matchedCount: context?.matchedMemoriesCount || 1,
        confidence: 0.95,
        category: 'actionable'
      };
    }
  },

  // ── 2. Time Detect (Temporal Intelligence & Interactive Countdown/Reminder Widgets)
  time_detect: {
    id: 'time_detect',
    name: 'Time Detect',
    nameAr: 'استشعار وتدقيق المعطيات الزمنية الفائقة',
    badgeLabel: 'TIME DETECT',
    textClassName: 'time-detect-text',
    glassClassName: 'time-detect-glass',
    badgeClassName: 'time-detect-badge',
    accentColor: '#67e8f9',
    borderHoverColor: 'border-cyan-500/40',
    icon: TimeDetectIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('time_detect', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      const timerMatch = content.match(/(?:\[TIME-DETECT-TIMER:\s*(\d+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\])/i);
      const reminderMatch = content.match(/(?:\[TIME-DETECT-REMINDER:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\])/i);
      const badgeMatch = content.match(/(?:\[TIME-DETECT-BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|TIME-DETECT-BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);

      let summary = 'استشعار وتدقيق المعطيات الزمنية الفائقة';
      let details = 'مطابقة التوقيت والسنة المعتمدة (2026)';
      let statusPill = 'LIVE TEMPORAL';

      if (timerMatch) {
        summary = `مؤقت تفاعلي نشط (${timerMatch[2]?.trim() || `${Math.round(parseInt(timerMatch[1], 10)/60)} دقائق`})`;
        details = timerMatch[3]?.trim() || 'العد التنازلي التفاعلي المباشر';
        statusPill = 'INTERACTIVE TIMER';
      } else if (reminderMatch) {
        summary = `تذكير مجدول: ${reminderMatch[2]?.trim() || 'موعد مهم'}`;
        details = `التاريخ المستهدف: ${reminderMatch[1]?.trim()}`;
        statusPill = 'SCHEDULED REMINDER';
      } else if (badgeMatch) {
        summary = (badgeMatch[1] || badgeMatch[3])?.trim() || summary;
        details = (badgeMatch[2] || badgeMatch[4])?.trim() || details;
      }

      return {
        id: 'time_detect',
        name: 'Time Detect',
        nameAr: 'استشعار وتدقيق المعطيات الزمنية الفائقة',
        badgeLabel: 'TIME DETECT',
        summary,
        details,
        statusPill,
        confidence: 0.95,
        category: timerMatch || reminderMatch ? 'actionable' : 'informational'
      };
    }
  },

  // ── 3. AI Detect (5-Pillar Optical Physics, Sensor Noise & Neural Diffusion Forensics)
  ai_detect: {
    id: 'ai_detect',
    name: 'AI Detect',
    nameAr: 'فحص وتحقق الذكاء الاصطناعي والأصالة',
    badgeLabel: 'AI DETECT',
    textClassName: 'ai-detect-text',
    glassClassName: 'ai-detect-glass',
    badgeClassName: 'ai-detect-badge',
    accentColor: '#38bdf8',
    borderHoverColor: 'border-cyan-500/30',
    icon: AiDetectIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('ai_detect', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      const badgeMatch = content.match(/(?:\[AI-DETECT-BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|AI-DETECT-BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);
      
      const verdict = (badgeMatch ? (badgeMatch[1] || badgeMatch[3]) : 'AI-Generated')?.trim() || 'AI-Generated';
      const score = (badgeMatch ? (badgeMatch[2] || badgeMatch[4]) : '99.9%')?.trim() || '99.9%';
      const isAi = verdict.toLowerCase().includes('ai') || verdict.toLowerCase().includes('synthetic') || verdict.toLowerCase().includes('manipulated');

      return {
        id: 'ai_detect',
        name: 'AI Detect',
        nameAr: 'فحص وتحقق الذكاء الاصطناعي والأصالة',
        badgeLabel: 'AI DETECT',
        summary: isAi ? 'صورة مولدة بالذكاء الاصطناعي (AI-Generated)' : 'صورة حقيقية ملتقطة بكاميرا (Authentic Photograph)',
        details: `دقة التوافق الإحصائي والفيزيائي الخماسي: ${score}`,
        score,
        isAi,
        statusPill: score,
        confidence: 0.98,
        category: 'actionable'
      };
    }
  },

  // ── 4. Meta Data Detect (Deep EXIF, Solar Geometry & Camera Forensics)
  metadata_detect: {
    id: 'metadata_detect',
    name: 'Meta Data',
    nameAr: 'استخراج الميتاداتا والعتاد الرقمي',
    badgeLabel: 'META DATA',
    textClassName: 'meta-data-text',
    glassClassName: 'glass-panel',
    badgeClassName: 'glass-panel',
    accentColor: '#38bdf8',
    borderHoverColor: 'border-sky-500/40',
    icon: MetadataDetectIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('metadata_detect', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      return {
        id: 'metadata_detect',
        name: 'Meta Data',
        nameAr: 'استخراج الميتاداتا والعتاد الرقمي',
        badgeLabel: 'META DATA',
        summary: 'البحث الجنائي واستخراج طبقات الميتاداتا والعتاد',
        details: 'تدقيق بيانات الكاميرا، سرعة الغالق، زوايا الظلال الشمسية، وترويسات الحماية الرقمية',
        statusPill: 'EXIF & HARDWARE FORENSICS',
        confidence: 0.92,
        category: 'actionable'
      };
    }
  },

  // ── 5. Download Detect (Multi-Platform Media Extraction & Frictionless Download Cards)
  download_detect: {
    id: 'download_detect',
    name: 'Download Detect',
    nameAr: 'استخراج وتنزيل الوسائط الفائق',
    badgeLabel: 'DOWNLOAD DETECT',
    textClassName: 'download-detect-text',
    glassClassName: 'download-detect-glass',
    badgeClassName: 'download-detect-badge',
    accentColor: '#10b981',
    borderHoverColor: 'border-emerald-500/40',
    icon: DownloadDetectIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('download_detect', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      const badgeMatch = content.match(/(?:\[DOWNLOAD-DETECT-(?:CARD|BADGE):\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD-DETECT-(?:CARD|BADGE):\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);
      const buttonMatch = content.match(/(?:\[DOWNLOAD-BUTTON:\s*([^|\]]+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\])/i);

      let title = 'استخراج وتنزيل الوسائط الفائق (Zero-Ad Direct Stream)';
      let details = 'كشف الجودات العالية (4K/1080p 60fps)، استخلاص MP3 320k، وسحب ألبومات الصور الأصلية';
      let statusPill = 'UNIVERSAL MEDIA ENGINE';

      if (buttonMatch) {
        title = `تحميل مباشر (${buttonMatch[2]?.trim() || '1080p'}) - ${buttonMatch[3]?.trim() || 'وسائط مفحوصة'}`;
        details = 'جاهز للتنزيل الفوري بدون إعلانات';
        statusPill = 'DIRECT STREAM';
      } else if (badgeMatch) {
        title = (badgeMatch[2] || badgeMatch[4] || badgeMatch[1] || badgeMatch[3])?.trim() || title;
      }

      return {
        id: 'download_detect',
        name: 'Download Detect',
        nameAr: 'استخراج وتنزيل الوسائط الفائق',
        badgeLabel: 'DOWNLOAD DETECT',
        summary: title,
        details,
        statusPill,
        confidence: 0.95,
        category: 'actionable'
      };
    }
  },

  // ── 6. Fathom Cam Vision (Deep Post OCR & Image Intelligence Engine)
  fathom_cam: {
    id: 'fathom_cam',
    name: 'Fathom Cam',
    nameAr: 'الإدراك البصري الفائق وقراءة الجداول والصور',
    badgeLabel: 'FATHOM CAM',
    textClassName: 'text-emerald-400 font-bold',
    glassClassName: 'bg-emerald-950/70 border border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
    badgeClassName: 'bg-emerald-950/70 text-emerald-300 border border-emerald-400/40',
    accentColor: '#34d399',
    borderHoverColor: 'border-emerald-400/50',
    icon: FathomCamIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('fathom_cam', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      return {
        id: 'fathom_cam',
        name: 'Fathom Cam',
        nameAr: 'الإدراك البصري الفائق وقراءة الجداول والصور',
        badgeLabel: 'FATHOM CAM',
        summary: 'المسح البصري الفعلي والميكرو-OCR وقراءة الجداول المرفقة بالمنشور',
        details: 'تم تفكيك الصور والجداول واستخراج النصوص بدقة عبر محرك الرؤية Fathom Cam',
        statusPill: 'VISUAL OCR & TABLE PERCEPTION',
        confidence: 0.98,
        category: 'actionable'
      };
    }
  },

  // ── 7. Fathom Spark Multimodal & Code/Doc Intelligence Engine
  fathom_spark: {
    id: 'fathom_spark',
    name: 'Fathom Spark',
    nameAr: 'استيعاب وفحص الوسائط والمستندات والأكواد',
    badgeLabel: 'FATHOM SPARK',
    textClassName: 'text-violet-400 font-bold',
    glassClassName: 'bg-violet-950/70 border border-violet-400/50 text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.3)]',
    badgeClassName: 'bg-violet-950/70 text-violet-300 border border-violet-400/40',
    accentColor: '#a78bfa',
    borderHoverColor: 'border-violet-400/50',
    icon: FathomSparkIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('fathom_spark', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      return {
        id: 'fathom_spark',
        name: 'Fathom Spark',
        nameAr: 'استيعاب وفحص الوسائط والمستندات والأكواد',
        badgeLabel: 'FATHOM SPARK',
        summary: 'استيعاب وسائط الفيديو والصوت وفك الأرشيفات المضغوطة وقراءة الأكواد البرمجية',
        details: 'تم استيعاب وتفكيك ملفات الأكواد والمستندات والوسائط المرفقة بدقة فائقة عبر محرك Fathom Spark',
        statusPill: 'MULTIMODAL & CODE INTELLIGENCE',
        confidence: 0.98,
        category: 'actionable'
      };
    }
  },

  // ── 8. Fathom Search 2.0 Live Intelligence Engine
  fathom_search: {
    id: 'fathom_search',
    name: 'Fathom Search',
    nameAr: 'البحث الحي واستخبارات الويب الفورية',
    badgeLabel: 'FATHOM SEARCH',
    textClassName: 'fathom-search-text',
    glassClassName: 'fathom-search-glass',
    badgeClassName: 'fathom-search-glass',
    accentColor: '#06b6d4',
    borderHoverColor: 'border-cyan-400/50',
    icon: FathomSearchIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('fathom_search', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      return {
        id: 'fathom_search',
        name: 'Fathom Search',
        nameAr: 'البحث الحي واستخبارات الويب الفورية',
        badgeLabel: 'FATHOM SEARCH',
        summary: 'الاستعلام الشبكي المتوازي وتدقيق المصادر الحية عبر Fathom Search',
        details: 'تم استدعاء وفحص نتائج البحث المباشرة وتوثيق المعطيات من مصادر الويب المعتمدة لعام 2026',
        statusPill: 'LIVE SEARCH INTELLIGENCE',
        confidence: 0.99,
        category: 'actionable'
      };
    }
  },

  // ── 9. SVG Studio (Intelligent Vector Design & High-Res PNG Exporter Engine)
  svg_studio: {
    id: 'svg_studio',
    name: 'SVG Studio',
    nameAr: 'استوديو الفيكتور وتصميم رسومات الـ SVG',
    badgeLabel: 'SVG STUDIO',
    textClassName: 'text-pink-400 font-bold',
    glassClassName: 'bg-pink-950/70 border border-pink-400/50 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    badgeClassName: 'bg-pink-950/70 text-pink-300 border border-pink-400/40',
    accentColor: '#ec4899',
    borderHoverColor: 'border-pink-400/50',
    icon: SvgStudioIcon,
    detectIntent: (prompt = '', reasoning = '', content = '', context = {}) => {
      const plan = routeFeatureIntent('svg_studio', prompt, reasoning, content, context);
      return plan.confidence >= 0.6;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      return {
        id: 'svg_studio',
        name: 'SVG Studio',
        nameAr: 'استوديو الفيكتور وتصميم رسومات الـ SVG',
        badgeLabel: 'SVG STUDIO',
        summary: 'محرك تصميم الفيكتور وتوليد رسومات SVG فائقة الجودة والدقة',
        details: 'تم إنشاء كود SVG نقي ومتكامل مع إمكانية التنزيل الفوري بصيغة PNG عالية الدقة (1x, 2x, 4x)',
        statusPill: 'VECTOR ENGINE & PNG EXPORT',
        confidence: 0.99,
        category: 'actionable'
      };
    }
  }
};

// ─── Stage 1 & Stage 2: Intent Router & Execution Arbiter Engine ───────────

function parseRelativeSeconds(text: string): number | null {
  if (!text) return null;
  const m = text.match(/(\d+)\s*(?:ثانية|ثواني|دقيقة|دقائق|ساعة|ساعات|seconds?|secs?|minutes?|mins?|hours?|hrs?)/i);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  if (/ساعة|ساعات|hours?|hrs?/i.test(text)) return val * 3600;
  if (/دقيقة|دقائق|minutes?|mins?/i.test(text)) return val * 60;
  return val;
}

function stripUrlTrackingParams(url: string): string {
  try {
    const u = new URL(url);
    const trackingParams = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'ref_src', 'igshid', 'mibextid', 'si'];
    trackingParams.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Core Bayesian & Syntactic Intent Router
 */
export function routeFeatureIntent(
  featureId: FeatureIntentType,
  prompt: string = '',
  reasoning: string = '',
  content: string = '',
  context: any = {}
): FeatureActivationPlan {
  const p = (prompt || '').trim();
  const pLower = p.toLowerCase();
  const rLower = (reasoning || '').toLowerCase();
  const cLower = (content || '').toLowerCase();
  const hasImages = Boolean(context?.hasImages || context?.attachedImagesCount > 0);
  const isInfoOnly = isPureInformationalQuery(p);

  // 1. Time Detect Router
  if (featureId === 'time_detect') {
    const hasExplicitTimerCmd = /(?:(?:set|create|start|make)\s*(?:a\s*)?timer|alert\s*me\s*in|count\s*down|اعمل\s*تايمر|شغل\s*مؤقت|نبهني\s*بعد|مؤقت\s*\d+|تايمر\s*\d+)/i.test(pLower);
    const hasExplicitReminderCmd = /(?:remind\s*me|set\s*(?:a\s*)?reminder|schedule\s*alert|فكرني|ذكرني|تذكير\s*بـ|تذكير\s*بعد|ميعاد\s*بعد)/i.test(pLower);
    const hasAutoDeleteCmd = /(?:auto[-\s]?delete|self[-\s]?destruct|تدمير\s*ذاتي|احذف\s*الشات\s*بعد|مسح\s*المحادثة\s*تلقائيا)/i.test(pLower);
    const hasTemporalIntelQ = /(?:كم الساعة|الوقت الآن|تاريخ اليوم|اليوم كام|سنة كام|السنة الحالية|كم عمر|عمره كام|فارق السنين|كم سنة بين|متى ولد|متى توفي|ما هو تاريخ|التوقيت الحالي|time in cairo|current time|current date|what year is it)/i.test(pLower);
    
    const hasBadgeInContent = cLower.includes('[time-detect-timer:') || cLower.includes('[time-detect-reminder:') || cLower.includes('[time-detect-autodelete:') || cLower.includes('[time-detect-badge:');
    const hasReasoningRef = rLower.includes('time detect') || rLower.includes('استشعار الإحداثيات الزمنية');

    if (hasBadgeInContent) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {
          timerSeconds: parseRelativeSeconds(pLower) || 300
        },
        reason: 'Badge detected in output content.'
      };
    }

    if (isInfoOnly && !hasExplicitTimerCmd && !hasExplicitReminderCmd && !hasAutoDeleteCmd) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: {},
        reason: 'Suppressed: Informational/historical query without temporal tool requirement.'
      };
    }

    if (hasExplicitTimerCmd || hasExplicitReminderCmd || hasAutoDeleteCmd) {
      const parsedSec = parseRelativeSeconds(pLower);
      return {
        featureId,
        confidence: 0.98,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {
          type: hasExplicitTimerCmd ? 'timer' : hasExplicitReminderCmd ? 'reminder' : 'autodelete',
          durationSeconds: parsedSec || 300
        },
        reason: 'Explicit actionable timer/reminder/autodelete command.'
      };
    }

    if (hasTemporalIntelQ || hasReasoningRef) {
      return {
        featureId,
        confidence: 0.85,
        category: 'informational',
        shouldRenderWidget: false, // Pure backend temporal reasoning, no clock cards
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Temporal intelligence question resolved via backend time directive.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No temporal match.' };
  }

  // 2. Download Detect Router
  if (featureId === 'download_detect') {
    const hasMediaUrl = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|fb\.watch|reddit\.com|threads\.net|vimeo\.com|\S+\.(?:mp4|m3u8|mp3|webm|m4a|jpg|jpeg|png|webp|gif))\S*/i.test(p);
    const hasAnyHttpUrl = /https?:\/\/[^\s<>"'()]+/i.test(p);
    const hasBadgeInContent = cLower.includes('[download-detect-card:') || cLower.includes('[download-button:') || cLower.includes('[download-detect-badge:');

    // Extract cleanest media URL
    let extractedUrl: string | undefined;
    const urlMatch = p.match(/(https?:\/\/[^\s<>"'()]+)/i);
    if (urlMatch) {
      extractedUrl = stripUrlTrackingParams(urlMatch[1]);
    }

    // Explicit download imperative keywords (Mandatory when discussion/questions/opinions are present)
    const hasExplicitDownloadAction = /(?:download|save\s*video|extract\s*audio|get\s*(?:mp4|video|mp3)|rip\s*audio|grab\s*video|save\s*to\s*device|تحميل|تنزيل|حمل|نزلي|نزل|داونلود|سحب\s*(?:الفيديو|المقطع|الصوت)|استخراج\s*(?:الصوت|الفيديو)|احفظ\s*(?:الفيديو|المقطع)|هات\s*(?:الفيديو|المقطع|الصوت)|عايز\s*(?:الفيديو|المقطع|الصوت)|ابعتلي\s*(?:الفيديو|المقطع)|محتاج\s*(?:الفيديو|المقطع|الصوت)|mp3|mp4)/i.test(pLower);

    // Discussion, summary, opinion, analysis, translation, or educational question keywords
    const isDiscussionOrSummaryOrOpinion = /(?:شايف|رأيك|رأي|رايك|صح|غلط|لخص|تلخيص|ملخص|اشرح|شرح|وضح|توضيح|تتوقع|تقييم|حلل|تحليل|ترجم|ترجمة|احكيلي|مين\s*صح|ما\s*رأيك|ايه\s*رايك|ما\s*صحة|ماذا\s*يقصد|عن\s*ماذا|محتوى|الفكرة|summary|summarize|explain|opinion|what\s+do\s+you\s+think|review|fact\s*check|what\s+happened|tell\s+me\s+about)/i.test(pLower);

    const isAudioOnly = /(?:audio|mp3|sound|صوت|صوت فقط|موسيقى|استخراج الصوت|سحب الصوت)/i.test(pLower);

    // Badge in assistant output explicitly signals download card
    if (hasBadgeInContent) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: { url: extractedUrl, isAudioOnly },
        reason: 'Download badge or button emitted in content.'
      };
    }

    // Suppress if purely theoretical question about media platforms without URL or download command
    if (isInfoOnly && !hasMediaUrl && !hasExplicitDownloadAction && !hasAnyHttpUrl) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: {},
        reason: 'Suppressed: Conceptual query about media platforms without download intent.'
      };
    }

    // STRICT GUARD: If a link is shared for Discussion / Summary / Opinion / Advice / Review without explicit download action:
    if ((hasMediaUrl || hasAnyHttpUrl) && isDiscussionOrSummaryOrOpinion && !hasExplicitDownloadAction) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: { url: extractedUrl },
        reason: 'Suppressed: Link provided for semantic discussion, summarization, or opinion without explicit download imperative.'
      };
    }

    // Explicit download command with target media URL or context media
    if (hasExplicitDownloadAction && (hasMediaUrl || hasAnyHttpUrl || context?.detectedMediaUrl)) {
      return {
        featureId,
        confidence: 0.98,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: { url: extractedUrl || context?.detectedMediaUrl, isAudioOnly },
        reason: 'Explicit actionable download command with target media URL.'
      };
    }

    // Standalone URL paste without conversational or discussion text
    const isStandaloneUrl = (hasMediaUrl || hasAnyHttpUrl) && (p.length <= (extractedUrl?.length || 0) + 12) && !isDiscussionOrSummaryOrOpinion && !isInfoOnly;
    if (isStandaloneUrl) {
      return {
        featureId,
        confidence: 0.92,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: { url: extractedUrl, isAudioOnly },
        reason: 'Standalone media link provided without conversational query.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No explicit download command.' };
  }

  // 3. AI Detect Router
  if (featureId === 'ai_detect') {
    const hasAiVerifyIntent = /(?:is this ai|ai generated|deepfake|synthetic|check authenticity|هل هذه الصورة ذكاء اصطناعي|حقيقية ولا ذكاء|مولدة بذكاء|مصنوعة بذكاء|فحص الاصالة|أصالة الصورة|فحص الصورة ai|بصمة ذكاء|كاشف الذكاء|تزييف|is this authentic|fake or real)/i.test(pLower);
    const hasBadgeInContent = cLower.includes('[ai-detect-badge:') || cLower.includes('ai-detect-badge');
    const hasReasoningRef = rLower.includes('ai detect') || rLower.includes('فحص وتحقق الذكاء الاصطناعي') || rLower.includes('5-pillar forensic');

    if (hasBadgeInContent) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'AI detect badge in content.'
      };
    }

    // Suppress if theoretical essay/question about how AI detectors work without verification target
    if (isInfoOnly && !hasImages && !hasAiVerifyIntent) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: {},
        reason: 'Suppressed: Conceptual query about AI detection technology.'
      };
    }

    if (hasAiVerifyIntent || (hasImages && /(?:authentic|real|fake|ai|حقيقي|ذكاء)/i.test(pLower)) || hasReasoningRef) {
      return {
        featureId,
        confidence: 0.95,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: { hasAttachedImage: hasImages },
        reason: 'Actionable authenticity/AI generation verification request.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No AI verification intent.' };
  }

  // 4. Meta Data Detect Router
  if (featureId === 'metadata_detect') {
    const hasMetadataIntent = /(?:metadata|exif|camera settings|shutter speed|aperture|iso settings|focal length|gps coordinates|ميتاداتا|الميتاداتا|ميتا\s?داتا|بيانات الـ exif|بيانات الكاميرا|موقع التقاط الصورة|إحداثيات gps|نوع الكاميرا المستخدمة|فتحة العدسة|سرعة الغالق)/i.test(pLower);
    const hasBadgeInContent = cLower.includes('[metadata-detect') || cLower.includes('metadata-detect');
    const hasReasoningRef = rLower.includes('metadata detect') || rLower.includes('استخراج الميتاداتا');

    if (hasBadgeInContent) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Metadata detect badge in content.'
      };
    }

    if (isInfoOnly && !hasImages && !/(?:extract|check|read|show)\s*metadata/i.test(pLower)) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: {},
        reason: 'Suppressed: Conceptual query about metadata headers without file target.'
      };
    }

    if (hasMetadataIntent || (hasImages && hasReasoningRef)) {
      return {
        featureId,
        confidence: 0.92,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: { hasAttachedImage: hasImages },
        reason: 'Actionable forensic EXIF and file header extraction request.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No metadata extraction intent.' };
  }

  // 5. Memory Detect Router
  if (featureId === 'memory_detect') {
    const isPersonalRecall = isPersonalMemoryRecallIntent(p);
    const hasBadgeInContent = cLower.includes('[memory-detect-badge') || cLower.includes('memory-detect');
    const hasReasoningRef = isPersonalRecall && (rLower.includes('memory detect') || rLower.includes('الذاكرة السحابية') || rLower.includes('المحادثة السابقة مباشرة'));
    const isContextTriggered = Boolean(context?.isMemoryDetectTriggered && isPersonalRecall);

    // Strict Blacklist Check: If not personal recall and no badge in content, force 0 confidence
    if (!isPersonalRecall && !hasBadgeInContent) {
      return {
        featureId,
        confidence: 0.0,
        category: 'none',
        shouldRenderWidget: false,
        shouldInjectContext: false,
        extractedParams: {},
        reason: 'Suppressed: Conceptual/biological/hardware memory query or non-recall intent.'
      };
    }

    if (hasBadgeInContent || isContextTriggered) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Memory detect badge or verified backend recall context triggered.'
      };
    }

    if (isPersonalRecall || hasReasoningRef) {
      return {
        featureId,
        confidence: 0.95,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Actionable cross-session memory recall request.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No memory recall intent.' };
  }

  // 6. Fathom Cam Vision Intent (Pure optical image & screenshot inspection)
  if (featureId === 'fathom_cam') {
    const hasFathomBadge = cLower.includes('fathom cam') || cLower.includes('[link & visual context') || cLower.includes('fathom-cam');
    const hasFathomReasoning = rLower.includes('fathom cam') || rLower.includes('fathom_cam') || rLower.includes('محرك الرؤية') || rLower.includes('فحص الصور') || rLower.includes('قراءة الجداول') || rLower.includes('المسح البصري') || rLower.includes('تحليل الواجهة') || rLower.includes('واجهة');
    const isVisionPrompt = /(?:الواجه|الواجهة|الصورة|الصور|التصميم|الاسكرين|الشاشة|الجدول|البوست|الشعار|اللوجو|الأيقون|الألوان|الخطوة\s*الرابعة|جدول\s*الرغبات)/i.test(pLower);
    const isContextTriggered = Boolean(context?.hasFathomCam || context?.hasVisualPerception || context?.hasImagesInHistory || context?.hasImages);

    if (hasFathomBadge || isContextTriggered || (hasFathomReasoning && (isVisionPrompt || isContextTriggered))) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Fathom Cam Vision badge, multi-turn image context, or visual reasoning active.'
      };
    }

    if (hasFathomReasoning) {
      return {
        featureId,
        confidence: 0.95,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Fathom Cam Vision reasoning active.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No Fathom Cam vision intent.' };
  }

  // 7. Fathom Spark Media, Code, Zip & Document Intent
  if (featureId === 'fathom_spark') {
    const hasSparkBadge = cLower.includes('fathom spark') || cLower.includes('fathom-spark') || cLower.includes('[fathom spark]') || cLower.includes('muse-spark');
    const isContextTriggered = Boolean(context?.hasNonImageMedia || context?.hasDocs || context?.hasZip || context?.hasSpark || context?.hasMediaAttachments || context?.hasVideo || context?.hasAudio);
    const hasSparkReasoning = (rLower.includes('fathom spark') || rLower.includes('fathom_spark') || rLower.includes('تفكيك وسائط') || rLower.includes('تفريغ الصوت') || rLower.includes('أرشيف مضغوط')) && isContextTriggered;
    const isSparkPrompt = /(?:كود|أكواد|مستند|مستندات|صوتيات|أرشيف|مضغوط|zip|tar|script|compare|مقارنة|النسخة|قبل|بعد)/i.test(pLower) && isContextTriggered;

    if (hasSparkBadge || isContextTriggered || (hasSparkReasoning && isSparkPrompt)) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Fathom Spark code, archive, document, or media context active.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No Fathom Spark intent.' };
  }

  // 8. Fathom Search Live Web Intelligence Intent
  if (featureId === 'fathom_search') {
    const hasSearchBadge = cLower.includes('fathom search') || cLower.includes('[live web intelligence]') || cLower.includes('المصادر الموثقة') || cLower.includes('fathom-search') || cLower.includes('fathom_search');
    const hasSearchReasoning = rLower.includes('fathom search') || rLower.includes('fathom_search') || rLower.includes('البحث الحي') || rLower.includes('الاستعلام الشبكي') || rLower.includes('live web intelligence') || rLower.includes('نتائج البحث') || rLower.includes('تدقيق المصادر') || rLower.includes('our search result') || rLower.includes('search result') || rLower.includes('news.google.com') || rLower.includes('google search') || rLower.includes('search memory') || rLower.includes("let's search") || rLower.includes('search sources') || rLower.includes('web search');
    const isSearchPrompt = /(?:ابحث|بحث|سيرش|search|google|مصادر\s*حية|تواريخ\s*قطعية|استقصائي|بيانات\s*متقاطعة|ما\s*هو\s*سعر|اخر\s*اخبار|آخر\s*أخبار|اليوم|2026)/i.test(pLower);
    const isSearchContext = Boolean(context?.hasSearchGrounding || context?.deepSearch || context?.isSearchActive || (context as any)?.hasSearch);

    if (hasSearchBadge || isSearchContext || hasSearchReasoning || (isSearchPrompt && rLower.length > 0)) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'Fathom Search live web intelligence and verified sources active.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No Fathom Search intent.' };
  }

  // 9. SVG Studio Live Vector & High-Res PNG Engine Intent
  if (featureId === 'svg_studio') {
    const hasSvgBadge = cLower.includes('svg studio') || cLower.includes('svg-studio') || cLower.includes('[svg-studio');
    const hasSvgCode = cLower.includes('```svg') || (cLower.includes('<svg') && cLower.includes('</svg>'));
    const hasSvgReasoning = rLower.includes('svg') || rLower.includes('فيكتور') || rLower.includes('vector studio') || rLower.includes('svg studio');
    const isSvgPrompt = (
      pLower.includes('svg') &&
      /(?:تصميم|صمم|ارسم|رسم|رسمة|شعار|لوجو|ايقونة|أيقونة|أيقونات|فيكتور|متجهات|صورة|كود|انشئ|أنشئ|اعمل|سوي|ولد|توليد|إنفوجرافيك|انفوجرافيك|رمز|شارة|طابع|زخرفة|تعديل|عدل|غير|بدل|design|logo|icon|art|vector|graphic|draw|create|generate|illustration|emblem|badge|diagram|format|png|jpg)/i.test(pLower)
    ) || /(?:فيكتور|متجهات|vector\s*graphics?|vector\s*art|vector\s*illustration)/i.test(pLower) ||
    /\b(?:draw|create|generate|design)\s+(?:an?\s+)?(?:svg|vector)/i.test(pLower) ||
    /(?:تصميم|صمم|ارسم|رسم|اعمل|سوي|ولد|توليد|انشئ|أنشئ|ابني|صنع|draw|design|create|generate)\s+(?:لي\s+)?(?:صورة\s+)?(?:لوجو|شعار|ايقونة|أيقونة|أيقونات|شارة|رمز\s*بصري|إنفوجرافيك|انفوجرافيك|طابع|ختم|logo|icon|icons|emblem|badge|symbol|banner)/i.test(pLower) ||
    /(?:لوجو|شعار|ايقونة|أيقونة)\s+(?:احترافي|حديث|فكتور|بصري|مبتكر|لـ|للـ|عن|بسيط|متقن)/i.test(pLower) ||
    /(?:ارسم|صمم)\s+(?:لي\s+)?(?:رسمة|صورة\s+فيكتور|شكل\s+هندسي|رسم\s+شعاعي)/i.test(pLower) ||
    /(?:غير|عدل|بدل|لون|اضف|أضف|احذف|شيل|حول|ضع|خليه|خلها|اجعله|اجعلها|سوه|سوها)\s+(?:لي\s+)?(?:الخلفية|خلفية|لون|الوان|ألوان|الألوان|الالوان|الشعار|اللوجو|الايقونة|الأيقونة|الفيكتور|التصميم|العنصر|الرمز|الكتابة|ذهبي|فضي|أبيض|ابيض|أسود|اسود|أحمر|احمر|أزرق|ازرق|أخضر|اخضر|شفاف|شفافة|نيون|داكن|مضيء|أغمق|أفتح)/i.test(pLower) ||
    /\b(?:change|modify|update|edit|recolor)\s+(?:the\s+)?(?:background|color|colors|logo|icon|svg|vector|style|design)\b/i.test(pLower);

    if (hasSvgBadge || hasSvgCode || isSvgPrompt || hasSvgReasoning) {
      return {
        featureId,
        confidence: 1.0,
        category: 'actionable',
        shouldRenderWidget: true,
        shouldInjectContext: true,
        extractedParams: {},
        reason: 'SVG Studio vector design or SVG code block active.'
      };
    }

    return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'No SVG Studio intent.' };
  }

  return { featureId, confidence: 0.0, category: 'none', shouldRenderWidget: false, shouldInjectContext: false, extractedParams: {}, reason: 'Unknown feature.' };
}

/**
 * Universal Multi-Intent Orchestrator API
 * Evaluates all features in parallel, resolves multi-feature co-activation, and establishes execution order.
 */
export function detectIntentsMulti(
  prompt: string = '',
  reasoning: string = '',
  content: string = '',
  context: any = {}
): MultiIntentPlan {
  const featureIds: FeatureIntentType[] = ['fathom_search', 'download_detect', 'svg_studio', 'fathom_spark', 'fathom_cam', 'ai_detect', 'metadata_detect', 'memory_detect', 'time_detect'];
  
  const plans: Record<FeatureIntentType, FeatureActivationPlan> = {} as any;
  const activeFeatures: DetectedFeatureData[] = [];
  const actionableFeatures: DetectedFeatureData[] = [];

  featureIds.forEach(id => {
    const plan = routeFeatureIntent(id, prompt, reasoning, content, context);
    plans[id] = plan;

    if (plan.confidence >= 0.6) {
      const def = FEATURES_REGISTRY[id];
      const data = def.extractFeatureData(prompt, reasoning, content, context);
      if (data) {
        data.confidence = plan.confidence;
        data.category = plan.category;
        data.shouldRenderWidget = plan.shouldRenderWidget;
        data.extractedParams = plan.extractedParams;
        activeFeatures.push(data);

        if (plan.category === 'actionable') {
          actionableFeatures.push(data);
        }
      }
    }
  });

  // Pipeline Execution Order: Download/Extraction -> SVG Studio -> Fathom Cam Vision -> AI Forensics -> Metadata Headers -> Memory Context -> Time/Widgets
  const executionPipelineOrder: FeatureIntentType[] = [];
  if (plans.download_detect.confidence >= 0.6) executionPipelineOrder.push('download_detect');
  if (plans.svg_studio?.confidence >= 0.6) executionPipelineOrder.push('svg_studio');
  if (plans.fathom_cam.confidence >= 0.6) executionPipelineOrder.push('fathom_cam');
  if (plans.ai_detect.confidence >= 0.6) executionPipelineOrder.push('ai_detect');
  if (plans.metadata_detect.confidence >= 0.6) executionPipelineOrder.push('metadata_detect');
  if (plans.memory_detect.confidence >= 0.6) executionPipelineOrder.push('memory_detect');
  if (plans.time_detect.confidence >= 0.6) executionPipelineOrder.push('time_detect');

  return {
    plans,
    activeFeatures,
    actionableFeatures,
    hasActionableIntent: actionableFeatures.length > 0,
    executionPipelineOrder
  };
}

/**
 * Backward-compatible helper to discover and extract all active detected features for a given message
 */
export function getActiveDetectedFeatures(
  prompt: string = '',
  reasoning: string = '',
  content: string = '',
  context: any = {}
): DetectedFeatureData[] {
  const plan = detectIntentsMulti(prompt, reasoning, content, context);
  return plan.activeFeatures;
}

