import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISale extends Document {
<<<<<<< HEAD
  leadId: Types.ObjectId;
=======
<<<<<<< HEAD
  leadId: string;
=======
  leadId: Types.ObjectId;
>>>>>>> ff4abdcc4f9f8c495fd00ba867bb8a32d261d0cc
>>>>>>> 262de235504cccb3b9dd42b5dee8900458aa5910
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
<<<<<<< HEAD
  assignedAgent: Types.ObjectId;
  notes: string[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
=======
<<<<<<< HEAD
  assignedAgent: string;
  notes: string[];
  createdBy: string;
  updatedBy: string;
=======
  assignedAgent: Types.ObjectId;
  notes: string[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
>>>>>>> ff4abdcc4f9f8c495fd00ba867bb8a32d261d0cc
>>>>>>> 262de235504cccb3b9dd42b5dee8900458aa5910
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
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

SaleSchema.index({ saleId: 1 });
SaleSchema.index({ leadId: 1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ assignedAgent: 1 });

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);