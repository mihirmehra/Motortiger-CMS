"use client"

import { useEffect, useState, useCallback } from "react"

interface Message {
  _id: string
  whatsappId: string
  messageType: "inbound" | "outbound"
  fromNumber: string
  toNumber: string
  content: string
  status: string
  sentAt: string
  mediaUrls?: string[]
  mediaType?: string
}

export function useWhatsAppMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      } else {
        setError("Failed to load messages")
      }
    } catch (err) {
      setError("Error loading messages")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)

    return () => clearInterval(interval)
  }, [loadMessages])

  return { messages, loading, error, refetch: loadMessages }
}
