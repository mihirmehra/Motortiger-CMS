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
  const [formData, setFormData] = useState<FollowupData>({
    followupDate: '',
    followupTime: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.followupDate || !formData.followupTime) {
      alert('Please select both date and time for the follow-up');
      return;
    }
    onSchedule(formData);
    onClose();
    setFormData({ followupDate: '', followupTime: '', notes: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="followupDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Follow-up Date *
              </Label>
              <Input
                id="followupDate"
                name="followupDate"
                type="date"
                value={formData.followupDate}
                onChange={handleChange}
                required
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="followupTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-up Time *
              </Label>
              <Input
                id="followupTime"
                name="followupTime"
                type="time"
                value={formData.followupTime}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes for this follow-up..."
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Follow-up
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}