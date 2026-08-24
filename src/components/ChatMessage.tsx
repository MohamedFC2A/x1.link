import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessageItem } from '../types';
import ChatReasoning, { ReasoningStep } from './ui/chat-reasoning';
import { Check, Copy, User as UserIcon, Bot, Flame } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageItem;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reasoning breakdown if it's an assistant response with substantive length
  const reasoningSteps: ReasoningStep[] = !isUser && message.content.length > 60 ? [
    {
      type: 'reasoning',
      text: message.isX1
        ? 'تم تفعيل وضع X1 (+21): تحليل المسألة بعمق تجريدي واستحضار السياق عبر محرك الذاكرة المليونية وصياغة رد مباشر وصريح.'
        : 'تحليل السؤال وتفكيك الفرضيات الأولية وتجهيز الإجابة بأسلوب ذكي ومنظم.'
    }
  ] : [];

  if (isUser) {
    return (
      <div className="flex justify-start my-2 group">
        <div className="max-w-[90%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-zinc-800 text-zinc-100 p-3.5 sm:p-4 border border-zinc-700/60 shadow-sm text-right">
          {message.image && (
            <div className="mb-2.5 rounded-xl overflow-hidden border border-zinc-700 bg-black/40 p-1">
              <img
                src={message.image}
                alt="Uploaded attachment"
                className="max-h-56 object-contain rounded-lg w-auto mx-auto"
              />
            </div>
          )}
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {message.content}
          </p>
          <div className="mt-2 pt-1.5 border-t border-zinc-700/50 flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[10px] font-mono text-zinc-400">
              {message.timestamp}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-700/60 cursor-pointer select-none"
              title="نسخ نص الرسالة"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col my-3 w-full animate-in fade-in duration-200">
      
      {/* Assistant Header Tag */}
      <div className="flex items-center gap-2 mb-1.5 px-1 select-none">
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${
          message.isX1
            ? 'bg-rose-600/20 text-rose-500 border border-rose-500/30'
            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
        }`}>
          {message.isX1 ? <Flame className="w-3.5 h-3.5 fill-current" /> : <Bot className="w-3.5 h-3.5" />}
        </div>

        <span className="font-semibold text-xs text-zinc-200">
          {message.isX1 ? 'X1 (+21)' : 'X1 AI'}
        </span>

        <span className="text-[10px] text-zinc-500 font-mono">
          {message.timestamp}
        </span>
      </div>

      {/* Assistant Message Bubble */}
      <div className={`w-full rounded-2xl p-4 sm:p-5 text-right border transition-colors ${
        message.isX1
          ? 'bg-zinc-900/90 border-rose-900/30 text-zinc-100'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
      }`}>
        
        {/* Reasoning Breakdown Accordion */}
        {reasoningSteps.length > 0 && (
          <ChatReasoning
            partsInAccordion={reasoningSteps}
            defaultValue={isStreaming ? "reasoning" : undefined}
          />
        )}

        {/* Formatted Markdown Content */}
        <div className="prose prose-invert max-w-none text-zinc-200 text-sm sm:text-base leading-relaxed break-words font-sans">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
              h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold text-white my-3 border-b border-zinc-800 pb-1.5">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base sm:text-lg font-semibold text-zinc-100 my-2.5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm sm:text-base font-semibold text-rose-400 my-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-2 text-zinc-300 pr-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 my-2 text-zinc-300 pr-2">{children}</ol>,
              blockquote: ({ children }) => (
                <blockquote className="border-r-2 border-rose-500 bg-zinc-950/60 pr-3 py-2 my-2 text-xs sm:text-sm text-zinc-300 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <div className="my-3 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs text-left" dir="ltr">
                    <div className="flex justify-between items-center bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 text-zinc-400 text-[11px]">
                      <span>{match ? match[1] : 'code'}</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                        className="hover:text-white flex items-center gap-1 font-medium transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        نسخ
                      </button>
                    </div>
                    <pre className="p-3.5 overflow-x-auto text-zinc-200 text-xs leading-relaxed">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code className="bg-zinc-800/80 text-rose-300 border border-zinc-700/50 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-rose-500 animate-pulse mr-1 align-middle rounded-full" />
          )}
        </div>

        {/* Footer Actions */}
        {message.content && !isStreaming && (
          <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[11px]">
              {message.isX1 ? 'بروتوكول X1 (+21)' : message.image ? 'محرك Fathom Cam' : 'محرك Fathom 1'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs">نسخ</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
