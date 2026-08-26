import React from 'react';

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4 text-zinc-300 shrink-0" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export const MinusIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4 text-zinc-600 shrink-0" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  frequency: string;
  description: string;
  features: string[];
  disabledFeatures?: string[];
  buttonText: string;
  buttonLink?: string;
  isFeatured?: boolean;
  badge?: string;
  onSelect?: () => void;
}

export interface PricingTierProps extends PricingPlan {
  currentPlanId?: string;
}

export const PricingTier: React.FC<PricingTierProps> = ({
  id,
  name,
  price,
  frequency,
  description,
  features,
  disabledFeatures = [],
  buttonText,
  buttonLink,
  isFeatured = false,
  badge,
  onSelect,
  currentPlanId,
}) => {
  const isCurrentPlan = currentPlanId === id;

  const cardClasses = isFeatured
    ? "relative glass-card-featured text-white rounded-3xl p-6 sm:p-7 flex flex-col w-full"
    : "relative glass-card text-zinc-200 rounded-3xl p-6 sm:p-7 flex flex-col w-full";

  const buttonClasses = isCurrentPlan
    ? "w-full px-5 py-3 mt-8 text-xs font-semibold rounded-2xl bg-white/[0.04] text-zinc-400 border border-white/[0.08] cursor-default opacity-80"
    : isFeatured
    ? "w-full px-5 py-3 mt-8 text-xs font-bold rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
    : "w-full px-5 py-3 mt-8 text-xs font-bold rounded-2xl bg-white/[0.08] text-white border border-white/15 hover:bg-white/[0.14] hover:border-white/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5";

  return (
    <div className={cardClasses}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white text-zinc-950 shadow-sm border border-white/30">
            {badge}
          </span>
        </div>
      )}

      <div className="text-center pt-2">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">{name}</h3>
        <div className="flex items-baseline justify-center mt-3">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">{price}</span>
          <span className="mr-1.5 text-xs text-zinc-400 font-sans">{frequency}</span>
        </div>
        <p className="mt-2.5 text-center text-xs text-zinc-400 leading-relaxed min-h-[38px]">{description}</p>
      </div>

      <div className="my-5 border-t border-white/[0.08]" />

      <div className="flex-1">
        <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3 text-right">
          المزايا وحدود الاستهلاك:
        </div>
        
        <ul className="space-y-2.5 text-right">
          {features.map((feature, index) => (
            <li key={`active-${index}`} className="flex items-start gap-2.5 text-xs text-zinc-200 leading-snug">
              <CheckIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isFeatured ? 'text-white' : 'text-zinc-300'}`} />
              <span>{feature}</span>
            </li>
          ))}

          {disabledFeatures.map((disabled, index) => (
            <li key={`disabled-${index}`} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-snug">
              <MinusIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-600" />
              <span className="line-through decoration-zinc-700">{disabled}</span>
            </li>
          ))}
        </ul>
      </div>

      {buttonLink ? (
        <a href={buttonLink} className={`text-center ${buttonClasses}`}>
          {isCurrentPlan ? 'الخطة الحالية المشترك بها' : buttonText}
        </a>
      ) : (
        <button
          type="button"
          disabled={isCurrentPlan}
          onClick={onSelect}
          className={buttonClasses}
        >
          {isCurrentPlan ? 'الخطة الحالية المشترك بها' : buttonText}
        </button>
      )}
    </div>
  );
};

export interface PricingSectionData {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
}

export interface PricingSectionProps {
  data: PricingSectionData;
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  data,
  currentPlanId,
  onSelectPlan,
}) => {
  return (
    <div className="pricing-section w-full py-2 max-w-6xl mx-auto" dir="rtl">
      <div className="pricing-header text-center mb-8 sm:mb-10">
        <h2 className="pricing-title text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 sm:mb-3">
          {data.title}
        </h2>
        <p className="pricing-subtitle text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {data.subtitle}
        </p>
      </div>

      <div className="pricing-tiers grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {data.plans.map((plan) => (
          <PricingTier
            key={plan.id}
            {...plan}
            currentPlanId={currentPlanId}
            onSelect={() => onSelectPlan?.(plan.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PricingSection;
