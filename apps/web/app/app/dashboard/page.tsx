'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  fetchNote,
  saveNote,
  fetchTodayEvents,
  type DashboardNote,
  type CalendarEvent,
} from '@/hooks/useDashboard'
import {
  fetchTasks,
  completeTask,
  deleteTask,
  type MobileTask,
} from '@/hooks/useCalendar'
import TaskModal from '@/components/calendar/TaskModal'

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
  const today = new Date().toISOString().slice(0, 10)

  const [note, setNote] = useState<DashboardNote>({ id: '', content: '', updatedAt: '' })
  const [noteText, setNoteText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [savedAt, setSavedAt] = useState<string>('')
  const [tasks, setTasks] = useState<MobileTask[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<MobileTask | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadTasks() {
    try {
      setTasks(await fetchTasks(today))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    Promise.all([fetchNote(), fetchTasks(today), fetchTodayEvents()])
      .then(([n, t, e]) => {
        setNote(n)
        setNoteText(n.content)
        setTasks(t)
        setEvents(e)
      })
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleCompleteTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    try {
      await completeTask(id)
      await loadTasks()
    } catch (e) {
      console.error(e)
      await loadTasks()
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Usunąć zadanie?')) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch (e) {
      console.error(e)
      await loadTasks()
    }
  }

  const btnBase: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 6,
    color: 'var(--text-muted)',
  }

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
          gap: 24,
          alignItems: 'flex-start',
          boxSizing: 'border-box',
        }}
      >
        {/* Left column */}
        <div style={{ flex: '0 0 42%', minWidth: 0 }}>
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
              <button
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  color: 'var(--accent)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                onClick={() => {
                  setEditingTask(null)
                  setShowTaskModal(true)
                }}
              >
                + zadanie
              </button>
            </div>

            {tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak zadań na dziś 🎉</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    const btns = (e.currentTarget as HTMLDivElement).querySelector<HTMLDivElement>(
                      '.task-actions',
                    )
                    if (btns) btns.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    const btns = (e.currentTarget as HTMLDivElement).querySelector<HTMLDivElement>(
                      '.task-actions',
                    )
                    if (btns) btns.style.opacity = '0'
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => handleCompleteTask(task.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: task.completed
                        ? '2px solid var(--accent)'
                        : '2px solid var(--border)',
                      background: task.completed ? 'var(--accent)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {task.completed && '✓'}
                  </div>

                  {/* Tytuł */}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {task.title}
                  </span>

                  {/* Akcje (widoczne po hover) */}
                  <div
                    className="task-actions"
                    style={{
                      display: 'flex',
                      gap: 2,
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      style={btnBase}
                      title="Edytuj"
                      onClick={() => {
                        setEditingTask(task)
                        setShowTaskModal(true)
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      style={{ ...btnBase, color: '#dc2626' }}
                      title="Usuń"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
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
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      minWidth: 0,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
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
        <div style={{ flex: '0 0 55%', minWidth: 0 }}>
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

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
        }}
        onSaved={loadTasks}
        task={editingTask}
        defaultDate={today}
      />
    </div>
  )
}
