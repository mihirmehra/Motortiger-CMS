"use client"

import { useEffect, useState, useCallback } from "react"

interface Conversation {
  _id: string
  conversationId: string
  phoneNumber: string
  customerName?: string
  lastMessage?: string
  lastMessageAt?: string
  messageCount: number
  unreadCount: number
  status: "active" | "archived" | "closed"
}

export function useWhatsAppConversations(searchQuery = "") {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchQuery,
      })

      const response = await fetch(`/api/whatsapp/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      } else {
        setError("Failed to load conversations")
      }
    } catch (err) {
      setError("Error loading conversations")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    loadConversations()

    // Poll for new conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000)

    return () => clearInterval(interval)
  }, [loadConversations])

  return { conversations, loading, error, refetch: loadConversations }
}
