'use client'

import { createClient } from '@/lib/supabase/client'
import type { AgentMessageResponse, AgentConversation } from '@/types/agent'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

export async function sendMessage(message: string, conversationId?: string): Promise<AgentMessageResponse> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/agent/chat`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId: conversationId ?? null }),
  })
  if (!res.ok) throw new Error(`Błąd wysyłania wiadomości: ${res.status}`)
  const json = await res.json()
  return json.data as AgentMessageResponse
}

export async function getConversations(): Promise<AgentConversation[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/agent/conversations`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania konwersacji: ${res.status}`)
  const json = await res.json()
  return json.data as AgentConversation[]
}

export async function deleteConversation(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/agent/conversations/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Błąd usuwania konwersacji: ${res.status}`)
}
