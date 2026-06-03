'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import {
  fetchAllPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  fetchAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from '@/hooks/useTickets'
import type { WorkProgram, WorkTicketStatus } from '@/types/work'

// ─── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: active ? 'var(--accent)' : '#D1D5DB',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  )
}

// ─── Modal helper ────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  width: 480,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
  color: 'var(--text-primary)',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  display: 'block',
}

// ─── Program Modal ───────────────────────────────────────────────────────────

function ProgramModal({
  isOpen,
  onClose,
  onSaved,
  program,
}: {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  program?: WorkProgram | null
}) {
  const [name, setName] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [color, setColor] = useState('#10B981')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (program) {
      setName(program.name)
      setShortCode(program.shortCode)
      setColor(program.color.startsWith('#') ? program.color : `#${program.color}`)
      setDescription(program.description ?? '')
      setIsActive(program.isActive ?? true)
    } else {
      setName('')
      setShortCode('')
      setColor('#10B981')
      setDescription('')
      setIsActive(true)
    }
    setError('')
  }, [isOpen, program])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !shortCode.trim()) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        color,
        description: description.trim() || undefined,
        isActive,
      }
      if (program) {
        await updateProgram(program.id, payload)
      } else {
        await createProgram(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {program ? 'Edytuj program' : 'Nowy program'}
          </span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nazwa *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Kod skrócony * (max 5 znaków)</label>
            <input
              style={inputStyle}
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase().slice(0, 5))}
              maxLength={5}
              required
              placeholder="np. CRM"
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kolor</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ height: 38, width: 60, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2 }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Aktywny
              </label>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Opis</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Anuluj
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Zapisywanie...' : program ? 'Zapisz' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status Modal ────────────────────────────────────────────────────────────

function StatusModal({
  isOpen,
  onClose,
  onSaved,
  status,
}: {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  status?: WorkTicketStatus | null
}) {
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [bgColor, setBgColor] = useState('#F3F4F6')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [keyError, setKeyError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (status) {
      setKey(status.key)
      setLabel(status.label)
      setColor(status.color)
      setBgColor(status.bgColor)
      setSortOrder(status.sortOrder)
      setIsActive(status.isActive)
    } else {
      setKey('')
      setLabel('')
      setColor('#6B7280')
      setBgColor('#F3F4F6')
      setSortOrder(0)
      setIsActive(true)
    }
    setKeyError('')
    setError('')
  }, [isOpen, status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function validateKey(val: string) {
    if (val && !/^[a-z_]+$/.test(val)) {
      setKeyError('Tylko małe litery i podkreślnik (np. in_progress)')
    } else {
      setKeyError('')
    }
    setKey(val)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim() || !label.trim() || keyError) return
    setSaving(true)
    setError('')
    try {
      const payload = { key: key.trim(), label: label.trim(), color, bgColor, sortOrder, isActive }
      if (status) {
        await updateStatus(status.id, payload)
      } else {
        await createStatus(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {status ? 'Edytuj status' : 'Nowy status'}
          </span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Klucz * (np. in_progress)</label>
            <input
              style={{ ...inputStyle, borderColor: keyError ? '#dc2626' : undefined }}
              value={key}
              onChange={(e) => validateKey(e.target.value.toLowerCase())}
              required
              autoFocus
              placeholder="np. in_review"
              disabled={!!status}
            />
            {keyError && <span style={{ fontSize: 12, color: '#dc2626' }}>{keyError}</span>}
          </div>
          <div>
            <label style={labelStyle}>Etykieta *</label>
            <input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="np. W recenzji" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kolor tekstu</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 38, width: 60, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
            </div>
            <div>
              <label style={labelStyle}>Kolor tła</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ height: 38, width: 60, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Kolejność</label>
              <input
                style={inputStyle}
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Podgląd:</span>
            <span style={{ background: bgColor, color, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500 }}>
              {label || 'Etykieta'}
            </span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Aktywny
          </label>
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Anuluj
            </button>
            <button type="submit" disabled={saving || !!keyError} style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !!keyError ? 0.7 : 1 }}>
              {saving ? 'Zapisywanie...' : status ? 'Zapisz' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Programs Tab ────────────────────────────────────────────────────────────

function ProgramsTab() {
  const [programs, setPrograms] = useState<WorkProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkProgram | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setPrograms(await fetchAllPrograms()) } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(p: WorkProgram) {
    try { await updateProgram(p.id, { ...p, isActive: !p.isActive }); await load() } catch (e) { console.error(e) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć program? Zgłoszenia powiązane zachowają program.')) return
    try { await deleteProgram(id); await load() } catch (e) { console.error(e) }
  }

  const btnIcon: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: 'var(--text-muted)' }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Dodaj program
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ładowanie...</p>
      ) : programs.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak programów.</p>
      ) : (
        programs.map((p) => {
          const hex = p.color.startsWith('#') ? p.color : `#${p.color}`
          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: hex, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{p.shortCode}</span>
              <Toggle active={!!p.isActive} onChange={() => handleToggle(p)} />
              <button style={btnIcon} title="Edytuj" onClick={() => { setEditing(p); setModalOpen(true) }}>
                <Pencil size={15} />
              </button>
              <button style={{ ...btnIcon, color: '#dc2626' }} title="Usuń" onClick={() => handleDelete(p.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          )
        })
      )}

      <ProgramModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={load}
        program={editing}
      />
    </>
  )
}

// ─── Statuses Tab ────────────────────────────────────────────────────────────

function StatusesTab() {
  const [statuses, setStatuses] = useState<WorkTicketStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkTicketStatus | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const s = await fetchAllStatuses()
      setStatuses([...s].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(s: WorkTicketStatus) {
    try { await updateStatus(s.id, { ...s, isActive: !s.isActive }); await load() } catch (e) { console.error(e) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć status? Zgłoszenia z tym statusem mogą wymagać ręcznej aktualizacji.')) return
    try { await deleteStatus(id); await load() } catch (e) { console.error(e) }
  }

  const btnIcon: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: 'var(--text-muted)' }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Dodaj status
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ładowanie...</p>
      ) : statuses.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak statusów.</p>
      ) : (
        statuses.map((s) => (
          <div key={s.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: s.bgColor, color: s.color, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{s.key}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>#{s.sortOrder}</span>
            <Toggle active={s.isActive} onChange={() => handleToggle(s)} />
            <button style={btnIcon} title="Edytuj" onClick={() => { setEditing(s); setModalOpen(true) }}>
              <Pencil size={15} />
            </button>
            <button style={{ ...btnIcon, color: '#dc2626' }} title="Usuń" onClick={() => handleDelete(s.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Statusy są używane w zgłoszeniach. Zmiana etykiety jest widoczna od razu.
      </p>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={load}
        status={editing}
      />
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = 'programs' | 'statuses'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('programs')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'programs', label: 'Programy' },
    { key: 'statuses', label: 'Statusy zgłoszeń' },
  ]

  return (
    <PageLayout title="Ustawienia">
      {/* Zakładki */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(({ key, label }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: active ? 'var(--accent-light)' : '#fff',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {activeTab === 'programs' && <ProgramsTab />}
      {activeTab === 'statuses' && <StatusesTab />}
    </PageLayout>
  )
}
