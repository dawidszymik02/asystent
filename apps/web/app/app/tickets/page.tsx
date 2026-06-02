'use client'

import PageLayout from '@/components/layout/PageLayout'
import TicketList from '@/components/tickets/TicketList'

export default function TicketsPage() {
  return (
    <PageLayout title="Zgłoszenia">
      <TicketList />
    </PageLayout>
  )
}
