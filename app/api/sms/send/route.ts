import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import SMS from '@/models/SMS';
import Lead from '@/models/Lead';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { generateUniqueId } from '@/utils/idGenerator';
import { logActivity } from '@/utils/activityLogger';
import TwilioService from '@/utils/twilioService';

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

    const { toNumber, content, leadId, customerName, mediaUrls } = await request.json();

    if (!toNumber || !content) {
      return NextResponse.json({ 
        error: 'Phone number and message content are required' 
      }, { status: 400 });
    }

    await connectDB();

    let lead = null;
    if (leadId) {
      lead = await Lead.findById(leadId);
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
    }

    const twilioService = new TwilioService();
    const smsId = generateUniqueId('SMS_');
    const formattedToNumber = twilioService.formatPhoneNumber(toNumber);

    const smsData = {
      smsId,
      messageType: 'outbound',
      fromNumber: twilioService.getPhoneNumber(),
      toNumber: formattedToNumber,
      content,
      status: 'pending',
      sentAt: new Date(),
      leadId: leadId || undefined,
      customerName: customerName || lead?.customerName || '',
      userId: user.id,
      direction: 'outbound-api',
      tags: [],
      isRead: true
    };

    const sms = new SMS(smsData);
    await sms.save();

    let twilioResponse;
    try {
      twilioResponse = await twilioService.sendSMS({
        to: formattedToNumber,
        body: content,
        mediaUrl: mediaUrls,
        statusCallback: `https://motortiger-cms.vercel.app/api/sms/webhooks/status`
      });

      sms.status = twilioResponse.status;
      sms.twilioMessageSid = twilioResponse.sid;
      sms.direction = twilioResponse.direction;
      await sms.save();
      
      await logActivity({
        userId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'create',
        module: 'leads',
        description: `Sent SMS to ${formattedToNumber}${customerName ? ` (${customerName})` : ''}`,
        targetId: sms._id.toString(),
        targetType: 'SMS',
        changes: smsData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({
        message: 'SMS sent successfully',
        sms: sms,
        twilioSid: twilioResponse.sid
      });

    } catch (twilioError: any) {
      // Update existing SMS record to 'failed' status
      sms.status = 'failed';
      sms.failureReason = twilioError.message;
      await sms.save();
      
      console.error('Twilio SMS sending failed:', twilioError);
      return NextResponse.json(
        { error: `Twilio SMS error: ${twilioError.message}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Send SMS error:', error);
    if (error.name === 'MongooseError' || error.name === 'ValidationError') {
      return NextResponse.json({ error: `SMS validation failed: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}