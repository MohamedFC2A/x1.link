import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Brain, Cpu, Check, ChevronDown, Camera, Sparkles, Search, Globe, ListOrdered } from "lucide-react";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";
import { motion, AnimatePresence } from "framer-motion";
import { DetectedFeatureData, FEATURES_REGISTRY, TimeDetectIcon, MemoryDetectIcon } from "@/lib/featuresRegistry";

export interface ReasoningStep {
  type: string;
  text?: string;
  toolName?: string;
  output?: any;
}

export interface ChatReasoningProps {
  reasoningText?: string;
  partsInAccordion?: ReasoningStep[];
  isThinking?: boolean;
  isStreaming?: boolean;
  isMatany?: boolean;
  isTimeIntent?: boolean;
  activeFeatures?: DetectedFeatureData[];
  defaultValue?: string;
  className?: string;
}

export interface Milestone {
  id: string;
  title: string;
  details?: string;
  status: 'completed' | 'in-progress' | 'pending';
  specialType?: 'search' | 'cam' | 'spark' | null;
  searchQuery?: string;
  sourcesCount?: number;
}

export function AnimatedDots({ className = "bg-indigo-400" }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-1 mx-1 align-baseline select-none">
      <span
        className={cn("size-1 rounded-full animate-dots-wave", className)}
        style={{ animationDelay: '-0.32s' }}
      />
      <span
        className={cn("size-1 rounded-full animate-dots-wave", className)}
        style={{ animationDelay: '-0.16s' }}
      />
      <span
        className={cn("size-1 rounded-full animate-dots-wave", className)}
        style={{ animationDelay: '0s' }}
      />
    </span>
  );
}

export function RadarDot({ color = "bg-indigo-400", ringColor = "bg-indigo-400" }: { color?: string; ringColor?: string }) {
  return (
    <span className="relative flex size-2 items-center justify-center shrink-0">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", ringColor)} />
      <span className={cn("relative inline-flex size-1.5 rounded-full", color)} />
    </span>
  );
}

export type FathomSearchDomain =
  | 'web'
  | 'ai_detect'
  | 'memory'
  | 'temporal'
  | 'code'
  | 'conversation';

export interface FathomSearchContextualInfo {
  domain: FathomSearchDomain;
  title: string;
  contextSentence: string;
}

export function getFathomSearchContextualInfo(
  text: string = '',
  activeFeatures: DetectedFeatureData[] = []
): FathomSearchContextualInfo {
  const content = text || '';

  // 1. AI Video / Image Forensic Check
  const hasAiDetect = activeFeatures.some(f => f.id === 'ai_detect' || f.id === 'metadata_detect') ||
    /(?:ai[- ]?detect|فحص\s*الذكاء\s*الاصطناعي|تزييف\s*عميق|deepfake|مولدة\s*بالذكاء|مولد\s*بالذكاء|fake\s*image|ai[- ]?generated|real\s*or\s*fake|حقيقية\s*أم\s*ذكاء|حقيقي\s*ولا\s*ذكاء|صورة\s*حقيقية|معدلة\s*بالذكاء)/i.test(content);

  if (hasAiDetect) {
    return {
      domain: 'ai_detect',
      title: 'Fathom Search of AI Vid or Img',
      contextSentence: 'فحص الطبقات البصرية والكشف الجنائي المتقدم عن ملامح التوليد الاصطناعي والتزييف العميق.'
    };
  }

  // 2. Neural Memory Retrieval
  const hasMemory = activeFeatures.some(f => f.id === 'memory_detect') ||
    /(?:memory[- ]?detect|استدعاء\s*الذاكرة|تذكر|سياق\s*المحادثات\s*السابقة|الذاكرة\s*العصبية|pgvector|سجل\s*الحقائق|ماذا\s*قلت\s*لك|فاكر|ذاكرتي)/i.test(content);

  if (hasMemory) {
    return {
      domain: 'memory',
      title: 'Fathom Search of Neural Memory',
      contextSentence: 'استرجاع فائق عبر الذاكرة العصبية وتجميع السياق العابر للجلسات من قاعدة المعرفة المستدامة.'
    };
  }

  // 3. Temporal Context / Time & Date Analysis
  const hasTime = activeFeatures.some(f => f.id === 'time_detect') ||
    /(?:time[- ]?detect|كم\s*الساعة|تاريخ\s*اليوم|الوقت\s*الحالي|اليوم\s*ايه|سنة\s*2026|temporal\s*context)/i.test(content);

  if (hasTime) {
    return {
      domain: 'temporal',
      title: 'Fathom Search of Temporal Context',
      contextSentence: 'معايرة الإحداثيات الزمنية الحالية ومطابقة التواريخ والتقويم الفعلي بدقة آنية.'
    };
  }

  // 4. Code & Architecture Research
  const hasCode = activeFeatures.some(f => f.id === 'fathom_spark') ||
    /(?:معمارية|كود\s*برمجي|خوارزمية|refactor|architecture|codebase|repository|github|docker|ast|typescript|python|react|دوال|أكواد|بنية\s*المشروع)/i.test(content);

  if (hasCode && !/(?:بحث\s*عن|استعلام\s*شبكي|web\s*search|سعر|طقس|أخبار|نتائج)/i.test(content)) {
    return {
      domain: 'code',
      title: 'Fathom Search of Code & Architecture',
      contextSentence: 'استكشاف وتشريح معماريات البرمجيات ومراجعة المعايير الهندسية وأنماط التصميم.'
    };
  }

  // 5. Dialogue & Chat Context
  const hasConversationContext = /(?:سياق\s*المحادثة|الحوار\s*السابق|الملفات\s*المرفقة|متابعة\s*النقاش|ملخص\s*الشات|حديثنا|محادثتنا)/i.test(content);

  if (hasConversationContext && !/(?:بحث\s*عن|استعلام\s*شبكي|web\s*search|سعر|طقس|أخبار)/i.test(content)) {
    return {
      domain: 'conversation',
      title: 'Fathom Search of Conversation & Context',
      contextSentence: 'استيعاب متعدد الطبقات لسياق المحادثة وبناء الروابط المنطقية بين الرسائل والملفات.'
    };
  }

  // 6. Default: Live Web Query
  return {
    domain: 'web',
    title: 'Fathom Search of Web',
    contextSentence: 'استطلاع فائق وموسع للويب الحي وتدقيق المصادر واستخلاص الحقائق عبر فروع معرفية متزامنة.'
  };
}

