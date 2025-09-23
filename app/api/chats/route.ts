import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateChatId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';

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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: any = {
      participants: user.id,
      isActive: true
    };

    // Apply filters
    switch (filter) {
      case 'unread':
        query['messages.readBy.userId'] = { $ne: user.id };
        break;
      case 'archived':
        query.isArchived = true;
        break;
      case 'starred':
        query.isPinned = true;
        break;
      case 'direct':
        query.chatType = 'direct';
        break;
      case 'group':
        query.chatType = 'group';
        break;
      default:
        query.isArchived = { $ne: true };
    }

    // Get all chats where user is a participant
    const chats = await Chat.find(query)
      .populate('participants', 'name email role')
      .populate('lastMessage.senderId', 'name')
      .populate('createdBy', 'name email')
      .sort({ 
        isPinned: -1, // Pinned chats first
        'lastMessage.timestamp': -1 // Then by last message time
      })
      .limit(limit);

    // Calculate unread counts for each chat
    const chatsWithUnread = chats.map(chat => {
      const unreadCount = chat.messages.filter((message: any) => 
        message.senderId && 
        message.senderId.toString() !== user.id && 
        !message.readBy.some((r: any) => r.userId.toString() === user.id)
      ).length;

      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    return NextResponse.json({ chats: chatsWithUnread });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { 
      chatType, 
      participants, 
      chatName, 
      chatDescription,
      settings 
    } = await request.json();

    if (!chatType || !participants || participants.length === 0) {
      return NextResponse.json({ 
        error: 'Chat type and participants are required' 
      }, { status: 400 });
    }

    await connectDB();

    // For direct chats, check if chat already exists
    if (chatType === 'direct' && participants.length === 1) {
      const existingChat = await Chat.findOne({
        chatType: 'direct',
        participants: { $all: [user.id, participants[0]], $size: 2 },
        isActive: true
      });

      if (existingChat) {
        return NextResponse.json({ chat: existingChat });
      }
    }

    const chatData = {
      chatId: generateChatId(),
      chatType,
      chatName: chatType === 'group' ? chatName : undefined,
      chatDescription: chatType === 'group' ? chatDescription : undefined,
      participants: chatType === 'direct' ? [user.id, participants[0]] : [user.id, ...participants],
      admins: chatType === 'group' ? [user.id] : undefined,
      messages: [],
      isActive: true,
      isArchived: false,
      isPinned: false,
      createdBy: user.id,
      settings: {
        allowFileSharing: true,
        allowLeadSharing: true,
        requireApprovalForNewMembers: false,
        onlyAdminsCanMessage: false,
        ...settings
      },
      lastActivity: new Date(),
      messageCount: 0
    };

    const chat = new Chat(chatData);
    await chat.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'leads' as any,
      description: `Created ${chatType} chat${chatName ? `: ${chatName}` : ''}`,
      targetId: chat._id.toString(),
      targetType: 'Chat',
      changes: chatData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email role')
      .populate('createdBy', 'name email');

    return NextResponse.json({ 
      message: 'Chat created successfully', 
      chat: populatedChat 
    });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}