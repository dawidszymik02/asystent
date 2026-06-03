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
  description?: string
  isActive?: boolean
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

export interface WorkTask {
  id: string
  title: string
  description?: string
  type: 'DEPLOYMENT' | 'TRAINING' | 'MIGRATION' | 'UPDATE' | 'OTHER'
  clientName?: string
  programId?: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  type: string
  clientName?: string
  programId?: string
  status: string
  dueDate?: string
}
