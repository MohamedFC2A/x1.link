import React from 'react';
import { X, Zap, ArrowLeft } from 'lucide-react';
import { TimelineTracker, TimelineStep } from './ui/timeline-tracker';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
}) => {
  if (!isOpen) return null;

  const architectureSteps: TimelineStep[] = [
    {
      id: 1,
      title: 'المرحلة الأولى: الإدراك البصري والاستخباراتي (Fathom Cam & Cyber Recon)',
      description: 'استخراج فوري لكافة النصوص، الرموز، وتحليل سطح الهجوم الرقمي وفحص الروابط والوسائط بدقة فائقة.',
      timestamp: 'المرحلة 01 • الاستكشاف والإدراك',
      status: 'completed',
    },
    {
      id: 2,
      title: 'المرحلة الثانية: الذاكرة العرضية والدلالية ثلاثية المستويات (Unified 3-Tier Dynamic Memory)',
      description: 'تزامن لحظي (Working Memory) مع ذاكرة مواقف وتجارب كاملة (Episodic Ledger) وشبكة مفاهيم استنتاجية (Semantic Graph) وتسوية التناقضات حتى 50M توكن.',
      timestamp: 'المرحلة 02 • الذاكرة المعرفية الهرمية',
      status: 'completed',
    },
    {
      id: 3,
      title: 'المرحلة الثالثة: العزل البيومتري والتحرر المعرفي (NSFW Off & Cyber Architect)',
      description: 'تفعيل مسار المعالجة السيادية غير المقيدة فور التحقق البيومتري، مع التحرر التام من القيود المصطنعة للردود الهندسية والتحليل الأمني الصريح.',
      timestamp: 'المرحلة 03 • السيادة والأمان البيومتري',
      status: 'in-progress',
    },
    {
      id: 4,
      title: 'المرحلة الرابعة: التوليد السيادي فائق الذكاء (Fathom Cyber 2.0 & Fathom 1.1)',
      description: 'صياغة المخرجات باللغة العربية الفصحى البليغة، مع دقة تقنية متناهية، تفنيد للثغرات، وترقيع دفاعي فوري بدون شوائب.',
      timestamp: 'المرحلة 04 • التوليد السيادي',
      status: 'completed',
    },
    {
      id: 5,
      title: 'المرحلة الخامسة: الاكتشاف العلمي المؤتمت والاستدلال الاختطافي (Fathom Cyber 2.1 Pro - v4 Pro)',
      description: 'معمارية v4 Pro المتقدمة مع حلقة المعرفة المغلقة (O-H-E-U Loop): رصد الشذوذ والمعضلات، صياغة الفرضيات بنصل أوكام، والتحقق الآلي عبر بيئة برهان شكلي (Lean/Coq) وتثبيت البديهيات.',
      timestamp: 'المرحلة 05 • الاكتشاف العلمي ومعمارية v4 Pro',
      status: 'in-progress',
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-xl max-h-[88dvh] overflow-y-auto smooth-scroll bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-right shadow-2xl space-y-4 sm:space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3.5 top-3.5 sm:left-4 sm:top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-2xl bg-white/[0.06] border border-white/[0.14] text-zinc-200 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              خريطة معمارية منظومة matany.one
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans mt-0.5">
              كيف تتم معالجة الأفكار والصور والتوليد الفصيح في أجزاء من الثانية
            </p>
          </div>
        </div>

        {/* Timeline Roadmap */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <TimelineTracker steps={architectureSteps} />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartChat();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <span>بدء التجربة الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
