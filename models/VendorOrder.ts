import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderStatus =
  | 'stage1 (engine pull)'
  | 'stage2 (washing)'
  | 'stage3 (testing)'
  | 'stage4 (pack & ready)'
  | 'stage5 (shipping)'
  | 'stage6 (delivered)';

export interface IVendorOrder {
  date: Date;
  vendorId: string;
  shopName: string;
  vendorAddress: string;
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
  productType?: 'engine' | 'transmission' | 'part';
  productName?: string;
  productAmount?: number;
  shippingAddress?: string;
  quantity?: number;
  yearOfMfg?: string;
  make?: string;
  model?: string;
  trim?: string;
  engineSize?: string;
  // Part-specific fields
  partType?: 'used' | 'new';
  partNumber?: string;
  vin?: string;
  // Legacy fields
  specification?: string;
  attention?: string;
  warranty?: string;
  miles?: string;
  mileageQuote?: string;
  modeOfPayment?: string;
  dateOfBooking?: Date;
  dateOfDelivery?: Date;
  trackingNumber?: string;
  shippingCompany?: string;
  proofOfDelivery?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

const VendorOrderSchema = new Schema<IVendorOrder>(
  {
    date: { type: Date, default: Date.now },
    vendorId: { type: String, required: true },
    shopName: { type: String, required: true },
    vendorAddress: { type: String, required: true },
    orderNo: { type: String, unique: true, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    orderStatus: {
      type: String,
      enum: [
        'stage1 (engine pull)',
        'stage2 (washing)',
        'stage3 (testing)',
        'stage4 (pack & ready)',
        'stage5 (shipping)',
        'stage6 (delivered)',
      ],
      default: 'stage1 (engine pull)',
    },
    itemSubtotal: Number,
    shippingHandling: Number,
    taxCollected: Number,
    grandTotal: Number,
    courierCompany: String,
    trackingId: String,
    productType: { type: String, enum: ['engine', 'transmission', 'part'] },
    productName: String,
    productAmount: Number,
    shippingAddress: String,
    quantity: Number,
    yearOfMfg: String,
    make: String,
    model: String,
    trim: String,
    engineSize: String,
    // Part-specific fields
    partType: { type: String, enum: ['used', 'new'] },
    partNumber: String,
    vin: String,
    // Legacy fields
    specification: String,
    attention: String,
    warranty: String,
    miles: String,
    mileageQuote: String,
    modeOfPayment: String,
    dateOfBooking: Date,
    dateOfDelivery: Date,
    trackingNumber: String,
    shippingCompany: String,
    proofOfDelivery: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Calculate grand total automatically
VendorOrderSchema.pre('save', function (next) {
  const subtotal = this.itemSubtotal || 0;
  const shipping = this.shippingHandling || 0;
  const tax = this.taxCollected || 0;
  this.grandTotal = subtotal + shipping + tax;
  next();
});

VendorOrderSchema.index({ orderNo: 1 });
VendorOrderSchema.index({ vendorId: 1 });
VendorOrderSchema.index({ orderStatus: 1 });
VendorOrderSchema.index({ leadId: 1 });
VendorOrderSchema.index({ productId: 1 });
VendorOrderSchema.index({ createdBy: 1 });

export default mongoose.models.VendorOrder ||
  mongoose.model<IVendorOrder>('VendorOrder', VendorOrderSchema);