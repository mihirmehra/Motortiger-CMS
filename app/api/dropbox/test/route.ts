import { NextRequest, NextResponse } from 'next/server';
import dropboxService from '@/utils/dropboxService';

export async function GET(req: NextRequest) {
  try {
    // Test connection by getting account info
    const accountInfo = await dropboxService.getCurrentAccount();
    return NextResponse.json({ 
      success: true, 
      account: accountInfo.result 
    });
  } catch (error: any) {
    console.error('Dropbox test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to connect to Dropbox',
      details: error.error
    }, { 
      status: 500 
    });
  }
}