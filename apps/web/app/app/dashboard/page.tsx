'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  fetchNote,
  saveNote,
  fetchTodayTasks,
  fetchTodayEvents,
  type DashboardNote,
  type CalendarEvent,
} from '@/hooks/useDashboard'
import { TASK_TYPES, TASK_STATUSES } from '@/hooks/useTasks'
import type { WorkTask } from '@/types/work'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

function formatUpdatedAt(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayLabel(): string {
  return new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function todayShort(): string {
  return new Date().toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function DashboardPage() {
  const [note, setNote] = useState<DashboardNote>({ id: '', content: '', updatedAt: '' })
  const [noteText, setNoteText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [savedAt, setSavedAt] = useState<string>('')
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([fetchNote(), fetchTodayTasks(), fetchTodayEvents()])
      .then(([n, t, e]) => {
        setNote(n)
        setNoteText(n.content)
        setTasks(t)
        setEvents(e)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (noteText === note.content) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        const updated = await saveNote(noteText)
        setNote(updated)
        setSaveStatus('saved')
        setSavedAt(formatTime(new Date().toISOString()))
      } catch {
        setSaveStatus('idle')
      }
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [noteText]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%' }}>
      {/* Topbar */}
      <div
        style={{
          height: 56,
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
          Dashboard
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{todayLabel()}</span>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          gap: 0,
          alignItems: 'flex-start',
        }}
      >
        {/* Left column */}
        <div style={{ flex: '0 0 42%' }}>
          {/* Tasks */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Zadania na dziś
              </span>
              {tasks.length > 0 && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tasks.length}</span>
              )}
            </div>

            {tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak zadań na dziś 🎉</p>
            ) : (
              tasks.map((task) => {
                const type = TASK_TYPES[task.type] ?? TASK_TYPES.OTHER
                const status = TASK_STATUSES[task.status] ?? TASK_STATUSES.todo
                return (
                  <Link
                    key={task.id}
                    href={`/app/tasks/${task.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 8,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: type.color,
                            background: type.bg,
                            borderRadius: 4,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {type.label}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {task.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: status.color,
                            background: status.bg,
                            borderRadius: 4,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                      {task.clientName && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {task.clientName}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Events */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Dzisiaj w kalendarzu
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{todayShort()}</span>
            </div>

            {events.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak wydarzeń na dziś</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    background: '#fff',
                    borderLeft: `3px solid ${event.color ?? 'var(--accent)'}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '0 10px 10px 0',
                    padding: '10px 14px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {event.allDay
                      ? 'Cały dzień'
                      : `${formatTime(event.startTime)} — ${formatTime(event.endTime)}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column — Notepad */}
        <div style={{ flex: '0 0 55%', marginLeft: 'auto' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 20,
              height: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                Notatnik
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: saveStatus === 'saved' ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {saveStatus === 'saving'
                  ? 'Zapisywanie...'
                  : saveStatus === 'saved'
                  ? `Zapisano ${savedAt}`
                  : ''}
              </span>
            </div>

            <textarea
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans, Arial, sans-serif)',
                paddingTop: 12,
                background: 'transparent',
              }}
              placeholder="Zacznij pisać..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <div
              style={{
                borderTop: '1px solid var(--border-light)',
                paddingTop: 10,
                marginTop: 8,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Ostatnia zmiana: {formatUpdatedAt(note.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
