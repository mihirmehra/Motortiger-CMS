import dropboxService from "@/utils/dropboxService"

interface UploadedFile {
  url: string
  type: "image" | "video" | "audio" | "document"
  fileName: string
  size: number
  fileId?: string
}

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 5MB limit` }
    }

    const isAllowed = Object.values(this.ALLOWED_TYPES).flat().includes(file.type)
    if (!isAllowed) {
      return { valid: false, error: `File type ${file.type} is not supported` }
    }

    return { valid: true }
  }

  static getFileType(file: File): "image" | "video" | "audio" | "document" {
    for (const [type, mimes] of Object.entries(this.ALLOWED_TYPES)) {
      if (mimes.includes(file.type)) {
        return type as "image" | "video" | "audio" | "document"
      }
    }
    return "document"
  }

  static async uploadToStorage(file: File, conversationId?: string): Promise<UploadedFile> {
    const fileType = this.getFileType(file)

    try {
      // Use Dropbox for file storage
      const folderPath = conversationId ? `/sms-uploads/${conversationId}` : `/sms-uploads`
      const result = await dropboxService.uploadFile(file, folderPath)

      return {
        url: result.url,
        type: fileType,
        fileName: file.name,
        size: file.size,
        fileId: result.fileId,
      }
    } catch (error) {
      console.error("[v0] Dropbox upload failed:", error)
      throw new Error("Failed to upload file to Dropbox")
    }
  }

  static async uploadMultiple(files: File[], conversationId?: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) => {
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return Promise.reject(new Error(validation.error))
      }
      return this.uploadToStorage(file, conversationId)
    })

    return Promise.all(uploadPromises)
  }
}
