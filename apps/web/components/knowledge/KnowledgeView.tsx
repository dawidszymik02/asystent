'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Trash2, Upload, X } from 'lucide-react'
import {
  fetchDocuments,
  deleteDocument,
  createDocument,
  fetchTags,
  searchTagsApi,
  createTagApi,
} from '@/hooks/useKnowledge'
import type { KnowledgeDocument, KnowledgeTag } from '@/types/knowledge'

// ── helpers ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  NOTE:       { bg: '#EFF6FF', color: '#2563EB', label: 'Notatka' },
  TRANSCRIPT: { bg: '#ECFDF5', color: '#059669', label: 'Transkrypcja' },
  PDF_TEXT:   { bg: '#FFF7ED', color: '#EA580C', label: 'Tekst PDF' },
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (d.getTime() === today.getTime())
    return `dziś ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  if (d.getTime() === yesterday.getTime()) return 'wczoraj'
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 1000,
      background: '#111827', color: '#FFFFFF',
      padding: '12px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      animation: 'toastIn 200ms ease',
    }}>
      {message}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  const cells = [120, 70, 100, 40, 80, 28]
  return (
    <tr>
      {cells.map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{
            height: 13, width: w, background: '#F3F4F6', borderRadius: 4,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  selectedTags: KnowledgeTag[]
  allTags: KnowledgeTag[]
  onAdd: (tag: KnowledgeTag) => void
  onRemove: (id: string) => void
  onCreateTag: (name: string) => Promise<KnowledgeTag>
}

function TagInput({ selectedTags, allTags, onAdd, onRemove, onCreateTag }: TagInputProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [serverExtra, setServerExtra] = useState<KnowledgeTag[]>([])
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const selectedIds = new Set(selectedTags.map(t => t.id))

  const localFiltered = allTags.filter(t =>
    !selectedIds.has(t.id) &&
    (input.trim() === '' || t.name.toLowerCase().includes(input.toLowerCase()))
  )
  const extra = serverExtra.filter(t => !selectedIds.has(t.id) && !allTags.find(a => a.id === t.id))
  const displayed = [...localFiltered, ...extra]

  const exactMatch = allTags.some(t => t.name.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim().length > 0 && !exactMatch

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!input.trim()) { setServerExtra([]); return }
    timerRef.current = setTimeout(async () => {
      try { setServerExtra(await searchTagsApi(input.trim())) } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [input])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleCreate() {
    if (!input.trim() || creating) return
    setCreating(true)
    try {
      const tag = await onCreateTag(input.trim())
      onAdd(tag)
      setInput('')
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {selectedTags.map(tag => (
            <span key={tag.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#F3F4F6', color: '#374151',
              padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            }}>
              {tag.name}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF', display: 'flex' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={input}
        placeholder={selectedTags.length > 0 ? 'Dodaj kolejny tag...' : 'Wyszukaj lub utwórz tag...'}
        onFocus={() => { setOpen(true); setFocused(true) }}
        onBlur={() => setFocused(false)}
        onChange={e => { setInput(e.target.value); setOpen(true) }}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1px solid ${focused ? '#10B981' : '#E5E7EB'}`,
          boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.08)' : 'none',
          borderRadius: 8, fontSize: 14, outline: 'none',
          boxSizing: 'border-box', background: '#FFFFFF', color: '#111827',
        }}
      />

      {open && (displayed.length > 0 || showCreate) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {displayed.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => { onAdd(tag); setInput(''); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', background: 'transparent',
                fontSize: 14, color: '#111827', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {tag.name}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', background: 'transparent',
                fontSize: 14, color: '#10B981', cursor: creating ? 'default' : 'pointer',
                fontWeight: 500, opacity: creating ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!creating) e.currentTarget.style.background = '#F0FDF4' }}
              onMouseLeave={e => { if (!creating) e.currentTarget.style.background = 'transparent' }}
            >
              {creating ? 'Tworzenie...' : `+ Utwórz tag "${input.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── DocumentRow ───────────────────────────────────────────────────────────────

function DocumentRow({ doc, onDelete }: { doc: KnowledgeDocument; onDelete: (id: string) => Promise<void> }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const badge = TYPE_BADGE[doc.type] ?? { bg: '#F3F4F6', color: '#6B7280', label: doc.type }

  async function handleDelete() {
    setDeleting(true)
    try { await onDelete(doc.id) }
    finally { setDeleting(false); setConfirm(false) }
  }

  return (
    <tr style={{ borderBottom: '1px solid #F9FAFB' }}>
      <td style={{ padding: '12px 16px', maxWidth: 220 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          display: 'inline-block',
          background: badge.bg, color: badge.color,
          padding: '3px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          {badge.label}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {doc.tags?.length > 0
            ? doc.tags.map(tag => (
                <span key={tag.id} style={{
                  display: 'inline-block',
                  background: '#F3F4F6', color: '#6B7280',
                  padding: '2px 6px', borderRadius: 6, fontSize: 11,
                }}>
                  {tag.name}
                </span>
              ))
            : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
          }
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {doc.chunkCount}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
        {formatDate(doc.createdAt)}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        {confirm ? (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: '#EF4444', color: '#FFFFFF', border: 'none',
                borderRadius: 6, padding: '4px 10px', fontSize: 12,
                cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? '...' : 'Usuń'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              style={{
                background: '#F3F4F6', color: '#6B7280', border: 'none',
                borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              }}
            >
              Anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#D1D5DB', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', marginLeft: 'auto',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </td>
    </tr>
  )
}

// ── KnowledgeView ─────────────────────────────────────────────────────────────

const BLANK_FORM = { title: '', type: 'NOTE', contentRaw: '' }

export default function KnowledgeView() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [allTags, setAllTags] = useState<KnowledgeTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const [form, setForm] = useState(BLANK_FORM)
  const [selectedTags, setSelectedTags] = useState<KnowledgeTag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [d, t] = await Promise.all([fetchDocuments(), fetchTags()])
      setDocs(d)
      setAllTags(t)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    await deleteDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Tytuł jest wymagany'); return }
    if (!form.contentRaw.trim()) { setFormError('Treść jest wymagana'); return }
    setSubmitting(true)
    setFormError('')
    try {
      await createDocument({
        title: form.title.trim(),
        type: form.type,
        contentRaw: form.contentRaw,
        tagIds: selectedTags.map(t => t.id),
      })
      setForm(BLANK_FORM)
      setSelectedTags([])
      setToast('Dokument dodany')
      await load()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Błąd dodawania dokumentu')
    } finally {
      setSubmitting(false)
    }
  }

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(prev => ({ ...prev, contentRaw: (ev.target?.result as string) ?? '' }))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleCreateTag(name: string): Promise<KnowledgeTag> {
    const tag = await createTagApi(name)
    setAllTags(prev => [...prev, tag])
    return tag
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #E5E7EB', borderRadius: 8,
    fontSize: 14, outline: 'none',
    background: '#FFFFFF', color: '#111827',
    boxSizing: 'border-box',
  }

  const label: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#374151', marginBottom: 6,
  }

  function focusOn(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = '#10B981';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'
  }
  function focusOff(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = '#E5E7EB';
    (e.target as HTMLElement).style.boxShadow = 'none'
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes toastIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ── Left: document list ───────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #F3F4F6',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Dokumenty</span>
            {!loading && docs.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                background: 'var(--accent-light)', color: 'var(--accent-text)',
                padding: '2px 8px', borderRadius: 10,
              }}>
                {docs.length}
              </span>
            )}
          </div>

          {loading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </tbody>
            </table>
          ) : error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#EF4444', fontSize: 14 }}>
              {error}
            </div>
          ) : docs.length === 0 ? (
            <div style={{
              padding: '48px 20px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <BookOpen size={40} color="#D1D5DB" />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Brak dokumentów. Dodaj pierwszy dokument.
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {[
                      { label: 'Tytuł',  align: 'left' },
                      { label: 'Typ',    align: 'left' },
                      { label: 'Tagi',   align: 'left' },
                      { label: 'Chunki', align: 'right' },
                      { label: 'Data',   align: 'left' },
                      { label: '',       align: 'right' },
                    ].map(({ label: h, align }, i) => (
                      <th key={i} style={{
                        padding: '10px 16px', fontSize: 12, fontWeight: 500,
                        color: '#6B7280', textAlign: align as 'left' | 'right', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <DocumentRow key={doc.id} doc={doc} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right: add form ───────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: 12, padding: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>
            Dodaj dokument
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={label}>Tytuł *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Nazwa dokumentu"
                style={field}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div>
              <label style={label}>Typ</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ ...field, cursor: 'pointer' }}
                onFocus={focusOn}
                onBlur={focusOff}
              >
                <option value="NOTE">Notatka</option>
                <option value="TRANSCRIPT">Transkrypcja</option>
                <option value="PDF_TEXT">Tekst PDF</option>
              </select>
            </div>

            <div>
              <label style={label}>Tagi</label>
              <TagInput
                selectedTags={selectedTags}
                allTags={allTags}
                onAdd={tag => setSelectedTags(prev =>
                  prev.find(t => t.id === tag.id) ? prev : [...prev, tag]
                )}
                onRemove={id => setSelectedTags(prev => prev.filter(t => t.id !== id))}
                onCreateTag={handleCreateTag}
              />
            </div>

            <div>
              <label style={label}>Treść *</label>
              <textarea
                value={form.contentRaw}
                onChange={e => setForm(p => ({ ...p, contentRaw: e.target.value }))}
                placeholder="Wklej tekst, notatkę lub transkrypcję..."
                style={{
                  ...field, minHeight: 300, resize: 'vertical',
                  fontFamily: 'inherit', lineHeight: 1.5,
                }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileRead}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB',
                  borderRadius: 8, padding: '8px 14px', fontSize: 13,
                  color: '#374151', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB' }}
              >
                <Upload size={15} />
                Wczytaj plik .txt lub .md
              </button>
            </div>

            {formError && (
              <div style={{
                fontSize: 13, color: '#EF4444',
                background: '#FEF2F2', padding: '10px 14px', borderRadius: 8,
              }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#A7F3D0' : 'var(--accent)',
                color: '#FFFFFF', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, fontWeight: 500,
                cursor: submitting ? 'default' : 'pointer', width: '100%',
              }}
            >
              {submitting ? 'Dodawanie...' : 'Dodaj dokument'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
