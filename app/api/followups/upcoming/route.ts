import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

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

    await connectDB();

    // Get current time and 1 hour from now
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    let filter: any = { 
      isDone: false,
      scheduledDate: {
        $gte: now,
        $lte: oneHourFromNow
      }
    };

    // Role-based filtering
    if (user.role === 'agent') {
      filter.assignedAgent = user.id;
    } else if (user.role === 'manager') {
      filter.$or = [
        { assignedAgent: user.id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    }

    const upcomingFollowups = await Followup.find(filter)
      .populate('assignedAgent', 'name email')
      .populate('leadId', 'leadNumber')
      .sort({ scheduledDate: 1 });

    return NextResponse.json({
      upcomingFollowups,
      count: upcomingFollowups.length
    });

  } catch (error) {
    console.error('Get upcoming followups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}