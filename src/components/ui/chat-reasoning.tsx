import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { UIDataTypes, UIMessagePart, UITools } from "ai";
import React from "react";
import { Brain, Check, Sparkles } from "lucide-react";

export interface ReasoningStep {
  type: string;
  text?: string;
  toolName?: string;
  output?: any;
}

export interface ChatReasoningProps {
  partsInAccordion?: (UIMessagePart<UIDataTypes, UITools> | ReasoningStep | any)[];
  defaultValue?: string;
  renderMessagePart?: (
    part: UIMessagePart<UIDataTypes, UITools> | ReasoningStep | any,
    key: string | number,
  ) => React.ReactNode;
  className?: string;
}

export default function ChatReasoning({
  partsInAccordion = [],
  defaultValue = "reasoning",
  renderMessagePart,
  className,
}: ChatReasoningProps) {
  const [value, setValue] = React.useState<string | undefined>(defaultValue);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  if (!partsInAccordion || partsInAccordion.length === 0) return null;

  const defaultRenderPart = (part: any, key: string | number) => {
    if (part.type === "reasoning" || part.text) {
      return (
        <p key={key} className="text-xs text-zinc-300 leading-relaxed py-1 font-sans">
          {part.text || part.content}
        </p>
      );
    }
    if (part.type && part.type.startsWith("tool-")) {
      return (
        <div key={key} className="flex items-center gap-1.5 text-xs text-zinc-300 py-1">
          <Check className="size-3.5 text-emerald-500" />
          <span>استخدام أداة {part.type.replace("tool-", "")}</span>
        </div>
      );
    }
    return (
      <div key={key} className="text-xs text-zinc-400 py-0.5">
        {typeof part === 'string' ? part : JSON.stringify(part)}
      </div>
    );
  };

  const renderer = renderMessagePart || defaultRenderPart;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className={cn("w-full my-2", className)}
    >
      <AccordionItem value="reasoning" className="w-full border border-zinc-800/80 bg-zinc-950/70 rounded-2xl px-3 py-1 shadow-sm">
        <AccordionTrigger className="text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:no-underline py-2 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="font-sans font-semibold">
              {value === "reasoning" ? "تفكير وتحليل منطقي عميق..." : "تم إكمال التحليل والاستدلال."}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0 pt-2 pb-1 border-t border-zinc-800/60">
          <div className="flex flex-col gap-1 pr-1">
            {partsInAccordion.map(
              (part, index) =>
                part.type !== "step-start" && (
                  <div key={index} className="flex gap-2.5 items-start">
                    <div className="flex flex-col items-center gap-1 pt-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 bg-rose-500/80 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                      {index !== partsInAccordion.length - 1 && (
                        <div className="w-0.5 min-h-[16px] flex-1 bg-zinc-800" />
                      )}
                    </div>
                    <div className="flex-1">
                      {renderer(part, `accordion-${index}`)}
                    </div>
                  </div>
                ),
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
