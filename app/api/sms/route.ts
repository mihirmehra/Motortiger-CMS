import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMS from "@/models/SMS"
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

    if (user.role === "agent") {
      filter.$or = [
        { messageType: "inbound" }, // Agents see ALL inbound messages from ANY number
        { messageType: "outbound", userId: user.id }, // Agents see their own outbound
      ]
    } else if (user.role === "manager") {
      filter.$or = [
        { messageType: "inbound" }, // Managers see ALL inbound messages
        { messageType: "outbound", userId: { $in: [user.id, ...(user.assignedAgents || [])] } },
      ]
    }
    // Admin sees all SMS (no filter applied)

    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { fromNumber: { $regex: search, $options: "i" } },
            { toNumber: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
            { smsId: { $regex: search, $options: "i" } },
          ],
        },
      ]
    }

    if (status) {
      filter.status = status
    }

    if (messageType) {
      filter.messageType = messageType
    }

    const messages = await SMS.find(filter)
      .populate("userId", "name email")
      .populate("leadId", "leadNumber customerName")
      .sort({
        sentAt: -1, // Sort by date descending to show newest first
      })
      .skip(skip)
      .limit(limit)

    const total = await SMS.countDocuments(filter)

    console.log(`[v0] SMS Query - Filter: ${JSON.stringify(filter)}, Total: ${total}, Returned: ${messages.length}`)

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
    console.error("[v0] Get SMS messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
