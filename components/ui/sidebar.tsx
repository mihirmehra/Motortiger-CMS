'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Target,
  TrendingUp,
  CreditCard,
  Users,
  Activity,
  Clock,
  LogOut,
  Menu,
  X,
  Car
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

interface TargetSummary {
  totalTarget: number;
  achievedTarget: number;
  remainingTarget: number;
  progressPercentage: number;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetSummary, setTargetSummary] = useState<TargetSummary | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      loadTargetSummary();
    }
  }, [user]);

  const loadTargetSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/targets/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTargetSummary(data);
      }
    } catch (error) {
      console.error('Failed to load target summary:', error);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Leads',
      href: '/dashboard/leads',
      icon: FileText,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Vendor Orders',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Sales',
      href: '/dashboard/sales',
      icon: TrendingUp,
      roles: ['admin', 'manager']
    },
    {
      name: 'Follow-ups',
      href: '/dashboard/followups',
      icon: Clock,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Payment Records',
      href: '/dashboard/payments',
      icon: CreditCard,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Targets',
      href: '/dashboard/targets',
      icon: Target,
      roles: ['admin', 'manager', 'agent']
    },
    {
      name: 'Users',
      href: '/dashboard/users',
      icon: Users,
      roles: ['admin', 'manager']
    },
    {
      name: 'Activity History',
      href: '/dashboard/activity',
      icon: Activity,
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AutoParts CMS</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Summary */}
      {targetSummary && (
        <div className="p-6 border-b border-gray-200">
          <Card className="border-0 shadow-none bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-900">
                ${targetSummary.totalTarget.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 ${
                    isActive(item.href) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <SidebarContent />
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0" />
    </>
  );
}