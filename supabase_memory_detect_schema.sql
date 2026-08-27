-- ============================================================================
-- MATANY.ONE / X1.LINK — MEMORY DETECT 2.0 MAX EDITION SCHEMA
-- Autonomous Multi-Hop Vector Search (pgvector) + FTS (pg_trgm/tsvector) + 
-- Exact Symbol Indexing + Conflict Reconciliation & Temporal Graphs
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create Semantic Memories Table (Chunked, Embedded, Multi-Scope Memory History)
CREATE TABLE IF NOT EXISTS public.x1_semantic_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    chat_id UUID REFERENCES public.x1_chats(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.x1_messages(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL DEFAULT 'default_project',
    predicate TEXT, -- e.g. 'SERVER_PORT', 'DATABASE_ENGINE', 'AUTH_MECHANISM', 'BUGFIX', 'API_ENDPOINT'
    message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system', 'distilled_summary', 'insight')),
    scope TEXT NOT NULL DEFAULT 'general_chat' CHECK (scope IN ('general_chat', 'code_snippets', 'decisions', 'cyber_findings', 'user_facts', 'target_recon', 'all')),
    content TEXT NOT NULL,
    summary TEXT,
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    keywords TEXT[] NOT NULL DEFAULT '{}'::text[],
    code_symbols TEXT[] NOT NULL DEFAULT '{}'::text[], -- Exact code identifiers, variables, functions for needle-in-haystack
    embedding vector(1536), -- Standard 1536-dim embeddings (OpenAI text-embedding-3-small / OpenRouter)
    token_count INTEGER NOT NULL DEFAULT 0,
    relevance_weight FLOAT NOT NULL DEFAULT 1.0,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    superseded_at TIMESTAMPTZ,
    superseded_by UUID REFERENCES public.x1_semantic_memories(id) ON DELETE SET NULL,
    revision_reason TEXT,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Chat Links Knowledge Graph Table (Cross-Session Relational Edges)
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

-- 4. High-Performance Search Indexes (Tuned HNSW & Multi-Column Composite GIN)
-- HNSW Vector Index with enhanced ef_construction & m parameters for ultra-high recall
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_embedding_hnsw 
ON public.x1_semantic_memories 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128);

-- Full-Text Search GIN Indexes (Multi-Language: Simple & English & Trigram)
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_content_fts 
ON public.x1_semantic_memories 
USING gin (to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_summary_fts 
ON public.x1_semantic_memories 
USING gin (to_tsvector('simple', COALESCE(summary, '')));

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_content_trgm 
ON public.x1_semantic_memories 
USING gin (content gin_trgm_ops);

-- Exact Code Symbols Array GIN Index (Crucial for Needle-in-Code retrieval)
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_code_symbols 
ON public.x1_semantic_memories 
USING gin (code_symbols);

-- JSONB & Keyword Array GIN Indexes
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_entities 
ON public.x1_semantic_memories 
USING gin (entities);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_keywords 
ON public.x1_semantic_memories 
USING gin (keywords);

-- Composite B-Tree Performance Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_lookup 
ON public.x1_semantic_memories(user_id, device_id, project_id, is_latest, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_predicate 
ON public.x1_semantic_memories(user_id, device_id, predicate, is_latest);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_chat_id 
ON public.x1_semantic_memories(chat_id);

CREATE INDEX IF NOT EXISTS idx_x1_semantic_memories_scope 
ON public.x1_semantic_memories(scope);

CREATE INDEX IF NOT EXISTS idx_x1_chat_links_user_device 
ON public.x1_chat_links(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_x1_chat_links_source_target 
ON public.x1_chat_links(source_chat_id, target_chat_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.x1_semantic_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_chat_links ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies for Semantic Memories
DROP POLICY IF EXISTS "Allow select semantic memories" ON public.x1_semantic_memories;
CREATE POLICY "Allow select semantic memories" ON public.x1_semantic_memories FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert semantic memories" ON public.x1_semantic_memories;
CREATE POLICY "Allow upsert semantic memories" ON public.x1_semantic_memories FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- 7. Row Level Security Policies for Chat Links
DROP POLICY IF EXISTS "Allow select chat links" ON public.x1_chat_links;
CREATE POLICY "Allow select chat links" ON public.x1_chat_links FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

DROP POLICY IF EXISTS "Allow upsert chat links" ON public.x1_chat_links;
CREATE POLICY "Allow upsert chat links" ON public.x1_chat_links FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND device_id IS NOT NULL));

-- ============================================================================
-- 8. HYBRID SEARCH RPC FUNCTION (pgvector + FTS + Exact Code Symbols + RRF + Multi-Hop)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.match_chat_history(
    query_embedding vector(1536) DEFAULT NULL,
    query_text TEXT DEFAULT '',
    exact_symbols TEXT[] DEFAULT '{}'::text[],
    match_threshold FLOAT DEFAULT 0.15,
    match_count INT DEFAULT 8,
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL,
    p_project_id TEXT DEFAULT NULL,
    p_scope TEXT DEFAULT 'all',
    p_time_filter TEXT DEFAULT 'all_time',
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_enable_multihop BOOLEAN DEFAULT true,
    rrf_k INT DEFAULT 60
)
RETURNS TABLE (
    id UUID,
    chat_id UUID,
    message_id UUID,
    project_id TEXT,
    predicate TEXT,
    message_role TEXT,
    scope TEXT,
    content TEXT,
    summary TEXT,
    entities JSONB,
    keywords TEXT[],
    code_symbols TEXT[],
    token_count INT,
    created_at TIMESTAMPTZ,
    vector_similarity FLOAT,
    text_similarity FLOAT,
    symbol_match_score FLOAT,
    rrf_score FLOAT,
    hop_depth INT,
    linked_via UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_time_cutoff TIMESTAMPTZ;
BEGIN
    -- Determine time filter cutoff if explicit start/end time not specified
    IF p_start_time IS NOT NULL THEN
        v_time_cutoff := p_start_time;
    ELSIF p_time_filter = 'last_day' THEN
        v_time_cutoff := now() - INTERVAL '1 day';
    ELSIF p_time_filter = 'last_week' THEN
        v_time_cutoff := now() - INTERVAL '7 days';
    ELSIF p_time_filter = 'last_month' THEN
        v_time_cutoff := now() - INTERVAL '30 days';
    ELSE
        v_time_cutoff := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
    END IF;

    RETURN QUERY
    WITH base_primary_candidates AS (
        SELECT 
            m.id,
            m.chat_id,
            m.message_id,
            m.project_id,
            m.predicate,
            m.message_role,
            m.scope,
            m.content,
            m.summary,
            m.entities,
            m.keywords,
            m.code_symbols,
            m.token_count,
            m.created_at,
            -- Cosine similarity: 1 - cosine distance
            CASE 
                WHEN query_embedding IS NOT NULL AND m.embedding IS NOT NULL THEN
                    GREATEST(0.0, (1.0 - (m.embedding <=> query_embedding)))
                ELSE 0.0 
            END AS vector_sim,
            -- Full text rank & trigram similarity
            CASE 
                WHEN query_text IS NOT NULL AND trim(query_text) <> '' THEN
                    GREATEST(
                        ts_rank_cd(to_tsvector('simple', m.content), plainto_tsquery('simple', query_text)),
                        ts_rank_cd(to_tsvector('simple', COALESCE(m.summary, '')), plainto_tsquery('simple', query_text)),
                        similarity(m.content, query_text) * 0.90
                    )
                ELSE 0.0 
            END AS text_sim,
            -- Exact Symbol Match: check array intersection
            CASE 
                WHEN exact_symbols IS NOT NULL AND array_length(exact_symbols, 1) > 0 THEN
                    CASE 
                        WHEN m.code_symbols && exact_symbols THEN 1.0
                        WHEN query_text IS NOT NULL AND m.content ILIKE ANY(SELECT '%' || s || '%' FROM unnest(exact_symbols) s) THEN 0.8
                        ELSE 0.0
                    END
                ELSE 0.0
            END AS sym_score,
            0 AS h_depth,
            NULL::UUID AS link_origin
        FROM public.x1_semantic_memories m
        WHERE 
            m.is_latest = true
            AND (
                (p_user_id IS NOT NULL AND m.user_id = p_user_id)
                OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND m.device_id = p_device_id)
            )
            AND (p_project_id IS NULL OR m.project_id = p_project_id OR m.project_id = 'default_project')
            AND (p_scope = 'all' OR m.scope = p_scope)
            AND (m.created_at >= v_time_cutoff)
            AND (p_end_time IS NULL OR m.created_at <= p_end_time)
    ),
    filtered_primary AS (
        SELECT *
        FROM base_primary_candidates
        WHERE 
            (query_embedding IS NOT NULL AND vector_sim >= match_threshold)
            OR (query_text IS NOT NULL AND text_sim >= 0.04)
            OR (sym_score > 0.0)
            OR (query_embedding IS NULL AND query_text IS NULL)
    ),
    -- Multi-Hop Graph Traversal (1-Hop connected chat sessions)
    multihop_candidates AS (
        SELECT 
            m2.id,
            m2.chat_id,
            m2.message_id,
            m2.project_id,
            m2.predicate,
            m2.message_role,
            m2.scope,
            m2.content,
            m2.summary,
            m2.entities,
            m2.keywords,
            m2.code_symbols,
            m2.token_count,
            m2.created_at,
            (fp.vector_sim * l.confidence * 0.85)::FLOAT AS vector_sim,
            (fp.text_sim * l.confidence * 0.85)::FLOAT AS text_sim,
            (fp.sym_score * 0.5)::FLOAT AS sym_score,
            1 AS h_depth,
            fp.id AS link_origin
        FROM filtered_primary fp
        JOIN public.x1_chat_links l 
            ON (l.source_chat_id = fp.chat_id OR l.target_chat_id = fp.chat_id)
        JOIN public.x1_semantic_memories m2 
            ON (m2.chat_id = CASE WHEN l.source_chat_id = fp.chat_id THEN l.target_chat_id ELSE l.source_chat_id END)
        WHERE 
            p_enable_multihop = true
            AND m2.is_latest = true
            AND m2.id <> fp.id
            AND (
                (p_user_id IS NOT NULL AND m2.user_id = p_user_id)
                OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND m2.device_id = p_device_id)
            )
    ),
    combined_candidates AS (
        SELECT * FROM filtered_primary
        UNION ALL
        SELECT * FROM multihop_candidates
    ),
    ranked_vector AS (
        SELECT 
            cc.id,
            ROW_NUMBER() OVER (ORDER BY cc.vector_sim DESC, cc.created_at DESC) AS v_rank
        FROM combined_candidates cc
        WHERE cc.vector_sim > 0.0
    ),
    ranked_text AS (
        SELECT 
            cc.id,
            ROW_NUMBER() OVER (ORDER BY cc.text_sim DESC, cc.created_at DESC) AS t_rank
        FROM combined_candidates cc
        WHERE cc.text_sim > 0.0
    )
    SELECT DISTINCT ON (cc.id)
        cc.id,
        cc.chat_id,
        cc.message_id,
        cc.project_id,
        cc.predicate,
        cc.message_role,
        cc.scope,
        cc.content,
        cc.summary,
        cc.entities,
        cc.keywords,
        cc.code_symbols,
        cc.token_count,
        cc.created_at,
        cc.vector_sim AS vector_similarity,
        cc.text_sim AS text_similarity,
        cc.sym_score AS symbol_match_score,
        -- RRF Score with Symbol Boost & Hop-Depth calibration
        (
            COALESCE(1.0 / (rrf_k + rv.v_rank), 0.0) +
            COALESCE(1.0 / (rrf_k + rt.t_rank), 0.0) +
            (cc.vector_sim * 0.40) +
            (cc.text_sim * 0.30) +
            (cc.sym_score * 0.50)
        )::FLOAT AS rrf_score,
        cc.h_depth AS hop_depth,
        cc.link_origin AS linked_via
    FROM combined_candidates cc
    LEFT JOIN ranked_vector rv ON cc.id = rv.id
    LEFT JOIN ranked_text rt ON cc.id = rt.id
    ORDER BY cc.id, rrf_score DESC, cc.created_at DESC
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- 9. ATOMIC CONFLICT RECONCILIATION & MEMORY UPSERT RPC
-- Autonomously invalidates conflicting predecessors upon writing new verified truths
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reconcile_and_upsert_memory(
    p_chat_id UUID,
    p_message_id UUID DEFAULT NULL,
    p_project_id TEXT DEFAULT 'default_project',
    p_predicate TEXT DEFAULT NULL,
    p_message_role TEXT DEFAULT 'insight',
    p_scope TEXT DEFAULT 'general_chat',
    p_content TEXT DEFAULT '',
    p_summary TEXT DEFAULT NULL,
    p_entities JSONB DEFAULT '[]'::jsonb,
    p_keywords TEXT[] DEFAULT '{}'::text[],
    p_code_symbols TEXT[] DEFAULT '{}'::text[],
    p_embedding vector(1536) DEFAULT NULL,
    p_token_count INT DEFAULT 0,
    p_user_id UUID DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_new_id UUID;
    v_superseded_count INT := 0;
BEGIN
    -- 1. Insert the new Ground Truth Memory Node
    INSERT INTO public.x1_semantic_memories (
        user_id,
        device_id,
        chat_id,
        message_id,
        project_id,
        predicate,
        message_role,
        scope,
        content,
        summary,
        entities,
        keywords,
        code_symbols,
        embedding,
        token_count,
        is_latest,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_device_id,
        p_chat_id,
        p_message_id,
        COALESCE(p_project_id, 'default_project'),
        p_predicate,
        p_message_role,
        p_scope,
        p_content,
        p_summary,
        COALESCE(p_entities, '[]'::jsonb),
        COALESCE(p_keywords, '{}'::text[]),
        COALESCE(p_code_symbols, '{}'::text[]),
        p_embedding,
        p_token_count,
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_new_id;

    -- 2. If predicate is functional (e.g. SERVER_PORT, DATABASE_ENGINE, USER_ROLE), invalidate prior entries
    IF p_predicate IS NOT NULL AND p_predicate <> '' THEN
        WITH updated_rows AS (
            UPDATE public.x1_semantic_memories
            SET 
                is_latest = false,
                superseded_at = timezone('utc'::text, now()),
                superseded_by = v_new_id,
                revision_reason = 'Superseded by new ground truth (Node ' || v_new_id::text || ')'
            WHERE 
                id <> v_new_id
                AND predicate = p_predicate
                AND is_latest = true
                AND (
                    (p_user_id IS NOT NULL AND user_id = p_user_id)
                    OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND device_id = p_device_id)
                )
                AND (project_id = p_project_id OR p_project_id = 'default_project')
            RETURNING id
        )
        SELECT COUNT(*) INTO v_superseded_count FROM updated_rows;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'inserted_id', v_new_id,
        'predicate', p_predicate,
        'superseded_conflicts_count', v_superseded_count
    );
END;
$$;

-- ============================================================================
-- 10. MUTATION RPC: UPDATE MEMORY NODE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_memory_node_content(
    p_node_id UUID,
    p_new_content TEXT,
    p_new_summary TEXT DEFAULT NULL,
    p_new_entities JSONB DEFAULT '[]'::jsonb,
    p_new_keywords TEXT[] DEFAULT '{}'::text[],
    p_new_code_symbols TEXT[] DEFAULT '{}'::text[],
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
        code_symbols = COALESCE(p_new_code_symbols, code_symbols),
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

-- ============================================================================
-- 11. GRAPH RPC: LINK CHAT CONTEXTS
-- ============================================================================
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

-- ============================================================================
-- 12. GRAPH TOPOLOGY QUERY RPC
-- ============================================================================
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