/**
 * Parses raw reasoning into clean, high-level task titles with hidden deep thinking details.
 */
export function parseReasoningMilestones(
  rawText: string,
  isThinking: boolean,
  hasFathomCam: boolean = false,
  hasFathomSpark: boolean = false,
  hasFathomSearch: boolean = false,
  activeFeatures: DetectedFeatureData[] = []
): Milestone[] {
  const searchContext = getFathomSearchContextualInfo(rawText, activeFeatures);

  // Base default milestones when stream is just starting or empty
  if (!rawText || !rawText.trim()) {
    const defaultSteps: Milestone[] = [];

    if (hasFathomSearch) {
      defaultSteps.push({
        id: 'step-fathom-search',
        title: searchContext.title,
        details: isThinking ? searchContext.contextSentence : 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'search',
        searchQuery: '',
        sourcesCount: 0,
      });
      return defaultSteps;
    }

    if (hasFathomCam) {
      defaultSteps.push({
        id: 'step-cam',
        title: 'المسح البصري وقراءة النصوص • Fathom Cam',
        details: isThinking ? undefined : 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'cam',
      });
      return defaultSteps;
    }

    if (hasFathomSpark) {
      defaultSteps.push({
        id: 'step-spark',
        title: 'معالجة الوسائط والأكواد • Fathom Spark',
        details: isThinking ? undefined : 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'spark',
      });
      return defaultSteps;
    }

    defaultSteps.push({
      id: 'step-reasoning-0',
      title: 'تحليل معطيات المسألة',
      details: isThinking ? undefined : 'تحديد المعالم الأساسية، قيود السياق، واستبعاد الفرضيات المتناقضة.',
      status: isThinking ? 'in-progress' : 'completed',
    });

    return defaultSteps;
  }

  // Clean raw text from think tags and prompt leaks
  const isPromptLeak = (str: string) => {
    return /(?:DEVELOPER_IDENTITY|SYSTEM_PROMPT|النظام\s*يقول|حظر\s*مطلق|قاعدة\s*الاستجابة|تعليمات\s*الهوية|قواعد\s*النظام|المطور\s*الأساسي|Mohamed\s*Ahmed\s*Matany|MatanyLabs|Context-Proportional\s*Attribution|Strict\s*Exclusivity|Identity\s*vs\s*Conversations)/i.test(str);
  };

  const cleaned = rawText
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .replace(/<\|(?:begin_of_thought|thought|think)\|>/gi, '')
    .replace(/<\|(?:end_of_thought|\/thought|\/think)\|>/gi, '')
    .replace(/```(?:thought|think|thinking|reasoning)\s*\n?/gi, '')
    .replace(/```$/gi, '')
    .trim();

  // Detect Search intent & metadata
  const hasSearchDetected = hasFathomSearch ||
    /🔍\s*\[استعلام حي وتدقيق المصادر/i.test(cleaned) ||
    /\[(?:الاستعلام\s*الشبكي|Fathom\s*Search|Serper\s*AI)\]/i.test(cleaned) ||
    /•\s*المصدر\s*\[\d+\]/i.test(cleaned);

  let detectedSearchQuery = '';
  const queryMatch = cleaned.match(/\[(?:البحث عن|query)\s*:\s*["']?([^\]"']+)["']?\]/i) ||
                     cleaned.match(/(?:البحث عن|استعلام عن)\s*[:"']?\s*["']?([^"\n\r\]•]+)["']?/i);
  if (queryMatch && queryMatch[1]?.trim()) {
    detectedSearchQuery = queryMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  const sourceCountMatch = cleaned.match(/(\d+)\s*مصادر/i);
  let detectedSourcesCount = sourceCountMatch ? parseInt(sourceCountMatch[1], 10) : 0;
  const sourceMatches = cleaned.match(/•\s*المصدر\s*\[\d+\]/g);
  if (sourceMatches && sourceMatches.length > detectedSourcesCount) {
    detectedSourcesCount = sourceMatches.length;
  }

  // Extract source list details for expandable view
  const sourceLines = cleaned.split('\n').filter(l => /^(?:•\s*المصدر|المصدر\s*\[\d+\]|المقتطف\s*[:]|رابط\s*[:])/i.test(l.trim()));
  const searchSourcesDetails = sourceLines.length > 0 ? sourceLines.join('\n').trim() : '';

  // Clean the pure narrative from all search banner tags, raw brackets, and sources lines
  const pureNarrative = cleaned
    .replace(/🔍\s*\[استعلام حي وتدقيق المصادر[^\]]*\]\s*/gi, '')
    .replace(/(?:-?\s*\[?(?:الاستعلام\s*الشبكي|Fathom\s*Search|Serper\s*AI)\]?|•\s*المصدر\s*\[\d+\])[^\n]*(\n|$)/gi, '')
    .split('\n')
    .filter(l => !isPromptLeak(l))
    .join('\n')
    .trim();

  // Helper to split text by explicit sections, paragraphs, or full sentences without splitting words
  // Helper to split text by explicit sections, paragraphs, or full sentences without splitting words or jumping between stages
  const splitTextGracefully = (text: string, partsCount: number, isThinkingStream: boolean = false): string[] => {
    if (!text || !text.trim()) return [];
    const trimmed = text.trim();

    // Helper: Distribute items into partsCount buckets monotonically and smoothly
    const partitionItems = (items: string[], separator = '\n\n'): string[] => {
      if (items.length === 0) return [];
      if (items.length <= partsCount) {
        return items;
      }
      if (isThinkingStream) {
        // Progressive allocation during live stream:
        // Keep initial (partsCount - 1) stages stable, while trailing items accrue in the final active stage.
        // This permanently eliminates the issue of text jumping backwards across steps.
        const result: string[] = [];
        for (let i = 0; i < partsCount - 1; i++) {
          result.push(items[i]);
        }
        result.push(items.slice(partsCount - 1).join(separator));
        return result;
      } else {
        // Balanced fair bin-packing when stream is finished
        const result: string[] = [];
        const baseSize = Math.floor(items.length / partsCount);
        const remainder = items.length % partsCount;
        let currentIndex = 0;
        for (let b = 0; b < partsCount; b++) {
          const binSize = baseSize + (b < remainder ? 1 : 0);
          result.push(items.slice(currentIndex, currentIndex + binSize).join(separator));
          currentIndex += binSize;
        }
        return result;
      }
    };

    // 1. Check for explicit section headings written by the model (e.g., 1., الخطوة 1:, أولاً:, تفكيك:, إلخ)
    const sectionHeaderRegex = /(?:^|\n+)(?:[#*\s]*)(?:(?:الخطوة|المرحلة)\s*(?:الأولى|الثانية|الثالثة|الرابعة|[1-4])(?:\s*[:\-])?|[1-4][.)\-]|(?:أولاً|ثانياً|ثالثاً|رابعاً)(?:\s*[:\-])?|(?:تفكيك|تحليل|استدلال|معالجة|تدقيق|تحقق|استخلاص|صياغة)(?:\s*[:\-])?)/gi;
    const sectionMatches = [...trimmed.matchAll(sectionHeaderRegex)];
    if (sectionMatches.length >= 2) {
      const parts: string[] = [];
      for (let i = 0; i < sectionMatches.length; i++) {
        const match = sectionMatches[i];
        if (i === 0 && match.index! > 0) {
          const intro = trimmed.slice(0, match.index!).trim();
          if (intro.length > 20) {
            parts.push(intro);
          }
        }
        const startIndex = match.index!;
        const endIndex = i + 1 < sectionMatches.length ? sectionMatches[i + 1].index! : trimmed.length;
        const sectionContent = trimmed.slice(startIndex, endIndex).trim();
        if (sectionContent) {
          parts.push(sectionContent);
        }
      }
      return partitionItems(parts, '\n\n');
    }

    // 2. Try clean double newline paragraphs
    const paragraphs = trimmed.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 10);
    if (paragraphs.length >= partsCount) {
      return partitionItems(paragraphs, '\n\n');
    }

    // 3. Sentence-level splitting (using complete punctuation boundaries: . ! ? ؟ or newlines)
    const rawSentences = trimmed
      .split(/(?<=[.!?؟\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (rawSentences.length >= partsCount) {
      return partitionItems(rawSentences, ' ');
    }

    if (rawSentences.length > 1) {
      return rawSentences;
    }

    return [trimmed];
  };

  const milestones: Milestone[] = [];

  if (hasSearchDetected) {
    // 4-Stage Search Pipeline with Search as Step 1:
    // 1. Web search & live grounding (Fathom Search)
    // 2. Problem & Data Deconstruction
    // 3. Logical deduction & fact verification
    // 4. Final synthesis & verification
    const textParts = splitTextGracefully(pureNarrative, 3, isThinking);
    const part0 = textParts[0] || pureNarrative;
    const part1 = textParts[1];
    const part2 = textParts.length >= 3 ? textParts.slice(2).join('\n\n') : undefined;

    // Step 1: Integrated Web Search Milestone
    milestones.push({
      id: 'step-fathom-search',
      title: searchContext.title,
      details: searchSourcesDetails || searchContext.contextSentence,
      status: 'completed',
      specialType: 'search',
      searchQuery: detectedSearchQuery,
      sourcesCount: detectedSourcesCount || 3,
    });

    // Step 2: Deconstruction
    milestones.push({
      id: 'step-reasoning-0',
      title: 'تفكيك وتحليل معطيات المسألة والبيانات المسترجعة',
      details: part0,
      status: isThinking && !part1 ? 'in-progress' : 'completed',
    });

    // Step 3: Deduction & Evidence Processing
    milestones.push({
      id: 'step-reasoning-1',
      title: 'الاستدلال ومطابقة البيانات',
      details: part1,
      status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
    });

    // Step 4: Final Synthesis
    milestones.push({
      id: 'step-reasoning-2',
      title: 'صياغة النتيجة النهائية',
      details: part2,
      status: isThinking ? (part2 ? 'in-progress' : 'pending') : 'completed',
    });

    return milestones;
  }

  // Vision pipeline
  if (hasFathomCam) {
    const textParts = splitTextGracefully(pureNarrative, 3, isThinking);
    const part0 = textParts[0] || pureNarrative;
    const part1 = textParts[1];
    const part2 = textParts.length >= 3 ? textParts.slice(2).join('\n\n') : undefined;

    milestones.push({
      id: 'step-cam',
      title: 'المسح البصري وقراءة النصوص • Fathom Cam',
      details: 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
      status: 'completed',
      specialType: 'cam',
    });
    milestones.push({
      id: 'step-reasoning-0',
      title: 'تحليل العناصر البصرية',
      details: part0,
      status: isThinking && !part1 ? 'in-progress' : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-1',
      title: 'الاستدلال ومطابقة البيانات',
      details: part1,
      status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-2',
      title: 'صياغة النتيجة النهائية',
      details: part2,
      status: isThinking ? (part2 ? 'in-progress' : 'pending') : 'completed',
    });
    return milestones;
  }

  // Spark pipeline
  if (hasFathomSpark) {
    const textParts = splitTextGracefully(pureNarrative, 3, isThinking);
    const part0 = textParts[0] || pureNarrative;
    const part1 = textParts[1];
    const part2 = textParts.length >= 3 ? textParts.slice(2).join('\n\n') : undefined;

    milestones.push({
      id: 'step-spark',
      title: 'معالجة الوسائط والأكواد • Fathom Spark',
      details: 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
      status: 'completed',
      specialType: 'spark',
    });
    milestones.push({
      id: 'step-reasoning-0',
      title: 'تفكيك البنية والمنطق',
      details: part0,
      status: isThinking && !part1 ? 'in-progress' : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-1',
      title: 'الاستدلال والتحقق الرياضي والبرمجي',
      details: part1,
      status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-2',
      title: 'صياغة النتيجة النهائية',
      details: part2,
      status: isThinking ? (part2 ? 'in-progress' : 'pending') : 'completed',
    });
    return milestones;
  }

  // Pure reasoning (General / Math / Science / Code)
  // Always maintain 4 consistent Tree-of-Thought milestones
  const textParts = splitTextGracefully(pureNarrative, 4, isThinking);
  const part0 = textParts[0] || pureNarrative;
  const part1 = textParts[1];
  const part2 = textParts[2];
  const part3 = textParts.length >= 4 ? textParts.slice(3).join('\n\n') : undefined;

  milestones.push({
    id: 'step-reasoning-0',
    title: 'تحليل معطيات المسألة',
    details: part0 || (!isThinking ? 'تم تفكيك معطيات المسألة وتحديد القيود والمعالم الأساسية.' : undefined),
    status: isThinking && !part1 ? 'in-progress' : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-1',
    title: 'الاستدلال ومعالجة الخطوات',
    details: part1 || (!isThinking ? 'تم الاستدلال المنطقي ومطابقة الفرضيات بدقة.' : undefined),
    status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-2',
    title: 'التدقيق والتحقق المنطقي',
    details: part2 || (!isThinking ? 'تم التدقيق المعرفي والحسابي واستبعاد أي تناقضات.' : undefined),
    status: isThinking ? (!part3 ? (part2 ? 'in-progress' : 'pending') : 'completed') : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-3',
    title: 'صياغة النتيجة النهائية',
    details: part3 || (!isThinking ? 'تم استخلاص وصياغة النتيجة النهائية بإحكام باللغة العربية الفصحى المعاصرة.' : undefined),
    status: isThinking ? (part3 ? 'in-progress' : 'pending') : 'completed',
  });

  return milestones;
}

function renderMilestoneTitle(text: string) {
  if (!text) return null;
  const engineRegex = /(?:\[?SERPER(?:\s*AI)?\]?|Serper(?:\s*AI)?|سيربر|\[?FATHOM\s*SEARCH\]?|Fathom\s*Search|\bFathom-Search\b|FathomSearch|فاثوم\s*سيرش|\[?FATHOM\s*SPARK\]?|Fathom\s*Spark|\bFathom-Spark\b|FathomSpark|فاثوم\s*سبارك|\[?SPARK\]?|\bSpark\b|\[?FATHOM\s*CAM(?:\s*VISION)?\]?|Fathom\s*Cam(?:\s*Vision)?|\bFathom-Cam\b|FathomCam|فاثوم\s*كام|\[?FATHOM\s*VISION\]?)/gi;

  if (!engineRegex.test(text)) {
    return text;
  }

  const parts = text.split(engineRegex);
  const matches = text.match(engineRegex) || [];

  return (
    <span>
      {parts.map((part, i) => {
        const match = matches[i];
        if (!match) {
          const domainMatch = part.match(/^\s*(of\s+(?:Web|AI\s+Vid\s+or\s+Img|Neural\s+Memory|Temporal\s+Context|Code\s+&\s+Architecture|Conversation\s+&\s+Context))(.*)$/is);
          if (domainMatch) {
            const domainLabel = domainMatch[1];
            const rest = domainMatch[2];
            return (
              <React.Fragment key={i}>
                <span className="inline-flex items-center text-cyan-300 font-mono font-bold text-[11px] sm:text-xs tracking-tight mx-1">
                  {domainLabel}
                </span>
                {rest}
              </React.Fragment>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }

        const isSearch = /search|سيرش|serper|سيربر/i.test(match);
        const isSpark = !isSearch && /spark|سبارك/i.test(match);
        const isCam = !isSearch && !isSpark && /cam|vision|كام/i.test(match);

        return (
          <React.Fragment key={i}>
            {part}
            {isSearch && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Fathom
                </span>
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Search
                </span>
              </span>
            )}
            {isCam && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Fathom
                </span>
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Cam
                </span>
              </span>
            )}
            {isSpark && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Fathom
                </span>
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Spark
                </span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export default function ChatReasoning({
  reasoningText,
  partsInAccordion = [],
  isThinking = false,
  isStreaming = false,
  isMatany = false,
  isTimeIntent = false,
  activeFeatures = [],
  defaultValue,
  className,
}: ChatReasoningProps) {
  // Closed by default; expands and collapses purely upon user click
  const [value, setValue] = useState<string>(defaultValue || "");
  const [openStepIds, setOpenStepIds] = useState<Record<string, boolean>>({});

  const userToggledRef = useRef<Record<string, boolean>>({});
  const lastActiveIdRef = useRef<string | null>(null);
  const activeStepDetailsRef = useRef<HTMLDivElement>(null);

  const startTimeRef = useRef<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isThinking) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setDurationSeconds(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
        }
      }, 500);
    } else {
      if (startTimeRef.current) {
        setDurationSeconds(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
      }
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isThinking]);

  const toggleStep = (stepId: string) => {
    userToggledRef.current[stepId] = true;
    setOpenStepIds(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const fullText = reasoningText || partsInAccordion.map(p => p.text || '').filter(Boolean).join('\n\n');

  const isFathomSearchActive = useMemo(() => {
    return (
      activeFeatures.some(f => f.id === 'fathom_search') ||
      /(?:\[?FATHOM\s*SEARCH\]?|Fathom\s*Search|\bFathomSearch\b|فاثوم\s*سيرش|\[LIVE\s*WEB\s*INTELLIGENCE\]|الاستعلام\s*الشبكي|المصادر\s*الموثقة|نتائج\s*البحث\s*الحي|•\s*المصدر\s*\[\d+\]|Fathom\s*Search\s*2\.0)/i.test(fullText)
    );
  }, [activeFeatures, fullText]);

  const isFathomSparkActive = useMemo(() => {
    if (activeFeatures.some(f => f.id === 'fathom_spark')) {
      return true;
    }
    if (isFathomSearchActive && !/(?:youtube|tiktok|video|reels|watch|استخبارات\s*الفيديو|تفريغ\s*الصوت)/i.test(fullText)) {
      return false;
    }
    return (
      activeFeatures.some(f => f.id === 'fathom_spark' || f.id === 'download_detect') ||
      /(?:\[?FATHOM\s*SPARK\]?|Fathom\s*Spark|فاثوم\s*سبارك|استيعاب\s*وتفكيك\s*الأكواد|تفكيك\s*الملفات\s*المرفقة|تفريغ\s*التسجيل\s*الصوتي|videoVision|استخبارات\s*الفيديو|فحص\s*الفيديو|أرشيف\s*مضغوط|محتوى\s*الكود|\.zip|\.rar|\.tar|\.gz|ZIP\s*archive|youtube\.com|youtu\.be|tiktok\.com|instagram\.com\/reel|fb\.watch)/i.test(fullText)
    );
  }, [activeFeatures, fullText, isFathomSearchActive]);

  const isFathomCamActive = useMemo(() => {
    if ((isFathomSparkActive || isFathomSearchActive) && !activeFeatures.some(f => f.id === 'fathom_cam')) {
      return false;
    }
    return (
      activeFeatures.some(f => f.id === 'fathom_cam') ||
      /(?:\[?FATHOM\s*CAM(?:\s*VISION)?\]?|Fathom\s*Cam|tansik\.digital\.gov\.eg|الخطوة\s*الرابعة|جدول\s*الرغبات|فحص\s*الصور|المسح\s*البصري|تحليل\s*الصورة|تحليل\s*الواجهة|واجهة\s*سوق|واجهة\s*المستخدم|عناصر\s*الواجهة|لقطة\s*الشاشة|الصورة\s*المرفقة)/i.test(fullText)
    );
  }, [activeFeatures, fullText, isFathomSparkActive, isFathomSearchActive]);

  const searchContextInfo = useMemo(() => {
    return getFathomSearchContextualInfo(fullText, activeFeatures);
  }, [fullText, activeFeatures]);

  // Keep milestones evaluation for search/cam/spark tool extraction & backward compatibility
  const milestones = useMemo(() => {
    return parseReasoningMilestones(fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive, activeFeatures);
  }, [fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive, activeFeatures]);

  // Stable progressive milestones: During thinking, show only reached milestones (completed + current in-progress)
  // to avoid showing a block of static pending steps all at once
  const visibleMilestones = useMemo(() => {
    if (!isThinking) return milestones;
    const activeIndex = milestones.findIndex(m => m.status === 'in-progress');
    if (activeIndex === -1) {
      return milestones.filter(m => m.status === 'completed').length > 0
        ? milestones.filter(m => m.status === 'completed')
        : milestones.slice(0, 1);
    }
    return milestones.slice(0, activeIndex + 1);
  }, [milestones, isThinking]);

  const searchMilestone = useMemo(() => milestones.find(m => m.specialType === 'search'), [milestones]);
  const camMilestone = useMemo(() => milestones.find(m => m.specialType === 'cam'), [milestones]);
  const sparkMilestone = useMemo(() => milestones.find(m => m.specialType === 'spark'), [milestones]);

  const isNeuralImageStudioActive = useMemo(() => {
    return activeFeatures.some(f => f.id === 'neural_image_studio') || /(?:```neural-image|<neural-image)/i.test(fullText);
  }, [activeFeatures, fullText]);

  const isSvgStudioActive = useMemo(() => {
    if (isNeuralImageStudioActive) return false;
    return activeFeatures.some(f => f.id === 'svg_studio') || /(?:<svg|```svg)/i.test(fullText);
  }, [activeFeatures, fullText, isNeuralImageStudioActive]);

  const visibleHeaderFeatures = useMemo(() => {
    return activeFeatures.filter(f => f.id !== 'fathom_cam' && f.id !== 'fathom_spark' && f.id !== 'fathom_search' && f.id !== 'svg_studio' && f.id !== 'neural_image_studio' && f.id !== 'vps_control_room');
  }, [activeFeatures]);

  if (!fullText && !isThinking) return null;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={(val) => setValue(val || "")}
      className={cn("w-full mb-3", className)}
      dir="rtl"
    >
      <AccordionItem
        value="reasoning"
        className={cn(
          "w-full border rounded-2xl px-2.5 sm:px-4 py-0.5 sm:py-1 transition-all duration-300 backdrop-blur-md",
          isThinking
            ? "border-white/[0.12] bg-[#07080a]/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            : "border-white/[0.07] bg-[#07080a]/60 hover:border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        )}
      >
        <AccordionTrigger
          hideChevron={false}
          className="text-[11.5px] sm:text-xs font-medium text-zinc-300 hover:text-white hover:no-underline py-2 sm:py-2.5 w-full flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="flex items-center justify-center size-4.5 sm:size-5 shrink-0">
              {isThinking ? (
                <ThinkingOrb state={isFathomSearchActive ? "searching" : "solving"} size={16} theme="dark" speed={1.4} />
              ) : isMatany ? (
                <div className="flex items-center justify-center size-4.5 sm:size-5 rounded-md border bg-white/[0.04] border-white/[0.08] text-zinc-300">
                  <Cpu className="size-2.5 sm:size-3 text-zinc-300" />
                </div>
              ) : (
                <div className="flex items-center justify-center size-4.5 sm:size-5 rounded-md border bg-white/[0.04] border-white/[0.08] text-zinc-300">
                  <Brain className="size-2.5 sm:size-3 text-zinc-300" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-[11px] sm:text-xs text-zinc-200 font-semibold tracking-tight">
                {isThinking ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span>
                      {isFathomSearchActive
                        ? searchContextInfo.title
                        : "جارٍ التفكير والاستدلال"}
                    </span>
                    {durationSeconds > 0 && (
                      <span className="text-zinc-400 font-normal">({durationSeconds} ث)</span>
                    )}
                    <AnimatedDots className="bg-zinc-300" />
                  </span>
                ) : isNeuralImageStudioActive ? (
                  "تم إنشاء وتجهيز الصورة فائقة الدقة"
                ) : isSvgStudioActive ? (
                  "تم رسم وتوليد متجهات الرسم الشعاعي (SVG)"
                ) : (
                  <span>
                    {isFathomSearchActive
                      ? `${searchContextInfo.title} • فكّر لمدة ${durationSeconds} ثوانٍ`
                      : (durationSeconds > 0 ? `فكّر لمدة ${durationSeconds} ثوانٍ` : "مسار الاستدلال والتفكير")}
                  </span>
                )}
              </span>

              {/* Render Active Feature Badges */}
              {visibleHeaderFeatures.map((feat) => {
                const def = FEATURES_REGISTRY[feat.id];
                const IconComponent = def?.icon || Brain;
                return (
                  <span
                    key={feat.id}
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full select-none transition-all text-[9.5px] sm:text-[10.5px] font-sans font-bold tracking-wide",
                      def?.glassClassName || "time-detect-glass"
                    )}
                  >
                    <IconComponent size={10} />
                    <span className={def?.textClassName || "time-detect-text"}>
                      {feat.badgeLabel}
                    </span>
                  </span>
                );
              })}

              {!visibleHeaderFeatures.length && isTimeIntent && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full time-detect-glass select-none transition-all">
                  <TimeDetectIcon size={10} />
                  <span className="time-detect-text text-[9.5px] sm:text-[10.5px] font-sans font-bold tracking-wide">
                    Time Detect
                  </span>
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pt-1.5 pb-2.5 sm:pt-2 sm:pb-3 border-t border-white/[0.06]">
          <div className="pt-1.5 sm:pt-2 px-0 sm:px-1 text-right space-y-2 sm:space-y-2">
            {/* Steps Header Bar */}
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/[0.06] text-[10.5px] sm:text-xs font-mono select-none">
              <div className="flex items-center gap-1.5 text-zinc-300 text-[10.5px] sm:text-[11px]">
                <ListOrdered className="size-3 sm:size-3.5 text-zinc-400" />
                <span className="font-semibold tracking-tight">خطوات الاستدلال والتفكير المنطقي</span>
              </div>
            </div>

            {/* Steps View: Vertical Stepper Timeline with Integrated Search, Cam, Spark & Reasoning */}
            <div className="relative pr-4 sm:pr-6 space-y-2 sm:space-y-2.5">
              <AnimatePresence initial={false}>
                {visibleMilestones.map((m, idx) => {
                  const isSearch = m.specialType === 'search';
                  const isCam = m.specialType === 'cam';
                  const isSpark = m.specialType === 'spark';
                  const isInProgress = m.status === 'in-progress';
                  const isCompleted = m.status === 'completed';
                  const stepKey = m.id || String(idx);
                  const isExpanded = Boolean(openStepIds[stepKey]);

                  return (
                    <motion.div
                      key={stepKey}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative group"
                    >
                      {/* Vertical connecting line between this node and next node only */}
                      {idx < visibleMilestones.length - 1 && (
                        <div className="absolute -right-[9px] sm:-right-[15px] top-[26px] sm:top-[32px] bottom-[-16px] sm:bottom-[-22px] w-[1.5px] sm:w-[2px] bg-white/[0.08] pointer-events-none" />
                      )}

                      {/* Timeline Node */}
                      <div
                        className={cn(
                          "absolute -right-4 sm:-right-6 top-2.5 sm:top-3 size-4 sm:size-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold border transition-all z-10 shadow-none",
                          isInProgress
                            ? "bg-[#141824] border-zinc-500 text-zinc-200 ring-1 ring-white/10"
                            : isCompleted
                            ? "bg-[#12151c] border-white/20 text-zinc-300"
                            : "bg-black/60 border-white/[0.08] text-zinc-600"
                        )}
                      >
                        {isSearch ? (
                          <Search className="size-2 sm:size-2.5 text-zinc-300 stroke-[2]" />
                        ) : isCam ? (
                          <Camera className="size-2 sm:size-2.5 text-emerald-400 stroke-[2]" />
                        ) : isSpark ? (
                          <Sparkles className="size-2 sm:size-2.5 text-purple-400 stroke-[2]" />
                        ) : isCompleted ? (
                          <Check className="size-2 sm:size-2.5 text-emerald-400 stroke-[2.5]" />
                        ) : isInProgress ? (
                          <RadarDot color="bg-zinc-300" ringColor="bg-zinc-400" />
                        ) : (
                          <span className="size-1 rounded-full bg-zinc-600" />
                        )}
                      </div>

                      {/* Collapsible Step Card with Sleek Dark Glass Styling */}
                      <div
                        className={cn(
                          "rounded-xl border transition-all duration-200 overflow-hidden shadow-none",
                          isInProgress
                            ? "bg-[#0b0e14]/90 border-zinc-700/80 ring-1 ring-white/[0.06]"
                            : "bg-[#090b0e]/80 border-white/[0.08] hover:border-white/[0.14]"
                        )}
                      >
                        {/* Card Header (Collapse Trigger Button) */}
                        <button
                          type="button"
                          onClick={() => toggleStep(stepKey)}
                          className="w-full p-2 sm:p-2.5 text-right flex items-center justify-between gap-2 cursor-pointer select-none group/btn transition-colors hover:bg-white/[0.02]"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {!isSearch && !isCam && !isSpark && (
                              <span className="text-[10px] font-mono font-bold text-zinc-500 shrink-0 select-none">
                                0{idx + 1}
                              </span>
                            )}
                            <span className="text-[11px] sm:text-xs font-semibold text-zinc-200 leading-snug break-words">
                              {renderMilestoneTitle(m.title)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isInProgress && (
                              <span className="size-1.5 rounded-full bg-zinc-300 animate-pulse" />
                            )}
                            <div className="size-4 sm:size-5 rounded-md flex items-center justify-center text-zinc-400 group-hover/btn:text-zinc-200 transition-colors">
                              <ChevronDown className={cn("size-3 sm:size-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </button>

                        {/* Collapsible Details Body */}
                        <div
                          className={cn(
                            "px-2.5 pb-2.5 sm:px-3 sm:pb-3 pt-0 transition-all duration-200 select-text",
                            isExpanded ? "block" : "hidden"
                          )}
                        >
                          <div className="pt-1.5 sm:pt-2 border-t border-white/[0.05] space-y-1.5 sm:space-y-2 text-xs font-mono">
                            {isSearch ? (
                              <>
                                {m.searchQuery && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] sm:text-[10.5px] text-zinc-300 font-mono">
                                    <Search className="size-2.5 sm:size-3 text-zinc-400 shrink-0" />
                                    <span>البحث: &quot;{m.searchQuery}&quot;</span>
                                  </div>
                                )}

                                {m.details && (
                                  <div className="text-[10.5px] sm:text-[11px] text-zinc-300/90 leading-relaxed max-h-36 sm:max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text p-2 rounded-lg bg-black/40 border border-white/[0.06]">
                                    {m.details}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {m.details ? (
                                  <div
                                    ref={isInProgress ? activeStepDetailsRef : undefined}
                                    dir="auto"
                                    className="text-[10.5px] sm:text-[11.5px] text-zinc-300/90 whitespace-pre-wrap select-text leading-relaxed font-mono max-h-36 sm:max-h-48 overflow-y-auto custom-scrollbar"
                                  >
                                    {m.details}
                                    {isInProgress && isThinking && (
                                      <span className="inline-block w-1.5 h-3 bg-zinc-300 align-middle mr-1 animate-pulse rounded-xs" />
                                    )}
                                  </div>
                                ) : isInProgress ? (
                                  <div className="text-[10.5px] sm:text-[11px] text-zinc-400 italic flex items-center gap-1.5 font-mono">
                                    <span className="size-1.5 rounded-full bg-zinc-300 animate-pulse" />
                                    <span>جارٍ معالجة وصياغة هذه الخطوة</span>
                                    <AnimatedDots className="bg-zinc-300" />
                                  </div>
                                ) : m.status === 'pending' ? (
                                  <div dir="auto" className="text-[10.5px] sm:text-[11px] text-zinc-500/80 italic select-none font-mono">
                                    في انتظار استكمال المراحل السابقة لبدء المعالجة...
                                  </div>
                                ) : (
                                  <div dir="auto" className="text-[10.5px] sm:text-[11px] text-zinc-300/90 whitespace-pre-wrap select-text leading-relaxed font-mono">
                                    تم استكمال معالجة هذه المرحلة وتدقيق كافة معطياتها بنجاح.
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
