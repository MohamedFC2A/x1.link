import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import React from "react";
import { Sparkles, Brain } from "lucide-react";

export interface ReasoningStep {
  type: string;
  text?: string;
  toolName?: string;
  output?: any;
}

export default function ChatReasoning({
  partsInAccordion = [],
  defaultValue = "reasoning",
  className,
}: {
  partsInAccordion?: ReasoningStep[];
  defaultValue?: string;
  className?: string;
}) {
  const [value, setValue] = React.useState<string | undefined>(defaultValue);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  if (!partsInAccordion || partsInAccordion.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className={cn("w-full my-2.5", className)}
    >
      <AccordionItem value="reasoning" className="w-full border-0 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3 py-0.5">
        <AccordionTrigger className="text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline py-2 w-full flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-medium">
              {defaultValue === "reasoning" ? "جاري التفكير والتحليل..." : "تم إكمال التفكير والتحليل"}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-0 pt-1 pb-2 border-t border-zinc-800/60">
          <div className="flex flex-col gap-2 text-xs text-zinc-300 py-1 font-sans">
            {partsInAccordion.map((part, index) => (
              <div key={index} className="flex gap-2.5 pl-1 items-start">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="w-1.5 h-1.5 bg-rose-500/80 rounded-full" />
                  {index !== partsInAccordion.length - 1 && (
                    <div className="w-0.5 min-h-[14px] flex-1 bg-zinc-800" />
                  )}
                </div>
                <div className="flex-1 text-xs leading-relaxed text-zinc-400">
                  {part.text || (part.toolName ? `استدعاء أداة: ${part.toolName}` : '')}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
