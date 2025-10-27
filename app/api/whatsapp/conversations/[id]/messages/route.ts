import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsApp from "@/models/WhatsApp"
import WhatsAppConversation from "@/models/WhatsAppConversation"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"
import { generateUniqueId } from "@/utils/idGenerator"
import TwilioService from "@/utils/twilioService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const skip = (page - 1) * limit

    const conversation = await WhatsAppConversation.findById(params.id)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await WhatsApp.find({
      $or: [{ fromNumber: conversation.phoneNumber }, { toNumber: conversation.phoneNumber }],
    })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await WhatsApp.countDocuments({
      $or: [{ fromNumber: conversation.phoneNumber }, { toNumber: conversation.phoneNumber }],
    })

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { content, mediaUrls, mediaType } = await request.json()

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ error: "Message content or media is required" }, { status: 400 })
    }

    await connectDB()

    const conversation = await WhatsAppConversation.findById(params.id)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const twilioService = new TwilioService()
    const whatsappNumber = twilioService.getWhatsAppNumber()

    if (!whatsappNumber) {
      return NextResponse.json({ error: "WhatsApp is not configured" }, { status: 400 })
    }

    const whatsappId = generateUniqueId("WA_")

    const whatsappData = {
      whatsappId,
      messageType: "outbound",
      fromNumber: whatsappNumber,
      toNumber: conversation.phoneNumber,
      content: content || "",
      status: "queued",
      sentAt: new Date(),
      leadId: conversation.leadId || undefined,
      customerName: conversation.customerName || "",
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
        to: `whatsapp:${conversation.phoneNumber}`,
        body: content || "📎 Media message",
        mediaUrl: mediaUrls,
        statusCallback: `https://motortiger-cms.vercel.app/api/whatsapp/webhooks/status`,
      })

      whatsapp.status = twilioResponse.status || "queued"
      whatsapp.twilioMessageSid = twilioResponse.sid
      whatsapp.twilioStatus = twilioResponse.status
      await whatsapp.save()

      // Update conversation
      conversation.lastMessage = content || "📎 Media message"
      conversation.lastMessageAt = new Date()
      conversation.messageCount += 1
      await conversation.save()

      return NextResponse.json({ message: whatsapp })
    } catch (twilioError: any) {
      whatsapp.status = "failed"
      whatsapp.failureReason = twilioError.message
      await whatsapp.save()

      return NextResponse.json({ error: `Failed to send message: ${twilioError.message}` }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
