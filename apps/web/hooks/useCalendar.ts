'use client'

import { createClient } from '@/lib/supabase/client'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface CalendarEvent {
  id: string
  userId?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  isAllDay?: boolean
  location?: string
  color?: string
  categoryId?: string
  categoryName?: string
  categoryColor?: string
  recurrenceRule?: string
  reminderMinutes?: number
  sourceModule?: string
  isCancelled?: boolean
}

export interface CalendarCategory {
  id: string
  name: string
  color: string
}

export interface MobileTask {
  id: string
  title: string
  date: string
  completed: boolean
  position: number
  createdAt: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  startTime: string
  endTime: string
  isAllDay?: boolean
  location?: string
  color?: string
  categoryId?: string
  reminderMinutes?: number
}

export interface CreateTaskPayload {
  title: string
  date: string
}

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const headers = await getAuthHeader()
  const res = await fetch(
    `${API}/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers },
  )
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as CalendarEvent[]
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/calendar/events/${id}`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as CalendarEvent
}

export async function createEvent(data: CreateEventPayload): Promise<CalendarEvent> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/calendar/events`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as CalendarEvent
}

export async function updateEvent(
  id: string,
  data: Partial<CreateEventPayload>,
): Promise<CalendarEvent> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/calendar/events/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as CalendarEvent
}

export async function deleteEvent(id: string, mode = 'all'): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/calendar/events/${id}?deleteMode=${mode}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`${res.status}`)
}

export async function fetchCategories(): Promise<CalendarCategory[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/calendar/categories`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as CalendarCategory[]
}

export async function fetchTasks(date: string): Promise<MobileTask[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/tasks?date=${date}`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as MobileTask[]
}

export async function createTask(data: CreateTaskPayload): Promise<MobileTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as MobileTask
}

export async function updateTask(
  id: string,
  data: { title?: string; date?: string },
): Promise<MobileTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/tasks/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as MobileTask
}

export async function completeTask(id: string): Promise<MobileTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/tasks/${id}/complete`, {
    method: 'PATCH',
    headers,
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as MobileTask
}

export async function deleteTask(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/tasks/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`${res.status}`)
}
