"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  ArrowUp,
  Mic,
  Square,
  Sparkles,
  Camera,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Globe,
  Terminal,
  ChevronDown
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
    meta: { model: string; effort: string; attachments: File[] }
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
      activeModel = 'deepseek-v4-flash',
      onSelectModel,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [internalModel, setInternalModel] = useState<ModelType>(activeModel);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState<number[]>(new Array(6).fill(0));

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    const valueRef = useRef(value);

    useEffect(() => {
      if (activeModel) setInternalModel(activeModel);
    }, [activeModel]);

    const hasAttachments = attachments.length > 0;
    const hasValue = value.trim() !== "" || hasAttachments;

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
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
      valueRef.current = value;
    }, [value]);

    const handleValueChange = useCallback(
      (val: string) => {
        if (!isControlled) setLocalValue(val);
        onChange?.(val);
      },
      [isControlled, onChange]
    );

    // Auto-adjust textarea height cleanly on input
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 38), 160);
      el.style.height = `${newHeight}px`;
    }, [value]);

    // Voice recording management
    const stopRecording = useCallback(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      setIsRecording(false);
      setAudioData(new Array(6).fill(0));
    }, []);

    const startRecording = useCallback(async () => {
      let stream: MediaStream | null = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.warn("Microphone access unavailable.");
      }

      setIsRecording(true);

      if (stream) {
        streamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          try {
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVisualizer = () => {
              analyser.getByteFrequencyData(dataArray);
              const bands = new Array(6).fill(0);
              const step = Math.floor(dataArray.length / 6);
              for (let i = 0; i < 6; i++) {
                let sum = 0;
                for (let j = 0; j < step; j++) {
                  sum += dataArray[i * step + j];
                }
                bands[i] = sum / step / 255;
              }
              setAudioData(bands);
              rafRef.current = requestAnimationFrame(updateVisualizer);
            };
            updateVisualizer();
          } catch (e) {
            console.warn("[AudioContext Warning]:", e);
          }
        }

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = "ar-SA";
          recognition.continuous = true;
          recognition.interimResults = true;

          let baseline = valueRef.current;

          recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            if (finalTranscript) {
              baseline += (baseline ? " " : "") + finalTranscript;
            }

            handleValueChange(
              (baseline + (interimTranscript ? " " : "") + interimTranscript).trim()
            );
          };

          recognition.onerror = () => stopRecording();
          recognition.onend = () => stopRecording();

          recognitionRef.current = recognition;
          recognition.start();
        }
      } else {
        stopRecording();
      }
    }, [handleValueChange, stopRecording]);

    const [cyberTargetUrl, setCyberTargetUrl] = useState('');

    const handleCyberSubmit = () => {
      if (!cyberTargetUrl.trim() || isStreaming) return;
      let target = cyberTargetUrl.trim();
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

      const extraPrompt = value.trim();
      const finalPrompt = extraPrompt
        ? `افحص هذا الرابط أمنياً واستخرج كافة المعلومات والترويسات ونقاط السطح الهجومي: ${target}\n\nتوجيهات إضافية: ${extraPrompt}`
        : `افحص هذا الرابط أمنياً واستخرج كافة المعلومات والترويسات ونقاط السطح الهجومي: ${target}`;

      onSubmit?.(finalPrompt, {
        model: 'deepseek-v4-flash-cyber',
        effort: isX1Active ? "X1 (+21)" : "Standard",
        attachments: [],
      });

      setCyberTargetUrl('');
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

      if (isCyberMode && cyberTargetUrl.trim()) {
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
        effort: isX1Active ? "X1 (+21)" : "Standard",
        attachments: attachments.map((a) => a.file),
      });

      handleValueChange("");
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
      setAttachments([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      e.target.value = "";

      if (files.length === 0) return;
      const room = Math.max(0, maxAttachments - attachments.length);
      const accepted = files.slice(0, room);

      for (const file of accepted) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => addAttachment(file, url, img.naturalWidth, img.naturalHeight);
        img.onerror = () => addAttachment(file, url, 800, 600);
        img.src = url;
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
      } else if (isRecording) {
        stopRecording();
      } else if (hasValue || (isCyberMode && cyberTargetUrl.trim())) {
        handleSubmit();
      } else {
        startRecording();
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
          accept="image/*"
          multiple
          onChange={handleFilesChosen}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Floating Model Selector Popup with Click-Outside Backdrop */}
        {isModelMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsModelMenuOpen(false)}
            />
            <div
              className="absolute bottom-full right-2 mb-2 w-64 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-mono text-zinc-400 px-2.5 py-1 uppercase tracking-wider border-b border-zinc-800 mb-1 font-semibold">
                اختيار نموذج Fathom
              </div>

              {/* Model 1: Fathom 1 */}
              <button
                type="button"
                onClick={() => {
                  setInternalModel('deepseek-v4-flash');
                  onSelectModel?.('deepseek-v4-flash');
                  setIsModelMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-colors cursor-pointer text-right",
                  internalModel === 'deepseek-v4-flash' && !hasAttachments
                    ? "bg-rose-950/60 text-rose-200 font-bold border border-rose-600/40"
                    : "hover:bg-zinc-800 text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-white">Fathom 1</div>
                    <div className="text-[10px] text-zinc-400 font-normal">المحرك اللغوي الفصيح والتحليل</div>
                  </div>
                </div>
                {internalModel === 'deepseek-v4-flash' && !hasAttachments && (
                  <span className="size-2 rounded-full bg-rose-500 shrink-0" />
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
                  "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans transition-colors cursor-pointer text-right mt-1",
                  internalModel === 'deepseek-v4-flash-cyber'
                    ? "bg-cyan-950/60 text-cyan-200 font-bold border border-cyan-500/40"
                    : "hover:bg-zinc-800 text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-white">Fathom Cyber</div>
                    <div className="text-[10px] text-zinc-400 font-normal">الأمن السيبراني وفحص الروابط</div>
                  </div>
                </div>
                {internalModel === 'deepseek-v4-flash-cyber' && (
                  <span className="size-2 rounded-full bg-cyan-400 shrink-0" />
                )}
              </button>

              {/* Model 3: Fathom Cam (Shown ONLY when image or file is uploaded) */}
              {hasAttachments && (
                <div className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-sans bg-amber-950/60 text-amber-200 font-bold border border-amber-500/40 mt-1">
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs text-white">Fathom Cam</div>
                      <div className="text-[10px] text-amber-300/80 font-normal">مفعّل تلقائياً لتحليل الصورة</div>
                    </div>
                  </div>
                  <span className="size-2 rounded-full bg-amber-400 shrink-0" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Attachment Preview Row */}
        {hasAttachments && (
          <div className="mb-2 flex items-center gap-2 overflow-x-auto p-1.5 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-800 no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                onClick={() => setActiveAttachment(attachment)}
                className="relative group shrink-0 size-14 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 cursor-pointer shadow-md"
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => removeAttachment(attachment.id, e)}
                  className="absolute top-1 left-1 size-4 rounded-full bg-zinc-950/80 text-zinc-300 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors shadow"
                  title="حذف الصورة"
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
            "relative w-full rounded-2xl sm:rounded-3xl border bg-zinc-900/95 backdrop-blur-xl shadow-xl transition-colors duration-150",
            isX1Active
              ? "border-rose-900/80"
              : isCyberMode
              ? "border-cyan-900/80"
              : "border-zinc-800 focus-within:border-zinc-700"
          )}
        >
          {/* Streamlined Cyber URL Bar (Shown ONLY for Fathom Cyber) */}
          {isCyberMode && !hasAttachments && (
            <div className="p-2 sm:p-2.5 border-b border-zinc-800/80 bg-cyan-950/20 rounded-t-2xl sm:rounded-t-3xl flex items-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/70 border border-cyan-500/40 focus-within:border-cyan-400 transition-colors">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="url"
                  value={cyberTargetUrl}
                  onChange={(e) => setCyberTargetUrl(e.target.value)}
                  placeholder="أدخل رابط الهدف للفحص الأمني (https://example.com)..."
                  className="w-full bg-transparent text-xs sm:text-sm text-cyan-100 placeholder:text-zinc-500 outline-none font-mono dir-ltr text-left"
                  dir="ltr"
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
                    className="text-zinc-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleCyberSubmit}
                disabled={!cyberTargetUrl.trim() || isStreaming}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-xs font-bold font-sans transition-colors cursor-pointer select-none active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>فحص الهدف</span>
              </button>
            </div>
          )}

          {/* Main Text Area Row */}
          <div className="flex items-end gap-2 p-2.5 sm:p-3">
            
            {/* Auto-growing Textarea */}
            <div className="flex-1 relative min-h-[38px] flex items-center">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  isRecording
                    ? "جاري الاستماع لصوتك وتسجيل الرسالة..."
                    : isCyberMode
                    ? "اسأل Fathom Cyber عن فحص الهدف أو تحليل الثغرات أو اكتب استفسارك..."
                    : isX1Active
                    ? "اسأل X1 (+21) أي شيء بحرية تامة..."
                    : placeholder
                }
                rows={1}
                disabled={isRecording}
                className="w-full bg-transparent text-zinc-100 text-[16px] sm:text-base leading-relaxed resize-none outline-none placeholder:text-zinc-500 font-sans max-h-36 min-h-[28px] py-1 px-1.5 selection:bg-rose-600 selection:text-white"
              />
            </div>

            {/* Action Button: Send / Mic / Stop */}
            <div className="shrink-0 flex items-center gap-1.5 pb-0.5">
              {/* Audio Wave Visualizer when recording */}
              {isRecording && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-950/60 border border-rose-800/80">
                  {audioData.map((val, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-rose-500 transition-all duration-75"
                      style={{ height: `${Math.max(4, val * 20)}px` }}
                    />
                  ))}
                  <span className="text-[10px] text-rose-300 font-mono mr-1">استماع...</span>
                </div>
              )}

              <button
                type="button"
                onClick={onActionButtonClick}
                className={cn(
                  "size-9 sm:size-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0",
                  isStreaming
                    ? "bg-rose-600 hover:bg-rose-500"
                    : isRecording
                    ? "bg-rose-600 hover:bg-rose-500"
                    : (hasValue || (isCyberMode && cyberTargetUrl.trim()))
                    ? isCyberMode
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                      : "bg-rose-600 hover:bg-rose-500"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                )}
                title={
                  isStreaming
                    ? "إيقاف التوليد"
                    : isRecording
                    ? "إيقاف التسجيل الصوتي"
                    : (hasValue || (isCyberMode && cyberTargetUrl.trim()))
                    ? "إرسال الرسالة"
                    : "تسجيل صوتي"
                }
              >
                {isStreaming ? (
                  <Square className="w-4 h-4 fill-current text-white" />
                ) : isRecording ? (
                  <Square className="w-4 h-4 fill-current text-white" />
                ) : (hasValue || (isCyberMode && cyberTargetUrl.trim())) ? (
                  <ArrowUp className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]", isCyberMode ? "text-black" : "text-white")} />
                ) : (
                  <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </button>
            </div>

          </div>

          {/* Bottom Toolbar (Models, NSFW NANO Chip, Attachments) */}
          <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-t border-zinc-800/60 bg-zinc-950/40 rounded-b-2xl sm:rounded-b-3xl text-xs">
            
            {/* Right Group: Model Selector & NSFW NANO Chip */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Interactive Model Selector Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelMenuOpen(!isModelMenuOpen);
                }}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border select-none shadow-sm shrink-0 cursor-pointer transition-colors active:scale-95",
                  isCyberMode
                    ? "bg-cyan-950/80 border-cyan-600/60 text-cyan-200"
                    : isVisionMode
                    ? "bg-amber-950/80 border-amber-600/60 text-amber-200"
                    : "bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 border-zinc-700/60"
                )}
                title="تغيير نموذج الذكاء الاصطناعي"
              >
                {isCyberMode ? (
                  <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : isVisionMode ? (
                  <Camera className="w-3 h-3 text-amber-400 shrink-0" />
                ) : (
                  <Sparkles className="w-3 h-3 text-rose-400 shrink-0" />
                )}
                <span className="font-sans font-semibold text-[10px] sm:text-xs">
                  {activeModelDisplayName}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* NSFW NANO Silicon Chip Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleX1?.();
                }}
                className={cn(
                  "relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-colors select-none cursor-pointer active:scale-95 shrink-0",
                  isX1Active
                    ? "bg-rose-950 border border-rose-600 text-white"
                    : "bg-zinc-800/80 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 hover:border-rose-500/50"
                )}
                title={
                  isX1Active
                    ? "شريحة NSFW NANO مفعلة بالكامل (انقر للتعطيل)"
                    : "تفعيل شريحة NSFW NANO (+21) مع كسر الرقابة"
                }
              >
                <Cpu className={cn("w-3 h-3 shrink-0", isX1Active ? "text-rose-300" : "text-zinc-400")} />

                <span className={cn("tracking-tight whitespace-nowrap", isX1Active ? "text-rose-100 font-extrabold" : "text-zinc-300")}>
                  {isX1Active ? "+21 MAX NANO" : "NSFW NANO"}
                </span>

                {!isX1Active && (
                  <span className="hidden sm:inline-flex text-[9px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-700/60 text-zinc-400 font-semibold items-center gap-0.5">
                    <Fingerprint className="w-2.5 h-2.5 text-rose-500" />
                    <span>+21</span>
                  </span>
                )}
              </button>

            </div>

            {/* Left Group: Attachments trigger */}
            <div className="flex items-center gap-1 sm:gap-1.5 mr-auto shrink-0">
              {/* Image attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= maxAttachments}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer active:scale-95"
                title="إرفاق صورة لتحليلها بـ Fathom Cam"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                <span className="hidden sm:inline">إرفاق صورة</span>
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
