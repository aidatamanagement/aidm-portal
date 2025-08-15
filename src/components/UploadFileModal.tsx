
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UploadFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onFileUploaded?: () => void;
}

const UploadFileModal = ({ open, onOpenChange, studentId, onFileUploaded }: UploadFileModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      // Generate a unique file path
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `student_files/${studentId}/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          student_id: studentId,
          uploader_id: user?.id,
          name: file.name,
          type: fileExtension.toLowerCase(),
          path: publicUrl,
          description: description || null
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
      onOpenChange(false);
      setFile(null);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['admin-student-files', studentId] });
      queryClient.invalidateQueries({ queryKey: ['folder-contents'] });
      onFileUploaded?.();
    },
    onError: (error) => {
      toast.error('Failed to upload file');
      console.error('Upload error:', error);
    },
  });

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    uploadFileMutation.mutate({ file, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to your file manager.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.zip,.xls,.xlsx,.ppt,.pptx"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description or comment about this file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploadFileMutation.isPending || !file}
          >
            {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFileModal;
