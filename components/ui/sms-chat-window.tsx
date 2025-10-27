"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, FileText, X, AlertCircle, CheckCheck, Check, Clock } from "lucide-react"
import { toast } from "sonner"

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
  notes?: string
}

interface SMSChatWindowProps {
  conversation: Conversation
  onClose?: () => void
  onUpdate?: () => void
}

export default function SMSChatWindow({ conversation, onClose, onUpdate }: SMSChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastMessageCountRef = useRef(0)

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [conversation._id])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sms/conversations/${conversation._id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.messages.length !== lastMessageCountRef.current) {
          console.log("[v0] New messages detected:", data.messages.length, "previous:", lastMessageCountRef.current)
          lastMessageCountRef.current = data.messages.length
        }
        setMessages(data.messages)
      } else {
        console.error("[v0] Failed to load messages:", response.status)
      }
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file sizes (max 5MB per file)
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    setPreviewFiles(validFiles)

    // In a real app, you'd upload to a storage service here
    // For now, we'll use placeholder URLs
    const urls = validFiles.map((file) => URL.createObjectURL(file))
    setMediaUrls(urls)
  }

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error("Please enter a message or attach media")
      return
    }

    setSending(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sms/conversations/${conversation._id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          mediaUrls: mediaUrls,
        }),
      })

      if (response.ok) {
        setContent("")
        setMediaUrls([])
        setPreviewFiles([])
        toast.success("Message sent")
        await loadMessages()
        onUpdate?.()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-600" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const renderMedia = (media: Message["mediaUrls"]) => {
    if (!media || media.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {media.map((item, idx) => (
          <div key={idx} className="relative group">
            {item.type === "image" && (
              <img
                src={item.url || "/placeholder.svg"}
                alt={item.fileName || "Image"}
                className="max-w-xs max-h-64 rounded-lg"
              />
            )}
            {item.type === "video" && <video src={item.url} controls className="max-w-xs max-h-64 rounded-lg" />}
            {item.type === "audio" && <audio src={item.url} controls className="max-w-xs" />}
            {item.type === "document" && (
              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <a href={item.url} download={item.fileName} className="text-blue-600 hover:underline text-sm">
                  {item.fileName || "Download"}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{conversation.customerName || conversation.phoneNumber}</CardTitle>
            <p className="text-sm text-gray-600 font-mono">{conversation.phoneNumber}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {conversation.notes && <p className="text-sm text-gray-600 mt-2 italic">Note: {conversation.notes}</p>}
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.senderType === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === "agent"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {message.content && <p className="text-sm break-words">{message.content}</p>}
                  {renderMedia(message.mediaUrls)}
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs ${
                      message.senderType === "agent" ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    <span>
                      {new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.senderType === "agent" && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Media Preview */}
      {previewFiles.length > 0 && (
        <div className="border-t p-3 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {previewFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <button
                  onClick={() => removeMedia(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <CardContent className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            onClick={sendMessage}
            disabled={sending || (!content.trim() && mediaUrls.length === 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">Shift + Enter for new line, Enter to send</p>
      </CardContent>
    </Card>
  )
}
