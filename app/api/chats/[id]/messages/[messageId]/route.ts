import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { logActivity } from '@/utils/activityLogger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

    const { content } = await request.json();

    if (!content || !content.trim()) {
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

    // Find the message
    const message = chat.messages.find((msg: any) => msg.messageId === params.messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user owns the message
    if (message.senderId.toString() !== user.id) {
      return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 });
    }

    // Check if message is too old to edit (e.g., 24 hours)
    const messageAge = new Date().getTime() - new Date(message.timestamp).getTime();
    const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (messageAge > maxEditAge) {
      return NextResponse.json({ error: 'Message is too old to edit' }, { status: 400 });
    }

    // Store original content if not already edited
    if (!message.isEdited) {
      message.originalContent = message.content;
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await chat.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: 'Edited chat message',
      targetId: chat._id.toString(),
      targetType: 'Chat',
      changes: { messageId: params.messageId, newContent: content },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ 
      message: 'Message updated successfully',
      updatedMessage: message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!chat.participants.includes(user.id as any)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the message
    const message = chat.messages.find((msg: any) => msg.messageId === params.messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user owns the message or is admin
    if (message.senderId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    // Soft delete - mark as deleted instead of removing
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';

    await chat.save();

    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'leads',
      description: 'Deleted chat message',
      targetId: chat._id.toString(),
      targetType: 'Chat',
      changes: { messageId: params.messageId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ 
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}