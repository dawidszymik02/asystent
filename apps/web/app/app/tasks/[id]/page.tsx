'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { fetchTask, updateTask, deleteTask, fetchTaskNotes, createTaskNote, TASK_TYPES, TASK_STATUSES } from '@/hooks/useTasks'
import { fetchPrograms } from '@/hooks/useTickets'
import type { WorkTask, WorkProgram, WorkTaskNote } from '@/types/work'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatNoteDate(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toDateInputValue(isoString?: string): string {
  if (!isoString) return ''
  return isoString.split('T')[0]
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function safeColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (d.getTime() === today.getTime()) {
    return `dziś ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  if (d.getTime() === yesterday.getTime()) return 'wczoraj'
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
}

// ─── skeleton / states ────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ height: 13, width: 90, borderRadius: 4, background: '#E5E7EB', marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 28, width: '65%', borderRadius: 6, background: '#E5E7EB', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ height: 20, width: 70, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 20, width: 50, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
        <div style={{ height: 32, width: 110, borderRadius: 8, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <div style={{ height: 12, width: 70, borderRadius: 4, background: '#F3F4F6', marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div style={{ height: 11, width: '40%', borderRadius: 3, background: '#F3F4F6', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 28, width: '70%', borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <Link href="/app/tasks" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Zadania
      </Link>
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#111827', margin: '0 0 8px 0' }}>Zadanie nie istnieje</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
          Mogło zostać usunięte lub nie masz do niego dostępu.
        </p>
        <Link href="/app/tasks" style={{ fontSize: 14, color: '#10B981', textDecoration: 'none' }}>
          Wróć do listy zadań
        </Link>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <Link href="/app/tasks" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Zadania
      </Link>
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ fontSize: 14, color: '#EF4444', margin: '0 0 16px 0' }}>{error}</p>
        <Link href="/app/tasks" style={{ fontSize: 14, color: '#10B981', textDecoration: 'none' }}>
          Wróć do listy zadań
        </Link>
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [task, setTask] = useState<WorkTask | null>(null)
  const [programs, setPrograms] = useState<WorkProgram[]>([])
  const [notes, setNotes] = useState<WorkTaskNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [flash, setFlash] = useState<'status' | 'type' | 'dueDate' | 'description' | null>(null)
  const [dueDateInput, setDueDateInput] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [t, p, n] = await Promise.all([fetchTask(id), fetchPrograms(), fetchTaskNotes(id)])
        setTask(t)
        setDueDateInput(toDateInputValue(t.dueDate))
        setDescriptionDraft(t.description ?? '')
        setPrograms(p)
        setNotes(n)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Błąd ładowania'
        if (msg === '404' || msg.toLowerCase().includes('not found')) {
          setNotFound(true)
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (!task || newStatus === task.status) return
    if (!task.dueDate) {
      alert('Uzupełnij najpierw termin zadania przed zmianą statusu')
      return
    }
    try {
      const updated = await updateTask(task.id, { status: newStatus, dueDate: task.dueDate })
      setTask(updated)
      setDueDateInput(toDateInputValue(updated.dueDate))
      setFlash('status')
      setTimeout(() => setFlash(null), 700)
    } catch {
      alert('Nie udało się zapisać statusu')
    }
  }

  const handleTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value
    if (!task || newType === task.type) return
    if (!task.dueDate) {
      alert('Uzupełnij najpierw termin zadania przed zmianą typu')
      return
    }
    try {
      const updated = await updateTask(task.id, { type: newType, dueDate: task.dueDate })
      setTask(updated)
      setDueDateInput(toDateInputValue(updated.dueDate))
      setFlash('type')
      setTimeout(() => setFlash(null), 700)
    } catch {
      alert('Nie udało się zapisać typu')
    }
  }

  const handleDueDateChange = async () => {
    if (!task) return
    if (!dueDateInput) {
      alert('Podaj datę')
      return
    }
    const isoDate = `${dueDateInput}T00:00:00Z`
    if (isoDate === task.dueDate) return
    try {
      const updated = await updateTask(task.id, { dueDate: isoDate })
      setTask(updated)
      setDueDateInput(toDateInputValue(updated.dueDate))
      setFlash('dueDate')
      setTimeout(() => setFlash(null), 700)
    } catch {
      alert('Nie udało się zapisać terminu')
    }
  }

  const handleDescriptionSave = async () => {
    if (!task) return
    try {
      const updated = await updateTask(task.id, { description: descriptionDraft.trim() })
      setTask(updated)
      setEditingDescription(false)
      setFlash('description')
      setTimeout(() => setFlash(null), 700)
    } catch {
      alert('Nie udało się zapisać opisu')
    }
  }

  async function handleAddNote() {
    if (!task || !noteText.trim() || addingNote) return
    setAddingNote(true)
    setNoteError('')
    try {
      await createTaskNote(task.id, noteText.trim())
      const updated = await fetchTaskNotes(task.id)
      setNotes(updated)
      setNoteText('')
    } catch (err: unknown) {
      setNoteError(err instanceof Error ? err.message : 'Błąd dodawania notatki')
    } finally {
      setAddingNote(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm('Czy na pewno chcesz usunąć to zadanie? Tej operacji nie można cofnąć.')) return
    try {
      await deleteTask(task.id)
      router.push('/app/tasks')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd usuwania zadania')
    }
  }

  if (loading) return <PageSkeleton />
  if (notFound) return <NotFoundState />
  if (error) return <ErrorState error={error} />
  if (!task) return null

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]))
  const program = task.programId ? programMap[task.programId] : undefined
  const typeInfo = TASK_TYPES[task.type] ?? TASK_TYPES['OTHER']
  const statusInfo = TASK_STATUSES[task.status] ?? TASK_STATUSES['todo']

  const selectStyle = (field: 'status' | 'type' | 'dueDate'): React.CSSProperties => ({
    border: flash === field ? '1px solid #10B981' : '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    background: 'white',
    color: '#111827',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    outline: 'none',
  })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/app/tasks"
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#10B981' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ← Zadania
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: '0 0 10px 0', lineHeight: 1.3 }}>
            {task.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 12, fontWeight: 500,
              background: typeInfo.bg, color: typeInfo.color,
              padding: '3px 10px', borderRadius: 10,
            }}>
              {typeInfo.label}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 500,
              background: statusInfo.bg, color: statusInfo.color,
              padding: '3px 10px', borderRadius: 10,
            }}>
              {statusInfo.label}
            </span>
            {task.clientName && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task.clientName}</span>
            )}
            {program && (
              <span style={{
                fontSize: 12, fontWeight: 500,
                background: hexToRgba(safeColor(program.color), 0.15),
                color: safeColor(program.color),
                padding: '2px 8px', borderRadius: 10,
              }}>
                {program.shortCode}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatDate(task.createdAt)}
          </span>
          <button
            onClick={handleDelete}
            style={{
              border: '1px solid #FCA5A5', color: '#EF4444', background: '#FFFFFF',
              borderRadius: 8, fontSize: 13, padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Usuń zadanie
          </button>
        </div>
      </div>

      {/* Banner — brak terminu */}
      {!task.dueDate && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
          padding: '10px 16px', fontSize: 13, color: '#92400E',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ Uzupełnij termin zadania — wymagany do zmiany statusu i typu.
        </div>
      )}

      {/* Details card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0',
        }}>
          Szczegóły
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Status</div>
            <select value={task.status} onChange={handleStatusChange} style={selectStyle('status')}>
              {Object.entries(TASK_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Typ</div>
            <select value={task.type} onChange={handleTypeChange} style={selectStyle('type')}>
              {Object.entries(TASK_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {task.clientName && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Klient</div>
              <div style={{ fontSize: 14, color: '#111827' }}>{task.clientName}</div>
            </div>
          )}

          {program && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Program</div>
              <span style={{
                fontSize: 13, fontWeight: 500,
                background: hexToRgba(safeColor(program.color), 0.15),
                color: safeColor(program.color),
                padding: '3px 10px', borderRadius: 10,
              }}>
                {program.name}
              </span>
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Termin</div>
            <input
              type="date"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              onBlur={handleDueDateChange}
              style={{
                ...selectStyle('dueDate'),
                padding: '4px 8px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        background: '#FFFFFF',
        border: flash === 'description' ? '1px solid #10B981' : '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
        transition: 'border-color 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
          }}>
            Opis
          </p>
          {!editingDescription && (
            <button
              onClick={() => setEditingDescription(true)}
              title="Edytuj opis"
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 6,
              }}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {editingDescription ? (
          <div>
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleDescriptionSave()
              }}
              autoFocus
              rows={5}
              style={{
                width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
                padding: '8px 10px', fontSize: 14, resize: 'vertical',
                outline: 'none', background: '#FFFFFF', color: '#111827',
                boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'inherit',
                transition: 'border-color 150ms',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { setDescriptionDraft(task.description ?? ''); setEditingDescription(false) }}
                style={{
                  border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                }}
              >
                Anuluj
              </button>
              <button
                onClick={handleDescriptionSave}
                style={{
                  border: 'none', background: '#10B981', color: '#FFFFFF',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Zapisz
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setEditingDescription(true)} style={{ cursor: 'text' }}>
            {task.description ? (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#111827', whiteSpace: 'pre-wrap', margin: 0 }}>
                {task.description}
              </p>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                Brak opisu — kliknij, aby dodać
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notes — Dziennik pracy */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Dziennik pracy</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({notes.length})</span>
        </div>

        <div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder="Dodaj notatkę do zadania..."
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote() }}
            style={{
              width: '100%', border: '1px solid #E5E7EB', borderRadius: 10,
              padding: '10px 12px', fontSize: 14, resize: 'vertical',
              outline: 'none', background: '#FFFFFF', color: '#111827',
              boxSizing: 'border-box', transition: 'border-color 150ms',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />
          {noteError && <p style={{ fontSize: 13, color: '#EF4444', margin: '4px 0 0 0' }}>{noteError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              style={{
                background: addingNote || !noteText.trim() ? '#6EE7B7' : '#10B981',
                color: '#FFFFFF', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: 13,
                cursor: addingNote || !noteText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {addingNote ? 'Dodawanie...' : 'Dodaj notatkę'}
            </button>
          </div>
        </div>

        {notes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            Brak notatek — dodaj pierwszą
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  background: '#FAFAFA',
                  borderLeft: '3px solid #ECFDF5',
                  borderRadius: '0 10px 10px 0',
                  padding: '12px 16px',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 6 }}>
                  {formatNoteDate(note.createdAt)}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: '#111827', whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
