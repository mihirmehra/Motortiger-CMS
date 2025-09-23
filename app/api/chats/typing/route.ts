import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

// In-memory store for typing indicators (in production, use Redis)
const typingUsers = new Map<string, Map<string, { userName: string; timestamp: number }>>();

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { chatId, isTyping } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Map());
    }

    const chatTypingUsers = typingUsers.get(chatId)!;

    if (isTyping) {
      chatTypingUsers.set(user.id, {
        userName: user.email, // You might want to get the actual name
        timestamp: Date.now()
      });
    } else {
      chatTypingUsers.delete(user.id);
    }

    // Clean up old typing indicators (older than 5 seconds)
    const now = Date.now();
    for (const [userId, data] of Array.from(chatTypingUsers.entries())) {
      if (now - data.timestamp > 5000) {
        chatTypingUsers.delete(userId);
      }
    }

    // Get current typing users for this chat (excluding current user)
    const currentTypingUsers = Array.from(chatTypingUsers.entries())
      .filter(([userId]) => userId !== user.id)
      .map(([_, data]) => data.userName);

    return NextResponse.json({ 
      typingUsers: currentTypingUsers
    });

  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const chatTypingUsers = typingUsers.get(chatId) || new Map();
    
    // Clean up old typing indicators
    const now = Date.now();
    for (const [userId, data] of Array.from(chatTypingUsers.entries())) {
      if (now - data.timestamp > 5000) {
        chatTypingUsers.delete(userId);
      }
    }

    // Get current typing users (excluding current user)
    const currentTypingUsers = Array.from(chatTypingUsers.entries())
      .filter(([userId]) => userId !== user.id)
      .map(([_, data]) => data.userName);

    return NextResponse.json({ 
      typingUsers: currentTypingUsers
    });

  } catch (error) {
    console.error('Get typing users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}