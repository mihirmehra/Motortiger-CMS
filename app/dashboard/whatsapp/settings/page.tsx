"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, TestTube, MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface WhatsAppSettings {
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  whatsappAutoReply: boolean
  whatsappAutoReplyMessage: string
}

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    whatsappAutoReply: false,
    whatsappAutoReplyMessage: "Thank you for your message. We will respond shortly.",
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const router = useRouter()

  useEffect(() => {
    loadSettings()
    testConnection()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/phone/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({
          ...prev,
          twilioAccountSid: data.settings.twilioAccountSid || "",
          twilioAuthToken: data.settings.twilioAuthToken || "",
          twilioPhoneNumber: data.settings.twilioPhoneNumber || "",
        }))
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/phone/test-twilio", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConnectionStatus(response.ok ? "connected" : "error")
    } catch {
      setConnectionStatus("error")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/phone/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
        testConnection()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/whatsapp")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to WhatsApp
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Settings</h1>
          <p className="text-gray-600">Configure your Twilio WhatsApp integration</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Connection Status
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={testing}
                className="flex items-center gap-2 bg-transparent"
              >
                <TestTube className="h-4 w-4" />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Twilio WhatsApp</p>
                  <p className="text-sm text-gray-500">WhatsApp messaging service</p>
                </div>
              </div>
              {getStatusBadge(connectionStatus)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Twilio WhatsApp Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Twilio WhatsApp Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twilioAccountSid">Account SID</Label>
                  <Input
                    id="twilioAccountSid"
                    name="twilioAccountSid"
                    value={settings.twilioAccountSid}
                    onChange={handleChange}
                    placeholder="Your Twilio Account SID"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="twilioAuthToken">Auth Token</Label>
                  <Input
                    id="twilioAuthToken"
                    name="twilioAuthToken"
                    type="password"
                    value={settings.twilioAuthToken}
                    onChange={handleChange}
                    placeholder="Your Twilio Auth Token"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="twilioPhoneNumber">WhatsApp Phone Number</Label>
                  <Input
                    id="twilioPhoneNumber"
                    name="twilioPhoneNumber"
                    value={settings.twilioPhoneNumber}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your Twilio WhatsApp-enabled phone number</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Webhook URLs:</strong> Configure these in your Twilio console:
                </p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1">
                  <li>
                    <strong>Incoming:</strong> https://motortiger-cms.vercel.app/api/whatsapp/webhooks/incoming
                  </li>
                  <li>
                    <strong>Status:</strong> https://motortiger-cms.vercel.app/api/whatsapp/webhooks/status
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Settings */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="whatsappAutoReply"
                  name="whatsappAutoReply"
                  checked={settings.whatsappAutoReply}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="whatsappAutoReply">Enable auto-reply for incoming WhatsApp messages</Label>
              </div>

              {settings.whatsappAutoReply && (
                <div>
                  <Label htmlFor="whatsappAutoReplyMessage">Auto-reply Message</Label>
                  <textarea
                    id="whatsappAutoReplyMessage"
                    name="whatsappAutoReplyMessage"
                    value={settings.whatsappAutoReplyMessage}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1024}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.whatsappAutoReplyMessage.length}/1024 characters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
