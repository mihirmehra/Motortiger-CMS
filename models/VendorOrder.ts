<<<<<<< HEAD
import mongoose, { Document, Schema } from 'mongoose';
=======
import mongoose, { Document, Schema, Types } from 'mongoose';
>>>>>>> ff4abdcc4f9f8c495fd00ba867bb8a32d261d0cc

export type OrderStatus = 
  | 'stage1 (engine pull)'
  | 'stage2 (washing)'
  | 'stage3 (testing)'
  | 'stage4 (pack & ready)'
  | 'stage5 (shipping)'
  | 'stage6 (delivered)';

<<<<<<< HEAD
export interface IVendorOrder extends Document {
=======
export interface IVendorOrder {
>>>>>>> ff4abdcc4f9f8c495fd00ba867bb8a32d261d0cc
  date: Date;
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  orderNo: string;
  customerId?: string;
  customerName?: string;
  orderStatus: OrderStatus;
  itemSubtotal?: number;
  shippingHandling?: number;
  taxCollected?: number;
  grandTotal?: number;
  courierCompany?: string;
  trackingId?: string;
  productName?: string;
  productAmount?: number;
  shippingAddress?: string;
  quantity?: number;
  vin?: string;
  mileageQuote?: string;
  yearOfMfg?: string;
  make?: string;
  model?: string;
  specification?: string;
  attention?: string;
  warranty?: string;
  miles?: string;
  recycler?: string;
  modeOfPaymentToRecycler?: string;
  dateOfBooking?: Date;
  dateOfDelivery?: Date;
  trackingNumber?: string;
  shippingCompany?: string;
  modeOfPayment?: string;
  fedexTracking?: string;
<<<<<<< HEAD
  createdBy: string;
  updatedBy: string;
=======
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
>>>>>>> ff4abdcc4f9f8c495fd00ba867bb8a32d261d0cc
}

const VendorOrderSchema = new Schema<IVendorOrder>({
  date: { type: Date, default: Date.now },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  vendorLocation: { type: String, required: true },
  orderNo: { type: String, unique: true, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: String,
  orderStatus: {
    type: String,
    enum: [
      'stage1 (engine pull)', 'stage2 (washing)', 'stage3 (testing)',
      'stage4 (pack & ready)', 'stage5 (shipping)', 'stage6 (delivered)'
    ],
    default: 'stage1 (engine pull)'
  },
  itemSubtotal: Number,
  shippingHandling: Number,
  taxCollected: Number,
  grandTotal: Number,
  courierCompany: String,
  trackingId: String,
  productName: String,
  productAmount: Number,
  shippingAddress: String,
  quantity: Number,
  vin: String,
  mileageQuote: String,
  yearOfMfg: String,
  make: String,
  model: String,
  specification: String,
  attention: String,
  warranty: String,
  miles: String,
  recycler: String,
  modeOfPaymentToRecycler: String,
  dateOfBooking: Date,
  dateOfDelivery: Date,
  trackingNumber: String,
  shippingCompany: String,
  modeOfPayment: String,
  fedexTracking: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Calculate grand total automatically
VendorOrderSchema.pre('save', function(next) {
  const subtotal = this.itemSubtotal || 0;
  const shipping = this.shippingHandling || 0;
  const tax = this.taxCollected || 0;
  this.grandTotal = subtotal + shipping + tax;
  next();
});

VendorOrderSchema.index({ orderNo: 1 });
VendorOrderSchema.index({ vendorId: 1 });
VendorOrderSchema.index({ orderStatus: 1 });
VendorOrderSchema.index({ createdBy: 1 });

export default mongoose.models.VendorOrder || mongoose.model<IVendorOrder>('VendorOrder', VendorOrderSchema);