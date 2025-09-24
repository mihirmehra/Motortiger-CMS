'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Phone, MessageSquare, Settings, BarChart3, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Play, Pause, Download, Clock, User, Calendar, Search, Filter, Trash2, Eye, ArrowLeft, Backpack as Backspace } from 'lucide-react';
import PhoneDialer from '@/components/ui/phone-dialer';
import SMSComposer from '@/components/ui/sms-composer';
import CallControls from '@/components/ui/call-controls';
import { toast } from 'sonner';

interface Call {
  _id: string;
  callId: string;
  callType: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  duration: number;
  status: string;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
  recordingDuration?: number;
  customerName?: string;
  notes?: string;
  userId: {
    name: string;
    email: string;
  };
  leadId?: {
    leadNumber: string;
    customerName: string;
  };
}

interface SMS {
  _id: string;
  smsId: string;
  messageType: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  content: string;
  status: string;
  sentAt: string;
  customerName?: string;
  userId: {
    name: string;
    email: string;
  };
}

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  phoneNumber: string;
}

interface TelecomStats {
  calls: {
    total: number;
    today: number;
    completed: number;
    missed: number;
    totalDuration: number;
    averageDuration: number;
  };
  sms: {
    total: number;
    today: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  };
}

export default function PhoneSystemPage() {
  const [activeTab, setActiveTab] = useState('softphone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsRecipient, setSmsRecipient] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [smsMessages, setSmsMessages] = useState<SMS[]>([]);
  const [stats, setStats] = useState<TelecomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callSearch, setCallSearch] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const [smsSearch, setSmsSearch] = useState('');
  const [smsStatusFilter, setSmsStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  useEffect(() => {
    loadCalls();
  }, [callSearch, callStatusFilter, currentPage]);

  useEffect(() => {
    loadSMS();
  }, [smsSearch, smsStatusFilter]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load leads for phone number selection
      const leadsResponse = await fetch('/api/leads?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(callSearch && { search: callSearch }),
        ...(callStatusFilter && { status: callStatusFilter })
      });

      const response = await fetch(`/api/calls?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls);
      }
    } catch (error) {
      console.error('Failed to load calls:', error);
    }
  };

  const loadSMS = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: '20',
        ...(smsSearch && { search: smsSearch }),
        ...(smsStatusFilter && { status: smsStatusFilter })
      });

      const response = await fetch(`/api/sms?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load SMS:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calls/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleNumberClick = (number: string) => {
    setPhoneNumber(prev => prev + number);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const startCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calls/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toNumber: phoneNumber,
          leadId: selectedLead?._id,
          customerName: selectedLead?.customerName,
          recordCall: isRecording
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCall(data.call);
        setCallDuration(0);
        
        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        
        toast.success('Call initiated successfully');
        loadCalls(); // Refresh call history
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const endCall = async () => {
    if (!currentCall) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calls/${currentCall._id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: '',
          tags: []
        })
      });

      if (response.ok) {
        setCurrentCall(null);
        setCallDuration(0);
        
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
        }
        
        toast.success('Call ended successfully');
        loadCalls(); // Refresh call history
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  const toggleMute = async () => {
    if (!currentCall) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = isMuted ? 'unmute' : 'mute';
      
      const response = await fetch(`/api/calls/${currentCall._id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsMuted(!isMuted);
        toast.success(`Call ${isMuted ? 'unmuted' : 'muted'}`);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const sendSMS = async () => {
    if (!smsRecipient.trim() || !smsContent.trim()) {
      toast.error('Please enter recipient and message');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toNumber: smsRecipient,
          content: smsContent,
          leadId: selectedLead?._id,
          customerName: selectedLead?.customerName
        })
      });

      if (response.ok) {
        setSmsContent('');
        toast.success('SMS sent successfully');
        loadSMS(); // Refresh SMS history
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setPhoneNumber(lead.phoneNumber);
    setSmsRecipient(lead.phoneNumber);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'missed': 'bg-red-100 text-red-800',
      'busy': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'no-answer': 'bg-orange-100 text-orange-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'ringing': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSMSStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'delivered': 'bg-green-100 text-green-800',
      'sent': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'received': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const playRecording = async (recordingUrl: string, callId: string) => {
    try {
      if (playingRecording === callId) {
        // Stop current recording
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingRecording(null);
        return;
      }

      // Stop any currently playing recording
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio element
      audioRef.current = new Audio(recordingUrl);
      audioRef.current.onended = () => {
        setPlayingRecording(null);
      };
      audioRef.current.onerror = () => {
        toast.error('Failed to play recording');
        setPlayingRecording(null);
      };

      await audioRef.current.play();
      setPlayingRecording(callId);
    } catch (error) {
      console.error('Error playing recording:', error);
      toast.error('Failed to play recording');
    }
  };

  const downloadRecording = async (recordingUrl: string, callId: string) => {
    try {
      const link = document.createElement('a');
      link.href = recordingUrl;
      link.download = `call_recording_${callId}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading phone system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phone System</h1>
              <p className="text-gray-600">Integrated voice calls and SMS messaging</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/phone/analytics')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/phone/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="softphone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Softphone
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="call-history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Call History
            </TabsTrigger>
            <TabsTrigger value="recordings" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Recordings
            </TabsTrigger>
          </TabsList>

          {/* Softphone Tab */}
          <TabsContent value="softphone">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dialer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5" />
                    Phone Dialer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Phone Number Display */}
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="text-center text-lg font-mono mt-1"
                    />
                  </div>

                  {/* Dialpad */}
                  <div className="grid grid-cols-3 gap-3">
                    {dialpadNumbers.flat().map((number) => (
                      <Button
                        key={number}
                        variant="outline"
                        className="h-12 text-lg font-semibold"
                        onClick={() => handleNumberClick(number)}
                        disabled={!!currentCall}
                      >
                        {number}
                      </Button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackspace}
                      disabled={!!currentCall || !phoneNumber}
                      className="flex items-center justify-center"
                    >
                      <Backspace className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={currentCall ? endCall : startCall}
                      disabled={!phoneNumber.trim()}
                      className={`flex items-center justify-center ${
                        currentCall 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {currentCall ? (
                        <>
                          <PhoneOff className="h-4 w-4 mr-2" />
                          End Call
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      disabled={!!currentCall || !phoneNumber}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Call Controls */}
                  {currentCall && (
                    <div className="border-t pt-4">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">Call Active</span>
                        </div>
                        <p className="text-2xl font-mono font-bold">{formatDuration(callDuration)}</p>
                        <p className="text-sm text-gray-600">to {phoneNumber}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={isMuted ? "destructive" : "outline"}
                          onClick={toggleMute}
                          className="flex items-center justify-center gap-2"
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          {isMuted ? 'Unmute' : 'Mute'}
                        </Button>

                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          onClick={() => setIsRecording(!isRecording)}
                          className="flex items-center justify-center gap-2"
                        >
                          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                          {isRecording ? 'Recording' : 'Record'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lead Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedLead && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-900">{selectedLead.customerName}</p>
                            <p className="text-sm text-blue-700">{selectedLead.leadNumber}</p>
                            <p className="text-sm text-blue-700">{selectedLead.phoneNumber}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLead(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <div className="p-2">
                        <Input
                          placeholder="Search customers..."
                          className="mb-2"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            // Filter leads in real-time
                          }}
                        />
                      </div>
                      {leads.slice(0, 10).map(lead => (
                        <div
                          key={lead._id}
                          onClick={() => handleLeadSelect(lead)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{lead.customerName}</p>
                              <p className="text-xs text-gray-500">{lead.phoneNumber}</p>
                              <p className="text-xs text-gray-400">{lead.leadNumber}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SMSComposer
                recipient={smsRecipient}
                content={smsContent}
                onRecipientChange={setSmsRecipient}
                onContentChange={setSmsContent}
                onSend={sendSMS}
                onSelectLead={handleLeadSelect}
                leads={leads}
              />

              {/* Recent SMS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent SMS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {smsMessages.slice(0, 10).map(sms => (
                      <div key={sms._id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSMSStatusColor(sms.status)}>
                              {sms.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {sms.messageType}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(sms.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">
                            {sms.messageType === 'outbound' ? 'To' : 'From'}: {sms.messageType === 'outbound' ? sms.toNumber : sms.fromNumber}
                          </p>
                          {sms.customerName && (
                            <p className="text-gray-600">{sms.customerName}</p>
                          )}
                          <p className="mt-1 text-gray-700">{sms.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="call-history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search calls..."
                        value={callSearch}
                        onChange={(e) => setCallSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={callStatusFilter}
                    onChange={(e) => setCallStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="busy">Busy</option>
                    <option value="failed">Failed</option>
                    <option value="no-answer">No Answer</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call._id}>
                          <TableCell>
                            <Badge variant="outline" className={
                              call.callType === 'outbound' ? 'text-blue-600' : 'text-green-600'
                            }>
                              {call.callType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {call.callType === 'outbound' ? call.toNumber : call.fromNumber}
                          </TableCell>
                          <TableCell>
                            {call.customerName || call.leadId?.customerName || 'Unknown'}
                          </TableCell>
                          <TableCell>{formatDuration(call.duration)}</TableCell>
                          <TableCell>
                            <Badge className={getCallStatusColor(call.status)}>
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(call.startTime).toLocaleString()}
                          </TableCell>
                          <TableCell>{call.userId?.name}</TableCell>
                          <TableCell>
                            {call.recordingUrl ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => playRecording(call.recordingUrl!, call._id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {playingRecording === call._id ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadRecording(call.recordingUrl!, call._id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No recording</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (call.leadId) {
                                  router.push(`/dashboard/leads/${call.leadId.leadNumber}`);
                                }
                              }}
                              disabled={!call.leadId}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {calls.length === 0 && (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No calls found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab Content */}
          <TabsContent value="sms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SMSComposer
                recipient={smsRecipient}
                content={smsContent}
                onRecipientChange={setSmsRecipient}
                onContentChange={setSmsContent}
                onSend={sendSMS}
                onSelectLead={handleLeadSelect}
                leads={leads}
              />

              {/* SMS History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* SMS Filters */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search SMS..."
                          value={smsSearch}
                          onChange={(e) => setSmsSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <select
                      value={smsStatusFilter}
                      onChange={(e) => setSmsStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="delivered">Delivered</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                    </select>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {smsMessages.map(sms => (
                      <div key={sms._id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSMSStatusColor(sms.status)}>
                              {sms.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {sms.messageType}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(sms.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">
                            {sms.messageType === 'inbound' ? 'To' : 'From'}: {sms.messageType === 'inbound' ? sms.toNumber : sms.fromNumber}
                          </p>
                          {sms.customerName && (
                            <p className="text-gray-600">{sms.customerName}</p>
                          )}
                          <p className="mt-1 text-gray-700">{sms.content}</p>
                        </div>
                      </div>
                    ))}

                    {smsMessages.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No SMS messages found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Call History Tab (Detailed) */}
          <TabsContent value="call-history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Detailed Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by number, customer name, or call ID..."
                        value={callSearch}
                        onChange={(e) => setCallSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={callStatusFilter}
                    onChange={(e) => setCallStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="busy">Busy</option>
                    <option value="failed">Failed</option>
                    <option value="no-answer">No Answer</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call._id}>
                          <TableCell className="font-mono text-xs">{call.callId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              call.callType === 'outbound' ? 'text-blue-600' : 'text-green-600'
                            }>
                              {call.callType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {call.callType === 'outbound' ? call.toNumber : call.fromNumber}
                          </TableCell>
                          <TableCell>
                            {call.customerName || call.leadId?.customerName || 'Unknown'}
                          </TableCell>
                          <TableCell>{formatDuration(call.duration)}</TableCell>
                          <TableCell>
                            <Badge className={getCallStatusColor(call.status)}>
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(call.startTime).toLocaleString()}
                          </TableCell>
                          <TableCell>{call.userId?.name}</TableCell>
                          <TableCell>
                            {call.leadId ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-blue-600"
                                onClick={() => router.push(`/dashboard/leads/${call.leadId?.leadNumber}`)}
                              >
                                {call.leadId.leadNumber}
                              </Button>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {call.recordingUrl ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => playRecording(call.recordingUrl!, call._id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {playingRecording === call._id ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadRecording(call.recordingUrl!, call._id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No recording</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {call.notes ? (
                              <div className="max-w-32 truncate" title={call.notes}>
                                {call.notes}
                              </div>
                            ) : (
                              'No notes'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {calls.length === 0 && (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No calls found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Recordings Tab */}
          <TabsContent value="recordings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Call Recordings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calls.filter(call => call.recordingUrl).map((call) => (
                    <div key={call._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {call.callType === 'outbound' ? 'Outbound' : 'Inbound'} Call
                            </p>
                            <p className="text-sm text-gray-600">
                              {call.callType === 'outbound' ? call.toNumber : call.fromNumber}
                            </p>
                            {call.customerName && (
                              <p className="text-sm text-gray-600">{call.customerName}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDuration(call.duration)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(call.startTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCallStatusColor(call.status)}>
                            {call.status}
                          </Badge>
                          {call.leadId && (
                            <Badge variant="outline">
                              {call.leadId.leadNumber}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playRecording(call.recordingUrl!, call._id)}
                            className="flex items-center gap-1"
                          >
                            {playingRecording === call._id ? (
                              <>
                                <Pause className="h-3 w-3" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                Play
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadRecording(call.recordingUrl!, call._id)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>

                          {call.leadId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/leads/${call.leadId?.leadNumber}`)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Lead
                            </Button>
                          )}
                        </div>
                      </div>

                      {call.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {call.notes}
                        </div>
                      )}

                      {call.recordingDuration && (
                        <div className="mt-2 text-xs text-gray-500">
                          Recording Duration: {formatDuration(call.recordingDuration)}
                        </div>
                      )}
                    </div>
                  ))}

                  {calls.filter(call => call.recordingUrl).length === 0 && (
                    <div className="text-center py-8">
                      <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No call recordings found</p>
                      <p className="text-sm text-gray-400">Recordings will appear here when calls are recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Calls</p>
                    <p className="text-2xl font-bold">{stats.calls.total}</p>
                    <p className="text-xs text-blue-600">{stats.calls.today} today</p>
                  </div>
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Call Duration</p>
                    <p className="text-2xl font-bold">{formatDuration(stats.calls.totalDuration)}</p>
                    <p className="text-xs text-green-600">Avg: {formatDuration(stats.calls.averageDuration)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total SMS</p>
                    <p className="text-2xl font-bold">{stats.sms.total}</p>
                    <p className="text-xs text-purple-600">{stats.sms.today} today</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SMS Delivery</p>
                    <p className="text-2xl font-bold">{stats.sms.deliveryRate}%</p>
                    <p className="text-xs text-orange-600">{stats.sms.delivered} delivered</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}