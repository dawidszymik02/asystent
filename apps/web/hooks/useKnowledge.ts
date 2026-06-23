'use client'

import { createClient } from '@/lib/supabase/client'
import type { KnowledgeDocument, KnowledgeTag, CreateDocumentPayload } from '@/types/knowledge'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchDocuments(): Promise<KnowledgeDocument[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/documents`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania dokumentów: ${res.status}`)
  const json = await res.json()
  return json.data as KnowledgeDocument[]
}

export async function deleteDocument(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/documents/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Błąd usuwania dokumentu: ${res.status}`)
}

export async function createDocument(payload: CreateDocumentPayload): Promise<KnowledgeDocument> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/documents`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Błąd tworzenia dokumentu: ${res.status}`)
  const json = await res.json()
  return json.data as KnowledgeDocument
}

export async function fetchTags(): Promise<KnowledgeTag[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/tags`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania tagów: ${res.status}`)
  const json = await res.json()
  return json.data as KnowledgeTag[]
}

export async function searchTagsApi(q: string): Promise<KnowledgeTag[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/tags/search?q=${encodeURIComponent(q)}`, { headers })
  if (!res.ok) throw new Error(`Błąd wyszukiwania tagów: ${res.status}`)
  const json = await res.json()
  return json.data as KnowledgeTag[]
}

export async function createTagApi(name: string): Promise<KnowledgeTag> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/knowledge/tags`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Błąd tworzenia tagu: ${res.status}`)
  const json = await res.json()
  return json.data as KnowledgeTag
}
