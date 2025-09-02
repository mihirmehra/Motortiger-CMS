'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, module, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowPreview(false);
      setPreview(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

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
        setPreview(data);
        setShowPreview(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to preview file');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to preview file');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
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
        alert(`Import completed! ${data.imported} records imported, ${data.failed} failed.`);
        onImportComplete();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    } finally {
      setImporting(false);
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
      console.error('Download sample error:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setShowPreview(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {module.replace('_', ' ').toUpperCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Upload an Excel or CSV file to import {module.replace('_', ' ')} data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={downloadSample}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>
          </div>

          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="flex gap-3">
              <Button
                onClick={handlePreview}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Preview Data
              </Button>
              
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          )}

          {showPreview && preview && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Import Preview</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{preview.total}</div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{preview.valid.length}</div>
                  <div className="text-sm text-green-600">Valid Records</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-600">{preview.invalid.length}</div>
                  <div className="text-sm text-red-600">Invalid Records</div>
                </div>
              </div>

              {preview.invalid.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-red-600 mb-2">Validation Errors:</h5>
                  <div className="max-h-40 overflow-y-auto">
                    {preview.invalid.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="text-sm text-red-600 mb-1">
                        Row {item.rowNumber}: {item.errors.join(', ')}
                      </div>
                    ))}
                    {preview.invalid.length > 5 && (
                      <div className="text-sm text-gray-500">
                        ... and {preview.invalid.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}