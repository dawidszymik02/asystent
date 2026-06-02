'use client'

import { createClient } from '@/lib/supabase/client'
import type { WorkTask, CreateTaskPayload } from '@/types/work'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Brak sesji — zaloguj się ponownie')
  return { Authorization: `Bearer ${token}` }
}

export const TASK_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  DEPLOYMENT: { label: 'Wdrożenie',    color: '#2563EB', bg: '#EFF6FF' },
  TRAINING:   { label: 'Szkolenie',    color: '#7C3AED', bg: '#F5F3FF' },
  MIGRATION:  { label: 'Migracja',     color: '#D97706', bg: '#FFFBEB' },
  UPDATE:     { label: 'Aktualizacja', color: '#059669', bg: '#ECFDF5' },
  OTHER:      { label: 'Inne',         color: '#6B7280', bg: '#F3F4F6' },
}

export const TASK_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'Do zrobienia', color: '#6B7280', bg: '#F3F4F6' },
  in_progress: { label: 'W toku',       color: '#2563EB', bg: '#EFF6FF' },
  done:        { label: 'Gotowe',       color: '#059669', bg: '#ECFDF5' },
  cancelled:   { label: 'Anulowane',   color: '#9CA3AF', bg: '#F9FAFB' },
}

async function fetchTasks(status?: string): Promise<WorkTask[]> {
  const headers = await getAuthHeader()
  const url = status
    ? `${API}/work/tasks/by-status?status=${encodeURIComponent(status)}`
    : `${API}/work/tasks`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Błąd pobierania zadań: ${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkTask[]
}

async function fetchTask(id: string): Promise<WorkTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tasks/${id}`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return (json.data ?? json) as WorkTask
}

function toIsoDateTime(date?: string): string | undefined {
  if (!date) return undefined
  if (date.includes('T')) return date
  return `${date}T00:00:00Z`
}

function cleanBody(data: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ''))
  )
}

async function createTask(data: CreateTaskPayload): Promise<WorkTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tasks`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: cleanBody({ ...data, dueDate: toIsoDateTime(data.dueDate) } as unknown as Record<string, unknown>),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Błąd tworzenia zadania: ${res.status}`)
  }
  const json = await res.json()
  return (json.data ?? json) as WorkTask
}

async function updateTask(id: string, data: Partial<CreateTaskPayload>): Promise<WorkTask> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tasks/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: cleanBody({ ...data, dueDate: toIsoDateTime(data.dueDate) } as unknown as Record<string, unknown>),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Błąd aktualizacji zadania: ${res.status}`)
  }
  const json = await res.json()
  return (json.data ?? json) as WorkTask
}

async function deleteTask(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/work/tasks/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Błąd usuwania zadania: ${res.status}`)
}

export { fetchTasks, fetchTask, createTask, updateTask, deleteTask }
