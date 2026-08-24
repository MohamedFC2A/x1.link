import React, { useEffect, useRef } from 'react';
import { ChatMessageItem } from '../types';
import { ChatMessage } from './ChatMessage';
import { Terminal, Compass, Cpu, Code2 } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  isX1Active: boolean;
  onSendPreset: (presetText: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  isX1Active,
  onSendPreset,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const starterPresets = [
    {
      title: 'تحليل فكرة برمجية بصراحة',
      description: 'نقد معماري وتقني دقيق دون مجاملة',
      icon: Terminal,
      prompt: 'قيم فكرتي البرمجية بنقد معماري صارم وصادق دون مجاملات، وأخبرني أين تكمن نقاط الضعف الحقيقية.',
    },
    {
      title: 'رؤية فلسفية وفكرية عميقة',
      description: 'استكشاف الأبعاد غير المرئية للمستقبل',
      icon: Compass,
      prompt: 'أعطني تحليلاً فلسفياً عميقاً حول مستقبل الوعي البشري في ظل تسارع الذكاء الاصطناعي.',
    },
    {
      title: 'تشريح مسألة معقدة',
      description: 'تفكيك المشاكل المستعصية خطوة بخطوة',
      icon: Cpu,
      prompt: 'ساعدني في تفكيك مسألة معقدة وتحليلها من جذورها الأولى مع بدائل وحلول غير نمطية.',
    },
    {
      title: 'هندسة كود عالي الأداء',
      description: 'حلول خوارزمية وبرمجية متقدمة',
      icon: Code2,
      prompt: 'اكتب لي كوداً برمجياً عالي الأداء ومنظماً بأحدث الأنماط الهندسية مع معالجة كاملة للحالات الحدية.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-8 text-center animate-in fade-in duration-300">
          
          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {isX1Active ? (
              <span className="text-rose-500">X1 // خارج القيود التقليدية</span>
            ) : (
              <span>مرحباً بك في <span className="text-rose-500">X1.link</span></span>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
            محادثات ذكية، واقعية، وصريحة مع ذاكرة مليون توكن ودعم كامل لتحليل الصور والأفكار المعقدة.
          </p>

          {/* Starter Presets Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
            {starterPresets.map((preset, index) => {
              const Icon = preset.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSendPreset(preset.prompt)}
                  className="group relative flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all text-right cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-zinc-800/80 group-hover:bg-rose-600/10 group-hover:text-rose-400 text-zinc-400 transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-zinc-200 group-hover:text-white transition-colors">
                      {preset.title}
                    </div>
                    <div className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
                      {preset.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
            />
          ))}
          <div ref={bottomRef} className="h-2" />
        </div>
      )}
    </div>
  );
};
