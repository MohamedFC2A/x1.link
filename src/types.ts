export type ModelType = 'deepseek-v4-flash' | 'deepseek-v4-flash-vision-exp';

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
  timestamp: string;
  isX1?: boolean;
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
