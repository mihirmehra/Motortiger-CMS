'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Eye, Users, FileText, Image, Video, Share } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatNotificationProps {
  userId: string;
}

interface UnreadMessage {
  chatId: string;
  chatName: string;
  chatType: string;
  senderName: string;
  content: string;
  messageType: string;
  timestamp: string;
}

export default function ChatNotification({ userId }: ChatNotificationProps) {
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const shownToastsRef = useRef<Set<string>>(new Set()); // Use ref to persist between renders
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // useEffect(() => {
  //   if (!userId) return;

  //   // Check for new messages every 5 seconds
  //   intervalRef.current = setInterval(checkForNewMessages, 5000);
    
  //   // Initial check
  //   checkForNewMessages();

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [userId]);

  // const checkForNewMessages = async () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(`/api/chats/new-messages?since=${lastCheckTime.toISOString()}`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       const newMessages = data.newMessages || [];

  //       if (newMessages.length > 0) {
  //         newMessages.forEach((message: UnreadMessage) => {
  //           const toastId = `${message.chatId}-${message.timestamp}`;
  //           if (!shownToastsRef.current.has(toastId)) {
  //             // Get message type icon
  //             const getMessageIcon = () => {
  //               switch (message.messageType) {
  //                 case 'file': return '📎';
  //                 case 'image': return '🖼️';
  //                 case 'video': return '🎥';
  //                 case 'lead_share': return '📋';
  //                 default: return '💬';
  //               }
  //             };

  //             const messagePreview = message.messageType === 'text'
  //               ? message.content.substring(0, 100)
  //               : `${getMessageIcon()} ${message.messageType === 'lead_share' ? 'Shared lead details' : 'Shared a file'}`;

  //             toast.info(
  //               <div className="flex items-start gap-3 w-full">
  //                 <Avatar className="h-8 w-8">
  //                   <AvatarFallback className="bg-blue-500 text-white text-xs">
  //                     {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
  //                   </AvatarFallback>
  //                 </Avatar>
  //                 <div className="flex-1 min-w-0">
  //                   <div className="flex items-center gap-2 mb-1">
  //                     <span className="font-medium text-sm">{message.senderName}</span>
  //                     <Badge variant="outline" className="text-xs px-1 py-0">
  //                       {message.chatType}
  //                     </Badge>
  //                   </div>
  //                   <p className="text-sm text-gray-600 truncate">{messagePreview}</p>
  //                   <p className="text-xs text-gray-400">{message.chatName}</p>
  //                 </div>
  //                 <Button
  //                   size="icon"
  //                   variant="ghost"
  //                   className="ml-2"
  //                   aria-label="View message"
  //                   onClick={() => {
  //                     router.push(`/dashboard/chat?chatId=${message.chatId}`);
  //                     setUnreadMessages(prev => prev.filter(msg => `${msg.chatId}-${msg.timestamp}` !== toastId));
  //                     shownToastsRef.current.add(toastId);
  //                   }}
  //                 >
  //                   <Eye className="h-4 w-4" />
  //                 </Button>
  //               </div>,
  //               {
  //                 duration: 8000,
  //                 onDismiss: () => {
  //                   setUnreadMessages(prev => {
  //                     const exists = prev.some(msg => `${msg.chatId}-${msg.timestamp}` === toastId);
  //                     if (!exists) {
  //                       return [...prev, message];
  //                     }
  //                     return prev;
  //                   });
  //                   shownToastsRef.current.add(toastId);
  //                 }
  //               }
  //             );
  //             shownToastsRef.current.add(toastId);
  //           }
  //         });
  //         setLastCheckTime(new Date());
  //       }
  //     }

  //     // Update total unread count
  //     const unreadResponse = await fetch('/api/chats/unread-count', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (unreadResponse.ok) {
  //       const unreadData = await unreadResponse.json();
  //       setTotalUnreadCount(unreadData.unreadCount);
  //     }
  //   } catch (error) {
  //     console.error('Error checking for new messages:', error);
  //   }
  // };

  const handleViewMessages = () => {
    router.push('/dashboard/chat');
    setUnreadMessages([]);
    setTotalUnreadCount(0);
  };

  if (totalUnreadCount === 0 && unreadMessages.length === 0) {
    return null;
  }

  const displayCount = Math.max(totalUnreadCount, unreadMessages.length);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* <Button
        onClick={handleViewMessages}
        className="relative bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 hover:scale-105"
      >
        <div className="relative">
          <MessageSquare className="h-5 w-5" />
          {displayCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
              {displayCount > 9 ? '9+' : displayCount}
            </div>
          )}
        </div>
        <span className="font-medium">
          {displayCount === 1 ? '1 new message' : `${displayCount} new messages`}
        </span>
      </Button> */}
    </div>
  );
}