-- ============================================================================
-- MATANY.ONE / MATANY - SUPABASE PRODUCTION DATABASE SCHEMA
-- ============================================================================

-- 1. Create matany_chats table
CREATE TABLE IF NOT EXISTS public.matany_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    title TEXT NOT NULL DEFAULT 'محادثة جديدة',
    mode TEXT NOT NULL DEFAULT 'base',
    model TEXT NOT NULL DEFAULT 'Fathom 1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create matany_messages table
CREATE TABLE IF NOT EXISTS public.matany_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.matany_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_matany BOOLEAN NOT NULL DEFAULT false,
    tokens_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create matany_subscriptions table
CREATE TABLE IF NOT EXISTS public.matany_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id TEXT NOT NULL DEFAULT 'free-0' CHECK (plan_id IN ('free-0', 'pro-29', 'elite-99')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired')),
    tokens_limit BIGINT NOT NULL DEFAULT 20000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create matany_usage telemetry table
CREATE TABLE IF NOT EXISTS public.matany_usage (
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

-- 5. Create matany_activation_rate_limits table (Anti-Bruteforce Defense)
CREATE TABLE IF NOT EXISTS public.matany_activation_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_matany_chats_user_id ON public.matany_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_matany_chats_device_id ON public.matany_chats(device_id);
CREATE INDEX IF NOT EXISTS idx_matany_chats_updated_at ON public.matany_chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_matany_messages_chat_id ON public.matany_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_matany_messages_created_at ON public.matany_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_matany_subscriptions_device_id ON public.matany_subscriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_matany_usage_device_id ON public.matany_usage(device_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.matany_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_activation_rate_limits ENABLE ROW LEVEL SECURITY;

-- 8. Subscriptions RLS Policies
DROP POLICY IF EXISTS "Allow select subscriptions" ON public.matany_subscriptions;
CREATE POLICY "Allow select subscriptions" ON public.matany_subscriptions FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert subscriptions" ON public.matany_subscriptions;
CREATE POLICY "Allow upsert subscriptions" ON public.matany_subscriptions FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- 9. Usage RLS Policies
DROP POLICY IF EXISTS "Allow all usage telemetry" ON public.matany_usage;
CREATE POLICY "Allow all usage telemetry" ON public.matany_usage FOR ALL
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
    FROM public.matany_activation_rate_limits
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
        DELETE FROM public.matany_activation_rate_limits WHERE device_id = p_device_id;

        -- Determine limit
        IF p_plan_id = 'elite-99' THEN
            v_tokens_limit := 500000000;
        ELSE
            v_tokens_limit := 100000000;
        END IF;

        -- Upsert subscription
        INSERT INTO public.matany_subscriptions (device_id, user_id, plan_id, status, tokens_limit, updated_at)
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

        INSERT INTO public.matany_activation_rate_limits (device_id, failed_attempts, locked_until, last_attempt)
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
CREATE TABLE IF NOT EXISTS public.matany_semantic_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    chat_id UUID REFERENCES public.matany_chats(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.matany_messages(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.matany_chat_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    source_chat_id UUID NOT NULL REFERENCES public.matany_chats(id) ON DELETE CASCADE,
    target_chat_id UUID NOT NULL REFERENCES public.matany_chats(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('SUPERSEDES', 'EXTENDS', 'DEPENDS_ON', 'SAME_PROJECT', 'RELATES_TO', 'CONTRADICTS')),
    confidence FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_matany_chat_link UNIQUE (source_chat_id, target_chat_id, relationship_type)
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_embedding_hnsw 
ON public.matany_semantic_memories 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_content_fts 
ON public.matany_semantic_memories 
USING gin (to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_summary_fts 
ON public.matany_semantic_memories 
USING gin (to_tsvector('simple', COALESCE(summary, '')));

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_content_trgm 
ON public.matany_semantic_memories 
USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_entities 
ON public.matany_semantic_memories 
USING gin (entities);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_keywords 
ON public.matany_semantic_memories 
USING gin (keywords);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_user_device 
ON public.matany_semantic_memories(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_chat_id 
ON public.matany_semantic_memories(chat_id);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_scope 
ON public.matany_semantic_memories(scope);

CREATE INDEX IF NOT EXISTS idx_matany_semantic_memories_created_at 
ON public.matany_semantic_memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matany_chat_links_user_device 
ON public.matany_chat_links(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_matany_chat_links_source_target 
ON public.matany_chat_links(source_chat_id, target_chat_id);

-- Enable RLS
ALTER TABLE public.matany_semantic_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_chat_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow select semantic memories" ON public.matany_semantic_memories;
CREATE POLICY "Allow select semantic memories" ON public.matany_semantic_memories FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert semantic memories" ON public.matany_semantic_memories;
CREATE POLICY "Allow upsert semantic memories" ON public.matany_semantic_memories FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow select chat links" ON public.matany_chat_links;
CREATE POLICY "Allow select chat links" ON public.matany_chat_links FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert chat links" ON public.matany_chat_links;
CREATE POLICY "Allow upsert chat links" ON public.matany_chat_links FOR ALL
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
        FROM public.matany_semantic_memories m
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
    UPDATE public.matany_semantic_memories
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

    INSERT INTO public.matany_chat_links (
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
    FROM public.matany_chat_links l
    JOIN public.matany_chats s ON l.source_chat_id = s.id
    JOIN public.matany_chats t ON l.target_chat_id = t.id
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

-- ============================================================================
-- 9. AUTONOMOUS DIAGNOSTIC INCIDENTS & GPAENG CONTINUOUS LEARNING ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matany_diagnostic_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'SYSTEM_ERROR',
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    incident_type TEXT NOT NULL DEFAULT 'HARD_ERROR',
    component TEXT NOT NULL DEFAULT 'CLIENT_UI',
    duration_ms INT DEFAULT NULL,
    client_metrics JSONB DEFAULT '{}'::jsonb,
    user_prompt TEXT,
    model_used TEXT,
    error_code TEXT,
    error_message TEXT,
    error_stack TEXT,
    endpoint TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matany_incidents_created_at ON public.matany_diagnostic_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matany_incidents_category ON public.matany_diagnostic_incidents(category);
CREATE INDEX IF NOT EXISTS idx_matany_incidents_severity ON public.matany_diagnostic_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_matany_incidents_comp_type ON public.matany_diagnostic_incidents(component, incident_type);
CREATE INDEX IF NOT EXISTS idx_matany_incidents_duration ON public.matany_diagnostic_incidents(duration_ms) WHERE duration_ms IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.matany_system_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_category TEXT NOT NULL,
    trigger_signature TEXT NOT NULL,
    distilled_rule TEXT NOT NULL,
    remediation_action TEXT NOT NULL DEFAULT 'PARAM_OVERRIDE',
    action_config JSONB DEFAULT '{}'::jsonb,
    times_triggered INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matany_lessons_category ON public.matany_system_lessons(incident_category);

CREATE TABLE IF NOT EXISTS public.matany_autonomous_remediations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_category TEXT NOT NULL,
    trigger_signature TEXT NOT NULL,
    remediation_action TEXT NOT NULL,
    action_details JSONB DEFAULT '{}'::jsonb,
    incidents_mitigated_count INT DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'APPLIED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_matany_remediations_cat ON public.matany_autonomous_remediations(incident_category);
CREATE INDEX IF NOT EXISTS idx_matany_remediations_created_at ON public.matany_autonomous_remediations(created_at DESC);

CREATE TABLE IF NOT EXISTS public.matany_gpaeng_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    svi_score NUMERIC(5,2) NOT NULL,
    health_status TEXT NOT NULL,
    total_incidents_window INT NOT NULL,
    open_incidents_count INT NOT NULL,
    subsystem_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    latency_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matany_snapshots_created_at ON public.matany_gpaeng_snapshots(created_at DESC);

ALTER TABLE public.matany_diagnostic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_system_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_autonomous_remediations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matany_gpaeng_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on matany_diagnostic_incidents" ON public.matany_diagnostic_incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on matany_diagnostic_incidents" ON public.matany_diagnostic_incidents FOR SELECT USING (true);
CREATE POLICY "Allow public update on matany_diagnostic_incidents" ON public.matany_diagnostic_incidents FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on matany_system_lessons" ON public.matany_system_lessons FOR SELECT USING (true);
CREATE POLICY "Allow public insert on matany_system_lessons" ON public.matany_system_lessons FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on matany_autonomous_remediations" ON public.matany_autonomous_remediations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on matany_autonomous_remediations" ON public.matany_autonomous_remediations FOR SELECT USING (true);
CREATE POLICY "Allow public update on matany_autonomous_remediations" ON public.matany_autonomous_remediations FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert on matany_gpaeng_snapshots" ON public.matany_gpaeng_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on matany_gpaeng_snapshots" ON public.matany_gpaeng_snapshots FOR SELECT USING (true);

-- Sovereign GPAENG Master Analytics Aggregation RPC 3.0
CREATE OR REPLACE FUNCTION public.get_gpaeng_master_analytics(p_hours INT DEFAULT 168)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMPTZ := NOW() - (p_hours || ' hours')::INTERVAL;
    v_total_count INT := 0;
    v_resolved_count INT := 0;
    v_critical_count INT := 0;
    v_high_count INT := 0;
    v_type_counts JSONB := '{}'::jsonb;
    v_comp_counts JSONB := '{}'::jsonb;
    v_cat_counts JSONB := '{}'::jsonb;
    v_sev_counts JSONB := '{}'::jsonb;
    v_model_counts JSONB := '{}'::jsonb;
    v_avg_duration NUMERIC := 0;
    v_p95_duration NUMERIC := 0;
    v_total_lessons INT := 0;
    v_total_remediations INT := 0;
    v_recent_incidents JSONB := '[]'::jsonb;
    v_lessons JSONB := '[]'::jsonb;
    v_remediations JSONB := '[]'::jsonb;
    v_svi_score NUMERIC := 100.0;
    v_health_status TEXT := 'OPTIMAL';
    v_subsystem_health JSONB := '{}'::jsonb;
    v_img_events INT := 0;
    v_img_defects INT := 0;
    v_svg_events INT := 0;
    v_svg_errors INT := 0;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE resolved = true),
        COUNT(*) FILTER (WHERE severity = 'CRITICAL'),
        COUNT(*) FILTER (WHERE severity = 'HIGH'),
        COALESCE(ROUND(AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL), 1), 0),
        COALESCE(ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL)::numeric, 1), 0)
    INTO 
        v_total_count, 
        v_resolved_count,
        v_critical_count,
        v_high_count,
        v_avg_duration,
        v_p95_duration
    FROM public.matany_diagnostic_incidents
    WHERE created_at >= v_start_time;

    SELECT 
        COUNT(*) FILTER (WHERE component = 'IMAGE_STUDIO'),
        COUNT(*) FILTER (WHERE component = 'IMAGE_STUDIO' AND incident_type IN ('HARD_ERROR', 'QUALITY_DEFECT')),
        COUNT(*) FILTER (WHERE component = 'SVG_STUDIO'),
        COUNT(*) FILTER (WHERE component = 'SVG_STUDIO' AND incident_type IN ('HARD_ERROR', 'QUALITY_DEFECT'))
    INTO
        v_img_events,
        v_img_defects,
        v_svg_events,
        v_svg_errors
    FROM public.matany_diagnostic_incidents
    WHERE created_at >= v_start_time;

    v_svi_score := GREATEST(0.0, 100.0 - ((v_critical_count * 10.0) + (v_high_count * 3.0) + (GREATEST(0, (v_total_count - v_resolved_count) * 1.0))));
    v_svi_score := ROUND(v_svi_score, 1);

    IF v_svi_score >= 90.0 THEN
        v_health_status := 'OPTIMAL';
    ELSIF v_svi_score >= 75.0 THEN
        v_health_status := 'NOMINAL';
    ELSIF v_svi_score >= 50.0 THEN
        v_health_status := 'DEGRADED';
    ELSE
        v_health_status := 'CRITICAL';
    END IF;

    SELECT COALESCE(jsonb_object_agg(COALESCE(incident_type, 'HARD_ERROR'), cnt), '{}'::jsonb)
    INTO v_type_counts
    FROM (
        SELECT COALESCE(incident_type, 'HARD_ERROR') as incident_type, COUNT(*) as cnt
        FROM public.matany_diagnostic_incidents
        WHERE created_at >= v_start_time
        GROUP BY incident_type
    ) t;

    SELECT COALESCE(jsonb_object_agg(COALESCE(component, 'CLIENT_UI'), cnt), '{}'::jsonb)
    INTO v_comp_counts
    FROM (
        SELECT COALESCE(component, 'CLIENT_UI') as component, COUNT(*) as cnt
        FROM public.matany_diagnostic_incidents
        WHERE created_at >= v_start_time
        GROUP BY component
    ) c;

    SELECT COALESCE(jsonb_object_agg(severity, cnt), '{}'::jsonb)
    INTO v_sev_counts
    FROM (
        SELECT severity, COUNT(*) as cnt
        FROM public.matany_diagnostic_incidents
        WHERE created_at >= v_start_time
        GROUP BY severity
    ) s;

    SELECT COALESCE(jsonb_object_agg(category, cnt), '{}'::jsonb)
    INTO v_cat_counts
    FROM (
        SELECT category, COUNT(*) as cnt
        FROM public.matany_diagnostic_incidents
        WHERE created_at >= v_start_time
        GROUP BY category
    ) cat;

    SELECT COALESCE(jsonb_object_agg(COALESCE(model_used, 'UNKNOWN'), cnt), '{}'::jsonb)
    INTO v_model_counts
    FROM (
        SELECT COALESCE(model_used, 'UNKNOWN') as model_used, COUNT(*) as cnt
        FROM public.matany_diagnostic_incidents
        WHERE created_at >= v_start_time
        GROUP BY model_used
    ) m;

    v_subsystem_health := jsonb_build_object(
        'IMAGE_STUDIO', jsonb_build_object('total', v_img_events, 'defects', v_img_defects, 'health_pct', CASE WHEN v_img_events > 0 THEN GREATEST(0, ROUND(100.0 - (v_img_defects::numeric / v_img_events::numeric * 100.0), 1)) ELSE 100.0 END),
        'SVG_STUDIO', jsonb_build_object('total', v_svg_events, 'defects', v_svg_errors, 'health_pct', CASE WHEN v_svg_events > 0 THEN GREATEST(0, ROUND(100.0 - (v_svg_errors::numeric / v_svg_events::numeric * 100.0), 1)) ELSE 100.0 END),
        'CORE_STREAM', jsonb_build_object('p95_ms', v_p95_duration, 'avg_ms', v_avg_duration)
    );

    SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb)
    INTO v_recent_incidents
    FROM (
        SELECT 
            id, category, severity, COALESCE(incident_type, 'HARD_ERROR') as incident_type,
            COALESCE(component, 'CLIENT_UI') as component, user_prompt, model_used,
            error_code, error_message, error_stack, endpoint, device_info, metadata,
            resolved, resolution_notes, duration_ms, created_at
        FROM public.matany_diagnostic_incidents
        ORDER BY created_at DESC
        LIMIT 30
    ) i;

    SELECT COUNT(*), COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
    INTO v_total_lessons, v_lessons
    FROM (
        SELECT id, incident_category, trigger_signature, distilled_rule, remediation_action, times_triggered, created_at
        FROM public.matany_system_lessons
        ORDER BY times_triggered DESC
        LIMIT 15
    ) l;

    SELECT COUNT(*), COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
    INTO v_total_remediations, v_remediations
    FROM (
        SELECT id, incident_category, trigger_signature, remediation_action, action_details, incidents_mitigated_count, status, created_at
        FROM public.matany_autonomous_remediations
        ORDER BY created_at DESC
        LIMIT 10
    ) r;

    RETURN jsonb_build_object(
        'period_hours', p_hours,
        'svi_score', v_svi_score,
        'health_status', v_health_status,
        'total_incidents', v_total_count,
        'resolved_incidents', v_resolved_count,
        'open_incidents', GREATEST(0, v_total_count - v_resolved_count),
        'resolution_rate_percent', CASE WHEN v_total_count > 0 THEN ROUND((v_resolved_count::numeric / v_total_count::numeric) * 100, 1) ELSE 100 END,
        'average_duration_ms', v_avg_duration,
        'p95_duration_ms', v_p95_duration,
        'by_type', v_type_counts,
        'by_component', v_comp_counts,
        'by_severity', v_sev_counts,
        'by_category', v_cat_counts,
        'by_model', v_model_counts,
        'subsystem_health', v_subsystem_health,
        'total_lessons', v_total_lessons,
        'total_remediations', v_total_remediations,
        'recent_incidents', v_recent_incidents,
        'lessons', v_lessons,
        'remediations', v_remediations
    );
END;
$$;
