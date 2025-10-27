import mongoose, { type Document, Schema, type Types } from "mongoose"

export interface IWhatsAppConversation extends Document {
  conversationId: string
  phoneNumber: string
  customerName?: string
  lastMessage?: string
  lastMessageAt?: Date
  messageCount: number
  unreadCount: number
  status: "active" | "archived" | "closed"
  leadId?: Types.ObjectId
  participants: string[]
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>(
  {
    conversationId: { type: String, unique: true, required: true },
    phoneNumber: { type: String, required: true, index: true },
    customerName: String,
    lastMessage: String,
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },
    unreadCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    participants: [String],
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  },
)

WhatsAppConversationSchema.index({ phoneNumber: 1 })
WhatsAppConversationSchema.index({ status: 1 })
WhatsAppConversationSchema.index({ lastMessageAt: -1 })
WhatsAppConversationSchema.index({ leadId: 1 })

export default mongoose.models.WhatsAppConversation ||
  mongoose.model<IWhatsAppConversation>("WhatsAppConversation", WhatsAppConversationSchema)
