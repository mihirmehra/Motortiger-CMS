'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface NotesSectionProps {
  leadId: string;
  notes: Note[];
  onNoteAdded: (note: Note) => void;
}

export default function NotesSection({ leadId, notes, onNoteAdded }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
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
      setLoading(false);
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
          <div className="flex gap-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <Button
              type="submit"
              disabled={loading || !newNote.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note._id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {note.createdBy.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{note.createdBy.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{note.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notes yet</p>
              <p className="text-sm text-gray-400">Add the first note above</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}