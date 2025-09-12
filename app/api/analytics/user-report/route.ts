import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { ExportService } from '@/utils/exportService';
import { logActivity } from '@/utils/activityLogger';

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
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const agentName = searchParams.get('agentName');
    const format = searchParams.get('format') || 'excel';

    if (!agentName) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    // Find the user by name
    const targetUser = await User.findOne({ name: agentName });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      assignedAgent: targetUser._id
    };

    let baseFilter: Record<string, any> = { ...dateFilter };
    const dataFilter = permissions.getDataFilter();
    
    if (Object.keys(dataFilter).length > 0) {
      baseFilter = { $and: [dateFilter, dataFilter] };
    }

    // Get user's leads
    const leads = await Lead.find(baseFilter)
      .populate('assignedAgent', 'name email')
      .lean();

    // Calculate user statistics
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(lead => ['Sale Payment Done', 'Sale Closed'].includes(lead.status)).length;
    const totalRevenue = leads.reduce((sum, lead) => sum + (lead.salesPrice || 0), 0);
    const totalMargin = leads.reduce((sum, lead) => sum + (lead.totalMargin || 0), 0);
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Status breakdown
    const statusBreakdown = leads.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    // Format data for export
    const reportData = [
      // Summary Section
      { 'Metric': 'Agent Name', 'Value': agentName },
      { 'Metric': 'Report Period', 'Value': `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` },
      { 'Metric': 'Total Leads', 'Value': totalLeads },
      { 'Metric': 'Converted Leads', 'Value': convertedLeads },
      { 'Metric': 'Conversion Rate', 'Value': `${conversionRate.toFixed(2)}%` },
      { 'Metric': 'Total Revenue', 'Value': `$${totalRevenue.toLocaleString()}` },
      { 'Metric': 'Total Margin', 'Value': `$${totalMargin.toLocaleString()}` },
      { 'Metric': '', 'Value': '' }, // Empty row
      { 'Metric': 'STATUS BREAKDOWN', 'Value': '' },
      ...Object.entries(statusBreakdown).map(([status, count]) => ({
        'Metric': status,
        'Value': count
      })),
      { 'Metric': '', 'Value': '' }, // Empty row
      { 'Metric': 'DETAILED LEADS', 'Value': '' },
      ...leads.map(lead => ({
        'Lead Number': lead.leadNumber,
        'Customer Name': lead.customerName,
        'Description': lead.description || '',
        'Phone': lead.phoneNumber,
        'Email': lead.customerEmail || '',
        'Status': lead.status,
        'Sales Price': lead.salesPrice || 0,
        'Margin': lead.totalMargin || 0,
        'Created Date': new Date(lead.createdAt).toLocaleDateString()
      }))
    ];

    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'excel') {
      fileBuffer = await ExportService.exportToExcel(reportData, `${agentName}_report`);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      const csvData = await ExportService.exportToCSV(reportData, Object.keys(reportData[0] || {}));
      fileBuffer = Buffer.from(csvData);
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'export',
      module: 'leads',
      description: `Downloaded user report for ${agentName} (${format.toUpperCase()})`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${agentName.replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('User report download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}