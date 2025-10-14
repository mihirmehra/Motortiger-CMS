import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, leadSchema } from '@/utils/validation';
import { generateUniqueId, generateLeadNumber } from '@/utils/idGenerator';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';
import PaymentRecord from '@/models/PaymentRecord';
import VendorOrder from '@/models/VendorOrder';
import {
  generatePaymentId,
  generateOrderNumber,
  generateVendorId,
  generateFollowupId,
} from '@/utils/idGenerator';
import Followup from '@/models/Followup';

function generateProductId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PROD${timestamp.slice(-6)}${random}`;
}

// Helper function to calculate date ranges (e.g., start of today, start of week)
const getDateRange = (filter: string, customStartDate?: string, customEndDate?: string) => {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case 'this_week':
      // Start of the week (Monday)
      const day = now.getDay(); // 0 is Sunday, 6 is Saturday
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      start = startOfDay(new Date(now.setDate(diff)));
      // End date defaults to now, or will be set by timeInHours
      break;
    case 'custom':
      if (customStartDate) {
        start = new Date(customStartDate);
        start = startOfDay(start);
      }
      if (customEndDate) {
        end = new Date(customEndDate);
        end = endOfDay(end);
      }
      break;
  }
  
  return { start, end };
};

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const agent = searchParams.get('agent') || '';
    
    // UPDATED: New date and time filters
    const dateFilterType = searchParams.get('dateFilterType') || '';
    const customStartDate = searchParams.get('customStartDate') || '';
    const customEndDate = searchParams.get('customEndDate') || '';
    const timeInHours = parseInt(searchParams.get('timeInHours') || '0');

    const skip = (page - 1) * limit;
    const filter = permissions.getDataFilter();

    // 1. --- Apply Date and Time Filters ---
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (dateFilterType && dateFilterType !== 'all') {
      const dateRange = getDateRange(dateFilterType, customStartDate, customEndDate);
      startDate = dateRange.start;
      endDate = dateRange.end;
    }
    
    // Apply 'Last N Hours' Filter
    if (timeInHours > 0) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - timeInHours);
      
      // If a date range is also set, use the LATER of the two start times
      if (startDate) {
        startDate = new Date(Math.max(startDate.getTime(), hoursAgo.getTime()));
      } else {
        startDate = hoursAgo;
      }
      // If no end date is set, use 'now'
      if (!endDate) {
        endDate = new Date(); // Current time
      }
    }
    
    // Construct Mongoose Timestamp Query on `createdAt`
    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) {
        dateQuery.$gte = startDate;
      }
      if (endDate) {
        dateQuery.$lte = endDate;
      }
      
      if (Object.keys(dateQuery).length > 0) {
        (filter as any).$and = [
          ...((filter as any).$and || []),
          { createdAt: dateQuery }
        ];
      }
    }
    // --- End Date and Time Filters ---


    // Add search filter (Existing Logic)
    if (search) {
      (filter as any).$and = [
        ...((filter as any).$and || []),
        {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { leadNumber: { $regex: search, $options: 'i' } },
            { alternateNumber: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
            { 'products.productName': { $regex: search, $options: 'i' } },
            { 'products.make': { $regex: search, $options: 'i' } },
            { 'products.model': { $regex: search, $options: 'i' } },
            { 'products.yearOfMfg': { $regex: search, $options: 'i' } },
            { modeOfPayment: { $regex: search, $options: 'i' } },
            { 'billingInfo.state': { $regex: search, $options: 'i' } },
            { 'shippingInfo.state': { $regex: search, $options: 'i' } }
          ],
        },
      ];
    }

    // Add status filter (Existing Logic)
    if (status) {
      (filter as any).status = status;
    }

    // Add agent filter (Existing Logic)
    if (agent) {
      (filter as any).assignedAgent = agent;
    }

    const leads = await Lead.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canCreate('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validation = validateData(leadSchema, body);

    await connectDB();

    // Process products data
    const processedProducts = (body.products || []).map((product: any) => ({
      productId: product.productId || generateProductId(),
      productType: product.productType || 'engine',
      productName: product.productName || '',
      productAmount: product.productAmount || undefined,
      pitchedProductPrice: product.pitchedProductPrice || undefined,
      quantity: product.quantity || 1,
      yearOfMfg: product.yearOfMfg || undefined,
      make: product.make || undefined,
      model: product.model || undefined,
      trim: product.trim || undefined,
      engineSize: product.engineSize || undefined,
      partType: product.partType || undefined,
      partNumber: product.partNumber || undefined,
      vin: product.vin || undefined,
      vendorInfo: product.vendorInfo
        ? {
            shopName: product.vendorInfo.shopName || undefined,
            address: product.vendorInfo.address || undefined,
            modeOfPayment: product.vendorInfo.modeOfPayment || undefined,
            dateOfBooking: product.vendorInfo.dateOfBooking
              ? new Date(product.vendorInfo.dateOfBooking)
              : undefined,
            dateOfDelivery: product.vendorInfo.dateOfDelivery
              ? new Date(product.vendorInfo.dateOfDelivery)
              : undefined,
            trackingNumber: product.vendorInfo.trackingNumber || undefined,
            shippingCompany: product.vendorInfo.shippingCompany || undefined,
            proofOfDelivery: product.vendorInfo.proofOfDelivery || undefined,
          }
        : undefined,
    }));

    // Define a type for leadData to avoid implicit any and self-reference
    type LeadDataType = {
      customerName: string;
      customerEmail?: string;
      phoneNumber: string;
      alternateNumber?: string;
      leadId: string;
      leadNumber: string;
      month: string;
      assignedAgent: string;
      products: any[];
      billingAddress?: string;
      shippingAddress?: string;
      state?: string;
      zone?: string;
      callType?: string;
      status: string;
      modeOfPayment?: string;
      paymentPortal?: string;
      cardNumber?: string;
      expiry?: string;
      paymentDate?: Date;
      salesPrice?: number;
      pendingBalance?: number;
      costPrice?: number;
      refunded?: boolean;
      disputeCategory?: string;
      disputeReason?: string;
      disputeDate?: Date;
      disputeResult?: string;
      refundDate?: Date;
      refundTAT?: string;
      arn?: string;
      refundCredited?: boolean;
      chargebackAmount?: number;
      createdBy: string;
      updatedBy: string;
      history: any[];
      notes: any[];
      billingInfo?: any; // Add billingInfo to the type
      shippingInfo?: any; // Add shippingInfo to the type
    };

    // Prepare the initial leadData object without the history field
    const leadDataBase: Omit<LeadDataType, 'history'> = {
      customerName: body.customerName,
      customerEmail: body.customerEmail || undefined,
      phoneNumber: body.phoneNumber,
      alternateNumber: body.alternateNumber || undefined,
      leadId: generateUniqueId('LEAD_'),
      leadNumber: generateLeadNumber(),
      month: new Date().toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      }),
      assignedAgent: getAssignedAgent(body.assignedAgent, user),
      billingInfo: body.billingInfo || undefined,
      shippingInfo: body.shippingInfo || undefined,
      products: processedProducts,
      status: body.status || 'New',
      // Payment fields
      modeOfPayment: body.modeOfPayment || undefined,
      paymentPortal: body.paymentPortal || undefined,
      cardNumber: body.cardNumber || undefined,
      expiry: body.expiry || undefined,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      salesPrice: body.salesPrice || undefined,
      pendingBalance: body.pendingBalance || undefined,
      costPrice: body.costPrice || undefined,
      refunded: body.refunded || undefined,
      disputeCategory: body.disputeCategory || undefined,
      disputeReason: body.disputeReason || undefined,
      disputeDate: body.disputeDate ? new Date(body.disputeDate) : undefined,
      disputeResult: body.disputeResult || undefined,
      refundDate: body.refundDate ? new Date(body.refundDate) : undefined,
      refundTAT: body.refundTAT || undefined,
      arn: body.arn || undefined,
      refundCredited: body.refundCredited || undefined,
      chargebackAmount: body.chargebackAmount || undefined,
      createdBy: user.id,
      updatedBy: user.id,
      notes: [],
    };

    // Now create leadData with the history field referencing leadDataBase
    const leadData: LeadDataType = {
      ...leadDataBase,
      history: [
        {
          action: 'created',
          changes: { ...leadDataBase },
          performedBy: user.id,
          timestamp: new Date(),
          notes: 'Lead created',
        },
      ],
    };

    const lead = new Lead(leadData);
    await lead.save();

    // Create payment record if payment information is provided
    if (body.salesPrice && body.salesPrice > 0) {
      const paymentData = {
        paymentId: generatePaymentId(),
        leadId: lead._id,
        customerName: lead.customerName,
        customerPhone: body.phoneNumber || lead.phoneNumber,
        alternateNumber: body.alternateNumber || lead.alternateNumber,
        customerEmail: lead.customerEmail,
        modeOfPayment: body.modeOfPayment || 'Not specified',
        paymentPortal: body.paymentPortal,
        cardNumber: body.cardNumber,
        expiry: body.expiry,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        salesPrice: body.salesPrice,
        pendingBalance: body.pendingBalance,
        costPrice: body.costPrice,
        refunded: body.refunded,
        disputeCategory: body.disputeCategory,
        disputeReason: body.disputeReason,
        disputeDate: body.disputeDate ? new Date(body.disputeDate) : undefined,
        disputeResult: body.disputeResult,
        refundDate: body.refundDate ? new Date(body.refundDate) : undefined,
        refundTAT: body.refundTAT,
        arn: body.arn,
        refundCredited: body.refundCredited,
        chargebackAmount: body.chargebackAmount,
        // Copy vendor payment info if available
        vendorPaymentMode: processedProducts[0]?.vendorInfo?.modeOfPayment,
        vendorPaymentAmount: processedProducts[0]?.vendorInfo?.paymentAmount,
        vendorPaymentDate: processedProducts[0]?.vendorInfo?.dateOfBooking ? new Date(processedProducts[0].vendorInfo.dateOfBooking) : undefined,
        vendorName: processedProducts[0]?.vendorInfo?.shopName,
        vendorAddress: processedProducts[0]?.vendorInfo?.address,
        paymentStatus: 'pending',
        createdBy: user.id,
        updatedBy: user.id,
      };

      const payment = new PaymentRecord(paymentData);
      await payment.save();
    }

    // Create vendor orders for products with vendor information
    for (const product of processedProducts) {
      if (
        product.vendorInfo &&
        (product.vendorInfo.shopName || product.vendorInfo.address)
      ) {
        const vendorOrderData = {
          vendorId: generateVendorId(),
          shopName: product.vendorInfo.shopName || 'Not specified',
          vendorAddress: product.vendorInfo.address || 'Not specified',
          orderNo: generateOrderNumber(),
          customerId: lead._id.toString(),
          customerName: lead.customerName,
          customerPhone: lead.phoneNumber,
          alternateNumber: leadData.alternateNumber,
          customerEmail: lead.customerEmail,
          orderStatus: 'stage1 (engine pull)',
          productType: product.productType,
          productName: product.productName,
          pitchedProductPrice: product.pitchedProductPrice,
          productAmount: product.productAmount,
          quantity: product.quantity,
          yearOfMfg: product.yearOfMfg,
          make: product.make,
          model: product.model,
          trim: product.trim,
          engineSize: product.engineSize,
          partType: product.partType,
          partNumber: product.partNumber,
          vin: product.vin,
          modeOfPayment: product.vendorInfo.modeOfPayment,
          vendorPaymentMode: product.vendorInfo.modeOfPayment,
          vendorPaymentAmount: product.vendorInfo.paymentAmount,
          vendorContactPerson: product.vendorInfo.contactPerson,
          vendorPhone: product.vendorInfo.phone,
          vendorEmail: product.vendorInfo.email,
          dateOfBooking: product.vendorInfo.dateOfBooking,
          dateOfDelivery: product.vendorInfo.dateOfDelivery,
          trackingNumber: product.vendorInfo.trackingNumber,
          shippingCompany: product.vendorInfo.shippingCompany,
          proofOfDelivery: product.vendorInfo.proofOfDelivery,
          shippingAddress: leadData.shippingInfo?.fullAddress || leadData.billingInfo?.fullAddress,
          createdBy: user.id,
          updatedBy: user.id,
        };

        const vendorOrder = new VendorOrder(vendorOrderData);
        await vendorOrder.save();

        // Update lead with order number
        if (!lead.orderNo) {
          lead.orderNo = vendorOrder.orderNo;
          await lead.save();
        }
      }
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'leads',
      description: getChangeDescription('create', 'leads', lead.customerName),
      targetId: lead._id.toString(),
      targetType: 'Lead',
      changes: leadData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json(
      { message: 'Lead created successfully', lead: populatedLead },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getAssignedAgent(requestedAgent: string, currentUser: any): string {
  // If no agent specified, assign to current user
  if (!requestedAgent) {
    return currentUser.id;
  }

  // Admin can assign to anyone
  if (currentUser.role === 'admin') {
    return requestedAgent;
  }

  // Manager can assign to themselves or their assigned agents
  if (currentUser.role === 'manager') {
    if (requestedAgent === currentUser.id) {
      return requestedAgent;
    }
    // Check if requested agent is in manager's assigned agents
    if (
      currentUser.assignedAgents &&
      currentUser.assignedAgents.includes(requestedAgent)
    ) {
      return requestedAgent;
    }
    // If not valid, assign to manager themselves
    return currentUser.id;
  }

  // Agents can only assign to themselves
  return currentUser.id;
}