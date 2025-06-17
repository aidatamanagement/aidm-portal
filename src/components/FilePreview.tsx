import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, ExternalLink, FileText, Image, Music, Video, Archive, File } from 'lucide-react';
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
  const [textContent, setTextContent] = useState<string | null>(null);

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
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'].includes(lowerType)) return 'image';
    if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv'].includes(lowerType)) return 'video';
    if (['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(lowerType)) return 'audio';
    if (['pdf'].includes(lowerType)) return 'pdf';
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(lowerType)) return 'text';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(lowerType)) return 'document';
    return 'other';
  };

  // Fix the file URL construction to handle all path formats
  const getFileUrl = (filePath: string) => {
    console.log('Original file path:', filePath);
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      console.log('Using full URL:', filePath);
      return filePath;
    }
    
    const baseUrl = 'https://oimqzyfmglyhljjuboek.supabase.co/storage/v1/object/public/student-files/';
    
    // Clean up the path by removing any leading slashes
    let cleanPath = filePath.replace(/^\/+/, '');
    
    // Handle different path formats:
    // 1. Paths that already start with "student-files/" (remove it to avoid double-prefixing)
    if (cleanPath.startsWith('student-files/')) {
      cleanPath = cleanPath.replace('student-files/', '');
    }
    
    // 2. Paths that already start with "student_files/" (this is correct, keep it)
    if (!cleanPath.startsWith('student_files/')) {
      cleanPath = `student_files/${cleanPath}`;
    }
    
    const fullUrl = `${baseUrl}${cleanPath}`;
    console.log('Constructed URL:', fullUrl);
    return fullUrl;
  };

  const loadTextContent = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch text content');
      const text = await response.text();
      setTextContent(text);
    } catch (error) {
      console.error('Error loading text content:', error);
      setTextContent('Unable to load text content');
    }
  };

  const renderFilePreview = () => {
    const category = getFileCategory(file.type);
    const fileUrl = getFileUrl(file.path);
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Unable to preview this file
            <br />
            <span className="text-sm">Error loading file. You can still download it using the button below.</span>
          </p>
        </div>
      );
    }

    switch (category) {
      case 'image':
        return (
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-96 object-contain rounded"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error('Image failed to load:', fileUrl, e);
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
              onError={(e) => {
                console.error('Video failed to load:', fileUrl, e);
                setLoading(false);
                setError(true);
              }}
            >
              <source src={fileUrl} />
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
              onError={(e) => {
                console.error('Audio failed to load:', fileUrl, e);
                setLoading(false);
                setError(true);
              }}
            >
              <source src={fileUrl} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={file.name}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error('PDF failed to load:', fileUrl, e);
                setLoading(false);
                setError(true);
              }}
            />
          </div>
        );

      case 'text':
        React.useEffect(() => {
          if (open && textContent === null) {
            loadTextContent(fileUrl);
            setLoading(false);
          }
        }, [open, fileUrl, textContent]);

        return (
          <div className="w-full h-96 bg-muted rounded-lg p-4 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {textContent === null ? 'Loading text content...' : textContent}
            </pre>
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-primary mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Document preview not available
              <br />
              <span className="text-sm">Click "View Full" to open in a new tab or download the file</span>
            </p>
            <div className="flex gap-2">
              <Button onClick={handleViewFull} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Document
              </Button>
            </div>
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

  const handleDownload = async () => {
    try {
      const fileUrl = getFileUrl(file.path);
      console.log('Downloading file from:', fileUrl);
      
      // Use fetch to download the file properly
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download failed:', error);
      
      // Fallback: try direct link method
      try {
        const fileUrl = getFileUrl(file.path);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  const handleViewFull = () => {
    const fileUrl = getFileUrl(file.path);
    window.open(fileUrl, '_blank');
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
            <DialogTitle className="text-xl font-semibold truncate pr-4">
              {file.name}
            </DialogTitle>
            
            <DialogDescription asChild>
              <div className="space-y-3">
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
              </div>
            </DialogDescription>
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
