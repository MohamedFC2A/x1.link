import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Brain, Cpu, Check, ChevronRight, Clock, Camera, Sparkles } from "lucide-react";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";

export interface ReasoningStep {
  type: string;
  text?: string;
  toolName?: string;
  output?: any;
}

import { DetectedFeatureData, FEATURES_REGISTRY, TimeDetectIcon, MemoryDetectIcon } from "@/lib/featuresRegistry";

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

interface Milestone {
  id: string;
  text: string;
  status: 'completed' | 'in-progress';
}

function parseReasoningMilestones(
  rawText: string,
  isThinking: boolean,
  hasFathomCam: boolean = false,
  hasFathomSpark: boolean = false
): Milestone[] {
  if (!rawText || !rawText.trim()) {
    if (isThinking) {
      const steps: Milestone[] = [
        {
          id: 'step-1',
          text: 'تفكيك معطيات السؤال واستدعاء المعارف والروابط المنطقية',
          status: (hasFathomCam || hasFathomSpark) ? 'completed' : 'in-progress',
        },
      ];
      if (hasFathomCam) {
        steps.push({
          id: 'step-fathom-cam',
          text: 'المسح البصري الميكروي وقراءة نصوص الجداول والصور المرفقة عبر Fathom Cam',
          status: 'in-progress',
        });
      }
      if (hasFathomSpark) {
        steps.push({
          id: 'step-fathom-spark',
          text: 'استيعاب وتفكيك وسائط الفيديو والصوتيات والملفات المرفقة عبر Fathom Spark',
          status: 'in-progress',
        });
      }
      return steps;
    }
    return [];
  }

  // Clean raw text from think tags and sanitize any system prompt / policy leaks
  const cleaned = rawText
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .trim();

  // Forbidden prompt leak pattern: filter out any mention of system prompt instructions or developer identity rules
  const isPromptLeak = (str: string) => {
    return /(?:DEVELOPER_IDENTITY|SYSTEM_PROMPT|النظام\s*يقول|حظر\s*مطلق|قاعدة\s*الاستجابة|تعليمات\s*الهوية|قواعد\s*النظام|المطور\s*الأساسي|Mohamed\s*Ahmed\s*Matany|MatanyLabs|Context-Proportional\s*Attribution|Strict\s*Exclusivity|Identity\s*vs\s*Conversations)/i.test(str);
  };

  // Split lines
  const lines = cleaned.split('\n')
    .map(l => l.trim())
    .filter(l => Boolean(l) && !isPromptLeak(l));

  const candidateSteps: string[] = [];

  let currentBlock = '';
  for (const line of lines) {
    const isBullet = /^[-*•–—\d+.)\]]\s*/.test(line) || /^\[(?:FATHOM|TIME|AI|MEMORY|DOWNLOAD)[^\]]*\]/i.test(line) || /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|الهدف|التحليل|الملاحظة|الاستنتاج|الخلاصة|الخطوة|مسار)\s*[:]/i.test(line);
    if (isBullet && currentBlock) {
      if (!isPromptLeak(currentBlock)) candidateSteps.push(currentBlock.trim());
      currentBlock = line;
    } else {
      currentBlock = currentBlock ? `${currentBlock} ${line}` : line;
    }
  }
  if (currentBlock && !isPromptLeak(currentBlock)) {
    candidateSteps.push(currentBlock.trim());
  }

  // If only 1 massive block without bullets, split by sentence endings
  let rawSteps = candidateSteps;
  if (rawSteps.length <= 1 && cleaned.length > 70) {
    const sentences = cleaned.split(/(?<=[.؟!])\s+/).filter(s => s.trim().length > 10 && !isPromptLeak(s));
    if (sentences.length > 1) {
      rawSteps = sentences;
    }
  }

  // Filter out any leaked steps
  rawSteps = rawSteps.filter(s => !isPromptLeak(s));

  // Fallback if still empty or 1 block
  if (rawSteps.length === 0) {
    rawSteps = [
      'تفكيك فرضيات ومعطيات المسألة وتحليل الأبعاد التقنية',
      'تدقيق النتائج وصياغة الاستجابة الفصحى بدقة'
    ];
  } else if (rawSteps.length === 1) {
    rawSteps = [
      rawSteps[0].slice(0, 140) + (rawSteps[0].length > 140 ? '...' : ''),
      'تدقيق المعطيات واستخلاص النتائج وصياغة الطرح'
    ];
  }

  // Automatically inject Fathom Cam milestone if active and not already mentioned
  if (hasFathomCam) {
    const alreadyHasFathom = rawSteps.some(s => /(?:Fathom\s*Cam|FathomCam|المسح\s*البصري|فحص\s*الصور|قراءة\s*الجداول|FATHOM)/i.test(s));
    if (!alreadyHasFathom) {
      const insertIdx = Math.min(1, rawSteps.length);
      rawSteps.splice(insertIdx, 0, 'المسح البصري الميكروي وقراءة نصوص الجداول والصور المرفقة عبر Fathom Cam');
    }
  }

  // Automatically inject Fathom Spark milestone if active and not already mentioned
  if (hasFathomSpark) {
    const alreadyHasSpark = rawSteps.some(s => /(?:Fathom\s*Spark|FathomSpark|استيعاب\s*الفيديو|تفكيك\s*الفيديو|تفريغ\s*الصوت|وسائط\s*الفيديو)/i.test(s));
    if (!alreadyHasSpark) {
      const insertIdx = Math.min(1, rawSteps.length);
      rawSteps.splice(insertIdx, 0, 'استيعاب وتفكيك وسائط الفيديو والصوتيات والملفات المرفقة عبر Fathom Spark');
    }
  }

  // Allow dynamic milestone expansion (up to 8 milestones) so no steps are displaced or truncated
  const maxSteps = Math.min(rawSteps.length, 8);
  const sliced = rawSteps.slice(0, maxSteps);

  return sliced.map((stepText, idx) => {
    // Strip leading markers like "1. ", "- ", "* "
    const cleanStep = stepText.replace(/^[-*•–—\d+.)\]]+\s*/, '').trim();
    const isLast = idx === sliced.length - 1;
    const status: 'completed' | 'in-progress' = (isThinking && isLast) ? 'in-progress' : 'completed';

    return {
      id: `milestone-${idx}`,
      text: cleanStep,
      status,
    };
  });
}

