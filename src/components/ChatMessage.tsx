import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessageItem, ResolvedLinkInfo } from '../types';
import ChatReasoning from './ui/chat-reasoning';
import { Check, Copy, Flame, X, ShieldCheck, Sparkles, Camera, ExternalLink, Globe, PhoneCall, Phone, Mail, Zap, Loader2, Play, Pause, Video, Music, FileText, FileCode, FileType, Clock, RotateCcw, Bell, Trash2, Calendar, CheckCircle2, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { detectAndExtractUrl, extractAllCleanUrls, getFaviconUrl, extractYouTubeVideoId, getYouTubeThumbnailUrl, normalizeDisplayTimestamp, cleanMarkdownForClipboard, cn } from '@/lib/utils';
import { formatMediaDuration, formatFileSize } from '@/lib/mediaExtractor';
import { resolveLinkTarget } from '../services/api';
import { ThinkingOrb } from './ui/thinking-orbs';
import { LinkConfirmModal } from './ui/LinkConfirmModal';
import { PhoneConfirmModal } from './ui/PhoneConfirmModal';
import { EmailConfirmModal } from './ui/EmailConfirmModal';
import { renderSmartContentWithLinksAndPhones } from '@/lib/smart-content-parser';
import { PlatformLogo } from './ui/PlatformLogo';
import { FeaturesBar } from './ui/FeaturesBar';
import { MemoryDetectBadge } from './ui/MemoryDetectBadge';
import { DownloadDetectCard } from './ui/DownloadDetectCard';
import { DownloadButton } from './ui/DownloadButton';
import { getActiveDetectedFeatures, MemoryDetectIcon, TimeDetectIcon, AiDetectIcon, MetadataDetectIcon, DownloadDetectIcon } from '@/lib/featuresRegistry';

const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.35 6.35 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.6a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.95-4.48V8.71a8.18 8.18 0 0 0 4.82 1.56V6.82a4.84 4.84 0 0 1-1-.13z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface ChatMessageProps {
  message: ChatMessageItem;
  previousUserPrompt?: string;
  isStreaming?: boolean;
  globalUrlIndexMap?: Record<string, number>;
  globalImageIndexMap?: Record<string, number>;
}

interface SingleLinkCardProps {
  url: string;
  linkIndex?: number;
  onConfirmUrl: (url: string) => void;
}

const SingleLinkCard: React.FC<SingleLinkCardProps> = ({ url, linkIndex, onConfirmUrl }) => {
  const [resolvedInfo, setResolvedInfo] = useState<ResolvedLinkInfo | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;
    const controller = new AbortController();
    setIsResolving(true);

    resolveLinkTarget(url, controller.signal)
      .then(data => {
        if (isMounted && data) {
          setResolvedInfo(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsResolving(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url]);

  const displayUrl = resolvedInfo?.originalUrl || url;
  const isRedirected = Boolean(
    resolvedInfo && (resolvedInfo.isShortened || (resolvedInfo.originalUrl && resolvedInfo.originalUrl !== url))
  );

  const targetUrl = displayUrl || url || '';
  const isTikTok = Boolean(
    /(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(targetUrl) ||
    resolvedInfo?.videoMetadata?.platform === 'tiktok'
  );
  const isInstagram = Boolean(
    /(?:instagram\.com|instagr\.am|ig\.me)/i.test(targetUrl) ||
    resolvedInfo?.videoMetadata?.platform === 'instagram'
  );
  const isFacebook = Boolean(
    /(?:facebook\.com|fb\.watch|fb\.me|fb\.com|fb\.gg|m\.facebook\.com|web\.facebook\.com|touch\.facebook\.com|mbasic\.facebook\.com)/i.test(targetUrl) ||
    resolvedInfo?.videoMetadata?.platform === 'facebook'
  );
  const isTwitter = Boolean(
    /(?:x\.com|twitter\.com|t\.co)/i.test(targetUrl) ||
    resolvedInfo?.videoMetadata?.platform === 'twitter'
  );
  const ytVideoId = (!isTikTok && !isInstagram && !isFacebook && !isTwitter)
    ? (extractYouTubeVideoId(targetUrl) || resolvedInfo?.videoMetadata?.videoId)
    : null;
  const isYouTube = Boolean(ytVideoId || resolvedInfo?.videoMetadata?.platform === 'youtube' || /(?:youtube\.com|youtu\.be)/i.test(targetUrl));
  const isVideo = Boolean(isYouTube || isTikTok || isInstagram || isFacebook || isTwitter || resolvedInfo?.mediaType === 'video');

  const videoPlatform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' = 
    isTikTok ? 'tiktok' :
    isInstagram ? 'instagram' :
    isFacebook ? 'facebook' :
    isTwitter ? 'twitter' : 'youtube';

  const thumbnailUrl = ytVideoId
    ? getYouTubeThumbnailUrl(ytVideoId)
    : (resolvedInfo?.videoMetadata?.thumbnailUrl || resolvedInfo?.brandAssets?.ogImage || resolvedInfo?.brandAssets?.twitterImage || null);

  const platformTitle =
    videoPlatform === 'tiktok' ? "فيديو تيك توك (TikTok Video)" :
    videoPlatform === 'instagram' ? "فيديو إنستغرام (Instagram Reel)" :
    videoPlatform === 'facebook' ? "فيديو فيسبوك (Facebook Video)" :
    videoPlatform === 'twitter' ? "منشور وسائط إكس (X Video Post)" :
    "فيديو يوتيوب (YouTube Video)";

  if (isVideo) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border shadow-2xl p-3 sm:p-3.5 text-right animate-in fade-in duration-200 group/videocard",
        videoPlatform === 'tiktok' ? "border-cyan-500/30 bg-black/85" :
        videoPlatform === 'instagram' ? "border-pink-500/30 bg-black/85" :
        videoPlatform === 'facebook' ? "border-blue-500/30 bg-black/85" :
        videoPlatform === 'twitter' ? "border-zinc-500/30 bg-black/85" :
        "border-red-500/30 bg-black/85"
      )}>
        {thumbnailUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-125 pointer-events-none transition-all duration-700 select-none"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/60 pointer-events-none" />

        {/* Video Card Header with Number Badge */}
        <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 font-sans font-bold text-xs text-zinc-200">
            {typeof linkIndex === 'number' && (
              <span className="w-5 h-5 min-w-[20px] min-h-[20px] aspect-square rounded-full bg-zinc-800/95 text-zinc-200 border border-white/[0.25] font-mono text-[10px] font-bold flex items-center justify-center shadow-inner">
                {linkIndex}
              </span>
            )}
            <div className={cn(
              "size-5 rounded-md flex items-center justify-center border",
              videoPlatform === 'tiktok' ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" :
              videoPlatform === 'instagram' ? "bg-pink-500/20 border-pink-500/30 text-pink-400" :
              videoPlatform === 'facebook' ? "bg-blue-600/20 border-blue-500/30 text-blue-400" :
              videoPlatform === 'twitter' ? "bg-zinc-700/30 border-zinc-500/30 text-zinc-300" :
              "bg-red-600/20 border-red-500/30 text-red-400"
            )}>
              <Play className="size-2.5 fill-current" />
            </div>
            <span>{platformTitle}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
              videoPlatform === 'tiktok' ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" :
              videoPlatform === 'instagram' ? "bg-pink-500/15 text-pink-300 border-pink-500/30" :
              videoPlatform === 'facebook' ? "bg-blue-600/20 text-blue-300 border-blue-500/30" :
              videoPlatform === 'twitter' ? "bg-zinc-700/40 text-zinc-200 border-zinc-500/30" :
              "bg-red-600/20 text-red-300 border-red-500/30"
            )}>
              <PlatformLogo url={targetUrl} className="size-3" size={12} />
              <span className="uppercase">{videoPlatform}</span>
            </span>
          </div>
        </div>

        {/* Clickable Video Preview */}
        <button
          type="button"
          onClick={() => onConfirmUrl(displayUrl || url)}
          className={cn(
            "relative z-10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border transition-all cursor-pointer shadow-lg backdrop-blur-md w-full text-right",
            videoPlatform === 'tiktok' ? "border-white/[0.10] hover:border-cyan-500/40" :
            videoPlatform === 'instagram' ? "border-white/[0.10] hover:border-pink-500/40" :
            videoPlatform === 'facebook' ? "border-white/[0.10] hover:border-blue-500/40" :
            videoPlatform === 'twitter' ? "border-white/[0.10] hover:border-zinc-400/40" :
            "border-white/[0.10] hover:border-red-500/40"
          )}
        >
          <div className={cn(
            "relative shrink-0 rounded-lg overflow-hidden border border-white/[0.15] bg-zinc-950 shadow-md group-hover/videocard:scale-[1.02] transition-transform",
            (videoPlatform === 'tiktok' || videoPlatform === 'instagram') ? "aspect-[9/16] sm:w-28 sm:h-36 mx-auto sm:mx-0" : "aspect-video sm:w-44"
          )}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={resolvedInfo?.title || 'Video Thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                <Video className="size-6 text-zinc-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/25 group-hover/videocard:bg-black/10 transition-colors flex items-center justify-center">
              <div className={cn(
                "size-8 rounded-full text-white flex items-center justify-center shadow-xl group-hover/videocard:scale-110 transition-transform",
                videoPlatform === 'tiktok' ? "bg-cyan-500/90 text-black" :
                videoPlatform === 'instagram' ? "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white" :
                videoPlatform === 'facebook' ? "bg-blue-600 text-white" :
                videoPlatform === 'twitter' ? "bg-zinc-800 border border-white/20 text-white" :
                "bg-red-600 text-white"
              )}>
                <Play className="size-3.5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center flex-1 min-w-0 text-right gap-1 py-0.5">
            <h4 className={cn(
              "text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug transition-colors font-sans",
              videoPlatform === 'tiktok' ? "group-hover/videocard:text-cyan-200" :
              videoPlatform === 'instagram' ? "group-hover/videocard:text-pink-200" :
              videoPlatform === 'facebook' ? "group-hover/videocard:text-blue-200" :
              videoPlatform === 'twitter' ? "group-hover/videocard:text-zinc-200" :
              "group-hover/videocard:text-red-200"
            )} title={resolvedInfo?.title || ''}>
              {resolvedInfo?.title || 'جاري استخراج تفاصيل ومحتوى الفيديو...'}
            </h4>
            {resolvedInfo?.videoMetadata?.authorName && (
              <p className="text-[11px] text-zinc-300 flex items-center gap-1 font-sans">
                <span className="text-zinc-400 font-medium">صانع المحتوى:</span>
                <span className="text-zinc-100 font-semibold">{resolvedInfo.videoMetadata.authorName}</span>
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-1 dir-ltr text-left">
              <ExternalLink className={cn(
                "size-3 shrink-0",
                videoPlatform === 'tiktok' ? "text-cyan-400" :
                videoPlatform === 'instagram' ? "text-pink-400" :
                videoPlatform === 'facebook' ? "text-blue-400" :
                videoPlatform === 'twitter' ? "text-zinc-300" :
                "text-red-400"
              )} />
              <span className="truncate text-zinc-300 group-hover/videocard:underline">{displayUrl}</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // Standard Website Card
  return (
    <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.12] text-right animate-in fade-in duration-150 backdrop-blur-2xl shadow-xl">
      <div className="flex items-center justify-between text-[11px] text-zinc-300 font-medium">
        <span className="flex items-center gap-2 font-sans font-semibold text-zinc-200">
          {typeof linkIndex === 'number' && (
            <span className="w-5 h-5 min-w-[20px] min-h-[20px] aspect-square rounded-full bg-zinc-800/95 text-zinc-200 border border-white/[0.25] font-mono text-[10px] font-bold flex items-center justify-center shadow-inner">
              {linkIndex}
            </span>
          )}
          <ShieldCheck className={cn("w-3.5 h-3.5", isRedirected ? "text-emerald-400" : "text-zinc-300")} />
          <span>
            {isRedirected ? "تم فك الشفرة واستطلاع الهدف الأصلي:" : "رابط الهدف المستطلع للفحص:"}
          </span>
        </span>
        {isResolving && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-bold flex items-center gap-1 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>UNSHORTENING...</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onConfirmUrl(displayUrl || url)}
        className="flex items-center justify-between gap-2.5 bg-black/60 hover:bg-black/80 p-2 sm:p-2.5 rounded-lg border border-white/[0.08] hover:border-white/[0.22] mt-0.5 shadow-inner w-full text-right cursor-pointer transition-all group/target backdrop-blur-md"
      >
        <div className="size-7 rounded-xl bg-zinc-950/80 border border-white/[0.12] flex items-center justify-center overflow-hidden shrink-0 shadow-sm backdrop-blur-md">
          <PlatformLogo url={displayUrl || url || ''} className="size-4" size={16} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 text-left dir-ltr">
          <span
            className="font-mono text-xs sm:text-sm text-zinc-100 group-hover/target:text-white underline underline-offset-4 decoration-white/30 group-hover/target:decoration-white break-all dir-ltr text-left flex-1 transition-colors font-medium"
            dir="ltr"
          >
            {displayUrl}
          </span>
          {isRedirected && (
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5 truncate dir-rtl text-right">
              <span className="text-zinc-500">الرابط المختصر:</span>
              <span className="truncate dir-ltr text-zinc-400">{url}</span>
            </span>
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover/target:text-white shrink-0 opacity-75 group-hover/target:opacity-100 transition-opacity" />
      </button>

      {resolvedInfo && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-300 font-sans">
          {resolvedInfo.title && (
            <span className="truncate max-w-[260px] sm:max-w-[360px] text-zinc-300 font-medium bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]" title={resolvedInfo.title}>
              {resolvedInfo.title}
            </span>
          )}
          {resolvedInfo.frameworks?.coreFramework?.map((fw, idx) => (
            <span key={`fw-${idx}`} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">
              {fw}
            </span>
          ))}
          {resolvedInfo.frameworks?.componentLibraries?.map((lib, idx) => (
            <span key={`lib-${idx}`} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">
              {lib}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface PromptCardProps {
  text: string;
  type?: 'prompt' | 'ad' | 'coder' | 'script' | 'general';
}

const PromptCard: React.FC<PromptCardProps> = ({ text, type = 'prompt' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArabicText = /[\u0600-\u06FF]/.test(text);

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0c0c12]/90 backdrop-blur-xl shadow-xl p-3.5 sm:p-4 text-right transition-all group/card">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 font-sans font-bold text-xs text-zinc-200">
          <div className="size-5 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="size-3" />
          </div>
          <span>
            {type === 'ad' ? 'إعلان مقترح جاهز للنشر' :
             type === 'coder' ? 'كود برمجي مقترح' :
             type === 'script' ? 'سيناريو / سكربت فيديو' :
             'برومبت / أمر مقترح للذكاء الاصطناعي'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer select-none active:scale-95 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <div className={cn(
        "text-xs leading-relaxed text-zinc-200 font-mono select-text",
        isArabicText ? "font-sans text-right dir-rtl" : "text-left dir-ltr"
      )}>
        {text}
      </div>
    </div>
  );
};

interface AiDetectBadgeProps {
  verdict?: string;
  score?: string | number;
}

const AiDetectBadge: React.FC<AiDetectBadgeProps> = ({ verdict = 'AI-Generated', score = '99.9%' }) => {
  const isAi = verdict.toLowerCase().includes('ai') || verdict.toLowerCase().includes('synthetic') || verdict.toLowerCase().includes('manipulated');
  const cleanScore = typeof score === 'string' && score.includes('%') ? score : `${score}%`;
  
  return (
    <div className="my-3 p-3 sm:px-4 sm:py-3 rounded-xl ai-detect-badge text-right animate-in fade-in duration-150 select-none" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 ai-detect-text">
              AI DETECT
            </span>
            <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
              فحص وتحقق الذكاء الاصطناعي الفائق
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-300 font-sans mt-0.5 leading-relaxed font-normal">
            النتيجة: <span className="font-semibold text-white">{isAi ? 'صورة مولدة بالذكاء الاصطناعي (AI-Generated)' : 'صورة حقيقية ملتقطة بكاميرا (Authentic Photograph)'}</span> — دقة التوافق الإحصائي: <span className="font-mono font-bold text-emerald-400">{cleanScore}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const TimeDetectBadge: React.FC<{
  title?: string;
  subtitle?: string;
  details?: string;
}> = ({
  title = 'استشعار وتدقيق المعطيات الزمنية الفائقة',
  subtitle = 'مطابقة التوقيت والسنة المعتمدة (2026)',
  details,
}) => {
  return (
    <div className="my-3 p-3.5 sm:px-4 sm:py-3.5 rounded-2xl time-detect-glass text-right animate-in fade-in duration-200 select-none shadow-xl border border-white/20" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full time-detect-glass">
              <TimeDetectIcon />
              <span className="time-detect-text">TIME DETECT</span>
            </span>
            <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
              {title}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-300 font-sans mt-1 leading-relaxed font-normal">
            الحالة: <span className="font-semibold text-white">{subtitle}</span>
            {details ? ` — ${details}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// Synthetic Web Audio beep generator (zero external mp3 dependency)
function playTimerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.25); // A5
    gain2.gain.setValueAtTime(0.3, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.9);
  } catch (err) {
    // Ignore audio restrictions
  }
}

export const TimeDetectTimer: React.FC<{
  initialSeconds?: number;
  durationLabel?: string;
  title?: string;
}> = ({
  initialSeconds = 300,
  durationLabel = '5 دقائق',
  title = 'مؤقت ذكي تفاعلي'
}) => {
  const [totalSeconds] = useState<number>(Math.max(1, initialSeconds));
  const [remaining, setRemaining] = useState<number>(Math.max(1, initialSeconds));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, remaining]);

  const handleTogglePlay = () => {
    if (isCompleted) {
      setRemaining(totalSeconds);
      setIsCompleted(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setRemaining(totalSeconds);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <div className="my-3 p-3.5 sm:p-4 rounded-2xl time-detect-badge border border-amber-500/20 text-right animate-in fade-in duration-200 select-none shadow-xl" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md bg-zinc-900 border border-amber-500/30 time-detect-text">
            TIME DETECT
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            {title}
          </span>
        </div>
        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300">
          {durationLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider dir-ltr text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer select-none active:scale-95 border",
                isRunning
                  ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200"
                  : isCompleted
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-200"
                  : "bg-white/[0.1] hover:bg-white/[0.16] border-white/[0.2] text-white"
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : isCompleted ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة تشغيل</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء المؤقت</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all border border-white/[0.08] cursor-pointer"
              title="إعادة ضبط"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>انتهى وقت المؤقت!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export const TimeDetectReminder: React.FC<{
  targetDateIso?: string;
  reminderText?: string;
}> = ({
  targetDateIso = '',
  reminderText = 'تذكير بموعد مهم'
}) => {
  const [targetDate] = useState<Date>(() => {
    if (targetDateIso) {
      const d = new Date(targetDateIso);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 1);
    return fallback;
  });

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('حان موعد التذكير!');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days} يوم`);
      if (hours > 0) parts.push(`${hours} ساعة`);
      if (minutes > 0) parts.push(`${minutes} دقيقة`);
      if (days === 0 && hours === 0) parts.push(`${seconds} ثانية`);
      setTimeLeft(parts.join(' و ') || 'أقل من دقيقة');
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const dateStr = targetDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="my-3 p-3.5 sm:p-4 rounded-2xl time-detect-badge border border-amber-500/20 text-right animate-in fade-in duration-200 select-none shadow-xl" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md bg-zinc-900 border border-amber-500/30 time-detect-text">
            TIME DETECT
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-400" />
            تذكير زمني ذكي مجدول
          </span>
        </div>
        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
          مجدول
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-sm sm:text-base font-bold text-white">
            {reminderText}
          </div>
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{dateStr}</span>
          </div>
          <div className="text-xs text-amber-300 font-medium mt-1">
            ⏳ متبقي: <span className="font-bold text-white">{timeLeft}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSaved(true)}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none active:scale-95 shrink-0",
            isSaved
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/[0.16]"
          )}
        >
          {isSaved ? "✓ تم حفظ التذكير" : "تأكيد الجدولة"}
        </button>
      </div>
    </div>
  );
};

export const TimeDetectAutoDelete: React.FC<{
  initialSeconds?: number;
  durationLabel?: string;
}> = ({
  initialSeconds = 600,
  durationLabel = '10 دقائق'
}) => {
  const [remaining, setRemaining] = useState<number>(Math.max(5, initialSeconds));
  const [isCancelled, setIsCancelled] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  useEffect(() => {
    if (isCancelled || isDestroyed) return;
    if (remaining <= 0) {
      setIsDestroyed(true);
      playTimerChime();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('x1:autodelete-chat'));
      }, 1200);
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 4 && prev > 1) {
          playTimerChime();
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCancelled, isDestroyed, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progressPercent = Math.max(0, Math.min(100, (remaining / (initialSeconds || 600)) * 100));

  return (
    <div className="my-3 p-4 sm:p-5 rounded-2xl time-detect-glass text-right animate-in fade-in duration-200 select-none shadow-2xl border border-amber-500/30" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.1] pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full time-detect-glass text-amber-300 border border-amber-500/40 shadow-sm">
            <TimeDetectIcon />
            <span className="time-detect-text">TIME DETECT</span>
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-amber-100 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-amber-400 animate-pulse" />
            نظام التدمير الذاتي للمحادثة
          </span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold shadow-inner">
          {durationLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-300 font-sans leading-relaxed">
            {isDestroyed ? (
              <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-amber-500 animate-ping" />
                تم تدمير المحادثة ذاتياً بنجاح ومسح السجل...
              </span>
            ) : isCancelled ? (
              <span className="text-emerald-400 font-bold">✓ تم إيقاف التدمير الذاتي بنجاح والاحتفاظ بالمحادثة.</span>
            ) : (
              'سيتم مسح هذه المحادثة بالكامل وتدمير سجلها محلياً وسحابياً فور انتهاء العداد:'
            )}
          </div>

          {!isCancelled && !isDestroyed && (
            <div className="flex items-center gap-3 mt-2">
              <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 dir-ltr text-right tracking-tight drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.1]">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-400 transition-all duration-1000 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!isCancelled && !isDestroyed && (
          <button
            type="button"
            onClick={() => setIsCancelled(true)}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-zinc-200 hover:text-white text-xs font-bold border border-white/[0.2] transition-all cursor-pointer active:scale-95 shadow-md"
          >
            إلغاء التدمير
          </button>
        )}
      </div>
    </div>
  );
};

function getChildText(node: React.ReactNode): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getChildText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as any;
    if (props?.href) return props.href;
    if (props?.children) return getChildText(props.children);
  }
  return '';
}

function parseCustomBadges(rawContent: string, fallbackMediaUrl?: string | null): React.ReactNode | null {
  // 1. Time Detect - Timer (Interactive widget only)
  const timerMatch = rawContent.match(/(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?TIMER:\s*(\d+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?TIMER:\s*(\d+))/i);
  if (timerMatch) {
    const seconds = parseInt(timerMatch[1] || timerMatch[4] || '300', 10);
    const label = timerMatch[2]?.trim() || `${Math.round(seconds / 60)} دقائق`;
    const title = timerMatch[3]?.trim() || 'مؤقت ذكي تفاعلي';
    return <TimeDetectTimer initialSeconds={seconds} durationLabel={label} title={title} />;
  }

  // 2. Time Detect - Reminder (Interactive widget only)
  const reminderMatch = rawContent.match(/(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?REMINDER:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?REMINDER:\s*([^|\n]+))/i);
  if (reminderMatch) {
    const iso = (reminderMatch[1] || reminderMatch[3])?.trim() || '';
    const text = (reminderMatch[2] || 'تذكير بموعد مهم')?.trim();
    return <TimeDetectReminder targetDateIso={iso} reminderText={text} />;
  }

  // 3. Time Detect - Auto Delete (Interactive widget only)
  const autoDeleteMatch = rawContent.match(/(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?AUTODELETE:\s*(\d+)\s*(?:\|\s*([^\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?AUTODELETE:\s*(\d+))/i);
  if (autoDeleteMatch) {
    const seconds = parseInt(autoDeleteMatch[1] || autoDeleteMatch[3] || '600', 10);
    const label = autoDeleteMatch[2]?.trim() || `${Math.round(seconds / 60)} دقائق`;
    return <TimeDetectAutoDelete initialSeconds={seconds} durationLabel={label} />;
  }

  // 4. Download Button - Inline Instant Download Action
  const buttonMatch = rawContent.match(/(?:\[[^\]]*?DOWNLOAD[-\s_]?BUTTON:\s*([^|\]]+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?BUTTON:\s*([^|\n]+)\s*(?:\|\s*([^|\n]+))?)/i);
  if (buttonMatch) {
    let rawTargetUrl = (buttonMatch[1] || buttonMatch[4])?.trim() || '';
    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
    const quality = (buttonMatch[2] || buttonMatch[5] || '1080p')?.trim();
    const title = buttonMatch[3]?.trim() || '';
    const finalUrl = rawTargetUrl || fallbackMediaUrl || '';
    if (finalUrl) {
      return <DownloadButton url={finalUrl} quality={quality} title={title} />;
    }
  }

  // 5. Download Detect - Interactive Card (Sleek Compact Widget)
  const downloadMatch = rawContent.match(/(?:\[[^\]]*?DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\n]+))/i);
  if (downloadMatch) {
    let rawTargetUrl = (downloadMatch[1] || downloadMatch[3])?.trim() || '';
    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
    const finalUrl = rawTargetUrl || fallbackMediaUrl || '';
    if (finalUrl) {
      return <DownloadDetectCard url={finalUrl} />;
    }
  }

  return null;
}

function CodeBlock({ className, children, language }: { className?: string; children: React.ReactNode; language: string }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 sm:my-3 rounded-xl border border-white/[0.1] bg-black/85 overflow-hidden font-mono text-xs text-left shadow-lg" dir="ltr">
      <div className="flex justify-between items-center bg-white/[0.05] px-3 py-1.5 border-b border-white/[0.08] text-zinc-400 text-[11px]">
        <span className="font-mono text-zinc-300 font-semibold uppercase">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer select-none active:scale-95 px-2 py-0.5 rounded hover:bg-white/[0.08]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 sm:p-3.5 overflow-x-auto text-zinc-200 text-xs leading-relaxed selection:bg-zinc-700">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  previousUserPrompt = '',
  isStreaming = false,
  globalUrlIndexMap = {},
  globalImageIndexMap = {},
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);
  const [confirmPhone, setConfirmPhone] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const handleCopy = () => {
    const cleanText = cleanMarkdownForClipboard(displayContent);
    navigator.clipboard.writeText(cleanText || displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sanitize and extract any raw ```thought or ```think blocks that leaked into content
  const { displayContent, effectiveReasoning } = useMemo(() => {
    let raw = message.content || '';
    let foundReasoning = message.reasoning || '';

    const thoughtRegex = /```(?:thought|think|thinking|reasoning)\s*\n?([\s\S]*?)```/gi;
    let match;
    while ((match = thoughtRegex.exec(raw)) !== null) {
      if (!foundReasoning) {
        foundReasoning = match[1].trim();
      }
    }
    raw = raw.replace(thoughtRegex, '').trim();

    return {
      displayContent: raw,
      effectiveReasoning: foundReasoning
    };
  }, [message.content, message.reasoning]);

  const hasReasoning = Boolean(effectiveReasoning && effectiveReasoning.trim().length > 0);
  const isThinking = Boolean(message.isThinking);

  // Universal Modular Features (نظام الخواص الشامل)
  const activeFeatures = getActiveDetectedFeatures(
    previousUserPrompt,
    message.reasoning,
    message.content,
    {
      isMemoryDetectTriggered: (message as any).isMemoryDetectTriggered,
      memoryDetectSummary: (message as any).memoryDetectSummary,
    }
  );
  const hasMemoryDetect = activeFeatures.some(f => f.id === 'memory_detect');

  // Intent classification on user request matching active features 100%
  const promptLower = previousUserPrompt.toLowerCase();
  const isMetadataIntent = activeFeatures.some(f => f.id === 'metadata_detect');
  const isAiDetectIntent = activeFeatures.some(f => f.id === 'ai_detect');
  const isTimeIntent = activeFeatures.some(f => f.id === 'time_detect');
  const hasDownloadDetect = activeFeatures.some(f => f.id === 'download_detect');

  const detectedMediaUrl = useMemo(() => {
    if (!hasDownloadDetect) return null;
    const mediaRegex = /(?:youtube\.com|youtu\.be|yt\.be|tiktok\.com|douyin\.com|instagram\.com|instagr\.am|ig\.me|twitter\.com|x\.com|t\.co|facebook\.com|fb\.watch|fb\.me|fb\.com|fb\.gg|reddit\.com|redd\.it|threads\.net|pinterest\.com|pin\.it|vimeo\.com|dailymotion\.com|dai\.ly|\.mp4|\.webm|\.mov|\.mkv|\.m3u8|\.mp3|\.wav|\.m4a)/i;
    
    // 1. Check current message content for media URL
    const inContent = extractAllCleanUrls(message.content || '', 5).urls.find(u => mediaRegex.test(u));
    if (inContent) return inContent;

    // 2. Check previous user prompt
    const inPrompt = extractAllCleanUrls(previousUserPrompt || '', 5).urls.find(u => mediaRegex.test(u));
    if (inPrompt) return inPrompt;

    return null;
  }, [hasDownloadDetect, message.content, previousUserPrompt]);

  // Dynamic thorough detection status phases
  const [loadingPhase, setLoadingPhase] = useState<'searching' | 'perceiving' | 'detecting'>('searching');

  useEffect(() => {
    if (isStreaming && !message.content) {
      setLoadingPhase('searching');
      const timer1 = setTimeout(() => {
        setLoadingPhase('perceiving');
      }, 1500);
      const timer2 = setTimeout(() => {
        setLoadingPhase('detecting');
      }, 3000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isStreaming, message.content]);

  if (isUser) {
    const urlExtraction = extractAllCleanUrls(message.content, 5);
    const messageUrls = urlExtraction.urls;
    const cleanPromptText = urlExtraction.remainingText;

    const hasVideoAttachment = message.mediaAttachments?.some(m => m.type === 'video');
    const rawImages = (message.images && message.images.length > 0)
      ? message.images
      : (message.image ? [message.image] : []);
    const allImages = hasVideoAttachment
      ? rawImages.filter(img => !message.videoKeyframes?.includes(img))
      : rawImages;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex justify-start my-2 group w-full"
      >
        <div className="w-full max-w-[94%] sm:max-w-[82%] rounded-2xl rounded-tr-sm glass-card text-white p-3 sm:p-4 text-right overflow-hidden break-words">
          
          {messageUrls.length > 0 && (
            <div className="mb-3 flex flex-col gap-2.5">
              {messageUrls.map((u, idx) => (
                <SingleLinkCard
                  key={`${u}-${idx}`}
                  url={u}
                  linkIndex={globalUrlIndexMap[u] || (messageUrls.length > 1 ? idx + 1 : undefined)}
                  onConfirmUrl={setConfirmUrl}
                />
              ))}
            </div>
          )}

          {/* Attached Images */}
          {allImages.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2.5">
              {allImages.map((imgSrc, idx) => {
                const imageIndex = globalImageIndexMap[imgSrc] || (idx + 1);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(imgSrc)}
                    className="relative group/img min-w-[140px] min-h-[100px] max-w-full rounded-2xl overflow-hidden border border-white/[0.18] hover:border-white/[0.45] bg-zinc-950/80 backdrop-blur-2xl p-1 cursor-pointer transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                  >
                    <img
                      src={imgSrc}
                      alt={`صورة ${imageIndex}`}
                      className="max-h-56 sm:max-h-64 w-auto max-w-full rounded-xl object-contain shadow-inner bg-black/40"
                    />
                    
                    {/* Glassmorphic Circular Index Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/80 backdrop-blur-xl border border-white/[0.22] shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                      <div className="w-4 h-4 min-w-[16px] min-h-[16px] aspect-square rounded-full bg-zinc-800/95 text-zinc-200 border border-white/[0.25] flex items-center justify-center font-bold text-[9px] shrink-0 font-mono shadow-inner select-none">
                        {imageIndex}
                      </div>
                      <span className="text-[10px] font-sans font-semibold text-zinc-200 tracking-tight">
                        صورة
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Attached Videos, Audios, and Documents */}
          {message.mediaAttachments && message.mediaAttachments.length > 0 && (
            <div className="mb-2.5 flex flex-col gap-2.5 w-full">
              {message.mediaAttachments.map((media, idx) => (
                <div key={media.id || idx} className="rounded-2xl border border-white/[0.15] bg-white/[0.03] backdrop-blur-2xl p-3 shadow-lg overflow-hidden w-full">
                  {media.type === 'video' ? (
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                        <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5 min-w-0 flex-1">
                          <Video className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                          <span className="truncate dir-ltr text-right" title={media.name}>فيديو: {media.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0 whitespace-nowrap">
                          {formatFileSize(media.size)} {media.duration ? `• ${formatMediaDuration(media.duration)}` : ''}
                        </span>
                      </div>
                      {media.dataUrl && (
                        <video src={media.dataUrl} controls className="max-h-56 w-full rounded-xl object-contain bg-black/60 shadow-md" />
                      )}
                    </div>
                  ) : media.type === 'audio' ? (
                    <div className="flex flex-col gap-2 w-full min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                        <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5 min-w-0 flex-1">
                          <Music className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                          <span className="truncate dir-ltr text-right" title={media.name}>مقطع صوتي: {media.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0 whitespace-nowrap">
                          {formatFileSize(media.size)} {media.duration ? `• ${formatMediaDuration(media.duration)}` : ''}
                        </span>
                      </div>
                      {media.dataUrl && (
                        <audio src={media.dataUrl} controls className="w-full mt-1" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate dir-ltr text-right" title={media.name}>{media.name}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{formatFileSize(media.size)}</div>
                        </div>
                      </div>
                    </div>
                  )}
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

          {cleanPromptText && (
            <div className="text-xs sm:text-base leading-relaxed whitespace-pre-wrap font-sans break-words text-zinc-100">
              {renderSmartContentWithLinksAndPhones(cleanPromptText, setConfirmUrl, setConfirmPhone, setConfirmEmail)}
            </div>
          )}

          <div className="mt-2 pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[11px] font-mono text-zinc-400 font-medium" dir="ltr">
              {normalizeDisplayTimestamp(message.timestamp)}
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
        </div>
        <LinkConfirmModal url={confirmUrl} onClose={() => setConfirmUrl(null)} />
        <PhoneConfirmModal phoneNumber={confirmPhone} onClose={() => setConfirmPhone(null)} />
        <EmailConfirmModal email={confirmEmail} onClose={() => setConfirmEmail(null)} />
      </motion.div>
    );
  }

  // Assistant Message
  const isCyber = message.model === 'deepseek-v4-flash-cyber';
  const isMedia = message.model === 'meta/muse-spark-1.2-contributor';
  const isVision = message.model === 'deepseek-v4-flash-vision-exp' || Boolean(message.image);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-start my-2 group w-full"
    >
      <div className="flex items-center justify-between w-full mb-1.5 px-1 text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-1.5 font-sans font-medium">
          {message.isX1 && (
            <span className="text-[10px] font-mono font-bold text-rose-400/90 tracking-wide px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              X1 MAX
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 font-medium tracking-wide shrink-0" dir="ltr">{normalizeDisplayTimestamp(message.timestamp)}</span>
      </div>

      <div className="w-full rounded-2xl p-3.5 sm:p-5 text-right border transition-all glass-panel text-zinc-100 overflow-hidden break-words">
        {(hasReasoning || isThinking) && (
          <ChatReasoning
            reasoningText={effectiveReasoning}
            isThinking={isThinking}
            isStreaming={isStreaming}
            isX1={message.isX1}
            isTimeIntent={isTimeIntent}
            activeFeatures={activeFeatures}
            defaultValue={isStreaming ? "reasoning" : undefined}
          />
        )}

        {isStreaming && !message.content ? (
          <div className="flex items-center gap-2 py-1.5 select-none w-full max-w-full" dir="rtl">
            <div className="inline-flex min-h-8 py-1.5 px-3 max-w-full items-center gap-2.5 rounded-2xl time-detect-glass flex-wrap">
              <ThinkingOrb
                state={hasDownloadDetect ? "shaping" : hasMemoryDetect ? "weaving" : isTimeIntent ? "solving" : isMedia ? "weaving" : isCyber ? "searching" : isVision ? (loadingPhase === 'detecting' ? "shaping" : "working") : message.isX1 ? "solving" : "composing"}
                size={20}
                theme="dark"
                speed={1.6}
              />
              <span className="text-xs font-sans font-medium text-zinc-300 flex items-center gap-1.5 flex-wrap">
                {hasDownloadDetect ? (
                  loadingPhase === 'searching' ? (
                    <>
                      <span>جارِ فحص الرابط واستخراج البث الفوري عبر</span>
                      <DownloadDetectIcon size={14} />
                      <span className="download-detect-text font-black text-xs">Download Detect</span>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>جارِ استخراج الجودات وتوليد روابط التحميل المباشرة عبر</span>
                      <DownloadDetectIcon size={14} />
                      <span className="download-detect-text font-black text-xs">Download Detect</span>
                      <span>...</span>
                    </>
                  )
                ) : hasMemoryDetect ? (
                  <>
                    <span>جارِ استدعاء الذاكرة السحابية واسترجاع سياق المحادثات عبر</span>
                    <MemoryDetectIcon size={14} />
                    <span className="memory-detect-text font-black text-xs">Memory Detect</span>
                    <span>...</span>
                  </>
                ) : isTimeIntent ? (
                  loadingPhase === 'searching' ? (
                    <>
                      <span>جارِ البحث الزمني العميق والتحقق من التواريخ عبر</span>
                      <TimeDetectIcon />
                      <span className="time-detect-text font-black text-xs">Time Detect</span>
                      <span>...</span>
                    </>
                  ) : loadingPhase === 'perceiving' ? (
                    <>
                      <span>جارِ استشعار الإحداثيات وتطبيق قواعد الوقت عبر</span>
                      <TimeDetectIcon />
                      <span className="time-detect-text font-black text-xs">Time Detect</span>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>جارِ تدقيق وحساب الفوارق الزمنية عبر</span>
                      <TimeDetectIcon />
                      <span className="time-detect-text font-black text-xs">Time Detect</span>
                      <span>...</span>
                    </>
                  )
                ) : isMetadataIntent ? (
                  loadingPhase === 'searching' ? (
                    <>
                      <span>جارِ البحث الجنائي واستخراج طبقات الميتاداتا عبر</span>
                      <MetadataDetectIcon size={14} />
                      <span className="meta-data-text font-black text-xs">Meta Data</span>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>جارِ تدقيق بيانات العتاد والموقع الجغرافي عبر</span>
                      <MetadataDetectIcon size={14} />
                      <span className="meta-data-text font-black text-xs">Meta Data</span>
                      <span>...</span>
                    </>
                  )
                ) : isAiDetectIntent ? (
                  loadingPhase === 'searching' ? (
                    <>
                      <span>جارِ البحث والتحقق العميق من المصادر ونمط التوليد عبر</span>
                      <AiDetectIcon size={14} />
                      <span className="ai-detect-text font-black text-xs">AI Detect</span>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>جارِ تدقيق البصمات وتحديد أصالة المعطيات عبر</span>
                      <AiDetectIcon size={14} />
                      <span className="ai-detect-text font-black text-xs">AI Detect</span>
                      <span>...</span>
                    </>
                  )
                ) : isMedia ? (
                  "جاري استيعاب الوسائط المتعددة واستخراج المعطيات..."
                ) : isVision ? (
                  "جاري فك وتوليد الإدراك البصري واستيعاب المعطيات..."
                ) : isCyber ? (
                  "جاري الاستطلاع الأمني وتدقيق الهدف والبحث الحي..."
                ) : message.isX1 ? (
                  "جاري تحرير المحرك العصبي واستدعاء الرد..."
                ) : (
                  "جاري توليد الاستجابة اللغوية الفصحى..."
                )}
              </span>
            </div>
          </div>
        ) : (
          <>
            {hasDownloadDetect && detectedMediaUrl && !message.content?.includes('[DOWNLOAD-DETECT-CARD:') && !message.content?.includes('[DOWNLOAD-BUTTON:') && (
              <div className="mb-3">
                <DownloadDetectCard url={detectedMediaUrl} />
              </div>
            )}
            <div className="prose prose-invert max-w-none text-zinc-200 text-xs sm:text-base leading-relaxed break-words font-sans">
              <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }: any) => {
                  const isTel = href?.startsWith('tel:');
                  const isMailto = href?.startsWith('mailto:');
                  return (
                    <bdi className="inline-flex items-center align-middle mx-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isMailto) {
                            setConfirmEmail(href.replace('mailto:', ''));
                          } else if (isTel) {
                            setConfirmPhone(href.replace('tel:', ''));
                          } else if (href) {
                            setConfirmUrl(href);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isMailto) {
                              setConfirmEmail(href.replace('mailto:', ''));
                            } else if (isTel) {
                              setConfirmPhone(href.replace('tel:', ''));
                            } else if (href) {
                              setConfirmUrl(href);
                            }
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 select-none cursor-pointer group/link",
                          isMailto ? "bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 group/email" :
                          isTel ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 group/phone" :
                          "bg-white/[0.06] text-zinc-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.1]"
                        )}
                        title={href}
                      >
                        {isMailto ? (
                          <Mail className="size-3 text-sky-400 group-hover/email:text-sky-300 shrink-0" />
                        ) : isTel ? (
                          <PhoneCall className="size-3 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0" />
                        ) : (
                          <Globe className="size-3 text-zinc-400 group-hover/link:text-zinc-200 shrink-0" />
                        )}
                        <span className="break-all dir-ltr underline underline-offset-2 text-zinc-200 group-hover/link:text-white font-mono">{children}</span>
                        {!isTel && !isMailto && (
                          <ExternalLink className="size-2.5 text-zinc-400 group-hover/link:text-zinc-200 shrink-0" />
                        )}
                      </span>
                    </bdi>
                  );
                },
                p: ({ children }) => {
                  const fullText = getChildText(children);

                  // 1. Check if there is a download button tag anywhere in this paragraph
                  const buttonMatch = fullText.match(/(?:\[[^\]]*?DOWNLOAD[-\s_]?BUTTON:\s*([^|\]]+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?BUTTON:\s*([^|\n]+)\s*(?:\|\s*([^|\n]+))?)/i);
                  if (buttonMatch) {
                    let rawTargetUrl = (buttonMatch[1] || buttonMatch[4])?.trim() || '';
                    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
                    const quality = (buttonMatch[2] || buttonMatch[5] || '1080p')?.trim();
                    const title = (buttonMatch[3] || '')?.trim();
                    const finalUrl = rawTargetUrl || detectedMediaUrl || '';

                    const fullMatchStr = buttonMatch[0];
                    const matchIdx = fullText.indexOf(fullMatchStr);
                    const beforeText = matchIdx > 0 ? fullText.slice(0, matchIdx).trim() : '';
                    const afterText = (matchIdx >= 0 && matchIdx + fullMatchStr.length < fullText.length)
                      ? fullText.slice(matchIdx + fullMatchStr.length).trim()
                      : '';

                    return (
                      <div className="my-3 space-y-2.5">
                        {beforeText && (
                          <p className="leading-relaxed text-zinc-200">
                            {renderSmartContentWithLinksAndPhones(beforeText, setConfirmUrl, setConfirmPhone, setConfirmEmail)}
                          </p>
                        )}
                        {finalUrl && (
                          <div className="py-1">
                            <DownloadButton url={finalUrl} quality={quality} title={title} />
                          </div>
                        )}
                        {afterText && (
                          <p className="leading-relaxed text-zinc-200">
                            {renderSmartContentWithLinksAndPhones(afterText, setConfirmUrl, setConfirmPhone, setConfirmEmail)}
                          </p>
                        )}
                      </div>
                    );
                  }

                  // 2. Check if there is a download detect card anywhere in this paragraph
                  const cardMatch = fullText.match(/(?:\[[^\]]*?DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\n]+))/i);
                  if (cardMatch) {
                    let rawTargetUrl = (cardMatch[1] || cardMatch[3])?.trim() || '';
                    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
                    const finalUrl = rawTargetUrl || detectedMediaUrl || '';

                    const fullMatchStr = cardMatch[0];
                    const matchIdx = fullText.indexOf(fullMatchStr);
                    const beforeText = matchIdx > 0 ? fullText.slice(0, matchIdx).trim() : '';
                    const afterText = (matchIdx >= 0 && matchIdx + fullMatchStr.length < fullText.length)
                      ? fullText.slice(matchIdx + fullMatchStr.length).trim()
                      : '';

                    return (
                      <div className="my-3 space-y-2.5">
                        {beforeText && (
                          <p className="leading-relaxed text-zinc-200">
                            {renderSmartContentWithLinksAndPhones(beforeText, setConfirmUrl, setConfirmPhone, setConfirmEmail)}
                          </p>
                        )}
                        {finalUrl && (
                          <div className="py-1">
                            <DownloadDetectCard url={finalUrl} />
                          </div>
                        )}
                        {afterText && (
                          <p className="leading-relaxed text-zinc-200">
                            {renderSmartContentWithLinksAndPhones(afterText, setConfirmUrl, setConfirmPhone, setConfirmEmail)}
                          </p>
                        )}
                      </div>
                    );
                  }

                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl);
                  if (customBadge) {
                    return customBadge;
                  }

                  // Suppress empty paragraphs that were generated by stripped badges
                  if (!fullText.trim()) return null;
                  return (
                    <p className="mb-2.5 sm:mb-3 last:mb-0 leading-relaxed">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </p>
                  );
                },
                h1: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl);
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h1 className="text-base sm:text-xl font-bold text-white my-2 sm:my-3 border-b border-white/[0.1] pb-1.5">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h1>
                  );
                },
                h2: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl);
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h2 className="text-sm sm:text-lg font-semibold text-zinc-100 my-2 sm:my-2.5">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h2>
                  );
                },
                h3: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl);
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h3 className="text-xs sm:text-base font-semibold text-white my-1.5 sm:my-2">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h3>
                  );
                },
                li: ({ children }) => (
                  <li className="my-0.5 leading-relaxed">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
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
                  <div className="my-3 overflow-x-auto rounded-xl border border-white/[0.14] bg-zinc-950/60 shadow-inner">
                    <table className="w-full text-xs sm:text-sm text-right border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-zinc-800/80 p-2.5 text-zinc-100 font-bold border-b border-zinc-700/80 text-xs sm:text-sm">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-2.5 border-b border-zinc-800/60 text-zinc-200 font-normal">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                  </td>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1].toLowerCase() : '';

                  const isPromptLang = ['prompt', 'prompts', 'ai-prompt', 'prompt-ai'].includes(lang);
                  const isAdLang = ['ad', 'ads', 'advertisement', 'copy', 'marketing'].includes(lang);
                  const isCoderLang = ['coder', 'ai-coder', 'system', 'system-prompt', 'instructions'].includes(lang);
                  const isScriptLang = ['script', 'scenario', 'hook'].includes(lang);
                  const isThoughtLang = ['thought', 'think', 'thinking', 'reasoning'].includes(lang);

                  if (!inline && isThoughtLang) {
                    return null;
                  }

                  if (!inline && (isPromptLang || isAdLang || isCoderLang || isScriptLang)) {
                    const type = isAdLang ? 'ad' : isCoderLang ? 'coder' : isScriptLang ? 'script' : 'prompt';
                    return <PromptCard text={String(children).replace(/\n$/, '')} type={type} />;
                  }

                  return !inline ? (
                    <CodeBlock className={className} language={match ? match[1] : 'code'}>
                      {children}
                    </CodeBlock>
                  ) : (
                    <code className="bg-white/[0.08] text-zinc-200 border border-white/[0.1] px-1.5 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>
                  );
                }
              }}
            >
              {(displayContent || '')
                .replace(/\[\s*(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?BADGE:[^\]]*\]/gi, '')
                .replace(/(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?BADGE:[^\n]*/gi, '')
                .trim()}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-zinc-300 animate-pulse mr-1 align-middle rounded-full" />
            )}
          </div>
        </>
      )}

        {message.content && !isStreaming && (
          <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-zinc-800/60 flex items-center justify-end text-xs text-zinc-500">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors px-2.5 py-1 rounded-lg hover:bg-zinc-800/80 active:scale-95 text-xs font-medium cursor-pointer"
              title="نسخ الرد"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">تم النسخ</span>
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
      <PhoneConfirmModal phoneNumber={confirmPhone} onClose={() => setConfirmPhone(null)} />
      <EmailConfirmModal email={confirmEmail} onClose={() => setConfirmEmail(null)} />
    </motion.div>
  );
};

export default ChatMessageComponent;
export { ChatMessageComponent as ChatMessage };
