'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, module, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to preview file');
      }
    } catch (error) {
      setError('Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Import completed! ${data.imported} records imported successfully.`);
        onImportComplete();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Import failed');
      }
    } catch (error) {
      setError('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/import/sample?module=${module}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}_sample.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download sample failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {module.replace('_', ' ').toUpperCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={downloadSample}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>

            <Button
              onClick={handlePreview}
              disabled={!file || loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              Preview Data
            </Button>
          </div>

          {previewData && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Preview Results</h4>
              <div className="text-sm space-y-1">
                <p>Total rows: {previewData.total}</p>
                <p className="text-green-600">Valid rows: {previewData.valid.length}</p>
                <p className="text-red-600">Invalid rows: {previewData.invalid.length}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}