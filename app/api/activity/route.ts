// route.ts - Full Updated File

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import ActivityHistory from '@/models/ActivityHistory';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

// Helper function to calculate date ranges (e.g., start of today, start of week)
const getDateRange = (filter: string, customStartDate?: string, customEndDate?: string) => {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  // Function to set time to start of day
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Function to set time to end of day (23:59:59.999)
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
    if (!permissions.canAccessActivityHistory()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    
    // UPDATED: Read the limit from search params, defaulting to '20' if not set or invalid.
    const requestedLimit = parseInt(searchParams.get('limit') || '20'); 
    const limit = [50, 100, 200, 500].includes(requestedLimit) ? requestedLimit : 20;

    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const module = searchParams.get('module') || '';
    const userId = searchParams.get('userId') || '';
    const userNameFilter = searchParams.get('userNameFilter') || '';
    
    // Date/Time Filters
    const dateFilterType = searchParams.get('dateFilterType') || '';
    const customStartDate = searchParams.get('customStartDate') || '';
    const customEndDate = searchParams.get('customEndDate') || '';
    const timeInHours = parseInt(searchParams.get('timeInHours') || '0');

    const skip = (page - 1) * limit;
    const filter: any = {};

    // 1. Apply Text, Action, Module Filters
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (action) {
      filter.action = action;
    }

    if (module) {
      filter.module = module;
    }

    // 2. Apply Agent/User Filters
    if (userId) {
      filter.userId = userId;
    }
    if (userNameFilter) {
        filter.userName = userNameFilter;
    }
    
    // 3. Apply Date Ranges & Time in Hours
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (dateFilterType && dateFilterType !== 'all') {
      const dateRange = getDateRange(dateFilterType, customStartDate, customEndDate);
      startDate = dateRange.start;
      endDate = dateRange.end;
    }
    
    if (timeInHours > 0) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - timeInHours);
      
      if (startDate) {
        startDate = new Date(Math.max(startDate.getTime(), hoursAgo.getTime()));
      } else {
        startDate = hoursAgo;
      }
      if (!endDate) {
        endDate = new Date();
      }
    }
    
    // 4. Construct Mongoose Timestamp Query
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = startDate;
      }
      if (endDate) {
        filter.timestamp.$lte = endDate;
      }
    }

    // Fetch activities and populate user data
    const activitiesRaw = await ActivityHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map the raw activities to a clean structure, extracting the email from the populated field
    const activities = activitiesRaw.map(activity => ({
        ...activity,
        userEmail: (activity.userId && typeof activity.userId === 'object' && 'email' in activity.userId) 
                   ? activity.userId.email 
                   : null,
    }));

    const total = await ActivityHistory.countDocuments(filter);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit, // Return the actual limit used
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get activity history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}