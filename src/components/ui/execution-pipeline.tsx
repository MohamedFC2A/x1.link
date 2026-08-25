import React from "react";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { ModelType } from "@/types";

export interface ExecutionPipelineProps {
  model?: ModelType;
  isX1?: boolean;
  isStreaming?: boolean;
  isThinking?: boolean;
  hasReasoning?: boolean;
  hasContent?: boolean;
  className?: string;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({
  model,
  isX1 = false,
  isStreaming = false,
  isThinking = false,
  hasReasoning = false,
  hasContent = false,
  className,
}) => {
  const isCyber = model === "deepseek-v4-flash-cyber";

  // Step 1: Input / Recon
  const step1Done = true;

  // Step 2: Reasoning / Thinking
  const step2Done = hasContent || (!isStreaming && hasReasoning);
  const step2Active = isThinking && isStreaming;

  // Step 3: Synthesis & Final Answer
  const step3Done = !isStreaming && hasContent;
  const step3Active = isStreaming && !isThinking && (hasContent || !hasReasoning);

  return (
    <div
      className={cn(
        "w-full mb-3 rounded-xl border p-2 sm:p-2.5 backdrop-blur-sm select-none transition-colors",
        isCyber
          ? "border-cyan-900/40 bg-cyan-950/15"
          : isX1
          ? "border-rose-900/40 bg-rose-950/15"
          : "border-zinc-800/80 bg-zinc-950/50",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs overflow-x-auto no-scrollbar py-0.5">
        {/* Step 1 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="size-3 sm:size-3.5" />
          </div>
          <span className="text-zinc-300 font-sans font-medium text-[10px] sm:text-xs">
            {isCyber ? "استطلاع الهدف والمنافذ" : "معالجة المدخلات"}
          </span>
        </div>

        <div className="h-[1px] w-3 sm:w-6 bg-zinc-800 shrink-0" />

        {/* Step 2 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all",
              step2Active
                ? isCyber
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-500 animate-pulse"
                  : isX1
                  ? "bg-rose-950 text-rose-400 border border-rose-500 animate-pulse"
                  : "bg-amber-950 text-amber-400 border border-amber-500 animate-pulse"
                : step2Done
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-900 text-zinc-600 border border-zinc-800"
            )}
          >
            {step2Active ? (
              <Loader2 className="size-2.5 sm:size-3 animate-spin" />
            ) : step2Done ? (
              <CheckCircle2 className="size-3 sm:size-3.5" />
            ) : (
              <Brain className="size-2.5 sm:size-3" />
            )}
          </div>
          <span
            className={cn(
              "font-sans font-medium text-[10px] sm:text-xs",
              step2Active
                ? isCyber
                  ? "text-cyan-300 font-bold"
                  : isX1
                  ? "text-rose-300 font-bold"
                  : "text-amber-300 font-bold"
                : step2Done
                ? "text-zinc-300"
                : "text-zinc-500"
            )}
          >
            {isCyber ? "الاستدلال الأمني الذكي" : "التفكير المنطقي العميق"}
          </span>
        </div>

        <div className="h-[1px] w-3 sm:w-6 bg-zinc-800 shrink-0" />

        {/* Step 3 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all",
              step3Active
                ? isCyber
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-500 animate-pulse"
                  : "bg-rose-950 text-rose-400 border border-rose-500 animate-pulse"
                : step3Done
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-900 text-zinc-600 border border-zinc-800"
            )}
          >
            {step3Active ? (
              <Loader2 className="size-2.5 sm:size-3 animate-spin" />
            ) : step3Done ? (
              <CheckCircle2 className="size-3 sm:size-3.5" />
            ) : (
              <Sparkles className="size-2.5 sm:size-3" />
            )}
          </div>
          <span
            className={cn(
              "font-sans font-medium text-[10px] sm:text-xs",
              step3Active
                ? "text-rose-300 font-bold"
                : step3Done
                ? "text-zinc-300"
                : "text-zinc-500"
            )}
          >
            {isCyber ? "التقرير الأمني المتكامل" : "صياغة الرد النهائي"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPipeline;
