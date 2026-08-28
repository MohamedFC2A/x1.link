-- ============================================================================
-- MATANY.ONE / MATANY - SUPABASE PRODUCTION DATABASE SCHEMA
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

-- ============================================================================
-- 11. MEMORY DETECT 2.0: HYBRID VECTOR & GRAPH SCHEMA (pgvector + FTS + RRF)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Semantic Memories Table
CREATE TABLE IF NOT EXISTS public.x1_semantic_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    chat_id UUID REFERENCES public.x1_chats(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.x1_messages(id) ON DELETE CASCADE,
    message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system', 'distilled_summary', 'insight')),
    scope TEXT NOT NULL DEFAULT 'general_chat' CHECK (scope IN ('general_chat', 'code_snippets', 'decisions', 'cyber_findings', 'user_facts', 'target_recon', 'all')),
    content TEXT NOT NULL,
    summary TEXT,
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    keywords TEXT[] NOT NULL DEFAULT '{}'::text[],
    embedding vector(1536),
    token_count INTEGER NOT NULL DEFAULT 0,
    relevance_weight FLOAT NOT NULL DEFAULT 1.0,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    superseded_at TIMESTAMPTZ,
    revision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Cross-Session Knowledge Graph Edges Table
CREATE TABLE IF NOT EXISTS public.x1_chat_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    source_chat_id UUID NOT NULL REFERENCES public.x1_chats(id) ON DELETE CASCADE,
    target_chat_id UUID NOT NULL REFERENCES public.x1_chats(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('SUPERSEDES', 'EXTENDS', 'DEPENDS_ON', 'SAME_PROJECT', 'RELATES_TO', 'CONTRADICTS')),
    confidence FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_x1_chat_link UNIQUE (source_chat_id, target_chat_id, relationship_type)
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_embedding_hnsw 
ON public.x1_semantic_memories 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_content_fts 
ON public.x1_semantic_memories 
USING gin (to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_summary_fts 
ON public.x1_semantic_memories 
USING gin (to_tsvector('simple', COALESCE(summary, '')));

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_content_trgm 
ON public.x1_semantic_memories 
USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_entities 
ON public.x1_semantic_memories 
USING gin (entities);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_keywords 
ON public.x1_semantic_memories 
USING gin (keywords);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_user_device 
ON public.x1_semantic_memories(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_chat_id 
ON public.x1_semantic_memories(chat_id);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_scope 
ON public.x1_semantic_memories(scope);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_created_at 
ON public.x1_semantic_memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_x1_chat_links_user_device 
ON public.x1_chat_links(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_x1_chat_links_source_target 
ON public.x1_chat_links(source_chat_id, target_chat_id);

-- Enable RLS
ALTER TABLE public.x1_semantic_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_chat_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow select semantic memories" ON public.x1_semantic_memories;
CREATE POLICY "Allow select semantic memories" ON public.x1_semantic_memories FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert semantic memories" ON public.x1_semantic_memories;
CREATE POLICY "Allow upsert semantic memories" ON public.x1_semantic_memories FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow select chat links" ON public.x1_chat_links;
CREATE POLICY "Allow select chat links" ON public.x1_chat_links FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert chat links" ON public.x1_chat_links;
CREATE POLICY "Allow upsert chat links" ON public.x1_chat_links FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- Hybrid Search RPC Function (pgvector + FTS + RRF)
CREATE OR REPLACE FUNCTION public.match_chat_history(
    query_embedding vector(1536) DEFAULT NULL,
    query_text TEXT DEFAULT '',
    match_threshold FLOAT DEFAULT 0.20,
    match_count INT DEFAULT 8,
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL,
    p_scope TEXT DEFAULT 'all',
    p_time_filter TEXT DEFAULT 'all_time',
    rrf_k INT DEFAULT 60
)
RETURNS TABLE (
    id UUID,
    chat_id UUID,
    message_id UUID,
    message_role TEXT,
    scope TEXT,
    content TEXT,
    summary TEXT,
    entities JSONB,
    keywords TEXT[],
    token_count INT,
    created_at TIMESTAMPTZ,
    vector_similarity FLOAT,
    text_similarity FLOAT,
    rrf_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_time_cutoff TIMESTAMPTZ;
BEGIN
    IF p_time_filter = 'last_day' THEN
        v_time_cutoff := now() - INTERVAL '1 day';
    ELSIF p_time_filter = 'last_week' THEN
        v_time_cutoff := now() - INTERVAL '7 days';
    ELSIF p_time_filter = 'last_month' THEN
        v_time_cutoff := now() - INTERVAL '30 days';
    ELSE
        v_time_cutoff := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
    END IF;

    RETURN QUERY
    WITH base_candidates AS (
        SELECT 
            m.id,
            m.chat_id,
            m.message_id,
            m.message_role,
            m.scope,
            m.content,
            m.summary,
            m.entities,
            m.keywords,
            m.token_count,
            m.created_at,
            CASE 
                WHEN query_embedding IS NOT NULL AND m.embedding IS NOT NULL THEN
                    GREATEST(0.0, (1.0 - (m.embedding <=> query_embedding)))
                ELSE 0.0 
            END AS vector_sim,
            CASE 
                WHEN query_text IS NOT NULL AND trim(query_text) <> '' THEN
                    GREATEST(
                        ts_rank_cd(to_tsvector('simple', m.content), plainto_tsquery('simple', query_text)),
                        ts_rank_cd(to_tsvector('simple', COALESCE(m.summary, '')), plainto_tsquery('simple', query_text)),
                        similarity(m.content, query_text) * 0.85
                    )
                ELSE 0.0 
            END AS text_sim
        FROM public.x1_semantic_memories m
        WHERE 
            m.is_latest = true
            AND (
                (p_user_id IS NOT NULL AND m.user_id = p_user_id)
                OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND m.device_id = p_device_id)
            )
            AND (p_scope = 'all' OR m.scope = p_scope)
            AND (m.created_at >= v_time_cutoff)
    ),
    filtered_candidates AS (
        SELECT *
        FROM base_candidates
        WHERE 
            (query_embedding IS NOT NULL AND vector_sim >= match_threshold)
            OR (query_text IS NOT NULL AND text_sim >= 0.05)
            OR (query_embedding IS NULL AND query_text IS NULL)
    ),
    ranked_vector AS (
        SELECT 
            fc.id,
            ROW_NUMBER() OVER (ORDER BY fc.vector_sim DESC, fc.created_at DESC) AS v_rank
        FROM filtered_candidates fc
        WHERE fc.vector_sim > 0.0
    ),
    ranked_text AS (
        SELECT 
            fc.id,
            ROW_NUMBER() OVER (ORDER BY fc.text_sim DESC, fc.created_at DESC) AS t_rank
        FROM filtered_candidates fc
        WHERE fc.text_sim > 0.0
    )
    SELECT 
        fc.id,
        fc.chat_id,
        fc.message_id,
        fc.message_role,
        fc.scope,
        fc.content,
        fc.summary,
        fc.entities,
        fc.keywords,
        fc.token_count,
        fc.created_at,
        fc.vector_sim AS vector_similarity,
        fc.text_sim AS text_similarity,
        (
            COALESCE(1.0 / (rrf_k + rv.v_rank), 0.0) +
            COALESCE(1.0 / (rrf_k + rt.t_rank), 0.0) +
            (fc.vector_sim * 0.4) +
            (fc.text_sim * 0.3)
        )::FLOAT AS rrf_score
    FROM filtered_candidates fc
    LEFT JOIN ranked_vector rv ON fc.id = rv.id
    LEFT JOIN ranked_text rt ON fc.id = rt.id
    ORDER BY rrf_score DESC, fc.created_at DESC
    LIMIT match_count;
END;
$$;

-- Memory Mutation RPC
CREATE OR REPLACE FUNCTION public.update_memory_node_content(
    p_node_id UUID,
    p_new_content TEXT,
    p_new_summary TEXT DEFAULT NULL,
    p_new_entities JSONB DEFAULT '[]'::jsonb,
    p_new_keywords TEXT[] DEFAULT '{}'::text[],
    p_new_embedding vector(1536) DEFAULT NULL,
    p_reason TEXT DEFAULT 'Updated by AI Memory Controller',
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    UPDATE public.x1_semantic_memories
    SET 
        content = p_new_content,
        summary = COALESCE(p_new_summary, summary),
        entities = COALESCE(p_new_entities, entities),
        keywords = COALESCE(p_new_keywords, keywords),
        embedding = COALESCE(p_new_embedding, embedding),
        revision_reason = p_reason,
        updated_at = timezone('utc'::text, now())
    WHERE 
        id = p_node_id
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id)
            OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND device_id = p_device_id)
        )
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Memory node not found or unauthorized.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'updated_id', v_updated_id,
        'updated_at', now()
    );
END;
$$;

-- Graph Link RPC
CREATE OR REPLACE FUNCTION public.link_chat_sessions(
    p_source_chat_id UUID,
    p_target_chat_id UUID,
    p_relationship_type TEXT,
    p_confidence FLOAT DEFAULT 1.0,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_link_id UUID;
BEGIN
    IF p_source_chat_id = p_target_chat_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot link chat session to itself.');
    END IF;

    INSERT INTO public.x1_chat_links (
        user_id,
        device_id,
        source_chat_id,
        target_chat_id,
        relationship_type,
        confidence,
        metadata,
        created_at
    )
    VALUES (
        p_user_id,
        p_device_id,
        p_source_chat_id,
        p_target_chat_id,
        p_relationship_type,
        p_confidence,
        COALESCE(p_metadata, '{}'::jsonb),
        timezone('utc'::text, now())
    )
    ON CONFLICT (source_chat_id, target_chat_id, relationship_type) 
    DO UPDATE SET 
        confidence = EXCLUDED.confidence,
        metadata = EXCLUDED.metadata
    RETURNING id INTO v_link_id;

    RETURN jsonb_build_object(
        'success', true,
        'link_id', v_link_id,
        'source_chat_id', p_source_chat_id,
        'target_chat_id', p_target_chat_id,
        'relationship_type', p_relationship_type
    );
END;
$$;

-- Graph Topology Query RPC
CREATE OR REPLACE FUNCTION public.get_chat_graph_topology(
    p_chat_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL,
    p_max_depth INT DEFAULT 2
)
RETURNS TABLE (
    link_id UUID,
    source_chat_id UUID,
    target_chat_id UUID,
    source_title TEXT,
    target_title TEXT,
    relationship_type TEXT,
    confidence FLOAT,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id AS link_id,
        l.source_chat_id,
        l.target_chat_id,
        s.title AS source_title,
        t.title AS target_title,
        l.relationship_type,
        l.confidence,
        l.metadata,
        l.created_at
    FROM public.x1_chat_links l
    JOIN public.x1_chats s ON l.source_chat_id = s.id
    JOIN public.x1_chats t ON l.target_chat_id = t.id
    WHERE 
        (l.source_chat_id = p_chat_id OR l.target_chat_id = p_chat_id)
        AND (
            (p_user_id IS NOT NULL AND l.user_id = p_user_id)
            OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND l.device_id = p_device_id)
        )
    ORDER BY l.confidence DESC, l.created_at DESC
    LIMIT 25;
END;
$$;
