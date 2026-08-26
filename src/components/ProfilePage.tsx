import React, { useState } from 'react';
import { 
  User as UserIcon, 
  CreditCard, 
  Activity, 
  Key, 
  Database, 
  LogOut, 
  Copy, 
  Check, 
  RefreshCw, 
  Mail, 
  Calendar, 
  Fingerprint,
  Trash2
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface ProfilePageProps {
  currentPlanId: string;
  totalTokens: number;
  user: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onNavigateToPricing: () => void;
  onNavigateToLimits: () => void;
  onNavigateToChat: () => void;
  onClearChatHistory: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentPlanId = 'free-0',
  totalTokens = 0,
  user,
  onGoogleSignIn,
  onSignOut,
  onNavigateToPricing,
  onNavigateToLimits,
  onClearChatHistory,
}) => {
  const isFree = currentPlanId === 'free-0';
  const isElite = currentPlanId === 'elite-99';

  const planName = isFree ? 'الاشتراك المجاني (Free)' : isElite ? 'باقة النخبة (Elite)' : 'باقة المحترف (Pro)';
  const planPrice = isFree ? '$0' : isElite ? '$99' : '$29';

  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey, setApiKey] = useState('x1_live_99f2b83c18e47a210d7e63b');

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = 'x1_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-[#f8fafc] overflow-y-auto smooth-scroll select-none" dir="rtl">
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* User Identity Card - Obsidian Glass Panel */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel shadow-2xl mb-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-right">
            
            <div className="size-16 sm:size-20 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-inner">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <UserIcon className="w-8 h-8 sm:w-9 sm:h-9 text-zinc-300" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {user?.user_metadata?.full_name || (user ? 'مستخدم موثق' : 'حساب زائر محلي')}
                </h1>
                
                {user ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold text-zinc-300 hover:text-rose-300 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
                  >
                    <span>تسجيل الدخول عبر Google</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{user?.email || 'محلي على هذا الجهاز'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>عضو منذ 2026</span>
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Subscription Plan & Usage Details Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          
          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-mono text-zinc-400">خطة الاشتراك النشطة</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-zinc-950">
                  {planPrice} / شهرياً
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">{planName}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isFree 
                  ? 'تجربة مرتان فقط لـ Fathom 1 و Fathom Cam' 
                  : isElite 
                  ? 'سعة هائلة (500M توكن) وفحوصات واستخبارات غير محدودة' 
                  : '100M توكن شهرياً و 500 فحص سيبراني و 1000 ملف بصري'}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToPricing}
                className="text-xs font-bold text-white hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>إدارة وتغيير الباقة</span>
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-mono text-zinc-400">إجمالي التوكن المستهلك</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.08] text-zinc-300">
                  مباشر
                </span>
              </div>
              <h3 className="text-xl font-extrabold font-mono text-white mb-1">
                {totalTokens.toLocaleString()} <span className="text-xs font-sans text-zinc-400 font-normal">توكن</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">مجموع التوكن الفعلي المعالج عبر كافة المحركات.</p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToLimits}
                className="text-xs font-bold text-zinc-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>متابعة تفاصيل الاستهلاك</span>
              </button>
            </div>
          </div>

        </div>

        {/* Developer API Key Section */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">مفتاح المطور (Developer API Key)</h3>
                <p className="text-[11px] text-zinc-400">للاستخدام البرمجي في الـ Agents الخارجية</p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-black/50 border border-white/[0.1] rounded-2xl px-3.5 py-2 font-mono text-xs text-zinc-300 flex items-center justify-between overflow-hidden">
              <span className="truncate">{apiKey}</span>
              <span className="text-[10px] text-zinc-500 shrink-0 mr-2 font-bold">LIVE</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'تم النسخ' : 'نسخ المفتاح'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerateKey}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="توليد مفتاح جديد"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Biometrics & Privacy Security Section */}
        <div className="p-5 sm:p-6 rounded-3xl glass-card mb-5">
          <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-zinc-400" />
            <span>الأمان والمصادقة البيومترية</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div>
                <div className="font-bold text-white mb-0.5">مفتاح المرور البيومتري (Passkey)</div>
                <div className="text-zinc-400 text-[11px]">لحماية وضع NSFW Off عبر Face ID أو بصمة الإصبع.</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/20 shrink-0">
                مفعل وآمن
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div>
                <div className="font-bold text-white mb-0.5">المزامنة السحابية عبر Supabase</div>
                <div className="text-zinc-400 text-[11px]">حفظ وتشفير المحادثات سحابياً عبر الأجهزة.</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] text-zinc-300 font-mono font-bold text-[10px] border border-white/10 shrink-0">
                {user ? 'سحابي متصل' : 'محلي (Guest)'}
              </span>
            </div>
          </div>
        </div>

        {/* Local Data Clear Card */}
        <div className="p-5 rounded-3xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3.5">
          <div className="text-right">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-400" />
              <span>إدارة بيانات الجلسة المحلية</span>
            </h4>
            <p className="text-[11px] text-zinc-400">مسح المحادثات والملفات المؤقتة المخزنة محلياً.</p>
          </div>

          <button
            type="button"
            onClick={onClearChatHistory}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح الذاكرة المحلية</span>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-4 px-6 text-center text-xs text-zinc-500 font-mono pb-safe">
        <span>Matany.one • User Profile & Identity Engine</span>
      </footer>

    </div>
  );
};
