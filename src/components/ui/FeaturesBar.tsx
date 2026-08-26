import React from 'react';
import { cn } from '@/lib/utils';
import { FEATURES_REGISTRY, DetectedFeatureData } from '@/lib/featuresRegistry';
import { Zap, ShieldCheck } from 'lucide-react';

interface FeaturesBarProps {
  features: DetectedFeatureData[];
  isStreaming?: boolean;
  className?: string;
}

export const FeaturesBar: React.FC<FeaturesBarProps> = ({
  features,
  isStreaming = false,
  className
}) => {
  if (!features || features.length === 0) return null;

  return (
    <div
      className={cn(
        "my-3 rounded-2xl border border-white/[0.08] bg-[#0a0c16] p-3 sm:p-3.5 text-right animate-in fade-in duration-200 select-none overflow-hidden space-y-2.5 shadow-lg",
        className
      )}
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        {/* Crisp "الخواص النشطة" Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.12]">
            <Zap className="size-3 text-amber-400 fill-amber-400/30 shrink-0" />
            <span className="text-xs font-sans font-bold text-white tracking-wide">
              الخواص النشطة
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/[0.1] text-zinc-200">
              {features.length}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-sans hidden sm:inline-block font-normal">
            نظام استشعار وتدقيق المعطيات الفائقة
          </span>
        </div>

        {/* Feature Badges with Crisp High-Contrast Gradient Text */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {features.map((feat) => {
            const def = FEATURES_REGISTRY[feat.id];
            const IconComponent = def?.icon || ShieldCheck;
            return (
              <div
                key={feat.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black border transition-all select-none shadow-sm",
                  def?.glassClassName || "time-detect-glass",
                  def?.borderHoverColor || "border-white/30"
                )}
              >
                <IconComponent size={13} className="shrink-0" />
                <span className={def?.textClassName || "time-detect-text"}>
                  {feat.badgeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Feature Rows */}
      <div className="space-y-2">
        {features.map((feat) => {
          const def = FEATURES_REGISTRY[feat.id];
          const IconComponent = def?.icon || ShieldCheck;

          return (
            <div
              key={feat.id}
              className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
                  <IconComponent size={15} />
                </div>
                
                <div className="flex flex-col gap-0.5 min-w-0 text-right">
                  <span className="text-xs sm:text-sm font-sans font-bold text-white tracking-tight">
                    {feat.summary}
                  </span>
                  {feat.details && (
                    <span className="text-[11px] sm:text-xs text-zinc-400 font-sans font-normal leading-relaxed">
                      {feat.details}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
