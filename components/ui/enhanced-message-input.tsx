'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Camera, 
  MapPin, 
  Calendar,
  X,
  Reply,
  AtSign,
  Hash,
  Bold,
  Italic,
  Underline,
  Share
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Message {
  messageId: string;
  senderId: { name: string };
  content: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface EnhancedMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, replyTo?: Message) => void;
  onFileUpload: () => void;
  onLeadShare: () => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  participants?: User[];
  disabled?: boolean;
  placeholder?: string;
}

export default function EnhancedMessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  onLeadShare,
  replyingTo,
  onCancelReply,
  participants = [],
  disabled = false,
  placeholder = "Type a message..."
}: EnhancedMessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const EMOJI_LIST = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '🔥', '💯', '💫', '⭐', '🌟', '✨', '⚡', '💥', '💢', '💨'
  ];

  useEffect(() => {
    // Check for mentions
    const lastAtIndex = value.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1 && lastAtIndex === cursorPosition - mentionQuery.length - 1) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [value, cursorPosition, mentionQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value, replyingTo || undefined);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const newValue = value.slice(0, cursorPosition) + emoji + value.slice(cursorPosition);
    onChange(newValue);
    setShowEmojiPicker(false);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
      }
    }, 0);
  };

  const handleMentionSelect = (user: User) => {
    const lastAtIndex = value.lastIndexOf('@', cursorPosition);
    const beforeMention = value.slice(0, lastAtIndex);
    const afterMention = value.slice(cursorPosition);
    const newValue = beforeMention + `@${user.name} ` + afterMention;
    
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    
    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = lastAtIndex + user.name.length + 2;
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const filteredParticipants = participants.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatText = (type: 'bold' | 'italic' | 'underline') => {
    if (!inputRef.current) return;
    
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      let formattedText = '';
      switch (type) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'underline':
          formattedText = `__${selectedText}__`;
          break;
      }
      
      const newValue = value.slice(0, start) + formattedText + value.slice(end);
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-700">
                  Replying to {replyingTo.senderId.name}
                </p>
                <p className="text-xs text-blue-600 truncate max-w-md">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFileUpload}
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <Paperclip className="h-3 w-3" />
          File
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLeadShare}
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <Share className="h-3 w-3" />
          Lead
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <Mic className="h-3 w-3" />
          Voice
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <Camera className="h-3 w-3" />
          Photo
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          Location
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 flex items-center gap-1"
        >
          <Calendar className="h-3 w-3" />
          Schedule
        </Button>
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <Bold className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <Italic className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <Underline className="h-3 w-3" />
        </Button>
      </div>

      {/* Message Input */}
      <div className="flex items-end gap-3 relative">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCursorPosition(e.target.selectionStart || 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder={replyingTo ? `Reply to ${replyingTo.senderId.name}...` : placeholder}
            disabled={disabled}
            className="pr-20 py-3 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            onSelect={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Mention Button */}
            <Popover open={showMentions} onOpenChange={setShowMentions}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => {
                    const newValue = value + '@';
                    onChange(newValue);
                    setCursorPosition(newValue.length);
                    setShowMentions(true);
                  }}
                >
                  <AtSign className="h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 px-2 py-1">Mention someone</p>
                  {filteredParticipants.map(user => (
                    <div
                      key={user._id}
                      onClick={() => handleMentionSelect(user)}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <Smile className="h-4 w-4 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button 
          onClick={() => onSend(value, replyingTo || undefined)} 
          disabled={disabled || !value.trim()}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 p-0 transition-all duration-200 hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character Count */}
      {value.length > 0 && (
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            {value.length > 500 && `${value.length}/1000 characters`}
          </span>
          {value.length > 800 && (
            <Badge variant="outline" className={`text-xs ${value.length > 950 ? 'text-red-600' : 'text-orange-600'}`}>
              {value.length > 950 ? 'Character limit approaching' : 'Long message'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}