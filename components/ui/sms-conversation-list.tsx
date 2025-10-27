"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, MessageSquare } from "lucide-react"

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

interface SMSConversationListProps {
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation?: () => void
  selectedId?: string
}

export default function SMSConversationList({
  onSelectConversation,
  onNewConversation,
  selectedId,
}: SMSConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"active" | "archived" | "closed">("active")

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 3000)
    return () => clearInterval(interval)
  }, [search, status])

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        limit: "50",
        status,
        ...(search && { search }),
      })

      const response = await fetch(`/api/sms/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
        console.log("[v0] Loaded conversations:", data.conversations.length)
      }
    } catch (error) {
      console.error("[v0] Failed to load conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button size="sm" onClick={onNewConversation} className="gap-1">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(["active", "archived", "closed"] as const).map((s) => (
              <Button
                key={s}
                variant={status === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(s)}
                className="flex-1 capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === conv._id ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.customerName || conv.phoneNumber}</p>
                    <p className="text-xs text-gray-600 font-mono">{conv.phoneNumber}</p>
                  </div>
                  {conv.unreadCount > 0 && <Badge className="ml-2 bg-red-500">{conv.unreadCount}</Badge>}
                </div>

                <p className="text-xs text-gray-600 truncate mb-2">{conv.lastMessage || "No messages yet"}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : "Never"}
                  </span>
                  <span className="text-xs text-gray-500">{conv.messageCount} messages</span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
