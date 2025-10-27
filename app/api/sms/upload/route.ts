import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromRequest } from "@/middleware/auth"
import { FileUploadService } from "@/utils/fileUploadService"

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
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Validate all files
    for (const file of files) {
      const validation = FileUploadService.validateFile(file)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Upload files
    const uploadedFiles = await FileUploadService.uploadMultiple(files)

    return NextResponse.json({
      files: uploadedFiles,
      message: "Files uploaded successfully",
    })
  } catch (error: any) {
    console.error("[v0] File upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload files" }, { status: 500 })
  }
}
