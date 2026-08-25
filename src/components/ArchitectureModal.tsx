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
      title: 'المرحلة الأولى: الإدراك والاستقبال البصري (Fathom Cam)',
      description: 'استخراج فوري وشامل لكافة النصوص، الرموز، المشاهد، والأبعاد البصرية من الصور المرفقة بدقة عالية وتجهيزها كسياق مباشر.',
      timestamp: 'المرحلة 01 • الإدراك البصري',
      status: 'completed',
    },
    {
      id: 2,
      title: 'المرحلة الثانية: استرجاع الذاكرة المليونية الممتدة (Context Ledger)',
      description: 'فحص سجل الحوار التراكمي وتلخيص الأفكار السابقة مع الاحتفاظ الكامل بالسياق التاريخي حتى مليون توكن دون نسيان.',
      timestamp: 'المرحلة 02 • الذاكرة الممتدة',
      status: 'completed',
    },
    {
      id: 3,
      title: 'المرحلة الثالثة: العزل البيومتري والتحرر الكامل (NSFW NANO Protocol)',
      description: 'تفعيل مسار المعالجة غير المقيد فور التحقق من بصمة الإصبع أو Face ID، مع إزالة كاملة للقيود أو الرقابة المسبقة.',
      timestamp: 'المرحلة 03 • الأمان البيومتري',
      status: 'in-progress',
    },
    {
      id: 4,
      title: 'المرحلة الرابعة: التوليد اللغوي الفصيح فائق الأداء (Fathom 1 Core)',
      description: 'صياغة الردود باللغة العربية الفصحى البليغة، بأعلى معايير الإبداع، التماسك المنطقي، وعمق الطرح.',
      timestamp: 'المرحلة 04 • التوليد النهائي',
      status: 'pending',
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
          <div className="size-11 sm:size-12 rounded-2xl bg-rose-950 border border-rose-600 text-rose-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              خريطة معمارية منظومة X1.link
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <span>بدء التجربة الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
