'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Calendar } from 'lucide-react'
import { fetchTasks, TASK_TYPES, TASK_STATUSES } from '@/hooks/useTasks'
import { fetchPrograms } from '@/hooks/useTickets'
import type { WorkTask, WorkProgram } from '@/types/work'
import CreateTaskModal from './CreateTaskModal'

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function parseDueDate(iso: string): Date {
  // yyyy-mm-dd or full ISO
  if (iso.length === 10) {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(iso)
}

function dueDateColor(dueDate: string, status: string): string {
  if (status === 'done' || status === 'cancelled') return 'var(--text-muted)'
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const due = parseDueDate(dueDate)
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  if (dueMidnight < todayMidnight) return '#EF4444'
  if (dueMidnight.getTime() === todayMidnight.getTime()) return '#F59E0B'
  return 'var(--text-muted)'
}

function formatDueDate(iso: string): string {
  const due = parseDueDate(iso)
  return `${due.getDate().toString().padStart(2, '0')}.${(due.getMonth() + 1).toString().padStart(2, '0')}.${due.getFullYear()}`
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all',        label: 'Wszystkie' },
  { key: 'todo',       label: 'Do zrobienia' },
  { key: 'in_progress', label: 'W toku' },
  { key: 'done',       label: 'Gotowe' },
  { key: 'cancelled',  label: 'Anulowane' },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: '14px 16px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 60, height: 22, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, borderRadius: 4, background: '#F3F4F6', width: '55%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 12, borderRadius: 4, background: '#F3F4F6', width: '30%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ width: 70, height: 22, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
    </div>
  )
}

function TaskRow({ task, program }: { task: WorkTask; program?: WorkProgram }) {
  const [hovered, setHovered] = useState(false)
  const typeInfo = TASK_TYPES[task.type] ?? TASK_TYPES['OTHER']
  const statusInfo = TASK_STATUSES[task.status] ?? TASK_STATUSES['todo']

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? 'var(--accent)' : '#E5E7EB'}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 8,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: 'pointer',
        transition: 'border-color 150ms, box-shadow 150ms',
        boxShadow: hovered ? '0 2px 8px rgba(16,185,129,0.08)' : 'none',
      }}
    >
      {/* Badge typu */}
      <span style={{
        fontSize: 11, fontWeight: 500,
        background: typeInfo.bg,
        color: typeInfo.color,
        padding: '3px 10px', borderRadius: 10,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {typeInfo.label}
      </span>

      {/* Treść */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {task.clientName && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{task.clientName}</span>
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
          {task.dueDate && (
            <span style={{ fontSize: 12, color: dueDateColor(task.dueDate, task.status), display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={12} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <span style={{
        fontSize: 11, fontWeight: 500,
        background: statusInfo.bg,
        color: statusInfo.color,
        padding: '3px 10px', borderRadius: 10,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {statusInfo.label}
      </span>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function TaskList() {
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [programs, setPrograms] = useState<WorkProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [t, p] = await Promise.all([fetchTasks(), fetchPrograms()])
      setTasks(t)
      setPrograms(p)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]))

  const filtered = activeFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeFilter)

  const activeCount = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Zadania</span>
          {!loading && activeCount > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              background: 'var(--accent-light)', color: 'var(--accent-text)',
              padding: '2px 8px', borderRadius: 10,
            }}>
              {activeCount} aktywnych
            </span>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: 'var(--accent)', color: '#FFFFFF', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + Nowe zadanie
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map(({ key, label }) => {
          const active = activeFilter === key
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                background: active ? 'var(--accent-light)' : '#FFFFFF',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20, padding: '4px 14px', fontSize: 13,
                cursor: 'pointer', fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
      ) : error ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#EF4444', fontSize: 14 }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ClipboardList size={40} color="#D1D5DB" />
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {activeFilter === 'all' ? 'Brak zadań' : 'Brak zadań w tej kategorii'}
          </span>
        </div>
      ) : (
        filtered.map((task) => (
          <Link
            key={task.id}
            href={`/app/tasks/${task.id}`}
            style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
          >
            <TaskRow
              task={task}
              program={task.programId ? programMap[task.programId] : undefined}
            />
          </Link>
        ))
      )}

      <CreateTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
        programs={programs}
      />
    </>
  )
}
