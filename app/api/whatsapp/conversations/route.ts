import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsAppConversation from "@/models/WhatsAppConversation"
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
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit
    const filter: any = {}

    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    if (status) {
      filter.status = status
    }

    const conversations = await WhatsAppConversation.find(filter)
      .populate("leadId", "customerName phoneNumber")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await WhatsAppConversation.countDocuments(filter)

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

    // Check if conversation already exists
    let conversation = await WhatsAppConversation.findOne({ phoneNumber })

    if (!conversation) {
      const conversationId = `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      conversation = new WhatsAppConversation({
        conversationId,
        phoneNumber,
        customerName: customerName || "",
        leadId: leadId || undefined,
        participants: [phoneNumber],
        status: "active",
      })
      await conversation.save()
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
