-- ============================================================================
-- MATANY.ONE / X1.LINK - SUPABASE PRODUCTION DATABASE SCHEMA
-- ============================================================================

-- 1. Create x1_chats table
CREATE TABLE IF NOT EXISTS public.x1_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    title TEXT NOT NULL DEFAULT 'محادثة جديدة',
    mode TEXT NOT NULL DEFAULT 'base',
    model TEXT NOT NULL DEFAULT 'Fathom 1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create x1_messages table
CREATE TABLE IF NOT EXISTS public.x1_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.x1_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_x1 BOOLEAN NOT NULL DEFAULT false,
    tokens_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create x1_subscriptions table
CREATE TABLE IF NOT EXISTS public.x1_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id TEXT NOT NULL DEFAULT 'free-0' CHECK (plan_id IN ('free-0', 'pro-29', 'elite-99')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired')),
    tokens_limit BIGINT NOT NULL DEFAULT 20000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create x1_usage telemetry table
CREATE TABLE IF NOT EXISTS public.x1_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    fathom1_tokens BIGINT NOT NULL DEFAULT 0,
    fathom_cam_tokens BIGINT NOT NULL DEFAULT 0,
    fathom_cyber_tokens BIGINT NOT NULL DEFAULT 0,
    vision_files_count INTEGER NOT NULL DEFAULT 0,
    cyber_scans_count INTEGER NOT NULL DEFAULT 0,
    fathom1_trials_count INTEGER NOT NULL DEFAULT 0,
    fathom_cam_trials_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create x1_activation_rate_limits table (Anti-Bruteforce Defense)
CREATE TABLE IF NOT EXISTS public.x1_activation_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_x1_chats_user_id ON public.x1_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_x1_chats_device_id ON public.x1_chats(device_id);
CREATE INDEX IF NOT EXISTS idx_x1_chats_updated_at ON public.x1_chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_x1_messages_chat_id ON public.x1_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_x1_messages_created_at ON public.x1_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_x1_subscriptions_device_id ON public.x1_subscriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_x1_usage_device_id ON public.x1_usage(device_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.x1_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_activation_rate_limits ENABLE ROW LEVEL SECURITY;

-- 8. Subscriptions RLS Policies
DROP POLICY IF EXISTS "Allow select subscriptions" ON public.x1_subscriptions;
CREATE POLICY "Allow select subscriptions" ON public.x1_subscriptions FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert subscriptions" ON public.x1_subscriptions;
CREATE POLICY "Allow upsert subscriptions" ON public.x1_subscriptions FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- 9. Usage RLS Policies
DROP POLICY IF EXISTS "Allow all usage telemetry" ON public.x1_usage;
CREATE POLICY "Allow all usage telemetry" ON public.x1_usage FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- 10. Activation Code Verification RPC Function in Supabase (Code: 012727)
CREATE OR REPLACE FUNCTION public.verify_subscription_code(
    p_code TEXT,
    p_plan_id TEXT,
    p_device_id TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_secret_code TEXT := '012727';
    v_failed_attempts INTEGER := 0;
    v_locked_until TIMESTAMPTZ;
    v_tokens_limit BIGINT;
BEGIN
    -- Check rate limit
    SELECT failed_attempts, locked_until INTO v_failed_attempts, v_locked_until
    FROM public.x1_activation_rate_limits
    WHERE device_id = p_device_id;

    IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'تم قفل المحاولات مؤقتاً بسبب تجاوز الحد الأقصى للمحاولات.',
            'locked', true
        );
    END IF;

    -- Validate secret code
    IF trim(p_code) = v_secret_code THEN
        -- Reset rate limit
        DELETE FROM public.x1_activation_rate_limits WHERE device_id = p_device_id;

        -- Determine limit
        IF p_plan_id = 'elite-99' THEN
            v_tokens_limit := 500000000;
        ELSE
            v_tokens_limit := 100000000;
        END IF;

        -- Upsert subscription
        INSERT INTO public.x1_subscriptions (device_id, user_id, plan_id, status, tokens_limit, updated_at)
        VALUES (p_device_id, p_user_id, p_plan_id, 'active', v_tokens_limit, now())
        ON CONFLICT (device_id) DO UPDATE
        SET plan_id = EXCLUDED.plan_id,
            status = 'active',
            tokens_limit = EXCLUDED.tokens_limit,
            updated_at = now();

        RETURN jsonb_build_object(
            'success', true,
            'plan_id', p_plan_id,
            'status', 'active'
        );
    ELSE
        -- Increment failed attempt
        v_failed_attempts := COALESCE(v_failed_attempts, 0) + 1;
        IF v_failed_attempts >= 5 THEN
            v_locked_until := now() + interval '15 minutes';
        END IF;

        INSERT INTO public.x1_activation_rate_limits (device_id, failed_attempts, locked_until, last_attempt)
        VALUES (p_device_id, v_failed_attempts, v_locked_until, now())
        ON CONFLICT (device_id) DO UPDATE
        SET failed_attempts = EXCLUDED.failed_attempts,
            locked_until = EXCLUDED.locked_until,
            last_attempt = now();

        RETURN jsonb_build_object(
            'success', false,
            'error', 'كود التفعيل غير صحيح.',
            'remaining_attempts', GREATEST(0, 5 - v_failed_attempts),
            'locked', (v_locked_until IS NOT NULL AND v_locked_until > now())
        );
    END IF;
END;
$$;
