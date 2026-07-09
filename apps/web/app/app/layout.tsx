import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarWrapper from '@/components/sidebar/SidebarWrapper'
import AgentWidget from '@/components/agent/AgentWidget'

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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarWrapper userEmail={user.email ?? ''} />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-page)' }}>
        {children}
      </main>
      <AgentWidget />
    </div>
  )
}
