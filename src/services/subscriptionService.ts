import { supabase, getOrCreateDeviceId } from './supabase';

const ACTIVATION_SECRET_CODE = '012727';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout on brute-force

export interface SubscriptionState {
  planId: 'free-0' | 'pro-29' | 'elite-99';
  planName: string;
  status: 'active' | 'trial' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
  isPaid: boolean;
}

export interface RateLimitStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutRemainingMs: number;
}

const STORAGE_KEY_PLAN = 'x1_active_plan';
const STORAGE_KEY_RATE_LIMIT = 'x1_sub_rate_limit';

// Get current rate limit status
export function getRateLimitStatus(): RateLimitStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATE_LIMIT);
    if (!raw) return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockoutRemainingMs: 0 };
    
    const data = JSON.parse(raw);
    const now = Date.now();
    
    if (data.lockedUntil && now < data.lockedUntil) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutRemainingMs: data.lockedUntil - now,
      };
    }
    
    // Reset if lockout expired
    if (data.lockedUntil && now >= data.lockedUntil) {
      localStorage.removeItem(STORAGE_KEY_RATE_LIMIT);
      return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockoutRemainingMs: 0 };
    }
    
    return {
      isLocked: false,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - (data.failedAttempts || 0)),
      lockoutRemainingMs: 0,
    };
  } catch {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockoutRemainingMs: 0 };
  }
}

// Record a failed attempt
function recordFailedAttempt(): RateLimitStatus {
  const now = Date.now();
  const current = getRateLimitStatus();
  const failedAttempts = (MAX_ATTEMPTS - current.remainingAttempts) + 1;
  
  if (failedAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    localStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify({
      failedAttempts,
      lockedUntil,
    }));
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutRemainingMs: LOCKOUT_MS,
    };
  }
  
  localStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify({
    failedAttempts,
    lockedUntil: null,
  }));
  
  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - failedAttempts,
    lockoutRemainingMs: 0,
  };
}

// Reset rate limits upon successful code
function resetRateLimit(): void {
  localStorage.removeItem(STORAGE_KEY_RATE_LIMIT);
}

// Verify activation code & update Supabase
export async function verifyAndActivateSubscription(
  code: string,
  targetPlanId: 'pro-29' | 'elite-99',
  userId: string | null
): Promise<{ success: boolean; error?: string; rateLimit: RateLimitStatus }> {
  const rateLimit = getRateLimitStatus();
  
  if (rateLimit.isLocked) {
    const minutes = Math.ceil(rateLimit.lockoutRemainingMs / 60000);
    return {
      success: false,
      error: `تم قفل محاولات التفعيل مؤقتاً لحماية النظام (${minutes} دقيقة متبقية).`,
      rateLimit,
    };
  }

  const cleanCode = code.trim();

  // Try verifying via Server API if available, fallback to direct validation with Supabase sync
  try {
    const res = await fetch('/api/verify-subscription-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        planId: targetPlanId,
        deviceId: getOrCreateDeviceId(),
        userId: userId || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        resetRateLimit();
        localStorage.setItem(STORAGE_KEY_PLAN, targetPlanId);
        await syncSubscriptionToSupabase(targetPlanId, userId);
        return { success: true, rateLimit: getRateLimitStatus() };
      } else {
        const newLimit = recordFailedAttempt();
        return { success: false, error: data.error || 'كود التفعيل غير صحيح.', rateLimit: newLimit };
      }
    }
  } catch {
    // Client-side fallback if server API is running statically or locally
  }

  // Client-side secure validation
  if (cleanCode === ACTIVATION_SECRET_CODE) {
    resetRateLimit();
    localStorage.setItem(STORAGE_KEY_PLAN, targetPlanId);
    await syncSubscriptionToSupabase(targetPlanId, userId);
    return {
      success: true,
      rateLimit: getRateLimitStatus(),
    };
  } else {
    const newLimit = recordFailedAttempt();
    return {
      success: false,
      error: `كود التفعيل غير صحيح. محاولات متبقية: ${newLimit.remainingAttempts}`,
      rateLimit: newLimit,
    };
  }
}

// Sync subscription record to Supabase
export async function syncSubscriptionToSupabase(
  planId: 'free-0' | 'pro-29' | 'elite-99',
  userId: string | null
): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  try {
    const payload = {
      device_id: deviceId,
      user_id: userId || null,
      plan_id: planId,
      status: planId === 'free-0' ? 'trial' : 'active',
      tokens_limit: planId === 'elite-99' ? 500_000_000 : planId === 'pro-29' ? 100_000_000 : 20_000,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('x1_subscriptions')
      .upsert(payload, { onConflict: 'device_id' });
  } catch (err) {
    console.warn('[Supabase Subscription Sync Warn]:', err);
  }
}

// Fetch active subscription from Supabase
export async function fetchUserSubscription(
  userId: string | null
): Promise<'free-0' | 'pro-29' | 'elite-99'> {
  const deviceId = getOrCreateDeviceId();
  try {
    let query = supabase.from('x1_subscriptions').select('plan_id, status');
    if (userId) {
      query = query.or(`user_id.eq.${userId},device_id.eq.${deviceId}`);
    } else {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data?.plan_id) {
      localStorage.setItem(STORAGE_KEY_PLAN, data.plan_id);
      return data.plan_id as 'free-0' | 'pro-29' | 'elite-99';
    }
  } catch {
    // fallback
  }

  const local = localStorage.getItem(STORAGE_KEY_PLAN);
  return (local as 'free-0' | 'pro-29' | 'elite-99') || 'free-0';
}
