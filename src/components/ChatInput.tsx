import React, { useState, useRef, useEffect } from 'react';
import { ModelType } from '../types';
import { compressImageFile } from '../lib/imageCompressor';

interface ChatInputProps {
  onSendMessage: (text: string, image?: string) => void;
  isStreaming: boolean;
  onAbort: () => void;
  activeModel: ModelType;
  onModelChange: (model: ModelType) => void;
  isX1Active: boolean;
  totalTokens: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onAbort,
  activeModel,
  onModelChange,
  isX1Active,
  totalTokens
}) => {
  const [inputText, setInputText] = useState('');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus only if on desktop to prevent mobile auto-zoom/keyboard jump on initial load
    if (window.innerWidth > 768) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageName(file.name);
    try {
      const dataUrl = await compressImageFile(file);
      setImageAttachment(dataUrl);
      if (activeModel !== 'deepseek-v4-flash-vision-exp') {
        onModelChange('deepseek-v4-flash-vision-exp');
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageAttachment(dataUrl);
        if (activeModel !== 'deepseek-v4-flash-vision-exp') {
          onModelChange('deepseek-v4-flash-vision-exp');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageAttachment(null);
    setImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onAbort();
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed && !imageAttachment) return;

    onSendMessage(trimmed || 'حلل هذه الصورة وقدم تحليلاً حاداً وصريحاً لها.', imageAttachment || undefined);
    setInputText('');
    handleRemoveImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="sticky bottom-0 z-30 w-full bg-surface border-t-4 border-brand-blood px-2.5 sm:px-6 py-2.5 sm:py-3 font-mono shadow-brutal-black">
      <div className="max-w-4xl mx-auto">
        
        {/* Attached Image Preview */}
        {imageAttachment && (
          <div className="mb-2 flex items-center justify-between bg-black border-2 border-brand-blood p-1.5 sm:p-2">
            <div className="flex items-center gap-2 truncate">
              <img
                src={imageAttachment}
                alt="Upload preview"
                className="w-10 h-10 object-cover border border-brand-blood"
              />
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {imageName || 'IMAGE_PAYLOAD.JPG'}
                </span>
                <span className="text-[10px] text-brand-neon block font-mono">
                  [ ROUTED: deepseek-v4-flash-vision-exp ]
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-2 py-1 bg-black border border-brand-blood text-brand-neon hover:bg-brand-blood hover:text-black text-[11px] font-bold transition-all ml-2"
            >
              [ حذف ]
            </button>
          </div>
        )}

        {/* Input Controls */}
        <form
          onSubmit={handleSubmit}
          className={`flex items-end gap-1.5 sm:gap-2 bg-black border-2 transition-all p-1 sm:p-2 ${
            isX1Active
              ? 'border-brand-blood'
              : 'border-brand-blood/80'
          }`}
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageUpload(e.target.files[0]);
              }
            }}
          />

          {/* Quick Image Upload Button (Mobile-friendly, zero icons) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-2 sm:px-3 border border-brand-blood bg-surface text-brand-neon hover:bg-brand-blood hover:text-black font-mono text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center shrink-0"
          >
            [ + صورة ]
          </button>

          {/* Multiline auto-resizing input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isX1Active
                ? '[ وضع X1 مفعّل ] اسأل أي شيء تريده...'
                : 'اكتب رسالتك هنا...'
            }
            className="flex-1 bg-transparent text-chalk font-cairo p-2 text-sm sm:text-base outline-none resize-none max-h-32 min-h-[40px] placeholder:text-muted/60"
          />

          {/* Send / Stop Button */}
          <button
            type="submit"
            disabled={!isStreaming && !inputText.trim() && !imageAttachment}
            className={`h-10 px-3 sm:px-6 font-mono font-black text-xs sm:text-sm uppercase transition-all shrink-0 flex items-center justify-center ${
              isStreaming
                ? 'bg-brand-blood text-black border-2 border-white animate-pulse'
                : !inputText.trim() && !imageAttachment
                ? 'bg-surface opacity-40 text-muted border border-muted cursor-not-allowed'
                : isX1Active
                ? 'brutal-btn-danger'
                : 'brutal-btn'
            }`}
          >
            {isStreaming ? '[ إيقاف ]' : '[ إرسال ]'}
          </button>
        </form>

        {/* Bottom Sub-Telemetry (Mobile Compact) */}
        <div className="flex items-center justify-between mt-1 text-[9px] sm:text-[10px] font-mono text-muted">
          <span>
            {isX1Active ? 'PROTOCOL: X1 (+21)' : 'PROTOCOL: BASE (+18)'}
          </span>
          <span>
            MEM_VIRTUAL: 1M_TOKENS // USED: {totalTokens}
          </span>
        </div>

      </div>
    </footer>
  );
};
