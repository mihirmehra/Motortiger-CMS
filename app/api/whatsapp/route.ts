import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import WhatsApp from "@/models/WhatsApp"
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
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const messageType = searchParams.get("messageType") || ""

    const skip = (page - 1) * limit
    const filter: any = {}

    // All users can see all WhatsApp messages (no filtering)
    if (search) {
      filter.$or = [
        { fromNumber: { $regex: search, $options: "i" } },
        { toNumber: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { whatsappId: { $regex: search, $options: "i" } },
      ]
    }

    if (status) {
      filter.status = status
    }

    if (messageType) {
      filter.messageType = messageType
    }

    const messages = await WhatsApp.find(filter)
      .populate("userId", "name email")
      .populate("leadId", "leadNumber customerName")
      .sort({
        sentAt: -1,
      })
      .skip(skip)
      .limit(limit)

    const total = await WhatsApp.countDocuments(filter)

    console.log(
      `[v0] WhatsApp Query - Filter: ${JSON.stringify(filter)}, Total: ${total}, Returned: ${messages.length}`,
    )

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
    console.error("[v0] Get WhatsApp messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
