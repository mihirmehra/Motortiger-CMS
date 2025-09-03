'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, User } from 'lucide-react';

interface Note {
  _id: string;
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
  onNoteAdded: (note: Note) => void;
}

export default function NotesSection({ leadId, notes, onNoteAdded }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAdding(true);
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
        const data = await response.json();
        const latestNote = data.notes[data.notes.length - 1];
        onNoteAdded(latestNote);
        setNewNote('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="mb-6">
          <div className="space-y-3">
            <Label htmlFor="newNote">Add Note</Label>
            <textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this lead..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {newNote.length}/1000 characters
              </span>
              <Button
                type="submit"
                disabled={!newNote.trim() || adding}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {adding ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note._id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{note.createdBy?.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notes added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}