import mongoose, { type Document, Schema, type Types } from "mongoose"

export interface IWhatsApp extends Document {
  whatsappId: string
  messageType: "outbound" | "inbound"
  fromNumber: string
  toNumber: string
  content: string
  status: "sent" | "delivered" | "failed" | "pending" | "received" | "read"
  sentAt: Date
  deliveredAt?: Date
  readAt?: Date
  failureReason?: string
  cost?: number
  leadId?: Types.ObjectId
  customerId?: string
  customerName?: string
  userId?: Types.ObjectId
  twilioMessageSid?: string
  twilioStatus?: string
  twilioErrorCode?: string
  twilioErrorMessage?: string
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "audio" | "document"
  numSegments?: number
  direction: "inbound" | "outbound-api" | "outbound-reply"
  accountSid?: string
  messagingServiceSid?: string
  tags: string[]
  isRead: boolean
}

const WhatsAppSchema = new Schema<IWhatsApp>(
  {
    whatsappId: { type: String, unique: true, required: true },
    messageType: {
      type: String,
      enum: ["outbound", "inbound"],
      required: true,
    },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "pending", "received", "read"],
      required: true,
    },
    sentAt: { type: Date, required: true },
    deliveredAt: Date,
    readAt: Date,
    failureReason: String,
    cost: Number,
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    customerId: String,
    customerName: String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    twilioMessageSid: String,
    twilioStatus: String,
    twilioErrorCode: String,
    twilioErrorMessage: String,
    mediaUrls: [String],
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "document"],
    },
    numSegments: Number,
    direction: {
      type: String,
      enum: ["inbound", "outbound-api", "outbound-reply"],
      required: true,
    },
    accountSid: String,
    messagingServiceSid: String,
    tags: [String],
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

WhatsAppSchema.index({ userId: 1 })
WhatsAppSchema.index({ messageType: 1 })
WhatsAppSchema.index({ status: 1 })
WhatsAppSchema.index({ sentAt: -1 })
WhatsAppSchema.index({ fromNumber: 1 })
WhatsAppSchema.index({ toNumber: 1 })
WhatsAppSchema.index({ leadId: 1 })
WhatsAppSchema.index({ twilioMessageSid: 1 })

export default mongoose.models.WhatsApp || mongoose.model<IWhatsApp>("WhatsApp", WhatsAppSchema)
