export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface WorkTicket {
  id: string
  title: string
  description?: string
  clientName?: string
  programId?: string
  status: string
  priority: string
  sourceRef?: string
  createdAt: string
  updatedAt: string
}

export interface WorkProgram {
  id: string
  name: string
  shortCode: string
  color: string
}

export interface CreateTicketPayload {
  title: string
  description?: string
  clientName?: string
  programId?: string
  status: string
  priority: string
  sourceRef?: string
}

export interface WorkTicketNote {
  id: string
  ticketId: string
  userId: string
  content: string
  createdAt: string
}

export interface WorkTicketStatus {
  id: string
  key: string
  label: string
  color: string
  bgColor: string
  sortOrder: number
  isActive: boolean
}
