'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MessageSquare } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
}

export default function NotesModal({ isOpen, onClose, onNoteAdded }: NotesModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = leads.filter(lead =>
        lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  }, [searchTerm, leads]);

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leads?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        setFilteredLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteContent.trim()) {
      alert('Please select a lead and enter note content');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${selectedLead}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: noteContent.trim() })
      });

      if (response.ok) {
        setNoteContent('');
        setSelectedLead('');
        setSearchTerm('');
        onNoteAdded();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNoteContent('');
    setSelectedLead('');
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Note to Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Selection */}
          <div className="space-y-3">
            <Label htmlFor="leadSearch">Select Lead</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="leadSearch"
                placeholder="Search leads by number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lead Selection Dropdown */}
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {loadingLeads ? (
                <div className="p-4 text-center text-gray-500">Loading leads...</div>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <div
                    key={lead._id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedLead === lead._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedLead(lead._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{lead.leadNumber}</p>
                        <p className="text-sm text-gray-600">{lead.customerName}</p>
                        <p className="text-xs text-gray-500">{lead.customerEmail}</p>
                      </div>
                      {selectedLead === lead._id && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No leads found matching your search' : 'No leads available'}
                </div>
              )}
            </div>
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <Label htmlFor="noteContent">Note Content</Label>
            <textarea
              id="noteContent"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              {noteContent.length}/1000 characters
            </p>
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
              disabled={loading || !selectedLead || !noteContent.trim()}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}