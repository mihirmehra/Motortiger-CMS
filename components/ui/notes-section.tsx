'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Save, X, User, Calendar } from 'lucide-react';

interface Note {
  _id?: string;
  content: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface NotesSectionProps {
  leadId: string;
  notes: Note[];
  onNotesUpdate: () => void;
}

export default function NotesSection({ leadId, notes, onNotesUpdate }: NotesSectionProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNote.trim() })
      });

      if (response.ok) {
        setNewNote('');
        setShowAddNote(false);
        onNotesUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNewNote('');
    setShowAddNote(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Comments ({notes.length})
          </CardTitle>
          <Button
            onClick={() => setShowAddNote(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddNote && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <Label htmlFor="newNote">Add New Note</Label>
            <textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note or comment..."
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {notes.map((note, index) => (
            <div key={note._id || index} className="border-l-4 border-blue-200 pl-4 py-3 bg-white rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{note.createdBy.name}</p>
                    <p className="text-xs text-gray-500">{note.createdBy.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
            </div>
          ))}
          
          {notes.length === 0 && !showAddNote && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notes added yet</p>
              <Button
                onClick={() => setShowAddNote(true)}
                variant="outline"
                className="mt-3 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Note
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}