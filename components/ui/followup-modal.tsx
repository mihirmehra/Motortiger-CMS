'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Save } from 'lucide-react';

interface FollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (followupData: FollowupData) => void;
  leadData: {
    customerName: string;
    leadNumber: string;
  };
  followupType: string;
}

export interface FollowupData {
  followupDate: string;
  followupTime: string;
  notes?: string;
}

export default function FollowupModal({ 
  isOpen, 
  onClose, 
  onSchedule, 
  leadData, 
  followupType 
}: FollowupModalProps) {
  const [followupData, setFollowupData] = useState<FollowupData>({
    followupDate: '',
    followupTime: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followupData.followupDate || !followupData.followupTime) {
      alert('Please select both date and time for the follow-up');
      return;
    }

    onSchedule(followupData);
    handleClose();
  };

  const handleClose = () => {
    setFollowupData({
      followupDate: '',
      followupTime: '',
      notes: ''
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFollowupData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Customer:</strong> {leadData.customerName}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Lead:</strong> {leadData.leadNumber}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Type:</strong> {followupType}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="followupDate">Follow-up Date *</Label>
              <Input
                id="followupDate"
                name="followupDate"
                type="date"
                value={followupData.followupDate}
                onChange={handleChange}
                required
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="followupTime">Follow-up Time *</Label>
              <Input
                id="followupTime"
                name="followupTime"
                type="time"
                value={followupData.followupTime}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              name="notes"
              value={followupData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes for this follow-up..."
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}