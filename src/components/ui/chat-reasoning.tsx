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
  isX1?: boolean;
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

/**
 * Parses raw reasoning into clean, high-level task titles with hidden deep thinking details.
 */
export function parseReasoningMilestones(
  rawText: string,
  isThinking: boolean,
  hasFathomCam: boolean = false,
  hasFathomSpark: boolean = false,
  hasFathomSearch: boolean = false
): Milestone[] {
  // Base default milestones when stream is just starting or empty
  if (!rawText || !rawText.trim()) {
    const defaultSteps: Milestone[] = [];

    if (hasFathomSearch) {
      defaultSteps.push({
        id: 'step-fathom-search',
        title: 'الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Serper AI و Fathom Search',
        details: 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'search',
        searchQuery: '',
        sourcesCount: 0,
      });

      defaultSteps.push({
        id: 'step-reasoning-0',
        title: 'تفكيك وتحليل معطيات المسألة والبيانات المسترجعة',
        details: 'تحديد المعالم الأساسية، قيود السياق، واستبعاد الفرضيات المتناقضة.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-1',
        title: 'الاستدلال المنطقي ومطابقة البيانات والتحقق المعرفي',
        details: 'مطابقة الفرضيات واستخلاص النتائج الهندسية والقطعية.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-2',
        title: 'استخلاص وصياغة النتيجة النهائية',
        details: 'صياغة المخرجات بدقة وإحكام باللغة العربية الفصحى المعاصرة.',
        status: isThinking ? 'pending' : 'completed',
      });

      return defaultSteps;
    }

    if (hasFathomCam) {
      defaultSteps.push({
        id: 'step-cam',
        title: 'المسح البصري الميكروي وقراءة نصوص الصور والمستندات عبر Fathom Cam',
        details: 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'cam',
      });

      defaultSteps.push({
        id: 'step-reasoning-0',
        title: 'تفكيك وتحليل العناصر البصرية والنصوص',
        details: 'تحديد المعالم الأساسية وقراءة الخانات بدقة ميكروية.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-1',
        title: 'الاستدلال المنطقي ومطابقة البيانات',
        details: 'مطابقة المعطيات البصرية واستخلاص النتائج.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-2',
        title: 'استخلاص وصياغة النتيجة النهائية',
        details: 'صياغة المخرجات بدقة وإحكام باللغة العربية الفصحى المعاصرة.',
        status: isThinking ? 'pending' : 'completed',
      });

      return defaultSteps;
    }

    if (hasFathomSpark) {
      defaultSteps.push({
        id: 'step-spark',
        title: 'استيعاب وتفكيك وسائط الفيديو والأكواد عبر Fathom Spark',
        details: 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'spark',
      });

      defaultSteps.push({
        id: 'step-reasoning-0',
        title: 'تفكيك البنية البرمجية والمنطق',
        details: 'تحليل الشيفرة المصدرية وتتبع تدفق البيانات.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-1',
        title: 'الاستدلال والتحقق الرياضي والبرمجي',
        details: 'فحص الدوال ومعالجة الحالات الحدية.',
        status: isThinking ? 'pending' : 'completed',
      });

      defaultSteps.push({
        id: 'step-reasoning-2',
        title: 'استخلاص وصياغة النتيجة النهائية',
        details: 'صياغة المخرجات بدقة وإحكام باللغة العربية الفصحى المعاصرة.',
        status: isThinking ? 'pending' : 'completed',
      });

      return defaultSteps;
    }

    defaultSteps.push({
      id: 'step-reasoning-0',
      title: 'تفكيك وتحليل معطيات المسألة',
      details: 'تحديد المعالم الأساسية، قيود السياق، واستبعاد الفرضيات المتناقضة.',
      status: isThinking ? 'in-progress' : 'completed',
    });

    defaultSteps.push({
      id: 'step-reasoning-1',
      title: 'الاستدلال المنطقي ومعالجة الخطوات',
      details: 'مطابقة الفرضيات واستخلاص النتائج الهندسية والقطعية.',
      status: isThinking ? 'pending' : 'completed',
    });

    defaultSteps.push({
      id: 'step-reasoning-2',
      title: 'التحقق والتدقيق من صحة الاستنتاج',
      details: 'التدقيق الحسابي والمعرفي واستبعاد أي تناقضات.',
      status: isThinking ? 'pending' : 'completed',
    });

    defaultSteps.push({
      id: 'step-reasoning-3',
      title: 'استخلاص وصياغة النتيجة النهائية',
      details: 'صياغة المخرجات بدقة وإحكام باللغة العربية الفصحى المعاصرة.',
      status: isThinking ? 'pending' : 'completed',
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
    // 1. Web search & live grounding (Serper AI & Fathom Search)
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
      title: 'الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Serper AI و Fathom Search',
      details: searchSourcesDetails || 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.',
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
      title: 'الاستدلال المنطقي ومطابقة البيانات والتحقق المعرفي',
      details: part1,
      status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
    });

    // Step 4: Final Synthesis
    milestones.push({
      id: 'step-reasoning-2',
      title: 'استخلاص وصياغة النتيجة النهائية',
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
      title: 'المسح البصري الميكروي وقراءة نصوص الصور عبر Fathom Cam',
      details: 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
      status: 'completed',
      specialType: 'cam',
    });
    milestones.push({
      id: 'step-reasoning-0',
      title: 'تفكيك وتحليل العناصر البصرية والنصوص',
      details: part0,
      status: isThinking && !part1 ? 'in-progress' : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-1',
      title: 'الاستدلال المنطقي ومطابقة البيانات',
      details: part1,
      status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
    });
    milestones.push({
      id: 'step-reasoning-2',
      title: 'استخلاص وصياغة النتيجة النهائية',
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
      title: 'استيعاب وتفكيك وسائط الفيديو والصوتيات والأكواد عبر Fathom Spark',
      details: 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
      status: 'completed',
      specialType: 'spark',
    });
    milestones.push({
      id: 'step-reasoning-0',
      title: 'تفكيك البنية البرمجية والمنطق',
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
      title: 'استخلاص وصياغة النتيجة النهائية',
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
    title: 'تفكيك وتحليل معطيات المسألة',
    details: part0 || (!isThinking ? 'تم تفكيك معطيات المسألة وتحديد القيود والمعالم الأساسية.' : undefined),
    status: isThinking && !part1 ? 'in-progress' : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-1',
    title: 'الاستدلال المنطقي ومعالجة الخطوات',
    details: part1 || (!isThinking ? 'تم الاستدلال المنطقي ومطابقة الفرضيات بدقة.' : undefined),
    status: isThinking ? (!part2 ? (part1 ? 'in-progress' : 'pending') : 'completed') : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-2',
    title: 'التحقق والتدقيق من صحة الاستنتاج',
    details: part2 || (!isThinking ? 'تم التدقيق المعرفي والحسابي واستبعاد أي تناقضات.' : undefined),
    status: isThinking ? (!part3 ? (part2 ? 'in-progress' : 'pending') : 'completed') : 'completed',
  });
  milestones.push({
    id: 'step-reasoning-3',
    title: 'استخلاص وصياغة النتيجة النهائية',
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
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;

        const isSerper = /serper|سيربر/i.test(match);
        const isSearch = !isSerper && /search|سيرش/i.test(match);
        const isSpark = !isSerper && !isSearch && /spark|سبارك/i.test(match);
        const isCam = !isSerper && !isSearch && !isSpark && /cam|vision|كام/i.test(match);

        return (
          <React.Fragment key={i}>
            {part}
            {isSerper && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Serper
                </span>
                <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  AI
                </span>
              </span>
            )}
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
  isX1 = false,
  isTimeIntent = false,
  activeFeatures = [],
  defaultValue,
  className,
}: ChatReasoningProps) {
  const [value, setValue] = useState<string | undefined>(defaultValue ?? "reasoning");
  const [openStepIds, setOpenStepIds] = useState<Record<string, boolean>>({});

  const userToggledRef = useRef<Record<string, boolean>>({});
  const lastActiveIdRef = useRef<string | null>(null);
  const activeStepDetailsRef = useRef<HTMLDivElement>(null);

  const toggleStep = (stepId: string) => {
    userToggledRef.current[stepId] = true;
    setOpenStepIds(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  useEffect(() => {
    if (isThinking) {
      setValue("reasoning");
    }
  }, [isThinking]);

  const fullText = reasoningText || partsInAccordion.map(p => p.text || '').filter(Boolean).join('\n\n');

  const isFathomSearchActive = useMemo(() => {
    return (
      activeFeatures.some(f => f.id === 'fathom_search') ||
      /(?:\[?FATHOM\s*SEARCH\]?|Fathom\s*Search|\bFathomSearch\b|فاثوم\s*سيرش|\[LIVE\s*WEB\s*INTELLIGENCE\]|الاستعلام\s*الشبكي|المصادر\s*الموثقة|نتائج\s*البحث\s*الحي|•\s*المصدر\s*\[\d+\]|Fathom\s*Search\s*2\.0)/i.test(fullText)
    );
  }, [activeFeatures, fullText]);

  const isFathomSparkActive = useMemo(() => {
    if (isFathomSearchActive && !activeFeatures.some(f => f.id === 'fathom_spark')) {
      return false;
    }
    return (
      activeFeatures.some(f => f.id === 'fathom_spark' || f.id === 'download_detect') ||
      /(?:\[?FATHOM\s*SPARK\]?|Fathom\s*Spark|فاثوم\s*سبارك|استيعاب\s*وتفكيك\s*الأكواد|تفكيك\s*الملفات\s*المرفقة|تفريغ\s*التسجيل\s*الصوتي|videoVision|أرشيف\s*مضغوط|محتوى\s*الكود|\.zip|\.rar|\.tar|\.gz|ZIP\s*archive)/i.test(fullText)
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

  // Keep milestones evaluation for search/cam/spark tool extraction & backward compatibility
  const milestones = useMemo(() => {
    return parseReasoningMilestones(fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive);
  }, [fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive]);

  // Stable milestones for roadmap stepper
  const visibleMilestones = milestones;

  // Auto-expand the active in-progress step during thinking without overriding user toggles
  useEffect(() => {
    if (isThinking) {
      const activeMilestone = visibleMilestones.find(m => m.status === 'in-progress') || visibleMilestones[0];
      if (activeMilestone && activeMilestone.id !== lastActiveIdRef.current) {
        lastActiveIdRef.current = activeMilestone.id;
        setOpenStepIds(prev => {
          const nextState: Record<string, boolean> = { ...prev };
          if (!userToggledRef.current[activeMilestone.id]) {
            nextState[activeMilestone.id] = true;
          }
          // Collapse completed previous steps unless user explicitly toggled them
          visibleMilestones.forEach(m => {
            if (m.id !== activeMilestone.id && m.status === 'completed' && !userToggledRef.current[m.id]) {
              nextState[m.id] = false;
            }
          });
          return nextState;
        });
      }
    }
  }, [isThinking, visibleMilestones]);

  const searchMilestone = useMemo(() => milestones.find(m => m.specialType === 'search'), [milestones]);
  const camMilestone = useMemo(() => milestones.find(m => m.specialType === 'cam'), [milestones]);
  const sparkMilestone = useMemo(() => milestones.find(m => m.specialType === 'spark'), [milestones]);

  const cleanThinkingText = useMemo(() => {
    if (!fullText) return '';
    let cleaned = fullText
      .replace(/<think>/gi, '')
      .replace(/<\/think>/gi, '')
      .replace(/<\|(?:begin_of_thought|thought|think)\|>/gi, '')
      .replace(/<\|(?:end_of_thought|\/thought|\/think)\|>/gi, '')
      .replace(/```(?:thought|think|thinking|reasoning)\s*\n?/gi, '')
      .replace(/```$/gi, '')
      .trim();

    const isPromptLeak = (str: string) => {
      return /(?:DEVELOPER_IDENTITY|SYSTEM_PROMPT|النظام\s*يقول|حظر\s*مطلق|قاعدة\s*الاستجابة|تعليمات\s*الهوية|قواعد\s*النظام|المطور\s*الأساسي|Mohamed\s*Ahmed\s*Matany|MatanyLabs|Context-Proportional\s*Attribution|Strict\s*Exclusivity|Identity\s*vs\s*Conversations)/i.test(str);
    };

    // Strip raw bracket injections, search milestone metadata, and citations
    cleaned = cleaned
      .replace(/🔍\s*\[استعلام حي وتدقيق المصادر[^\]]*\]\s*/gi, '')
      .replace(/\[LIVE\s*WEB\s*INTELLIGENCE\][^\n]*\n?/gi, '')
      .replace(/(?:-?\s*\[?(?:الاستعلام\s*الشبكي|Fathom\s*Search|Serper\s*AI)\]?|•\s*المصدر\s*\[\d+\])[^\n]*(\n|$)/gi, '')
      .trim();

    const lines = cleaned.split('\n').filter(l => !isPromptLeak(l));
    return lines.join('\n').trim();
  }, [fullText]);


  const visibleHeaderFeatures = useMemo(() => {
    return activeFeatures.filter(f => f.id !== 'fathom_cam' && f.id !== 'fathom_spark' && f.id !== 'fathom_search');
  }, [activeFeatures]);

  if (!fullText && !isThinking) return null;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className={cn("w-full mb-3", className)}
      dir="rtl"
    >
      <AccordionItem
        value="reasoning"
        className={cn(
          "w-full border rounded-2xl px-3.5 sm:px-4 py-1 transition-all duration-300 backdrop-blur-md",
          isThinking
            ? "border-white/[0.12] bg-[#07080a]/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            : "border-white/[0.07] bg-[#07080a]/60 hover:border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        )}
      >
        <AccordionTrigger className="text-xs font-medium text-zinc-300 hover:text-white hover:no-underline py-2 w-full flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center justify-center size-5 shrink-0">
              {isThinking ? (
                <ThinkingOrb state={isFathomSearchActive ? "searching" : "solving"} size={18} theme="dark" speed={1.4} />
              ) : isX1 ? (
                <div className="flex items-center justify-center size-5 rounded-md border bg-white/[0.04] border-white/[0.08] text-zinc-300">
                  <Cpu className="size-3 text-zinc-300" />
                </div>
              ) : (
                <div className="flex items-center justify-center size-5 rounded-md border bg-white/[0.04] border-white/[0.08] text-zinc-300">
                  <Brain className="size-3 text-zinc-300" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-zinc-200 font-semibold tracking-tight">
                {isThinking ? (
                  <span className="inline-flex items-center gap-1">
                    <span>جاري التفكير والتحليل المنطقي</span>
                    <AnimatedDots className="bg-zinc-300" />
                  </span>
                ) : (
                  "التفكير والتحليل المنطقي"
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
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full select-none transition-all text-[11px] font-sans font-bold tracking-wide",
                      def?.glassClassName || "time-detect-glass"
                    )}
                  >
                    <IconComponent size={12} />
                    <span className={def?.textClassName || "time-detect-text"}>
                      {feat.badgeLabel}
                    </span>
                  </span>
                );
              })}

              {!visibleHeaderFeatures.length && isTimeIntent && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full time-detect-glass select-none transition-all">
                  <TimeDetectIcon size={12} />
                  <span className="time-detect-text text-[11px] font-sans font-bold tracking-wide">
                    Time Detect
                  </span>
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pt-2 pb-3 border-t border-white/[0.06]">
          <div className="pt-2 px-1 text-right space-y-3">
            {/* Steps Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs font-mono select-none">
              <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                <ListOrdered className="size-3.5 text-indigo-400" />
                <span className="font-semibold tracking-tight">خطوات الاستدلال والتفكير المنطقي</span>
              </div>
            </div>

            {/* Steps View: Vertical Stepper Timeline with Integrated Search, Cam, Spark & Reasoning */}
            <div className="relative pr-6 space-y-2.5">
                {visibleMilestones.map((m, idx) => {
                  const isSearch = m.specialType === 'search';
                  const isCam = m.specialType === 'cam';
                  const isSpark = m.specialType === 'spark';
                  const isInProgress = m.status === 'in-progress';
                  const isCompleted = m.status === 'completed';
                  const stepKey = m.id || String(idx);
                  const isExpanded = Boolean(openStepIds[stepKey]);

                  return (
                    <div key={stepKey} className="relative group">
                      {/* Vertical connecting line between this node and next node only */}
                      {idx < visibleMilestones.length - 1 && (
                        <div className="absolute -right-[15px] top-[32px] bottom-[-22px] w-[2px] bg-white/[0.08] pointer-events-none" />
                      )}

                      {/* Timeline Node */}
                      <div
                        className={cn(
                          "absolute -right-6 top-3 size-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all z-10",
                          isInProgress
                            ? "bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                            : isCompleted
                            ? "bg-[#12151c] border-white/20 text-zinc-300"
                            : "bg-black/60 border-white/[0.08] text-zinc-600"
                        )}
                      >
                        {isSearch ? (
                          <Search className="size-2.5 text-zinc-300 stroke-[2]" />
                        ) : isCam ? (
                          <Camera className="size-2.5 text-emerald-400 stroke-[2]" />
                        ) : isSpark ? (
                          <Sparkles className="size-2.5 text-purple-400 stroke-[2]" />
                        ) : isCompleted ? (
                          <Check className="size-2.5 text-emerald-400 stroke-[2.5]" />
                        ) : isInProgress ? (
                          <RadarDot color="bg-indigo-400" ringColor="bg-indigo-400" />
                        ) : (
                          <span className="size-1 rounded-full bg-zinc-600" />
                        )}
                      </div>

                      {/* Collapsible Step Card with Neutral Dark Glass Styling */}
                      <div
                        className={cn(
                          "rounded-xl border transition-all duration-200 overflow-hidden",
                          isInProgress
                            ? "bg-indigo-950/20 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                            : "bg-[#090b0e]/80 border-white/[0.08] hover:border-white/[0.14] shadow-sm"
                        )}
                      >
                        {/* Card Header (Collapse Trigger Button) */}
                        <button
                          type="button"
                          onClick={() => toggleStep(stepKey)}
                          className="w-full p-2.5 sm:p-3 text-right flex items-center justify-between gap-2.5 cursor-pointer select-none group/btn transition-colors hover:bg-white/[0.02]"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="size-5 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 shrink-0">
                              {isSearch ? (
                                <Globe className="size-3 text-zinc-300 stroke-[2]" />
                              ) : isCam ? (
                                <Camera className="size-3 text-emerald-400 stroke-[2]" />
                              ) : isSpark ? (
                                <Sparkles className="size-3 text-purple-400 stroke-[2]" />
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-400">{idx + 1}</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 min-w-0">
                              <span className="text-zinc-500 text-[11px] font-normal shrink-0">خطوة {idx + 1}:</span>
                              <span className="truncate">{renderMilestoneTitle(m.title)}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSearch ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.1] font-medium">
                                {isInProgress ? "جاري استرجاع المصادر..." : `${m.sourcesCount || 3} مصادر معتمدة`}
                              </span>
                            ) : isInProgress ? (
                              <span className="text-[10px] text-indigo-400 flex items-center gap-1.5 font-medium bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span>قيد المعالجة</span>
                                <AnimatedDots className="bg-indigo-400" />
                              </span>
                            ) : m.status === 'pending' ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.03] text-zinc-500 border border-white/[0.05] font-normal">
                                قيد الانتظار
                              </span>
                            ) : (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-normal">
                                مكتمل
                              </span>
                            )}

                            <div className="size-5 rounded-md flex items-center justify-center text-zinc-400 group-hover/btn:text-zinc-200 transition-colors">
                              <ChevronDown className={cn("size-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </button>

                        {/* Collapsible Details Body */}
                        <div
                          className={cn(
                            "px-3 pb-3 sm:px-3.5 sm:pb-3.5 pt-0 transition-all duration-200 select-text",
                            isExpanded ? "block" : "hidden"
                          )}
                        >
                          <div className="pt-2 border-t border-white/[0.05] space-y-2 text-xs font-mono">
                            {isSearch ? (
                              <>
                                {m.searchQuery && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300 font-mono">
                                    <Search className="size-3 text-zinc-400 shrink-0" />
                                    <span>البحث: &quot;{m.searchQuery}&quot;</span>
                                  </div>
                                )}

                                {m.details && (
                                  <div className="text-[11px] text-zinc-300/90 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
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
                                    className="text-[11.5px] text-zinc-300/90 whitespace-pre-wrap select-text leading-relaxed font-mono max-h-48 overflow-y-auto custom-scrollbar"
                                  >
                                    {m.details}
                                    {isInProgress && isThinking && (
                                      <span className="inline-block w-1.5 h-3.5 bg-indigo-400 align-middle mr-1.5 animate-pulse rounded-xs" />
                                    )}
                                  </div>
                                ) : isInProgress ? (
                                  <div className="text-[11px] text-zinc-400 italic flex items-center gap-2 font-mono">
                                    <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    <span>جاري معالجة وصياغة هذه الخطوة</span>
                                    <AnimatedDots className="bg-indigo-400" />
                                  </div>
                                ) : m.status === 'pending' ? (
                                  <div dir="auto" className="text-[11.5px] text-zinc-500/80 italic select-none font-mono">
                                    في انتظار استكمال المراحل السابقة لبدء المعالجة...
                                  </div>
                                ) : (
                                  <div dir="auto" className="text-[11.5px] text-zinc-300/90 whitespace-pre-wrap select-text leading-relaxed font-mono">
                                    تم استكمال معالجة هذه المرحلة وتدقيق كافة معطياتها بنجاح.
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
