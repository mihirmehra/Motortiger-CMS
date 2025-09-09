'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, module, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
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
        setStep('preview');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to preview file');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
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
        setStep('complete');
        onImportComplete();
      } else {
        const data = await response.json();
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = async () => {
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
      console.error('Error downloading sample:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setStep('upload');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import {module.replace('_', ' ').toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleDownloadSample}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample Template
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Download the sample template to see the required format
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="importFile">Select File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-sm text-gray-500">
                Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!file || loading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Processing...' : 'Preview'}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{previewData.total}</div>
                <div className="text-sm text-blue-600">Total Records</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewData.valid.length}</div>
                <div className="text-sm text-green-600">Valid Records</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{previewData.invalid.length}</div>
                <div className="text-sm text-red-600">Invalid Records</div>
              </div>
            </div>

            {previewData.invalid.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Validation Errors</span>
                </div>
                <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                  {previewData.invalid.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="mb-1">
                      Row {error.rowNumber}: {error.errors.join(', ')}
                    </div>
                  ))}
                  {previewData.invalid.length > 5 && (
                    <div className="text-red-600">
                      ... and {previewData.invalid.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || previewData.valid.length === 0}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Importing...' : `Import ${previewData.valid.length} Records`}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="text-green-600">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">Import Completed!</h3>
              <p className="text-sm text-gray-600">
                Your data has been successfully imported.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}