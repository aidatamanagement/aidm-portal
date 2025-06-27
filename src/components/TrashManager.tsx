import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder,
  File,
  Clock,
  User,
  Search,
  Calendar,
  FolderOpen,
  FileText,
  Image,
  Music,
  Video,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeletedItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  deleted_at: string;
  deleted_by_profile?: {
    name: string;
  };
  student_id: string;
  student_profile?: {
    name: string;
  };
  original_folder_id?: string;
  original_parent_id?: string;
  // For files
  file_type?: string;
  path?: string;
  description?: string;
}

interface TrashManagerProps {
  isAdmin: boolean;
  onItemRestored?: () => void;
}

const TrashManager = ({ isAdmin, onItemRestored }: TrashManagerProps) => {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [emptyTrashDialog, setEmptyTrashDialog] = useState({
    isOpen: false,
    confirmText: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadTrashItems();
    }
  }, [isAdmin]);

  const loadTrashItems = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Load deleted files
      const { data: deletedFiles, error: filesError } = await supabase
        .from('files')
        .select(`
          id,
          name,
          type,
          path,
          description,
          deleted_at,
          student_id,
          original_folder_id,
          deleted_by,
          student_profile:profiles!files_student_id_fkey(name),
          deleted_by_profile:profiles!files_deleted_by_fkey(name)
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (filesError) throw filesError;

      // Load deleted folders
      const { data: deletedFolders, error: foldersError } = await supabase
        .from('folders')
        .select(`
          id,
          name,
          deleted_at,
          student_id,
          original_parent_id,
          deleted_by,
          student_profile:profiles!folders_student_id_fkey(name),
          deleted_by_profile:profiles!folders_deleted_by_fkey(name)
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (foldersError) throw foldersError;

      // Combine and format items
      const allDeletedItems: DeletedItem[] = [
        ...deletedFiles.map(file => ({
          ...file,
          type: 'file' as const,
          file_type: file.type
        })),
        ...deletedFolders.map(folder => ({
          ...folder,
          type: 'folder' as const
        }))
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      setDeletedItems(allDeletedItems);
    } catch (error) {
      console.error('Error loading trash items:', error);
      toast.error('Failed to load trash items');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-500" />;
    
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(type)) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(type)) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(type)) {
      return <Music className="h-5 w-5 text-green-500" />;
    }
    if (['pdf'].includes(type)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return <Archive className="h-5 w-5 text-orange-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const restoreItem = async (item: DeletedItem) => {
    try {
      if (item.type === 'file') {
        const { error } = await supabase
          .from('files')
          .update({
            deleted_at: null,
            deleted_by: null,
            folder_id: item.original_folder_id
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Use the database function for folders to restore all contents
        const { error } = await supabase.rpc('restore_folder_with_contents', {
          folder_uuid: item.id
        });

        if (error) throw error;
      }

      toast.success(`${item.type === 'file' ? 'File' : 'Folder'} restored successfully`);
      loadTrashItems();
      if (onItemRestored) {
        onItemRestored();
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error(`Failed to restore ${item.type}`);
    }
  };

  const permanentlyDeleteItem = async (item: DeletedItem) => {
    try {
      if (item.type === 'file') {
        // Delete from storage first
        if (item.path) {
          const { error: storageError } = await supabase.storage
            .from('student-files')
            .remove([item.path]);
          
          if (storageError) {
            console.error('Storage deletion error:', storageError);
          }
        }

        // Delete from database
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Permanently delete folder and its contents
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', item.id);

        if (error) throw error;
      }

      toast.success(`${item.type === 'file' ? 'File' : 'Folder'} permanently deleted`);
      loadTrashItems();
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast.error(`Failed to permanently delete ${item.type}`);
    }
  };

  const emptyTrash = async () => {
    if (emptyTrashDialog.confirmText !== 'EMPTY TRASH') {
      toast.error('Please type "EMPTY TRASH" to confirm');
      return;
    }

    try {
      const { error } = await supabase.rpc('empty_trash');
      
      if (error) throw error;

      toast.success('Trash emptied successfully');
      setEmptyTrashDialog({ isOpen: false, confirmText: '' });
      loadTrashItems();
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
    }
  };

  const cleanupOldItems = async () => {
    try {
      const { data, error } = await supabase.rpc('permanent_delete_old_trash');
      
      if (error) throw error;

      toast.success(`Cleaned up ${data} old items (older than 1 month)`);
      loadTrashItems();
    } catch (error) {
      console.error('Error cleaning up old items:', error);
      toast.error('Failed to cleanup old items');
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const restoreSelected = async () => {
    try {
      const selectedItemsData = deletedItems.filter(item => selectedItems.has(item.id));
      
      for (const item of selectedItemsData) {
        if (item.type === 'file') {
          const { error } = await supabase
            .from('files')
            .update({
              deleted_at: null,
              deleted_by: null,
              folder_id: item.original_folder_id
            })
            .eq('id', item.id);

          if (error) throw error;
        } else {
          // Use the database function for folders to restore all contents
          const { error } = await supabase.rpc('restore_folder_with_contents', {
            folder_uuid: item.id
          });

          if (error) throw error;
        }
      }
      
      setSelectedItems(new Set());
      loadTrashItems(); // Refresh trash view
      toast.success(`Restored ${selectedItemsData.length} items`);
      if (onItemRestored) {
        onItemRestored();
      }
    } catch (error) {
      console.error('Error restoring selected items:', error);
      toast.error('Failed to restore selected items');
    }
  };

  const filteredItems = deletedItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.student_profile?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'files' && item.type === 'file') ||
                         (filterType === 'folders' && item.type === 'folder');
    
    return matchesSearch && matchesFilter;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={cleanupOldItems}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Cleanup Old Items
          </Button>
          <AlertDialog 
            open={emptyTrashDialog.isOpen} 
            onOpenChange={(open) => setEmptyTrashDialog(prev => ({ ...prev, isOpen: open }))}
          >
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                disabled={deletedItems.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Empty Trash
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This will <strong>permanently delete all items</strong> in the trash. 
                    This action cannot be undone.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800 font-medium">
                      {deletedItems.length} items will be permanently deleted
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confirmEmpty" className="text-sm font-medium">
                      Type <code className="bg-gray-100 px-1 rounded">EMPTY TRASH</code> to confirm:
                    </Label>
                    <Input
                      id="confirmEmpty"
                      value={emptyTrashDialog.confirmText}
                      onChange={(e) => setEmptyTrashDialog(prev => ({ 
                        ...prev, 
                        confirmText: e.target.value 
                      }))}
                      placeholder="Type EMPTY TRASH here"
                      className="mt-1"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEmptyTrashDialog({ isOpen: false, confirmText: '' })}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={emptyTrash}
                  disabled={emptyTrashDialog.confirmText !== 'EMPTY TRASH'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Empty Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All ({deletedItems.length})
              </Button>
              <Button
                variant={filterType === 'files' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('files')}
              >
                Files ({deletedItems.filter(i => i.type === 'file').length})
              </Button>
              <Button
                variant={filterType === 'folders' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('folders')}
              >
                Folders ({deletedItems.filter(i => i.type === 'folder').length})
              </Button>
            </div>
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                {selectedItems.size} items selected
              </span>
              <Button
                size="sm"
                onClick={restoreSelected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trash Items */}
      <Card>
        <CardHeader>
          <CardTitle>
            Deleted Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {deletedItems.length === 0 ? 'Trash is empty' : 'No items match your search'}
              </h3>
              <p className="text-gray-600">
                {deletedItems.length === 0 
                  ? 'Deleted files and folders will appear here.' 
                  : 'Try adjusting your search criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors",
                    selectedItems.has(item.id) && "ring-2 ring-blue-400 bg-blue-50"
                  )}
                  onClick={() => handleItemSelect(item.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300"
                    />
                    
                    <div className="flex items-center space-x-3">
                      {item.type === 'folder' ? (
                        <Folder className="h-6 w-6 text-blue-500" />
                      ) : (
                        getFileIcon(item.file_type)
                      )}
                      
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.student_profile?.name || 'Unknown Student'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Deleted {format(new Date(item.deleted_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          {item.deleted_by_profile && (
                            <span className="flex items-center gap-1">
                              By {item.deleted_by_profile.name}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={item.type === 'folder' ? 'default' : 'secondary'}>
                      {item.type}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreItem(item);
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Forever
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete {item.type}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete "{item.name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => permanentlyDeleteItem(item)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrashManager; 