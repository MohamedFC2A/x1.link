import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Brain, Cpu, Check, ChevronDown, Camera, Sparkles, Search, Globe } from "lucide-react";
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
  status: 'completed' | 'in-progress';
  specialType?: 'search' | 'cam' | 'spark' | null;
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
  // Base milestones if no text yet
  if (!rawText || !rawText.trim()) {
    const defaultSteps: Milestone[] = [];

    if (hasFathomSearch) {
      defaultSteps.push({
        id: 'step-search',
        title: 'الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Fathom Search',
        details: 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'search',
      });
    }

    if (hasFathomCam) {
      defaultSteps.push({
        id: 'step-cam',
        title: 'المسح البصري الميكروي وقراءة نصوص الصور والمستندات البصرية عبر Fathom Cam',
        details: 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'cam',
      });
    }

    if (hasFathomSpark) {
      defaultSteps.push({
        id: 'step-spark',
        title: 'استيعاب وتفكيك وسائط الفيديو والصوتيات والأكواد المرفقة عبر Fathom Spark',
        details: 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
        status: isThinking ? 'in-progress' : 'completed',
        specialType: 'spark',
      });
    }

    defaultSteps.push(
      {
        id: 'step-dissect',
        title: 'حصر الشروط والمتغيرات وتفكيك معطيات المسألة',
        details: 'تحديد المعالم الأساسية، قيود السياق، واستبعاد الفرضيات المتناقضة.',
        status: isThinking ? 'in-progress' : 'completed',
      },
      {
        id: 'step-deduce',
        title: 'الاستدلال المنطقي وتدقيق التقاطعات التاريخية والتقنية',
        details: 'مطابقة الفرضيات واستخلاص النتائج القطعية.',
        status: isThinking ? 'in-progress' : 'completed',
      }
    );

    return defaultSteps;
  }

  // Clean raw text from think tags and sanitize any internal prompt leaks
  const cleaned = rawText
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .trim();

  const isPromptLeak = (str: string) => {
    return /(?:DEVELOPER_IDENTITY|SYSTEM_PROMPT|النظام\s*يقول|حظر\s*مطلق|قاعدة\s*الاستجابة|تعليمات\s*الهوية|قواعد\s*النظام|المطور\s*الأساسي|Mohamed\s*Ahmed\s*Matany|MatanyLabs|Context-Proportional\s*Attribution|Strict\s*Exclusivity|Identity\s*vs\s*Conversations)/i.test(str);
  };

  const lines = cleaned.split('\n')
    .map(l => l.trim())
    .filter(l => Boolean(l) && !isPromptLeak(l));

  // Extract blocks by bullet points or step tags
  const rawBlocks: { header: string; body: string }[] = [];
  let currentHeader = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const isSourceLine = /^(?:[•*–—\-]\s*)?(?:المصدر\s*\[\d+\]|المصدر\s*[:\d]|المقتطف\s*[:]|رابط\s*[:]|المصدر\s*المعتمد|Source\s*\[\d+\]|Source\s*:|Snippet\s*:|URL\s*:|https?:\/\/)/i.test(line) ||
      /•\s*المصدر\s*\[\d+\]/i.test(line);

    const isStepHeader = !isSourceLine && (
      /^[-*•–—\d+.)\]]+\s*/.test(line) ||
      /^#{1,4}\s+/.test(line) ||
      /^\*\*[^*]+\*\*/.test(line) ||
      /^\[?(?:الفرع|المسار|المرحلة|الخطوة|محور|مسار|ركن)\s*(?:\d+|الأول|الثاني|الثالث|الرابع|الخامس|السادس|1|2|3|4|5|6)?\s*[:\]\-–—]/i.test(line) ||
      /^\[(?:S\d|DISSECT|PRUNE|VERIFY|LOCK|CONVERGE|FATHOM|TIME|AI|MEMORY|DOWNLOAD|BRANCH|HYPOTHESIS|EVIDENCE|COUNTER_CHECK)[^\]]*\]/i.test(line) ||
      /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|الهدف|التحليل|الملاحظة|الاستنتاج|الخلاصة|الخطوة|مسار|المرحلة|تفكيك|مقاطعة|فحص|استنتاج|صياغة)\s*[:]/i.test(line) ||
      /^(?:Step\s*\d|Phase\s*\d|Branch\s*\d|Analysis|Hypothesis|Conclusion|Verification|Synthesis)\s*[:]/i.test(line)
    );

    if (isStepHeader) {
      if (currentHeader || currentBody.length > 0) {
        rawBlocks.push({
          header: currentHeader,
          body: currentBody.join('\n').trim()
        });
      }
      currentHeader = line;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentHeader || currentBody.length > 0) {
    rawBlocks.push({
      header: currentHeader,
      body: currentBody.join('\n').trim()
    });
  }

  const milestones: Milestone[] = [];

  // Separate search blocks and consolidate all sources into ONE rich search milestone
  const searchBlocks = rawBlocks.filter(b => 
    /fathom\s*search|serper|الاستعلام\s*الشبكي|البحث\s*عن|تدقيق\s*المصادر|search\s*for/i.test(b.header) ||
    /•\s*المصدر|المصدر\s*\[\d+\]/i.test(b.body) ||
    /•\s*المصدر|المصدر\s*\[\d+\]/i.test(b.header)
  );
  let nonSearchBlocks = rawBlocks.filter(b => !searchBlocks.includes(b));

  if (searchBlocks.length > 0) {
    let combinedQuery = '';
    const combinedDetailsList: string[] = [];

    for (const sb of searchBlocks) {
      const queryMatch = sb.header.match(/\[(?:البحث عن|query)\s*:\s*["']?([^\]"']+)["']?\]/i) ||
                         sb.body.match(/(?:البحث عن|الاستعلام عن|استعلام|query)\s*[:"']?\s*([^"\n\r•]+)/i);
      if (queryMatch && queryMatch[1]?.trim() && !combinedQuery) {
        combinedQuery = queryMatch[1].trim();
      }
      let details = sb.body;
      if (sb.header && !sb.header.includes('الاستعلام الشبكي') && !sb.body.startsWith(sb.header)) {
        details = `${sb.header}\n${sb.body}`.trim();
      }
      if (details.trim()) {
        combinedDetailsList.push(details.trim());
      }
    }

    const searchDetails = combinedDetailsList.join('\n\n').trim() || 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.';
    const sourceMatches = searchDetails.match(/•\s*المصدر\s*\[\d+\]/g);
    const sourceCount = sourceMatches ? sourceMatches.length : 0;
    const sourceCountText = sourceCount > 0 ? ` (تم استرجاع وفحص ${sourceCount} مصادر معتمدة)` : '';

    let searchTitle = combinedQuery 
      ? `الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Serper AI و Fathom Search${sourceCountText}: [البحث عن: "${combinedQuery}"]`
      : `الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Serper AI و Fathom Search${sourceCountText}`;

    if (searchTitle.length > 105) {
      searchTitle = searchTitle.slice(0, 105).trim() + '...]';
    }

    milestones.push({
      id: 'step-fathom-search',
      title: searchTitle,
      details: searchDetails,
      status: 'completed',
      specialType: 'search',
    });
  } else if (hasFathomSearch) {
    milestones.push({
      id: 'step-fathom-search',
      title: 'الاستعلام الشبكي وتدقيق المصادر الحية لعام 2026 عبر Serper AI و Fathom Search',
      details: 'تم استرجاع المصادر المعتمدة وتدقيق البيانات الحية بنجاح.',
      status: isThinking ? 'in-progress' : 'completed',
      specialType: 'search',
    });
  }

  const hasExtractedCam = nonSearchBlocks.some(b => /fathom\s*cam|المسح\s*البصري|fathom\s*vision/i.test(b.header));
  if (hasFathomCam && !hasExtractedCam) {
    milestones.push({
      id: 'special-cam',
      title: 'المسح البصري الميكروي وقراءة نصوص الصور والمستندات البصرية عبر Fathom Cam',
      details: 'فحص مصفوفة البكسلات وتحليل الجداول والنصوص البصرية بدقة ميكروية.',
      status: 'completed',
      specialType: 'cam',
    });
  }

  const hasExtractedSpark = nonSearchBlocks.some(b => /fathom\s*spark|تفكيك\s*الأكواد|استيعاب\s*الوسائط/i.test(b.header));
  if (hasFathomSpark && !hasExtractedSpark) {
    milestones.push({
      id: 'special-spark',
      title: 'استيعاب وتفكيك وسائط الفيديو والصوتيات والأكواد المرفقة عبر Fathom Spark',
      details: 'معالجة وتفكيك الأرشيفات المضغوطة وتتبع الإطارات الزمنية بدقة تامة.',
      status: 'completed',
      specialType: 'spark',
    });
  }

  // Canonical branch titles for intelligent cognitive mapping
  const branchArchetypes = [
    'تفكيك المعطيات والكيانات وتحديد الإطار الزمني',
    'تدقيق ومقاطعة مصادر وأدلة البحث الحي الميدانية',
    'استكشاف الفرضيات البديلة وتفنيد الشائعات والالتباس',
    'الاستدلال المنطقي وحسم الحقيقة القطعية المحدثة',
    'هندسة وصياغة الإجابة الفصيحة والنهائية'
  ];

  // If nonSearchBlocks is only 1 block with extended body, subdivide into cognitive branches
  if (nonSearchBlocks.length === 1 && (nonSearchBlocks[0].body.length > 40 || nonSearchBlocks[0].header.length > 40)) {
    const singleBody = `${nonSearchBlocks[0].header}\n${nonSearchBlocks[0].body}`.trim();
    let subSegments = singleBody.split(/\n+/).map(s => s.trim()).filter(s => s.length > 10);
    if (subSegments.length < 2) {
      // Split by sentence terminators
      subSegments = singleBody.split(/(?<=[.؟!])\s+/).map(s => s.trim()).filter(s => s.length > 15);
    }
    if (subSegments.length >= 2) {
      nonSearchBlocks = subSegments.slice(0, 5).map((seg, i) => ({
        header: branchArchetypes[i] || `الفرع الاستدلالي ${i + 1}`,
        body: seg
      }));
    }
  }

  // Process non-search reasoning blocks
  if (nonSearchBlocks.length >= 1) {
    nonSearchBlocks.slice(0, 6).forEach((blk, idx) => {
      let rawHeader = blk.header.replace(/^[-*•–—\d+.)\]#*]+\s*/, '').trim();
      rawHeader = rawHeader.replace(/^\*\*(.*?)\*\*$/, '$1').trim();
      const isCamBlock = /fathom\s*cam|المسح\s*البصري|fathom\s*vision/i.test(rawHeader);
      const isSparkBlock = !isCamBlock && /fathom\s*spark|تفكيك\s*الأكواد|استيعاب\s*الوسائط/i.test(rawHeader);

      let title = rawHeader.replace(/^\[[^\]]+\]\s*/, '').trim();

      // Detect and map branch labels
      const branchMatch = rawHeader.match(/(?:الفرع|المسار|المرحلة|الخطوة|محور|مسار|ركن)\s*(?:\d+|الأول|الثاني|الثالث|الرابع|الخامس|السادس|1|2|3|4|5|6)?\s*[:\]\-–—]\s*(.*)/i);
      if (branchMatch && branchMatch[1]?.trim()) {
        title = branchMatch[1].trim();
      }

      if (/^[a-zA-Z]/.test(title)) {
        if (/dissect|constraint|variable|scope|entity|clue|given/i.test(title)) {
          title = 'تفكيك المعطيات والكيانات وتحديد الإطار الزمني';
        } else if (/evidence|corroborat|cross|source|search/i.test(title)) {
          title = 'تدقيق ومقاطعة مصادر البحث الميدانية الحية';
        } else if (/prune|eliminate|contradict|hypothesis|counter|case/i.test(title)) {
          title = 'استكشاف الفرضيات البديلة وفحص الاحتمالات';
        } else if (/verify|lock|fact|check|deduce|synthesis|oxygen|suit|speed|light/i.test(title)) {
          title = 'الاستدلال المنطقي ومطابقة الشروط';
        } else if (/converge|synthesize|answer|blueprint|output/i.test(title)) {
          title = 'هندسة وصياغة الإجابة الفصيحة والنهائية';
        } else {
          title = branchArchetypes[idx % branchArchetypes.length] || `الفرع الاستدلالي ${idx + 1}`;
        }
      }

      // If title is still generic or empty, assign from canonical branch archetypes
      if (!title || /^(?:خطوة|step|استدلال|نقطة)\s*(?:الاستدلال)?\s*(?:رقم)?\s*\d*$/i.test(title)) {
        title = branchArchetypes[idx % branchArchetypes.length] || `الفرع المعرفي ${idx + 1}`;
      }

      // Clean and ensure title is crisp and concise (max ~75 chars)
      if (title.length > 75) {
        title = title.slice(0, 75).trim() + '...';
      }

      let cleanDetails = blk.body;
      if (rawHeader && !blk.body.startsWith(rawHeader) && rawHeader !== title) {
        cleanDetails = `${rawHeader}\n${blk.body}`.trim();
      }

      const specialType: 'cam' | 'spark' | undefined = 
        isCamBlock ? 'cam' : isSparkBlock ? 'spark' : undefined;

      milestones.push({
        id: `blk-${idx}`,
        title,
        details: cleanDetails.length > 5 ? cleanDetails : undefined,
        status: (isThinking && idx === nonSearchBlocks.length - 1) ? 'in-progress' : 'completed',
        specialType
      });
    });
  } else if (milestones.length === 0 || (milestones.length === 1 && milestones[0].specialType === 'search')) {
    // Monologue fallback: Divide long text into 3-4 clean structural milestones
    const totalLen = cleaned.length;
    if (totalLen > 60) {
      const part1 = cleaned.slice(0, Math.floor(totalLen * 0.30)).trim();
      const part2 = cleaned.slice(Math.floor(totalLen * 0.30), Math.floor(totalLen * 0.65)).trim();
      const part3 = cleaned.slice(Math.floor(totalLen * 0.65)).trim();

      milestones.push({
        id: 'mono-1',
        title: 'تفكيك المعطيات والكيانات وتحديد الإطار الزمني',
        details: part1 || undefined,
        status: 'completed',
      });

      milestones.push({
        id: 'mono-2',
        title: 'تدقيق ومقاطعة مصادر البحث الميدانية والأدلة الحية',
        details: part2 || undefined,
        status: isThinking && !part3 ? 'in-progress' : 'completed',
      });

      milestones.push({
        id: 'mono-3',
        title: 'الاستدلال المنطقي وحسم الحقيقة القطعية المحدثة',
        details: part3 || undefined,
        status: isThinking ? 'in-progress' : 'completed',
      });
    }
  }

  // Cap total milestones to avoid UI bloat
  return milestones.slice(0, 6);
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
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isThinking) {
      setValue("reasoning");
    }
  }, [isThinking]);

  const toggleDetail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDetails(prev => ({
      ...prev,
      [id]: !prev[id]
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

  // Parse into clean milestones with separate hidden details
  const milestones = useMemo(() => {
    return parseReasoningMilestones(fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive);
  }, [fullText, isThinking, isFathomCamActive, isFathomSparkActive, isFathomSearchActive]);

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
                <ThinkingOrb state="solving" size={18} theme="dark" speed={1.4} />
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
                {isThinking ? "جاري التفكير والتحليل المنطقي..." : "التفكير والتحليل المنطقي"}
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
          <div className="pt-2 px-1 text-right">
            {/* Clean Vertical Milestones with Interactive Sub-Collapses */}
            <div className="relative pr-1 space-y-2.5">
              {milestones.map((step, idx) => {
                const isLast = idx === milestones.length - 1;
                const isProgress = step.status === 'in-progress';
                const isDone = step.status === 'completed';
                const isExpanded = Boolean(expandedDetails[step.id]);
                const hasDetails = Boolean(step.details && step.details.trim().length > 0);

                return (
                  <div key={step.id} className="relative flex flex-col group">
                    {/* Vertical Connecting Line */}
                    {!isLast && (
                      <div className="absolute right-[9px] top-5 bottom-[-14px] w-[1px] bg-white/[0.08] pointer-events-none" />
                    )}

                    {/* Milestone Header Row */}
                    <div className="relative flex items-center justify-between gap-2 min-h-7">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Node Icon Circle (Flat, zero-glow design) */}
                        <div className="relative z-10 shrink-0">
                          {isDone ? (
                            step.specialType === 'search' ? (
                              <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-zinc-300">
                                <Search className="size-2.5 text-zinc-300 stroke-[2.2]" />
                              </div>
                            ) : step.specialType === 'cam' ? (
                              <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-zinc-300">
                                <Camera className="size-2.5 stroke-[2]" />
                              </div>
                            ) : step.specialType === 'spark' ? (
                              <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-zinc-300">
                                <Sparkles className="size-2.5 stroke-[2]" />
                              </div>
                            ) : (
                              <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-zinc-300">
                                <Check className="size-2.5 text-zinc-300 stroke-[2.5]" />
                              </div>
                            )
                          ) : isProgress ? (
                            <div className="size-4.5 rounded-full flex items-center justify-center bg-transparent">
                              <ThinkingOrb state={step.specialType === 'search' ? "searching" : "solving"} size={18} theme="dark" speed={1.4} />
                            </div>
                          ) : (
                            <div className="size-4.5 rounded-full bg-black border border-white/[0.08]" />
                          )}
                        </div>

                        {/* Crisp High-Level Task Title + Inline Collapse Button */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <p className={cn(
                            "text-xs font-mono leading-relaxed truncate select-none",
                            isProgress ? "text-white font-medium" : "text-zinc-300"
                          )}>
                            {renderMilestoneTitle(step.title)}
                          </p>

                          {/* Clean Borderless Sub-Collapse Icon Button */}
                          {hasDetails && (
                            <button
                              type="button"
                              onClick={(e) => toggleDetail(step.id, e)}
                              className={cn(
                                "size-5 p-0.5 rounded-md flex items-center justify-center transition-colors cursor-pointer select-none active:scale-95 shrink-0 hover:bg-white/[0.08]",
                                isExpanded
                                  ? "text-white"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                              title={isExpanded ? "طي التفاصيل" : "عرض التفاصيل"}
                              aria-label={isExpanded ? "طي التفاصيل" : "عرض التفاصيل"}
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3.5 transition-transform duration-200",
                                  isExpanded && "rotate-180 text-white"
                                )}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Sub-Collapse Drawer for Deep Thinking Details */}
                    <AnimatePresence>
                      {isExpanded && step.details && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          className="overflow-hidden pr-7 pl-1"
                        >
                          <div className="relative rounded-xl bg-black/75 border border-white/[0.09] p-3 text-xs text-zinc-300 font-mono leading-relaxed max-h-60 overflow-y-auto custom-scrollbar select-text shadow-inner backdrop-blur-md">
                            <div className="flex items-center pb-1.5 mb-2 border-b border-white/[0.06] text-[10px] font-mono">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                {step.specialType === 'search' ? (
                                  <>
                                    <Search className="size-3 text-zinc-400" />
                                    <span className="text-zinc-400">مسار الاستعلام واسترجاع المصادر الحية</span>
                                  </>
                                ) : step.specialType === 'cam' ? (
                                  <>
                                    <Camera className="size-3 text-zinc-400" />
                                    <span className="text-zinc-400">المسح البصري وتحليل المستندات</span>
                                  </>
                                ) : step.specialType === 'spark' ? (
                                  <>
                                    <Sparkles className="size-3 text-zinc-400" />
                                    <span className="text-zinc-400">استيعاب وتفكيك الوسائط والأكواد</span>
                                  </>
                                ) : (
                                  <>
                                    <Brain className="size-3 text-zinc-400" />
                                    <span className="text-zinc-400">مسار الاستدلال والتفكير العميق</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap break-words dir-auto text-zinc-300/90 leading-relaxed text-[11.5px]">
                              {step.details}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
