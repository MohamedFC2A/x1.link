export type ModelType = 
  | 'deepseek-v4-flash' 
  | 'deepseek-v4-flash-vision-exp' 
  | 'deepseek-v4-flash-cyber' 
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
  mediaAttachments?: MediaAttachmentItem[];
  timestamp: string;
  isX1?: boolean;
  model?: ModelType;
  tokensCount?: number;
  isMemoryDetectTriggered?: boolean;
  memoryDetectSummary?: string;
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

