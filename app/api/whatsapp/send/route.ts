import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsApp from "@/models/WhatsApp"
import Lead from "@/models/Lead"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"
import { generateUniqueId } from "@/utils/idGenerator"
import { logActivity } from "@/utils/activityLogger"
import TwilioService from "@/utils/twilioService"

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { toNumber, content, leadId, customerName, mediaUrls, mediaType } = await request.json()

    if (!toNumber || !content) {
      return NextResponse.json({ error: "Phone number and message content are required" }, { status: 400 })
    }

    await connectDB()

    let lead = null
    if (leadId) {
      lead = await Lead.findById(leadId)
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }
    }

    const twilioService = new TwilioService()

    const whatsappNumber = twilioService.getWhatsAppNumber()
    if (!whatsappNumber) {
      return NextResponse.json(
        {
          error:
            "WhatsApp is not configured. Please set TWILIO_WHATSAPP_NUMBER environment variable in your Vercel project settings.",
        },
        { status: 400 },
      )
    }

    const whatsappId = generateUniqueId("WA_")
    const formattedToNumber = twilioService.formatPhoneNumber(toNumber)

    const whatsappData = {
      whatsappId,
      messageType: "outbound",
      fromNumber: whatsappNumber,
      toNumber: formattedToNumber,
      content,
      status: "queued",
      sentAt: new Date(),
      leadId: leadId || undefined,
      customerName: customerName || lead?.customerName || "",
      userId: user.id,
      direction: "outbound-api",
      mediaUrls: mediaUrls || [],
      mediaType: mediaType || undefined,
      tags: [],
      isRead: true,
    }

    const whatsapp = new WhatsApp(whatsappData)
    await whatsapp.save()

    try {
      const twilioResponse = await twilioService.sendWhatsApp({
        to: `whatsapp:${formattedToNumber}`,
        body: content,
        mediaUrl: mediaUrls,
        statusCallback: `https://motortiger-cms.vercel.app/api/whatsapp/webhooks/status`,
      })

      whatsapp.status = twilioResponse.status || "queued"
      whatsapp.twilioMessageSid = twilioResponse.sid
      whatsapp.twilioStatus = twilioResponse.status
      whatsapp.direction = twilioResponse.direction
      await whatsapp.save()

      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: "create",
        module: "leads",
        description: `Sent WhatsApp message to ${formattedToNumber}${customerName ? ` (${customerName})` : ""}`,
        targetId: whatsapp._id.toString(),
        targetType: "WhatsApp",
        changes: whatsappData,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      return NextResponse.json({
        message: "WhatsApp message sent successfully",
        whatsapp: whatsapp,
        twilioSid: twilioResponse.sid,
      })
    } catch (twilioError: any) {
      whatsapp.status = "failed"
      whatsapp.failureReason = twilioError.message
      await whatsapp.save()

      console.error("Twilio WhatsApp sending failed:", twilioError)
      return NextResponse.json({ error: `Twilio WhatsApp error: ${twilioError.message}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Send WhatsApp error:", error)
    if (error.name === "MongooseError" || error.name === "ValidationError") {
      return NextResponse.json({ error: `WhatsApp validation failed: ${error.message}` }, { status: 400 })
    }
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
