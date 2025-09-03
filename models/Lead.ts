import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus =
  | 'New'
  | 'Connected'
  | 'Nurturing'
  | 'Waiting for respond'
  | 'Customer Waiting for respond'
  | 'Follow up'
  | 'Desision Follow up'
  | 'Payment Follow up'
  | 'Payment Under Process'
  | 'Customer making payment'
  | 'Sale Payment Done'
  | 'Sale Closed';

export interface ILeadProduct {
  productId: string;
  productName: string;
  productAmount?: number;
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
  vendorInfo?: {
    vendorId?: string;
    vendorName?: string;
    vendorLocation?: string;
    recycler?: string;
    modeOfPaymentToRecycler?: string;
    dateOfBooking?: Date;
    dateOfDelivery?: Date;
    trackingNumber?: string;
    shippingCompany?: string;
    fedexTracking?: string;
  };
}

export interface ILead {
  leadId: string;
  leadNumber: string;
  date: Date;
  month: string;
  invoiceNo?: string;
  orderNo?: string;
  customerId?: string;
  customerName: string;
  phoneNumber: string;
  alternateNumber?: string;
  customerEmail: string;
  status: LeadStatus;
  orderStatus?: string;
  assignedAgent: string | mongoose.Types.ObjectId;
  billingAddress?: string;
  shippingAddress?: string;
  mechanicName?: string;
  contactPhone?: string;
  state?: string;
  zone?: string;
  callType?: string;
  products: ILeadProduct[];
  // Payment Information
  modeOfPayment?: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate?: Date;
  salesPrice?: number;
  pendingBalance?: number;
  costPrice?: number;
  totalMargin?: number;
  refunded?: number;
  disputeCategory?: string;
  disputeReason?: string;
  disputeDate?: Date;
  disputeResult?: string;
  refundDate?: Date;
  refundTAT?: string;
  arn?: string;
  refundCredited?: number;
  chargebackAmount?: number;
  createdBy: string | mongoose.Types.ObjectId;
  updatedBy: string | mongoose.Types.ObjectId;
  history: Array<{
    action: string;
    changes: object;
    performedBy: string;
    timestamp: Date;
    notes?: string;
  }>;
  notes: Array<{
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  scheduledFollowups: Array<{
    followupType: string;
    scheduledDate: Date;
    scheduledTime: string;
    notes?: string;
    isCompleted: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
}

const LeadProductSchema = new Schema<ILeadProduct>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productAmount: Number,
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
  vendorInfo: {
    vendorId: String,
    vendorName: String,
    vendorLocation: String,
    recycler: String,
    modeOfPaymentToRecycler: String,
    dateOfBooking: Date,
    dateOfDelivery: Date,
    trackingNumber: String,
    shippingCompany: String,
    fedexTracking: String,
    // Vendor Payment Information
    paymentPortal: String,
    modeOfPayment: String,
    paymentDate: Date,
  }
});

const LeadSchema = new Schema<ILead>(
  {
    leadId: { type: String, unique: true, required: true },
    leadNumber: { type: String, unique: true, required: true },
    date: { type: Date, default: Date.now },
    month: { type: String, required: true },
    invoiceNo: String,
    orderNo: { type: String, ref: 'VendorOrder' },
    customerId: { type: String, ref: 'User' },
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    alternateNumber: String,
    customerEmail: { type: String, validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }},
    status: {
      type: String,
      enum: [
        'New',
        'Connected',
        'Nurturing',
        'Waiting for respond',
        'Customer Waiting for respond',
        'Follow up',
        'Desision Follow up',
        'Payment Follow up',
        'Payment Under Process',
        'Customer making payment',
        'Sale Payment Done',
        'Sale Closed',
      ],
      default: 'New',
    },
    orderStatus: String,
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    billingAddress: String,
    shippingAddress: String,
    mechanicName: String,
    contactPhone: String,
    state: String,
    zone: String,
    callType: String,
    products: [LeadProductSchema],
    modeOfPayment: String,
    paymentPortal: { type: String, enum: ['EasyPayDirect', 'Authorize.net'] },
    cardNumber: String,
    expiry: String,
    paymentDate: Date,
    salesPrice: Number,
    pendingBalance: Number,
    costPrice: Number,
    totalMargin: { type: Number, default: 0 },
    refunded: Number,
    disputeCategory: String,
    disputeReason: String,
    disputeDate: Date,
    disputeResult: String,
    refundDate: Date,
    refundTAT: String,
    arn: String,
    refundCredited: Number,
    chargebackAmount: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    history: [
      {
        action: String,
        changes: Schema.Types.Mixed,
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  notes: [
    {
      content: { type: String, required: true },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  scheduledFollowups: [
    {
      followupType: { type: String, required: true },
      scheduledDate: { type: Date, required: true },
      scheduledTime: { type: String, required: true },
      notes: String,
      isCompleted: { type: Boolean, default: false },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  },
  {
    timestamps: true,
  }
);

// Calculate total margin and sales price automatically
LeadSchema.pre('save', function (next) {
  // Calculate total sales price from all products
  if (this.products && this.products.length > 0) {
    this.salesPrice = this.products.reduce((total, product) => {
      return total + ((product.productAmount || 0) * (product.quantity || 1));
    }, 0);
  }

  if (this.salesPrice && this.costPrice) {
    this.totalMargin = this.salesPrice - this.costPrice;
  }
  next();
});

LeadSchema.index({ leadId: 1 });
LeadSchema.index({ leadNumber: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedAgent: 1 });
LeadSchema.index({ customerEmail: 1 });
LeadSchema.index({ createdAt: -1 });

export default mongoose.models.Lead ||
  mongoose.model<ILead>('Lead', LeadSchema);