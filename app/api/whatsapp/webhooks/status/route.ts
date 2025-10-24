import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsApp from "@/models/WhatsApp"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const messageSid = body.get("MessageSid") as string
    const messageStatus = body.get("MessageStatus") as string
    const errorCode = body.get("ErrorCode") as string
    const errorMessage = body.get("ErrorMessage") as string

    console.log("[v0] WhatsApp webhook received:", { messageSid, messageStatus, errorCode })

    if (!messageSid) {
      console.error("No MessageSid in webhook")
      return NextResponse.json({ error: "MessageSid is required" }, { status: 400 })
    }

    await connectDB()

    const whatsapp = await WhatsApp.findOne({ twilioMessageSid: messageSid })
    if (!whatsapp) {
      console.warn("[v0] WhatsApp message not found for SID:", messageSid)
      // Still return 200 to acknowledge receipt from Twilio
      return NextResponse.json({ message: "Message acknowledged" }, { status: 200 })
    }

    const statusMap: { [key: string]: string } = {
      queued: "queued",
      sent: "sent",
      delivered: "delivered",
      read: "read",
      failed: "failed",
      undelivered: "failed",
    }

    const mappedStatus = statusMap[messageStatus] || messageStatus

    whatsapp.status = mappedStatus
    whatsapp.twilioStatus = messageStatus

    if (messageStatus === "delivered") {
      whatsapp.deliveredAt = new Date()
    }

    if (messageStatus === "read") {
      whatsapp.readAt = new Date()
    }

    if (errorCode) {
      whatsapp.twilioErrorCode = errorCode
      whatsapp.twilioErrorMessage = errorMessage
      whatsapp.failureReason = errorMessage
    }

    await whatsapp.save()

    console.log("[v0] WhatsApp status updated:", { messageSid, messageStatus, mappedStatus })

    return NextResponse.json({ message: "Status updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] WhatsApp status webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
