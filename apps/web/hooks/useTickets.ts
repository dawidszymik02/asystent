'use client'

import { createClient } from '@/lib/supabase/client'
import type { WorkTicket, WorkProgram, WorkTicketNote, WorkTicketStatus, CreateTicketPayload } from '@/types/work'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

async function fetchTickets(status?: string): Promise<WorkTicket[]> {
  const headers = await getAuthHeader()
  const url = status
    ? `${API}/work/tickets/by-status?status=${encodeURIComponent(status)}`
    : `${API}/work/tickets`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania zgłoszeń: ${res.status}`)
  const json = await res.json()
  return json.data as WorkTicket[]
}

async function fetchTicket(id: string): Promise<WorkTicket> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets/${id}`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return json.data as WorkTicket
}

async function fetchPrograms(): Promise<WorkProgram[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/programs`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania programów: ${res.status}`)
  const json = await res.json()
  return json.data as WorkProgram[]
}

async function fetchAllPrograms(): Promise<WorkProgram[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/programs/all`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkProgram[]
}

async function createProgram(data: {
  name: string; shortCode: string; color: string; description?: string; isActive: boolean
}): Promise<WorkProgram> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/programs`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkProgram
}

async function updateProgram(id: string, data: Partial<WorkProgram>): Promise<WorkProgram> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/programs/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkProgram
}

async function deleteProgram(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/programs/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`${res.status}`)
}

async function fetchStatuses(): Promise<WorkTicketStatus[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/ticket-statuses`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania statusów: ${res.status}`)
  const json = await res.json()
  return json.data as WorkTicketStatus[]
}

async function fetchAllStatuses(): Promise<WorkTicketStatus[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/ticket-statuses/all`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkTicketStatus[]
}

async function createStatus(data: {
  key: string; label: string; color: string; bgColor: string; sortOrder: number; isActive: boolean
}): Promise<WorkTicketStatus> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/ticket-statuses`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkTicketStatus
}

async function updateStatus(id: string, data: Partial<WorkTicketStatus>): Promise<WorkTicketStatus> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/ticket-statuses/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkTicketStatus
}

async function deleteStatus(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/ticket-statuses/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`${res.status}`)
}

async function createTicket(data: CreateTicketPayload): Promise<WorkTicket> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Błąd tworzenia zgłoszenia: ${res.status}`)
  }
  const json = await res.json()
  return json.data as WorkTicket
}

async function updateTicket(id: string, data: Partial<CreateTicketPayload>): Promise<WorkTicket> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Błąd aktualizacji zgłoszenia: ${res.status}`)
  }
  const json = await res.json()
  return json.data ?? json
}

async function deleteTicket(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Błąd usuwania zgłoszenia: ${res.status}`)
}

async function fetchNotes(ticketId: string): Promise<WorkTicketNote[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets/${ticketId}/notes`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania notatek: ${res.status}`)
  const json = await res.json()
  return json.data as WorkTicketNote[]
}

async function addNote(ticketId: string, content: string): Promise<WorkTicketNote> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tickets/${ticketId}/notes`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Błąd dodawania notatki: ${res.status}`)
  }
  const json = await res.json()
  return json.data as WorkTicketNote
}

export {
  fetchTickets, fetchTicket,
  fetchPrograms, fetchAllPrograms, createProgram, updateProgram, deleteProgram,
  fetchStatuses, fetchAllStatuses, createStatus, updateStatus, deleteStatus,
  createTicket, updateTicket, deleteTicket,
  fetchNotes, addNote,
}
