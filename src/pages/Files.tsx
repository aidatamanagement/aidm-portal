import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Upload, FolderPlus, Trash2, ChevronDown } from 'lucide-react';
import FolderExplorer from '@/components/FolderExplorer';
import UploadFileModal from '@/components/UploadFileModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Files = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const { error } = await supabase
        .from('folders')
        .insert({
          name: folderName,
          student_id: user?.id,
          parent_id: null // Root level folder
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Folder created successfully');
      setCreateFolderModalOpen(false);
      setNewFolderName('');
      // Refresh the folder explorer
      queryClient.invalidateQueries({ queryKey: ['folder-contents'] });
    },
    onError: (error) => {
      toast.error('Failed to create folder');
      console.error('Create folder error:', error);
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    createFolderMutation.mutate(newFolderName.trim());
  };

  if (!user) {
    return <div className="p-6">Please log in to view your files.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div 
        className="bg-[#F9F9F9] rounded-[10px] p-8 border border-[#D9D9D9]"
        style={{ fontFamily: '"SF Pro Text", sans-serif' }}
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="text-[14px] text-slate-600 tracking-[-0.084px] hover:text-slate-800 transition-colors"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              Dashboard
            </Link>
            <ChevronRight className="h-5 w-5 text-slate-600" />
            <span 
              className="text-[14px] text-[#026242] font-semibold tracking-[-0.084px]"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              My Files
            </span>
          </div>
          
          {/* New Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="bg-[#026242] hover:bg-[#026242]/90 text-white px-4 py-2 flex items-center gap-2"
                style={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '14px', lineHeight: '20px', letterSpacing: '-0.084px' }}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                File upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUploadModalOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Folder upload
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateFolderModalOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 
            className="text-[30px] font-bold text-slate-800 tracking-[-0.39px] leading-[38px]"
            style={{ fontFamily: 'Helvetica, sans-serif' }}
          >
            File Manager
          </h1>
        </div>
      </div>

      {/* File Explorer */}
      <FolderExplorer studentId={user.id} isAdmin={false} />

      {/* Upload File Modal */}
      <UploadFileModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        studentId={user.id}
        onFileUploaded={() => {
          // Refresh the folder explorer
          queryClient.invalidateQueries({ queryKey: ['folder-contents'] });
        }}
      />

      {/* Create Folder Modal */}
      <Dialog open={createFolderModalOpen} onOpenChange={setCreateFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderModalOpen(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
              className="bg-[#026242] hover:bg-[#026242]/90"
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;
