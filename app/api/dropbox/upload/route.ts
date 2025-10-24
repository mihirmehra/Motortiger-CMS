import { NextRequest, NextResponse } from 'next/server';
import dropboxService from '@/utils/dropboxService';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DROPBOX_ACCESS_TOKEN) {
      throw new Error('Dropbox access token not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;

    if (!file || !chatId) {
      return NextResponse.json({ error: 'File and chatId are required' }, { status: 400 });
    }

    console.log('Received file upload request:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chatId
    });

    // Upload to Dropbox
    const folderPath = `/chat-uploads/${chatId}`;
    const result = await dropboxService.uploadFile(file, folderPath);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      url: result.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('File upload to Dropbox failed:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}