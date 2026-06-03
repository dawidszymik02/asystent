'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarX, CheckSquare, MapPin, Pencil, Trash2, Calendar } from 'lucide-react'
import {
  fetchEvents,
  fetchTasks,
  fetchCategories,
  deleteEvent,
  completeTask,
  deleteTask,
  updateTask,
  type CalendarEvent,
  type MobileTask,
  type CalendarCategory,
} from '@/hooks/useCalendar'
import EventModal from '@/components/calendar/EventModal'
import TaskModal from '@/components/calendar/TaskModal'

function toISO(date: string): { from: string; to: string } {
  return {
    from: `${date}T00:00:00Z`,
    to: `${date}T23:59:59Z`,
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string>(today())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<MobileTask[]>([])
  const [categories, setCategories] = useState<CalendarCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editingTask, setEditingTask] = useState<MobileTask | null>(null)
  const [inlineDateTaskId, setInlineDateTaskId] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const loadDayData = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const { from, to } = toISO(date)
      const [evts, tsks] = await Promise.all([fetchEvents(from, to), fetchTasks(date)])
      setEvents(evts)
      setTasks(tsks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadDayData(selectedDate)
  }, [selectedDate, loadDayData])

  async function handleDeleteEvent(id: string) {
    if (!confirm('Usunąć wydarzenie?')) return
    try {
      await deleteEvent(id)
      await loadDayData(selectedDate)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleCompleteTask(id: string) {
    try {
      await completeTask(id)
      await loadDayData(selectedDate)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Usunąć zadanie?')) return
    try {
      await deleteTask(id)
      await loadDayData(selectedDate)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleInlineDateChange(taskId: string, newDate: string) {
    if (!newDate) return
    try {
      await updateTask(taskId, { date: newDate })
      setInlineDateTaskId(null)
      await loadDayData(selectedDate)
    } catch (e) {
      console.error(e)
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

  const completedCount = tasks.filter((t) => t.completed).length

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
          flexShrink: 0,
        }}
      >
        {/* Lewa: tytuł */}
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
          Kalendarz
        </span>

        {/* Środek: nawigacja daty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-primary)',
            }}
          >
            ←
          </button>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              minWidth: 220,
              textAlign: 'center',
              color: 'var(--text-primary)',
              textTransform: 'capitalize',
            }}
          >
            {formatDatePL(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-primary)',
            }}
          >
            →
          </button>
          <button
            onClick={() => setSelectedDate(today())}
            style={{
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '6px 14px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--accent)',
              fontWeight: 500,
            }}
          >
            Dziś
          </button>
        </div>

        {/* Prawa: przyciski tworzenia */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setEditingEvent(null); setShowEventModal(true) }}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Wydarzenie
          </button>
          <button
            onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
            style={{
              background: '#fff',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Zadanie
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 24,
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* LEWA: Wydarzenia */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Wydarzenia
            </span>
            {events.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{events.length}</span>
            )}
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ładowanie...</p>
          ) : events.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '40px 0',
                color: 'var(--text-muted)',
              }}
            >
              <CalendarX size={32} />
              <span style={{ fontSize: 13 }}>Brak wydarzeń tego dnia</span>
            </div>
          ) : (
            events.map((event) => {
              const accentColor = event.color ?? event.categoryColor ?? 'var(--accent)'
              return (
                <div
                  key={event.id}
                  style={{
                    background: '#fff',
                    borderLeft: `4px solid ${accentColor}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '0 12px 12px 0',
                    padding: '12px 16px',
                    marginBottom: 10,
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 2px 8px rgba(0,0,0,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {event.isAllDay
                          ? 'Cały dzień'
                          : `${formatTime(event.startTime)} — ${formatTime(event.endTime)}`}
                      </div>
                      {event.location && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                          <MapPin size={11} />
                          {event.location}
                        </div>
                      )}
                      {event.categoryName && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: 5,
                            fontSize: 11,
                            fontWeight: 500,
                            color: event.categoryColor ?? 'var(--accent)',
                            background: 'var(--accent-light)',
                            borderRadius: 4,
                            padding: '1px 6px',
                          }}
                        >
                          {event.categoryName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button
                        style={btnBase}
                        title="Edytuj"
                        onClick={() => { setEditingEvent(event); setShowEventModal(true) }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        style={{ ...btnBase, color: '#dc2626' }}
                        title="Usuń"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* PRAWA: Zadania */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Zadania
            </span>
            {tasks.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tasks.length}</span>
            )}
            {completedCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ({completedCount} ukończone)
              </span>
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
              onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
            >
              + zadanie
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ładowanie...</p>
          ) : tasks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '40px 0',
                color: 'var(--text-muted)',
              }}
            >
              <CheckSquare size={32} />
              <span style={{ fontSize: 13 }}>Brak zadań tego dnia</span>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="task-row"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  const btns = (e.currentTarget as HTMLDivElement).querySelector<HTMLDivElement>('.task-actions')
                  if (btns) btns.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  const btns = (e.currentTarget as HTMLDivElement).querySelector<HTMLDivElement>('.task-actions')
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
                    border: task.completed ? '2px solid var(--accent)' : '2px solid var(--border)',
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
                    fontSize: 14,
                    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </span>

                {/* Inline date picker */}
                {inlineDateTaskId === task.id && (
                  <input
                    ref={dateInputRef}
                    type="date"
                    defaultValue={task.date}
                    autoFocus
                    onBlur={(e) => handleInlineDateChange(task.id, e.target.value)}
                    style={{
                      fontSize: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '2px 6px',
                      outline: 'none',
                    }}
                  />
                )}

                {/* Przyciski akcji */}
                <div
                  className="task-actions"
                  style={{
                    display: 'flex',
                    gap: 2,
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                >
                  <button
                    style={btnBase}
                    title="Edytuj"
                    onClick={() => { setEditingTask(task); setShowTaskModal(true) }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    style={btnBase}
                    title="Zmień datę"
                    onClick={() => setInlineDateTaskId(inlineDateTaskId === task.id ? null : task.id)}
                  >
                    <Calendar size={14} />
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
      </div>

      {/* Modals */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => { setShowEventModal(false); setEditingEvent(null) }}
        onSaved={() => loadDayData(selectedDate)}
        event={editingEvent}
        categories={categories}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
        onSaved={() => loadDayData(selectedDate)}
        task={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  )
}
