'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare, FileText, Image, Video, Share, Clock, User, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  chatId: string;
  chatName: string;
  chatType: string;
  messageId: string;
  content: string;
  senderName: string;
  timestamp: string;
  messageType: string;
}

interface ChatSearchProps {
  onSelectChat: (chatId: string) => void;
}

export default function ChatSearch({ onSelectChat }: ChatSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('chatSearchHistory');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.trim() && query.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchChats();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectChat(result.chatId);
    setIsOpen(false);
    
    // Add to recent searches
    const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('chatSearchHistory', JSON.stringify(newSearches));
    
    setQuery('');
    setResults([]);
  };

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'file':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'image':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'lead_share':
        return <Share className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserColor = (chatId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = chatId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Messages
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search messages, files, or chat names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearch(search)}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1 overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No messages found</p>
                <p className="text-sm text-gray-400">Try different keywords or check spelling</p>
              </div>
            )}

            {!loading && query.length < 2 && recentSearches.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Search your messages</p>
                <p className="text-sm text-gray-400">Type at least 2 characters to search</p>
              </div>
            )}

            <ScrollArea className="h-full">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Chat Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${getUserColor(result.chatId)} text-white text-sm font-medium`}>
                          {result.chatType === 'group' ? <User className="h-5 w-5" /> : getUserInitials(result.chatName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Chat Info */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{result.chatName}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {result.chatType}
                          </Badge>
                          {getMessageTypeIcon(result.messageType)}
                        </div>
                        
                        {/* Message Preview */}
                        <div className="mb-2">
                          <p className="text-xs text-blue-600 font-medium mb-1">
                            <User className="h-3 w-3 inline mr-1" />
                            {result.senderName}
                          </p>
                          <p className="text-sm text-gray-700 break-words line-clamp-2">
                            {highlightText(result.content, query)}
                          </p>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatTime(result.timestamp)}
                        </div>
                      </div>

                      {/* Hover Action */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}