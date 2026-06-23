CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'text',
    content_raw TEXT         NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID        NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL,
    chunk_index INT         NOT NULL DEFAULT 0,
    embedding   vector(1536),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own documents" ON knowledge_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_user_id  ON knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
