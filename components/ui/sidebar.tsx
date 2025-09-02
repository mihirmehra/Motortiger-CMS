'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/dashboard',
      roles: ['admin', 'manager', 'agent']
    },
    { 
      icon: FileText, 
      label: 'Leads', 
      href: '/dashboard/leads',
      roles: ['admin', 'manager', 'agent']
    },
    { 
      icon: ShoppingCart, 
      label: 'Vendor Orders', 
      href: '/dashboard/orders',
      roles: ['admin', 'manager', 'agent']
    },
    { 
      icon: Clock, 
      label: 'Follow-ups', 
      href: '/dashboard/followups',
      roles: ['admin', 'manager', 'agent']
    },
    { 
      icon: TrendingUp, 
      label: 'Sales', 
      href: '/dashboard/sales',
      roles: ['admin', 'manager']
    },
    { 
      icon: CreditCard, 
      label: 'Payment Records', 
      href: '/dashboard/payments',
      roles: ['admin', 'manager', 'agent']
    },
    { 
      icon: Target, 
      label: 'Targets', 
      href: '/dashboard/targets',
      roles: ['admin', 'manager']
    },
    { 
      icon: Users, 
      label: 'Users', 
      href: '/dashboard/users',
      roles: ['admin', 'manager']
    },
    { 
      icon: Activity, 
      label: 'Activity History', 
      href: '/dashboard/activity',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Motortiger CMS</h2>
                <p className="text-xs text-gray-500">Auto Parts Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <p className="text-xs text-blue-600 font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isCollapsed ? 'px-2' : 'px-3'
                  } ${isActive(item.href) ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={`w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Logout'}
        </Button>
      </div>
    </div>
  );
}