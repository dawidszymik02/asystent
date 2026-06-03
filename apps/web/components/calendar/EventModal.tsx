'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  createEvent,
  updateEvent,
  type CalendarEvent,
  type CalendarCategory,
  type CreateEventPayload,
} from '@/hooks/useCalendar'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  event?: CalendarEvent | null
  categories: CalendarCategory[]
}

function timeFromISO(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().slice(11, 16)
}

function dateFromISO(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export default function EventModal({ isOpen, onClose, onSaved, event, categories }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [timeFrom, setTimeFrom] = useState('09:00')
  const [timeTo, setTimeTo] = useState('10:00')
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [color, setColor] = useState('#10B981')
  const [reminder, setReminder] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (event) {
      setTitle(event.title)
      setDescription(event.description ?? '')
      setDate(dateFromISO(event.startTime))
      setTimeFrom(timeFromISO(event.startTime))
      setTimeTo(timeFromISO(event.endTime))
      setAllDay(event.isAllDay ?? false)
      setLocation(event.location ?? '')
      setCategoryId(event.categoryId ?? '')
      setColor(event.color ?? '#10B981')
      setReminder(event.reminderMinutes != null ? String(event.reminderMinutes) : '')
    } else {
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().slice(0, 10))
      setTimeFrom('09:00')
      setTimeTo('10:00')
      setAllDay(false)
      setLocation('')
      setCategoryId('')
      setColor('#10B981')
      setReminder('')
    }
    setError('')
  }, [isOpen, event])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setSaving(true)
    setError('')
    try {
      const payload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: allDay ? `${date}T00:00:00Z` : `${date}T${timeFrom}:00Z`,
        endTime: allDay ? `${date}T23:59:59Z` : `${date}T${timeTo}:00Z`,
        isAllDay: allDay,
        location: location.trim() || undefined,
        categoryId: categoryId || undefined,
        color,
        reminderMinutes: reminder ? Number(reminder) : undefined,
      }
      if (event) {
        await updateEvent(event.id, payload)
      } else {
        await createEvent(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: 540,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {event ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
          </span>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tytuł */}
          <div>
            <label style={labelStyle}>Tytuł *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nazwa wydarzenia"
              required
            />
          </div>

          {/* Opis */}
          <div>
            <label style={labelStyle}>Opis</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcjonalny opis"
              rows={2}
            />
          </div>

          {/* Data */}
          <div>
            <label style={labelStyle}>Data *</label>
            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Cały dzień */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            Cały dzień
          </label>

          {/* Godziny */}
          {!allDay && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Godzina od</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Godzina do</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Lokalizacja */}
          <div>
            <label style={labelStyle}>Lokalizacja</label>
            <input
              style={inputStyle}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Adres lub nazwa miejsca"
            />
          </div>

          {/* Kategoria */}
          <div>
            <label style={labelStyle}>Kategoria</label>
            <select
              style={inputStyle}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">-- brak kategorii --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kolor + przypomnienie */}
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
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Przypomnienie</label>
              <select
                style={inputStyle}
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              >
                <option value="">brak</option>
                <option value="5">5 minut</option>
                <option value="10">10 minut</option>
                <option value="15">15 minut</option>
                <option value="30">30 minut</option>
                <option value="60">1 godzina</option>
              </select>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
          )}

          {/* Akcje */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: '#fff',
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Zapisywanie...' : event ? 'Zapisz' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
