
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lessonTitle: string;
  isDeleting: boolean;
}

const DeleteLessonDialog: React.FC<DeleteLessonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lessonTitle,
  isDeleting,
}) => {
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmText === lessonTitle) {
      onConfirm();
      setConfirmText('');
    }
  };

  const isConfirmValid = confirmText === lessonTitle;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>Delete Lesson</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete the lesson:
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">{lessonTitle}</p>
            </div>
            <p>
              All lesson data, student progress, and associated content will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Please type <strong>{lessonTitle}</strong> to confirm:
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={lessonTitle}
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Lesson'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLessonDialog;
