-- ============================================================
-- V11: Agent AI — konwersacje i wiadomości
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        REFERENCES public.agent_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role            TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own conversations" ON public.agent_conversations
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own messages" ON public.agent_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_id
  ON public.agent_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation_id
  ON public.agent_messages(conversation_id);
