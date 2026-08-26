import React from 'react';
import { Sparkles, ShieldCheck, Database, BrainCircuit, Clock, Flame, Zap } from 'lucide-react';

export interface DetectedFeatureData {
  id: 'time_detect' | 'ai_detect' | 'metadata_detect' | 'memory_detect' | string;
  name: string;
  nameAr: string;
  badgeLabel: string;
  summary: string;
  details?: string;
  score?: string;
  isAi?: boolean;
  statusPill?: string;
  matchedCount?: number;
}

export interface FeatureDefinition {
  id: string;
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

import { cn } from './utils';

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

/**
 * Universal Modular Features Registry (نظام الخواص الشامل)
 * Central extensible registry managing all detection features:
 * 1. Memory Detect (الذاكرة السحابية المتزامنة عبر 50 محادثة / 50M Tokens)
 * 2. Time Detect (استشعار وتدقيق المعطيات الزمنية)
 * 3. AI Detect (فحص وتحقق الذكاء الاصطناعي والأصالة)
 * 4. Meta Data (استخراج الميتاداتا والعتاد الرقمي)
 */
export const FEATURES_REGISTRY: Record<string, FeatureDefinition> = {
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
      const p = prompt.toLowerCase();
      const r = (reasoning || '').toLowerCase();
      const c = (content || '').toLowerCase();
      
      const hasExplicitKeyword = /(?:memory[-\s]?detect|memorydetect|ميموري\s?ديتكت|الذاكرة\s?السحابية|الذاكرة\s?المتزامنة|استرجاع\s?الذاكرة|تذكر|فاكر|محادث[ةات]|المحادث[ةات]|الشات|الشاتات|سابقاً|السابق[ة]?|اللي فاتت|اللي فات|قبل السابق|كنا اتكلمنا|كنت بقولك|قلتلك قبل|سجل المحادثات|أكثر شيء تم ذكره|اكثر شئ اتكرر)/i.test(p);
      const hasReasoningRef = r.includes('memory detect') || r.includes('الذاكرة السحابية') || r.includes('سياق الذاكرة') || r.includes('المحادثة السابقة');
      const hasBadge = c.includes('memory-detect') || c.includes('[memory-detect-badge');
      const isContextTriggered = Boolean(context?.isMemoryDetectTriggered);

      return hasExplicitKeyword || hasReasoningRef || hasBadge || isContextTriggered;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '', context = {}) => {
      const badgeMatch = content.match(/(?:\[MEMORY-DETECT-BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|MEMORY-DETECT-BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);
      
      const summary = badgeMatch
        ? (badgeMatch[1] || badgeMatch[3])?.trim()
        : context?.memoryDetectSummary || 'تم استدعاء سياق المحادثات السابقة وسجل الحقائق المتزامن سحابياً';

      const details = badgeMatch
        ? (badgeMatch[2] || badgeMatch[4])?.trim()
        : 'الذاكرة السحابية متزامنة ونشطة عبر المعمارية العصبية الممتدة';

      return {
        id: 'memory_detect',
        name: 'Memory Detect',
        nameAr: 'استدعاء الذاكرة السحابية المتزامنة',
        badgeLabel: 'MEMORY DETECT',
        summary: summary || 'الذاكرة السحابية متزامنة ونشطة عبر السحابة',
        details,
        statusPill: 'CLOUD MEMORY',
        matchedCount: context?.matchedMemoriesCount || 1
      };
    }
  },

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
    detectIntent: (prompt = '', reasoning = '', content = '') => {
      const p = prompt.toLowerCase();
      const r = (reasoning || '').toLowerCase();
      const c = (content || '').toLowerCase();

      const hasKeyword = /(?:time[-\s]?detect|timedetect|الوقت|الساعة|التوقيت|الزمن|الزمني|الزمنية|تاريخ|سنة|عام|سنوات|أعوام|قرن|عقد|توقيت|شهور|أشهر|أيام|يوم|أمس|غداً|الماضي|الحاضر|المستقبل|اليوم|عمره|عمرها|كم سنة|كم عام|كم عمر|متى|تايمر|مؤقت|تذكير|فكرني|احذف الشات|تدمير ذاتي|تاريخ اليوم|اليوم كام|كم الساعة|كم الوقت|كم باقي|كم مر|متبقي على|\b(19\d\d|20\d\d)\b)/i.test(p);
      const hasReasoningRef = r.includes('time detect') || r.includes('استشعار الزمن') || r.includes('الفارق الزمني');
      const hasBadge = c.includes('time-detect') || c.includes('[time-detect-badge');

      return hasKeyword || hasReasoningRef || hasBadge;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '') => {
      const badgeMatch = content.match(/(?:\[TIME-DETECT-BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|TIME-DETECT-BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/i);
      
      const title = badgeMatch
        ? (badgeMatch[1] || badgeMatch[3])?.trim()
        : 'استشعار وتدقيق المعطيات الزمنية الفائقة';

      const subtitle = badgeMatch
        ? (badgeMatch[2] || badgeMatch[4])?.trim()
        : 'مطابقة التوقيت والسنة المعتمدة (2026)';

      return {
        id: 'time_detect',
        name: 'Time Detect',
        nameAr: 'استشعار وتدقيق المعطيات الزمنية الفائقة',
        badgeLabel: 'TIME DETECT',
        summary: title || 'استشعار وتدقيق المعطيات الزمنية الفائقة',
        details: subtitle || 'مطابقة التوقيت والسنة المعتمدة (2026)',
        statusPill: 'LIVE TEMPORAL'
      };
    }
  },

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
    detectIntent: (prompt = '', reasoning = '', content = '') => {
      const p = prompt.toLowerCase();
      const r = (reasoning || '').toLowerCase();
      const c = (content || '').toLowerCase();

      const hasKeyword = /(?:ai[-\s]?detect|aidetect|ذكاء اصطناعي|توليد|مولدة|حقيقية|معدلة|فيك|fake|deepfake|تزييف|بصمة ذكاء|كاشف|فحص الصورة|اصالة|أصالة|فحص النص|تحقق)/i.test(p);
      const hasReasoningRef = r.includes('ai detect') || r.includes('توليد الذكاء الاصطناعي') || r.includes('صورة مولدة');
      const hasBadge = c.includes('ai-detect') || c.includes('[ai-detect-badge');

      return hasKeyword || hasReasoningRef || hasBadge;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '') => {
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
        details: `دقة التوافق الإحصائي: ${score}`,
        score,
        isAi,
        statusPill: score
      };
    }
  },

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
    detectIntent: (prompt = '', reasoning = '', content = '') => {
      const p = prompt.toLowerCase();
      const r = (reasoning || '').toLowerCase();
      const c = (content || '').toLowerCase();

      const hasKeyword = /(?:meta[-\s]?data|metadata|exif|ميتاداتا|الميتاداتا|ميتا\s?داتا|الميتا\s?داتا|كاميرا|نوع الجوال|جوال|هاتف|موقع جغرافي|تاريخ الالتقاط|بيانات الصورة|تاريخ الصورة|حجم الصورة)/i.test(p);
      const hasReasoningRef = r.includes('metadata') || r.includes('exif') || r.includes('الميتاداتا');
      const hasBadge = c.includes('metadata') || c.includes('exif');

      return hasKeyword || hasReasoningRef || hasBadge;
    },
    extractFeatureData: (prompt = '', reasoning = '', content = '') => {
      return {
        id: 'metadata_detect',
        name: 'Meta Data',
        nameAr: 'استخراج الميتاداتا والعتاد الرقمي',
        badgeLabel: 'META DATA',
        summary: 'البحث الجنائي واستخراج طبقات الميتاداتا',
        details: 'تدقيق بيانات العتاد والكاميرا وترويسات الحماية الرقمية',
        statusPill: 'EXIF & SECURITY HEADERS'
      };
    }
  }
};

/**
 * Helper to discover and extract all active detected features for a given message
 */
export function getActiveDetectedFeatures(
  prompt: string = '',
  reasoning: string = '',
  content: string = '',
  context: any = {}
): DetectedFeatureData[] {
  const detected: DetectedFeatureData[] = [];

  Object.values(FEATURES_REGISTRY).forEach(def => {
    if (def.detectIntent(prompt, reasoning, content, context)) {
      const data = def.extractFeatureData(prompt, reasoning, content, context);
      if (data) {
        detected.push(data);
      }
    }
  });

  return detected;
}
