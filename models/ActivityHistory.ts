import mongoose, { Document, Schema } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const getFontanaTime = () => {
  const now = new Date(); // This is the server's time (e.g., UTC)
  const fontanaTimeZone = 'America/Los_Angeles';
  // Convert the current time to the specified time zone
  return toZonedTime(now, fontanaTimeZone);
};

export interface IActivityHistory extends Document {
  activityId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  targetId?: string;
  targetType?: string;
  description: string;
  changes?: object;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityHistorySchema = new Schema<IActivityHistory>({
  activityId: { type: String, unique: true, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'register', 'import', 'export'],
    required: true 
  },
  module: {
    type: String,
    enum: ['leads', 'vendor_orders', 'targets', 'sales', 'followups', 'payment_records', 'users', 'auth'],
    required: true
  },
  targetId: String,
  targetType: String,
  description: { type: String, required: true },
  changes: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: getFontanaTime },
  createdAt: {
    type: Date,
    default: getFontanaTime,
  },
  updatedAt: {
    type: Date,
    default: getFontanaTime,
  },
});

ActivityHistorySchema.pre('save', function (next) {
  this.updatedAt = getFontanaTime();
  next();
});

ActivityHistorySchema.index({ userId: 1 });
ActivityHistorySchema.index({ action: 1 });
ActivityHistorySchema.index({ module: 1 });
ActivityHistorySchema.index({ timestamp: -1 });

export default mongoose.models.ActivityHistory || mongoose.model<IActivityHistory>('ActivityHistory', ActivityHistorySchema);