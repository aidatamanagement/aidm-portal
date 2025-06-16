
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  course?: any;
  mode: 'add' | 'edit';
}

const CourseForm: React.FC<CourseFormProps> = ({ isOpen, onClose, course, mode }) => {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'add') {
        const { error } = await supabase
          .from('courses')
          .insert({ title, description });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          .update({ title, description })
          .eq('id', course.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Course ${mode === 'add' ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      onClose();
      setTitle('');
      setDescription('');
    },
    onError: (error: any) => {
      toast.error(`Failed to ${mode} course: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Course title is required');
      return;
    }
    saveMutation.mutate();
  };

  const handleClose = () => {
    setTitle(course?.title || '');
    setDescription(course?.description || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Course' : 'Edit Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description"
              rows={4}
            />
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? 'Saving...' : mode === 'add' ? 'Create Course' : 'Update Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;
