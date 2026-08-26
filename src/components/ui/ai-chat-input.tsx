"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn, detectAndExtractUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ArrowUp,
  Square,
  Sparkles,
  Camera,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Globe,
  Terminal,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Search
} from "lucide-react";
import { ModelType } from "@/types";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
export interface Attachment {
  id: string;
  file: File;
  url: string;
  name: string;
  width?: number;
  height?: number;
}

export interface PromptInputProps {
  onSubmit?: (
    value: string,
    meta: { model: string; effort: string; attachments: File[]; targetUrl?: string; deepSearch?: boolean }
  ) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  maxAttachments?: number;
  isStreaming?: boolean;
  onAbort?: () => void;
  isX1Active?: boolean;
  onToggleX1?: () => void;
  isDeepSearchActive?: boolean;
  onToggleDeepSearch?: () => void;
  activeModel?: ModelType;
  onSelectModel?: (model: ModelType) => void;
}

// ----------------------------------------------------------------------
// Attachment Gallery Modal (Lightbox)
// ----------------------------------------------------------------------
function AttachmentGalleryModal({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-[80vh] w-auto max-w-full object-contain mx-auto"
        />
        <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300 font-mono">
          <span className="truncate max-w-[200px] sm:max-w-md">{attachment.name}</span>
          <span className="text-zinc-500">{attachment.width}x{attachment.height}</span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Responsive AI Chat Input
// ----------------------------------------------------------------------
export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      onSubmit,
      placeholder = "اسأل X1 أي شيء...",
      className,
      defaultValue = "",
      value: controlledValue,
      onChange,
      maxAttachments = 6,
      isStreaming = false,
      onAbort,
      isX1Active = false,
      onToggleX1,
      isDeepSearchActive: externalDeepSearch,
      onToggleDeepSearch,
      activeModel = 'deepseek-v4-flash',
      onSelectModel,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isTargetUrlBarOpen, setIsTargetUrlBarOpen] = useState(false);
    const [cyberTargetUrl, setCyberTargetUrl] = useState('');
    const [internalModel, setInternalModel] = useState<ModelType>(activeModel);
    const [internalDeepSearch, setInternalDeepSearch] = useState(false);

    const isDeepSearchEffective = onToggleDeepSearch
      ? (externalDeepSearch ?? false)
      : internalDeepSearch;

    const toggleDeepSearch = () => {
      if (onToggleDeepSearch) {
        onToggleDeepSearch();
      } else {
        setInternalDeepSearch(prev => !prev);
      }
    };

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;

    useEffect(() => {
      if (activeModel) setInternalModel(activeModel);
    }, [activeModel]);

    const hasAttachments = attachments.length > 0;
    const hasValue = value.trim() !== "" || hasAttachments || cyberTargetUrl.trim() !== "";

    const effectiveModel: ModelType = hasAttachments
      ? 'deepseek-v4-flash-vision-exp'
      : internalModel;

    const isVisionMode = effectiveModel === 'deepseek-v4-flash-vision-exp';
    const isCyberMode = effectiveModel === 'deepseek-v4-flash-cyber';

    const activeModelDisplayName = isVisionMode
      ? "Fathom Cam"
      : isCyberMode
      ? "Fathom Cyber"
      : "Fathom 1";

    const activeBackendModel = effectiveModel;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activateCyberUrlMode = useCallback((extractedUrl: string, promptText: string = '') => {
      setCyberTargetUrl(extractedUrl);
      setIsTargetUrlBarOpen(true);
      setInternalModel('deepseek-v4-flash-cyber');
      onSelectModel?.('deepseek-v4-flash-cyber');
      if (!isControlled) setLocalValue(promptText);
      onChange?.(promptText);
    }, [isControlled, onChange, onSelectModel]);

    const handleValueChange = useCallback(
      (val: string) => {
        // Automatic URL detection on typing or standard input
        if (val && !cyberTargetUrl) {
          const urlInfo = detectAndExtractUrl(val);
          // Auto-trigger if a valid URL pattern is detected and followed by a space, newline, or is standalone
          if (urlInfo.hasUrl && urlInfo.cleanUrl) {
            const hasSpaceOrNewline = /\s$/.test(val) || val.includes('\n');
            const isStandalone = val.trim() === (val.match(/(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`]*)?/i)?.[0] || '').trim();
            
            if (hasSpaceOrNewline || isStandalone) {
              activateCyberUrlMode(urlInfo.cleanUrl, urlInfo.remainingText);
              return;
            }
          }
        }

        if (!isControlled) setLocalValue(val);
        onChange?.(val);
      },
      [isControlled, onChange, cyberTargetUrl, activateCyberUrlMode]
    );

    // Auto-detect URL on paste directly inside the textarea
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text');
      if (!pastedText) return;

      const urlInfo = detectAndExtractUrl(pastedText);
      if (urlInfo.hasUrl && urlInfo.cleanUrl) {
        e.preventDefault();
        const existingText = value.trim();
        const combinedPrompt = [existingText, urlInfo.remainingText].filter(Boolean).join(' ').trim();
        activateCyberUrlMode(urlInfo.cleanUrl, combinedPrompt);
      }
    };

    // Auto-adjust textarea height cleanly on input
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 38), 160);
      el.style.height = `${newHeight}px`;
    }, [value]);

    const handleCyberSubmit = () => {
      const activeUrl = cyberTargetUrl.trim() || detectAndExtractUrl(value).cleanUrl;
      if (!activeUrl || isStreaming) return;
      let target = activeUrl;
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

      const extraPrompt = cyberTargetUrl ? value.trim() : detectAndExtractUrl(value).remainingText;
      const displayContent = extraPrompt ? `${target}\n${extraPrompt}` : target;

      onSubmit?.(displayContent, {
        model: 'deepseek-v4-flash-cyber',
        effort: isX1Active ? "X1 MAX" : "Standard",
        attachments: [],
        targetUrl: target,
        deepSearch: isDeepSearchEffective,
      });

      setCyberTargetUrl('');
      setIsTargetUrlBarOpen(false);
      handleValueChange('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    };

    const handleSubmit = () => {
      if (isStreaming) {
        onAbort?.();
        return;
      }

      // Check if cyber target URL is active or if current text has a URL
      const currentUrlInfo = detectAndExtractUrl(value);
      if ((isCyberMode && cyberTargetUrl.trim()) || cyberTargetUrl.trim() || currentUrlInfo.hasUrl) {
        handleCyberSubmit();
        return;
      }

      if (value.trim() === "" && !hasAttachments) return;

      const textToSubmit =
        value.trim() ||
        (hasAttachments
          ? "حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة."
          : "");

      onSubmit?.(textToSubmit, {
        model: activeBackendModel,
        effort: isX1Active ? "X1 MAX" : "Standard",
        attachments: attachments.map((a) => a.file),
        deepSearch: isDeepSearchEffective,
      });

      handleValueChange("");
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
      setAttachments([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";

      if (files.length === 0) return;
      const room = Math.max(0, maxAttachments - attachments.length);
      const accepted = files.slice(0, room);

      for (const file of accepted) {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) {
          const img = new Image();
          img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight);
          img.onerror = () => addAttachment(file, url, 800, 600);
          img.src = url;
        } else {
          addAttachment(file, url, 0, 0);
        }
      }
    };

    const addAttachment = (
      file: File,
      url: string,
      width: number,
      height: number
    ) => {
      const id = `${file.name}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      setAttachments((prev) => [
        ...prev,
        { id, file, url, name: file.name, width, height },
      ]);
    };

    const removeAttachment = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setAttachments((prev) => {
        const target = prev.find((a) => a.id !== id);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((a) => a.id !== id);
      });
    };

    const onActionButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isStreaming) {
        onAbort?.();
      } else if (hasValue) {
        handleSubmit();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col w-full max-w-3xl mx-auto px-1 sm:px-0 select-none",
          className
        )}
        dir="rtl"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.py,.js,.ts,.json"
          multiple
          onChange={handleFilesChosen}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Interactive Model Selector Popover */}
        {isModelMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsModelMenuOpen(false)}
            />
            <div
              dir="rtl"
              className="absolute bottom-full right-2 mb-3 w-[300px] sm:w-[320px] glass-popover rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-right select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.08] mb-2">
                <span className="text-xs font-sans font-bold text-white tracking-wide">اختيار المحرك العصبي</span>
                <span className="text-[9px] font-mono text-zinc-400 tracking-wider">ENGINE MATRIX</span>
              </div>

              <div className="space-y-1.5">
                {/* Model 1: Fathom 1 */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalModel('deepseek-v4-flash');
                    onSelectModel?.('deepseek-v4-flash');
                    setIsModelMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    internalModel === 'deepseek-v4-flash' && !hasAttachments
                      ? "bg-white/[0.09] text-white font-bold border-white/[0.16] shadow-sm"
                      : "hover:bg-white/[0.04] text-zinc-300 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-4 h-4 text-zinc-200" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">Fathom 1</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">CORE</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        المحرك اللغوي الفصيح، التحليل الفكري، والتوليد الحر
                      </div>
                    </div>
                  </div>
                  {internalModel === 'deepseek-v4-flash' && !hasAttachments && (
                    <span className="size-1.5 rounded-full bg-white shrink-0 mr-2" />
                  )}
                </button>

                {/* Model 2: Fathom Cyber */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalModel('deepseek-v4-flash-cyber');
                    onSelectModel?.('deepseek-v4-flash-cyber');
                    setIsModelMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    internalModel === 'deepseek-v4-flash-cyber'
                      ? "bg-white/[0.09] text-white font-bold border-white/[0.16] shadow-sm"
                      : "hover:bg-white/[0.04] text-zinc-300 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="w-4 h-4 text-zinc-200" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">Fathom Cyber</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">CYBER & INTEL</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        استخبارات سيبرانية، فحص الروابط، وبحث عميق (100+ مصدر)
                      </div>
                    </div>
                  </div>
                  {internalModel === 'deepseek-v4-flash-cyber' && (
                    <span className="size-1.5 rounded-full bg-white shrink-0 mr-2" />
                  )}
                </button>

                {/* Model 3: Fathom Cam */}
                {hasAttachments && (
                  <div className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans bg-white/[0.09] text-white font-bold border border-white/[0.16] shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                        <Camera className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">Fathom Cam</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">VISION</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                          تحليل بصري متعدد الطبقات واستخراج فوري للنصوص (OCR)
                        </div>
                      </div>
                    </div>
                    <span className="size-1.5 rounded-full bg-white shrink-0 mr-2" />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 3-Dots Actions Menu Popover */}
        {isActionsMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsActionsMenuOpen(false)}
            />
            <div
              dir="rtl"
              className="absolute bottom-full left-0 mb-3 w-[320px] sm:w-[350px] glass-popover rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-right select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.08] mb-2">
                <span className="text-xs font-sans font-bold text-white tracking-wide">أدوات الإدخال والاستخبارات</span>
                <span className="text-[9px] font-mono text-zinc-400 font-semibold tracking-wider">X1 CORE MATRIX</span>
              </div>

              <div className="space-y-1.5">
                {/* Action 1: Upload Image or File */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans hover:bg-white/[0.05] text-zinc-200 transition-colors cursor-pointer text-right group border border-transparent"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200 shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-semibold text-xs text-white truncate">رفع صورة أو مستند</div>
                      <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">استخراج النصوص (OCR) والتحليل البصري</div>
                    </div>
                  </div>
                </button>

                {/* Action 2: Target URL Scanner */}
                {isCyberMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      setIsTargetUrlBarOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans hover:bg-white/[0.05] text-zinc-200 transition-colors cursor-pointer text-right group border border-transparent"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200 shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="font-semibold text-xs text-white truncate">فحص واستطلاع رابط هدف</div>
                        <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">تحليل أمني للترويسات والمنافذ والسطح الهجومي</div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Action 3: Ultra-Deep Search Toggle (100+ Pages) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    toggleDeepSearch();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    isDeepSearchEffective
                      ? "bg-white/[0.08] border-white/[0.15] text-white"
                      : "hover:bg-white/[0.05] border-transparent text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                      isDeepSearchEffective
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] text-zinc-200 border-white/[0.08]"
                    )}>
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-semibold text-xs text-white truncate">البحث والاستخبارات العميقة</div>
                      <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">مسح واستكشاف 100+ صفحة ومصدر</div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 mr-2",
                    isDeepSearchEffective ? "bg-white text-black" : "bg-white/[0.04] text-zinc-400 border border-white/[0.08]"
                  )}>
                    {isDeepSearchEffective ? "مفعّل" : "معطّل"}
                  </span>
                </button>

                {/* Action 4: NSFW NANO Silicon Chip Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    onToggleX1?.();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    isX1Active
                      ? "bg-white/[0.08] border-white/[0.15] text-white"
                      : "hover:bg-white/[0.05] border-transparent text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                      isX1Active
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] text-zinc-200 border-white/[0.08]"
                    )}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-semibold text-xs text-white truncate">شريحة NSFW NANO</div>
                      <div className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">كسر القيود عبر البصمة الحيوية</div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 mr-2",
                    isX1Active ? "bg-white text-black" : "bg-white/[0.04] text-zinc-400 border border-white/[0.08]"
                  )}>
                    {isX1Active ? "مفعّلة" : "معطّلة"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Attachment Preview Row */}
        {hasAttachments && (
          <div className="mb-2 flex items-center gap-2 overflow-x-auto p-1.5 glass-card rounded-2xl no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                onClick={() => setActiveAttachment(attachment)}
                className="relative group shrink-0 size-14 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 cursor-pointer shadow-md"
              >
                {attachment.file.type.startsWith("image/") ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center p-1 bg-zinc-850 text-zinc-300">
                    <FileText className="w-5 h-5 text-rose-400" />
                    <span className="text-[8px] truncate max-w-[48px] mt-0.5">{attachment.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => removeAttachment(attachment.id, e)}
                  className="absolute top-1 left-1 size-4 rounded-full bg-zinc-950/80 text-zinc-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors shadow"
                  title="حذف المرفق"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= maxAttachments}
              className="shrink-0 size-14 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-850 flex flex-col items-center justify-center text-zinc-400 hover:text-white text-[10px] gap-0.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </div>
        )}

        {/* Chat Input Container Card */}
        <div
          className={cn(
            "relative w-full rounded-2xl sm:rounded-3xl glass-input-container transition-colors duration-150",
            isX1Active
              ? "border-rose-900/60"
              : isCyberMode
              ? "border-cyan-900/60"
              : "border-white/[0.09] focus-within:border-white/[0.22]"
          )}
        >
          {/* Streamlined Cyber Target URL Bar */}
          <AnimatePresence initial={false}>
            {(isTargetUrlBarOpen || cyberTargetUrl.trim() !== '') && !hasAttachments && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="p-2 sm:p-2.5 border-b border-white/[0.07] bg-cyan-950/30 rounded-t-2xl sm:rounded-t-3xl flex items-center gap-1.5 sm:gap-2">
                  <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/80 border border-cyan-900/60 focus-within:border-cyan-700 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold shrink-0">
                      TARGET URL
                    </span>
                    <input
                      type="url"
                      value={cyberTargetUrl}
                      onChange={(e) => setCyberTargetUrl(e.target.value)}
                      placeholder="أدخل رابط الهدف للفحص الأمني (https://example.com)..."
                      className="w-full bg-transparent text-xs sm:text-sm text-cyan-100 placeholder:text-zinc-500 outline-none font-mono dir-ltr text-left"
                      dir="ltr"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCyberSubmit();
                        }
                      }}
                    />
                    {cyberTargetUrl && (
                      <button
                        type="button"
                        onClick={() => setCyberTargetUrl('')}
                        className="text-zinc-400 hover:text-white p-0.5 rounded-full cursor-pointer transition-colors"
                        title="مسح الرابط"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTargetUrlBarOpen(false);
                      setCyberTargetUrl('');
                    }}
                    className="size-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="إلغاء وضع الرابط"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Text Area Row */}
          <div className="flex items-end gap-2 p-2.5 sm:p-3">
            
            {/* Auto-growing Textarea */}
            <div className="flex-1 relative min-h-[38px] flex items-center">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  (isCyberMode || isTargetUrlBarOpen || cyberTargetUrl)
                    ? "اسأل Fathom Cyber عن فحص الهدف، الثغرات، أو ترويسات الحماية..."
                    : isX1Active
                    ? "اسأل X1 MAX أي شيء بحرية تامة..."
                    : placeholder
                }
                rows={1}
                className="w-full bg-transparent text-zinc-100 text-[15px] sm:text-base leading-relaxed resize-none outline-none placeholder:text-zinc-500 font-sans max-h-36 min-h-[28px] py-1 px-1.5"
              />
            </div>

            {/* Action Button: Send / Stop */}
            <div className="shrink-0 flex items-center gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={onActionButtonClick}
                disabled={!hasValue && !isStreaming}
                className={cn(
                  "flex items-center justify-center size-9 sm:size-10 rounded-xl transition-all cursor-pointer select-none active:scale-95",
                  isStreaming
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : hasValue
                    ? isCyberMode
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                      : "bg-white hover:bg-zinc-200 text-zinc-950 font-bold"
                    : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
                )}
                title={isStreaming ? "إيقاف التوليد" : "إرسال"}
              >
                {isStreaming ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <ArrowUp className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]", isCyberMode ? "text-black" : "text-white")} />
                )}
              </button>
            </div>

          </div>

          {/* Bottom Toolbar (Models, Status Pills, 3-Dots Actions Menu) */}
          <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-t border-white/[0.06] bg-black/40 rounded-b-2xl sm:rounded-b-3xl text-xs">
            
            {/* Right Group: Model Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Interactive Model Selector Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelMenuOpen(!isModelMenuOpen);
                }}
                className={cn(
                  "glass-button flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-medium select-none shrink-0 cursor-pointer transition-all active:scale-95",
                  isCyberMode
                    ? "bg-cyan-950/40 border-cyan-800/60 text-cyan-200"
                    : isVisionMode
                    ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
                    : "text-zinc-200"
                )}
                title="تغيير نموذج الذكاء الاصطناعي"
              >
                {isCyberMode ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : isVisionMode ? (
                  <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                )}
                <span className="font-sans font-semibold text-[10px] sm:text-xs">
                  {activeModelDisplayName}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

            </div>

            {/* Left Group: Status Pills & 3-Dots Actions Menu */}
            <div className="flex items-center gap-1.5 mr-auto shrink-0">
              
              {/* NSFW Active Indicator Pill */}
              {isX1Active && (
                <span className="text-[10px] text-rose-300 font-mono bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-800/60 font-bold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  NSFW MAX
                </span>
              )}

              {/* Deep Search Active Indicator Pill */}
              {isDeepSearchEffective && (
                <button
                  type="button"
                  onClick={toggleDeepSearch}
                  className="text-[10px] text-cyan-200 font-mono bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-0.5 rounded-lg border border-cyan-800/60 font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                  title="البحث والاستخبارات العميقة مفعلة (100+ صفحة) - انقر للإلغاء"
                >
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  استخبارات (100+)
                  <X className="w-2.5 h-2.5 text-cyan-400 mr-0.5" />
                </button>
              )}

              {/* Target URL indicator pill when active */}
              {isCyberMode && isTargetUrlBarOpen && (
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/60 font-semibold">
                  وضع الرابط نشط
                </span>
              )}

              {/* 3-Dots Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionsMenuOpen(!isActionsMenuOpen);
                }}
                className={cn(
                  "glass-button size-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95",
                  isActionsMenuOpen
                    ? "bg-white/[0.12] text-white border-white/[0.25]"
                    : "text-zinc-300 hover:text-white"
                )}
                title="أدوات الإدخال والاستخبارات (البحث العميق، رفع ملف، فحص رابط)"
              >
                <MoreHorizontal className="w-4 h-4 text-zinc-300" />
              </button>

            </div>

          </div>

        </div>

        {/* Lightbox Modal */}
        {activeAttachment && (
          <AttachmentGalleryModal
            attachment={activeAttachment}
            onClose={() => setActiveAttachment(null)}
          />
        )}
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";
