import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsAppConversation from "@/models/WhatsAppConversation"
import WhatsApp from "@/models/WhatsApp"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"

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

    const conversation = await WhatsAppConversation.findById(params.id).populate("leadId")

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get all messages for this conversation
    const messages = await WhatsApp.find({
      $or: [{ fromNumber: conversation.phoneNumber }, { toNumber: conversation.phoneNumber }],
    })
      .sort({ sentAt: 1 })
      .limit(100)

    // Mark messages as read
    await WhatsApp.updateMany(
      {
        $or: [{ fromNumber: conversation.phoneNumber }, { toNumber: conversation.phoneNumber }],
        isRead: false,
        messageType: "inbound",
      },
      { isRead: true },
    )

    // Update conversation unread count
    conversation.unreadCount = 0
    await conversation.save()

    return NextResponse.json({ conversation, messages })
  } catch (error) {
    console.error("[v0] Get conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status, customerName, notes, tags } = await request.json()

    await connectDB()

    const conversation = await WhatsAppConversation.findByIdAndUpdate(
      params.id,
      {
        ...(status && { status }),
        ...(customerName && { customerName }),
        ...(notes !== undefined && { notes }),
        ...(tags && { tags }),
      },
      { new: true },
    )

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Update conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
