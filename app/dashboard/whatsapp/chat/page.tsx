"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Plus, Send, Paperclip, Phone, Info, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useWhatsAppConversations } from "@/hooks/use-whatsapp-conversations"
import { useWhatsAppMessages } from "@/hooks/use-whatsapp-messages"

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

export default function WhatsAppChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [sending, setSending] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewChat, setShowNewChat] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { conversations, loading } = useWhatsAppConversations(searchQuery)
  const { messages, refetch: refetchMessages } = useWhatsAppMessages(selectedConversation?._id || null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles([...selectedFiles, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[]) => {
    const uploadedUrls: string[] = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const token = localStorage.getItem("token")
        const response = await fetch("/api/whatsapp/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.url)
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    return uploadedUrls
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) return
    if (!selectedConversation) return

    setSending(true)
    setUploadingFiles(true)

    try {
      let mediaUrls: string[] = []
      let mediaType: string | undefined = undefined

      if (selectedFiles.length > 0) {
        mediaUrls = await uploadFiles(selectedFiles)

        if (mediaUrls.length > 0) {
          const firstFile = selectedFiles[0]
          if (firstFile.type.startsWith("image")) mediaType = "image"
          else if (firstFile.type.startsWith("video")) mediaType = "video"
          else if (firstFile.type.startsWith("audio")) mediaType = "audio"
          else mediaType = "document"
        }
      }

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/whatsapp/conversations/${selectedConversation._id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageInput,
          mediaUrls,
          mediaType,
        }),
      })

      if (response.ok) {
        setMessageInput("")
        setSelectedFiles([])
        toast.success("Message sent")
        refetchMessages()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
      setUploadingFiles(false)
    }
  }

  const handleCreateNewChat = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/whatsapp/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: newPhoneNumber,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        handleSelectConversation(data.conversation)
        setNewPhoneNumber("")
        setShowNewChat(false)
        toast.success("Chat created")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create chat")
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      toast.error("Failed to create chat")
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">WhatsApp Chat</h1>
          </div>
          <Button onClick={() => router.push("/dashboard/whatsapp")} variant="outline">
            Back to Messages
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Search and New Chat */}
          <div className="p-4 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowNewChat(!showNewChat)} className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>

            {showNewChat && (
              <div className="space-y-2 p-2 bg-gray-50 rounded">
                <Input
                  placeholder="+1234567890"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateNewChat} className="flex-1">
                    Create
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewChat(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation?._id === conv._id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium">{conv.customerName || conv.phoneNumber}</div>
                    {conv.unreadCount > 0 && <Badge className="bg-green-600">{conv.unreadCount}</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage || "No messages"}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {selectedConversation.customerName || selectedConversation.phoneNumber}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedConversation.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.messageType === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.messageType === "outbound" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {message.mediaUrls && message.mediaUrls.length > 0 && (
                      <div className="mb-2">
                        {message.mediaType === "image" && (
                          <img
                            src={message.mediaUrls[0] || "/placeholder.svg"}
                            alt="Message media"
                            className="max-w-xs rounded max-h-64 object-cover"
                          />
                        )}
                        {message.mediaType === "video" && (
                          <video src={message.mediaUrls[0]} controls className="max-w-xs rounded max-h-64" />
                        )}
                        {message.mediaType === "audio" && (
                          <audio src={message.mediaUrls[0]} controls className="w-full" />
                        )}
                        {message.mediaType === "document" && (
                          <a
                            href={message.mediaUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 underline"
                          >
                            <Paperclip className="h-4 w-4" />
                            Document
                          </a>
                        )}
                      </div>
                    )}
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${message.messageType === "outbound" ? "text-green-100" : "text-gray-500"}`}
                    >
                      {new Date(message.sentAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4 space-y-2">
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        {file.type.startsWith("image") ? (
                          <ImageIcon className="h-6 w-6 text-gray-600" />
                        ) : (
                          <Paperclip className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFiles}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || uploadingFiles || (!messageInput.trim() && selectedFiles.length === 0)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