function renderMilestoneText(text: string) {
  if (!text) return null;
  const engineRegex = /(?:\[?FATHOM(?:\s*CAM)?(?:\s*VISION)?\]?|Fathom\s*Cam(?:\s*Vision)?|\[?FATHOM(?:\s*SPARK)?\]?|Fathom\s*Spark)/gi;

  if (!engineRegex.test(text)) {
    return text;
  }

  const parts = text.split(engineRegex);
  const matches = text.match(engineRegex) || [];

  return (
    <span>
      {parts.map((part, i) => {
        const match = matches[i];
        const isSpark = match && /spark/i.test(match);
        const isCam = match && !isSpark;

        return (
          <React.Fragment key={i}>
            {part}
            {isCam && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="text-emerald-400 font-black tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.85)] [text-shadow:0_0_12px_rgba(52,211,153,0.8)]">
                  Fathom
                </span>
                <span className="text-white font-black tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,1)] [text-shadow:0_0_14px_rgba(255,255,255,0.95)]">
                  Cam
                </span>
              </span>
            )}
            {isSpark && (
              <span dir="ltr" className="inline-flex items-center gap-1 mx-1.5 select-none font-sans font-black tracking-wide align-baseline">
                <span className="text-violet-400 font-black tracking-tight drop-shadow-[0_0_10px_rgba(167,139,250,0.85)] [text-shadow:0_0_12px_rgba(167,139,250,0.8)]">
                  Fathom
                </span>
                <span className="text-white font-black tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,1)] [text-shadow:0_0_14px_rgba(255,255,255,0.95)]">
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
  const [value, setValue] = useState<string | undefined>(defaultValue);
  const prevThinkingRef = useRef(isThinking);

  // Smoothly manage open/close state: open during thinking, auto-close on completion
  useEffect(() => {
    if (isThinking) {
      setValue("reasoning");
    } else if (prevThinkingRef.current && !isThinking) {
      // Automatically collapse smoothly once thinking completes
      setValue(undefined);
    }
    prevThinkingRef.current = isThinking;
  }, [isThinking]);

  // Combine reasoningText or parts
  const fullText = reasoningText || partsInAccordion.map(p => p.text || '').filter(Boolean).join('\n\n');

  // Detect whether Fathom Cam was used
  const isFathomCamActive = useMemo(() => {
    return (
      activeFeatures.some(f => f.id === 'fathom_cam') ||
      /(?:\[?FATHOM(?:\s*CAM)?(?:\s*VISION)?\]?|Fathom\s*Cam|tansik\.digital\.gov\.eg|الخطوة\s*الرابعة|جدول\s*الرغبات|فحص\s*الصور|المسح\s*البصري|قراءة\s*الجداول|تحليل\s*الصورة|تحليل\s*الواجهة|واجهة\s*سوق|واجهة\s*المستخدم|عناصر\s*الواجهة|لقطة\s*الشاشة|الصورة\s*المرفقة)/i.test(fullText)
    );
  }, [activeFeatures, fullText]);

  // Detect whether Fathom Spark was used
  const isFathomSparkActive = useMemo(() => {
    return (
      activeFeatures.some(f => f.id === 'fathom_spark' || f.id === 'download_detect') ||
      /(?:\[?FATHOM(?:\s*SPARK)?\]?|Fathom\s*Spark|استيعاب\s*الفيديو|تفكيك\s*الفيديو|تفريغ\s*الصوت|videoVision|تحليل\s*المقطع|المقطع\s*المرئي|الملفات\s*المرفقة)/i.test(fullText)
    );
  }, [activeFeatures, fullText]);

  // Parse into smart milestones with Fathom Cam & Spark awareness
  const milestones = useMemo(() => {
    return parseReasoningMilestones(fullText, isThinking, isFathomCamActive, isFathomSparkActive);
  }, [fullText, isThinking, isFathomCamActive, isFathomSparkActive]);

  // Fathom Cam and Fathom Spark are rendered exclusively inside thinking milestones, NOT in the top header features
  const visibleHeaderFeatures = useMemo(() => {
    return activeFeatures.filter(f => f.id !== 'fathom_cam' && f.id !== 'fathom_spark');
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
          "w-full border rounded-xl px-3.5 sm:px-4 py-1 transition-all duration-300 backdrop-blur-md",
          isThinking
            ? "border-white/[0.1] bg-black/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            : "border-white/[0.06] bg-black/50 hover:border-white/[0.1] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        )}
      >
        <AccordionTrigger className="text-xs font-medium text-zinc-300 hover:text-white hover:no-underline py-2 w-full flex items-center justify-between cursor-pointer">
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
              <span className="font-mono text-xs text-zinc-300 font-medium tracking-tight">
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

        <AccordionContent className="p-0 pt-3 pb-3 border-t border-white/[0.06]">
          <div className="pt-1 px-1 text-right">
            {/* Vertical Smart Milestones Path */}
            <div className="relative pr-1 space-y-3">
              {milestones.map((step, idx) => {
                const isLast = idx === milestones.length - 1;
                const isProgress = step.status === 'in-progress';
                const isDone = step.status === 'completed';
                const isFathomStep = /(?:\[?FATHOM(?:\s*CAM)?(?:\s*VISION)?\]?|Fathom\s*Cam(?:\s*Vision)?)/i.test(step.text);
                const isSparkStep = /(?:\[?FATHOM(?:\s*SPARK)?\]?|Fathom\s*Spark)/i.test(step.text);

                return (
                  <div key={step.id} className="relative flex items-start gap-3 group">
                    {/* Vertical Connecting Line */}
                    {!isLast && (
                      <div className="absolute right-[8px] top-4.5 bottom-[-12px] w-[1px] bg-white/[0.08]" />
                    )}

                    {/* Node Icon Circle */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      {isDone ? (
                        isFathomStep ? (
                          <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-white shadow-inner">
                            <Camera className="size-2.5 text-zinc-200 stroke-[2.2]" />
                          </div>
                        ) : isSparkStep ? (
                          <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-white shadow-inner">
                            <Sparkles className="size-2.5 text-zinc-200 stroke-[2.2]" />
                          </div>
                        ) : (
                          <div className="size-4.5 rounded-full bg-white/[0.06] border border-white/[0.14] flex items-center justify-center text-white shadow-inner">
                            <Check className="size-2.5 text-zinc-200 stroke-[2.5]" />
                          </div>
                        )
                      ) : isProgress ? (
                        <div className="size-4.5 rounded-full flex items-center justify-center bg-transparent">
                          <ThinkingOrb state="solving" size={18} theme="dark" speed={1.4} />
                        </div>
                      ) : (
                        <div className="size-4.5 rounded-full bg-black border border-white/[0.08]" />
                      )}
                    </div>

                    {/* Milestone Single Clean Point with Fathom Cam / Spark Shiny Typography */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={cn(
                        "text-xs font-mono leading-relaxed break-words",
                        isProgress ? "text-white font-medium" : (isFathomStep || isSparkStep ? "text-zinc-300" : "text-zinc-400")
                      )}>
                        {renderMilestoneText(step.text)}
                      </p>
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
