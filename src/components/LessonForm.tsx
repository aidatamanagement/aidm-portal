import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextStyles.css';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lesson?: any;
  mode: 'add' | 'edit';
}

const LessonForm: React.FC<LessonFormProps> = ({ isOpen, onClose, courseId, lesson, mode }) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [pdfUrl, setPdfUrl] = useState(lesson?.pdf_url || '');
  const [instructorNotes, setInstructorNotes] = useState(lesson?.instructor_notes || '');
  const [order, setOrder] = useState(lesson?.order || 1);
  const queryClient = useQueryClient();

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      // Enhanced clipboard settings to preserve Word formatting
      matchVisual: false
    }
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'script', 'direction', 'code-block'
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'add') {
        const { error } = await supabase
          .from('lessons')
          .insert({
            title,
            description,
            pdf_url: pdfUrl,
            instructor_notes: instructorNotes,
            order,
            course_id: courseId
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .update({
            title,
            description,
            pdf_url: pdfUrl,
            instructor_notes: instructorNotes,
            order
          })
          .eq('id', lesson.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Lesson ${mode === 'add' ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to ${mode} lesson: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPdfUrl('');
    setInstructorNotes('');
    setOrder(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    if (!pdfUrl.trim()) {
      toast.error('PDF URL is required');
      return;
    }
    saveMutation.mutate();
  };

  const handleClose = () => {
    setTitle(lesson?.title || '');
    setDescription(lesson?.description || '');
    setPdfUrl(lesson?.pdf_url || '');
    setInstructorNotes(lesson?.instructor_notes || '');
    setOrder(lesson?.order || 1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Lesson' : 'Edit Lesson'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="pdfUrl">PDF URL</Label>
            <Input
              id="pdfUrl"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="Enter PDF URL"
              required
            />
          </div>
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              min="1"
              required
            />
          </div>
          <div>
            <Label htmlFor="instructorNotes">Instructor Notes</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={instructorNotes}
                onChange={setInstructorNotes}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter instructor notes with rich formatting... (Paste from Word to preserve formatting)"
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </div>
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
              {saveMutation.isPending ? 'Saving...' : mode === 'add' ? 'Create Lesson' : 'Update Lesson'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonForm;
