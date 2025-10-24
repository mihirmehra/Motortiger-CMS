"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, Settings, BarChart3, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import WhatsAppComposer from "@/components/ui/whatsapp-composer"

interface WhatsAppMessage {
  _id: string
  whatsappId: string
  messageType: "inbound" | "outbound"
  fromNumber: string
  toNumber: string
  content: string
  status: string
  sentAt: string
  deliveredAt?: string
  readAt?: string
  customerName?: string
  mediaUrls?: string[]
  mediaType?: string
  isRead: boolean
}

interface WhatsAppStats {
  total: number
  today: number
  received: number
  delivered: number
  failed: number
  deliveryRate: number
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [stats, setStats] = useState<WhatsAppStats>({
    total: 0,
    today: 0,
    received: 0,
    delivered: 0,
    failed: 0,
    deliveryRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [recipient, setRecipient] = useState("")
  const [content, setContent] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    loadMessages()
    loadStats()
  }, [page, activeTab, searchQuery])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        search: searchQuery,
        ...(activeTab !== "all" && { messageType: activeTab }),
      })

      const response = await fetch(`/api/whatsapp?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error("Failed to load WhatsApp messages:", error)
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/calls/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Calculate WhatsApp stats from messages
        setStats({
          total: messages.length,
          today: messages.filter((m) => {
            const today = new Date().toDateString()
            return new Date(m.sentAt).toDateString() === today
          }).length,
          received: messages.filter((m) => m.messageType === "inbound").length,
          delivered: messages.filter((m) => m.status === "delivered").length,
          failed: messages.filter((m) => m.status === "failed").length,
          deliveryRate:
            messages.length > 0
              ? Math.round((messages.filter((m) => m.status === "delivered").length / messages.length) * 100)
              : 0,
        })
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!recipient.trim() || !content.trim()) {
      toast.error("Please enter recipient and message")
      return
    }

    setSending(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumber: recipient,
          content,
        }),
      })

      if (response.ok) {
        toast.success("WhatsApp message sent successfully")
        setRecipient("")
        setContent("")
        loadMessages()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case "read":
        return <Badge className="bg-purple-100 text-purple-800">Read</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "received":
        return <Badge className="bg-indigo-100 text-indigo-800">Received</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "read":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-8 w-8 text-green-600" />
                WhatsApp Messaging
              </h1>
              <p className="text-gray-600">Send and receive WhatsApp messages</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/whatsapp/settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/whatsapp/analytics")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Received</p>
                  <p className="text-2xl font-bold">{stats.received}</p>
                </div>
                <Phone className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="inbound">Received</TabsTrigger>
            <TabsTrigger value="outbound">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Composer */}
            <WhatsAppComposer
              recipient={recipient}
              content={content}
              onRecipientChange={setRecipient}
              onContentChange={setContent}
              onSend={handleSendMessage}
              sending={sending}
            />

            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by phone number, name, or message..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div key={message._id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {message.messageType === "inbound" ? message.fromNumber : message.toNumber}
                              </span>
                              {message.customerName && (
                                <span className="text-sm text-gray-500">({message.customerName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(message.status)}
                              {getStatusBadge(message.status)}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{message.content}</p>
                          {message.mediaUrls && message.mediaUrls.length > 0 && (
                            <div className="mb-2 text-sm text-gray-500">
                              📎 {message.mediaType || "Media"} ({message.mediaUrls.length})
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{new Date(message.sentAt).toLocaleString()}</span>
                            <span className="text-gray-400">•</span>
                            <span>{message.whatsappId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
