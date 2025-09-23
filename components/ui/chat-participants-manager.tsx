'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, UserPlus, UserMinus, Search, Crown, Shield, User as UserIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Chat {
  _id: string;
  chatType: string;
  chatName?: string;
  participants: User[];
  createdBy: string;
}

interface ChatParticipantsManagerProps {
  chat: Chat;
  currentUserId: string;
  onUpdate: () => void;
}

export default function ChatParticipantsManager({ chat, currentUserId, onUpdate }: ChatParticipantsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/chat-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users already in the chat
        const participantIds = chat.participants.map(p => p._id);
        const available = data.users.filter((user: User) => !participantIds.includes(user._id));
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chat._id,
          userIds: selectedUsers,
          action: 'add'
        })
      });

      if (response.ok) {
        toast.success(`Added ${selectedUsers.length} participant${selectedUsers.length !== 1 ? 's' : ''} successfully`);
        setSelectedUsers([]);
        onUpdate();
        loadAvailableUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add participants');
      }
    } catch (error) {
      console.error('Failed to add participants:', error);
      toast.error('Failed to add participants');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this chat?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chat._id,
          userIds: [userId],
          action: 'remove'
        })
      });

      if (response.ok) {
        toast.success(`${userName} removed successfully`);
        onUpdate();
        loadAvailableUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error('Failed to remove participant');
    } finally {
      setLoading(false);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-red-500" />;
      case 'manager':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <UserIcon className="h-3 w-3 text-green-500" />;
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const canRemoveParticipant = (participantId: string) => {
    // Creator can remove anyone except themselves
    // Admins can remove anyone
    // Others can only remove themselves
    return participantId !== chat.createdBy && 
           (currentUserId === chat.createdBy || 
            chat.participants.find(p => p._id === currentUserId)?.role === 'admin');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAvailableUsers}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Group Participants
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0 space-y-6">
          {/* Current Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
                Current Participants ({chat.participants.length})
              </Label>
              <Badge variant="outline" className="text-xs">
                {chat.chatType} chat
              </Badge>
            </div>
            
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2">
                {chat.participants.map(participant => (
                  <div key={participant._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${getUserColor(participant._id)} text-white font-medium`}>
                            {getUserInitials(participant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          {getRoleIcon(participant.role)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{participant.name}</p>
                          {participant._id === currentUserId && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-1 py-0">You</Badge>
                          )}
                          {participant._id === chat.createdBy && (
                            <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">Creator</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{participant.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {participant.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {canRemoveParticipant(participant._id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant._id, participant.name)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Add New Participants */}
          <div className="flex-1 min-h-0">
            <Label className="text-base font-semibold">Add New Participants</Label>
            
            <div className="mt-3 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users to add..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                      className="h-7 px-2 text-xs"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddParticipants}
                      disabled={loading}
                      className="h-7 px-2 text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add Selected
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Available Users List */}
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, user._id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={`${getUserColor(user._id)} text-white text-sm font-medium`}>
                                {getUserInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1">
                              {getRoleIcon(user.role)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{user.name}</p>
                            </div>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <Badge variant="outline" className="text-xs px-1 py-0 mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUsers([user._id]);
                            handleAddParticipants();
                          }}
                          disabled={loading || selectedUsers.includes(user._id)}
                          className="h-8 px-3 text-xs flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">
                        {searchUsers ? 'No users found' : 'No users available'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {searchUsers ? 'Try different search terms' : 'All users are already in this chat'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}