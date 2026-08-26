import React from "react";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { ModelType } from "@/types";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";

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
        "w-full mb-3 rounded-xl border border-white/[0.08] bg-black/40 p-2 sm:p-2.5 select-none transition-colors",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs overflow-x-auto no-scrollbar py-0.5">
        {/* Step 1 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold bg-white/[0.08] text-white border border-white/[0.15]">
            <CheckCircle2 className="size-3 sm:size-3.5" />
          </div>
          <span className="text-zinc-300 font-sans font-medium text-[10px] sm:text-xs">
            {isCyber ? "استخبارات ومسح 100+ صفحة" : "معالجة المدخلات"}
          </span>
        </div>

        <div className="h-[1px] w-3 sm:w-6 bg-white/[0.08] shrink-0" />

        {/* Step 2 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all",
              step2Active
                ? "bg-transparent border-0"
                : step2Done
                ? "bg-white/[0.08] text-white border border-white/[0.15]"
                : "bg-white/[0.04] text-zinc-500 border border-white/[0.08]"
            )}
          >
            {step2Active ? (
              <ThinkingOrb state="solving" size={20} theme="dark" />
            ) : step2Done ? (
              <CheckCircle2 className="size-3 sm:size-3.5" />
            ) : (
              <Brain className="size-2.5 sm:size-3" />
            )}
          </div>
          <span
            className={cn(
              "font-sans font-medium text-[10px] sm:text-xs",
              step2Active ? "text-white font-semibold" : step2Done ? "text-zinc-200" : "text-zinc-500"
            )}
          >
            {isCyber
              ? "تحليل ومطابقة الأدلة"
              : isX1
              ? "استدعاء معمارية X1 MAX"
              : "التفكير والتحليل المنطقي"}
          </span>
        </div>

        <div className="h-[1px] w-3 sm:w-6 bg-white/[0.08] shrink-0" />

        {/* Step 3 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "flex size-4 sm:size-5 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all",
              step3Active
                ? "bg-transparent border-0"
                : step3Done
                ? "bg-white/[0.08] text-white border border-white/[0.15]"
                : "bg-white/[0.04] text-zinc-500 border border-white/[0.08]"
            )}
          >
            {step3Active ? (
              <ThinkingOrb state="composing" size={20} theme="dark" />
            ) : step3Done ? (
              <CheckCircle2 className="size-3 sm:size-3.5" />
            ) : (
              <Sparkles className="size-2.5 sm:size-3" />
            )}
          </div>
          <span
            className={cn(
              "font-sans font-medium text-[10px] sm:text-xs",
              step3Active ? "text-white font-semibold" : step3Done ? "text-zinc-200" : "text-zinc-500"
            )}
          >
            {isStreaming && step3Active
              ? "توليد الرد المباشر..."
              : step3Done
              ? "اكتمل التوليد"
              : "التوليد النهائي"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPipeline;
