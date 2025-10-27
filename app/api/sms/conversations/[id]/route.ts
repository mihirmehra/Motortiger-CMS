import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/dbConfig"
import SMSConversation from "@/models/SMSConversation"
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

    const conversation = await SMSConversation.findById(params.id)
      .populate("agentId", "name email")
      .populate("leadId", "customerName leadNumber")

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Verify user owns this conversation
    if (conversation.agentId._id.toString() !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ conversation })
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

    const { status, notes, tags, customerName } = await request.json()

    await connectDB()

    const conversation = await SMSConversation.findById(params.id)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Verify user owns this conversation
    if (conversation.agentId.toString() !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (status) conversation.status = status
    if (notes !== undefined) conversation.notes = notes
    if (tags) conversation.tags = tags
    if (customerName) conversation.customerName = customerName

    await conversation.save()

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Update conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
