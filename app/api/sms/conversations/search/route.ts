import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMSConversation from "@/models/SMSConversation"
import SMSMessage from "@/models/SMSMessage"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"

export async function GET(request: NextRequest) {
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
    const query = searchParams.get("q") || ""
    const status = searchParams.get("status") || "active"
    const sortBy = searchParams.get("sortBy") || "recent"
    const hasUnread = searchParams.get("hasUnread") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const skip = (page - 1) * limit
    const filter: any = { agentId: user.id }

    // Status filter
    if (status !== "all") {
      filter.status = status
    }

    // Unread filter
    if (hasUnread) {
      filter.unreadCount = { $gt: 0 }
    }

    // Search filter
    if (query) {
      filter.$or = [
        { phoneNumber: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
        { conversationId: { $regex: query, $options: "i" } },
        { lastMessage: { $regex: query, $options: "i" } },
      ]
    }

    // Determine sort order
    let sortOrder: any = { lastMessageAt: -1 }
    if (sortBy === "oldest") {
      sortOrder = { lastMessageAt: 1 }
    } else if (sortBy === "unread") {
      sortOrder = { unreadCount: -1, lastMessageAt: -1 }
    }

    const conversations = await SMSConversation.find(filter)
      .populate("leadId", "customerName leadNumber")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)

    const total = await SMSConversation.countDocuments(filter)

    // Get message count for each conversation
    const conversationsWithStats = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await SMSMessage.countDocuments({ conversationId: conv._id })
        return {
          ...conv.toObject(),
          messageCount,
        }
      }),
    )

    return NextResponse.json({
      conversations: conversationsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Search conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
