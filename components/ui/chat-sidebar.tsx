'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search,
  MessageSquare,
  Users,
  Plus,
  Star,
  Archive,
  Filter,
  MoreVertical,
  Pin,
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Chat {
  _id: string;
  chatId: string;
  chatType: 'direct' | 'group';
  chatName?: string;
  participants: User[];
  lastMessage?: {
    content: string;
    senderId: { name: string };
    timestamp: string;
  };
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  currentUser: User | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

export default function ChatSidebar({
  chats,
  selectedChat,
  currentUser,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  filter,
  onFilterChange
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

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

  const getChatDisplayName = (chat: Chat) => {
    if (chat.chatType === 'group') {
      return chat.chatName || `Group: ${chat.participants.map(p => p.name).join(', ')}`;
    }
    
    const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
    return otherParticipant?.name || 'Unknown User';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat => {
    const displayName = getChatDisplayName(chat);
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    switch (filter) {
      case 'unread':
        return matchesSearch && (chat.unreadCount || 0) > 0;
      case 'starred':
        return matchesSearch && chat.isPinned;
      case 'archived':
        return matchesSearch && chat.isArchived;
      case 'direct':
        return matchesSearch && chat.chatType === 'direct';
      case 'group':
        return matchesSearch && chat.chatType === 'group';
      default:
        return matchesSearch && !chat.isArchived;
    }
  });

  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
            {totalUnread > 0 && (
              <p className="text-sm text-gray-500">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
            )}
          </div>
          <Button
            onClick={onNewChat}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: MessageSquare },
            { key: 'unread', label: 'Unread', icon: Badge },
            { key: 'starred', label: 'Starred', icon: Star },
            { key: 'direct', label: 'Direct', icon: MessageSquare },
            { key: 'group', label: 'Groups', icon: Users },
            { key: 'archived', label: 'Archived', icon: Archive }
          ].map(filterOption => {
            const Icon = filterOption.icon;
            const count = chats.filter(chat => {
              switch (filterOption.key) {
                case 'unread': return (chat.unreadCount || 0) > 0;
                case 'starred': return chat.isPinned;
                case 'direct': return chat.chatType === 'direct';
                case 'group': return chat.chatType === 'group';
                case 'archived': return chat.isArchived;
                default: return !chat.isArchived;
              }
            }).length;

            return (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange(filterOption.key)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Icon className="h-3 w-3" />
                {filterOption.label}
                {count > 0 && filterOption.key !== 'all' && (
                  <Badge className="bg-gray-500 text-white text-xs ml-1 px-1 py-0">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.map((chat) => {
            const otherParticipant = chat.chatType === 'direct' 
            ? chat.participants.find(p => p._id !== currentUser?._id)
            : null;
            const displayName = otherParticipant ? otherParticipant.name : "getChatDisplayName(chat)";
            
            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 relative ${
                  selectedChat?._id === chat._id 
                    ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {/* Pin Indicator */}
                {chat.isPinned && (
                  <div className="absolute top-2 right-2">
                    <Pin className="h-3 w-3 text-blue-500" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* Chat Avatar */}
                  <div className="relative">
                    {chat.chatType === 'group' ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`${getUserColor(otherParticipant?._id || '')} text-white font-medium`}>
                          {getUserInitials(otherParticipant?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Online Status for Direct Chats */}
                    {chat.chatType === 'direct' && otherParticipant && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"></div>
                    )}
                    
                    {/* Unread Badge */}
                    {(chat.unreadCount || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {(chat.unreadCount || 0) > 9 ? '9+' : chat.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate pr-2" title={displayName}>
                        {displayName}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {chat.chatType}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {chat.participants.length} member{chat.participants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {chat.lastMessage && chat.lastMessage.senderId && (
                      <p className="text-xs text-gray-500 truncate">
                        <span className="font-medium">
                          {chat.lastMessage.senderId.name === currentUser?.name ? 'You' : chat.lastMessage.senderId.name}:
                        </span> {chat.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Chat Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pin className="h-4 w-4 mr-2" />
                          {chat.isPinned ? 'Unpin' : 'Pin'} Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          {chat.isArchived ? 'Unarchive' : 'Archive'} Chat
                        </DropdownMenuItem>
                        {currentUser?.role === 'admin' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat._id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Chat
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredChats.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery ? 'Try different search terms' : 'Start a conversation to get started'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onNewChat}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}