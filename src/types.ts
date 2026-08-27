export type ModelType = 
  | 'deepseek-v4-flash' 
  | 'deepseek-v4-flash-vision-exp' 
  | 'deepseek-v4-flash-cyber' 
  | 'deepseek-v4-pro-cyber-2.1'
  | 'deepseek-v4-flash-cyber-2.1'
  | 'meta/muse-spark-1.2-contributor';

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaAttachmentItem {
  id: string;
  name: string;
  type: MediaType;
  mimeType: string;
  dataUrl?: string; // base64 or blob URL
  size: number;
  duration?: number; // for video/audio in seconds
  width?: number;
  height?: number;
}

export interface ImageAttachment {
  name: string;
  dataUrl: string; // base64
  size: number;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isThinking?: boolean;
  image?: string;
  images?: string[];
  videoKeyframes?: string[];
  mediaAttachments?: MediaAttachmentItem[];
  timestamp: string;
  isX1?: boolean;
  model?: ModelType;
  tokensCount?: number;
  isMemoryDetectTriggered?: boolean;
  memoryDetectSummary?: string;
  isDiscoveryAuraActive?: boolean;
  discoveryAxiomSummary?: string;
  discoveryStage?: 'anomaly' | 'hypothesis' | 'prover' | 'axiom_integrated';
}

export interface WebAuthnVerificationResult {
  success: boolean;
  type: 'biometric' | 'device_passkey' | 'cryptographic_fallback';
  verifiedAt: string;
  credentialId?: string;
  error?: string;
}

export interface SystemStatus {
  online: boolean;
  latencyMs: number;
  activeModel: ModelType;
  x1Unlocked: boolean;
  x1Active: boolean;
  verifiedAge18: boolean;
  verifiedAge21: boolean;
  totalTokensProcessed: number;
}

export interface ResolvedLinkInfo {
  inputUrl: string;
  originalUrl: string;
  canonicalUrl?: string | null;
  domain: string;
  title: string;
  description?: string;
  isShortened: boolean;
  brandAssets: {
    favicon: string | null;
    appleTouchIcon: string | null;
    ogImage: string | null;
    twitterImage: string | null;
    bestLogoUrl: string | null;
  };
  frameworks?: {
    coreFramework: string[];
    componentLibraries: string[];
    iconsAndAnimations: string[];
    stateAndDataFetching: string[];
    infrastructure: string[];
  };
  designProfile?: {
    primaryAesthetic: string;
    designStyles: string[];
    colorPalette?: {
      brandPrimary?: string;
      background?: string;
    };
    borderRadius?: {
      style: string;
      sampleValues: string[];
    };
    typography?: {
      fontFamilies: string[];
      hasMonospace: boolean;
    };
  };
  mediaType?: 'video' | 'website';
  videoMetadata?: {
    videoId?: string;
    authorName?: string;
    thumbnailUrl?: string;
    duration?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  };
  rawAnalysisSummaryAr?: string;
}

export interface MediaFormatOption {
  formatId: string;
  qualityLabel: string;
  extension: 'mp4' | 'mp3' | 'webm' | 'm4a' | 'jpg' | 'png' | 'webp';
  type: 'video' | 'audio' | 'image';
  fileSize?: number;
  fileSizeFormatted?: string;
  downloadUrl: string;
  directStreamUrl?: string;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
  hasVideo?: boolean;
  isBest?: boolean;
}

export interface MediaGalleryImage {
  index: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  extension: string;
  fileSizeFormatted?: string;
}

export interface DownloadDetectResult {
  success: boolean;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'reddit' | 'threads' | 'vimeo' | 'generic';
  platformLabel: string;
  originalUrl: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  author: {
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  thumbnailUrl: string;
  durationSeconds?: number;
  durationFormatted?: string;
  mediaType: 'video' | 'image_gallery' | 'audio' | 'mixed';
  formats: MediaFormatOption[];
  images: MediaGalleryImage[];
  defaultDownloadUrl?: string;
  defaultFormat?: MediaFormatOption;
  extractedAt: number;
}


