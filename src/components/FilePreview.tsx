
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, ExternalLink, FileText, Image, Music, Video, Archive, File } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (open && !error) {
      const loadFile = async () => {
        setLoading(true);
        const url = await getFileUrl();
        
        if (!url) {
          setError(true);
          setLoading(false);
          return;
        }
        
        const category = getFileCategory(file.type);
        
        if (category === 'text' && textContent === null) {
          await loadTextContent(url);
        }
        
        setLoading(false);
      };
      
      loadFile();
    }
  }, [open, file.type, textContent, error]);

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
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(lowerType)) return 'office';
    return 'other';
  };

  const extractStoragePath = (filePath: string) => {
    console.log('Original file path:', filePath);
    
    if (!filePath.startsWith('http')) {
      return filePath;
    }
    
    try {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      
      const bucketIndex = pathParts.indexOf('student-files');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const storagePath = pathParts.slice(bucketIndex + 1).join('/');
        console.log('Extracted storage path:', storagePath);
        return decodeURIComponent(storagePath);
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      console.log('Fallback storage path:', lastPart);
      return decodeURIComponent(lastPart);
    } catch (error) {
      console.error('Error parsing file path:', error);
      return filePath;
    }
  };

  const getFileUrl = async () => {
    try {
      const storagePath = extractStoragePath(file.path);
      console.log('Getting file URL for path:', storagePath);
      
      const { data, error } = await supabase.storage
        .from('student-files')
        .createSignedUrl(storagePath, 3600);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        const { data: publicData } = supabase.storage
          .from('student-files')
          .getPublicUrl(storagePath);
        return publicData.publicUrl;
      }
      
      console.log('Created signed URL:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getFileUrl:', error);
      return null;
    }
  };

  const loadTextContent = async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/plain,*/*',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch text content');
      const text = await response.text();
      setTextContent(text);
    } catch (error) {
      console.error('Error loading text content:', error);
      setTextContent('Unable to load text content');
    }
  };

  const ImagePreview = () => {
    useEffect(() => {
      const loadImage = async () => {
        const url = await getFileUrl();
        if (url) setImageUrl(url);
      };
      loadImage();
    }, []);

    if (!imageUrl) return null;

    return (
      <img
        src={imageUrl}
        alt={file.name}
        className="max-w-full max-h-96 object-contain rounded"
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error('Image failed to load:', imageUrl);
          setLoading(false);
          setError(true);
        }}
      />
    );
  };

  const VideoPreview = () => {
    useEffect(() => {
      const loadVideo = async () => {
        const url = await getFileUrl();
        if (url) setVideoUrl(url);
      };
      loadVideo();
    }, []);

    if (!videoUrl) return null;

    return (
      <video
        controls
        className="w-full max-h-96 rounded-lg"
        onLoadedData={() => setLoading(false)}
        onError={() => {
          console.error('Video failed to load:', videoUrl);
          setLoading(false);
          setError(true);
        }}
      >
        <source src={videoUrl} />
        Your browser does not support the video tag.
      </video>
    );
  };

  const AudioPreview = () => {
    useEffect(() => {
      const loadAudio = async () => {
        const url = await getFileUrl();
        if (url) setAudioUrl(url);
      };
      loadAudio();
    }, []);

    if (!audioUrl) return null;

    return (
      <audio
        controls
        className="w-full max-w-md"
        onLoadedData={() => setLoading(false)}
        onError={() => {
          console.error('Audio failed to load:', audioUrl);
          setLoading(false);
          setError(true);
        }}
      >
        <source src={audioUrl} />
        Your browser does not support the audio tag.
      </audio>
    );
  };

  const PDFPreview = () => {
    useEffect(() => {
      const loadPDF = async () => {
        const url = await getFileUrl();
        if (url) setPdfUrl(url);
      };
      loadPDF();
    }, []);

    if (!pdfUrl) return null;

    return (
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title={file.name}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error('PDF failed to load:', pdfUrl);
          setLoading(false);
          setError(true);
        }}
      />
    );
  };

  const OfficePreview = () => {
    useEffect(() => {
      const loadOfficeFile = async () => {
        const url = await getFileUrl();
        if (url) setFileUrl(url);
      };
      loadOfficeFile();
    }, []);

    if (!fileUrl) return null;

    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

    return (
      <iframe
        src={officeViewerUrl}
        className="w-full h-full"
        title={file.name}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error('Office file failed to load:', officeViewerUrl);
          setLoading(false);
          setError(true);
        }}
        allow="fullscreen"
      />
    );
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
            <span className="text-sm">Error loading file. You can still download it using the button below.</span>
          </p>
        </div>
      );
    }

    switch (category) {
      case 'image':
        return (
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <ImagePreview />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg">
            <VideoPreview />
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            <Music className="h-16 w-16 text-primary mb-4" />
            <AudioPreview />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <PDFPreview />
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-96 bg-muted rounded-lg p-4 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {textContent === null ? 'Loading text content...' : textContent}
            </pre>
          </div>
        );

      case 'office':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <OfficePreview />
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
      const url = await getFileUrl();
      if (!url) {
        console.error('Unable to get file URL for download');
        return;
      }
      
      console.log('Downloading file from:', url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        a.style.display = 'none';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('Download completed successfully');
      } catch (fetchError) {
        console.error('Fetch failed, trying direct link:', fetchError);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleViewFull = async () => {
    const url = await getFileUrl();
    if (url) {
      const category = getFileCategory(file.type);
      if (category === 'office') {
        const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
        window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
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
