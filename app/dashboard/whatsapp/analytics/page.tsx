"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MessageCircle, TrendingUp, Calendar } from "lucide-react"

interface WhatsAppStats {
  total: number
  today: number
  received: number
  delivered: number
  failed: number
  deliveryRate: number
}

export default function WhatsAppAnalyticsPage() {
  const [stats, setStats] = useState<WhatsAppStats>({
    total: 0,
    today: 0,
    received: 0,
    delivered: 0,
    failed: 0,
    deliveryRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const response = await fetch(`/api/whatsapp?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const messages = data.messages

        setStats({
          total: messages.length,
          today: messages.filter((m: any) => {
            const today = new Date().toDateString()
            return new Date(m.sentAt).toDateString() === today
          }).length,
          received: messages.filter((m: any) => m.messageType === "inbound").length,
          delivered: messages.filter((m: any) => m.status === "delivered").length,
          failed: messages.filter((m: any) => m.status === "failed").length,
          deliveryRate:
            messages.length > 0
              ? Math.round((messages.filter((m: any) => m.status === "delivered").length / messages.length) * 100)
              : 0,
        })
      }
    } catch (error) {
      console.error("Failed to load WhatsApp stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WhatsApp analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
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

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Analytics</h1>
              <p className="text-gray-600">Message performance and delivery metrics</p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadStats} className="w-full">
                  Update Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-green-600">{stats.today} today</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Received</p>
                  <p className="text-2xl font-bold">{stats.received}</p>
                  <p className="text-xs text-indigo-600">Inbound messages</p>
                </div>
                <MessageCircle className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                  <p className="text-xs text-green-600">Successfully sent</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                  <p className="text-xs text-orange-600">{stats.failed} failed</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Message Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Delivered Messages</span>
                  <span className="text-green-600 font-bold">{stats.delivered}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="font-medium">Failed Messages</span>
                  <span className="text-red-600 font-bold">{stats.failed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                  <span className="font-medium">Received Messages</span>
                  <span className="text-indigo-600 font-bold">{stats.received}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.deliveryRate}%</div>
                  <div className="text-sm text-green-600">Delivery Rate</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-600">Total Messages</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
                  <div className="text-sm text-purple-600">Messages Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
