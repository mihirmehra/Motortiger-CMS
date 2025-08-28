import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import Sale from '@/models/Sale';
import Target from '@/models/Target';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { generateSaleId, generateFollowupId } from '@/utils/idGenerator';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const lead = await Lead.findById(params.id)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('history.performedBy', 'name');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissions.canUpdate('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();
    const oldValues = lead.toObject();

    // Handle follow-up status changes
    const followupStatuses = ['Follow up', 'Desision Follow up', 'Payment Follow up'];
    if (followupStatuses.includes(body.status) && !followupStatuses.includes(lead.status)) {
      // Create follow-up record
      const followup = new Followup({
        followupId: generateFollowupId(),
        leadId: lead._id,
        leadNumber: lead.leadNumber,
        customerName: lead.customerName,
        customerEmail: lead.customerEmail,
        phoneNumber: lead.phoneNumber,
        productName: lead.productName,
        salesPrice: lead.salesPrice,
        status: body.status,
        assignedAgent: lead.assignedAgent,
        createdBy: user.id,
        updatedBy: user.id
      });
      await followup.save();
    }

    // Handle status change to "Sale Payment Done"
    if (body.status === 'Sale Payment Done' && lead.status !== 'Sale Payment Done') {
      // Create sale record
      const sale = new Sale({
        leadId: lead._id,
        saleId: generateSaleId(),
        customerName: lead.customerName,
        customerEmail: lead.customerEmail,
        phoneNumber: lead.phoneNumber,
        productName: lead.productName,
        salesPrice: lead.salesPrice,
        assignedAgent: lead.assignedAgent,
        createdBy: user.id,
        updatedBy: user.id
      });
      await sale.save();
    }

    // Handle status change to "Sale Closed"
    if (body.status === 'Sale Closed' && lead.status !== 'Sale Closed') {
      // Update target achievement
      if (lead.totalMargin) {
        await Target.updateMany(
          { 
            assignedUsers: lead.assignedAgent,
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
          },
          { $inc: { achievedAmount: lead.totalMargin } }
        );
      }
    }

    // Update lead
    Object.assign(lead, body);
    lead.updatedBy = user.id;

    // Add history entry
    lead.history.push({
      action: 'updated',
      changes: body,
      performedBy: user.id,
      timestamp: new Date(),
      notes: body.status !== oldValues.status 
        ? `Status changed from ${oldValues.status} to ${body.status}`
        : 'Lead updated'
    });

    await lead.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: getChangeDescription('update', 'leads', lead.customerName),
      targetId: lead._id.toString(),
      targetType: 'Lead',
      changes: { oldValues, newValues: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead: updatedLead
    });

  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissions.canDelete('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await Lead.findByIdAndDelete(params.id);

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'leads',
      description: getChangeDescription('delete', 'leads', lead.customerName),
      targetId: lead._id.toString(),
      targetType: 'Lead',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}