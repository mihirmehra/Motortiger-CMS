import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsApp from "@/models/WhatsApp"
import Lead from "@/models/Lead"
import { generateUniqueId } from "@/utils/idGenerator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()

    const payload = Object.fromEntries(body.entries())
    console.log("[v0] Received WhatsApp webhook payload:", JSON.stringify(payload, null, 2))

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
    const numMedia = Number.parseInt((body.get("NumMedia") as string) || "0")
    const accountSid = body.get("AccountSid") as string

    await connectDB()

    // Check if already processed
    const existingWhatsApp = await WhatsApp.findOne({ twilioMessageSid: messageSid })
    if (existingWhatsApp) {
      console.log("[v0] Message already processed:", messageSid)
      return NextResponse.json({ message: "Message already processed" })
    }

    // Extract phone number from WhatsApp format (whatsapp:+1234567890)
    const cleanFrom = from.replace("whatsapp:", "")
    const cleanTo = to.replace("whatsapp:", "")

    const lead = await Lead.findOne({
      $or: [{ phoneNumber: cleanFrom }, { alternateNumber: cleanFrom }],
    })

    // Extract media URLs if present
    const mediaUrls: string[] = []
    let mediaType: "image" | "video" | "audio" | "document" | undefined = undefined

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = body.get(`MediaUrl${i}`) as string
      const contentType = body.get(`MediaContentType${i}`) as string

      if (mediaUrl) {
        mediaUrls.push(mediaUrl)
        if (contentType) {
          if (contentType.startsWith("image")) mediaType = "image"
          else if (contentType.startsWith("video")) mediaType = "video"
          else if (contentType.startsWith("audio")) mediaType = "audio"
          else mediaType = "document"
        }
      }
    }

    const whatsappData = {
      whatsappId: generateUniqueId("WA_"),
      messageType: "inbound",
      fromNumber: cleanFrom,
      toNumber: cleanTo,
      content: messageBody,
      status: "received",
      sentAt: new Date(),
      leadId: lead?._id || undefined,
      customerName: lead?.customerName || "",
      twilioMessageSid: messageSid,
      twilioStatus: "received",
      direction: "inbound",
      accountSid,
      numSegments: 1,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      mediaType: mediaType,
      tags: [],
      isRead: false,
    }

    const whatsapp = new WhatsApp(whatsappData)
    await whatsapp.save()

    console.log("[v0] Incoming WhatsApp processed successfully:", {
      from: cleanFrom,
      to: cleanTo,
      messageSid,
      leadId: lead?._id,
    })

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
    console.error("[v0] Incoming WhatsApp webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
