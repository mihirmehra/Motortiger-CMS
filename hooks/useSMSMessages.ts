"use client"

import { useEffect, useState, useCallback } from "react"

interface Message {
  _id: string
  messageId: string
  senderType: "agent" | "customer"
  senderId?: { name: string; email: string }
  content: string
  mediaUrls?: Array<{
    url: string
    type: "image" | "video" | "audio" | "document"
    fileName?: string
  }>
  status: "sent" | "delivered" | "failed" | "received" | "read"
  sentAt: string
  deliveredAt?: string
  readAt?: string
}

interface UseSMSMessagesOptions {
  conversationId: string
  pollInterval?: number
}

export function useSMSMessages({ conversationId, pollInterval = 5000 }: UseSMSMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sms/conversations/${conversationId}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        setError(null)
      } else {
        setError("Failed to load messages")
      }
    } catch (err) {
      setError("Failed to load messages")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, pollInterval)
    return () => clearInterval(interval)
  }, [conversationId, pollInterval, loadMessages])

  return { messages, loading, error, refetch: loadMessages }
}
