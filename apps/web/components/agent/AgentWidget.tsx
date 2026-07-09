'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, X, Clock, Send, Trash2, Plus } from 'lucide-react'
import { sendMessage, getConversations, deleteConversation } from '@/hooks/useAgent'
import type { AgentConversation } from '@/types/agent'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sourcesUsed?: string[]
}

const MAX_TEXTAREA_HEIGHT = 120

// Escape user-facing text before applying the whitelisted **bold**/newline substitutions,
// otherwise assistant output containing HTML would be injected via dangerouslySetInnerHTML.
function renderMarkdownLite(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  return withBold.replace(/\n/g, '<br/>')
}

function formatConversationDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--text-muted)',
            display: 'inline-block',
            animation: 'agent-dot-bounce 1.2s infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread] = useState(false)

  const [conversations, setConversations] = useState<AgentConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationsError, setConversationsError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!showHistory) return
    let cancelled = false
    setConversationsLoading(true)
    setConversationsError('')
    getConversations()
      .then((data) => { if (!cancelled) setConversations(data) })
      .catch((err) => { if (!cancelled) setConversationsError(err instanceof Error ? err.message : 'Nieznany błąd') })
      .finally(() => { if (!cancelled) setConversationsLoading(false) })
    return () => { cancelled = true }
  }, [showHistory])

  function resetTextareaHeight() {
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    resetTextareaHeight()
    setLoading(true)

    try {
      const res = await sendMessage(text, conversationId)
      setConversationId(res.conversationId)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response, sourcesUsed: res.sourcesUsed }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      setMessages((prev) => [...prev, { role: 'assistant', content: `Wystąpił błąd: ${message}`, sourcesUsed: [] }])
    } finally {
      setLoading(false)
    }
  }

  function handleNewConversation() {
    setConversationId(undefined)
    setMessages([])
    setShowHistory(false)
  }

  function handleSelectConversation(id: string) {
    setConversationId(id)
    setMessages([])
    setShowHistory(false)
  }

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) {
        setConversationId(undefined)
        setMessages([])
      }
    } catch (err) {
      setConversationsError(err instanceof Error ? err.message : 'Nieznany błąd')
    }
  }

  const panelBottom = 24 + 56 + 12

  return (
    <>
      <style>{`
        @keyframes agent-dot-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>

      {isOpen && showHistory && (
        <div
          style={{
            position: 'fixed',
            bottom: panelBottom,
            right: 24 + 380 + 12,
            width: 260,
            height: 560,
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)' }}>
            <button
              onClick={handleNewConversation}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                border: 'none',
                background: 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              Nowa rozmowa
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {conversationsLoading && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>Ładowanie...</p>
            )}
            {conversationsError && (
              <p style={{ fontSize: 13, color: '#EF4444', padding: 8 }}>{conversationsError}</p>
            )}
            {!conversationsLoading && conversations.length === 0 && !conversationsError && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>Brak konwersacji</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: conversationId === c.id ? 'var(--accent-light)' : 'transparent',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {c.title || 'Bez tytułu'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {formatConversationDate(c.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: panelBottom,
            right: 24,
            width: 380,
            height: 560,
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="var(--accent)" />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Asystent AI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setShowHistory((v) => !v)}
                title="Historia konwersacji"
                style={{
                  border: 'none',
                  background: showHistory ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  color: showHistory ? 'var(--accent-text)' : 'var(--text-secondary)',
                  display: 'flex',
                }}
              >
                <Clock size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, color: 'var(--text-secondary)', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
                Zapytaj o zadania, wydarzenia, zgłoszenia lub bazę wiedzy.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  maxWidth: '85%',
                  marginLeft: m.role === 'user' ? 'auto' : 0,
                  marginRight: m.role === 'user' ? 0 : 'auto',
                }}
              >
                <div
                  style={{
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--border-light)',
                    color: m.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.content) }}
                />
                {m.role === 'assistant' && m.sourcesUsed && m.sourcesUsed.length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 2px 0' }}>
                    Źródła: {m.sourcesUsed.join(', ')}
                  </p>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ marginRight: 'auto' }}>
                <div style={{ background: 'var(--border-light)', borderRadius: '12px 12px 12px 4px', display: 'inline-block' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid var(--border-light)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Napisz wiadomość..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                maxHeight: MAX_TEXTAREA_HEIGHT,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                border: 'none',
                background: loading || !input.trim() ? '#6EE7B7' : 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--accent)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
          zIndex: 1000,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {hasUnread && !isOpen && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#EF4444',
              border: '2px solid #FFFFFF',
            }}
          />
        )}
      </button>
    </>
  )
}
