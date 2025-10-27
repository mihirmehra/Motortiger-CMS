import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"
import dropboxService from "@/utils/dropboxService"

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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const conversationId = formData.get("conversationId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    console.log("[v0] SMS file upload request:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      conversationId,
    })

    const folderPath = conversationId ? `/sms-uploads/${conversationId}` : `/sms-uploads`
    const result = await dropboxService.uploadFile(file, folderPath)

    let mediaType: "image" | "video" | "audio" | "document" = "document"
    if (file.type.startsWith("image/")) mediaType = "image"
    else if (file.type.startsWith("video/")) mediaType = "video"
    else if (file.type.startsWith("audio/")) mediaType = "audio"

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      url: result.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      mediaType: mediaType,
    })
  } catch (error: any) {
    console.error("[v0] SMS file upload to Dropbox failed:", error)
    return NextResponse.json(
      {
        error: error.message || "File upload failed",
      },
      { status: 500 },
    )
  }
}
