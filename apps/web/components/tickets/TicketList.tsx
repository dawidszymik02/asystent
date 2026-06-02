'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { fetchTickets, fetchPrograms, fetchStatuses } from '@/hooks/useTickets'
import type { WorkTicket, WorkProgram, WorkTicketStatus } from '@/types/work'
import CreateTicketModal from './CreateTicketModal'

// ─── helpers ────────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  low: '#D1D5DB', medium: '#F59E0B', high: '#F97316', critical: '#EF4444',
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: '#F3F4F6', color: '#6B7280',  label: 'nowe' },
  open:     { bg: '#EFF6FF', color: '#2563EB',  label: 'otwarte' },
  pending:  { bg: '#FFFBEB', color: '#D97706',  label: 'oczekujące' },
  call:     { bg: '#F5F3FF', color: '#7C3AED',  label: 'do zadzwonienia' },
  analysis: { bg: '#ECFEFF', color: '#0891B2',  label: 'do analizy' },
  deferred: { bg: '#F9FAFB', color: '#9CA3AF',  label: 'odłożone' },
  resolved: { bg: '#ECFDF5', color: '#059669',  label: 'rozwiązane' },
  closed:   { bg: '#F3F4F6', color: '#374151',  label: 'zamknięte' },
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all',      label: 'Wszystkie' },
  { key: 'new',      label: 'Nowe' },
  { key: 'open',     label: 'Otwarte' },
  { key: 'pending',  label: 'Oczekujące' },
  { key: 'resolved', label: 'Rozwiązane' },
  { key: 'closed',   label: 'Zamknięte' },
]

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

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '14px 16px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E5E7EB', marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, borderRadius: 4, background: '#F3F4F6', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 12, borderRadius: 4, background: '#F3F4F6', width: '35%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ height: 20, width: 64, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 11, width: 48, borderRadius: 4, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

function TicketRow({ ticket, program }: { ticket: WorkTicket; program?: WorkProgram }) {
  const [hovered, setHovered] = useState(false)
  const badge = STATUS_BADGE[ticket.status] ?? STATUS_BADGE['new']

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
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: PRIORITY_DOT[ticket.priority] ?? '#D1D5DB',
        marginTop: 6, flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ticket.title}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {ticket.clientName && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket.clientName}</span>
          )}
          {program && (
            <span style={{
              fontSize: 12,
              background: hexToRgba(program.color.startsWith('#') ? program.color : `#${program.color}`, 0.15),
              color: program.color.startsWith('#') ? program.color : `#${program.color}`,
              padding: '2px 8px', borderRadius: 10, fontWeight: 500,
            }}>
              {program.shortCode}
            </span>
          )}
          {ticket.sourceRef && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ticket.sourceRef}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 500,
          background: badge.bg, color: badge.color,
          padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap',
        }}>
          {badge.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(ticket.createdAt)}
        </span>
      </div>
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function TicketList() {
  const [tickets, setTickets] = useState<WorkTicket[]>([])
  const [programs, setPrograms] = useState<WorkProgram[]>([])
  const [statuses, setStatuses] = useState<WorkTicketStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [t, p, s] = await Promise.all([fetchTickets(), fetchPrograms(), fetchStatuses()])
      setTickets(t)
      setPrograms(p)
      setStatuses(s)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]))

  const filtered = activeFilter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === activeFilter)

  const activeCount = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Zgłoszenia</span>
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
          + Nowe zgłoszenie
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
          <Inbox size={40} color="#D1D5DB" />
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {activeFilter === 'all' ? 'Brak zgłoszeń' : 'Brak zgłoszeń w tej kategorii'}
          </span>
        </div>
      ) : (
        filtered.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/app/tickets/${ticket.id}`}
            style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
          >
            <TicketRow
              ticket={ticket}
              program={ticket.programId ? programMap[ticket.programId] : undefined}
            />
          </Link>
        ))
      )}

      <CreateTicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
        programs={programs}
        statuses={statuses}
      />
    </>
  )
}
