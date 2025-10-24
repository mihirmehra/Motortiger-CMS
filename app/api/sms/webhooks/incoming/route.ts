import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMS from "@/models/SMS"
import Lead from "@/models/Lead"
import { generateUniqueId } from "@/utils/idGenerator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()

    // Enhanced logging for debugging
    const payload = Object.fromEntries(body.entries())
    console.log("[v0] Received SMS webhook payload:", JSON.stringify(payload, null, 2))

    // Validate required fields
    const requiredFields = ["MessageSid", "From", "To", "Body"]
    const missingFields = requiredFields.filter((field) => !body.get(field))

    if (missingFields.length > 0) {
      console.error("[v0] Missing required fields:", missingFields)
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    const messageSid = body.get("MessageSid") as string
    const from = body.get("From") as string
    const to = body.get("To") as string
    const messageBody = body.get("Body") as string
    const numSegments = body.get("NumSegments") as string
    const accountSid = body.get("AccountSid") as string

    await connectDB()

    // Check if we already processed this message
    const existingSms = await SMS.findOne({ twilioMessageSid: messageSid })
    if (existingSms) {
      console.log("[v0] Message already processed:", messageSid)
      return NextResponse.json({ message: "Message already processed" })
    }

    const lead = await Lead.findOne({
      $or: [{ phoneNumber: from }, { alternateNumber: from }],
    })

    const smsData = {
      smsId: generateUniqueId("SMS_"),
      messageType: "inbound",
      fromNumber: from,
      toNumber: to,
      content: messageBody,
      status: "received",
      sentAt: new Date(),
      leadId: lead?._id || undefined, // Optional - only if lead exists
      customerName: lead?.customerName || "", // Empty string if no lead
      // userId is intentionally omitted - not required for inbound messages
      twilioMessageSid: messageSid,
      twilioStatus: "received",
      direction: "inbound",
      accountSid,
      numSegments: Number.parseInt(numSegments) || 1,
      tags: [],
      isRead: false,
    }

    const sms = new SMS(smsData)
    await sms.save()

    console.log("[v0] Incoming SMS processed successfully:", { from, to, messageSid, leadId: lead?._id })

    // Respond with TwiML to acknowledge receipt
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>Thank you for your message. We have received it and will respond shortly.</Message>
    </Response>`

    return new NextResponse(twimlResponse, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("[v0] Incoming SMS webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
