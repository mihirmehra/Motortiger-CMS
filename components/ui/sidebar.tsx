'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Car,
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
  ChevronDown,
  ChevronRight
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

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  href?: string;
  roles: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['admin', 'manager', 'agent']
  },
  {
    title: 'Lead Management',
    icon: FileText,
    href: '/dashboard/leads',
    roles: ['admin', 'manager', 'agent']
  },
  {
    title: 'Vendor Orders',
    icon: ShoppingCart,
    href: '/dashboard/orders',
    roles: ['admin', 'manager', 'agent']
  },
  {
    title: 'Sales Management',
    icon: TrendingUp,
    href: '/dashboard/sales',
    roles: ['admin', 'manager']
  },
  {
    title: 'Follow-ups',
    icon: Clock,
    href: '/dashboard/followups',
    roles: ['admin', 'manager', 'agent']
  },
  {
    title: 'Payment Records',
    icon: CreditCard,
    href: '/dashboard/payments',
    roles: ['admin', 'manager', 'agent']
  },
  {
    title: 'Target Management',
    icon: Target,
    href: '/dashboard/targets',
    roles: ['admin', 'manager']
  },
  {
    title: 'User Management',
    icon: Users,
    roles: ['admin', 'manager'],
    children: [
      {
        title: 'All Users',
        icon: Users,
        href: '/dashboard/users',
        roles: ['admin', 'manager']
      },
      {
        title: 'Assign Agents',
        icon: Users,
        href: '/dashboard/users/assign-agents',
        roles: ['admin']
      }
    ]
  },
  {
    title: 'Activity History',
    icon: Activity,
    href: '/dashboard/activity',
    roles: ['admin']
  }
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item.roles)) return null;

    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    const active = item.href ? isActive(item.href) : false;

    return (
      <div key={item.title}>
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
            ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
            ${level > 0 ? 'ml-4 text-sm' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title);
            } else if (item.href) {
              router.push(item.href);
            }
          }}
        >
          <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-500'}`} />
          
          {!isCollapsed && (
            <>
              <span className="flex-1 font-medium">{item.title}</span>
              {hasChildren && (
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </>
          )}
        </div>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-72'}
        lg:relative lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Motortiger CMS</h1>
                  <p className="text-xs text-blue-600">Auto Parts Management</p>
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

          {/* User Info */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <div className="flex-1 overflow-auto p-4">
            <nav className="space-y-2">
              {menuItems.map(item => renderMenuItem(item))}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={onLogout}
              className={`
                w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50
                ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'}
              `}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-white shadow-md"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}