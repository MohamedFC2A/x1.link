export type ModelType = 
  | 'deepseek-v4-flash' 
  | 'deepseek-v4-flash-vision-exp' 
  | 'deepseek-v4-flash-cyber' 
  | 'deepseek-v4-pro-cyber-2.6'
  | 'deepseek-v4-flash-cyber-2.6'
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
  isStopped?: boolean;
  stoppedReason?: string;
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
  mediaType?: 'video' | 'post' | 'image' | 'article' | 'website';
  isVideo?: boolean;
  postType?: 'video' | 'post' | 'photo' | 'article' | 'discussion';
  platformLabel?: string;
  videoMetadata?: {
    videoId?: string;
    authorName?: string;
    thumbnailUrl?: string;
    duration?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  };
  rawAnalysisSummaryAr?: string;
  structuredContextBlock?: string;
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

export type SemanticMemoryScope = 
  | 'general_chat' 
  | 'code_snippets' 
  | 'decisions' 
  | 'cyber_findings' 
  | 'user_facts' 
  | 'target_recon' 
  | 'all';

export type TimeFilterRange = 'last_day' | 'last_week' | 'last_month' | 'all_time';

export type ChatRelationshipType = 
  | 'SUPERSEDES' 
  | 'EXTENDS' 
  | 'DEPENDS_ON' 
  | 'SAME_PROJECT' 
  | 'RELATES_TO' 
  | 'CONTRADICTS';

export interface SemanticMemoryRecord {
  id: string;
  chat_id: string;
  message_id?: string | null;
  message_role: 'user' | 'assistant' | 'system' | 'distilled_summary' | 'insight';
  scope: SemanticMemoryScope;
  content: string;
  summary?: string | null;
  entities: string[];
  keywords: string[];
  token_count: number;
  created_at: string;
  vector_similarity?: number;
  text_similarity?: number;
  rrf_score?: number;
}

export interface ChatGraphEdge {
  link_id: string;
  source_chat_id: string;
  target_chat_id: string;
  source_title: string;
  target_title: string;
  relationship_type: ChatRelationshipType;
  confidence: number;
  metadata: Record<string, any>;
  created_at: string;
}
