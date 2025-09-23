import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Chat from '@/models/Chat';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';

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

    const { messageId, emoji, action } = await request.json();

    if (!messageId || !emoji || !action) {
      return NextResponse.json({ 
        error: 'Message ID, emoji, and action are required' 
      }, { status: 400 });
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
    const message = chat.messages.find((msg: any) => msg.messageId === messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (action === 'add') {
      // Check if user already reacted with this emoji
      const existingReaction = message.reactions?.find(
        (r: any) => r.userId.toString() === user.id && r.emoji === emoji
      );

      if (!existingReaction) {
        if (!message.reactions) {
          message.reactions = [];
        }
        message.reactions.push({
          emoji,
          userId: user.id as any,
          userName: user.email, // You might want to get the actual name
          createdAt: new Date()
        });
      }
    } else if (action === 'remove') {
      if (message.reactions) {
        message.reactions = message.reactions.filter(
          (r: any) => !(r.userId.toString() === user.id && r.emoji === emoji)
        );
      }
    }

    await chat.save();

    return NextResponse.json({ 
      message: 'Reaction updated successfully',
      reactions: message.reactions 
    });

  } catch (error) {
    console.error('Update reaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}