import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Brain, Cpu } from "lucide-react";

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
  isX1?: boolean;
  defaultValue?: string;
  className?: string;
}

export default function ChatReasoning({
  reasoningText,
  partsInAccordion = [],
  isThinking = false,
  isX1 = false,
  defaultValue,
  className,
}: ChatReasoningProps) {
  // If actively thinking, keep open by default, otherwise follow defaultValue
  const [value, setValue] = useState<string | undefined>(
    isThinking ? "reasoning" : defaultValue
  );

  useEffect(() => {
    if (isThinking) {
      setValue("reasoning");
    }
  }, [isThinking]);

  // Combine reasoningText or parts
  const fullText = reasoningText || partsInAccordion.map(p => p.text || '').filter(Boolean).join('\n\n');

  if (!fullText && !isThinking) return null;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className={cn("w-full mb-3", className)}
    >
      <AccordionItem
        value="reasoning"
        className={cn(
          "w-full border rounded-2xl px-3 sm:px-3.5 py-1 transition-all duration-150 glass-card",
          isThinking
            ? "border-white/[0.2] bg-white/[0.04]"
            : "border-white/[0.08] bg-black/40 hover:bg-black/60"
        )}
      >
        <AccordionTrigger className="text-xs font-medium text-zinc-300 hover:text-white hover:no-underline py-1.5 w-full flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-5 rounded-md border bg-white/[0.05] border-white/[0.08] text-zinc-200">
              {isX1 ? <Cpu className="size-3 text-zinc-200" /> : <Brain className="size-3 text-zinc-200" />}
            </div>

            <span className="font-sans font-semibold text-xs sm:text-sm text-zinc-200">
              {isThinking
                ? isX1
                  ? "تفكير واستدعاء معمارية X1 MAX..."
                  : "تفكير وتحليل منطقي عميق..."
                : "تم إكمال التحليل والتفكير المنطقي"}
            </span>

            {isThinking && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pt-2 pb-2 border-t border-white/[0.06]">
          <div className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isX1 ? "bg-rose-500" : "bg-amber-500"
              )} />
              <div className="w-0.5 min-h-[20px] flex-1 bg-zinc-800" />
            </div>

            <div className="flex-1 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap select-text pr-1 break-words">
              {fullText || (
                <span className="italic text-zinc-500 text-xs">
                  جاري تفكيك الفرضيات وتوليد خطوات الاستدلال في الوقت الفعلي...
                </span>
              )}
              {isThinking && (
                <span className={cn(
                  "inline-block w-1.5 h-3.5 mr-1 align-middle rounded-full",
                  isX1 ? "bg-rose-500" : "bg-amber-500"
                )} />
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
