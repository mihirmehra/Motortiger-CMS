'use client';

import { Download, FileText, Image, Video, ExternalLink, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ChatFilePreviewProps {
  fileUrl: string;
  fileName: string;
  messageType: 'file' | 'image' | 'video';
  isOwn: boolean;
}

export default function ChatFilePreview({ fileUrl, fileName, messageType, isOwn }: ChatFilePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(fileUrl, '_blank');
  };

  const getFileSize = () => {
    // This would typically come from the file metadata
    return 'Unknown size';
  };

  const getFileExtension = () => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <div className={`border rounded-lg p-3 mt-2 ${
      isOwn ? 'border-blue-300 bg-blue-50/50' : 'border-gray-300 bg-white'
    } max-w-sm`}>
      {/* File Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${
          messageType === 'image' ? 'bg-green-100 text-green-600' :
          messageType === 'video' ? 'bg-purple-100 text-purple-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {messageType === 'image' && <Image className="h-4 w-4" />}
          {messageType === 'video' && <Video className="h-4 w-4" />}
          {messageType === 'file' && <FileText className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={fileName}>
            {fileName}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{getFileExtension()}</span>
            <span>•</span>
            <span>{getFileSize()}</span>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {messageType === 'image' && (
        <div className="mb-3">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="w-full h-auto max-h-48 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-2">
                      <ExternalLink className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{fileName}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img 
                  src={fileUrl} 
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {messageType === 'video' && (
        <div className="mb-3 relative">
          <video
            src={fileUrl}
            controls
            className="w-full h-auto max-h-48 rounded-lg"
            poster={fileUrl} // You might want to generate thumbnails
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {messageType === 'file' && (
        <div className="mb-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Document file</p>
            <p className="text-xs text-gray-500">Click to view or download</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isOwn ? "secondary" : "outline"}
          onClick={handleView}
          className="flex-1 h-8 text-xs flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          {messageType === 'image' ? 'View' : messageType === 'video' ? 'Play' : 'Open'}
        </Button>
        <Button
          size="sm"
          variant={isOwn ? "secondary" : "outline"}
          onClick={handleDownload}
          className="flex-1 h-8 text-xs flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
  );
}