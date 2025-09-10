import mongoose, { Document, Schema } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const getFontanaTime = () => {
  const now = new Date(); // This is the server's time (e.g., UTC)
  const fontanaTimeZone = 'America/Los_Angeles';
  // Convert the current time to the specified time zone
  return toZonedTime(now, fontanaTimeZone);
};

export interface IFollowup extends Document {
  followupId: string;
  leadId: mongoose.Types.ObjectId;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productName?: string;
  salesPrice?: number;
  status: 'Follow up' | 'Desision Follow up' | 'Payment Follow up';
  assignedAgent: mongoose.Types.ObjectId;
  dateCreated: Date;
  isDone: boolean;
  completedDate?: Date;
  completedBy?: mongoose.Types.ObjectId;
  notes: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowupSchema = new Schema<IFollowup>({
  followupId: { type: String, unique: true, required: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  leadNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  productName: String,
  salesPrice: Number,
  status: {
    type: String,
    enum: ['Follow up', 'Desision Follow up', 'Payment Follow up'],
    required: true
  },
  assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateCreated: { type: Date, default: getFontanaTime },
  isDone: { type: Boolean, default: false },
  completedDate: Date,
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: [String],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: {
    type: Date,
    default: getFontanaTime,
  },
  updatedAt: {
    type: Date,
    default: getFontanaTime,
  },
});

FollowupSchema.pre('save', function (next) {
  this.updatedAt = getFontanaTime();
  next();
});

FollowupSchema.index({ followupId: 1 });
FollowupSchema.index({ leadId: 1 });
FollowupSchema.index({ assignedAgent: 1 });
FollowupSchema.index({ status: 1 });
FollowupSchema.index({ isDone: 1 });

export default mongoose.models.Followup || mongoose.model<IFollowup>('Followup', FollowupSchema);