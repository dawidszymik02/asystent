'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Headphones,
  CheckSquare,
  BookOpen,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/app/calendar',  label: 'Kalendarz',    Icon: CalendarDays },
  { href: '/app/tickets',   label: 'Zgłoszenia',   Icon: Headphones },
  { href: '/app/tasks',     label: 'Zadania',       Icon: CheckSquare },
  { href: '/app/knowledge', label: 'Baza wiedzy',  Icon: BookOpen },
  { href: '/app/settings',  label: 'Ustawienia',   Icon: Settings },
]

export default function SidebarWrapper({ userEmail }: { userEmail: string }) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const width = expanded ? 232 : 64

  return (
    <div
      style={{
        width,
        minWidth: width,
        transition: 'width 260ms ease, min-width 260ms ease',
        background: '#FAFAFA',
        borderRight: '1px solid #E5E7EB',
        color: '#111827',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          padding: expanded ? '0 12px 0 20px' : '0',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
        }}
      >
        {expanded && (
          <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 15, whiteSpace: 'nowrap' }}>
            Praca
          </span>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} color="#6B7280" />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 44,
                margin: '2px 8px',
                padding: expanded ? '0 12px 0 12px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                borderRadius: 10,
                textDecoration: 'none',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                transition: 'background 150ms, color 150ms',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon
                size={18}
                color={active ? '#10B981' : '#6B7280'}
                style={{ flexShrink: 0 }}
              />
              {expanded && (
                <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: expanded ? '12px 16px' : '12px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: expanded ? 'stretch' : 'center',
        }}
      >
        {expanded && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userEmail}
          </span>
        )}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 8,
            height: 36,
            padding: expanded ? '0 4px' : '0',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}
        >
          <LogOut size={16} color="#6B7280" />
          {expanded && <span>Wyloguj</span>}
        </button>
      </div>
    </div>
  )
}
