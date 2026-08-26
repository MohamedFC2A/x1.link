import React from 'react';
import { Shield, ArrowRight, Lock, Eye, Database, Server, UserCheck } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateToChat: () => void;
  onNavigateToTerms: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigateToChat,
  onNavigateToTerms,
}) => {
  return (
    <div className="h-full flex flex-col bg-transparent text-[#f8fafc] overflow-y-auto smooth-scroll select-text" dir="rtl">
      
      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Title Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-2xl mb-8 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-zinc-300 mb-3">
            <Shield className="w-3.5 h-3.5 text-zinc-300" />
            <span>سياسة الخصوصية وحماية البيانات • Privacy Policy</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            سياسة الخصوصية لمنظومة matany.one
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            تاريخ آخر تحديث: 26 أغسطس 2026 • المطور والمالك: المهندس محمد أحمد مطعني (MatanyLabs)
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed text-right font-sans">
          
          {/* Section 1 */}
          <div className="p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>1. التزامنا بحماية الخصوصية والبيانات</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-3">
              نلتزم في منصة <strong className="text-white">matany.one</strong> التابعة لشركة <strong className="text-white">MatanyLabs</strong> بأعلى معايير الخصوصية والأمان الرقمي. تهدف هذه الوثيقة إلى توضيح كيفية جمع واستخدام وحماية المعلومات عند استخدام خدماتنا الذكية وتسجيل الدخول.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>2. البيانات التي يتم جمعها عبر تسجيل الدخول بـ Google (OAuth)</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-3">
              عند اختيارك تسجيل الدخول عبر حساب Google، نطلب فقط المعلومات الأساسية الضرورية للمصادقة:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-300 pr-2">
              <li>الاسم والبريد الإلكتروني (لتحديد هوية المستخدم ومزامنة سجل محادثاته).</li>
              <li>الصورة الرمزية للحساب (لعرضها في الملف الشخصي فقط).</li>
              <li>معرف الحساب المشفر (User ID) للربط مع قاعدة البيانات السحابية Supabase.</li>
            </ul>
            <p className="text-xs text-zinc-400 mt-3 font-mono">
              * لا نطلب ولا نصل إطلاقاً إلى كلمات المرور الخاصة بك، أو جهات الاتصال، أو ملفات Google Drive، أو أي بيانات شخصية حساسة أخرى.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>3. معالجة المحادثات والمرفقات البصرية (Fathom Cam & Vision)</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              تتم معالجة الرسائل والصور والمستندات المرفوعة لحظياً بواسطة محركات الذكاء الاصطناعي لتوليد الردود والتحليلات المطلوبة. لا نقوم ببيع أو مشاركة نصوص محادثاتك أو صورك مع أي أطراف ثالثة أو معلنين، ولا نستخدم بياناتك لتدريب نماذج عامة دون موافقتك.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>4. التخزين المشفر وإدارة البيانات</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-3">
              يتم تشفير وتخزين المحادثات سحابياً عبر بنية تحتية آمنة (Supabase RLS) لتمكينك من الوصول إلى سجلك من أي جهاز.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              يحق لك في أي وقت مسح محادثاتك أو حذف حسابك وسجلك بالكامل بضغطة زر واحدة من خلال صفحة الحساب الشخصي أو القائمة الجانبية.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 rounded-3xl glass-card">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>5. التواصل ومسؤول حماية البيانات</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              لأي استفسارات بخصوص الخصوصية وحماية البيانات، يمكنك التواصل مباشرة مع إدارة المنصة:
              <br />
              <span className="font-mono text-zinc-200">البريد الإلكتروني: support@matany.one | mohamedahmedmatany@gmail.com</span>
              <br />
              <span className="font-mono text-zinc-300">الموقع الرسمي: https://matany.one</span>
            </p>
          </div>

        </div>

        {/* Footer Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onNavigateToChat}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>العودة إلى الشات</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNavigateToTerms}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            الانتقال إلى شروط الاستخدام والخدمة (Terms of Service)
          </button>
        </div>

      </main>

      {/* Page Footer */}
      <footer className="border-t border-white/[0.08] py-4 px-6 text-center text-xs text-zinc-500 font-mono pb-safe">
        <span>Matany.one • Privacy & Security Governance • 2026</span>
      </footer>

    </div>
  );
};
