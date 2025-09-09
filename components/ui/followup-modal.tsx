'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';

export interface FollowupData {
  followupDate: string;
  followupTime: string;
  notes?: string;
}

interface FollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: FollowupData) => void;
  leadData: {
    customerName: string;
    leadNumber: string;
  };
  followupType: string;
}

export default function FollowupModal({ 
  isOpen, 
  onClose, 
  onSchedule, 
  leadData, 
  followupType 
}: FollowupModalProps) {
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupDate || !followupTime) {
      alert('Please select both date and time for the follow-up');
      return;
    }

    setLoading(true);
    try {
      await onSchedule({
        followupDate,
        followupTime,
        notes: notes.trim() || undefined
      });
      
      // Reset form
      setFollowupDate('');
      setFollowupTime('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFollowupDate('');
    setFollowupTime('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule {followupType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Information */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">Lead: {leadData.leadNumber}</p>
            <p className="text-sm text-gray-600">Customer: {leadData.customerName}</p>
            <p className="text-sm text-blue-600">Type: {followupType}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Selection */}
            <div>
              <Label htmlFor="followupDate">Follow-up Date *</Label>
              <Input
                id="followupDate"
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                required
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time Selection */}
            <div>
              <Label htmlFor="followupTime">Follow-up Time *</Label>
              <Input
                id="followupTime"
                type="time"
                value={followupTime}
                onChange={(e) => setFollowupTime(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="followupNotes">Notes (Optional)</Label>
              <textarea
                id="followupNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes for this follow-up..."
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                {loading ? 'Scheduling...' : 'Schedule Follow-up'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}