import React from 'react';
import { FileText, ArrowRight, ShieldCheck, Cpu, Scale, AlertCircle, Shield, MessageSquare } from 'lucide-react';

interface TermsOfServicePageProps {
  onNavigateToChat: () => void;
  onNavigateToPrivacy: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({
  onNavigateToChat,
  onNavigateToPrivacy,
}) => {
  return (
    <div className="h-full flex flex-col bg-transparent text-[#f8fafc] overflow-y-auto smooth-scroll select-text" dir="rtl">
      
      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
        
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

          <button
            type="button"
            onClick={onNavigateToPrivacy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>سياسة الخصوصية</span>
          </button>
        </div>

        {/* Header Title Card */}
        <div className="p-5 sm:p-8 rounded-3xl glass-panel shadow-2xl mb-6 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-zinc-300 mb-3">
            <FileText className="w-3.5 h-3.5 text-zinc-300" />
            <span>شروط الاستخدام والخدمة • Terms of Service</span>
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            شروط الاستخدام لمنظومة matany.one
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            سارية المفعول اعتباراً من 26 أغسطس 2026 • المطور والمالك: المهندس محمد أحمد مطعني (MatanyLabs)
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4 sm:space-y-6 text-sm text-zinc-300 leading-relaxed text-right font-sans">
          
          {/* Section 1 */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-center gap-2">
              <Scale className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>1. قبول الشروط والأهلية</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-2 leading-relaxed">
              باستخدامك لمنصة <strong className="text-white">matany.one</strong> أو أي من خدماتها ونماذجها الذكية (Fathom 1.1, Fathom Cam, Fathom Cyber 2.0, Fathom Cyber 2.1)، فإنك توافق على الالتزام بهذه الشروط وسياسة الخصوصية.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              الخدمة موجهة للمستخدمين الذين يبلغون من العمر 18 عاماً فأكثر. وتتطلب بعض الأوضاع المتقدمة (مثل وضع المحادثة الحرة NSFW Off) مصادقة بيومترية اختيارية وموافقة صريحة.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>2. طبيعة الخدمات ومخرجات الذكاء الاصطناعي</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2.5">
              منظومة matany.one توفر نماذج ذكاء اصطناعي لغوية وبصرية واستخباراتية متقدمة لأغراض البحث، والبرمجة، والتحليل الفلسفي والتقني، والإبداع الأدبي.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              تعتبر المخرجات المولدة أدوات مساعدة استرشادية، ويتحمل المستخدم المسؤولية الكاملة عن كيفية تطبيقها أو الاعتماد عليها في سياقات العمل والقرارات الحساسة.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>3. الاستخدام المقبول وحصص الاستهلاك (Quotas)</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2">
              يلتزم المستخدم بعدم استخدام المنظومة في أي أنشطة تنتهك القوانين المعمول بها، أو محاولات الاختراق غير المصرح بها للأنظمة الخارجية، أو إلحاق الضرر بالبنية التحتية للخوادم.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              يتم تنظيم الاستهلاك عبر خطط اشتراك واضحة تشمل حصص التوكن والفحوصات السيبرانية لحماية موارد الحوسبة وتوفير سرعة متكافئة لجميع المستخدمين.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>4. الملكية الفكرية والحقوق</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2">
              كافة الخوارزميات، والمعمارية التقنية، والتصميمات، والهوية البصرية لمنصة <strong className="text-white">matany.one</strong> ومحركات Fathom هي ملكية فكرية حصرية للمهندس <strong className="text-white">محمد أحمد مطعني</strong> وشركة <strong className="text-white">MatanyLabs</strong>.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              يمتلك المستخدم الحقوق الكاملة في المحتوى والنصوص والمخرجات التي يقوم بتوليدها واستخراجها عبر المنصة لاستخداماته الشخصية أو التجارية.
            </p>
          </div>

        </div>

        {/* Footer Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onNavigateToChat}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <ArrowRight className="w-4 h-4 text-zinc-950" />
            <span>العودة إلى الشات</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPrivacy}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            الانتقال إلى سياسة الخصوصية (Privacy Policy)
          </button>
        </div>

      </main>

      {/* Page Footer */}
      <footer className="border-t border-white/[0.08] py-4 px-6 text-center text-xs text-zinc-500 font-mono pb-safe">
        <span>Matany.one • Legal & Terms of Service • 2026</span>
      </footer>

    </div>
  );
};
