import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessageItem } from '../types';
import ChatReasoning from './ui/chat-reasoning';
import { Check, Copy, Flame, X, ShieldCheck, Sparkles, Camera, ExternalLink, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { renderSmartTextWithIcons } from '@/lib/smart-icons';
import { detectAndExtractUrl, getFaviconUrl } from '@/lib/utils';
import { ThinkingOrb } from './ui/thinking-orbs';
import { LinkConfirmModal } from './ui/LinkConfirmModal';

interface ChatMessageProps {
  message: ChatMessageItem;
  isStreaming?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s<>"'()]+|(?:www\.)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'()]*)?|[a-zA-Z0-9-]+\.(?:one|com|org|net|io|ai|app|dev|link|tech|me|co|xyz)(?:\/[^\s<>"'()]*)?)/gi;

function renderSmartTextWithLinks(
  text: string,
  onUrlClick: (url: string) => void
): React.ReactNode {
  if (!text || typeof text !== 'string') return text;
  if (!URL_REGEX.test(text)) {
    return renderSmartTextWithIcons(text);
  }

  URL_REGEX.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const rawUrl = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const nonUrlChunk = text.slice(lastIndex, matchIndex);
      parts.push(renderSmartTextWithIcons(nonUrlChunk));
    }

    parts.push(
      <button
        key={`link-${matchIndex}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUrlClick(rawUrl);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.15] hover:border-white/40 text-cyan-300 hover:text-white font-mono text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-sm mx-1 align-baseline select-none active:scale-95 group/link"
        title={`انقر لتأكيد الانتقال إلى: ${rawUrl}`}
      >
        <Globe className="size-3 text-cyan-400 group-hover/link:text-cyan-300 shrink-0 inline-block" />
        <span className="break-all dir-ltr underline underline-offset-2">{rawUrl}</span>
        <ExternalLink className="size-2.5 opacity-70 group-hover/link:opacity-100 shrink-0 inline-block" />
      </button>
    );

    lastIndex = URL_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderSmartTextWithIcons(text.slice(lastIndex)));
  }

  return parts;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasReasoning = Boolean(message.reasoning && message.reasoning.trim().length > 0);
  const isThinking = Boolean(message.isThinking);

  if (isUser) {
    const urlInfo = detectAndExtractUrl(message.content);
    const extractedUrl = urlInfo.cleanUrl;
    const remainingText = urlInfo.remainingText;
    const faviconUrl = extractedUrl ? getFaviconUrl(extractedUrl) : null;
    const domainName = urlInfo.domain;
    const allImages = (message.images && message.images.length > 0)
      ? message.images
      : (message.image ? [message.image] : []);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex justify-start my-2 group"
      >
        <div className="max-w-[94%] sm:max-w-[82%] rounded-2xl rounded-tr-sm glass-card text-white p-3 sm:p-4 text-right">
          
          {extractedUrl && (
            <div className="mb-2.5 flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl bg-black/60 border border-white/[0.1] text-right animate-in fade-in duration-150 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] text-zinc-300 font-medium">
                <span className="flex items-center gap-1.5 font-sans font-semibold text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>رابط الهدف المستطلع للفحص:</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08] font-bold">
                  TARGET URL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmUrl(extractedUrl)}
                className="flex items-center justify-between gap-2.5 bg-zinc-950/80 hover:bg-zinc-900/80 p-2 sm:p-2.5 rounded-lg border border-white/[0.08] hover:border-white/[0.2] mt-0.5 shadow-inner w-full text-right cursor-pointer transition-all group/target"
              >
                <div className="size-7 rounded-xl bg-zinc-900 border border-white/[0.12] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {faviconUrl && !faviconFailed ? (
                    <img
                      src={faviconUrl}
                      alt={domainName || 'Site Logo'}
                      className="size-4 object-contain rounded"
                      onError={() => setFaviconFailed(true)}
                    />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-cyan-400/80" />
                    </div>
                  )}
                </div>
                <span
                  className="font-mono text-xs sm:text-sm text-zinc-200 group-hover/target:text-white underline underline-offset-4 decoration-white/20 group-hover/target:decoration-white break-all dir-ltr text-left flex-1 transition-colors"
                  dir="ltr"
                >
                  {extractedUrl}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover/target:text-white shrink-0 opacity-75 group-hover/target:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {allImages.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {allImages.map((imgSrc, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgSrc)}
                  className="relative group rounded-xl overflow-hidden border border-white/[0.12] bg-zinc-900/80 p-1 cursor-pointer hover:border-white/40 transition-all shadow-md"
                >
                  <img
                    src={imgSrc}
                    alt={`مرفق ${idx + 1}`}
                    className="max-h-48 sm:max-h-56 max-w-full rounded-lg object-contain"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-white font-mono text-[10px] font-bold border border-white/20 backdrop-blur-md shadow">
                    صورة #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedImage && (
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setSelectedImage(null)}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="fixed top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-[#0e0e14] border border-white/[0.15] text-zinc-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged preview"
                className="max-h-[85vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          )}

          {remainingText && (
            <div className="text-xs sm:text-base leading-relaxed whitespace-pre-wrap font-sans break-words text-zinc-100">
              {renderSmartTextWithLinks(remainingText, setConfirmUrl)}
            </div>
          )}

          <div className="mt-2 pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[10px] font-mono text-zinc-400">
              {message.timestamp}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.08] cursor-pointer select-none active:scale-95"
              title="نسخ نص الرسالة"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] sm:text-[11px]">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] sm:text-[11px]">نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>
        <LinkConfirmModal url={confirmUrl} onClose={() => setConfirmUrl(null)} />
      </motion.div>
    );
  }

  const isCyber = message.model === 'deepseek-v4-flash-cyber';
  const isVision = message.model === 'deepseek-v4-flash-vision-exp' || Boolean(message.image);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-start my-2 group"
    >
      <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-zinc-300">
        <div className="flex items-center gap-1.5 font-sans font-medium">
          {isCyber ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/[0.12] text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-semibold text-xs text-zinc-100">منظومة Fathom Cyber</span>
            </div>
          ) : message.isX1 ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/[0.12] text-zinc-200">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold text-xs text-zinc-100">بروتوكول X1 MAX</span>
            </div>
          ) : isVision ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/[0.12] text-zinc-200">
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-semibold text-xs text-zinc-100">محرك Fathom Cam</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/[0.12] text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-semibold text-xs text-zinc-100">محرك Fathom 1</span>
            </div>
          )}
        </div>
        <span className="text-[10px] font-mono text-zinc-400">{message.timestamp}</span>
      </div>

      <div className="w-full rounded-2xl p-3.5 sm:p-5 text-right border transition-all glass-panel text-zinc-100">
        {(hasReasoning || isThinking) && (
          <ChatReasoning
            reasoningText={message.reasoning}
            isThinking={isThinking}
            isStreaming={isStreaming}
            isX1={message.isX1}
            defaultValue={isStreaming ? "reasoning" : undefined}
          />
        )}

        {isStreaming && !message.content && !isThinking ? (
          <div className="flex items-center gap-2 py-1.5 select-none" dir="rtl">
            <div className="inline-flex h-8 items-center gap-2.5 rounded-full pl-3.5 pr-2.5 border border-white/[0.08] bg-zinc-950/90 backdrop-blur-md">
              <ThinkingOrb
                state={isCyber ? "searching" : isVision ? "working" : message.isX1 ? "solving" : "composing"}
                size={20}
                theme="dark"
                speed={1.5}
              />
              <span className="whitespace-nowrap text-xs font-sans font-medium text-zinc-300">
                {isCyber ? "جاري الاستطلاع الأمني وتدقيق الهدف..." : isVision ? "جاري فك وتوليد الإدراك البصري..." : message.isX1 ? "جاري تحرير المحرك العصبي واستدعاء الرد..." : "جاري توليد الاستجابة اللغوية الفصحى..."}
              </span>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-zinc-200 text-xs sm:text-base leading-relaxed break-words font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }: any) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (href) setConfirmUrl(href);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.14] hover:border-white/40 text-cyan-300 hover:text-white font-mono text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-sm mx-1 align-baseline select-none active:scale-95 group/link"
                    title={`انقر لتأكيد الانتقال إلى: ${href}`}
                  >
                    <Globe className="size-3 text-cyan-400 group-hover/link:text-cyan-300 shrink-0 inline-block" />
                    <span className="break-all underline underline-offset-2">{children}</span>
                    <ExternalLink className="size-2.5 opacity-70 group-hover/link:opacity-100 shrink-0 inline-block" />
                  </button>
                ),
                p: ({ children }) => (
                  <p className="mb-2.5 sm:mb-3 last:mb-0 leading-relaxed">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartTextWithLinks(child, setConfirmUrl) : child)}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base sm:text-xl font-bold text-white my-2 sm:my-3 border-b border-white/[0.1] pb-1.5">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartTextWithLinks(child, setConfirmUrl) : child)}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm sm:text-lg font-semibold text-zinc-100 my-2 sm:my-2.5">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartTextWithLinks(child, setConfirmUrl) : child)}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs sm:text-base font-semibold text-white my-1.5 sm:my-2">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartTextWithLinks(child, setConfirmUrl) : child)}
                  </h3>
                ),
                li: ({ children }) => (
                  <li className="my-0.5 leading-relaxed">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartTextWithLinks(child, setConfirmUrl) : child)}
                  </li>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300 pr-1 sm:pr-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300 pr-1 sm:pr-2">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-r-2 border-white/30 bg-white/[0.03] pr-2.5 sm:pr-3 py-1.5 sm:py-2 my-2 text-xs sm:text-sm text-zinc-300 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-white/[0.1]">
                    <table className="w-full text-xs text-right border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-white/[0.06] p-2 text-zinc-200 font-semibold border-b border-white/[0.1]">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-2 border-b border-white/[0.06] text-zinc-300">{children}</td>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-2.5 sm:my-3 rounded-xl border border-white/[0.1] bg-black/80 overflow-hidden font-mono text-xs text-left" dir="ltr">
                      <div className="flex justify-between items-center bg-white/[0.04] px-3 py-1.5 border-b border-white/[0.08] text-zinc-400 text-[11px]">
                        <span>{match ? match[1] : 'code'}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                          className="hover:text-white flex items-center gap-1 font-medium transition-colors"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                          نسخ
                        </button>
                      </div>
                      <pre className="p-3 sm:p-3.5 overflow-x-auto text-zinc-200 text-xs leading-relaxed">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-white/[0.08] text-zinc-200 border border-white/[0.1] px-1.5 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-zinc-300 animate-pulse mr-1 align-middle rounded-full" />
            )}
          </div>
        )}

        {message.content && !isStreaming && (
          <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400">
              {isCyber ? 'منظومة Fathom Cyber' : message.isX1 ? 'بروتوكول X1 MAX' : message.image ? 'محرك Fathom Cam' : 'محرك Fathom 1'}
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
      <LinkConfirmModal url={confirmUrl} onClose={() => setConfirmUrl(null)} />
    </motion.div>
  );
};

export const ChatMessage = React.memo(ChatMessageComponent, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.content !== nextProps.message.content) return false;
  if (prevProps.message.reasoning !== nextProps.message.reasoning) return false;
  if (prevProps.message.isThinking !== nextProps.message.isThinking) return false;
  if (prevProps.message.model !== nextProps.message.model) return false;
  if (prevProps.message.isX1 !== nextProps.message.isX1) return false;
  if (prevProps.message.image !== nextProps.message.image) return false;
  return true;
});
