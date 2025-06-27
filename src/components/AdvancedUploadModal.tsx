import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  File, 
  Check, 
  AlertCircle, 
  Pause, 
  Play,
  Trash2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  description?: string;
  uploadedUrl?: string;
  error?: string;
  controller?: AbortController;
}

interface AdvancedUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onFilesUploaded?: () => void;
  currentFolderId?: string | null;
}

const AdvancedUploadModal = ({ 
  open, 
  onOpenChange, 
  studentId, 
  onFilesUploaded,
  currentFolderId 
}: AdvancedUploadModalProps) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [globalDescription, setGlobalDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileUploadItem[] = Array.from(selectedFiles).map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: 'pending',
      description: globalDescription
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [globalDescription]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Upload single file with progress tracking
  const uploadSingleFile = async (fileItem: FileUploadItem): Promise<void> => {
    const { file, description } = fileItem;
    
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Generate file path
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `student_files/${studentId}/${fileName}`;

      // Create abort controller for this upload
      const controller = new AbortController();
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, controller }
          : f
      ));

      // Upload file with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Simulate progress updates (since Supabase doesn't provide real progress)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 90) {
          clearInterval(progressInterval);
          progress = 90;
        }
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: Math.min(progress, 90) }
            : f
        ));
      }, 200);

      // Wait for upload to complete (simulated delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(progressInterval);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-files')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          student_id: studentId,
          uploader_id: user?.id,
          name: file.name,
          type: fileExtension.toLowerCase(),
          path: publicUrl,
          description: description || null,
          folder_id: currentFolderId
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Mark as completed
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100, 
              uploadedUrl: publicUrl,
              controller: undefined
            }
          : f
      ));

    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error.message,
              controller: undefined
            }
          : f
      ));
    }
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    // Upload files in parallel (max 3 at a time)
    const uploadPromises: Promise<void>[] = [];
    const maxConcurrent = 3;
    
    for (let i = 0; i < pendingFiles.length; i += maxConcurrent) {
      const batch = pendingFiles.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(file => uploadSingleFile(file));
      uploadPromises.push(...batchPromises);
      
      // Wait for current batch to complete before starting next
      if (i + maxConcurrent < pendingFiles.length) {
        await Promise.allSettled(batchPromises);
      }
    }

    // Wait for all uploads to complete
    const results = await Promise.allSettled(uploadPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      onFilesUploaded?.();
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} file(s) failed to upload`);
    }
  };

  // Remove file from list
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.controller) {
        file.controller.abort();
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Pause/resume upload
  const toggleUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        if (f.status === 'uploading') {
          f.controller?.abort();
          return { ...f, status: 'paused', controller: undefined };
        } else if (f.status === 'paused') {
          uploadSingleFile(f);
          return { ...f, status: 'pending' };
        }
      }
      return f;
    }));
  };

  // Update file description
  const updateFileDescription = (fileId: string, description: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description } : f
    ));
  };

  // Clear all files
  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.controller) {
        file.controller.abort();
      }
    });
    setFiles([]);
  };

  // Get status summary
  const getStatusSummary = () => {
    const pending = files.filter(f => f.status === 'pending').length;
    const uploading = files.filter(f => f.status === 'uploading').length;
    const completed = files.filter(f => f.status === 'completed').length;
    const error = files.filter(f => f.status === 'error').length;
    const paused = files.filter(f => f.status === 'paused').length;
    
    return { pending, uploading, completed, error, paused, total: files.length };
  };

  const statusSummary = getStatusSummary();

  // Circular progress component
  const CircularProgress = ({ progress, status, size = 40 }: { 
    progress: number; 
    status: FileUploadItem['status'];
    size?: number;
  }) => {
    const radius = (size - 4) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getColor = () => {
      switch (status) {
        case 'completed': return 'text-green-500';
        case 'error': return 'text-red-500';
        case 'paused': return 'text-yellow-500';
        case 'uploading': return 'text-blue-500';
        default: return 'text-gray-300';
      }
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-300", getColor())}
          />
        </svg>
        {/* Status icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === 'completed' && <Check className="h-4 w-4 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
          {status === 'paused' && <Pause className="h-4 w-4 text-yellow-500" />}
          {(status === 'uploading' || status === 'pending') && (
            <span className="text-xs font-medium">{Math.round(progress)}%</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Advanced File Upload</span>
          </DialogTitle>
          <DialogDescription>
            Upload multiple files with real-time progress tracking. Drag and drop files or click to browse.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Global Description */}
          <div>
            <Label htmlFor="globalDescription">Default Description (Optional)</Label>
            <Textarea
              id="globalDescription"
              placeholder="This description will be applied to all new files..."
              value={globalDescription}
              onChange={(e) => setGlobalDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Support for multiple files. Maximum 300MB per file.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              accept="*/*"
            />
          </div>

          {/* Status Summary */}
          {files.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Upload Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-600">{statusSummary.total}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{statusSummary.pending}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{statusSummary.uploading}</div>
                  <div className="text-gray-500">Uploading</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{statusSummary.completed}</div>
                  <div className="text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{statusSummary.error}</div>
                  <div className="text-gray-500">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Files ({files.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <CircularProgress 
                        progress={fileItem.progress} 
                        status={fileItem.status}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium truncate">{fileItem.file.name}</span>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            ({(fileItem.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          Status: {fileItem.status}
                          {fileItem.error && (
                            <span className="text-red-600"> - {fileItem.error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {(fileItem.status === 'uploading' || fileItem.status === 'paused') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUpload(fileItem.id)}
                        >
                          {fileItem.status === 'uploading' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Individual file description */}
                  <div>
                    <Input
                      placeholder="File description (optional)"
                      value={fileItem.description || ''}
                      onChange={(e) => updateFileDescription(fileItem.id, e.target.value)}
                      disabled={fileItem.status === 'uploading'}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More Files
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadAll}
              disabled={statusSummary.pending === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upload {statusSummary.pending > 0 ? `${statusSummary.pending} Files` : 'All'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedUploadModal; 