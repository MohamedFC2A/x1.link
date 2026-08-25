import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessageItem } from '../types';
import ChatReasoning, { ReasoningStep } from './ui/chat-reasoning';
import ExecutionPipeline from './ui/execution-pipeline';
import { Check, Copy, Bot, Flame, X, ShieldCheck, Sparkles, Camera, Globe, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageItem;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasReasoning = Boolean(message.reasoning && message.reasoning.trim().length > 0);
  const isThinking = Boolean(message.isThinking);

  if (isUser) {
    // Extract URL if present to display as a dedicated prominent target badge
    const urlMatch = message.content.match(/(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/i);
    let extractedUrl: string | null = null;
    let remainingText: string = message.content;

    if (urlMatch) {
      let rawFound = urlMatch[0];
      let cleaned = rawFound.replace(/^[^a-zA-Z0-9]+/, '');
      if (!/^https?:\/\//i.test(cleaned)) cleaned = 'https://' + cleaned;
      extractedUrl = cleaned;
      remainingText = message.content.replace(urlMatch[0], '').replace(/^\s*\/+\s*/, '').trim();
    }

    return (
      <div className="flex justify-start my-2 group">
        <div className="max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tr-sm bg-zinc-800 text-zinc-100 p-3 sm:p-4 border border-zinc-700/60 shadow-sm text-right">
          {message.image && (
            <>
              <div
                onClick={() => setIsImageOpen(true)}
                className="mb-2 rounded-xl overflow-hidden border border-zinc-700 bg-black/40 p-1 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={message.image}
                  alt="Uploaded attachment"
                  className="max-h-52 sm:max-h-60 object-contain rounded-lg w-auto mx-auto"
                />
              </div>

              {isImageOpen && (
                <div
                  className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
                  onClick={() => setIsImageOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsImageOpen(false)}
                    className="fixed top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={message.image}
                    alt="Enlarged preview"
                    className="max-h-[85vh] w-auto max-w-full object-contain rounded-xl"
                  />
                </div>
              )}
            </>
          )}

          {/* Prominent High-Tech Target URL Badge */}
          {extractedUrl && (
            <div className="mb-2.5 flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/90 border border-cyan-500/50 shadow-md text-right animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-medium">
                <span className="flex items-center gap-1.5 font-sans font-semibold">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>رابط الهدف المستطلع للفحص:</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold">
                  TARGET URL
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-cyan-900/60 mt-0.5">
                <a
                  href={extractedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs sm:text-sm text-cyan-200 hover:text-cyan-100 underline underline-offset-4 decoration-cyan-500/60 break-all dir-ltr text-left flex-1"
                  dir="ltr"
                >
                  {extractedUrl}
                </a>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-70 hover:opacity-100" />
              </div>
            </div>
          )}

          {remainingText && (
            <p className="text-xs sm:text-base leading-relaxed whitespace-pre-wrap font-sans break-words text-zinc-100">
              {remainingText}
            </p>
          )}

          <div className="mt-2 pt-1.5 border-t border-zinc-700/50 flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[10px] font-mono text-zinc-400">
              {message.timestamp}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-700/60 cursor-pointer select-none active:scale-95"
              title="نسخ نص الرسالة"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] sm:text-[11px]">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px] sm:text-[11px]">نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCyber = message.model === 'deepseek-v4-flash-cyber';
  const isVision = message.model === 'deepseek-v4-flash-vision-exp';

  return (
    <div className="flex flex-col my-2.5 sm:my-3 w-full animate-in fade-in duration-200">
      
      {/* Assistant Header Tag */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 px-1 select-none">
        <div className={`flex items-center justify-center size-5 sm:size-6 rounded-lg ${
          isCyber
            ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
            : isVision
            ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
            : message.isX1
            ? 'bg-rose-600/20 text-rose-500 border border-rose-500/30'
            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
        }`}>
          {isCyber ? (
            <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          ) : isVision ? (
            <Camera className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          ) : message.isX1 ? (
            <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
          ) : (
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          )}
        </div>

        <span className="font-semibold text-xs text-zinc-200">
          {isCyber
            ? 'Fathom Cyber'
            : isVision
            ? 'Fathom Cam'
            : message.isX1
            ? 'X1 (+21 MAX)'
            : 'Fathom 1'}
        </span>

        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">
          {message.timestamp}
        </span>
      </div>

      {/* Assistant Message Bubble */}
      <div className={`w-full rounded-2xl p-3.5 sm:p-5 text-right border transition-colors ${
        isCyber
          ? 'bg-zinc-900/90 border-cyan-900/40 text-zinc-100'
          : message.isX1
          ? 'bg-zinc-900/90 border-rose-900/30 text-zinc-100'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
      }`}>
        
        {/* Smart Live Execution Pipeline */}
        {(isStreaming || hasReasoning || isThinking) && (
          <ExecutionPipeline
            model={message.model}
            isX1={message.isX1}
            isStreaming={isStreaming}
            isThinking={isThinking}
            hasReasoning={hasReasoning}
            hasContent={Boolean(message.content && message.content.trim().length > 0)}
          />
        )}

        {/* Real Live Reasoning / Thinking Accordion */}
        {(hasReasoning || isThinking) && (
          <ChatReasoning
            reasoningText={message.reasoning}
            isThinking={isThinking}
            isX1={message.isX1}
            defaultValue={isStreaming ? "reasoning" : undefined}
          />
        )}

        {/* Formatted Markdown Content or Initial Stream Pulsing State */}
        {isStreaming && !message.content && !isThinking ? (
          <div className="flex items-center gap-2 py-2 text-xs text-zinc-400 font-mono select-none">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-sans text-xs text-zinc-300">جاري المعالجة والاتصال بمحرك الذكاء الاصطناعي...</span>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-zinc-200 text-xs sm:text-base leading-relaxed break-words font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2.5 sm:mb-3 last:mb-0 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-base sm:text-xl font-bold text-white my-2 sm:my-3 border-b border-zinc-800 pb-1.5">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm sm:text-lg font-semibold text-zinc-100 my-2 sm:my-2.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs sm:text-base font-semibold text-rose-400 my-1.5 sm:my-2">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300 pr-1 sm:pr-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300 pr-1 sm:pr-2">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-r-2 border-rose-500 bg-zinc-950/60 pr-2.5 sm:pr-3 py-1.5 sm:py-2 my-2 text-xs sm:text-sm text-zinc-300 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-xs text-right border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-zinc-800/80 p-2 text-zinc-200 font-semibold border-b border-zinc-700">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-2 border-b border-zinc-800 text-zinc-300">{children}</td>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-2.5 sm:my-3 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs text-left" dir="ltr">
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
                      <pre className="p-3 sm:p-3.5 overflow-x-auto text-zinc-200 text-xs leading-relaxed">
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
        )}

        {/* Footer Actions */}
        {message.content && !isStreaming && (
          <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[10px] sm:text-[11px]">
              {message.isX1 ? 'بروتوكول X1 (+21)' : message.image ? 'محرك Fathom Cam' : 'محرك Fathom 1'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800 active:scale-95"
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
