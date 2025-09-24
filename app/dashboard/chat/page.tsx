'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare,
  Users,
  Plus,
  Search,
  Send,
  X,
  UserPlus,
  Paperclip,
  Download,
  FileText,
  Image,
  Video,
  Share,
  Eye,
  Settings,
  Smile,
  MoreVertical,
  Phone,
  VideoIcon,
  Info,
  Archive,
  Star,
  Reply,
  Forward,
  Copy,
  Trash2,
  Edit3,
  Check,
  CheckCheck,
  Clock,
  Mic,
  Camera,
  MapPin,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LeadShareModal from '@/components/ui/lead-share-modal';
import ChatSearch from '@/components/ui/chat-search';
import ChatParticipantsManager from '@/components/ui/chat-participants-manager';
import ChatFilePreview from '@/components/ui/chat-file-preview';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  createdBy: string;
  lastMessage?: {
    content: string;
    senderId: {
      name: string;
    };
    timestamp: string;
  };
  messages: Message[];
  isArchived?: boolean;
  isPinned?: boolean;
}

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

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showLeadShare, setShowLeadShare] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'archived' | 'starred'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    loadChats();
    loadUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // useEffect(() => {
  //   if (selectedChat) {
  //     const interval = setInterval(() => {
  //       loadMessages(selectedChat._id);
  //     }, 3000); // Refresh every 3 seconds

  //     return () => clearInterval(interval);
  //   }
  // }, [selectedChat]);

  // useEffect(() => {
  //   // Simulate online status (in real app, this would be WebSocket based)
  //   const interval = setInterval(() => {
  //     setOnlineUsers(new Set(users.map(u => u._id)));
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, [users]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/chat-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setSelectedChat(data.chat);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (messageType: string = 'text', content?: string, fileData?: any, leadData?: any, replyToMessage?: Message) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim() && !fileData && !leadData) return;
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          messageType,
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          leadData,
          replyTo: replyToMessage ? {
            messageId: replyToMessage.messageId,
            content: replyToMessage.content,
            senderName: replyToMessage.senderId.name
          } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.chat.messages);
        setNewMessage('');
        setReplyingTo(null);
        loadChats(); // Refresh chat list to update last message
        
        // Show notification for successful send
        if (messageType === 'file') {
          toast.success('File shared successfully');
        } else if (messageType === 'lead_share') {
          toast.success('Lead details shared successfully');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('module', 'chats');
      formData.append('targetId', selectedChat?._id || '');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedFile = data.files[0];
        
        await sendMessage(
          getFileMessageType(file.type),
          `📎 ${uploadedFile.originalName}`,
          {
            fileUrl: uploadedFile.filePath,
            fileName: uploadedFile.originalName
          }
        );
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      setShowFileUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileMessageType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleLeadShare = async (leadData: any) => {
    await sendMessage('lead_share', `📋 Shared lead: ${leadData.customerName} (${leadData.leadNumber})`, undefined, leadData);
    setShowLeadShare(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Chat deleted successfully');
        setSelectedChat(null);
        setMessages([]);
        loadChats();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const createChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (newChatType === 'group' && !groupChatName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatType: newChatType,
          participants: selectedUsers,
          chatName: newChatType === 'group' ? groupChatName : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewChatModal(false);
        setSelectedUsers([]);
        setGroupChatName('');
        loadChats();
        setSelectedChat(data.chat);
        loadMessages(data.chat._id);
        toast.success('Chat created successfully');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    // This would be implemented with a dedicated API endpoint
    toast.success(`Reacted with ${emoji}`);
    setShowEmojiPicker(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message.messageId);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    // This would be implemented with a dedicated API endpoint
    toast.success('Message updated');
    setEditingMessage(null);
    setEditContent('');
  };

  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.chatType === 'group') {
      return chat.chatName || `Group: ${chat.participants.map(p => p.name).join(', ')}`;
    }
    // If exactly 2 participants, always show the second one (index 1)
    if (chat.participants.length === 2) {
      const otherParticipant = chat.participants.find(
        (p) => p.name !== currentUser?.name
      );
      if (otherParticipant) {
        return otherParticipant.name;
      }
    }
    // Fallback: show the first participant who is not the current user
    const otherParticipant = chat.participants.find(p => p.name !== currentUser?.name);
    return otherParticipant?.name || 'Unknown User';
  };


  const getOtherParticipant = (chat: Chat) => {
    if (chat.participants.length === 2) {
      const otherParticipant = chat.participants.find(
        (p) => p.name !== currentUser?.name
      );
      if (otherParticipant) {
        return otherParticipant._id;
      }
    }
  };

  
  const getRecipientName = () => {
    if (newChatType === 'direct' && selectedUsers.length === 1) {
      const recipient = users.find(u => u._id === selectedUsers[0]);
      return recipient?.name || 'Unknown User';
    }
    return '';
  };


  const getUnreadCount = (chat: Chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter((message: any) => 
      message.senderId && 
      message.senderId._id !== currentUser?._id && 
      !message.readBy?.some((r: any) => r.userId === currentUser?._id)
    ).length;
  };

  const getMessageStatus = (message: Message) => {
    if (!message.senderId || message.senderId._id !== currentUser?._id) return null;
    
    const readByCount = message.readBy?.length || 0;
    const totalParticipants = selectedChat?.participants.length || 0;
    
    if (readByCount === totalParticipants) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (readByCount > 1) {
      return <Check className="h-3 w-3 text-gray-400" />;
    } else {
      return <Clock className="h-3 w-3 text-gray-300" />;
    }
  };

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

  const isOnline = (userId: string) => onlineUsers.has(userId);

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

  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.senderId._id === currentUser?._id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    const showAvatar = !isOwn && (
      !nextMessage || 
      nextMessage.senderId._id !== message.senderId._id ||
      new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() > 300000 // 5 minutes
    );
    
    const showName = !isOwn && selectedChat?.chatType === 'group' && (
      !prevMessage || 
      prevMessage.senderId._id !== message.senderId._id ||
      new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000 // 5 minutes
    );

    const showTimestamp = !prevMessage || 
      new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000; // 5 minutes

    return (
      <div key={message.messageId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group hover:bg-gray-50/50 px-4 py-1 rounded-lg transition-colors`}>
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%]`}>
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
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${isOnline(message.senderId._id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs">{isOnline(message.senderId._id) ? 'Online' : 'Offline'}</span>
                      </div>
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
                <span className="text-xs font-semibold" style={{ color: getUserColor(message.senderId._id).replace('bg-', '#') }}>
                  {message.senderId.name}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline(message.senderId._id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-400">{isOnline(message.senderId._id) ? 'Online' : 'Offline'}</span>
                </div>
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
              <div className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "start" : "end"}>
                    <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                      <Reply className="h-3 w-3 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                      <Copy className="h-3 w-3 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEmojiPicker(message.messageId)}>
                      <Smile className="h-3 w-3 mr-2" />
                      React
                    </DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                          <Edit3 className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Message Content */}
              {editingMessage === message.messageId ? (
                <div className="space-y-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2 text-xs">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)} className="h-6 px-2 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {message.messageType === 'text' && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  
                  {(message.messageType === 'file' || message.messageType === 'image' || message.messageType === 'video') && (
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
                  )}
                  
                  {message.messageType === 'lead_share' && message.leadData && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">{message.content}</p>
                      <div className={`p-4 rounded-lg border ${isOwn ? 'border-blue-300 bg-blue-500/10' : 'border-gray-300 bg-white'}`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              📋 Lead Details
                            </h4>
                            <Button
                              size="sm"
                              variant={isOwn ? "secondary" : "outline"}
                              onClick={() => router.push(`/dashboard/leads/${message.leadData._id}`)}
                              className="h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
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
                    </div>
                  )}
                </>
              )}

              {/* Message Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((reaction, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                      {reaction.emoji} {reaction.userName}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Timestamp and Status */}
              <div className={`flex items-center gap-1 mt-2 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </span>
                {message.isEdited && (
                  <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                    (edited)
                  </span>
                )}
                {isOwn && getMessageStatus(message)}
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker === message.messageId && (
              <div className="mt-2 p-2 bg-white border rounded-lg shadow-lg flex gap-1">
                {EMOJI_REACTIONS.map(emoji => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(message.messageId, emoji)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredUsers = users.filter(user => 
    user._id !== currentUser?._id &&
    user.name.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredChats = chats.filter(chat => {
    switch (chatFilter) {
      case 'unread':
        return getUnreadCount(chat) > 0;
      case 'archived':
        return chat.isArchived;
      case 'starred':
        return chat.isPinned;
      default:
        return !chat.isArchived;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">Stay connected with your team</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ChatSearch onSelectChat={(chatId) => {
              const chat = chats.find(c => c._id === chatId);
              if (chat) {
                setSelectedChat(chat);
                loadMessages(chatId);
              }
            }} />
            
            <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Chat Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={newChatType === 'direct' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setNewChatType('direct');
                            setSelectedUsers([]); // Clear users when switching to direct
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Direct Chat
                      </Button>
                      <Button
                        variant={newChatType === 'group' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setNewChatType('group');
                            setSelectedUsers([]); // Clear users when switching to group
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Group Chat
                      </Button>
                    </div>
                  </div>

                  {newChatType === 'group' && (
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={groupChatName}
                        onChange={(e) => setGroupChatName(e.target.value)}
                        placeholder="Enter group name"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {newChatType === 'direct' && selectedUsers.length === 1 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                              <AvatarFallback className={`${getUserColor(selectedUsers[0])} text-white font-medium`}>
                                  {getUserInitials(getRecipientName())}
                              </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                  Sending a direct message to:
                              </p>
                              <p className="font-semibold text-blue-600">{getRecipientName()}</p>
                          </div>
                      </div>
                  )}


                  <div>
                    <Label>Search Users</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Select Users ({selectedUsers.length} selected)</Label>
                    <ScrollArea className="h-48 mt-1 border rounded-md p-2">
                      {filteredUsers.map(user => (
                        <label key={user._id} className="flex items-center space-x-3 mb-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (newChatType === 'direct') {
                                  setSelectedUsers([user._id]);
                                } else {
                                  setSelectedUsers(prev => [...prev, user._id]);
                                }
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`${getUserColor(user._id)} text-white text-xs`}>
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isOnline(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-500">{isOnline(user._id) ? 'Online' : 'Offline'}</span>
                          </div>
                        </label>
                      ))}
                    </ScrollArea>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSelectedUsers([]);
                        setGroupChatName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createChat}>
                      Create Chat
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Chat Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-1 mb-3">
              {[
                { key: 'all', label: 'All', icon: MessageSquare },
                { key: 'unread', label: 'Unread', icon: Badge },
                { key: 'starred', label: 'Starred', icon: Star },
                { key: 'archived', label: 'Archived', icon: Archive }
              ].map(filter => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.key}
                    variant={chatFilter === filter.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChatFilter(filter.key as any)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredChats.map((chat) => {
                const unreadCount = getUnreadCount(chat);
                const displayName = getChatDisplayName(chat);
                const otherParticipant = getOtherParticipant(chat);
                
                return (
                  <div
                    key={chat._id}
                    onClick={() => loadMessages(chat._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                      selectedChat?._id === chat._id 
                        ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Chat Avatar */}
                      <div className="relative">
                        {chat.chatType === 'group' ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className={`${getUserColor(getChatDisplayName(chat))} text-white font-medium`}>
                              {getUserInitials(getChatDisplayName(chat) || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        {/* Online Status */}
                        {chat.chatType === 'direct' && otherParticipant && (
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnline(otherParticipant) ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        )}
                        
                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate" title={displayName}>
                            {displayName}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-400">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {chat.chatType}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {chat.participants.length} participant{chat.participants.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {chat.lastMessage && chat.lastMessage.senderId && (
                          <p className="text-xs text-gray-500 truncate">
                            <span className="font-medium">{chat.lastMessage.senderId.name}:</span> {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredChats.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No chats found</p>
                  <p className="text-sm text-gray-400 mb-4">Start a conversation to get started</p>
                  <Button
                    onClick={() => setShowNewChatModal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Chat Avatar */}
                    {selectedChat.chatType === 'group' ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${getUserColor(selectedChat.participants.find(p => p.name !== currentUser?.name)?._id || '')} text-white font-medium`}>
                            {getUserInitials(getChatDisplayName(selectedChat))}
                          </AvatarFallback>
                        </Avatar>
                        {selectedChat.chatType === 'direct' && (
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            isOnline(selectedChat.participants.find(p => p.name !== currentUser?.name)?._id || '') ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg text-gray-900">{getChatDisplayName(selectedChat)}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{selectedChat.participants.length} participant{selectedChat.participants.length !== 1 ? 's' : ''}</span>
                        {selectedChat.chatType === 'direct' && (
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isOnline(selectedChat.participants.find(p => p.name !== currentUser?.name)?._id || '') ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {isOnline(selectedChat.participants.find(p => p.name !== currentUser?.name)?._id || '') ? 'Online' : 'Last seen recently'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Chat Actions */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start voice call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <VideoIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start video call</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Chat info</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {selectedChat.chatType === 'group' && (
                      <ChatParticipantsManager
                        chat={selectedChat}
                        currentUserId={currentUser?._id || ''}
                        onUpdate={() => {
                          loadChats();
                          loadMessages(selectedChat._id);
                        }}
                      />
                    )}

                    {currentUser?.role === 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            {selectedChat.isPinned ? 'Unpin' : 'Pin'} Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            {selectedChat.isArchived ? 'Unarchive' : 'Archive'} Chat
                          </DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChat(selectedChat._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 px-2 py-4">
                  <div className="space-y-1">
                    {messages.map((message, index) => renderMessage(message, index))}
                    
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start mb-4 px-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-6 py-2 bg-blue-50 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Reply className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-blue-700">Replying to {replyingTo.senderId.name}</p>
                          <p className="text-xs text-blue-600 truncate max-w-md">{replyingTo.content}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mb-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFileUpload(true)}
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <Paperclip className="h-3 w-3" />
                            File
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLeadShare(true)}
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <Share className="h-3 w-3" />
                            Lead
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share lead details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <Mic className="h-3 w-3" />
                            Voice
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send voice message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <Camera className="h-3 w-3" />
                            Photo
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Take photo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            Location
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share location</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            Schedule
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Schedule message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Message Input */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        placeholder={replyingTo ? `Replying to ${replyingTo.senderId.name}...` : "Type a message..."}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage('text', undefined, undefined, undefined, replyingTo ?? undefined);
                          }
                        }}
                        className="pr-12 py-3 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      
                      {/* Emoji Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Smile className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>

                    <Button 
                      onClick={() => sendMessage('text', undefined, undefined, undefined, replyingTo ?? undefined)} 
                      disabled={!newMessage.trim()}
                      className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Character Count */}
                  {newMessage.length > 0 && (
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${newMessage.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                        {newMessage.length}/1000
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Messages</h3>
                <p className="text-gray-600 mb-6">Select a conversation to start messaging, or create a new chat to connect with your team.</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Browse Users
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Share File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select File</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept="*/*"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports documents, images, videos and other file types (Max 50MB)
              </p>
            </div>
            
            {uploadingFile && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading file...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Share Modal */}
      <LeadShareModal
        isOpen={showLeadShare}
        onClose={() => setShowLeadShare(false)}
        onShare={handleLeadShare}
      />
    </div>
  );
}