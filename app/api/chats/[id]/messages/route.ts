import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateMessageId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const chat = await Chat.findById(params.id)
      .populate('messages.senderId', 'name email')
      .populate('participants', 'name email role');

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!chat.participants.some((p: any) => p._id.toString() === user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Mark messages as read for this user
    let hasUnreadMessages = false;
    chat.messages.forEach((message: any) => {
      if (message.senderId && message.senderId._id && message.senderId._id.toString() !== user.id) {
        const alreadyRead = message.readBy.some((r: any) => r.userId.toString() === user.id);
        if (!alreadyRead) {
          message.readBy.push({
            userId: user.id,
            readAt: new Date()
          });
          hasUnreadMessages = true;
        }
      }
    });

    if (hasUnreadMessages) {
      await chat.save();
    }

    return NextResponse.json({ 
      chat,
      messages: chat.messages 
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      content, 
      messageType = 'text', 
      fileUrl, 
      fileName, 
      leadData,
      replyTo,
      scheduledFor,
      location
    } = await request.json();

    if (!content && !fileUrl && !leadData && !location) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!chat.participants.includes(user.id as any)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const message = {
      messageId: generateMessageId(),
      senderId: user.id,
      content: content || '',
      messageType,
      fileUrl,
      fileName,
      leadData,
      replyTo,
      location,
      isRead: false,
      readBy: [{
        userId: user.id,
        readAt: new Date()
      }],
      timestamp: scheduledFor ? new Date(scheduledFor) : new Date(),
      reactions: [],
      isStarred: false,
      isEdited: false
    };

    chat.messages.push(message as any);
    chat.lastMessage = {
      content: content || `${messageType === 'file' ? '📎' : messageType === 'image' ? '🖼️' : messageType === 'video' ? '🎥' : messageType === 'lead_share' ? '📋' : '📍'} ${messageType === 'text' ? content : messageType === 'lead_share' ? 'Shared lead details' : 'Shared a file'}`,
      senderId: user.id as any,
      timestamp: new Date()
    };

    await chat.save();

    // Enhanced activity logging
    let activityDescription = '';
    switch (messageType) {
      case 'file':
      case 'image':
      case 'video':
        activityDescription = `Shared ${messageType} in chat: ${fileName}`;
        break;
      case 'lead_share':
        activityDescription = `Shared lead details in chat: ${leadData?.customerName} (${leadData?.leadNumber})`;
        break;
      case 'location':
        activityDescription = 'Shared location in chat';
        break;
      default:
        activityDescription = `Sent message in ${chat.chatType} chat`;
    }

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'create',
      module: 'leads',
      description: activityDescription,
      targetId: chat._id.toString(),
      targetType: 'Chat',
      changes: { messageType, fileName, fileUrl, leadData, replyTo },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('messages.senderId', 'name email')
      .populate('participants', 'name email role');

    return NextResponse.json({ 
      message: 'Message sent successfully',
      chat: populatedChat,
      newMessage: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}