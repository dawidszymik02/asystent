'use client'

import Topbar from '@/components/topbar/Topbar'

export default function PageLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: '#F4F5F4', minHeight: '100%' }}>
      <Topbar title={title} />
      <div className="p-6">{children}</div>
    </div>
  )
}
