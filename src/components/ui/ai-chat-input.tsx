"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn, detectAndExtractUrl, getFaviconUrl, extractAllCleanUrls, isMediaOrVideoUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ArrowUp,
  Square,
  Sparkles,
  Bot,
  Camera,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Globe,
  Terminal,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Search,
  Image as ImageIcon,
  ShieldOff,
  Zap,
  Video,
  Mic,
  Music,
  FileCode,
  FileType,
  FileSearch,
  Loader2
} from "lucide-react";
import { ModelType, MediaType } from "@/types";
import { classifyFileType, formatFileSize, formatMediaDuration, extractVideoClientMetadata, extractAudioClientMetadata, extractTextClientMetadata, extractVideoKeyframes } from "@/lib/mediaExtractor";
import { ThinkingOrb } from "@/components/ui/thinking-orbs";
import { SmartTooltip } from "@/components/ui/SmartTooltip";
import { PlatformLogo } from "@/components/ui/PlatformLogo";
import { ImageForensicsModal } from "@/components/ui/ImageForensicsModal";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
export interface Attachment {
  id: string;
  file: File;
  url: string;
  name: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  textSnippet?: string;
  size: number;
  uploadProgress?: number; // 0 - 100
  isProcessing?: boolean;
  keyframes?: string[];
}

