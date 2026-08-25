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
          "w-full border rounded-2xl px-3 sm:px-3.5 py-1 transition-all duration-200 shadow-sm",
          isThinking
            ? isX1
              ? "border-rose-600/70 bg-rose-950/25 ring-1 ring-rose-500/30"
              : "border-amber-500/50 bg-amber-950/15 ring-1 ring-amber-500/20"
            : "border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-950/80"
        )}
      >
        <AccordionTrigger className="text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:no-underline py-1.5 w-full flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center size-5 rounded-md border",
              isThinking
                ? isX1
                  ? "bg-rose-600/30 border-rose-500 text-rose-400 animate-pulse"
                  : "bg-amber-600/30 border-amber-500 text-amber-400 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            )}>
              {isX1 ? <Cpu className="size-3" /> : <Brain className="size-3" />}
            </div>

            <span className={cn(
              "font-sans font-semibold text-xs sm:text-sm",
              isThinking
                ? isX1
                  ? "text-rose-300"
                  : "text-amber-300"
                : "text-zinc-300"
            )}>
              {isThinking
                ? isX1
                  ? "تفكير واستدعاء معمارية X1 (+21)..."
                  : "تفكير وتحليل منطقي عميق..."
                : "تم إكمال التحليل والتفكير المنطقي"}
            </span>

            {isThinking && (
              <span className="flex h-2 w-2 relative">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isX1 ? "bg-rose-400" : "bg-amber-400"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isX1 ? "bg-rose-500" : "bg-amber-500"
                )} />
              </span>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pt-2 pb-2 border-t border-zinc-800/60">
          <div className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isX1
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
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
                  "inline-block w-1.5 h-3.5 mr-1 align-middle animate-pulse rounded-full",
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
