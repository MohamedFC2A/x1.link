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

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_x1_chats_user_id ON public.x1_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_x1_chats_device_id ON public.x1_chats(device_id);
CREATE INDEX IF NOT EXISTS idx_x1_chats_updated_at ON public.x1_chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_x1_messages_chat_id ON public.x1_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_x1_messages_created_at ON public.x1_messages(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.x1_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x1_messages ENABLE ROW LEVEL SECURITY;

-- 5. Chats RLS Policies
DROP POLICY IF EXISTS "Allow users and guests to select their chats" ON public.x1_chats;
CREATE POLICY "Allow users and guests to select their chats"
ON public.x1_chats FOR SELECT
USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND device_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Allow users and guests to insert their chats" ON public.x1_chats;
CREATE POLICY "Allow users and guests to insert their chats"
ON public.x1_chats FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND device_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Allow users and guests to update their chats" ON public.x1_chats;
CREATE POLICY "Allow users and guests to update their chats"
ON public.x1_chats FOR UPDATE
USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND device_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Allow users and guests to delete their chats" ON public.x1_chats;
CREATE POLICY "Allow users and guests to delete their chats"
ON public.x1_chats FOR DELETE
USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND device_id IS NOT NULL)
);

-- 6. Messages RLS Policies
DROP POLICY IF EXISTS "Allow users and guests to select messages" ON public.x1_messages;
CREATE POLICY "Allow users and guests to select messages"
ON public.x1_messages FOR SELECT
USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND device_id IS NOT NULL)
    OR EXISTS (
        SELECT 1 FROM public.x1_chats c
        WHERE c.id = public.x1_messages.chat_id
        AND (c.user_id = auth.uid() OR (c.user_id IS NULL AND c.device_id = public.x1_messages.device_id))
    )
);

DROP POLICY IF EXISTS "Allow users and guests to insert messages" ON public.x1_messages;
CREATE POLICY "Allow users and guests to insert messages"
ON public.x1_messages FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND device_id IS NOT NULL)
);

-- 7. Auto-update Trigger for x1_chats updated_at
CREATE OR REPLACE FUNCTION public.handle_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_x1_chat_updated ON public.x1_chats;
CREATE TRIGGER on_x1_chat_updated
    BEFORE UPDATE ON public.x1_chats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_chat_updated_at();
