
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, ExternalLink, X, FileText, Image, Music, Video, Archive, File } from 'lucide-react';
import { format } from 'date-fns';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: string;
    path: string;
    description?: string;
    uploaded_at: string;
    uploader?: {
      name: string;
    };
  };
  trigger?: React.ReactNode;
}

const FilePreview = ({ file, trigger }: FilePreviewProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFileIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    switch (type.toLowerCase()) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className={iconClass} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className={iconClass} />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'ogg':
        return <Music className={iconClass} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <Video className={iconClass} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getFileCategory = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(lowerType)) return 'image';
    if (['mp4', 'avi', 'mov', 'webm'].includes(lowerType)) return 'video';
    if (['mp3', 'wav', 'flac', 'ogg'].includes(lowerType)) return 'audio';
    if (['pdf'].includes(lowerType)) return 'pdf';
    if (['doc', 'docx', 'txt'].includes(lowerType)) return 'text';
    return 'other';
  };

  const renderFilePreview = () => {
    const category = getFileCategory(file.type);
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Unable to preview this file
            <br />
            <span className="text-sm">You can still download it using the button below</span>
          </p>
        </div>
      );
    }

    switch (category) {
      case 'image':
        return (
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <img
              src={file.path}
              alt={file.name}
              className="max-w-full max-h-96 object-contain rounded"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg">
            <video
              controls
              className="w-full max-h-96 rounded-lg"
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            >
              <source src={file.path} type={`video/${file.type}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            <Music className="h-16 w-16 text-primary mb-4" />
            <audio
              controls
              className="w-full max-w-md"
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            >
              <source src={file.path} type={`audio/${file.type}`} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <iframe
              src={file.path}
              className="w-full h-full"
              title={file.name}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            {getFileIcon(file.type)}
            <p className="text-muted-foreground mt-4 text-center">
              Preview not available for this file type
              <br />
              <span className="text-sm">Use the buttons below to view or download</span>
            </p>
          </div>
        );
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFull = () => {
    window.open(file.path, '_blank');
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold truncate pr-4">
                {file.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* File Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {getFileIcon(file.type)}
                <Badge variant="secondary" className="uppercase">
                  {file.type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <span>Uploaded:</span>
                <span className="font-medium">
                  {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                </span>
              </div>
              
              {file.uploader && (
                <div className="flex items-center gap-1">
                  <span>By:</span>
                  <span className="font-medium">{file.uploader.name}</span>
                </div>
              )}
            </div>

            {file.description && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{file.description}</p>
              </div>
            )}
          </DialogHeader>

          {/* File Preview */}
          <div className="flex-1 overflow-auto">
            {loading && !error && (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            <div className={loading && !error ? 'opacity-0' : 'opacity-100 transition-opacity'}>
              {renderFilePreview()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleViewFull}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Full
            </Button>
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreview;
