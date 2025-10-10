// page.tsx - Full Updated File

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Activity as ActivityIcon,
  Calendar,
  ListOrdered // Icon for per-page limit
} from 'lucide-react';

interface ActivityRecord {
  _id: string;
  activityId: string;
  userName: string;
  userEmail?: string; 
  userRole: string;
  action: string;
  module: string;
  description: string;
  targetType?: string;
  ipAddress?: string;
  timestamp: string;
}

const dateFilterOptions = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week (Mon-Today)' },
  { value: 'custom', label: 'Custom Range' },
];

// NEW: Options for the results per page filter
const limitOptions = [
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' },
  { value: 200, label: '200 per page' },
  { value: 500, label: '500 per page' },
];

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Date/Time Filters
  const [dateFilterType, setDateFilterType] = useState('all'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [timeInHours, setTimeInHours] = useState(''); 
  
  // Agent/User Filter
  const [userNameFilter, setUserNameFilter] = useState(''); 
  
  // NEW: Results Per Page Filter
  const [resultsPerPage, setResultsPerPage] = useState(50); // Default to 50
  
  const router = useRouter();

  const actionOptions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'register', 'import', 'export'];
  const moduleOptions = ['leads', 'vendor_orders', 'targets', 'sales', 'followups', 'payment_records', 'users', 'auth'];

  // Helper to get unique user names and emails for the filter dropdown
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { name: string, email: string }>();
    activities.forEach(a => {
      if (a.userName && a.userEmail) {
        userMap.set(a.userName, { name: a.userName, email: a.userEmail });
      } else if (a.userName && !userMap.has(a.userName)) {
        userMap.set(a.userName, { name: a.userName, email: '' });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activities]);

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'create': 'bg-green-100 text-green-800',
      'read': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-purple-100 text-purple-800',
      'logout': 'bg-gray-100 text-gray-800',
      'register': 'bg-indigo-100 text-indigo-800',
      'import': 'bg-orange-100 text-orange-800',
      'export': 'bg-pink-100 text-pink-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'agent': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    // Reset page to 1 whenever any filter changes
    if (currentPage !== 1) {
        setCurrentPage(1);
    } else {
        loadActivities();
    }
  }, [search, actionFilter, moduleFilter, dateFilterType, customStartDate, customEndDate, timeInHours, userNameFilter, resultsPerPage]); // ADDED resultsPerPage

  // Load activities when currentPage changes
  useEffect(() => {
    if (currentPage > 1) {
      loadActivities();
    }
  }, [currentPage]);
  
  const loadActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: resultsPerPage.toString(), // UPDATED: Use resultsPerPage state
        ...(search && { search }),
        ...(actionFilter && { action: actionFilter }),
        ...(moduleFilter && { module: moduleFilter }),
        // Agent Filter
        ...(userNameFilter && { userNameFilter }),
        // Date/Time Filters
        ...(dateFilterType && { dateFilterType }),
        ...(dateFilterType === 'custom' && customStartDate && { customStartDate }),
        ...(dateFilterType === 'custom' && customEndDate && { customEndDate }),
        ...(timeInHours && parseInt(timeInHours) > 0 && { timeInHours }),
      });

      const response = await fetch(`/api/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load activities');
        if (response.status === 403) {
          alert('You do not have permission to view activity history');
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
              <p className="text-gray-600">Monitor all system activities and user actions</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-end">
              
              {/* Text Search */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {actionOptions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>

              {/* Module Filter */}
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>
                {moduleOptions.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
              
              {/* Agent/User Filter */}
              <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1 text-gray-700 sr-only">Agent/User</label>
                  <select
                    value={userNameFilter}
                    onChange={(e) => setUserNameFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Agents/Users</option>
                    {uniqueUsers.map(user => (
                      <option 
                        key={user.name} 
                        value={user.name}
                        title={user.email ? `Email: ${user.email}` : user.name}
                      >
                        {user.name} {user.email && `(${user.email})`}
                      </option>
                    ))}
                  </select>
              </div>
            </div>
            
            {/* Date & Time Filters Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4" /> Date & Time Filter
                  </h3>
                  
                  {/* NEW: Results Per Page Filter */}
                  <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-gray-700" />
                      <select
                          value={resultsPerPage}
                          onChange={(e) => setResultsPerPage(parseInt(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                          {limitOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </div>

                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    
                    {/* Date Range Type */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1 text-gray-700">Date Range Preset</label>
                        <select
                            value={dateFilterType}
                            onChange={(e) => {
                                setDateFilterType(e.target.value);
                                if (e.target.value !== 'custom') {
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {dateFilterOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Date Inputs (Conditionally Rendered) */}
                    {dateFilterType === 'custom' && (
                      <>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium mb-1 text-gray-700">Start Date</label>
                          <Input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="py-2"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium mb-1 text-gray-700">End Date</label>
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="py-2"
                          />
                        </div>
                      </>
                    )}

                    {/* Last N Hours Filter */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1 text-gray-700">Last N Hours (0 for off)</label>
                      <Input
                          type="number"
                          placeholder="e.g., 24"
                          value={timeInHours}
                          onChange={(e) => setTimeInHours(e.target.value)}
                          className="py-2"
                          min="0"
                      />
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Table and Pagination (use resultsPerPage in pagination count) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Activity Log ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User (Agent)</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" title={activity.userEmail || activity.userName}>
                          {activity.userName}
                          {activity.userEmail && <div className="text-xs text-gray-500 truncate">{activity.userEmail}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(activity.userRole)}>
                          {activity.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(activity.action)}>
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {activity.module}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={activity.description}>
                          {activity.description}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {activity.ipAddress || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {activities.length === 0 && (
              <div className="text-center py-8">
                <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity records found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}