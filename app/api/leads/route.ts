import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, leadSchema } from '@/utils/validation';
import { generateUniqueId, generateLeadNumber } from '@/utils/idGenerator';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

// Fix missing import
function generateProductId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROD${timestamp.slice(-6)}${random}`;
}

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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;
    const filter = permissions.getDataFilter();

    // Add search filter
    if (search) {
      (filter as any).$and = [
        ...(((filter as any).$and || [])),
        {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { leadNumber: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Add status filter
    if (status) {
      (filter as any).status = status;
    }

    const leads = await Lead.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('notes.createdBy', 'name email')
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
        pages: Math.ceil(total / limit)
      }
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateData(leadSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectDB();

    // Process products data
    const processedProducts = body.products?.map((product: any) => ({
      ...product,
      productId: product.productId || generateProductId()
    })) || [];

    const leadData = {
      ...validation.data!,
      leadId: generateUniqueId('LEAD_'),
      leadNumber: generateLeadNumber(),
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      assignedAgent: getAssignedAgent(body.assignedAgent, user),
      products: processedProducts,
      billingAddress: body.billingAddress,
      shippingAddress: body.shippingAddress,
      mechanicName: body.mechanicName,
      contactPhone: body.contactPhone,
      state: body.state,
      zone: body.zone,
      callType: body.callType,
      createdBy: user.id,
      updatedBy: user.id,
      history: [{
        action: 'created',
        changes: validation.data,
        performedBy: user.id,
        timestamp: new Date(),
        notes: 'Lead created'
      }]
    };

    const lead = new Lead(leadData);
    await lead.save();

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
      userAgent: request.headers.get('user-agent') || 'unknown'
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
    if (currentUser.assignedAgents && currentUser.assignedAgents.includes(requestedAgent)) {
      return requestedAgent;
    }
    // If not valid, assign to manager themselves
    return currentUser.id;
  }

  // Agents can only assign to themselves
  return currentUser.id;
}