import React, { useState } from 'react';
import { PricingSection, PricingPlan } from './ui/pricing-tiers';
import { SubscriptionModal } from './SubscriptionModal';
import { Shield, Activity, Check, HelpCircle, Zap, Cpu, Gauge, Layers, ArrowRight, User as UserIcon, MessageSquare } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface PricingPageProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
  onNavigateToLimits: () => void;
  onNavigateToProfile: () => void;
  onNavigateToChat: () => void;
  user: User | null;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  currentPlanId = 'free-0',
  onSelectPlan,
  onNavigateToLimits,
  onNavigateToProfile,
  onNavigateToChat,
  user,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetPlan, setModalTargetPlan] = useState<'pro-29' | 'elite-99'>('pro-29');

  const handlePlanClick = (planId: string) => {
    if (planId === 'free-0') {
      onSelectPlan('free-0');
    } else if (planId === 'pro-29' || planId === 'elite-99') {
      setModalTargetPlan(planId);
      setIsModalOpen(true);
    }
  };

  const handleActivationSuccess = (planId: 'pro-29' | 'elite-99') => {
    onSelectPlan(planId);
  };

  const plans: PricingPlan[] = [
    {
      id: 'free-0',
      name: 'الاشتراك المجاني (Free)',
      price: '$0',
      frequency: '/ شهرياً',
      description: 'خطة استكشافية محدودة لمعاينة سرعة واستجابة النماذج.',
      features: [
        'تجربة نموذج Fathom 1.1 (مرتان فقط إجمالاً)',
        'تجربة إدراك Fathom Cam البصري (صورتان فقط إجمالاً)',
      ],
      disabledFeatures: [
        'فحوصات Fathom Cyber (2.0 / 2.6) والاستدلال غير مفعلة (0 فحص)',
        'لا توجد ذاكرة سحابية أو حفظ دائم',
        'وضع المحادثة الحرة NSFW Off غير متاح',
      ],
      buttonText: 'الخطة المجانية ($0)',
      isFeatured: false,
    },
    {
      id: 'pro-29',
      name: 'باقة المحترف (Pro)',
      price: billingCycle === 'monthly' ? '$29' : '$23',
      frequency: billingCycle === 'monthly' ? '/ شهرياً' : '/ شهرياً (سنوي)',
      description: 'للاستخدام اليومي الكثيف وحصص استهلاك وافرة لكافة النماذج.',
      features: [
        '100,000,000 توكن شهرياً (100M Tokens)',
        'وصول كامل لمحركات Fathom 1.1 و Cam و Cyber 1.1',
        'تفعيل وضع المحادثة الحرة (NSFW Off) بالبصمة',
        '500 عملية فحص أمني واستخباراتي عميق شهرياً',
        '1,000 تحليل فائق للصور والمستندات شهرياً',
        'ذاكرة سحابية متزامنة تسع 50 محادثة',
      ],
      buttonText: 'تفعيل باقة المحترف ($29)',
      isFeatured: false,
    },
    {
      id: 'elite-99',
      name: 'باقة النخبة (Elite)',
      price: billingCycle === 'monthly' ? '$99' : '$79',
      frequency: billingCycle === 'monthly' ? '/ شهرياً' : '/ شهرياً (سنوي)',
      description: 'للمحترفين والعمليات الاستخباراتية والاستهلاك الفائق المفتوح.',
      features: [
        '500,000,000 توكن شهرياً (500M Tokens - سعة هائلة)',
        'وصول كامل لمحركات Fathom 1.1 و Cam و Cyber 1.1',
        'تفعيل وضع المحادثة الحرة (NSFW Off) بالبصمة',
        'فحص سيبراني واستخباراتي غير محدود (Uncapped Recon)',
        'تحليل صور ومستندات غير محدود بدقة 4K',
        'ذاكرة سحابية ومزامنة فورية غير محدودة',
        'أولوية خوادم مخصصة VIP',
      ],
      buttonText: 'تفعيل باقة النخبة ($99)',
      isFeatured: true,
      badge: 'الأعلى سعة وأداء',
    },
  ];

  const pricingData = {
    title: 'خطط اشتراك واضحة وشفافة',
    subtitle: 'نفس الذكاء والأدوات في باقات المحترف والنخبة؛ الفارق الجوهري يكمن في سعة وحصص الاستهلاك.',
    plans,
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-[#f8fafc] overflow-y-auto smooth-scroll select-none" dir="rtl">
      
      {/* Activation Code Modal */}
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
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>الحساب</span>
            </button>
          </div>
        </div>

        {/* Billing Toggle (Monthly / Annual) - Glassmorphism Pill */}
        <div className="flex justify-center mb-6">
          <div className="glass-panel p-1 rounded-2xl flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              دفع شهري
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>دفع سنوي</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800/80 text-zinc-200 border border-white/10 font-mono">
                خصم 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <PricingSection
          data={pricingData}
          currentPlanId={currentPlanId}
          onSelectPlan={handlePlanClick}
        />

        {/* Comparison Table Section - Prominent Frosted Glass */}
        <div className="mt-10 sm:mt-14 border-t border-white/[0.08] pt-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
              جدول مقارنة حدود الاستهلاك (Quota Matrix)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              مقارنة دقيقة توضح الفارق في سعة الاستهلاك والحصص الممنوحة لكل خطة.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl glass-panel shadow-2xl smooth-scroll">
            <table className="w-full text-right text-xs sm:text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="p-4 sm:p-5 font-bold text-white">الخاصية والقدرة</th>
                  <th className="p-4 sm:p-5 font-semibold text-zinc-400 text-center w-1/4">المجاني ($0)</th>
                  <th className="p-4 sm:p-5 font-bold text-zinc-200 text-center w-1/4">المحترف ($29)</th>
                  <th className="p-4 sm:p-5 font-bold text-white text-center w-1/4 bg-white/[0.03]">النخبة ($99)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300 font-sans">
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>رصيد التوكن الشهري (Tokens)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center font-mono text-zinc-500">مرتان فقط</td>
                  <td className="p-4 sm:p-5 text-center font-mono font-bold text-white">100M توكن</td>
                  <td className="p-4 sm:p-5 text-center font-mono font-bold text-white bg-white/[0.03]">500M توكن</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>فحوصات Fathom Cyber (2.0 / 2.6)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-zinc-500">غير مفعل</td>
                  <td className="p-4 sm:p-5 text-center font-mono text-zinc-300">500 فحص / شهر</td>
                  <td className="p-4 sm:p-5 text-center font-mono font-bold text-white bg-white/[0.03]">غير محدود (Uncapped)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>تحليل الصور والمستندات (Vision)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-zinc-500">صورتان فقط</td>
                  <td className="p-4 sm:p-5 text-center font-mono text-zinc-300">1,000 ملف / شهر</td>
                  <td className="p-4 sm:p-5 text-center font-mono font-bold text-white bg-white/[0.03]">غير محدود بدقة 4K</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>وضع المحادثة الحرة (NSFW Off)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-zinc-500">غير متاح</td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center gap-1 text-zinc-200 font-semibold"><Check className="w-4 h-4 text-emerald-400" /> متاح بالبصمة</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-white/[0.03]">
                    <span className="inline-flex items-center gap-1 text-white font-semibold"><Check className="w-4 h-4 text-emerald-400" /> متاح بالبصمة</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>أولوية المعالجة وقنوات الخوادم</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-zinc-500">طابور قياسي</td>
                  <td className="p-4 sm:p-5 text-center text-zinc-300">سرعة فائقة</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-white bg-white/[0.03]">VIP Dedicated Compute</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>سعة الذاكرة السحابية المتزامنة</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-zinc-500">0 (غير متزامنة)</td>
                  <td className="p-4 sm:p-5 text-center font-mono text-zinc-300">50 محادثة</td>
                  <td className="p-4 sm:p-5 text-center font-mono font-bold text-white bg-white/[0.03]">غير محدودة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Link to Chat / Activation - Frosted Glass Banner */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl glass-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-right w-full sm:w-auto">
            <div className="size-10 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">جاهز للبدء في استخدام النماذج؟</h4>
              <p className="text-xs text-zinc-400">انطلق في محادثاتك واستفد من أحدث محركات الذكاء الاصطناعي.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNavigateToChat}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer shadow-md text-center font-sans"
            >
              دخول الشات الآن
            </button>
          </div>
        </div>

        {/* FAQs Section - Sleek Glass Cards */}
        <div className="mt-10 border-t border-white/[0.08] pt-8 pb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-1">الأسئلة الشائعة</h3>
            <p className="text-xs text-zinc-400">إجابات موجزة عن الخطط والتجديد.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-4xl mx-auto">
            <div className="p-4 sm:p-5 rounded-2xl glass-card">
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>ماذا تتيح الخطة المجانية؟</span>
              </h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                تجربتان فقط لنموذج Fathom 1.1 وتجربتان لتحليل الصور لمعاينة سرعة الاستجابة فقط دون سعة تخزين أو وضع حر.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl glass-card">
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>هل باقة 29$ تفتقد لأي قدرة أو وضع حر؟</span>
              </h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                لا؛ باقة 29$ وباقة 99$ تشتملان على كافة المحركات ووضع NSFW Off بالبصمة، والفارق الوحيد في سعة الاستهلاك.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl glass-card">
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>متى يتم تجديد رصيد الاستهلاك؟</span>
              </h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                يتم تجديد كامل الحصص تلقائياً كل 30 يوماً من تاريخ بدء الاشتراك مع عداد تنازلي في صفحة الاستهلاك.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl glass-card">
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>كيف يتم تفعيل الاشتراك المدفوع؟</span>
              </h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                عبر إدخال كود التفعيل الخاص بك في النافذة المشفرة المحمية بنظام مكافحة التخمين (Rate Limiting).
              </p>
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
        <span>Matany.one • Subscription Engine</span>
      </footer>

    </div>
  );
};
