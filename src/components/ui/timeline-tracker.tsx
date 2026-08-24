import React from 'react';
import { Check, Clock, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  id: string | number;
  title: string;
  description: string;
  timestamp?: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon?: React.ReactNode;
}

interface TimelineTrackerProps {
  steps: TimelineStep[];
  className?: string;
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({ steps, className }) => {
  return (
    <div className={cn("relative py-2 text-right", className)} dir="rtl">
      <div className="flex flex-col space-y-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in-progress';
          const isPending = step.status === 'pending';

          return (
            <div key={step.id} className="relative flex items-start gap-3.5 group">
              
              {/* Vertical Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute right-[15px] top-[32px] w-[2px] h-[calc(100%+8px)] transition-all duration-500",
                    isCompleted
                      ? "bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                      : isInProgress
                      ? "bg-gradient-to-b from-rose-500 to-zinc-700"
                      : "bg-zinc-800"
                  )}
                />
              )}

              {/* Status Indicator Icon Node */}
              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 font-mono",
                  isCompleted && "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/30",
                  isInProgress && "bg-zinc-900 border-2 border-rose-500 text-rose-400 shadow-md shadow-rose-950/40 animate-pulse ring-4 ring-rose-500/10",
                  isPending && "bg-zinc-900 border border-zinc-700/80 text-zinc-500"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-[2.5]" />
                ) : isInProgress ? (
                  <Clock className="size-4 animate-spin-slow" />
                ) : (
                  <Circle className="size-3 stroke-[2]" />
                )}
              </div>

              {/* Step Content Card */}
              <div className="flex-1 pt-0.5 min-w-0">
                {step.timestamp && (
                  <div className="text-[11px] font-mono text-zinc-500 mb-1 flex items-center gap-1.5">
                    <span>{step.timestamp}</span>
                    {isInProgress && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-950/90 text-rose-400 border border-rose-800 animate-pulse">
                        جاري التنفيذ
                      </span>
                    )}
                  </div>
                )}

                <h4
                  className={cn(
                    "text-sm font-bold tracking-tight font-sans transition-colors",
                    isCompleted ? "text-white group-hover:text-rose-300" : isInProgress ? "text-rose-400" : "text-zinc-400"
                  )}
                >
                  {step.title}
                </h4>

                <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 font-sans">
                  {step.description}
                </p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
