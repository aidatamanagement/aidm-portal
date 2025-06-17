
import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
    description?: string;
  };
  onFileUpdated: () => void;
}

const EditFileModal = ({ open, onOpenChange, file, onFileUpdated }: EditFileModalProps) => {
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (file) {
      setFileName(file.name || '');
      setDescription(file.description || '');
    }
  }, [file]);

  const updateFileMutation = useMutation({
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
      toast.success('File updated successfully');
      onOpenChange(false);
      onFileUpdated();
    },
    onError: (error) => {
      toast.error('Failed to update file');
      console.error('Update error:', error);
    },
  });

  const handleUpdate = () => {
    if (!fileName.trim()) {
      toast.error('File name is required');
      return;
    }
    updateFileMutation.mutate({ fileName: fileName.trim(), description: description.trim() });
  };

  const handleClose = () => {
    onOpenChange(false);
    setFileName(file?.name || '');
    setDescription(file?.description || '');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit File Details</DialogTitle>
          <DialogDescription>
            Update the file name and description.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={updateFileMutation.isPending || !fileName.trim()}
          >
            {updateFileMutation.isPending ? 'Updating...' : 'Update File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFileModal;
