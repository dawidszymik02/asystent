export interface KnowledgeTag {
  id: string
  name: string
  createdAt: string
}

export interface KnowledgeDocument {
  id: string
  title: string
  type: string
  chunkCount: number
  createdAt: string
  tags: KnowledgeTag[]
}

export interface CreateDocumentPayload {
  title: string
  type: string
  contentRaw: string
  tagIds: string[]
}
