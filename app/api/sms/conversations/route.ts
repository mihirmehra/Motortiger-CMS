import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMSConversation from "@/models/SMSConversation"
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
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "active"

    const skip = (page - 1) * limit
    const filter: any = {}

    if (status) {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { conversationId: { $regex: search, $options: "i" } },
      ]
    }

    const conversations = await SMSConversation.find(filter)
      .populate("agentId", "name email")
      .populate("leadId", "customerName leadNumber")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await SMSConversation.countDocuments(filter)

    console.log("[v0] Fetched conversations:", conversations.length, "for user:", user.id)

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { phoneNumber, customerName, leadId } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    await connectDB()

    let conversation = await SMSConversation.findOne({
      phoneNumber,
    })

    if (conversation) {
      return NextResponse.json({ conversation }, { status: 200 })
    }

    // Create new conversation
    const { generateUniqueId } = await import("@/utils/idGenerator")
    const conversationId = generateUniqueId("CONV_")

    conversation = new SMSConversation({
      conversationId,
      phoneNumber,
      customerName: customerName || "",
      leadId: leadId || undefined,
      status: "active",
      messageCount: 0,
      unreadCount: 0,
    })

    await conversation.save()

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
