import { supabase, getOrCreateDeviceId } from './supabase';
import { ModelType } from '../types';

export interface UsageLedger {
  totalTokens: number;
  fathom1Tokens: number;
  fathomCamTokens: number;
  fathomCyberTokens: number;
  visionFilesCount: number;
  cyberScansCount: number;
  fathom1TrialsCount: number;
  fathomCamTrialsCount: number;
  lastUpdated: string;
}

const STORAGE_KEY_USAGE = 'x1_real_usage_ledger';

const DEFAULT_USAGE: UsageLedger = {
  totalTokens: 0,
  fathom1Tokens: 0,
  fathomCamTokens: 0,
  fathomCyberTokens: 0,
  visionFilesCount: 0,
  cyberScansCount: 0,
  fathom1TrialsCount: 0,
  fathomCamTrialsCount: 0,
  lastUpdated: new Date().toISOString(),
};

// Load usage from localStorage or initialize
export function getLocalUsage(): UsageLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    if (raw) {
      return { ...DEFAULT_USAGE, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_USAGE };
}

// Save usage locally
export function saveLocalUsage(usage: UsageLedger): void {
  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(usage));
  } catch {
    // ignore
  }
}

// Estimate tokens from text (roughly 1 token per 3.5 Arabic/English chars + thinking overhead)
export function estimateTokens(prompt: string, response: string, reasoning?: string): number {
  const promptTokens = Math.max(1, Math.ceil(prompt.length / 3.5));
  const responseTokens = Math.max(1, Math.ceil(response.length / 3.5));
  const reasoningTokens = reasoning ? Math.ceil(reasoning.length / 3.5) : 0;
  return promptTokens + responseTokens + reasoningTokens;
}

// Track new interaction
export async function recordRealUsage(params: {
  model: ModelType;
  promptText: string;
  responseText: string;
  reasoningText?: string;
  hasImages: boolean;
  imagesCount?: number;
  isCyberScan?: boolean;
  userId: string | null;
  currentPlanId: string;
}): Promise<UsageLedger> {
  const current = getLocalUsage();
  const addedTokens = estimateTokens(params.promptText, params.responseText, params.reasoningText);
  const imagesNum = params.imagesCount || (params.hasImages ? 1 : 0);

  const updated: UsageLedger = {
    totalTokens: current.totalTokens + addedTokens,
    fathom1Tokens: current.fathom1Tokens + (params.model === 'deepseek-v4-flash' || params.model === 'meta/muse-spark-1.2-contributor' ? addedTokens : 0),
    fathomCamTokens: current.fathomCamTokens + (params.model === 'deepseek-v4-flash-vision-exp' || params.hasImages ? addedTokens : 0),
    fathomCyberTokens: current.fathomCyberTokens + (params.model === 'deepseek-v4-flash-cyber' || params.isCyberScan ? addedTokens : 0),
    visionFilesCount: current.visionFilesCount + imagesNum,
    cyberScansCount: current.cyberScansCount + (params.isCyberScan ? 1 : 0),
    fathom1TrialsCount: current.fathom1TrialsCount + (params.currentPlanId === 'free-0' && !params.hasImages ? 1 : 0),
    fathomCamTrialsCount: current.fathomCamTrialsCount + (params.currentPlanId === 'free-0' && params.hasImages ? 1 : 0),
    lastUpdated: new Date().toISOString(),
  };

  saveLocalUsage(updated);

  // Sync to Supabase in background
  syncUsageToSupabase(updated, params.userId).catch(() => {});

  return updated;
}

// Check if user is allowed to send message based on plan limits
export function checkPlanLimit(
  planId: string,
  options: { isVision?: boolean; isCyber?: boolean }
): { allowed: boolean; reason?: 'free_fathom1_limit' | 'free_vision_limit' | 'free_cyber_disabled' | 'quota_exceeded' } {
  const usage = getLocalUsage();

  if (planId === 'free-0') {
    if (options.isCyber) {
      return { allowed: false, reason: 'free_cyber_disabled' };
    }
    if (options.isVision && usage.fathomCamTrialsCount >= 2) {
      return { allowed: false, reason: 'free_vision_limit' };
    }
    if (!options.isVision && usage.fathom1TrialsCount >= 2) {
      return { allowed: false, reason: 'free_fathom1_limit' };
    }
    return { allowed: true };
  }

  if (planId === 'pro-29') {
    if (usage.totalTokens >= 100_000_000) {
      return { allowed: false, reason: 'quota_exceeded' };
    }
    if (options.isCyber && usage.cyberScansCount >= 500) {
      return { allowed: false, reason: 'quota_exceeded' };
    }
    if (options.isVision && usage.visionFilesCount >= 1_000) {
      return { allowed: false, reason: 'quota_exceeded' };
    }
    return { allowed: true };
  }

  // Elite Plan ($99) is uncapped
  return { allowed: true };
}

// Sync usage to Supabase
export async function syncUsageToSupabase(usage: UsageLedger, userId: string | null): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  try {
    const payload = {
      device_id: deviceId,
      user_id: userId || null,
      total_tokens: usage.totalTokens,
      fathom1_tokens: usage.fathom1Tokens,
      fathom_cam_tokens: usage.fathomCamTokens,
      fathom_cyber_tokens: usage.fathomCyberTokens,
      vision_files_count: usage.visionFilesCount,
      cyber_scans_count: usage.cyberScansCount,
      fathom1_trials_count: usage.fathom1TrialsCount,
      fathom_cam_trials_count: usage.fathomCamTrialsCount,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('x1_usage')
      .upsert(payload, { onConflict: 'device_id' });
  } catch (err) {
    console.warn('[Supabase Usage Sync Warn]:', err);
  }
}

// Fetch usage from Supabase
export async function fetchRemoteUsage(userId: string | null): Promise<UsageLedger | null> {
  const deviceId = getOrCreateDeviceId();
  try {
    let query = supabase.from('x1_usage').select('*');
    if (userId) {
      query = query.or(`user_id.eq.${userId},device_id.eq.${deviceId}`);
    } else {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      const remoteUsage: UsageLedger = {
        totalTokens: data.total_tokens || 0,
        fathom1Tokens: data.fathom1_tokens || 0,
        fathomCamTokens: data.fathom_cam_tokens || 0,
        fathomCyberTokens: data.fathom_cyber_tokens || 0,
        visionFilesCount: data.vision_files_count || 0,
        cyberScansCount: data.cyber_scans_count || 0,
        fathom1TrialsCount: data.fathom1_trials_count || 0,
        fathomCamTrialsCount: data.fathom_cam_trials_count || 0,
        lastUpdated: data.updated_at || new Date().toISOString(),
      };
      saveLocalUsage(remoteUsage);
      return remoteUsage;
    }
  } catch {
    // fallback
  }
  return null;
}
