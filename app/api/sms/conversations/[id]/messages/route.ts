import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMSConversation from "@/models/SMSConversation"
import SMSMessage from "@/models/SMSMessage"
import SMS from "@/models/SMS"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"
import { generateUniqueId } from "@/utils/idGenerator"
import { logActivity } from "@/utils/activityLogger"
import TwilioService from "@/utils/twilioService"
import { mapTwilioStatus } from "@/utils/statusMapper"

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

    const conversation = await SMSConversation.findById(params.id)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }


    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const skip = (page - 1) * limit

    const messages = await SMSMessage.find({ conversationId: params.id })
      .populate("senderId", "name email")
      .sort({ sentAt: 1 })
      .skip(skip)
      .limit(limit)

    const total = await SMSMessage.countDocuments({ conversationId: params.id })

    // Mark messages as read
    await SMSMessage.updateMany(
      { conversationId: params.id, senderType: "customer", status: { $ne: "read" } },
      { status: "read", readAt: new Date() },
    )

    // Update conversation unread count
    conversation.unreadCount = 0
    await conversation.save()

    return NextResponse.json({
      messages,
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

    const { content, mediaUrls } = await request.json()

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ error: "Message content or media is required" }, { status: 400 })
    }

    await connectDB()

    const conversation = await SMSConversation.findById(params.id)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messageId = generateUniqueId("MSG_")
    const twilioService = new TwilioService()

    // Create message record
    const message = new SMSMessage({
      messageId,
      conversationId: params.id,
      senderType: "agent",
      senderId: user.id,
      phoneNumber: conversation.phoneNumber,
      content,
      mediaUrls: mediaUrls || [],
      status: "queued",
      sentAt: new Date(),
    })

    await message.save()

    // Send via Twilio
    try {
      const twilioResponse = await twilioService.sendSMS({
        to: conversation.phoneNumber,
        body: content,
        mediaUrl: mediaUrls,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || "https://motortiger-cms.vercel.app"}/api/sms/webhooks/status`,
      })

      message.status = mapTwilioStatus(twilioResponse.status)
      message.twilioMessageSid = twilioResponse.sid
      await message.save()

      // Also create legacy SMS record for compatibility
      const sms = new SMS({
        smsId: generateUniqueId("SMS_"),
        messageType: "outbound",
        fromNumber: twilioService.getPhoneNumber(),
        toNumber: conversation.phoneNumber,
        content,
        status: mapTwilioStatus(twilioResponse.status),
        sentAt: new Date(),
        userId: user.id,
        customerName: conversation.customerName,
        leadId: conversation.leadId,
        twilioMessageSid: twilioResponse.sid,
        mediaUrls: mediaUrls || [],
        direction: "outbound-api",
        tags: [],
        isRead: true,
      })

      await sms.save()

      // Update conversation
      conversation.lastMessage = content
      conversation.lastMessageAt = new Date()
      conversation.messageCount += 1
      await conversation.save()

      return NextResponse.json({ message }, { status: 201 })
    } catch (twilioError: any) {
      message.status = "failed"
      message.failureReason = twilioError.message
      await message.save()

      console.error("[v0] Twilio SMS error:", twilioError)
      return NextResponse.json({ error: `Failed to send SMS: ${twilioError.message}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[v0] Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
