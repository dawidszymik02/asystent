'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { createTask, TASK_TYPES } from '@/hooks/useTasks'
import type { WorkProgram, CreateTaskPayload } from '@/types/work'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  programs: WorkProgram[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  background: '#FFFFFF',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export default function CreateTaskModal({ isOpen, onClose, onCreated, programs }: Props) {
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [programId, setProgramId] = useState('')
  const [type, setType] = useState('DEPLOYMENT')
  const [status, setStatus] = useState('todo')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [titleError, setTitleError] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => titleRef.current?.focus(), 50)
  }, [isOpen])

  function resetForm() {
    setTitle(''); setClientName(''); setProgramId(''); setType('DEPLOYMENT')
    setStatus('todo'); setDueDate(''); setDescription('')
    setError(''); setTitleError(false)
  }

  function handleClose() { resetForm(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setTitleError(true); titleRef.current?.focus(); return }
    setLoading(true)
    setError('')
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        type,
        status,
        description: description.trim() || undefined,
        clientName: clientName.trim() || undefined,
        programId: programId || undefined,
        dueDate: dueDate || undefined,
      }
      await createTask(payload)
      resetForm()
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: 16, padding: 24,
        width: 520, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Nowe zadanie</span>
          <button
            onClick={handleClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Tytuł *">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false) }}
              placeholder="Krótki opis zadania"
              style={{ ...inputStyle, borderColor: titleError ? '#EF4444' : 'var(--border)' }}
              onFocus={(e) => { e.target.style.borderColor = titleError ? '#EF4444' : 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = titleError ? '#EF4444' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <Field label="Klient">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nazwa urzędu/jednostki"
              autoComplete="off"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Typ">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              >
                {Object.entries(TASK_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              >
                <option value="todo">Do zrobienia</option>
                <option value="in_progress">W toku</option>
              </select>
            </Field>
          </div>

          <Field label="Program">
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            >
              <option value="">-- wybierz program --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Termin">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <Field label="Opis">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Szczegółowy opis..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          {error && (
            <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                border: '1px solid var(--border)', background: '#FFFFFF',
                color: 'var(--text-secondary)', borderRadius: 8,
                padding: '8px 20px', fontSize: 14, cursor: 'pointer',
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                border: 'none',
                background: loading ? '#6EE7B7' : 'var(--accent)',
                color: '#FFFFFF', borderRadius: 8,
                padding: '8px 20px', fontSize: 14, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Tworzenie...' : 'Utwórz zadanie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
