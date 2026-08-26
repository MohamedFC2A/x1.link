export type ModelType = 'deepseek-v4-flash' | 'deepseek-v4-flash-vision-exp' | 'deepseek-v4-flash-cyber';

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
  timestamp: string;
  isX1?: boolean;
  model?: ModelType;
  tokensCount?: number;
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
  rawAnalysisSummaryAr?: string;
}

