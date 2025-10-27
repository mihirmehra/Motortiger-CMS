"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import SMSChatWindow from "@/components/ui/sms-chat-window"
import SMSConversationList from "@/components/ui/sms-conversation-list"
import { MessageSquare, Plus, Phone } from "lucide-react"
import { toast } from "sonner"

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

export default function SMSChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [newCustomerName, setNewCustomerName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const router = useRouter()

  const handleCreateConversation = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    setIsCreating(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/sms/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: newPhoneNumber,
          customerName: newCustomerName || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
        setNewPhoneNumber("")
        setNewCustomerName("")
        setShowNewDialog(false)
        toast.success("Conversation created")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create conversation")
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to create conversation")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-8 w-8" />
                SMS Chat
              </h1>
              <p className="text-gray-600">Conversational SMS messaging with file sharing</p>
            </div>

            <div className="flex gap-3">
              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Customer Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateConversation} disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => router.push("/dashboard/phone")}>
                <Phone className="h-4 w-4 mr-2" />
                Phone System
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <SMSConversationList
              onSelectConversation={setSelectedConversation}
              onNewConversation={() => setShowNewDialog(true)}
              selectedId={selectedConversation?._id}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <SMSChatWindow
                conversation={selectedConversation}
                onClose={() => setSelectedConversation(null)}
                onUpdate={() => {
                  // Refresh conversation list
                }}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No conversation selected</p>
                  <p className="text-sm text-gray-500">Select a conversation from the list or create a new one</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
