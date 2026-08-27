import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Brain, Cpu, Check, ChevronRight, Clock } from "lucide-react";
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

function parseReasoningMilestones(rawText: string, isThinking: boolean): Milestone[] {
  if (!rawText || !rawText.trim()) {
    if (isThinking) {
      return [
        {
          id: 'step-1',
          text: 'تفكيك معطيات السؤال واستدعاء المعارف والروابط المنطقية',
          status: 'in-progress',
        },
      ];
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
    const isBullet = /^[-*•–—\d+.)\]]\s*/.test(line) || /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|الهدف|التحليل|الملاحظة|الاستنتاج|الخلاصة|الخطوة|مسار)\s*[:]/i.test(line);
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

  // Limit to max 4 milestones for ultra-clean, elegant UI
  const maxSteps = Math.min(rawSteps.length, 4);
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

  // Parse into smart milestones
  const milestones = useMemo(() => {
    return parseReasoningMilestones(fullText, isThinking);
  }, [fullText, isThinking]);

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
          "w-full border rounded-2xl px-3 sm:px-4 py-1 transition-all duration-200",
          isThinking
            ? "border-white/[0.12] bg-white/[0.02]"
            : "border-white/[0.06] bg-black/40 hover:bg-black/60"
        )}
      >
        <AccordionTrigger className="text-xs font-medium text-zinc-300 hover:text-white hover:no-underline py-2 w-full flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center justify-center size-5 shrink-0">
              {isThinking ? (
                <ThinkingOrb state="solving" size={20} theme="dark" speed={1.5} />
              ) : isX1 ? (
                <div className="flex items-center justify-center size-5 rounded-md border bg-white/[0.05] border-white/[0.08] text-zinc-200">
                  <Cpu className="size-3 text-zinc-200" />
                </div>
              ) : (
                <div className="flex items-center justify-center size-5 rounded-md border bg-white/[0.05] border-white/[0.08] text-zinc-200">
                  <Brain className="size-3 text-zinc-200" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-semibold text-xs sm:text-sm text-zinc-200">
                {isThinking ? "جاري التفكير والتحليل المنطقي..." : "التفكير والتحليل المنطقي"}
              </span>

              {/* Render Active Feature Badges */}
              {activeFeatures.map((feat) => {
                const def = FEATURES_REGISTRY[feat.id];
                const IconComponent = def?.icon || Brain;
                return (
                  <span
                    key={feat.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full select-none transition-all text-[11px] font-sans font-black tracking-wide",
                      def?.glassClassName || "time-detect-glass"
                    )}
                  >
                    <IconComponent size={13} />
                    <span className={def?.textClassName || "time-detect-text"}>
                      {feat.badgeLabel}
                    </span>
                  </span>
                );
              })}

              {!activeFeatures.length && isTimeIntent && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full time-detect-glass select-none transition-all">
                  <TimeDetectIcon size={13} />
                  <span className="time-detect-text text-[11px] font-sans font-black tracking-wide">
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
            <div className="relative pr-1 space-y-3.5">
              {milestones.map((step, idx) => {
                const isLast = idx === milestones.length - 1;
                const isProgress = step.status === 'in-progress';
                const isDone = step.status === 'completed';

                return (
                  <div key={step.id} className="relative flex items-start gap-3 group">
                    {/* Vertical Connecting Line */}
                    {!isLast && (
                      <div className="absolute right-[9px] top-5 bottom-[-14px] w-[1.5px] bg-zinc-800" />
                    )}

                    {/* Node Icon Circle */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      {isDone ? (
                        <div className="size-5 rounded-full bg-zinc-900 border border-zinc-500/70 flex items-center justify-center text-white shadow-sm">
                          <Check className="size-3 text-zinc-100 stroke-[2.5]" />
                        </div>
                      ) : isProgress ? (
                        <div className="size-5 rounded-full flex items-center justify-center bg-transparent">
                          <ThinkingOrb state="solving" size={20} theme="dark" speed={1.5} />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full bg-zinc-950 border border-zinc-800" />
                      )}
                    </div>

                    {/* Milestone Single Clean Point */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={cn(
                        "text-xs font-sans leading-relaxed break-words",
                        isProgress ? "text-white font-medium" : "text-zinc-300"
                      )}>
                        {step.text}
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
