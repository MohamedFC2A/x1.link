import React from 'react';
import { Sparkles, ShieldOff, Eye, Camera, ShieldCheck, ArrowLeft, MessageSquarePlus, Zap, Lock, MessageSquare, CreditCard, Activity, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStartChat: () => void;
  onSelectPreset: (presetText: string) => void;
  onOpenArchitecture: () => void;
  onOpenSidebar: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToLimits?: () => void;
  onNavigateToProfile?: () => void;
  user: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onSelectPreset,
  onOpenArchitecture,
  onOpenSidebar,
  onNavigateToPricing,
  onNavigateToLimits,
  onNavigateToProfile,
  user,
}) => {
  return (
    <div className="min-h-full flex flex-col justify-between bg-[#000000] text-[#f8fafc] overflow-y-auto smooth-scroll selection:bg-zinc-700 selection:text-white" dir="rtl">
      
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-[#000000]/95 border-b border-white/[0.08] px-4 sm:px-8 py-3 backdrop-blur-xl pt-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Right Actions (Start in RTL) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="glass-button flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 shadow-sm"
              title="سجل المحادثات"
            >
              <MessageSquare className="w-4 h-4 text-zinc-300" />
              <span className="hidden sm:inline font-sans">سجل المحادثات</span>
            </button>

            {onNavigateToPricing && (
              <button
                type="button"
                onClick={onNavigateToPricing}
                className="glass-button flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 shadow-sm"
                title="الخطط والترقية"
              >
                <CreditCard className="w-4 h-4 text-zinc-300" />
                <span className="hidden sm:inline font-sans">الخطط والترقية</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartChat}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md font-sans"
            >
              <MessageSquarePlus className="w-4 h-4 text-zinc-950" />
              <span>بدء المحادثة</span>
            </button>
          </div>

          {/* Left (End in RTL) / Pure Typographic Luxury Brand Wordmark */}
          <div className="flex items-center cursor-pointer group shrink-0 select-none py-1" dir="ltr" onClick={onStartChat}>
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="font-['Space_Grotesk'] font-black text-xl sm:text-2xl tracking-tight brand-shimmer-text">
                matany
              </span>
              <span className="font-['Space_Grotesk'] font-bold text-xs sm:text-sm text-zinc-400 font-mono tracking-tight group-hover:text-zinc-200 transition-colors">
                .one
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Reception Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 text-center animate-in fade-in duration-300 w-full">
        
        {/* Subtle Category Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-300 text-xs font-mono mb-4 sm:mb-6 select-none shadow-sm">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>منظومة الذكاء الاصطناعي والاستدلال السيادي</span>
        </div>

        {/* Large Hero Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 leading-[1.25] sm:leading-[1.15] font-sans px-2">
          أفق جديد للاستدلال والبحث <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            والعمل التقني المتقدم
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base lg:text-lg text-zinc-400 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed font-sans font-normal px-2">
          منظومة متكاملة تجمع بين الاستدلال التحليلي العميق، المعالجة اللغوية البليغة، الفحص البصري الدقيق، والاستوديو الإبداعي، مع ذاكرة سحابية معرفية واستجابة فائقة السرعة.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10 w-full max-w-xs sm:max-w-none px-2">
          <button
            type="button"
            onClick={onStartChat}
            className="w-full sm:w-auto group flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm sm:text-base transition-all active:scale-95 cursor-pointer font-sans shadow-md"
          >
            <MessageSquarePlus className="w-5 h-5 text-zinc-950 group-hover:scale-105 transition-transform" />
            <span>بدء المحادثة الآن</span>
          </button>

          {onNavigateToPricing && (
            <button
              type="button"
              onClick={onNavigateToPricing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-zinc-900 border border-white/15 hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base transition-all active:scale-95 cursor-pointer font-sans shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-zinc-300" />
              <span>خطط الاشتراك والترقية</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenArchitecture}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-200 hover:text-white font-semibold text-sm sm:text-base transition-all active:scale-95 cursor-pointer font-sans shadow-sm"
          >
            <Zap className="w-4 h-4 text-zinc-300" />
            <span>المعمارية المؤسسية والعتاد</span>
          </button>
        </div>

        {/* Responsive Interactive Feature Cards Grid */}
        <div className="w-full mt-2 sm:mt-4">
          <div className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4 font-semibold text-center select-none">
            نماذج ومسارات المنظومة
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
            
            {/* Card 1: Fathom Quant 3 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => onSelectPreset('قدم لي تحليلاً معمارياً متقدماً لأحدث أنظمة الحوسبة السحابية والاستدلال الكمومي.')}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between group min-h-[190px] sm:min-h-[230px] select-none shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                  FATHOM QUANT 3
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-zinc-200 transition-colors font-sans">
                  الاستدلال والتصميم والتحكم السحابي
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">
                  استدلال تحليلي فائق، توليد ومعالجة الصور بدقة 4K، والتحكم المباشر في الخوادم والأنظمة السحابية.
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>استكشف المسار</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Card 2: Fathom Cyber 2.6 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => onSelectPreset('اطرح مسألة معمارية معقدة في تأمين تدفق البيانات وحلها بأسلوب الاستدلال المتسلسل خطوة بخطوة.')}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between group min-h-[190px] sm:min-h-[230px] select-none shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                  FATHOM CYBER 2.6
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-zinc-200 transition-colors font-sans">
                  التحليل الهندسي والأمني المعمق
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">
                  نموذج الاستدلال المتعمق للأبحاث الخوارزمية، التدقيق الأمني، وحل المسائل البرمجية والرياضية المركبة.
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>استكشف المسار</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Card 3: Fathom Cam */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => onSelectPreset('كيف يحلل مسار الرؤية المزدوج العناصر البصرية والجداول والمستندات بدقة متناهية؟')}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between group min-h-[190px] sm:min-h-[230px] select-none shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                  FATHOM CAM
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-zinc-200 transition-colors font-sans">
                  الرؤية الحاسوبية وفحص المستندات
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">
                  استيعاب وتحليل بصري مجهري للصور والمخططات وجداول البيانات مع قراءة النصوص والوثائق بدقة متناهية.
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>استكشف المسار</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Card 4: Fathom Quant 3 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => onSelectPreset('قدم لي تحليلاً فلسفياً معمقاً لأثر الذكاء الاصطناعي على تطور المعرفة الإنسانية بأسلوب بليغ.')}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between group min-h-[190px] sm:min-h-[230px] select-none shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                  FATHOM QUANT 3
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-zinc-200 transition-colors font-sans">
                  المعالجة اللغوية البليغة
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">
                  توليد نصوص فلسفية، صياغة إبداعية، وحوار فكري رصين باللغة العربية الفصحى المعاصرة.
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>استكشف المسار</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

          </div>
        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.08] py-3 sm:py-4 px-4 sm:px-6 text-center text-[10px] sm:text-xs text-zinc-500 font-mono pb-safe">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
          <span>منصة matany.one • تطوير: المهندس محمد أحمد مطعني • MatanyLabs</span>
          <div className="flex items-center gap-4">
            {onNavigateToPricing && (
              <button type="button" onClick={onNavigateToPricing} className="hover:text-zinc-300 transition-colors cursor-pointer">
                الخطط والترقية
              </button>
            )}
            {onNavigateToLimits && (
              <button type="button" onClick={onNavigateToLimits} className="hover:text-zinc-300 transition-colors cursor-pointer">
                حدود الاستخدام
              </button>
            )}
            {onNavigateToProfile && (
              <button type="button" onClick={onNavigateToProfile} className="hover:text-zinc-300 transition-colors cursor-pointer">
                الملف الشخصي
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
};
