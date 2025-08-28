'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
    
    // Check for active follow-ups and show toast
    if (!hasShownToast) {
      checkActiveFollowups();
      setHasShownToast(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const checkActiveFollowups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/followups/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.count > 0) {
          toast.info(`You have ${data.count} active follow-up${data.count > 1 ? 's' : ''} pending`, {
            description: 'Click to view your follow-ups',
            action: {
              label: 'View Follow-ups',
              onClick: () => router.push('/dashboard/followups')
            },
            duration: 8000
          });
        }
      }
    } catch (error) {
      console.error('Error checking active follow-ups:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}