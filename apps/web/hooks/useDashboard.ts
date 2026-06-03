'use client'

import { createClient } from '@/lib/supabase/client'
import type { WorkTask } from '@/types/work'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface DashboardNote {
  id: string
  content: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay?: boolean
  color?: string
}

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

async function fetchNote(): Promise<DashboardNote> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/dashboard/note`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania notatki: ${res.status}`)
  const json = await res.json()
  const d = json.data ?? json
  return { id: d.id, content: d.content, updatedAt: d.updatedAt }
}

async function saveNote(content: string): Promise<DashboardNote> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/dashboard/note`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(`Błąd zapisu notatki: ${res.status}`)
  const json = await res.json()
  const d = json.data ?? json
  return { id: d.id, content: d.content, updatedAt: d.updatedAt }
}

async function fetchTodayTasks(): Promise<WorkTask[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tasks/by-status?status=todo`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania zadań: ${res.status}`)
  const json = await res.json()
  const tasks = (json.data ?? json) as WorkTask[]
  const today = new Date().toISOString().slice(0, 10)
  return tasks.filter((t) => t.dueDate?.startsWith(today))
}

async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const headers = await getAuthHeader()
  const today = new Date().toISOString().slice(0, 10)
  const from = encodeURIComponent(`${today}T00:00:00Z`)
  const to = encodeURIComponent(`${today}T23:59:59Z`)
  const res = await fetch(`${API}/calendar/events?from=${from}&to=${to}`, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania wydarzeń: ${res.status}`)
  const json = await res.json()
  const events = (json.data ?? json) as Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    isAllDay?: boolean
    color?: string
    categoryColor?: string
  }>
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    allDay: e.isAllDay ?? false,
    color: e.color ?? e.categoryColor,
  }))
}

export { fetchNote, saveNote, fetchTodayTasks, fetchTodayEvents }
