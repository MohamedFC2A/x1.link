import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Shield, 
  Camera, 
  Database, 
  Clock, 
  AlertCircle,
  ArrowRight,
  CreditCard,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getLocalUsage, fetchRemoteUsage, UsageLedger } from '../services/usageTracker';
import { SubscriptionModal } from './SubscriptionModal';

interface LimitsPageProps {
  currentPlanId: string;
  totalTokensUsed: number;
  onNavigateToPricing: () => void;
  onNavigateToProfile: () => void;
  onNavigateToChat: () => void;
  onSelectPlan?: (planId: string) => void;
  user: User | null;
}

export const LimitsPage: React.FC<LimitsPageProps> = ({
  currentPlanId = 'free-0',
  totalTokensUsed = 0,
  onNavigateToPricing,
  onNavigateToProfile,
  onNavigateToChat,
  onSelectPlan,
  user,
}) => {
  const [usage, setUsage] = useState<UsageLedger>(getLocalUsage());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetPlan, setModalTargetPlan] = useState<'pro-29' | 'elite-99'>('pro-29');

  useEffect(() => {
    setUsage(getLocalUsage());
    if (user?.id) {
      fetchRemoteUsage(user.id).then((remote) => {
        if (remote) setUsage(remote);
      });
    }
  }, [user]);

  const isFree = currentPlanId === 'free-0';
  const isElite = currentPlanId === 'elite-99';

  const planName = isFree ? 'الاشتراك المجاني (Free)' : isElite ? 'باقة النخبة (Elite)' : 'باقة المحترف (Pro)';
  const planPrice = isFree ? '$0' : isElite ? '$99' : '$29';
  
  const tokenLimit = isFree ? 20_000 : isElite ? 500_000_000 : 100_000_000;
  const cyberScansLimit = isFree ? 0 : isElite ? 999_999 : 500;
  const visionFilesLimit = isFree ? 2 : isElite ? 999_999 : 1_000;

  // Real tokens calculation
  const effectiveTokensUsed = Math.max(usage.totalTokens, totalTokensUsed);
  const tokenPercent = isFree 
    ? Math.min(Math.round((usage.fathom1TrialsCount / 2) * 100), 100)
    : Math.min(Math.round((effectiveTokensUsed / tokenLimit) * 100), 100);

  const cyberPercent = isFree ? 0 : isElite ? 0 : Math.min(Math.round((usage.cyberScansCount / cyberScansLimit) * 100), 100);
  const visionPercent = isFree 
    ? Math.min(Math.round((usage.fathomCamTrialsCount / 2) * 100), 100)
    : isElite ? 0 : Math.min(Math.round((usage.visionFilesCount / visionFilesLimit) * 100), 100);

  const handleUpgradeClick = (target: 'pro-29' | 'elite-99') => {
    setModalTargetPlan(target);
    setIsModalOpen(true);
  };

  const handleActivationSuccess = (planId: 'pro-29' | 'elite-99') => {
    onSelectPlan?.(planId);
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-[#f8fafc] overflow-y-auto smooth-scroll select-none" dir="rtl">
      
      {/* Activation Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetPlanId={modalTargetPlan}
        onSuccess={handleActivationSuccess}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-5 p-3 rounded-2xl glass-panel">
          <button
            type="button"
            onClick={onNavigateToChat}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs shadow-md hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer font-sans"
            title="الرجوع إلى نافذة المحادثة"
          >
            <ArrowRight className="w-4 h-4 text-zinc-950" />
            <span>الرجوع للشات</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToPricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الاشتراكات</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الحساب</span>
            </button>
          </div>
        </div>

        {/* Top Header Card - Ultra-Glassmorphism */}
        <div className="p-5 sm:p-7 rounded-3xl glass-panel shadow-2xl mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                تتبع الاستهلاك والليميت
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                أنت حالياً على <strong className="text-white font-bold">{planName} ({planPrice}/شهرياً)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
              {isFree ? (
                <button
                  type="button"
                  onClick={() => handleUpgradeClick('pro-29')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Zap className="w-4 h-4 text-zinc-950" />
                  <span>الترقية لباقة المحترف ($29)</span>
                </button>
              ) : !isElite ? (
                <button
                  type="button"
                  onClick={() => handleUpgradeClick('elite-99')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Zap className="w-4 h-4 text-zinc-950" />
                  <span>ترقية لباقة النخبة ($99)</span>
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-mono text-white text-center w-full sm:w-auto">
                  باقة النخبة النشطة (سعة مفتوحة)
                </div>
              )}
            </div>
          </div>

          {/* Free Tier Notice */}
          {isFree && (
            <div className="mt-4 p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-2.5 text-xs text-zinc-300">
              <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>الخطة المجانية تتيح تجربتين لـ Fathom 1.1 وتجربتين لـ Fathom Cam. قم بالترقية للحصول على 100M+ توكن.</span>
            </div>
          )}

          {/* Renewal Indicator */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>تجديد الحصة: <strong className="text-zinc-200">{isFree ? 'حصة تجريبية محدودة' : 'بعد 18 يوماً (15 سبتمبر)'}</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Quota Metric Cards in Sleek Frosted Glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6">
          
          {/* Card 1: Token Quota */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">رصيد التوكن الشهري</h3>
                    <p className="text-[11px] text-zinc-400">المدخلات والمخرجات والتفكير</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/10">
                  {isFree ? `${usage.fathom1TrialsCount} من 2 تجارب` : `${tokenPercent}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.08] my-3">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                  style={{ width: `${tokenPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-2">
                <span>المستهلك: <strong className="text-white">{isFree ? `${usage.fathom1TrialsCount} تجربة` : effectiveTokensUsed.toLocaleString()}</strong></span>
                <span>الحد الأقصى: <strong className="text-zinc-200">{isFree ? '2 تجارب فقط' : tokenLimit.toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
              <span>المتبقي: <strong className="text-zinc-200 font-mono">{isFree ? `${Math.max(0, 2 - usage.fathom1TrialsCount)} تجربة متبقية` : `${Math.max(0, tokenLimit - effectiveTokensUsed).toLocaleString()} توكن`}</strong></span>
              <span className="text-zinc-500">{isFree ? 'خطة مجانية' : 'يتجدد شهرياً'}</span>
            </div>
          </div>

          {/* Card 2: Cyber Recon & URL Scans */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">فحوصات Fathom Cyber (2.0 / 2.1)</h3>
                    <p className="text-[11px] text-zinc-400">الاستخبارات والمسح الأمني</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/10">
                  {isFree ? 'غير مفعل' : isElite ? 'غير محدود' : `${cyberPercent}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.08] my-3">
                <div 
                  className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                  style={{ width: `${cyberPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-2">
                <span>المستهلك: <strong className="text-white">{usage.cyberScansCount} فحص</strong></span>
                <span>الحد الأقصى: <strong className="text-zinc-200">{isFree ? '0 (غير متاح)' : isElite ? 'غير محدود' : '500 فحص'}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
              <span>المتبقي: <strong className="text-zinc-200 font-mono">{isFree ? 'يتطلب باقة المحترف' : isElite ? 'سعة مفتوحة' : `${Math.max(0, cyberScansLimit - usage.cyberScansCount)} فحص`}</strong></span>
              <span className="text-zinc-500">مسح أمني عميق</span>
            </div>
          </div>

          {/* Card 3: Vision Extraction */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300 shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">إدراك Fathom Cam البصري</h3>
                    <p className="text-[11px] text-zinc-400">تحليل الصور والمستندات</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/10">
                  {isFree ? `${usage.fathomCamTrialsCount} من 2 صور` : isElite ? 'غير محدود' : `${visionPercent}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.08] my-3">
                <div 
                  className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                  style={{ width: `${visionPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-2">
                <span>المستهلك: <strong className="text-white">{isFree ? `${usage.fathomCamTrialsCount} صورة` : `${usage.visionFilesCount} ملف`}</strong></span>
                <span>الحد الأقصى: <strong className="text-zinc-200">{isFree ? 'صورتان فقط' : isElite ? 'غير محدود 4K' : '1,000 ملف'}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
              <span>المتبقي: <strong className="text-zinc-200 font-mono">{isFree ? `${Math.max(0, 2 - usage.fathomCamTrialsCount)} صورة متبقية` : isElite ? 'سعة مفتوحة' : `${Math.max(0, visionFilesLimit - usage.visionFilesCount)} ملف`}</strong></span>
              <span className="text-zinc-500">استخراج نصوص دقيق</span>
            </div>
          </div>

          {/* Card 4: Cloud Memory Slots */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">الذاكرة السحابية المتزامنة</h3>
                    <p className="text-[11px] text-zinc-400">المحادثات المحفوظة سحابياً</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/10">
                  {isFree ? 'غير متاح' : isElite ? 'غير محدود' : 'نشطة'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-white/[0.08] my-3">
                <div 
                  className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                  style={{ width: isFree ? '0%' : isElite ? '100%' : '30%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-2">
                <span>المستخدم: <strong className="text-white">{isFree ? '0' : 'مزامنة فورية'}</strong></span>
                <span>الحد الأقصى: <strong className="text-zinc-200">{isFree ? '0' : isElite ? 'غير محدود' : '50 محادثة'}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
              <span>المتبقي: <strong className="text-zinc-200 font-mono">{isFree ? 'يتطلب باقة المحترف' : 'سعة سحابية نشطة'}</strong></span>
              <span className="text-zinc-500">حفظ سحابي</span>
            </div>
          </div>

        </div>

        {/* Real Token Distribution by Model - Obsidian Glass Card */}
        <div className="p-5 sm:p-7 rounded-3xl glass-card mb-6">
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">
            توزيع استهلاك التوكن الفعلي حسب النماذج الذكية
          </h3>
          <p className="text-xs text-zinc-400 mb-5">
            رصد دقيق لكمية التوكن المعالجة لكل محرك ذكاء.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-sans text-zinc-300 mb-1.5">
                <span className="font-semibold">Fathom 1.1 (المحرك اللغوي الفصيح والتفكير)</span>
                <span className="font-mono text-white">{usage.fathom1Tokens.toLocaleString()} توكن</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div 
                  className="bg-white h-full rounded-full" 
                  style={{ width: `${effectiveTokensUsed > 0 ? Math.min(100, Math.round((usage.fathom1Tokens / effectiveTokensUsed) * 100)) : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-sans text-zinc-300 mb-1.5">
                <span className="font-semibold">Fathom Cam (الإدراك البصري وتحليل المستندات)</span>
                <span className="font-mono text-zinc-300">{usage.fathomCamTokens.toLocaleString()} توكن</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div 
                  className="bg-zinc-400 h-full rounded-full" 
                  style={{ width: `${effectiveTokensUsed > 0 ? Math.min(100, Math.round((usage.fathomCamTokens / effectiveTokensUsed) * 100)) : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-sans text-zinc-300 mb-1.5">
                <span className="font-semibold">Fathom Cyber (2.0 / 2.1) (الاستخبارات والذاكرة والاستدلال)</span>
                <span className="font-mono text-zinc-400">{usage.fathomCyberTokens.toLocaleString()} توكن</span>
              </div>
              <div className="w-full bg-zinc-950/80 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div 
                  className="bg-zinc-600 h-full rounded-full" 
                  style={{ width: `${effectiveTokensUsed > 0 ? Math.min(100, Math.round((usage.fathomCyberTokens / effectiveTokensUsed) * 100)) : 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Return CTA */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex justify-center">
          <button
            type="button"
            onClick={onNavigateToChat}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-lg font-sans"
          >
            <ArrowRight className="w-4 h-4 text-zinc-950" />
            <span>الرجوع إلى الشات الآن</span>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-4 px-6 text-center text-xs text-zinc-500 font-mono pb-safe">
        <span>Matany.one • Real-Time Telemetry & Quota Engine</span>
      </footer>

    </div>
  );
};
