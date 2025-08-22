import mongoose, { Schema, Types, Model } from 'mongoose';

// 1. Define OrderStatus type
export type OrderStatus =
  | 'stage1 (engine pull)'
  | 'stage2 (washing)'
  | 'stage3 (testing)'
  | 'stage4 (pack & ready)'
  | 'stage5 (shipping)'
  | 'stage6 (delivered)';

// 2. Define the interface WITHOUT extending Document
export interface IVendorOrder {
  date: Date;
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  orderNo: string;
  customerId?: Types.ObjectId; // Use Types.ObjectId
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
  createdBy: Types.ObjectId; // Use Types.ObjectId
  updatedBy: Types.ObjectId; // Use Types.ObjectId
}

// 3. Define the schema
const VendorOrderSchema = new Schema<IVendorOrder>(
  {
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
  },
  {
    timestamps: true
  }
);

// 4. Pre-save hook with correct typing
VendorOrderSchema.pre('save', function (next) {
  // 'this' is a Document here, so cast it
  const doc = this as IVendorOrder;
  const subtotal = doc.itemSubtotal || 0;
  const shipping = doc.shippingHandling || 0;
  const tax = doc.taxCollected || 0;
  doc.grandTotal = subtotal + shipping + tax;
  next();
});

// 5. Indexes
VendorOrderSchema.index({ orderNo: 1 });
VendorOrderSchema.index({ vendorId: 1 });
VendorOrderSchema.index({ orderStatus: 1 });
VendorOrderSchema.index({ createdBy: 1 });

// 6. Export the model
const VendorOrderModel: Model<IVendorOrder> =
  mongoose.models.VendorOrder || mongoose.model<IVendorOrder>('VendorOrder', VendorOrderSchema);

export default VendorOrderModel;
