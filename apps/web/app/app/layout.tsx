import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'

const navLinks = [
  { href: '/app/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/app/tickets', label: 'Zgłoszenia', icon: '◈' },
  { href: '/app/tasks', label: 'Zadania', icon: '◻' },
  { href: '/app/settings', label: 'Ustawienia', icon: '⚙' },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex flex-col w-60 shrink-0 bg-zinc-900 border-r border-zinc-800">
        <div className="px-5 py-5 border-b border-zinc-800">
          <span className="text-base font-semibold tracking-tight">Asystent</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <span className="text-base leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
