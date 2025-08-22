'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [preview, setPreview] = useState<any>(null);
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
        setPreview(data);
        setStep('preview');
      } else {
        const data = await response.json();
        alert(data.error || 'Preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Preview failed');
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
        setTimeout(() => {
          onImportComplete();
          handleClose();
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
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
      console.error('Download sample failed:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setStep('upload');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {module.replace('_', ' ').toUpperCase()}</DialogTitle>
          <DialogDescription>
            Upload a file to import data into the system
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Upload File</h3>
              <Button
                variant="outline"
                onClick={handleDownloadSample}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Choose file to upload
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Supports Excel (.xlsx, .xls) and CSV files
                    </span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {file && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button onClick={handlePreview} disabled={loading}>
                      {loading ? 'Processing...' : 'Preview'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Import Preview</h3>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{preview.valid.length}</div>
                  <div className="text-sm text-green-600">Valid Records</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{preview.invalid.length}</div>
                  <div className="text-sm text-red-600">Invalid Records</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{preview.total}</div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </CardContent>
              </Card>
            </div>

            {preview.invalid.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Invalid Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto">
                    {preview.invalid.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-red-50 rounded text-sm">
                        <p className="font-medium">Row {item.rowNumber}:</p>
                        <p className="text-red-600">{item.errors.join(', ')}</p>
                      </div>
                    ))}
                    {preview.invalid.length > 10 && (
                      <p className="text-sm text-gray-500">
                        ... and {preview.invalid.length - 10} more errors
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={loading || preview.valid.length === 0}
              >
                {loading ? 'Importing...' : `Import ${preview.valid.length} Records`}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Completed!</h3>
            <p className="text-gray-600">Your data has been successfully imported.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}