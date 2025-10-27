import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMS from "@/models/SMS"
import SMSMessage from "@/models/SMSMessage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const messageSid = body.get("MessageSid") as string
    const messageStatus = body.get("MessageStatus") as string
    const errorCode = body.get("ErrorCode") as string
    const errorMessage = body.get("ErrorMessage") as string

    await connectDB()

    // Find SMS by Twilio message SID
    const sms = await SMS.findOne({ twilioMessageSid: messageSid })
    if (!sms) {
      console.error("SMS not found for SID:", messageSid)
      return NextResponse.json({ message: "SMS not found" }, { status: 404 })
    }

    // Update SMS status
    sms.status = messageStatus
    sms.twilioStatus = messageStatus

    if (messageStatus === "delivered") {
      sms.deliveredAt = new Date()
    }

    if (errorCode) {
      sms.twilioErrorCode = errorCode
      sms.twilioErrorMessage = errorMessage
      sms.failureReason = errorMessage
    }

    await sms.save()

    const message = await SMSMessage.findOne({ twilioMessageSid: messageSid })
    if (message) {
      message.status = messageStatus
      if (messageStatus === "delivered") {
        message.deliveredAt = new Date()
      }
      if (errorCode) {
        message.failureReason = errorMessage
      }
      await message.save()
    }

    console.log("SMS status updated:", { messageSid, messageStatus })

    return NextResponse.json({ message: "Status updated successfully" })
  } catch (error) {
    console.error("SMS status webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
