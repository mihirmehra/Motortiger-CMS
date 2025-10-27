import mongoose, { type Document, Schema, type Types } from "mongoose"

export interface ISMSMessage extends Document {
  messageId: string
  conversationId: Types.ObjectId
  senderType: "agent" | "customer"
  senderId?: Types.ObjectId
  phoneNumber: string
  content: string
  mediaUrls?: Array<{
    url: string
    type: "image" | "video" | "audio" | "document"
    fileName?: string
  }>
  status: "queued" | "sending" | "sent" | "delivered" | "failed" | "received" | "read" | "undelivered"
  twilioMessageSid?: string
  failureReason?: string
  sentAt: Date
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SMSMessageSchema = new Schema<ISMSMessage>(
  {
    messageId: { type: String, unique: true, required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "SMSConversation", required: true },
    senderType: {
      type: String,
      enum: ["agent", "customer"],
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    phoneNumber: { type: String, required: true },
    content: { type: String, required: true },
    mediaUrls: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "video", "audio", "document"],
        },
        fileName: String,
      },
    ],
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "delivered", "failed", "received", "read", "undelivered"],
      required: true,
    },
    twilioMessageSid: String,
    failureReason: String,
    sentAt: { type: Date, required: true },
    deliveredAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  },
)

SMSMessageSchema.index({ conversationId: 1, sentAt: -1 })
SMSMessageSchema.index({ phoneNumber: 1 })
SMSMessageSchema.index({ senderType: 1 })
SMSMessageSchema.index({ status: 1 })

export default mongoose.models.SMSMessage || mongoose.model<ISMSMessage>("SMSMessage", SMSMessageSchema)
