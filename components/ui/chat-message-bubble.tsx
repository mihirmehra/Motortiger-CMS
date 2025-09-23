'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MoreVertical,
  Reply,
  Copy,
  Edit3,
  Trash2,
  Star,
  Forward,
  Check,
  CheckCheck,
  Clock,
  Smile,
  MapPin,
  Phone,
  Calendar,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChatFilePreview from '@/components/ui/chat-file-preview';

interface Message {
  messageId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'lead_share' | 'voice' | 'location';
  fileUrl?: string;
  fileName?: string;
  leadData?: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isRead: boolean;
  timestamp: string;
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  isStarred?: boolean;
  readBy?: Array<{
    userId: string;
    readAt: string;
  }>;
}

interface ChatMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  showTimestamp: boolean;
  currentUserId: string;
  totalParticipants: number;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onViewLead?: (leadId: string) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

export default function ChatMessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  showTimestamp,
  currentUserId,
  totalParticipants,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onViewLead
}: ChatMessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;
    
    const readByCount = message.readBy?.length || 0;
    
    if (readByCount === totalParticipants) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CheckCheck className="h-3 w-3 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>Read by all</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (readByCount > 1) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Check className="h-3 w-3 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>Delivered</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Clock className="h-3 w-3 text-gray-300" />
            </TooltipTrigger>
            <TooltipContent>Sent</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'text':
        return (
          <div className="text-sm whitespace-pre-wrap break-words">
            {/* Parse mentions and make them clickable */}
            {message.content.split(/(@\w+)/g).map((part, index) => 
              part.startsWith('@') ? (
                <span key={index} className={`font-semibold ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}>
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </div>
        );

      case 'file':
      case 'image':
      case 'video':
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            {message.fileUrl && (
              <ChatFilePreview
                fileUrl={message.fileUrl}
                fileName={message.fileName || 'Unknown file'}
                messageType={message.messageType}
                isOwn={isOwn}
              />
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location shared</span>
            </div>
            {message.location && (
              <div className={`p-3 rounded-lg border ${isOwn ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                <p className="text-xs text-gray-600">
                  {message.location.address || `${message.location.latitude}, ${message.location.longitude}`}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-6 px-2 text-xs"
                  onClick={() => window.open(`https://maps.google.com/?q=${message.location!.latitude},${message.location!.longitude}`, '_blank')}
                >
                  View on Map
                </Button>
              </div>
            )}
          </div>
        );

      case 'lead_share':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">📋</span>
              </div>
              <span className="text-sm font-medium">{message.content}</span>
            </div>
            {message.leadData && (
              <div className={`p-4 rounded-lg border ${isOwn ? 'border-blue-300 bg-blue-500/10' : 'border-gray-300 bg-white'}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                      Lead Information
                    </h4>
                    {onViewLead && (
                      <Button
                        size="sm"
                        variant={isOwn ? "secondary" : "outline"}
                        onClick={() => onViewLead(message.leadData._id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                  
                  <div className={`text-xs space-y-2 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Lead:</span>
                        <p className="font-mono">{message.leadData.leadNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p>{message.leadData.customerName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p>{message.leadData.phoneNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p>{message.leadData.status}</p>
                      </div>
                    </div>
                    
                    {(message.leadData.salesPrice || message.leadData.totalMargin) && (
                      <div className="pt-2 border-t border-opacity-20">
                        <div className="grid grid-cols-2 gap-2">
                          {message.leadData.salesPrice && (
                            <div>
                              <span className="font-medium">Sales:</span>
                              <p>${message.leadData.salesPrice.toLocaleString()}</p>
                            </div>
                          )}
                          {message.leadData.totalMargin && (
                            <div>
                              <span className="font-medium">Margin:</span>
                              <p>${message.leadData.totalMargin.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group hover:bg-gray-50/50 px-4 py-1 rounded-lg transition-colors`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-3 max-w-[85%]`}>
        {/* Avatar */}
        {!isOwn && (
          <div className={`${showAvatar ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${getUserColor(message.senderId._id)} text-white text-xs font-medium`}>
                      {getUserInitials(message.senderId.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{message.senderId.name}</p>
                    <p className="text-xs text-gray-500">{message.senderId.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          {showName && (
            <div className="flex items-center gap-2 mb-1 px-3">
              <span className={`text-xs font-semibold ${getUserColor(message.senderId._id).replace('bg-', 'text-')}`}>
                {message.senderId.name}
              </span>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {message.senderId.email.split('@')[0]}
              </Badge>
            </div>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <div className="text-xs text-gray-400 mb-2 px-3">
              {formatTime(message.timestamp)}
            </div>
          )}

          {/* Reply Reference */}
          {message.replyTo && (
            <div className={`mb-2 p-2 rounded-lg border-l-4 ${isOwn ? 'bg-blue-50 border-blue-400' : 'bg-gray-100 border-gray-400'} max-w-xs`}>
              <p className="text-xs font-medium text-gray-600">{message.replyTo.senderName}</p>
              <p className="text-xs text-gray-500 truncate">{message.replyTo.content}</p>
            </div>
          )}

          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm max-w-md ${
            isOwn 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
          }`}>
            {/* Message Actions */}
            <div className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-black/10">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "start" : "end"}>
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-3 w-3 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="h-3 w-3 mr-2" />
                    Forward
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="h-3 w-3 mr-2" />
                    {message.isStarred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  {isOwn && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(message)}>
                        <Edit3 className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(message.messageId)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Quick Reaction Button */}
            <div className={`absolute ${isOwn ? 'left-1' : 'right-1'} bottom-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-black/10">
                    <Smile className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align={isOwn ? "start" : "end"}>
                  <div className="flex gap-1">
                    {EMOJI_REACTIONS.map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onReaction(message.messageId, emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Message Content */}
            {renderMessageContent()}

            {/* Message Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(
                  message.reactions.reduce((acc: any, reaction) => {
                    if (!acc[reaction.emoji]) {
                      acc[reaction.emoji] = [];
                    }
                    acc[reaction.emoji].push(reaction.userName);
                    return acc;
                  }, {})
                ).map(([emoji, users]) => (
                  <TooltipProvider key={emoji}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-gray-100"
                          onClick={() => onReaction(message.messageId, emoji)}
                        >
                          {emoji} {(users as string[]).length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{(users as string[]).join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {/* Message Footer */}
            <div className={`flex items-center gap-2 mt-2 ${isOwn ? 'justify-start' : 'justify-end'}`}>
              <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                {formatTime(message.timestamp)}
              </span>
              {message.isEdited && (
                <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                  (edited)
                </span>
              )}
              {message.isStarred && (
                <Star className={`h-3 w-3 ${isOwn ? 'text-blue-200' : 'text-yellow-500'} fill-current`} />
              )}
              {isOwn && getMessageStatus()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}