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

export interface ChatReasoningProps {
  reasoningText?: string;
  partsInAccordion?: ReasoningStep[];
  isThinking?: boolean;
  isStreaming?: boolean;
  isX1?: boolean;
  isTimeIntent?: boolean;
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
          text: 'تفكيك فرضيات السؤال واستدعاء المعارف والروابط المنطقية',
          status: 'in-progress',
        },
      ];
    }
    return [];
  }

  // Clean raw text from think tags
  const cleaned = rawText
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .trim();

  // Split lines
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  const candidateSteps: string[] = [];

  let currentBlock = '';
  for (const line of lines) {
    const isBullet = /^[-*•–—\d+.)\]]\s*/.test(line) || /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|الهدف|التحليل|الملاحظة|الاستنتاج|الخلاصة|الخطوة|مسار)\s*[:]/i.test(line);
    if (isBullet && currentBlock) {
      candidateSteps.push(currentBlock.trim());
      currentBlock = line;
    } else {
      currentBlock = currentBlock ? `${currentBlock} ${line}` : line;
    }
  }
  if (currentBlock) {
    candidateSteps.push(currentBlock.trim());
  }

  // If only 1 massive block without bullets, split by sentence endings
  let rawSteps = candidateSteps;
  if (rawSteps.length <= 1 && cleaned.length > 70) {
    const sentences = cleaned.split(/(?<=[.؟!])\s+/).filter(s => s.trim().length > 10);
    if (sentences.length > 1) {
      rawSteps = sentences;
    }
  }

  // Fallback if still 1 block: create progressive milestones from the content
  if (rawSteps.length <= 1) {
    rawSteps = [
      cleaned.slice(0, 140) + (cleaned.length > 140 ? '...' : ''),
      'تدقيق المعطيات واستخلاص النتائج وصياغة الطرح'
    ];
  }

  // Limit to max 5 milestones for ultra-clean UI
  const maxSteps = Math.min(rawSteps.length, 5);
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
  defaultValue,
  className,
}: ChatReasoningProps) {
  const [value, setValue] = useState<string | undefined>(
    isThinking ? "reasoning" : defaultValue
  );
  const [showRawText, setShowRawText] = useState(false);
  const prevIsThinkingRef = useRef(isThinking);
  const prevIsStreamingRef = useRef(isStreaming);

  // Auto-collapse when thinking or whole stream completes
  useEffect(() => {
    if (isThinking && !prevIsThinkingRef.current) {
      setValue("reasoning");
    } else if (!isThinking && prevIsThinkingRef.current) {
      // Auto-collapse seamlessly when thinking finishes!
      setValue(undefined);
    } else if (!isStreaming && prevIsStreamingRef.current) {
      // Auto-collapse when whole message stream completes!
      setValue(undefined);
    }
    prevIsThinkingRef.current = isThinking;
    prevIsStreamingRef.current = isStreaming;
  }, [isThinking, isStreaming]);

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
          <div className="flex items-center gap-2.5">
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

            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-xs sm:text-sm text-zinc-200">
                {isThinking
                  ? isX1
                    ? "تفكير واستدعاء معمارية X1 MAX..."
                    : isTimeIntent
                    ? "استشعار المعطيات الزمنية والمنطقية..."
                    : "جاري التفكير والتحليل المنطقي..."
                  : "التفكير والتحليل المنطقي"}
              </span>

              {isTimeIntent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/90 border border-sky-400/25 time-detect-text text-[10px] font-mono font-black tracking-wide shadow-sm">
                  <Clock className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  Time Detect
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pt-3 pb-3 border-t border-white/[0.06]">
          <div className="pt-1 px-1 text-right">
            
            {/* Vertical Smart Milestones Path (Ultra Clean Image 2 style) */}
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

            {/* Full Raw Thought Trace Toggle */}
            {fullText && (
              <div className="mt-4 pt-3 border-t border-white/[0.06] text-right">
                <button
                  type="button"
                  onClick={() => setShowRawText(prev => !prev)}
                  className="text-[11px] font-sans text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/[0.04]"
                >
                  <ChevronRight className={cn("size-3 transition-transform", showRawText && "rotate-90")} />
                  <span>{showRawText ? "إخفاء النص التفصيلي الكامل" : "عرض مسار الاستدلال الخام للتفكير"}</span>
                </button>

                {showRawText && (
                  <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/[0.06] text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap break-words max-h-60 overflow-y-auto smooth-scroll">
                    {fullText}
                  </div>
                )}
              </div>
            )}

          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