export interface PromptInputProps {
  onSubmit?: (
    value: string,
    meta: {
      model: string;
      effort: string;
      attachments: File[];
      targetUrl?: string;
      targetUrls?: string[];
      deepSearch?: boolean;
      preloadedKeyframes?: Record<string, string[]>;
    }
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
function AttachmentPreviewModal({
  attachment,
  onClose,
  onOpenForensics
}: {
  attachment: Attachment;
  onClose: () => void;
  onOpenForensics?: (attachment: Attachment) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        className="fixed top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            {attachment.mediaType === 'image' && <Camera className="w-3.5 h-3.5 text-emerald-400" />}
            {attachment.mediaType === 'video' && <Video className="w-3.5 h-3.5 text-violet-400" />}
            {attachment.mediaType === 'audio' && <Music className="w-3.5 h-3.5 text-cyan-400" />}
            {attachment.mediaType === 'document' && <FileText className="w-3.5 h-3.5 text-amber-400" />}
            <span>{attachment.name}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
          {attachment.mediaType === 'video' ? (
            <video
              src={attachment.url}
              controls
              autoPlay
              className="max-h-[75vh] w-auto max-w-full rounded-lg shadow-md"
            />
          ) : attachment.mediaType === 'audio' ? (
            <div className="flex flex-col items-center gap-4 p-8 w-full max-w-md bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Music className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-white truncate max-w-xs">{attachment.name}</div>
                <div className="text-xs text-zinc-400 mt-1">{formatFileSize(attachment.size)}</div>
              </div>
              <audio src={attachment.url} controls className="w-full mt-2" />
            </div>
          ) : attachment.mediaType === 'document' ? (
            <div className="flex flex-col gap-3 w-full max-w-2xl">
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-3">
                <FileText className="w-6 h-6 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{attachment.name}</div>
                  <div className="text-xs text-zinc-400">{formatFileSize(attachment.size)}</div>
                </div>
              </div>
              {attachment.textSnippet && (
                <pre className="p-3 bg-black/60 rounded-xl text-xs text-zinc-300 font-mono overflow-auto max-h-60 whitespace-pre-wrap dir-ltr text-left border border-white/[0.06]">
                  {attachment.textSnippet}
                </pre>
              )}
            </div>
          ) : (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-md"
            />
          )}
        </div>
        <div className="p-3 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300 font-mono" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[150px] sm:max-w-md">{attachment.name}</span>
            <span className="text-zinc-400 font-mono">({formatFileSize(attachment.size)})</span>
          </div>
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
      placeholder = "اسأل Fathom 1.1 في أي شيء...",
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
    const [forensicModalSrc, setForensicModalSrc] = useState<string | File | Blob | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isTargetUrlBarOpen, setIsTargetUrlBarOpen] = useState(false);
    const [cyberInputUrl, setCyberInputUrl] = useState('');
    const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
    const [urlLimitToast, setUrlLimitToast] = useState<string | null>(null);
    const urlLimitTimerRef = useRef<any>(null);
    const [internalModel, setInternalModel] = useState<ModelType>(activeModel);
    const [internalDeepSearch, setInternalDeepSearch] = useState(false);

    const showUrlLimitToast = useCallback((msg: string = 'تم بلوغ الحد الأقصى المسموح به من الروابط (لا يمكن إضافة المزيد)') => {
      setUrlLimitToast(msg);
      if (urlLimitTimerRef.current) clearTimeout(urlLimitTimerRef.current);
      urlLimitTimerRef.current = setTimeout(() => {
        setUrlLimitToast(null);
      }, 3500);
    }, []);

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
    const hasUrls = attachedUrls.length > 0;
    const isAnyAttachmentProcessing = attachments.some(a => a.isProcessing || (a.uploadProgress !== undefined && a.uploadProgress < 100));
    const hasValue = (value.trim() !== "" || hasAttachments || hasUrls) && !isAnyAttachmentProcessing;

    // Detect if attachments contain videos, audio, or documents
    const hasNonImageMedia = attachments.some(a => a.mediaType === 'video' || a.mediaType === 'audio' || a.mediaType === 'document');

    const effectiveModel: ModelType = hasNonImageMedia
      ? 'meta/muse-spark-1.2-contributor'
      : hasAttachments
      ? 'deepseek-v4-flash-vision-exp'
      : hasUrls
      ? 'deepseek-v4-flash-cyber'
      : internalModel;

    const isVisionMode = effectiveModel === 'deepseek-v4-flash-vision-exp';
    const isCyber21Mode = effectiveModel === 'deepseek-v4-pro-cyber-2.1' || effectiveModel === 'deepseek-v4-flash-cyber-2.1';
    const isCyber20Mode = effectiveModel === 'deepseek-v4-flash-cyber';
    const isCyberMode = isCyber20Mode || isCyber21Mode;
    const isMediaMode = effectiveModel === 'meta/muse-spark-1.2-contributor';

    const activeModelDisplayName = isMediaMode
      ? "Fathom Spark"
      : isVisionMode
      ? "Fathom Cam"
      : isCyber21Mode
      ? "Fathom Cyber 2.1"
      : isCyber20Mode
      ? "Fathom Cyber 2.0"
      : "Fathom 1.1";

    const activeBackendModel = effectiveModel;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddCyberUrl = useCallback((rawUrlToAdd: string) => {
      const trimmed = rawUrlToAdd.trim();
      if (!trimmed) return;
      const extracted = extractAllCleanUrls(trimmed, 5);
      if (extracted.urls.length > 0) {
        setAttachedUrls((prev) => {
          const newOnes = extracted.urls.filter(u => !prev.includes(u));
          if (prev.length + newOnes.length > 5 || extracted.isLimitExceeded) {
            showUrlLimitToast();
          }
          const combined = [...prev, ...newOnes].slice(0, 5);
          return combined;
        });
        setCyberInputUrl('');
        setInternalModel('deepseek-v4-flash-cyber');
        onSelectModel?.('deepseek-v4-flash-cyber');
      }
    }, [onSelectModel, showUrlLimitToast]);

    const triggerFileInput = useCallback((acceptType?: 'all' | 'video' | 'audio' | 'image' | 'doc') => {
      if (!fileInputRef.current) return;
      if (acceptType === 'video') {
        fileInputRef.current.accept = "video/*";
        setInternalModel('meta/muse-spark-1.2-contributor');
        onSelectModel?.('meta/muse-spark-1.2-contributor');
      } else if (acceptType === 'audio') {
        fileInputRef.current.accept = "audio/*";
        setInternalModel('meta/muse-spark-1.2-contributor');
        onSelectModel?.('meta/muse-spark-1.2-contributor');
      } else if (acceptType === 'doc') {
        fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.py,.js,.ts,.tsx,.jsx,.html,.css,.sql,.yaml,.yml,.zip";
        setInternalModel('meta/muse-spark-1.2-contributor');
        onSelectModel?.('meta/muse-spark-1.2-contributor');
      } else if (acceptType === 'image') {
        fileInputRef.current.accept = "image/*";
        setInternalModel('deepseek-v4-flash-vision-exp');
        onSelectModel?.('deepseek-v4-flash-vision-exp');
      } else {
        fileInputRef.current.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.py,.js,.ts,.tsx,.jsx,.html,.css,.sql,.yaml,.yml,.zip";
      }
      fileInputRef.current.click();
    }, [onSelectModel]);

    const handleValueChange = useCallback(
      (val: string) => {
        // Auto-detect standalone URL(s) entered into textarea and move directly to attachedUrls
        const trimmed = val.trim();
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.'))) {
          const extracted = extractAllCleanUrls(trimmed, 5);
          if (extracted.urls.length > 0 && !extracted.remainingText.trim()) {
            setAttachedUrls((prev) => {
              const newOnes = extracted.urls.filter(u => !prev.includes(u));
              if (prev.length + newOnes.length > 5 || extracted.isLimitExceeded) {
                showUrlLimitToast();
              }
              return [...prev, ...newOnes].slice(0, 5);
            });
            setInternalModel('deepseek-v4-flash-cyber');
            onSelectModel?.('deepseek-v4-flash-cyber');
            if (!isControlled) setLocalValue('');
            onChange?.('');
            return;
          }
        }

        if (!isControlled) setLocalValue(val);
        onChange?.(val);
      },
      [isControlled, onChange, onSelectModel, showUrlLimitToast]
    );

    // Helper to convert any File to a persistent Attachment with real natural dimensions & metadata
    const processFileToAttachment = useCallback(async (file: File, fallbackName?: string): Promise<Attachment> => {
      const mediaType = classifyFileType(file);
      const id = `${file.name || 'file'}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (mediaType === 'image') {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = (e.target?.result as string) || '';
            const img = new Image();
            img.onload = () => {
              resolve({
                id,
                file,
                url: dataUrl,
                name: file.name || fallbackName || 'صورة مرفقة',
                mediaType: 'image',
                width: img.naturalWidth || 800,
                height: img.naturalHeight || 600,
                size: file.size,
              });
            };
            img.onerror = () => {
              resolve({
                id,
                file,
                url: dataUrl,
                name: file.name || fallbackName || 'صورة مرفقة',
                mediaType: 'image',
                width: 800,
                height: 600,
                size: file.size,
              });
            };
            img.src = dataUrl;
          };
          reader.onerror = () => {
            const objectUrl = URL.createObjectURL(file);
            resolve({
              id,
              file,
              url: objectUrl,
              name: file.name || fallbackName || 'صورة مرفقة',
              mediaType: 'image',
              width: 800,
              height: 600,
              size: file.size,
            });
          };
          reader.readAsDataURL(file);
        });
      } else if (mediaType === 'video') {
        const objectUrl = URL.createObjectURL(file);
        
        // Return initial attachment in processing state so user sees preview immediately
        const initialAttachment: Attachment = {
          id,
          file,
          url: objectUrl,
          thumbnailUrl: objectUrl,
          name: file.name || fallbackName || 'فيديو مرفق',
          mediaType: 'video',
          size: file.size,
          uploadProgress: 25,
          isProcessing: true,
          keyframes: [],
        };

        // Asynchronously process metadata and keyframes in background with progress updates
        setTimeout(async () => {
          try {
            // Step 1: Metadata extraction
            setAttachments(prev => prev.map(a => a.id === id ? { ...a, uploadProgress: 45 } : a));
            const meta = await extractVideoClientMetadata(file);
            setAttachments(prev => prev.map(a => a.id === id ? {
              ...a,
              duration: meta.duration,
              width: meta.width,
              height: meta.height,
              thumbnailUrl: meta.thumbnailUrl || objectUrl,
              uploadProgress: 70,
            } : a));

            // Step 2: Keyframe optical extraction across duration
            const keyframes = await extractVideoKeyframes(file, 5);
            setAttachments(prev => prev.map(a => a.id === id ? {
              ...a,
              keyframes,
              uploadProgress: 95,
            } : a));

            // Step 3: Complete ready state
            setTimeout(() => {
              setAttachments(prev => prev.map(a => a.id === id ? {
                ...a,
                uploadProgress: 100,
                isProcessing: false,
              } : a));
            }, 200);
          } catch (err) {
            console.warn('[Smart video processing error]:', err);
            setAttachments(prev => prev.map(a => a.id === id ? {
              ...a,
              uploadProgress: 100,
              isProcessing: false,
            } : a));
          }
        }, 30);

        return initialAttachment;
      } else if (mediaType === 'audio') {
        const objectUrl = URL.createObjectURL(file);
        const meta = await extractAudioClientMetadata(file);
        return {
          id,
          file,
          url: objectUrl,
          name: file.name || fallbackName || 'ملف صوتي',
          mediaType: 'audio',
          duration: meta.duration,
          size: file.size,
        };
      } else {
        const objectUrl = URL.createObjectURL(file);
        const textMeta = await extractTextClientMetadata(file);
        return {
          id,
          file,
          url: objectUrl,
          name: file.name || fallbackName || 'مستند مرفق',
          mediaType: 'document',
          textSnippet: textMeta.textSnippet,
          size: file.size,
        };
      }
    }, []);

    // Image and URL Paste Handler
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement> | ClipboardEvent) => {
      const clipboardData = 'clipboardData' in e ? e.clipboardData : null;
      if (!clipboardData) return;

      // 1. Check for Image Files in Clipboard
      const imageFiles: File[] = [];
      const seenInThisEvent = new Set<string>();

      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const key = `${file.name}-${file.size}-${file.type}`;
              if (!seenInThisEvent.has(key)) {
                seenInThisEvent.add(key);
                imageFiles.push(file);
              }
            }
          }
        }
      } else if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type && file.type.startsWith('image/')) {
            const key = `${file.name}-${file.size}-${file.type}`;
            if (!seenInThisEvent.has(key)) {
              seenInThisEvent.add(key);
              imageFiles.push(file);
            }
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
        
        Promise.all(imageFiles.map((f, idx) => processFileToAttachment(f, `صورة ملصقة ${idx + 1}`))).then((newAtts) => {
          setAttachments((prev) => {
            const existingKeys = new Set(prev.map((a) => `${a.file.name}-${a.file.size}`));
            const nonDuplicate = newAtts.filter((a) => !existingKeys.has(`${a.file.name}-${a.file.size}`));
            const currentCount = prev.length;
            const remainingSlots = Math.max(0, 5 - currentCount);
            if (remainingSlots <= 0 || nonDuplicate.length === 0) return prev;
            return [...prev, ...nonDuplicate.slice(0, remainingSlots)];
          });
        });
        return;
      }

      // 2. Check for URLs in Text — Multi-link extraction up to 5 URLs
      const pastedText = clipboardData.getData('text');
      if (!pastedText) return;

      const extracted = extractAllCleanUrls(pastedText, 10);
      if (extracted.urls.length > 0) {
        e.preventDefault();
        setAttachedUrls((prev) => {
          const newOnes = extracted.urls.filter(u => !prev.includes(u));
          if (prev.length + newOnes.length > 5 || extracted.isLimitExceeded) {
            showUrlLimitToast();
          }
          const combined = [...prev, ...newOnes].slice(0, 5);
          return combined;
        });

        // Always activate Fathom Cyber URL Mode on link detection
        setInternalModel('deepseek-v4-flash-cyber');
        onSelectModel?.('deepseek-v4-flash-cyber');

        if (extracted.remainingText) {
          const existingValue = value.trim();
          const nextVal = existingValue ? `${existingValue} ${extracted.remainingText}` : extracted.remainingText;
          if (!isControlled) setLocalValue(nextVal);
          onChange?.(nextVal);
        }
        return;
      }
    }, [value, isControlled, onChange, processFileToAttachment, showUrlLimitToast, onSelectModel]);

    // Global paste listener so pasting images works from anywhere on page without duplicating textarea paste
    useEffect(() => {
      const handleGlobalPaste = (e: ClipboardEvent) => {
        if (e.defaultPrevented) return;
        // If the focused element is the textarea or another input, let onPaste handle it directly
        if (
          document.activeElement &&
          (document.activeElement === textareaRef.current ||
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA')
        ) {
          return;
        }
        handlePaste(e);
      };
      window.addEventListener('paste', handleGlobalPaste);
      return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [handlePaste]);

    // Auto-adjust textarea height cleanly on input with zero scroll jumping
    const adjustTextareaHeight = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "0px";
      const scrollHeight = el.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 38), 180);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = scrollHeight > 180 ? 'auto' : 'hidden';
    }, []);

    useEffect(() => {
      adjustTextareaHeight();
    }, [value, adjustTextareaHeight]);

    const handleSubmit = () => {
      if (isStreaming) {
        onAbort?.();
        return;
      }

      // Check for URLs embedded in current text as well
      const inlineExtracted = extractAllCleanUrls(value, 5);
      const allUrlsToSubmit = Array.from(new Set([...attachedUrls, ...inlineExtracted.urls])).slice(0, 5);

      if (isAnyAttachmentProcessing) return;
      if (value.trim() === "" && !hasAttachments && allUrlsToSubmit.length === 0) return;

      let effectivePrompt = value.trim();
      if (inlineExtracted.urls.length > 0 && inlineExtracted.remainingText) {
        effectivePrompt = inlineExtracted.remainingText;
      }

      let formattedContent = effectivePrompt;
      if (allUrlsToSubmit.length > 0) {
        const urlsSection = allUrlsToSubmit.join('\n');
        formattedContent = effectivePrompt ? `${urlsSection}\n\n${effectivePrompt}` : urlsSection;
      } else if (!effectivePrompt && hasAttachments) {
        formattedContent = "حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.";
      }

      const targetModel = (hasAttachments)
        ? 'deepseek-v4-flash-vision-exp'
        : (allUrlsToSubmit.length > 0 && internalModel === 'deepseek-v4-flash' ? 'deepseek-v4-flash-cyber' : activeBackendModel);

      const preloadedKeyframes: Record<string, string[]> = {};
      attachments.forEach((a) => {
        if (a.mediaType === 'video' && a.keyframes && a.keyframes.length > 0) {
          preloadedKeyframes[a.file.name] = a.keyframes;
        }
      });

      onSubmit?.(formattedContent, {
        model: targetModel,
        effort: isX1Active ? "X1 MAX" : "Standard",
        attachments: attachments.map((a) => a.file),
        targetUrl: allUrlsToSubmit[0] || undefined,
        targetUrls: allUrlsToSubmit.length > 0 ? allUrlsToSubmit : undefined,
        deepSearch: isDeepSearchEffective,
        preloadedKeyframes,
      });

      handleValueChange("");
      setAttachedUrls([]);
      setAttachments([]);
      setIsTargetUrlBarOpen(false);
      setCyberInputUrl('');

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (fileInputRef.current) {
        fileInputRef.current.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.py,.js,.ts,.tsx,.jsx,.html,.css,.sql,.yaml,.yml,.zip";
      }

      if (files.length === 0) return;
      const processed = await Promise.all(files.map((f, idx) => processFileToAttachment(f, `ملف مرفق ${idx + 1}`)));
      setAttachments((prev) => {
        const existingKeys = new Set(prev.map((a) => `${a.file.name}-${a.file.size}`));
        const nonDuplicate = processed.filter((a) => !existingKeys.has(`${a.file.name}-${a.file.size}`));
        const currentCount = prev.length;
        const remainingSlots = Math.max(0, maxAttachments - currentCount);
        if (remainingSlots <= 0 || nonDuplicate.length === 0) return prev;
        return [...prev, ...nonDuplicate.slice(0, remainingSlots)];
      });
    };

    const removeAttachment = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const onActionButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isStreaming) {
        onAbort?.();
      } else if (hasValue) {
        handleSubmit();
      }
    };

    // Emergent Intelligent Tool Fusion Logic
    const activeFusion = useMemo(() => {
      const hasSearch = isDeepSearchEffective;
      const hasCyber = isCyberMode || hasUrls;
      const hasVision = hasAttachments || isVisionMode;
      const hasMedia = isMediaMode || hasNonImageMedia;
      const hasNSFW = isX1Active;

      // 0. Media / Spark Mode with Video/Audio
      if (hasMedia) {
        return {
          type: 'media',
          placeholder: 'محرك Fathom Spark: حلل الفيديوهات، استمع للصوتيات، وافحص المستندات...',
          beamClass: 'media-beam',
          textColor: 'text-violet-100 placeholder:text-violet-300/50 selection:bg-violet-500/40',
          sendGradient: 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 text-white',
          topSheen: 'bg-gradient-to-r from-transparent via-violet-400 to-transparent',
        };
      }

      // 1. NSFW + Deep Search Fusion (Crimson Ruby & Emerald Green)
      if (hasNSFW && hasSearch) {
        return {
          type: 'nsfw-search',
          placeholder: 'استكشاف حر وبحث مباشر في الويب دون أي قيود...',
          beamClass: 'nsfw-search-beam',
          textColor: 'text-rose-50 placeholder:text-rose-300/50 selection:bg-emerald-500/40',
          sendGradient: 'bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-400 text-white',
          topSheen: 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent',
        };
      }

      // 2. NSFW + Cyber Mode Fusion (Cyber Ruby & Electric Cyan)
      if (hasNSFW && hasCyber) {
        return {
          type: 'nsfw-cyber',
          placeholder: 'فحص أمني واستخبارات سيبرانية متقدمة بحرية كاملة...',
          beamClass: 'nsfw-cyber-beam',
          textColor: 'text-cyan-50 placeholder:text-rose-300/50 selection:bg-rose-500/40',
          sendGradient: 'bg-gradient-to-r from-cyan-400 to-rose-500 text-black',
          topSheen: 'bg-gradient-to-r from-transparent via-rose-400 to-transparent',
        };
      }

      // 3. NSFW + Vision Mode Fusion (Emerald Ruby Plasma)
      if (hasNSFW && hasVision) {
        return {
          type: 'nsfw-vision',
          placeholder: 'تحليل بصري حر واستكشاف الصور دون أي حظر أو فلاتر...',
          beamClass: 'nsfw-vision-beam',
          textColor: 'text-emerald-50 placeholder:text-rose-300/50 selection:bg-rose-500/40',
          sendGradient: 'bg-gradient-to-r from-emerald-400 to-rose-500 text-black',
          topSheen: 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent',
        };
      }

      // 4. Cyber + Deep Search
      if (hasSearch && hasCyber) {
        return {
          type: 'cyber-search',
          placeholder: 'استخبارات سيبرانية: افحص الهدف واستكشف الويب...',
          beamClass: 'cyber-search-beam',
          textColor: 'text-cyan-100 placeholder:text-cyan-300/50 selection:bg-cyan-500/40',
          sendGradient: 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black',
          topSheen: 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent',
        };
      }

      // 5. Cyber + Vision
      if (hasVision && hasCyber) {
        return {
          type: 'cyber-vision',
          placeholder: 'تحليل جنائي: افحص الأكواد والصور المستهدفة...',
          beamClass: 'cyber-vision-beam',
          textColor: 'text-emerald-100 placeholder:text-emerald-300/50 selection:bg-emerald-500/40',
          sendGradient: 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-black',
          topSheen: 'bg-gradient-to-r from-transparent via-teal-400 to-transparent',
        };
      }

      // 6. Vision + Deep Search
      if (hasVision && hasSearch) {
        return {
          type: 'vision-search',
          placeholder: 'بحث بصري: حلل الصورة واستكشف الويب...',
          beamClass: 'vision-search-beam',
          textColor: 'text-emerald-100 placeholder:text-emerald-300/50 selection:bg-emerald-500/40',
          sendGradient: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black',
          topSheen: 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent',
        };
      }

      return null;
    }, [isDeepSearchEffective, isCyberMode, hasUrls, hasAttachments, isVisionMode, isMediaMode, hasNonImageMedia, isX1Active]);

    const isSpecialMode = Boolean(activeFusion || isDeepSearchEffective || isCyberMode || isX1Active || hasAttachments || hasUrls || isMediaMode);

    const currentBeamType = activeFusion
      ? activeFusion.type
      : isMediaMode || hasNonImageMedia
      ? 'media'
      : isDeepSearchEffective
      ? 'search'
      : isCyberMode || hasUrls
      ? 'cyber'
      : isX1Active
      ? 'nsfw'
      : hasAttachments
      ? 'vision'
      : null;

    // Dynamic Tool & Light Theme Palette matching the active tool's ambient light & glow
    const currentThemeColor = useMemo(() => {
      if (activeFusion) {
        return {
          strokeRing: 'stroke-fuchsia-400',
          textPercent: 'text-fuchsia-300',
          textAccent: 'text-fuchsia-400',
          bgLoader: 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300',
          spinnerColor: 'text-fuchsia-400',
          sheen: activeFusion.topSheen,
        };
      }
      if (isMediaMode || hasNonImageMedia) {
        // Fathom Spark (Video/Audio/Docs) - Violet / Purple / Fuchsia
        return {
          strokeRing: 'stroke-violet-400',
          textPercent: 'text-violet-300',
          textAccent: 'text-violet-400',
          bgLoader: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
          spinnerColor: 'text-violet-400',
          sheen: 'bg-gradient-to-r from-transparent via-violet-400 to-transparent',
        };
      }
      if (isDeepSearchEffective) {
        // Fathom Search - Emerald / Teal
        return {
          strokeRing: 'stroke-emerald-400',
          textPercent: 'text-emerald-300',
          textAccent: 'text-emerald-400',
          bgLoader: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
          spinnerColor: 'text-emerald-400',
          sheen: 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent',
        };
      }
      if (isCyberMode || hasUrls) {
        // Fathom Cyber 1.1 - Cyan
        return {
          strokeRing: 'stroke-cyan-400',
          textPercent: 'text-cyan-300',
          textAccent: 'text-cyan-400',
          bgLoader: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
          spinnerColor: 'text-cyan-400',
          sheen: 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent',
        };
      }
      if (isX1Active) {
        // NSFW Mode - Rose
        return {
          strokeRing: 'stroke-rose-400',
          textPercent: 'text-rose-300',
          textAccent: 'text-rose-400',
          bgLoader: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
          spinnerColor: 'text-rose-400',
          sheen: 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
        };
      }
      if (isVisionMode || hasAttachments) {
        // Fathom Cam - Emerald
        return {
          strokeRing: 'stroke-emerald-400',
          textPercent: 'text-emerald-300',
          textAccent: 'text-emerald-400',
          bgLoader: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
          spinnerColor: 'text-emerald-400',
          sheen: 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent',
        };
      }
      // Default Fathom 1.1 - White / Silver
      return {
        strokeRing: 'stroke-white',
        textPercent: 'text-white',
        textAccent: 'text-white',
        bgLoader: 'bg-white/15 border-white/25 text-white',
        spinnerColor: 'text-white',
        sheen: 'bg-gradient-to-r from-transparent via-white/40 to-transparent',
      };
    }, [activeFusion, isMediaMode, hasNonImageMedia, isDeepSearchEffective, isCyberMode, hasUrls, isX1Active, isVisionMode, hasAttachments]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col w-full max-w-3xl mx-auto px-1 sm:px-0 select-none",
          className
        )}
        dir="rtl"
      >
        {/* Hidden File Input (Universal Multimedia & Document Support) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.py,.js,.ts,.tsx,.jsx,.html,.css,.sql,.yaml,.yml,.zip"
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
              className="absolute bottom-full right-2 mb-3 w-[315px] sm:w-[345px] glass-popover rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-right select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1.5 border-b border-white/[0.08] mb-2">
                <span className="text-xs font-sans font-bold text-white tracking-wide">اختيار النموذج</span>
              </div>

              <div className="space-y-1.5">
                {/* Model 1: Fathom 1.1 */}
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
                      <Zap className="w-4 h-4 text-zinc-100 fill-zinc-100/40 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-xs text-white">Fathom 1.1</div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        توليد لغوي حر وتحليل فكري متقدم
                      </div>
                    </div>
                  </div>
                </button>

                {/* Model 2: Fathom Cyber 2.0 */}
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
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-nowrap">
                        <span className="shrink-0">Fathom Cyber 2.0</span>
                        <span className="text-[9.5px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.14] text-zinc-200 shadow-sm shrink-0">
                          New
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        استخبارات أمنية وهندسة سيبرانية سيادية مع الذاكرة العرضية والدلالية الديناميكية
                      </div>
                    </div>
                  </div>
                </button>

                {/* Model 2.1: Fathom Cyber 2.1 (Super Thinking & O-H-E-U Discovery) */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalModel('deepseek-v4-pro-cyber-2.1');
                    onSelectModel?.('deepseek-v4-pro-cyber-2.1');
                    setIsModelMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    internalModel === 'deepseek-v4-pro-cyber-2.1' || internalModel === 'deepseek-v4-flash-cyber-2.1'
                      ? "bg-white/[0.09] text-white font-bold border-white/[0.16] shadow-sm"
                      : "hover:bg-white/[0.04] text-zinc-300 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-nowrap">
                        <span className="shrink-0">Fathom Cyber 2.1</span>
                        <span className="text-[9.5px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.14] text-zinc-200 shadow-sm shrink-0">
                          New
                        </span>
                        <span className="text-[9.5px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.14] text-zinc-200 shadow-sm shrink-0">
                          Super Thinking
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 font-normal leading-relaxed mt-0.5">
                        استدلال اختطافي فائق واكتشاف علمي مؤتمت مع هندسة سيبرانية سيادية متقدمة
                      </div>
                    </div>
                  </div>
                </button>

                {/* Model 3: Fathom Cam */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalModel('deepseek-v4-flash-vision-exp');
                    onSelectModel?.('deepseek-v4-flash-vision-exp');
                    setIsModelMenuOpen(false);
                    if (attachments.length === 0) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    internalModel === 'deepseek-v4-flash-vision-exp' && !hasNonImageMedia
                      ? "bg-white/[0.09] text-white font-bold border-white/[0.16] shadow-sm"
                      : "hover:bg-white/[0.04] text-zinc-300 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                      <Camera className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-xs text-white">Fathom Cam</div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        تحليل بصري، قراءة المستندات، واستخراج الصور
                      </div>
                    </div>
                  </div>
                </button>

                {/* Model 4: Fathom Spark (Meta Muse Spark 1.2) */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalModel('meta/muse-spark-1.2-contributor');
                    onSelectModel?.('meta/muse-spark-1.2-contributor');
                    setIsModelMenuOpen(false);
                    if (attachments.length === 0) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    internalModel === 'meta/muse-spark-1.2-contributor' || hasNonImageMedia
                      ? "bg-white/[0.09] text-white font-bold border-white/[0.16] shadow-sm"
                      : "hover:bg-white/[0.04] text-zinc-300 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="font-bold text-xs text-white">Fathom Spark</div>
                      <div className="text-[11px] text-zinc-400 font-normal leading-relaxed mt-0.5">
                        استيعاب شامل للفيديوهات، الصوتيات، والملفات
                      </div>
                    </div>
                  </div>
                </button>
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
              className="absolute bottom-full left-0 mb-3 w-[280px] sm:w-[300px] glass-popover rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1 border-b border-white/[0.08] mb-1.5">
                <span className="text-xs font-sans font-bold text-white tracking-wide">أدوات إضافية</span>
              </div>

              <div className="space-y-1">
                {/* Action 1: Upload Video */}
                <button
                  type="button"
                  onClick={() => {
                    triggerFileInput('video');
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-xs font-sans text-zinc-200 hover:text-white transition-all cursor-pointer text-right group border border-transparent hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400 group-hover:text-violet-300 shrink-0">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">رفع فيديو</span>
                  </div>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">Spark</span>
                </button>

                {/* Action 2: Upload Audio */}
                <button
                  type="button"
                  onClick={() => {
                    triggerFileInput('audio');
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-xs font-sans text-zinc-200 hover:text-white transition-all cursor-pointer text-right group border border-transparent hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-400 group-hover:text-violet-300 shrink-0">
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">رفع صوت أو تسجيل</span>
                  </div>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">Spark</span>
                </button>

                {/* Action 3: Upload Image */}
                <button
                  type="button"
                  onClick={() => {
                    triggerFileInput('image');
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-xs font-sans text-zinc-200 hover:text-white transition-all cursor-pointer text-right group border border-transparent hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 shrink-0">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">رفع صورة وفحص بصري</span>
                  </div>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">Cam</span>
                </button>

                {/* Action 4: Upload Document / Code */}
                <button
                  type="button"
                  onClick={() => {
                    triggerFileInput('doc');
                    setIsActionsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-xs font-sans text-zinc-200 hover:text-white transition-all cursor-pointer text-right group border border-transparent hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">رفع مستند أو كود</span>
                  </div>
                </button>

                {/* Action 5: Target URL Scanner */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCyberMode) {
                      setInternalModel('deepseek-v4-flash-cyber');
                      onSelectModel?.('deepseek-v4-flash-cyber');
                    }
                    setIsTargetUrlBarOpen(true);
                    setIsActionsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    isCyberMode || attachedUrls.length > 0
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
                      : "hover:bg-white/[0.06] text-zinc-200 hover:text-white border-transparent hover:border-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                      isCyberMode || attachedUrls.length > 0
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-white/[0.04] border-white/[0.08] text-cyan-400"
                    )}>
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">فحص واستطلاع رابط (URL)</span>
                  </div>
                  {attachedUrls.length > 0 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold">
                      {attachedUrls.length} روابط
                    </span>
                  ) : (
                    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium">Cyber</span>
                  )}
                </button>

                {/* Action 6: Deep Search Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    toggleDeepSearch();
                    setIsActionsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    isDeepSearchEffective
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "hover:bg-white/[0.06] text-zinc-200 hover:text-white border-transparent hover:border-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                      isDeepSearchEffective
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/[0.04] border-white/[0.08] text-emerald-400"
                    )}>
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">البحث في الويب</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0",
                    isDeepSearchEffective
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                      : "bg-white/[0.04] border-white/[0.08] text-zinc-400"
                  )}>
                    {isDeepSearchEffective ? 'مفعّل' : 'معطّل'}
                  </span>
                </button>

                {/* Action 7: NSFW Off Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleX1?.();
                    setIsActionsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl text-xs font-sans transition-all cursor-pointer text-right border",
                    isX1Active
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                      : "hover:bg-white/[0.06] text-zinc-200 hover:text-white border-transparent hover:border-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                      isX1Active
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-white/[0.04] border-white/[0.08] text-rose-400"
                    )}>
                      <ShieldOff className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">وضع NSFW Off</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0",
                    isX1Active
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold"
                      : "bg-white/[0.04] border-white/[0.08] text-zinc-400"
                  )}>
                    {isX1Active ? 'مفعّل' : 'معطّل'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Dynamic URL Limit Notification Toast (Self-Dismissing Alert Banner) */}
        <AnimatePresence>
          {urlLimitToast && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-3 inset-x-2 sm:inset-x-6 p-3 rounded-2xl bg-[#141008]/95 border border-amber-500/40 backdrop-blur-2xl text-amber-200 text-xs font-sans font-bold flex items-center justify-between shadow-2xl z-50 select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="leading-snug">{urlLimitToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setUrlLimitToast(null)}
                className="size-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Previews Bar */}
        {hasAttachments && (
          <div className="mb-2 p-2.5 rounded-2xl glass-card border border-white/[0.08] bg-black/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-sans text-zinc-300 font-medium flex items-center gap-1.5">
                {hasNonImageMedia ? (
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>الملفات والوسائط المرفقة ({attachments.length} من {maxAttachments})</span>
              </span>
              <button
                type="button"
                onClick={() => setAttachments([])}
                className="text-[10px] font-sans text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                مسح الكل
              </button>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {attachments.map((att, idx) => (
                <div
                  key={att.id}
                  className="relative group shrink-0 h-16 min-w-16 rounded-xl overflow-hidden border border-white/[0.18] bg-zinc-950/80 cursor-pointer shadow-md flex items-center justify-center"
                  onClick={() => setActiveAttachment(att)}
                >
                  {att.mediaType === 'video' ? (
                    <div className="w-24 h-full relative bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {att.thumbnailUrl ? (
                        <img src={att.thumbnailUrl} alt={att.name} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="size-full bg-violet-950/60 flex items-center justify-center">
                          <Video className="w-5 h-5 text-violet-400" />
                        </div>
                      )}
                      {/* Circular Progress Bar during video loading & keyframe extraction */}
                      {att.isProcessing ? (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 select-none">
                          <div className="relative size-9 flex items-center justify-center">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="14"
                                className="stroke-white/20 fill-none"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="14"
                                className={cn("fill-none transition-all duration-300 ease-out", currentThemeColor.strokeRing)}
                                strokeWidth="3"
                                strokeDasharray="87.96"
                                strokeDashoffset={87.96 - (87.96 * (att.uploadProgress || 0)) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className={cn("absolute font-mono text-[9px] font-bold", currentThemeColor.textPercent)}>
                              {att.uploadProgress || 0}%
                            </span>
                          </div>
                          <span className={cn("text-[7px] font-sans mt-0.5 animate-pulse font-medium", currentThemeColor.textPercent)}>جاري الرفع...</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                          <div className="size-6 rounded-full bg-black/80 border border-white/20 flex items-center justify-center shadow-none">
                            <Video className="w-3 h-3 text-white/90" />
                          </div>
                        </div>
                      )}
                      {att.duration ? (
                        <span className="absolute bottom-1 left-1 text-[8px] font-mono px-1 rounded bg-black/80 text-zinc-200">
                          {formatMediaDuration(att.duration)}
                        </span>
                      ) : null}
                    </div>
                  ) : att.mediaType === 'audio' ? (
                    <div className="w-24 h-full p-1.5 bg-zinc-900 flex flex-col justify-center items-center gap-1 border border-violet-500/20">
                      <div className="size-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                        <Music className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] text-zinc-300 truncate max-w-[80px] font-mono">{att.name}</span>
                      {att.duration ? (
                        <span className="text-[8px] text-zinc-400 font-mono">{formatMediaDuration(att.duration)}</span>
                      ) : null}
                    </div>
                  ) : att.mediaType === 'document' ? (
                    <div className="w-24 h-full p-1.5 bg-zinc-900 flex flex-col justify-center items-center gap-1 border border-cyan-500/20">
                      <div className="size-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <FileText className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] text-zinc-300 truncate max-w-[80px] font-mono">{att.name}</span>
                      <span className="text-[8px] text-zinc-400 font-mono">{formatFileSize(att.size)}</span>
                    </div>
                  ) : (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="size-16 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  )}

                  {/* Geometric Circular Number Badge */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 min-w-[16px] min-h-[16px] aspect-square rounded-full bg-zinc-900/90 text-zinc-200 border border-white/[0.3] flex items-center justify-center font-bold text-[9px] shrink-0 font-mono shadow-inner select-none backdrop-blur-md">
                    {idx + 1}
                  </div>

                  {/* Quick Forensics Button for Images */}
                  {att.mediaType === 'image' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForensicModalSrc(att.file || att.url);
                      }}
                      className="absolute bottom-1 left-1 size-5 rounded-md bg-black/80 hover:bg-black text-cyan-300 border border-cyan-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow"
                      title="فحص الميتاداتا والأدلة (EXIF / GPS)"
                    >
                      <FileSearch className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachments((prev) => prev.filter(a => a.id !== att.id));
                    }}
                    className="absolute top-1 left-1 size-4 rounded-full bg-black/80 text-zinc-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {attachments.length < maxAttachments && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 size-16 rounded-xl border border-dashed border-white/[0.15] hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.06] flex flex-col items-center justify-center text-zinc-400 hover:text-white text-[10px] gap-1 transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-4 h-4 text-zinc-300" />
                  <span>إضافة</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat Input Container Card */}
        <div
          className={cn(
            "relative w-full rounded-3xl transition-all duration-300",
            isSpecialMode
              ? "p-[1.5px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
              : "bg-[#09090d]/80 backdrop-blur-2xl border border-white/[0.12] hover:border-white/[0.22] focus-within:border-white/[0.45] shadow-[0_16px_45px_rgba(0,0,0,0.85)]"
          )}
        >
          {/* Continuous Persistent Dynamic Mode Orbit System (Never restarts rotation) */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-300 rounded-3xl",
              isSpecialMode ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="persistent-beam-rotor">
              <div className={cn("beam-gradient-layer beam-layer-search", currentBeamType === 'search' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-cyber", currentBeamType === 'cyber' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-nsfw", currentBeamType === 'nsfw' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-vision", currentBeamType === 'vision' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-media", currentBeamType === 'media' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-nsfw-search", currentBeamType === 'nsfw-search' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-nsfw-cyber", currentBeamType === 'nsfw-cyber' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-nsfw-vision", currentBeamType === 'nsfw-vision' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-cyber-search", currentBeamType === 'cyber-search' ? "opacity-100" : "opacity-0")} />
              <div className={cn("beam-gradient-layer beam-layer-cyber-vision", currentBeamType === 'cyber-vision' ? "opacity-100" : "opacity-0")} />
            </div>
          </div>

          {/* Inner Content Container - Always fully opaque bg to keep beam strictly on border */}
          <div
            className="relative w-full h-full rounded-[23px] transition-colors duration-200 bg-[#09090d] backdrop-blur-3xl z-10"
          >
            {/* Top Sheen Edge Line */}
            <div
              className={cn(
                "absolute top-0 inset-x-8 h-[1px] rounded-full pointer-events-none transition-all duration-500 z-20",
                !isSpecialMode ? "opacity-0" : cn(currentThemeColor.sheen, "opacity-90")
              )}
            />

            {/* Target URL Input Bar */}
            <AnimatePresence initial={false}>
              {isTargetUrlBarOpen && !hasAttachments && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 sm:p-2.5 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl rounded-t-3xl flex items-center gap-2 px-3 sm:px-4">
                    <div className="size-7 rounded-xl bg-zinc-950/80 border border-white/[0.12] flex items-center justify-center overflow-hidden shrink-0 shadow-sm backdrop-blur-md">
                      {cyberInputUrl.trim() ? (
                        <PlatformLogo url={cyberInputUrl} className="size-4" size={16} />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>

                    <input
                      type="url"
                      value={cyberInputUrl}
                      onChange={(e) => setCyberInputUrl(e.target.value)}
                      onBlur={() => {
                        if (cyberInputUrl.trim()) {
                          handleAddCyberUrl(cyberInputUrl);
                        }
                      }}
                      placeholder="أدخل أو الصق رابطاً للفحص والاستخبارات ثم اضغط Enter..."
                      className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none font-mono dir-ltr text-left selection:bg-cyan-500/30"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCyberUrl(cyberInputUrl);
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (pasted && (pasted.startsWith('http://') || pasted.startsWith('https://') || pasted.includes('.'))) {
                          setTimeout(() => {
                            handleAddCyberUrl(pasted);
                          }, 50);
                        }
                      }}
                    />
                    {cyberInputUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddCyberUrl(cyberInputUrl)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold font-sans flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
                      >
                        <span>إضافة</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsTargetUrlBarOpen(false);
                        setCyberInputUrl('');
                      }}
                      className="size-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-white/[0.06] active:scale-95"
                      title="إغلاق"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attached Multi-URLs Chips Preview Bar (High-End Pure Glassmorphism Capsule System) */}
            <AnimatePresence initial={false}>
              {attachedUrls.length > 0 && !hasAttachments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pt-2.5 pb-2.5 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl flex flex-wrap items-center gap-2"
                >
                  {attachedUrls.map((urlItem, idx) => {
                    const urlObj = detectAndExtractUrl(urlItem);
                    const domain = urlObj.domain || urlItem.replace(/^https?:\/\//i, '').split('/')[0];

                    return (
                      <div
                        key={`${urlItem}-${idx}`}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-3xl backdrop-saturate-200 border border-white/[0.22] hover:border-white/[0.4] text-zinc-100 transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] group select-none hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {/* Guaranteed True Geometric Circle Badge (Dark/Grey, Zero Glow) */}
                        <div className="w-5 h-5 min-w-[20px] min-h-[20px] aspect-square rounded-full bg-zinc-800/95 text-zinc-200 border border-white/[0.25] flex items-center justify-center font-bold text-[10px] shrink-0 font-mono shadow-inner select-none">
                          {idx + 1}
                        </div>

                        {/* High-Resolution Brand Vector Logo */}
                        <PlatformLogo url={urlItem} className="size-3.5 shrink-0" size={14} />

                        {/* Domain / Platform URL */}
                        <span className="truncate max-w-[130px] sm:max-w-[190px] text-zinc-200 font-mono text-[11px] font-medium tracking-tight" dir="ltr">
                          {domain}
                        </span>

                        {/* Frosted Circular Delete Button */}
                        <button
                          type="button"
                          onClick={() => setAttachedUrls(prev => prev.filter((_, i) => i !== idx))}
                          className="w-4 h-4 min-w-[16px] min-h-[16px] aspect-square rounded-full bg-white/[0.1] hover:bg-rose-500/90 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/[0.12] shadow-sm active:scale-90"
                          title="حذف الرابط"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}

                </motion.div>
              )}
            </AnimatePresence>

          {/* Main Text Area Row */}
          <div className="flex items-end gap-2.5 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2">
            
            {/* Auto-growing Textarea */}
            <div className="flex-1 relative min-h-[38px] flex items-center">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  const isTouchOrMobile = typeof window !== 'undefined' && (
                    'ontouchstart' in window ||
                    navigator.maxTouchPoints > 0 ||
                    window.innerWidth < 768 ||
                    window.matchMedia('(pointer: coarse)').matches
                  );

                  if (e.key === "Enter") {
                    if (isTouchOrMobile || e.nativeEvent.isComposing) {
                      // On mobile / touch keyboards, allow newline / space insertion without sending
                      return;
                    }
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }
                }}
                placeholder={
                  activeFusion
                    ? activeFusion.placeholder
                    : isDeepSearchEffective
                    ? "ابحث في الويب مباشرة مع Fathom Search..."
                    : isCyber21Mode
                    ? "اطرح فرضية أو مسألة علمية أو افحص أمنياً مع Fathom Cyber 2.1..."
                    : isCyber20Mode || isCyberMode
                    ? "أدخل رابط الهدف أو اسأل Fathom Cyber 2.0..."
                    : isVisionMode || hasAttachments
                    ? "اسأل Fathom Cam عن الصورة المرفقة..."
                    : isX1Active
                    ? "اسأل matany.one في أي شيء..."
                    : (placeholder || "اسأل Fathom 1.1 في أي شيء...")
                }
                rows={1}
                className={cn(
                  "w-full bg-transparent text-[15px] sm:text-base leading-relaxed resize-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 focus:border-0 shadow-none focus:shadow-none font-sans max-h-44 min-h-[38px] py-1 px-1 smooth-scroll no-scrollbar transition-colors",
                  activeFusion
                    ? activeFusion.textColor
                    : isMediaMode || hasNonImageMedia
                    ? "text-violet-50 placeholder:text-violet-300/50 selection:bg-violet-500/40"
                    : isDeepSearchEffective
                    ? "text-emerald-50 placeholder:text-emerald-300/50 selection:bg-emerald-500/40"
                    : isCyberMode
                    ? "text-cyan-50 placeholder:text-cyan-300/50 selection:bg-cyan-500/40"
                    : hasAttachments
                    ? "text-emerald-50 placeholder:text-emerald-300/50 selection:bg-emerald-500/40"
                    : isX1Active
                    ? "text-zinc-100 placeholder:text-zinc-400 selection:bg-rose-500/40"
                    : "text-zinc-100 placeholder:text-zinc-400 selection:bg-white/30"
                )}
                style={{ overscrollBehavior: 'contain', outline: 'none', border: 'none', boxShadow: 'none' }}
              />
            </div>

            {/* Action Button: Send / Stop */}
            <div className="shrink-0 flex items-center pb-0.5">
              <button
                type="button"
                onClick={onActionButtonClick}
                disabled={(!hasValue && !isStreaming) || isAnyAttachmentProcessing}
                className={cn(
                  "flex items-center justify-center size-9 sm:size-10 rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-90 shadow-lg",
                  isStreaming
                    ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-white/20"
                    : isAnyAttachmentProcessing
                    ? cn("cursor-wait shadow-none border", currentThemeColor.bgLoader)
                    : hasValue
                    ? activeFusion
                      ? `${activeFusion.sendGradient} font-bold hover:scale-105 shadow-xl`
                      : isMediaMode || hasNonImageMedia
                      ? "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-bold hover:scale-105 shadow-violet-500/30"
                      : isDeepSearchEffective
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold hover:scale-105 shadow-emerald-500/30"
                      : isCyberMode
                      ? "bg-cyan-400 hover:bg-cyan-300 text-black font-bold hover:scale-105 shadow-cyan-400/30"
                      : isVisionMode || hasAttachments
                      ? "bg-emerald-400 hover:bg-emerald-300 text-black font-bold hover:scale-105 shadow-emerald-500/30"
                      : isX1Active
                      ? "bg-rose-500 hover:bg-rose-400 text-white font-bold hover:scale-105 shadow-rose-500/30"
                      : "bg-white hover:bg-zinc-100 text-zinc-950 font-bold hover:scale-105 shadow-white/20"
                    : "bg-white/[0.04] text-zinc-600 cursor-not-allowed border border-white/[0.04]"
                )}
                title={isStreaming ? "إيقاف التوليد" : isAnyAttachmentProcessing ? "جاري تجهيز ورفع الفيديو بالكامل..." : "إرسال"}
              >
                {isStreaming ? (
                  <Square className="w-4 h-4 fill-current text-zinc-950" />
                ) : isAnyAttachmentProcessing ? (
                  <Loader2 className={cn("w-4 h-4 animate-spin", currentThemeColor.spinnerColor)} />
                ) : (
                  <ArrowUp className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]", (isMediaMode || hasNonImageMedia || isX1Active) ? "text-white" : (isCyberMode || isDeepSearchEffective || hasAttachments || Boolean(activeFusion)) ? "text-black" : hasValue ? "text-zinc-950" : "text-zinc-600")} />
                )}
              </button>
            </div>

          </div>

          {/* Bottom Toolbar: Clean, 100% Icon-First Architecture */}
          <div className="flex items-center justify-between gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border-t border-white/[0.06] bg-black/40 rounded-b-3xl text-xs">
            
            {/* Right Group: Compact Model Selector */}
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelMenuOpen(!isModelMenuOpen);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium select-none shrink-0 cursor-pointer transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-zinc-300 hover:text-white active:scale-95 shadow-none"
                title="اختيار النموذج الذكي"
              >
                {isMediaMode ? (
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                ) : isCyberMode ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : isVisionMode ? (
                  <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-zinc-100 fill-zinc-100/40 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] shrink-0" />
                )}
                <span className="font-sans text-[11px] sm:text-xs font-semibold tracking-tight">
                  {activeModelDisplayName}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform duration-200", isModelMenuOpen && "rotate-180")} />
              </button>
            </div>

            {/* Left Group: Icon-Only Status Badges & 3-Dots Actions Menu */}
            <div className="flex items-center gap-1.5 mr-auto shrink-0">
              
              {/* NSFW Active Icon Indicator (Clickable to cancel/toggle) */}
              {isX1Active && (
                <button
                  type="button"
                  onClick={onToggleX1}
                  title="وضع NSFW Off مفعّل (انقر للتعطيل)"
                  className="size-8 rounded-xl bg-zinc-950 border border-white/[0.12] hover:border-rose-500/40 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <ShieldOff className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}

              {/* Deep Search Active Icon Indicator */}
              {isDeepSearchEffective && (
                <button
                  type="button"
                  onClick={toggleDeepSearch}
                  title="البحث المباشر في الويب مفعّل (انقر للتعطيل)"
                  className="size-8 rounded-xl bg-zinc-950 border border-white/[0.12] hover:border-emerald-500/40 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {/* 3-Dots Action Button (Clean and direct without annoying tooltips) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionsMenuOpen(!isActionsMenuOpen);
                }}
                title="أدوات إضافية"
                className={cn(
                  "glass-button size-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0",
                  isActionsMenuOpen
                    ? "bg-white/[0.12] text-white border-white/[0.25]"
                    : "text-zinc-300 hover:text-white"
                )}
              >
                <MoreHorizontal className="w-4 h-4 text-zinc-300" />
              </button>

            </div>

          </div>

        </div>
        </div>

        {/* Lightbox Modal */}
        {activeAttachment && (
          <AttachmentPreviewModal
            attachment={activeAttachment}
            onClose={() => setActiveAttachment(null)}
            onOpenForensics={(att) => setForensicModalSrc(att.file || att.url)}
          />
        )}

        {/* Digital Forensics Modal */}
        <ImageForensicsModal
          imageSrc={forensicModalSrc}
          isOpen={Boolean(forensicModalSrc)}
          onClose={() => setForensicModalSrc(null)}
        />
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";
