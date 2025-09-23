import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';
import { Call as VonageCall } from '@vonage/voice';

// Define a type for Vonage configuration
interface VonageConfig {
  apiKey: string;
  apiSecret: string;
  applicationId: string;
  privateKey: string;
}

// Define the interface for your call options
interface CallOptions {
  to: string;
  from: string;
  answerUrl: string;
  eventUrl?: string;
  machineDetection?: 'continue' | 'hangup';
  lengthTimer?: number;
  ringingTimer?: number;
}

// Define the interface for the response
interface CallResponse {
  uuid: string;
  status: string;
  direction: string;
  conversationUuid: string;
}

export class VonageService {
  private vonage: Vonage;
  private config: VonageConfig;

  constructor() {
    this.config = {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      applicationId: process.env.VONAGE_APPLICATION_ID || '',
      privateKey: process.env.VONAGE_PRIVATE_KEY || ''
    };

    // Use Vonage constructor with applicationId and privateKey
    this.vonage = new Vonage(
      new Auth({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        applicationId: this.config.applicationId,
        privateKey: this.config.privateKey
      })
    );
  }

  // Make an outbound call
  async makeCall(options: CallOptions): Promise<CallResponse> {
    try {
      const response = await this.vonage.voice.createOutboundCall({
        to: [{ type: 'phone', number: options.to }],
        from: { type: 'phone', number: options.from },
        answer_url: [options.answerUrl],
        event_url: options.eventUrl ? [options.eventUrl] : undefined,
        advanced_machine_detection: options.machineDetection ? { behavior: options.machineDetection } : undefined,
        length_timer: options.lengthTimer,
        ringing_timer: options.ringingTimer
      });

      // The response from Vonage is an array of calls, so we take the first one
      const callResponse = response.calls[0];

      return {
        uuid: callResponse.uuid,
        status: callResponse.status,
        direction: callResponse.direction,
        conversationUuid: callResponse.conversation_uuid
      };
    } catch (error) {
      console.error('Vonage call error:', error);
      throw new Error('Failed to initiate call');
    }
  }

  // Hang up an ongoing call
  async hangupCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.hangupCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage hangup error:', error);
      return false;
    }
  }

  // Transfer a call to another number
  async transferCall(callUuid: string, destination: string): Promise<boolean> {
    try {
      await this.vonage.voice.transferCall(callUuid, {
        action: 'transfer',
        destination: {
          type: 'ncco',
          ncco: this.generateNCCO({ connectTo: destination })
        }
      });
      return true;
    } catch (error) {
      console.error('Vonage transfer error:', error);
      return false;
    }
  }

  // Mute a call
  async muteCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.muteCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage mute error:', error);
      return false;
    }
  }

  // Unmute a call
  async unmuteCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.unmuteCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage unmute error:', error);
      return false;
    }
  }

  // Get details for a specific call
  async getCallDetails(callUuid: string): Promise<VonageCall> {
    try {
      const response = await this.vonage.voice.getCall(callUuid);
      return response;
    } catch (error) {
      console.error('Vonage get call details error:', error);
      throw new Error('Failed to get call details');
    }
  }

  // Get a call recording
  async getCallRecording(recordingUrl: string): Promise<Buffer> {
    try {
      const auth = new Auth({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret
      });
      const headers = { 'Authorization': auth.basicAuth };

      const response = await fetch(recordingUrl, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch recording: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Vonage get recording error:', error);
      throw new Error('Failed to get call recording');
    }
  }

  // Generate a call control object (NCCO)
  generateNCCO(options: {
    recordCall?: boolean;
    recordingEventUrl?: string;
    connectTo?: string;
    message?: string;
  }) {
    const ncco: any[] = [];

    if (options.message) {
      ncco.push({
        action: 'talk',
        text: options.message,
        voiceName: 'Amy'
      });
    }

    if (options.recordCall) {
      ncco.push({
        action: 'record',
        eventUrl: options.recordingEventUrl ? [options.recordingEventUrl] : undefined,
        split: 'conversation',
        channels: 1,
        format: 'mp3',
        endOnSilence: 3,
        endOnKey: '#',
        timeOut: 7200,
        beepStart: true
      });
    }

    if (options.connectTo) {
      ncco.push({
        action: 'connect',
        from: process.env.VONAGE_PHONE_NUMBER,
        endpoint: [{
          type: 'phone',
          number: options.connectTo
        }]
      });
    }

    return ncco;
  }
}

export default VonageService;