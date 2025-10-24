import { NextRequest, NextResponse } from 'next/server';
import dropboxService from '@/utils/dropboxService';

export async function GET(req: NextRequest) {
  try {
    // Test the connection by trying to get account info
    const response = await dropboxService.getCurrentAccount();
    return NextResponse.json({ 
      success: true,
      account: response.result
    });
  } catch (error: any) {
    console.error('Dropbox authentication check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.error?.error_description || 'Authentication failed'
    }, { 
      status: 401 
    });
  }
}