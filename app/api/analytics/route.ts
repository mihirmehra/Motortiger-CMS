import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import Sale from '@/models/Sale';
import PaymentRecord from '@/models/PaymentRecord';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

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
    const userIds = searchParams.get('userIds')?.split(',') || [];

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    let baseFilter = { ...dateFilter };
    const dataFilter = permissions.getDataFilter();
    
    // Combine permission filter with date filter
    if (Object.keys(dataFilter).length > 0) {
      baseFilter = { $and: [dateFilter, dataFilter] };
    }

    // Add user filter if specified
    if (userIds.length > 0) {
      const userFilter = { assignedAgent: { $in: userIds } };
      baseFilter = baseFilter.$and 
        ? { $and: [...baseFilter.$and, userFilter] }
        : { $and: [baseFilter, userFilter] };
    }

    // Status Distribution
    const statusDistribution = await Lead.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusData = statusDistribution.map((item, index) => ({
      name: item._id,
      value: item.count,
      color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]
    }));

    // Monthly Trends
    const monthlyTrends = await Lead.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          leads: { $sum: 1 },
          sales: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Sale Payment Done', 'Sale Closed']] },
                1,
                0
              ]
            }
          },
          revenue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$salesPrice', null] }, { $ne: ['$salesPrice', 0] }] },
                '$salesPrice',
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyData = monthlyTrends.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      leads: item.leads,
      sales: item.sales,
      revenue: item.revenue
    }));

    // Agent Performance
    const agentPerformance = await Lead.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedAgent',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: '$assignedAgent',
          agentName: { $first: '$agent.name' },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Sale Payment Done', 'Sale Closed']] },
                1,
                0
              ]
            }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$salesPrice', null] }, { $ne: ['$salesPrice', 0] }] },
                '$salesPrice',
                0
              ]
            }
          }
        }
      }
    ]);

    const agentData = agentPerformance.map(agent => ({
      ...agent,
      conversionRate: agent.totalLeads > 0 ? (agent.convertedLeads / agent.totalLeads) * 100 : 0
    }));

    // Payment Methods
    const paymentMethods = await Lead.aggregate([
      { $match: { ...baseFilter, modeOfPayment: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$modeOfPayment',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$salesPrice', 0] } }
        }
      }
    ]);

    const paymentData = paymentMethods.map(item => ({
      method: item._id,
      count: item.count,
      totalAmount: item.totalAmount
    }));

    // Product Types
    const productTypes = await Lead.aggregate([
      { $match: baseFilter },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productType',
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$salesPrice', 0] } }
        }
      }
    ]);

    const productData = productTypes.map(item => ({
      type: item._id,
      count: item.count,
      revenue: item.revenue
    }));

    // State Distribution
    const stateDistribution = await Lead.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$billingInfo.state', null] },
              '$billingInfo.state',
              '$shippingInfo.state'
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const stateData = stateDistribution.map(item => ({
      state: item._id,
      count: item.count
    }));

    // Summary calculations
    const totalLeads = await Lead.countDocuments(baseFilter);
    const totalRevenue = await Lead.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$salesPrice', 0] } } } }
    ]);

    const totalMargin = await Lead.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalMargin', 0] } } } }
    ]);

    const convertedLeads = await Lead.countDocuments({
      ...baseFilter,
      status: { $in: ['Sale Payment Done', 'Sale Closed'] }
    });

    const summary = {
      totalLeads,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageLeadValue: totalLeads > 0 ? (totalRevenue[0]?.total || 0) / totalLeads : 0,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      totalMargin: totalMargin[0]?.total || 0
    };

    return NextResponse.json({
      statusDistribution: statusData,
      monthlyTrends: monthlyData,
      agentPerformance: agentData,
      paymentMethods: paymentData,
      productTypes: productData,
      stateDistribution: stateData,
      summary
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}