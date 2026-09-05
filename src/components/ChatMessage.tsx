import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { highlightCode } from '@/lib/syntaxHighlighter';
import { ChatMessageItem, ResolvedLinkInfo } from '../types';
import ChatReasoning from './ui/chat-reasoning';
import { Check, Copy, Flame, X, ShieldCheck, Sparkles, Camera, ExternalLink, Globe, PhoneCall, Phone, Mail, Zap, Loader2, Play, Pause, Video, Music, FileText, FileCode, FileType, Clock, RotateCcw, Bell, Trash2, Calendar, CheckCircle2, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { detectAndExtractUrl, extractAllCleanUrls, getFaviconUrl, extractYouTubeVideoId, getYouTubeThumbnailUrl, normalizeDisplayTimestamp, cleanMarkdownForClipboard, sanitizeMarkdownDisplay, cn } from '@/lib/utils';
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
import { SvgStudioCard } from './ui/SvgStudioCard';
import { getActiveDetectedFeatures, MemoryDetectIcon, TimeDetectIcon, AiDetectIcon, MetadataDetectIcon, DownloadDetectIcon, SvgStudioIcon } from '@/lib/featuresRegistry';

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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;
    const controller = new AbortController();
    setIsResolving(true);
    setImgError(false);

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

  // Determine media type (Video vs Post vs Web)
  const isExplicitFbPost = /(?:facebook\.com|fb\.me)\/(?:share\/p\/|posts\/|permalink\.php|story\.php|photos\/|photo\/)/i.test(targetUrl);
  const isExplicitFbVideo = /(?:facebook\.com|fb\.watch)\/(?:reel|reels|watch|videos|share\/v\/|share\/r\/)/i.test(targetUrl);
  const isExplicitIgReel = /(?:instagram\.com|instagr\.am)\/(?:reel|reels|tv)/i.test(targetUrl);

  const isVideo = Boolean(
    isYouTube ||
    isTikTok ||
    (isInstagram && (isExplicitIgReel || resolvedInfo?.mediaType === 'video')) ||
    (isFacebook && (isExplicitFbVideo || resolvedInfo?.mediaType === 'video') && !isExplicitFbPost) ||
    (isTwitter && resolvedInfo?.mediaType === 'video') ||
    (resolvedInfo?.mediaType === 'video' && resolvedInfo?.isVideo !== false)
  );

  const isSocialPost = Boolean(
    !isVideo && (
      resolvedInfo?.mediaType === 'post' ||
      resolvedInfo?.mediaType === 'image' ||
      resolvedInfo?.postType === 'post' ||
      resolvedInfo?.postType === 'photo' ||
      isExplicitFbPost ||
      (isFacebook && !isExplicitFbVideo) ||
      (isInstagram && !isExplicitIgReel) ||
      isTwitter
    )
  );

  const videoPlatform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' = 
    isTikTok ? 'tiktok' :
    isInstagram ? 'instagram' :
    isFacebook ? 'facebook' :
    isTwitter ? 'twitter' : 'youtube';

  const rawThumbnailUrl = ytVideoId
    ? getYouTubeThumbnailUrl(ytVideoId)
    : (resolvedInfo?.videoMetadata?.thumbnailUrl || resolvedInfo?.brandAssets?.ogImage || resolvedInfo?.brandAssets?.twitterImage || null);
  
  const thumbnailUrl = !imgError ? rawThumbnailUrl : null;

  const platformTitle = resolvedInfo?.platformLabel || (
    isVideo
      ? (
        videoPlatform === 'tiktok' ? "فيديو تيك توك (TikTok Video)" :
        videoPlatform === 'instagram' ? "فيديو إنستغرام (Instagram Reel)" :
        videoPlatform === 'facebook' ? "فيديو فيسبوك (Facebook Video)" :
        videoPlatform === 'twitter' ? "فيديو إكس (X Video)" :
        "فيديو يوتيوب (YouTube Video)"
      )
      : (
        videoPlatform === 'facebook' ? "منشور فيسبوك (Facebook Post)" :
        videoPlatform === 'instagram' ? "منشور إنستغرام (Instagram Post)" :
        videoPlatform === 'twitter' ? "منشور إكس (X Post)" :
        "منشور وسائط اجتماعية (Social Post)"
      )
  );

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
                onError={() => setImgError(true)}
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

  // Social Post Card (Facebook Post, Instagram Post, X Post)
  if (isSocialPost) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border shadow-2xl p-3 sm:p-3.5 text-right animate-in fade-in duration-200 group/postcard",
        videoPlatform === 'facebook' ? "border-blue-500/30 bg-black/85" :
        videoPlatform === 'instagram' ? "border-pink-500/30 bg-black/85" :
        videoPlatform === 'twitter' ? "border-zinc-500/30 bg-black/85" :
        "border-cyan-500/30 bg-black/85"
      )}>
        {thumbnailUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-125 pointer-events-none transition-all duration-700 select-none"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/60 pointer-events-none" />

        {/* Post Card Header */}
        <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 font-sans font-bold text-xs text-zinc-200">
            {typeof linkIndex === 'number' && (
              <span className="w-5 h-5 min-w-[20px] min-h-[20px] aspect-square rounded-full bg-zinc-800/95 text-zinc-200 border border-white/[0.25] font-mono text-[10px] font-bold flex items-center justify-center shadow-inner">
                {linkIndex}
              </span>
            )}
            <div className={cn(
              "size-5 rounded-md flex items-center justify-center border",
              videoPlatform === 'facebook' ? "bg-blue-600/20 border-blue-500/30 text-blue-400" :
              videoPlatform === 'instagram' ? "bg-pink-500/20 border-pink-500/30 text-pink-400" :
              videoPlatform === 'twitter' ? "bg-zinc-700/30 border-zinc-500/30 text-zinc-300" :
              "bg-cyan-600/20 border-cyan-500/30 text-cyan-400"
            )}>
              <FileText className="size-3" />
            </div>
            <span>{platformTitle}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isResolving ? (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 font-bold flex items-center gap-1 animate-pulse">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>SCRAPING...</span>
              </span>
            ) : (
              <span className={cn(
                "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                videoPlatform === 'facebook' ? "bg-blue-600/20 text-blue-300 border-blue-500/30" :
                videoPlatform === 'instagram' ? "bg-pink-500/15 text-pink-300 border-pink-500/30" :
                videoPlatform === 'twitter' ? "bg-zinc-700/40 text-zinc-200 border-zinc-500/30" :
                "bg-cyan-600/20 text-cyan-300 border-cyan-500/30"
              )}>
                <PlatformLogo url={targetUrl} className="size-3" size={12} />
                <span className="uppercase">{videoPlatform}</span>
              </span>
            )}
          </div>
        </div>

        {/* Clickable Post Preview */}
        <button
          type="button"
          onClick={() => onConfirmUrl(displayUrl || url)}
          className={cn(
            "relative z-10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border transition-all cursor-pointer shadow-lg backdrop-blur-md w-full text-right",
            videoPlatform === 'facebook' ? "border-white/[0.10] hover:border-blue-500/40" :
            videoPlatform === 'instagram' ? "border-white/[0.10] hover:border-pink-500/40" :
            videoPlatform === 'twitter' ? "border-white/[0.10] hover:border-zinc-400/40" :
            "border-white/[0.10] hover:border-cyan-500/40"
          )}
        >
          {thumbnailUrl ? (
            <div className="relative shrink-0 rounded-lg overflow-hidden border border-white/[0.15] bg-zinc-950 shadow-md group-hover/postcard:scale-[1.02] transition-transform aspect-video sm:w-36 h-24">
              <img
                src={thumbnailUrl}
                alt={resolvedInfo?.title || 'Post Image'}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="size-10 sm:size-12 rounded-xl bg-zinc-950/80 border border-white/[0.15] flex items-center justify-center shrink-0 shadow-md backdrop-blur-md">
              <PlatformLogo url={targetUrl} className="size-6" size={24} />
            </div>
          )}

          <div className="flex flex-col justify-center flex-1 min-w-0 text-right gap-1 py-0.5">
            <h4 className={cn(
              "text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug transition-colors font-sans",
              videoPlatform === 'facebook' ? "group-hover/postcard:text-blue-200" :
              videoPlatform === 'instagram' ? "group-hover/postcard:text-pink-200" :
              videoPlatform === 'twitter' ? "group-hover/postcard:text-zinc-200" :
              "group-hover/postcard:text-cyan-200"
            )} title={resolvedInfo?.title || ''}>
              {resolvedInfo?.title || 'جاري استخراج تفاصيل ومحتوى المنشور...'}
            </h4>
            {resolvedInfo?.videoMetadata?.authorName && (
              <p className="text-[11px] text-zinc-300 flex items-center gap-1 font-sans">
                <span className="text-zinc-400 font-medium">صاحب المنشور:</span>
                <span className="text-zinc-100 font-semibold">{resolvedInfo.videoMetadata.authorName}</span>
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-1 dir-ltr text-left">
              <ExternalLink className={cn(
                "size-3 shrink-0",
                videoPlatform === 'facebook' ? "text-blue-400" :
                videoPlatform === 'instagram' ? "text-pink-400" :
                videoPlatform === 'twitter' ? "text-zinc-300" :
                "text-cyan-400"
              )} />
              <span className="truncate text-zinc-300 group-hover/postcard:underline">{displayUrl}</span>
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
    <div className="my-4 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 hover:border-white/20 text-right select-none animate-in fade-in duration-200" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300">
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
    <div className="my-4 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 hover:border-white/20 text-right select-none animate-in fade-in duration-200" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-sans font-bold text-zinc-100">
            تذكير زمني ذكي مجدول
          </span>
        </div>
        <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
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
          {isSaved ? "تم حفظ التذكير" : "تأكيد الجدولة"}
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
    <div className="my-4 relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/[0.08] to-white/[0.02] p-5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 hover:border-rose-500/30 text-right select-none animate-in fade-in duration-200" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.1] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <Trash2 className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-sans font-bold text-rose-200">
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
                <span className="relative flex size-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
                </span>
                تم تدمير المحادثة ذاتياً بنجاح ومسح السجل...
              </span>
            ) : isCancelled ? (
              <span className="text-emerald-400 font-bold">تم إيقاف التدمير الذاتي بنجاح والاحتفاظ بالمحادثة.</span>
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

function parseCustomBadges(
  rawContent: string,
  fallbackMediaUrl?: string | null,
  handlers?: {
    setConfirmUrl?: (url: string) => void;
    setConfirmPhone?: (phone: string) => void;
    setConfirmEmail?: (email: string) => void;
  }
): React.ReactNode | null {
  if (!rawContent || typeof rawContent !== 'string' || !/(?:DETECT|TIMER|REMINDER|AUTODELETE|DOWNLOAD)/i.test(rawContent)) return null;

  const widgets: React.ReactNode[] = [];
  let workingContent = rawContent;

  // 1. AI Detect Badge: [AI-DETECT-BADGE: <verdict> | <score>]
  const aiBadgeRegex = /(?:\[[^\]]*?AI[-\s_]?DETECT[-\s_]?BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|AI[-\s_]?DETECT[-\s_]?BADGE:\s*([^|\n]+)\s*(?:\|\s*([^\n\]]+))?)/gi;
  let aiMatch: RegExpExecArray | null;
  while ((aiMatch = aiBadgeRegex.exec(workingContent)) !== null) {
    const verdict = (aiMatch[1] || aiMatch[3])?.trim() || 'AI-Generated';
    const score = (aiMatch[2] || aiMatch[4])?.trim() || '99.9%';
    widgets.push(<AiDetectBadge key={`ai-badge-${aiMatch.index}-${verdict}`} verdict={verdict} score={score} />);
  }
  workingContent = workingContent.replace(aiBadgeRegex, '');

  // 2. Time Detect - Timer (Interactive widget only)
  const timerRegex = /(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?TIMER:\s*(\d+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?TIMER:\s*(\d+))/gi;
  let timerMatch: RegExpExecArray | null;
  while ((timerMatch = timerRegex.exec(workingContent)) !== null) {
    const seconds = parseInt(timerMatch[1] || timerMatch[4] || '300', 10);
    const label = timerMatch[2]?.trim() || `${Math.round(seconds / 60)} دقائق`;
    const title = timerMatch[3]?.trim() || 'مؤقت ذكي تفاعلي';
    widgets.push(<TimeDetectTimer key={`timer-${timerMatch.index}-${seconds}`} initialSeconds={seconds} durationLabel={label} title={title} />);
  }
  workingContent = workingContent.replace(timerRegex, '');

  // 3. Time Detect - Reminder (Interactive widget only)
  const reminderRegex = /(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?REMINDER:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?REMINDER:\s*([^|\n]+))/gi;
  let reminderMatch: RegExpExecArray | null;
  while ((reminderMatch = reminderRegex.exec(workingContent)) !== null) {
    const iso = (reminderMatch[1] || reminderMatch[3])?.trim() || '';
    const text = (reminderMatch[2] || 'تذكير بموعد مهم')?.trim();
    widgets.push(<TimeDetectReminder key={`reminder-${reminderMatch.index}-${iso}`} targetDateIso={iso} reminderText={text} />);
  }
  workingContent = workingContent.replace(reminderRegex, '');

  // 4. Time Detect - Auto Delete (Interactive widget only)
  const autoDeleteRegex = /(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?AUTODELETE:\s*(\d+)\s*(?:\|\s*([^|\]]+))?\]|TIME[-\s_]?DETECT[-\s_]?AUTODELETE:\s*(\d+))/gi;
  let autoDeleteMatch: RegExpExecArray | null;
  while ((autoDeleteMatch = autoDeleteRegex.exec(workingContent)) !== null) {
    const seconds = parseInt(autoDeleteMatch[1] || autoDeleteMatch[3] || '600', 10);
    const label = autoDeleteMatch[2]?.trim() || `${Math.round(seconds / 60)} دقائق`;
    widgets.push(<TimeDetectAutoDelete key={`autodelete-${autoDeleteMatch.index}-${seconds}`} initialSeconds={seconds} durationLabel={label} />);
  }
  workingContent = workingContent.replace(autoDeleteRegex, '');

  // 5. Time Detect - Badge: [TIME-DETECT-BADGE: <title> | <subtitle>]
  const timeBadgeRegex = /(?:\[[^\]]*?TIME[-\s_]?DETECT[-\s_]?BADGE:\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\])/gi;
  let timeBadgeMatch: RegExpExecArray | null;
  while ((timeBadgeMatch = timeBadgeRegex.exec(workingContent)) !== null) {
    const title = timeBadgeMatch[1]?.trim() || 'استشعار وتدقيق المعطيات الزمنية الفائقة';
    const subtitle = timeBadgeMatch[2]?.trim() || 'مطابقة التوقيت والسنة المعتمدة (2026)';
    widgets.push(<TimeDetectBadge key={`time-badge-${timeBadgeMatch.index}`} title={title} subtitle={subtitle} />);
  }
  workingContent = workingContent.replace(timeBadgeRegex, '');

  // 6. Download Button - Inline Instant Download Action
  const buttonRegex = /(?:\[[^\]]*?DOWNLOAD[-\s_]?BUTTON:\s*([^|\]]+)\s*(?:\|\s*([^|\]]+))?\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?BUTTON:\s*([^|\n]+)\s*(?:\|\s*([^|\n]+))?)/gi;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonRegex.exec(workingContent)) !== null) {
    let rawTargetUrl = (buttonMatch[1] || buttonMatch[4])?.trim() || '';
    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
    const quality = (buttonMatch[2] || buttonMatch[5] || '1080p')?.trim();
    const title = buttonMatch[3]?.trim() || '';
    const finalUrl = rawTargetUrl || fallbackMediaUrl || '';
    if (finalUrl) {
      widgets.push(<DownloadButton key={`dl-btn-${buttonMatch.index}-${finalUrl}`} url={finalUrl} quality={quality} title={title} />);
    }
  }
  workingContent = workingContent.replace(buttonRegex, '');

  // 7. Download Detect - Interactive Card (Sleek Compact Widget)
  const downloadCardRegex = /(?:\[[^\]]*?DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\]]+)\s*(?:\|\s*([^\]]+))?\]|DOWNLOAD[-\s_]?(?:DETECT[-\s_]?)?(?:CARD|BADGE):\s*([^|\n]+))/gi;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = downloadCardRegex.exec(workingContent)) !== null) {
    let rawTargetUrl = (cardMatch[1] || cardMatch[3])?.trim() || '';
    rawTargetUrl = rawTargetUrl.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$2').replace(/[<>\s]/g, '');
    const finalUrl = rawTargetUrl || fallbackMediaUrl || '';
    if (finalUrl) {
      widgets.push(<DownloadDetectCard key={`dl-card-${cardMatch.index}-${finalUrl}`} url={finalUrl} />);
    }
  }
  workingContent = workingContent.replace(downloadCardRegex, '');

  if (widgets.length === 0) return null;

  const remainingText = workingContent.trim();

  return (
    <div className="my-3 space-y-3">
      {remainingText && handlers?.setConfirmUrl && (
        <p className="leading-relaxed text-zinc-200">
          {renderSmartContentWithLinksAndPhones(remainingText, handlers.setConfirmUrl, handlers.setConfirmPhone || (() => {}), handlers.setConfirmEmail)}
        </p>
      )}
      {widgets.map((w, idx) => (
        <div key={`widget-item-${idx}`} className="transition-all duration-200">
          {w}
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ className, children, language }: { className?: string; children: React.ReactNode; language: string }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = useMemo(() => {
    return highlightCode(codeText, language);
  }, [codeText, language]);

  return (
    <div className="my-2.5 sm:my-3 rounded-xl border border-white/[0.1] bg-[#090b10] overflow-hidden font-mono text-xs text-left shadow-lg" dir="ltr">
      <div className="flex justify-between items-center bg-white/[0.04] px-3 py-1.5 border-b border-white/[0.08] text-zinc-400 text-[11px]">
        <span className="font-mono text-zinc-300 font-semibold uppercase tracking-wider">{language || 'code'}</span>
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
        <code
          className={cn(className, `language-${language || 'code'}`)}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
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

  // Sanitize and extract any raw think tags or reasoning blocks that leaked into content
  const { displayContent, effectiveReasoning } = useMemo(() => {
    let raw = message.content || '';
    let foundReasoning = message.reasoning || '';

    // 1. Extract and strip <think>...</think> or <thought>...</thought>
    const thinkTagRegex = /<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/gi;
    let thinkMatch;
    while ((thinkMatch = thinkTagRegex.exec(raw)) !== null) {
      const extracted = thinkMatch[1].trim();
      if (extracted) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
      }
    }
    raw = raw.replace(thinkTagRegex, '').trim();

    // 1.b. Extract and strip token-based reasoning markers (<|begin_of_thought|>...<|end_of_thought|>, etc.)
    const tokenThoughtRegex = /<\|(?:begin_of_thought|thought|think)\|>([\s\S]*?)(?:<\|(?:end_of_thought|\/thought|\/think)\|>|$)/gi;
    let tokenMatch;
    while ((tokenMatch = tokenThoughtRegex.exec(raw)) !== null) {
      const extracted = tokenMatch[1].trim();
      if (extracted) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
      }
    }
    raw = raw.replace(tokenThoughtRegex, '').trim();

    // 1.c. Extract and strip unclosed streaming <think> or <thought> tag so stream doesn't leak into main text
    const unclosedThinkMatch = /<(?:think|thought)>([\s\S]*)$/i.exec(raw);
    if (unclosedThinkMatch) {
      const unclosedReasoning = unclosedThinkMatch[1].trim();
      if (unclosedReasoning) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${unclosedReasoning}` : unclosedReasoning;
      }
      raw = raw.replace(/<(?:think|thought)>[\s\S]*$/i, '').trim();
    }

    // 2. Extract and strip ```thought / ```think fences (closed)
    const thoughtRegex = /```(?:thought|think|thinking|reasoning)\s*\n?([\s\S]*?)```/gi;
    let match;
    while ((match = thoughtRegex.exec(raw)) !== null) {
      const extracted = match[1].trim();
      if (extracted) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
      }
    }
    raw = raw.replace(thoughtRegex, '').trim();

    // 2.b. Extract and strip unclosed streaming ```thought / ```think code fence
    const unclosedThoughtFenceMatch = /```(?:thought|think|thinking|reasoning)\s*\n?([\s\S]*)$/i.exec(raw);
    if (unclosedThoughtFenceMatch) {
      const unclosedReasoning = unclosedThoughtFenceMatch[1].trim();
      if (unclosedReasoning) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${unclosedReasoning}` : unclosedReasoning;
      }
      raw = raw.replace(/```(?:thought|think|thinking|reasoning)\s*\n?[\s\S]*$/i, '').trim();
    }

    // 3. Extract and strip leaked [S0: DISSECT] / [S1: PRUNE] / [S2: VERIFY] / [S3: CONVERGE] monologue blocks
    const contentBoundaryLookahead = '(?=\\n\\n(?:[-#*•`~|\\[\\]$0-9\\u0621-\\u064A]|\\$\\$|\\\\\\(|\\[|\\d+\\.)|\\n[#*•-]*\\s*[\\u0621-\\u064A]|$)';
    const sBlockRegex = new RegExp(`\\[(?:S\\d|DISSECT|PRUNE|VERIFY|LOCK|CONVERGE)\\][\\s\\S]*?${contentBoundaryLookahead}`, 'gi');
    if (sBlockRegex.test(raw)) {
      const extractedMatches = raw.match(sBlockRegex);
      if (extractedMatches && extractedMatches.length > 0) {
        const extracted = extractedMatches.join('\n\n').trim();
        if (extracted) {
          foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
          raw = raw.replace(sBlockRegex, '').trim();
        }
      }
    }

    // 4. Extract and strip leaked search citations / snippet dumps
    const searchSnippetRegex = new RegExp(`(?:-?\\s*الاستعلام\\s*الشبكي|•\\s*المصدر\\s*\\[\\d+\\])[\\s\\S]*?${contentBoundaryLookahead}`, 'gi');
    let searchSnippetMatch;
    while ((searchSnippetMatch = searchSnippetRegex.exec(raw)) !== null) {
      const extracted = searchSnippetMatch[0].trim();
      if (extracted) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
      }
    }
    raw = raw.replace(searchSnippetRegex, '').trim();

    // 5. Extract and strip leaked English thinking / chain-of-thought monologues
    const englishCoTRegex = new RegExp(`(?:We need answer|Need obey strict|Need analyze|Need understand|User asks:|Let's restate|Need solve puzzle|Let's think|Case 1:|Case 2:)[\\s\\S]*?${contentBoundaryLookahead}`, 'gi');
    let englishCoTMatch;
    while ((englishCoTMatch = englishCoTRegex.exec(raw)) !== null) {
      const extracted = englishCoTMatch[0].trim();
      if (extracted) {
        foundReasoning = foundReasoning ? `${foundReasoning}\n\n${extracted}` : extracted;
      }
    }
    raw = raw.replace(englishCoTRegex, '').trim();

    // 6. If raw content was an exact duplicate of stored message.reasoning (from prior storage fallback), clear duplicate display
    if (raw.trim() && message.reasoning?.trim() && raw.trim() === message.reasoning.trim()) {
      raw = '';
    }

    // 7. Resilient Recovery: If raw became empty after regex stripping, restore the actual answer portion
    if (!raw.trim() && foundReasoning.trim() && !message.isThinking) {
      const tableMatch = foundReasoning.match(/\|[\s\S]*?\|/);
      const mathOrGeneralMatch = foundReasoning.search(/\n\n(?=[\u0621-\u064A0-9`#*•\-\\|$~]|\\\[|\$\$)/);
      if (tableMatch) {
        const tableIndex = foundReasoning.indexOf(tableMatch[0]);
        raw = foundReasoning.substring(tableIndex).trim();
        foundReasoning = foundReasoning.substring(0, tableIndex).trim();
      } else if (mathOrGeneralMatch !== -1) {
        raw = foundReasoning.substring(mathOrGeneralMatch).trim();
        foundReasoning = foundReasoning.substring(0, mathOrGeneralMatch).trim();
      } else if (message.content && message.content.trim()) {
        raw = message.content.trim();
      }
    }

    // 7.b. Resilient SVG Recovery: If raw does not contain <svg, but foundReasoning contains an SVG block, extract it
    const rawHasSvg = raw.includes('<svg') && (raw.includes('</svg>') || message.isThinking);
    if (!rawHasSvg && foundReasoning.includes('<svg')) {
      const svgCodeMatch = /```(?:svg|xml|html)?\s*(<svg[\s\S]*?(?:<\/svg>|$))/i.exec(foundReasoning) ||
        /(<svg[\s\S]*?(?:<\/svg>|$))/i.exec(foundReasoning);
      if (svgCodeMatch) {
        const extractedSvg = svgCodeMatch[1].trim();
        const formattedBlock = extractedSvg.startsWith('```')
          ? extractedSvg
          : `\`\`\`svg\n${extractedSvg}${extractedSvg.includes('</svg>') ? '' : '\n</svg>'}\n\`\`\``;
        raw = raw ? `${raw}\n\n${formattedBlock}` : formattedBlock;
        foundReasoning = foundReasoning.replace(svgCodeMatch[0], '').trim();
      }
    }

    // 7.c. Auto-wrap raw un-fenced <svg ... </svg> in raw content to ensure SvgStudioCard is activated
    if (raw.includes('<svg') && !raw.includes('```svg') && !raw.includes('```xml') && !raw.includes('```html')) {
      raw = raw.replace(/(<svg[\s\S]*?<\/svg>)/gi, '\n\n```svg\n$1\n```\n\n');
    }

    return {
      displayContent: raw,
      effectiveReasoning: foundReasoning
    };
  }, [message.content, message.reasoning, message.isThinking]);

  const hasReasoning = Boolean(effectiveReasoning && effectiveReasoning.trim().length > 0);
  const isThinking = Boolean(message.isThinking);

  const hasImagesInChat = Boolean(
    Object.keys(globalImageIndexMap).length > 0 ||
    message.image ||
    (message as any).imagePreview ||
    (Array.isArray(message.content) && message.content.some((c: any) => c.type === 'image_url' || c.image_url))
  );

  const hasFilesAttached = Boolean(
    (message as any).hasMedia ||
    (message as any).hasFiles ||
    (message as any).attachments?.length ||
    (message as any).files?.length ||
    message.model === 'meta/muse-spark-1.2-contributor' ||
    message.model?.includes('spark')
  );

  // Universal Modular Features (نظام الخواص الشامل)
  const activeFeatures = getActiveDetectedFeatures(
    previousUserPrompt,
    message.reasoning,
    message.content,
    {
      isMemoryDetectTriggered: (message as any).isMemoryDetectTriggered,
      memoryDetectSummary: (message as any).memoryDetectSummary,
      hasSearchGrounding: Boolean(message.reasoning?.includes('Fathom Search') || message.reasoning?.includes('الاستعلام الشبكي') || (message as any).hasSearch || (message as any).deepSearch),
      hasFathomCam: hasImagesInChat && !hasFilesAttached,
      hasFathomSpark: hasFilesAttached || /(?:zip|rar|tar|gz|كود|أكواد|مستند|فيديو|صوت|spark|ملفات|ملف)/i.test(previousUserPrompt),
      hasNonImageMedia: hasFilesAttached,
      hasZip: Boolean(message.content?.includes('.zip') || previousUserPrompt?.includes('.zip') || message.reasoning?.includes('.zip')),
      hasSpark: hasFilesAttached,
      hasImagesInHistory: hasImagesInChat,
      hasImages: Boolean(message.image || (message as any).imagePreview),
    }
  );
  const hasMemoryDetect = activeFeatures.some(f => f.id === 'memory_detect');

  // Intent classification on user request matching active features 100%
  const promptLower = previousUserPrompt.toLowerCase();
  const isMetadataIntent = activeFeatures.some(f => f.id === 'metadata_detect');
  const isAiDetectIntent = activeFeatures.some(f => f.id === 'ai_detect');
  const isTimeIntent = activeFeatures.some(f => f.id === 'time_detect');
  const hasDownloadDetect = activeFeatures.some(f => f.id === 'download_detect');

  const isSvgStudioActive = useMemo(() => {
    if (activeFeatures.some(f => f.id === 'svg_studio')) return true;
    const pLower = (previousUserPrompt || '').toLowerCase();
    if (/(?:svg|فيكتور|متجهات|vector)/i.test(pLower)) return true;
    if (/(?:تصميم|صمم|ارسم|رسم|اعمل|سوي|ولد|توليد|انشئ|أنشئ|ابني|صنع|draw|design|create|generate)\s+(?:لي\s+)?(?:صورة\s+)?(?:لوجو|شعار|ايقونة|أيقونة|أيقونات|شارة|رمز\s*بصري|إنفوجرافيك|انفوجرافيك|طابع|ختم|logo|icon|icons|emblem|badge|symbol|banner)/i.test(pLower)) return true;
    if (/(?:لوجو|شعار|ايقونة|أيقونة)\s+(?:احترافي|حديث|فكتور|بصري|مبتكر|لـ|للـ|عن|بسيط|متقن)/i.test(pLower)) return true;
    if (message.content && (message.content.includes('<svg') || message.content.includes('```svg'))) return true;
    if (message.reasoning && (message.reasoning.includes('<svg') || message.reasoning.includes('```svg'))) return true;
    return false;
  }, [activeFeatures, previousUserPrompt, message.content, message.reasoning]);

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
        className="flex justify-start my-2 group w-full gpu-layer"
      >
        <div className="w-full max-w-[94%] sm:max-w-[82%] rounded-2xl rounded-tr-sm bg-white/[0.05] border border-white/[0.09] p-4 sm:p-5 text-right text-white/95 backdrop-blur-md shadow-sm overflow-hidden break-words transition-all duration-200 hover:border-white/[0.15]">
          
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
  const isCyber = Boolean(
    message.model === 'deepseek-v4-flash-cyber' ||
    message.model === 'deepseek-v4-pro-cyber-2.6' ||
    message.model === 'deepseek-v4-flash-cyber-2.6' ||
    message.model === 'deepseek-v4-pro-cyber-2.1' ||
    message.model === 'deepseek-v4-flash-cyber-2.1' ||
    message.model?.includes('cyber') ||
    message.model?.includes('cyper')
  );
  const isMedia = message.model === 'meta/muse-spark-1.2-contributor';
  const isVision = message.model === 'deepseek-v4-flash-vision-exp' || Boolean(message.image);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-start my-2 group w-full gpu-layer"
    >
      <div className="flex items-center justify-between w-full mb-1.5 px-1 text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-1.5 font-sans font-medium flex-wrap">
          {message.isX1 && (
            <span className="text-[10px] font-mono font-bold text-rose-400/90 tracking-wide px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              X1 MAX
            </span>
          )}
          {message.model === 'deepseek-v4-flash-cyber-2.6' && (
            <span className="text-[10px] font-mono font-bold text-amber-300/90 tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Fathom Cyber Flash 2.6
            </span>
          )}
          {(message.model === 'deepseek-v4-pro-cyber-2.6' || message.model === 'deepseek-v4-pro-cyber-2.1') && (
            <span className="text-[10px] font-mono font-bold text-indigo-300/90 tracking-wide px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              Fathom Cyber Ultra 2.6
            </span>
          )}

          {message.model === 'deepseek-v4-flash' && (
            <span className="text-[10px] font-mono font-bold text-zinc-300/90 tracking-wide px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
              Fathom 1.1
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 font-medium tracking-wide shrink-0" dir="ltr">{normalizeDisplayTimestamp(message.timestamp)}</span>
      </div>

      <div className="w-full rounded-2xl p-3.5 sm:p-6 text-right transition-all duration-300 bg-[#0a0b0e]/70 backdrop-blur-md border border-white/[0.07] hover:border-white/[0.12] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-zinc-200 overflow-hidden break-words">
        {isSvgStudioActive ? (
          // SVG Studio Mode: Clean single-line indicator during creation, completely remove thinking button during and after
          (isThinking || isStreaming) && !displayContent.includes('</svg>') ? (
            <div className="flex items-center gap-2.5 py-2 px-3.5 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-200 select-none w-fit" dir="rtl">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-sans font-medium text-zinc-200">
                جاري انشاء صورة ذو رسومات شعاعية ......
              </span>
            </div>
          ) : null
        ) : (
          (hasReasoning || isThinking) && (
            <ChatReasoning
              reasoningText={effectiveReasoning}
              isThinking={isThinking}
              isStreaming={isStreaming}
              isX1={message.isX1}
              isTimeIntent={isTimeIntent}
              activeFeatures={activeFeatures}
            />
          )
        )}

        {isStreaming && !message.content && !hasReasoning && !isThinking ? (
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
                ) : isSvgStudioActive ? (
                  "جاري انشاء صورة ذو رسومات شعاعية ......"
                ) : (
                  "جاري توليد الاستجابة اللغوية الفصحى..."
                )}
              </span>
            </div>
          </div>
        ) : !displayContent.trim() && (isThinking || isStreaming) ? (
          null
        ) : !displayContent.trim() && message.isStopped ? (
          <div className="py-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-sans select-none animate-in fade-in duration-200">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span>تم إيقاف النموذج بواسطتك</span>
          </div>
        ) : !displayContent.trim() && hasReasoning && !isStreaming ? (
          <div className="py-2.5 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-sans select-none">
            <span>تم استكمال مرحلة التفكير أعلاه، ولكن لم يصدر نص إجابة نهائي من النموذج. يرجى إعادة المحاولة.</span>
          </div>
        ) : !displayContent.trim() && !hasReasoning && !isStreaming ? (
          <div className="py-2.5 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-sans select-none">
            <span>لم يتم استلام محتوى من النموذج. يرجى المحاولة مرة أخرى أو اختيار نموذج آخر.</span>
          </div>
        ) : (
          <>
            {hasDownloadDetect && detectedMediaUrl && !message.content?.includes('[DOWNLOAD-DETECT-CARD:') && !message.content?.includes('[DOWNLOAD-BUTTON:') && (
              <div className="mb-3">
                <DownloadDetectCard url={detectedMediaUrl} />
              </div>
            )}
            <div className="prose prose-invert max-w-none text-[#E2E8F0] text-sm sm:text-base leading-relaxed break-words font-sans">
              <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
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
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl, { setConfirmUrl, setConfirmPhone, setConfirmEmail });
                  if (customBadge) {
                    return customBadge;
                  }

                  // Suppress empty paragraphs that were generated by stripped badges
                  if (!fullText.trim()) return null;
                  return (
                    <p className="mb-3 last:mb-0 leading-relaxed text-[#E2E8F0]">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </p>
                  );
                },
                h1: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl, { setConfirmUrl, setConfirmPhone, setConfirmEmail });
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h1 className="text-lg sm:text-2xl font-bold text-white my-3 sm:my-4 border-b border-white/[0.08] pb-2 tracking-tight">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h1>
                  );
                },
                h2: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl, { setConfirmUrl, setConfirmPhone, setConfirmEmail });
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h2 className="text-base sm:text-xl font-semibold text-white my-2.5 sm:my-3 tracking-tight">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h2>
                  );
                },
                h3: ({ children }) => {
                  const fullText = getChildText(children);
                  const customBadge = parseCustomBadges(fullText, detectedMediaUrl, { setConfirmUrl, setConfirmPhone, setConfirmEmail });
                  if (customBadge) {
                    return customBadge;
                  }
                  return (
                    <h3 className="text-sm sm:text-lg font-semibold text-white my-2 sm:my-2.5">
                      {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                    </h3>
                  );
                },
                li: ({ children }) => (
                  <li className="my-1 leading-relaxed text-[#E2E8F0]">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                  </li>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-2.5 text-zinc-300 pr-1 sm:pr-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 my-2.5 text-zinc-300 pr-1 sm:pr-2">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-r-2 border-white/20 bg-white/[0.02] pr-3 py-2 my-2.5 text-sm text-zinc-300 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-5 overflow-x-auto rounded-xl border border-white/[0.1] bg-[#07080b] shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                    <table className="w-full min-w-[620px] text-xs sm:text-sm text-right border-collapse select-text" dir="rtl">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#0e1117] border-b border-white/[0.12] select-none">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-white/[0.05]">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="transition-colors duration-150 hover:bg-white/[0.025] odd:bg-transparent even:bg-white/[0.01]">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3.5 text-zinc-100 font-bold text-xs sm:text-sm tracking-tight border-l border-white/[0.07] last:border-l-0 text-right">
                    <span className="font-sans inline-block">
                      {children}
                    </span>
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3.5 text-zinc-300 font-normal text-xs sm:text-sm leading-relaxed border-l border-white/[0.05] last:border-l-0 align-top break-words">
                    {React.Children.map(children, (child) => typeof child === 'string' ? renderSmartContentWithLinksAndPhones(child, setConfirmUrl, setConfirmPhone, setConfirmEmail) : child)}
                  </td>
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1].toLowerCase() : '';
                  const isInline = inline !== undefined ? inline : (!match && !String(children).includes('\n'));

                  const isPromptLang = ['prompt', 'prompts', 'ai-prompt', 'prompt-ai'].includes(lang);
                  const isAdLang = ['ad', 'ads', 'advertisement', 'copy', 'marketing'].includes(lang);
                  const isCoderLang = ['coder', 'ai-coder', 'system', 'system-prompt', 'instructions'].includes(lang);
                  const isScriptLang = ['script', 'scenario', 'hook'].includes(lang);
                  const isThoughtLang = ['thought', 'think', 'thinking', 'reasoning'].includes(lang);

                  if (!isInline && isThoughtLang) {
                    return null;
                  }

                  if (!isInline && (isPromptLang || isAdLang || isCoderLang || isScriptLang)) {
                    const type = isAdLang ? 'ad' : isCoderLang ? 'coder' : isScriptLang ? 'script' : 'prompt';
                    return <PromptCard text={String(children).replace(/\n$/, '')} type={type} />;
                  }

                  const rawCodeString = String(children).replace(/\n$/, '');
                  const isSvgBlock = !isInline && (
                    lang === 'svg' ||
                    ((lang === 'xml' || lang === 'html' || lang === 'markup' || !lang || lang === 'code') &&
                      rawCodeString.includes('<svg') && (rawCodeString.includes('</svg>') || isStreaming))
                  );

                  if (isSvgBlock) {
                    return (
                      <SvgStudioCard
                        svgCode={rawCodeString}
                        isStreaming={isStreaming}
                      />
                    );
                  }

                  return !isInline ? (
                    <CodeBlock className={className} language={match ? match[1] : 'code'}>
                      {children}
                    </CodeBlock>
                  ) : (
                    <code dir="ltr" className="inline text-zinc-200 font-mono text-[11.5px] px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] select-text" {...props}>{children}</code>
                  );
                }
              }}
            >
              {sanitizeMarkdownDisplay((displayContent || '')
                .replace(/\[\s*(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?BADGE:[^\]]*\]/gi, '')
                .replace(/(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?BADGE:[^\n]*/gi, '')
                .trim())}
            </ReactMarkdown>

            {isStreaming && !isThinking && Boolean(displayContent && displayContent.trim().length > 0) && (
              <span className="inline-block w-1.5 h-4 bg-zinc-300 animate-pulse mr-1 align-middle rounded-full" />
            )}

            {message.isStopped && displayContent.trim() && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-sans select-none animate-in fade-in duration-200">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span>تم إيقاف التوليد بواسطتك</span>
              </div>
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

const areMessagePropsEqual = (prev: ChatMessageProps, next: ChatMessageProps) => {
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.message !== next.message) {
    if (prev.message.id !== next.message.id) return false;
    if (prev.message.content !== next.message.content) return false;
    if (prev.message.reasoning !== next.message.reasoning) return false;
    if (prev.message.isThinking !== next.message.isThinking) return false;
    if (prev.message.isStopped !== next.message.isStopped) return false;
    if (prev.message.timestamp !== next.message.timestamp) return false;
    if (prev.message.model !== next.message.model) return false;
  }
  if (prev.previousUserPrompt !== next.previousUserPrompt) return false;
  if (prev.globalUrlIndexMap !== next.globalUrlIndexMap) return false;
  if (prev.globalImageIndexMap !== next.globalImageIndexMap) return false;
  return true;
};

export const ChatMessage = React.memo(ChatMessageComponent, areMessagePropsEqual);
export default ChatMessage;
