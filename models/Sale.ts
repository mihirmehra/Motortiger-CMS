import mongoose, { Document, Schema, Types } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const getFontanaTime = () => {
  const now = new Date(); // This is the server's time (e.g., UTC)
  const fontanaTimeZone = 'America/Los_Angeles';
  // Convert the current time to the specified time zone
  return toZonedTime(now, fontanaTimeZone);
};

export interface ISale extends Document {
  leadId: Types.ObjectId;
  saleId: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productName?: string;
  salesPrice?: number;
  orderConfirmationSent: boolean;
  orderConfirmationDate?: Date;
  orderStageUpdated: boolean;
  orderStageUpdateDate?: Date;
  deliveryConfirmationSent: boolean;
  deliveryConfirmationDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAgent: Types.ObjectId;
  notes: string[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  saleId: { type: String, unique: true, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  productName: String,
  salesPrice: Number,
  orderConfirmationSent: { type: Boolean, default: false },
  orderConfirmationDate: Date,
  orderStageUpdated: { type: Boolean, default: false },
  orderStageUpdateDate: Date,
  deliveryConfirmationSent: { type: Boolean, default: false },
  deliveryConfirmationDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

SaleSchema.pre('save', function (next) {
  this.updatedAt = getFontanaTime();
  next();
});

SaleSchema.index({ saleId: 1 });
SaleSchema.index({ leadId: 1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ assignedAgent: 1 });

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);