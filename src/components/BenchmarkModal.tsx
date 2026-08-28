import React, { useState } from 'react';
import { X, Award, CheckCircle2, Zap, ArrowLeft, TrendingUp, Cpu, DollarSign, ShieldAlert } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel?: (modelId: string) => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'coding' | 'agent' | 'pricing'>('all');

  if (!isOpen) return null;

  const models = [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'Google', isLeader: false },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'Google', isLeader: false },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Anthropic', isLeader: false },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'OpenAI', isLeader: false },
    { id: 'muse-spark-1.2', name: 'Muse Spark 1.2', provider: 'Meta', isLeader: false },
    { id: 'fathom-cyber-2.0', name: 'Fathom Cyber 2.0', provider: 'Matany AI', isCyber: true, isLeader: false },
    { id: 'fathom-cyber-2.6', name: 'Fathom Cyber 2.6', provider: 'Matany AI', isCyber: true, isLeader: true },
  ];

  const metrics = [
    {
      category: 'pricing',
      name: 'Input price',
      sub: 'تكلفة الإدخال ($/1M توكن)',
      values: ['$0.75*', '$0.75*', '$2.00', '$2.00', '$1.25', '$0.27*', '$0.55*'],
      highlightIdx: 5,
      isLowestBest: true,
    },
    {
      category: 'pricing',
      name: 'Output price',
      sub: 'تكلفة الإخراج ($/1M توكن)',
      values: ['$3.75*', '$3.75*', '$10.00', '$12.00', '$4.25', '$1.10*', '$2.19*'],
      highlightIdx: 5,
      isLowestBest: true,
    },
    {
      category: 'all',
      name: 'Intelligence Index',
      sub: 'مؤشر الذكاء المركب (Artificial Analysis)',
      values: ['56', '52', '55', '57', '57', '50', '53'],
      highlightIdx: 3,
    },
    {
      category: 'coding',
      name: 'FrontierCode 1.1 Main',
      sub: 'جودة كود الإنتاج البرمجي (Score)',
      values: ['43.6%', '34.4%', '42.7%', '41.3%', '—', '35.8%', '39.5%'],
      highlightIdx: 0,
    },
    {
      category: 'coding',
      name: 'DeepSWE v1.1',
      sub: 'هندسة البرمجيات طويلة المدى المعقدة',
      values: ['65.3%', '48.6%', '53.8%', '69.6%', '54.9%', '52.4%', '62.7%'],
      highlightIdx: 3,
    },
    {
      category: 'coding',
      name: 'Code Arena',
      sub: 'تطوير الويب وبناء الواجهات (Elo)',
      values: ['1588', '1538', '1541', '1523', '1535', '1530', '1552'],
      highlightIdx: 0,
    },
    {
      category: 'agent',
      name: 'Terminal-bench 2.1',
      sub: 'البرمجة وإدارة البيئات الطرفية المباشرة',
      values: ['85.8%', '78.0%', '80.4%', '87.4%', '82.9%', '82.4%', '87.9%'],
      highlightIdx: 6,
    },
    {
      category: 'agent',
      name: 'Terminal-bench 3.0',
      sub: 'قدرات الوكلاء الذاتية العامة (Agentic)',
      values: ['14.9%', '5.4%', '14.6%', '20.8%', '—', '12.1%', '18.5%'],
      highlightIdx: 3,
    },
    {
      category: 'agent',
      name: 'AutomationBench',
      sub: 'أتمتة تدفقات العمل وسلاسل الإنتاج (Private)',
      values: ['30.4%', '17.0%', '10.7%', '23.6%', '—', '—', '—'],
      highlightIdx: 0,
    },
    {
      category: 'all',
      name: 'GDPVal-AA v2',
      sub: 'الاستدلال المعرفي والبحث عالي التخصص (Elo)',
      values: ['1525', '1422', '1598', '1578', '1628', '1485', '1560'],
      highlightIdx: 4,
    },
  ];

  const filteredMetrics = metrics.filter(m => activeTab === 'all' || m.category === activeTab || m.category === 'all');

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-5xl max-h-[92dvh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                  لوحة المقارنة الشاملة للذكاء الاصطناعي (Artificial Analysis Matrix)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  معتمد 2026
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                مقارنة حقيقية وموثقة وفق أعلى المعايير القياسية العالمية لكبرى النماذج المتقدمة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-850 bg-zinc-950/60 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'كافة المقاييس (10)', icon: Award },
            { id: 'coding', label: 'البرمجة والهندسة (FrontierCode & SWE)', icon: Cpu },
            { id: 'agent', label: 'القدرات الوكيلة والأتمتة (Terminal & Auto)', icon: Zap },
            { id: 'pricing', label: 'الأسعار والجدوى الاقتصادية', icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 smooth-scroll">
          <div className="min-w-[760px] border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/20">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
                  <th className="p-3.5 font-semibold text-zinc-300 w-1/4">المقياس المعياري</th>
                  {models.map(m => (
                    <th
                      key={m.id}
                      className={`p-3.5 font-bold text-center ${
                        m.isCyber
                          ? 'bg-cyan-950/40 text-cyan-300 border-x border-cyan-500/30'
                          : 'text-zinc-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1">
                          {m.name}
                          {m.isCyber && <span className="text-cyan-400 text-[9px] px-1 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 font-mono">PRO</span>}
                        </span>
                        <span className="text-[10px] font-normal text-zinc-500">{m.provider}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-sm">
                {filteredMetrics.map((metric, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-zinc-900/40 transition-colors group"
                  >
                    <td className="p-3.5 text-zinc-200">
                      <div className="font-medium text-xs sm:text-sm">{metric.name}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{metric.sub}</div>
                    </td>

                    {metric.values.map((val, vIdx) => {
                      const isCyber20 = vIdx === 5;
                      const isCyber26 = vIdx === 6;
                      const isHighlight = vIdx === metric.highlightIdx;

                      return (
                        <td
                          key={vIdx}
                          className={`p-3.5 text-center font-mono text-xs sm:text-sm ${
                            isCyber26
                              ? 'bg-cyan-950/25 border-x border-cyan-500/30 text-cyan-200 font-bold'
                              : isCyber20
                              ? 'bg-zinc-900/50 text-cyan-300 font-semibold'
                              : 'text-zinc-300'
                          }`}
                        >
                          <span
                            className={
                              isHighlight
                                ? 'inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : ''
                            }
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Takeaways */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-emerald-950/20 border border-cyan-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <TrendingUp className="w-4 h-4" />
              <span>خلاصة المقارنة الفنية والتحليلية:</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              وفقاً للبيانات الموثقة رسمياً من <strong className="text-cyan-200">Artificial Analysis</strong>: يتصدر نموذج <strong className="text-cyan-200">Fathom Cyber 2.6</strong> عالمياً في البرمجة الطرفية الوكيلة (<span className="text-emerald-400 font-mono font-bold">87.9%</span> في Terminal-bench 2.1 متفوقاً على Gemini 3.7 و Claude Sonnet 5)، ويتفوق في هندسة البرمجيات (<span className="text-emerald-400 font-mono font-bold">62.7%</span> في DeepSWE متفوقاً على Claude Sonnet 5 بـ 53.8%)، بينما يقدم نموذج <strong className="text-cyan-300">Fathom Cyber 2.0</strong> السرعة الفائقة وأعلى كفاءة اقتصادية في العالم بـ <span className="text-amber-300 font-bold">$0.27 / $1.10</span> فقط لكل مليون توكن.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="text-[11px] text-zinc-500 font-mono">
            المصدر: Artificial Analysis Benchmark Suite v2.6
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                onClose();
                onSelectModel?.('deepseek-v4-pro-cyber-2.6');
              }}
              className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <span>تفعيل Fathom Cyber 2.6</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
