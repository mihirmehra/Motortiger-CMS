'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { checkUpcomingFollowups, formatTimeUntil, FollowupNotification } from '@/utils/followupNotifications';

export function useFollowupNotifications(user: any) {
  const [notifications, setNotifications] = useState<FollowupNotification[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    const checkFollowups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/followups/upcoming', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const upcomingNotifications = checkUpcomingFollowups(data.upcomingFollowups);
          
          // Only show new notifications (not shown in the last check)
          const newNotifications = upcomingNotifications.filter(notification => {
            const scheduledTime = new Date(notification.scheduledTime);
            return scheduledTime > lastCheck;
          });

          if (newNotifications.length > 0) {
            newNotifications.forEach(notification => {
              toast.warning(`Follow-up Reminder`, {
                description: `${notification.followupType} for ${notification.customerName} (${notification.leadNumber}) in ${formatTimeUntil(notification.timeUntil)}`,
                action: {
                  label: 'View Follow-ups',
                  onClick: () => window.location.href = '/dashboard/followups'
                },
                duration: 10000
              });
            });
          }

          setNotifications(upcomingNotifications);
          setLastCheck(new Date());
        }
      } catch (error) {
        console.error('Error checking upcoming follow-ups:', error);
      }
    };

    // Initial check
    checkFollowups();

    // Set up interval for periodic checks (every 5 minutes)
    const interval = setInterval(checkFollowups, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, lastCheck]);

  return { notifications };
}