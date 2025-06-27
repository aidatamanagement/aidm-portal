import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, File, AlertTriangle } from 'lucide-react';

interface EditFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
    description?: string;
    path: string;
    student_id: string;
    type: string;
  };
  onFileUpdated: () => void;
}

const EditFileModal = ({ open, onOpenChange, file, onFileUpdated }: EditFileModalProps) => {
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      setFileName(file.name || '');
      setDescription(file.description || '');
      setSelectedFile(null);
    }
  }, [file]);

  const extractStoragePath = (filePath: string) => {
    if (!filePath.startsWith('http')) {
      return filePath;
    }
    
    try {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      
      const bucketIndex = pathParts.indexOf('student-files');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const storagePath = pathParts.slice(bucketIndex + 1).join('/');
        return decodeURIComponent(storagePath);
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      return decodeURIComponent(lastPart);
    } catch (error) {
      console.error('Error parsing file path:', error);
      return filePath;
    }
  };

  const updateFileMetadataMutation = useMutation({
    mutationFn: async ({ fileName, description }: { fileName: string; description: string }) => {
      const { error } = await supabase
        .from('files')
        .update({
          name: fileName,
          description: description || null
        })
        .eq('id', file.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('File details updated successfully');
      onFileUpdated();
    },
    onError: (error) => {
      toast.error('Failed to update file details');
      console.error('Update error:', error);
    },
  });

  const replaceFileMutation = useMutation({
    mutationFn: async ({ 
      newFile, 
      fileName, 
      description 
    }: { 
      newFile: File; 
      fileName: string; 
      description: string; 
    }) => {
      const storagePath = extractStoragePath(file.path);
      
      // Remove the old file from storage
      const { error: removeError } = await supabase.storage
        .from('student-files')
        .remove([storagePath]);

      if (removeError) {
        console.warn('Warning: Could not remove old file from storage:', removeError);
        // Don't throw error here as we still want to upload the new file
      }

      // Upload the new file with the same path structure
      const fileExtension = newFile.name.split('.').pop();
      const timestamp = Date.now();
      const newStoragePath = `${file.student_id}/${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-files')
        .upload(newStoragePath, newFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the new file
      const { data: { publicUrl } } = supabase.storage
        .from('student-files')
        .getPublicUrl(newStoragePath);

      // Update the database record with new file info
      const { error: dbError } = await supabase
        .from('files')
        .update({
          name: fileName,
          description: description || null,
          path: publicUrl,
          type: newFile.type || fileExtension || 'unknown',
          uploaded_at: new Date().toISOString()
        })
        .eq('id', file.id);

      if (dbError) throw dbError;

      return { uploadData, publicUrl };
    },
    onSuccess: () => {
      toast.success('File replaced successfully');
      setSelectedFile(null);
      setShowReplaceConfirmation(false);
      onOpenChange(false);
      onFileUpdated();
    },
    onError: (error) => {
      toast.error('Failed to replace file');
      console.error('Replace file error:', error);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 300MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 300MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleReplaceFile = () => {
    if (!selectedFile) return;
    setShowReplaceConfirmation(true);
  };

  const confirmReplaceFile = () => {
    if (!selectedFile || !fileName.trim()) {
      toast.error('Please provide a file name');
      return;
    }
    
    replaceFileMutation.mutate({
      newFile: selectedFile,
      fileName: fileName.trim(),
      description: description.trim()
    });
  };

  const handleUpdateMetadata = () => {
    if (!fileName.trim()) {
      toast.error('File name is required');
      return;
    }
    updateFileMetadataMutation.mutate({ 
      fileName: fileName.trim(), 
      description: description.trim() 
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setFileName(file?.name || '');
    setDescription(file?.description || '');
    setSelectedFile(null);
    setShowReplaceConfirmation(false);
  };

  const isLoading = updateFileMetadataMutation.isPending || replaceFileMutation.isPending;

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          <DialogDescription>
              Update the file details or replace the file content.
          </DialogDescription>
        </DialogHeader>
          
          <div className="space-y-6">
            {/* File Metadata Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description or comment about this file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

            {/* File Replacement Section */}
            <div className="border-t pt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Replace File Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload a new file to replace the current file content
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose New File
                  </Button>
                  
                  {selectedFile && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <File className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                      <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />

                {selectedFile && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Ready to replace file</p>
                        <p className="text-yellow-700 mt-1">
                          The current file will be permanently replaced with "{selectedFile.name}". 
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
            
            <div className="flex space-x-2">
              {selectedFile ? (
                <Button 
                  onClick={handleReplaceFile}
                  disabled={isLoading || !fileName.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {replaceFileMutation.isPending ? 'Replacing...' : 'Replace File'}
                </Button>
              ) : (
          <Button 
                  onClick={handleUpdateMetadata} 
                  disabled={isLoading || !fileName.trim()}
          >
                  {updateFileMetadataMutation.isPending ? 'Updating...' : 'Update Details'}
          </Button>
              )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Replace File Confirmation Dialog */}
      <AlertDialog open={showReplaceConfirmation} onOpenChange={setShowReplaceConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Replace File Content?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to replace "<strong>{file.name}</strong>" with "<strong>{selectedFile?.name}</strong>".
              </p>
              <p className="text-red-600 font-medium">
                This action is permanent and cannot be undone. The original file will be deleted from storage.
              </p>
              <p>
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplaceFile}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {replaceFileMutation.isPending ? 'Replacing...' : 'Yes, Replace File'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditFileModal;
