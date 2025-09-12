'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, User, Calendar, Edit, Save, X, FileText } from 'lucide-react';

interface Lead {
  _id: string;
  leadNumber: string;
  customerName: string;
  description?: string;
  notes?: Array<{
    _id: string;
    content: string;
    createdAt: string;
    createdBy: {
      name: string;
      email: string;
    };
  }>;
}

interface EnhancedNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdate: () => void;
}

export default function EnhancedNotesModal({ isOpen, onClose, lead, onUpdate }: EnhancedNotesModalProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      loadLeadData();
    }
  }, [isOpen, lead]);

  const loadLeadData = async () => {
    if (!lead) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.lead.notes || []);
        setDescription(data.lead.description || '');
      }
    } catch (error) {
      console.error('Failed to load lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!lead) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description })
      });

      if (response.ok) {
        setEditingDescription(false);
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update description');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      alert('Failed to update description');
    }
  };

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };

  const handleSaveNote = async (noteId: string) => {
    if (!lead || !editingContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${lead._id}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingContent.trim() })
      });

      if (response.ok) {
        setEditingNoteId(null);
        setEditingContent('');
        loadLeadData();
        onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Lead Notes & Description
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Lead Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{lead.customerName}</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {lead.leadNumber}
              </Badge>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h4>
              {!editingDescription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDescription(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
            
            {editingDescription ? (
              <div className="space-y-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter lead description..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdateDescription}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDescription(false);
                      setDescription(lead.description || '');
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                {description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes ({notes.length})
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notes...</p>
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note._id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{note.createdBy?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                        {editingNoteId !== note._id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNote(note._id, note.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {editingNoteId === note._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNote(note._id)}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notes available</p>
                <p className="text-sm text-gray-400">Notes will appear here when added</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}