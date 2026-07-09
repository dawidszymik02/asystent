export interface AgentMessageResponse {
  response: string
  conversationId: string
  sourcesUsed: string[]
}

export interface AgentConversation {
  id: string
  title: string
  createdAt: string
}
