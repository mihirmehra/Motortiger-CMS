import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
  messageId: string;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'lead_share' | 'voice' | 'location';
  fileUrl?: string;
  fileName?: string;
  leadData?: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isRead: boolean;
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  timestamp: Date;
  isEdited?: boolean;
  editedAt?: Date;
  originalContent?: string;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: Types.ObjectId;
    userName: string;
    createdAt: Date;
  }>;
  isStarred?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  scheduledFor?: Date;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  mentions?: Array<{
    userId: Types.ObjectId;
    userName: string;
    startIndex: number;
    endIndex: number;
  }>;
}

export interface IChat extends Document {
  chatId: string;
  chatType: 'direct' | 'group';
  chatName?: string;
  chatDescription?: string;
  chatAvatar?: string;
  participants: Types.ObjectId[];
  admins?: Types.ObjectId[]; // For group chats
  messages: IMessage[];
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  };
  isActive: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  muteUntil?: Date;
  createdBy: Types.ObjectId;
  settings?: {
    allowFileSharing: boolean;
    allowLeadSharing: boolean;
    autoDeleteMessages?: number; // days
    requireApprovalForNewMembers?: boolean;
    onlyAdminsCanMessage?: boolean;
  };
  lastActivity: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  messageId: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'image', 'video', 'lead_share', 'voice', 'location'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  leadData: Schema.Types.Mixed,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  isRead: { type: Boolean, default: false },
  readBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  originalContent: String,
  replyTo: {
    messageId: String,
    content: String,
    senderName: String
  },
  reactions: [{
    emoji: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isStarred: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  scheduledFor: Date,
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  mentions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    startIndex: Number,
    endIndex: Number
  }]
});

const ChatSchema = new Schema<IChat>(
  {
    chatId: { type: String, unique: true, required: true },
    chatType: { 
      type: String, 
      enum: ['direct', 'group'],
      required: true 
    },
    chatName: String,
    chatDescription: String,
    chatAvatar: String,
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    messages: [MessageSchema],
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date
    },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    muteUntil: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
      allowFileSharing: { type: Boolean, default: true },
      allowLeadSharing: { type: Boolean, default: true },
      autoDeleteMessages: Number,
      requireApprovalForNewMembers: { type: Boolean, default: false },
      onlyAdminsCanMessage: { type: Boolean, default: false }
    },
    lastActivity: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Update message count and last activity on save
ChatSchema.pre('save', function (next) {
  this.messageCount = this.messages.length;
  this.lastActivity = new Date();
  next();
});

// Indexes for better performance
ChatSchema.index({ chatId: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ chatType: 1 });
ChatSchema.index({ 'lastMessage.timestamp': -1 });
ChatSchema.index({ isActive: 1, isArchived: 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ 'messages.timestamp': -1 });
ChatSchema.index({ 'messages.senderId': 1 });
ChatSchema.index({ 'messages.messageType': 1 });

export default mongoose.models.Chat ||
  mongoose.model<IChat>('Chat', ChatSchema);