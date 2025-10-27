import mongoose, { type Document, Schema, type Types } from "mongoose"

export interface ISMSConversation extends Document {
  conversationId: string
  agentId: Types.ObjectId
  phoneNumber: string
  customerName?: string
  leadId?: Types.ObjectId
  lastMessage?: string
  lastMessageAt?: Date
  messageCount: number
  unreadCount: number
  status: "active" | "archived" | "closed"
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SMSConversationSchema = new Schema<ISMSConversation>(
  {
    conversationId: { type: String, unique: true, required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phoneNumber: { type: String, required: true },
    customerName: String,
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    lastMessage: String,
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },
    unreadCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  },
)

SMSConversationSchema.index({ agentId: 1, status: 1 })
SMSConversationSchema.index({ phoneNumber: 1 })
SMSConversationSchema.index({ lastMessageAt: -1 })
SMSConversationSchema.index({ leadId: 1 })

export default mongoose.models.SMSConversation ||
  mongoose.model<ISMSConversation>("SMSConversation", SMSConversationSchema)
