import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Folder, 
  FolderPlus, 
  File, 
  Upload, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Move, 
  ChevronRight,
  Home,
  ArrowLeft,
  Grid3X3,
  List,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Download,
  Edit,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError, toastInfo } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdvancedUploadModal from './AdvancedUploadModal';
import EditFileModal from './EditFileModal';
import TrashManager from './TrashManager';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFileUrl, downloadFile, getFileCategory, extractStoragePath } from '@/lib/fileUtils';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  student_id: string;
  created_at: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  path: string;
  description?: string;
  uploaded_at: string;
  folder_id: string | null;
  student_id: string;
  uploader?: {
    name: string;
  };
}

interface FolderExplorerProps {
  studentId: string;
  studentName?: string;
  isAdmin?: boolean;
}

const FolderExplorer = ({ studentId, studentName, isAdmin = false }: FolderExplorerProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Modal states
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [editFileModalOpen, setEditFileModalOpen] = useState(false);
  
  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [moveDestination, setMoveDestination] = useState<string | null>(null);
  const [movingItems, setMovingItems] = useState<{files: string[], folders: string[]}>({files: [], folders: []});
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Drag and Drop functionality
  const [draggedItem, setDraggedItem] = useState<{id: string, type: 'file' | 'folder'} | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Trash modal state
  const [trashModalOpen, setTrashModalOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    loadFolderContents(currentFolderId);
    buildBreadcrumbs(currentFolderId);
    loadAllFolders();
  }, [currentFolderId, studentId]);

  const loadFolderContents = async (folderId: string | null) => {
    setLoading(true);
    try {
      console.log('Loading folder contents for:', folderId, 'studentId:', studentId);
      
      // First check if folders table exists by trying a simple query
      const { data: testFolders, error: testError } = await supabase
        .from('folders')
        .select('count')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        // Table doesn't exist - show error and fallback to files only
        console.error('Folders table does not exist yet. Please run the database migration.');
        toastError('Folders feature not available. Database migration required.');
        
        // Load files only (without folder functionality)
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select(`
            *,
            uploader:profiles!files_uploader_id_fkey(name)
          `)
          .eq('student_id', studentId)
          .is('folder_id', null) // Only root level files
          .is('deleted_at', null) // Explicitly exclude deleted files
          .order('uploaded_at', { ascending: false });

        if (filesError) {
          console.error('Files query error:', filesError);
          throw filesError;
        }

        setFolders([]);
        setFiles(filesData || []);
        return;
      }
      
      // Load folders - use proper null handling
      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null) // Explicitly exclude deleted folders
        .order('name');
      
      // Apply parent_id filter correctly
      if (folderId === null) {
        foldersQuery = foldersQuery.is('parent_id', null);
      } else {
        foldersQuery = foldersQuery.eq('parent_id', folderId);
      }

      const { data: foldersData, error: foldersError } = await foldersQuery;

      if (foldersError) {
        console.error('Folders query error:', foldersError);
        throw foldersError;
      }

      console.log('Folders data:', foldersData);

      // Load files - use proper null handling
      let filesData;
      let filesError;
      
      // Try loading files with folder_id first
      try {
        let filesQuery = supabase
          .from('files')
          .select(`
            *,
            uploader:profiles!files_uploader_id_fkey(name)
          `)
          .eq('student_id', studentId)
          .is('deleted_at', null) // Explicitly exclude deleted files
          .order('uploaded_at', { ascending: false });
          
        // Apply folder_id filter correctly
        if (folderId === null) {
          filesQuery = filesQuery.is('folder_id', null);
        } else {
          filesQuery = filesQuery.eq('folder_id', folderId);
        }
          
        const result = await filesQuery;
        filesData = result.data;
        filesError = result.error;
      } catch (error) {
        console.log('Files query with folder_id failed, trying without folder_id:', error);
        
        // Fallback: load all files for this student (folder_id column might not exist)
        const result = await supabase
          .from('files')
          .select(`
            *,
            uploader:profiles!files_uploader_id_fkey(name)
          `)
          .eq('student_id', studentId)
          .is('deleted_at', null) // Explicitly exclude deleted files in fallback too
          .order('uploaded_at', { ascending: false });
          
        filesData = result.data;
        filesError = result.error;
      }

      if (filesError) {
        console.error('Files query error:', filesError);
        throw filesError;
      }

      console.log('Files data:', filesData);

      setFolders(foldersData || []);
      setFiles(filesData || []);
    } catch (error) {
      console.error('Error loading folder contents:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show more specific error message
      if (error && typeof error === 'object' && 'message' in error) {
        toastError(`Failed to load folder contents: ${error.message}`);
      } else {
        toastError('Failed to load folder contents. Please check console for details.');
      }
      
      // Set empty arrays as fallback
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null) // Exclude deleted folders
        .order('name');

      if (error) throw error;
      setAllFolders(data || []);
    } catch (error) {
      console.error('Error loading all folders:', error);
    }
  };

  const buildBreadcrumbs = async (folderId: string | null) => {
    if (!folderId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const breadcrumbPath: Folder[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('id', currentId)
          .is('deleted_at', null) // Exclude deleted folders from breadcrumbs
          .single();

        if (error || !data) break;

        breadcrumbPath.unshift(data);
        currentId = data.parent_id;
      }

      setBreadcrumbs(breadcrumbPath);
    } catch (error) {
      console.error('Error building breadcrumbs:', error);
      setBreadcrumbs([]);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toastError('Folder name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          parent_id: currentFolderId,
          student_id: studentId
        });

      if (error) {
        if (error.code === '23505') {
          toastError('A folder with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      toastSuccess('Folder created successfully');
      setNewFolderName('');
      setCreateFolderModalOpen(false);
      loadFolderContents(currentFolderId);
      loadAllFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toastError('Failed to create folder');
    }
  };

  const renameFolder = async () => {
    if (!renameFolderName.trim() || !renamingFolder) {
      toastError('Folder name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: renameFolderName.trim() })
        .eq('id', renamingFolder.id);

      if (error) {
        if (error.code === '23505') {
          toastError('A folder with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      toastSuccess('Folder renamed successfully');
      setRenameFolderName('');
      setRenameModalOpen(false);
      setRenamingFolder(null);
      loadFolderContents(currentFolderId);
      loadAllFolders();
    } catch (error) {
      console.error('Error renaming folder:', error);
      toastError('Failed to rename folder');
    }
  };

  // Add this debug function before deleteFolder
  const testAdminPermissions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user.user?.id);
      
      // Test if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.user?.id)
        .single();
      
      console.log('User profile:', profile, 'Error:', profileError);
      
      // Test folder access
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id, name, deleted_at')
        .eq('student_id', studentId)
        .limit(1);
      
      console.log('Folder access test:', folders, 'Error:', foldersError);
      
      // Test if trash columns exist by trying to select them
      const { data: testColumns, error: columnError } = await supabase
        .from('folders')
        .select('deleted_at, deleted_by, original_parent_id')
        .limit(1);
      
      console.log('Trash columns test:', testColumns, 'Error:', columnError);
      
    } catch (error) {
      console.error('Admin permissions test failed:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      console.log('Starting folder deletion process for folderId:', folderId);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      console.log('User authenticated:', user.user.id, 'isAdmin:', isAdmin);

      // Try using the database function first
      console.log('Attempting to use soft_delete_folder_with_contents function...');
      const { error: rpcError } = await supabase.rpc('soft_delete_folder_with_contents', {
        folder_uuid: folderId,
        deleter_id: user.user.id
      });

      if (rpcError) {
        console.error('RPC function error:', rpcError);
        
        // If the function doesn't exist or fails, try manual soft delete
        console.log('RPC function failed, attempting manual soft delete...');
        
        // Manually soft delete the folder
        const { error: manualError } = await supabase
          .from('folders')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.user.id,
            original_parent_id: currentFolderId
          })
          .eq('id', folderId);

        if (manualError) {
          console.error('Manual soft delete error:', manualError);
          throw manualError;
        }

        console.log('Manual soft delete successful for folder');
      } else {
        console.log('RPC function successful');
      }

      toastSuccess('Folder moved to trash');
      console.log('Refreshing folder contents...');
      await loadFolderContents(currentFolderId);
      await loadAllFolders();
      console.log('Folder deletion process completed');
    } catch (error) {
      console.error('Error deleting folder:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toastError(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const moveItems = async () => {
    try {
      // Move files
      if (movingItems.files.length > 0) {
        const { error: filesError } = await supabase
          .from('files')
          .update({ folder_id: moveDestination })
          .in('id', movingItems.files);

        if (filesError) throw filesError;
      }

      // Move folders
      if (movingItems.folders.length > 0) {
        const { error: foldersError } = await supabase
          .from('folders')
          .update({ parent_id: moveDestination })
          .in('id', movingItems.folders);

        if (foldersError) throw foldersError;
      }

      toastSuccess(`Moved ${movingItems.files.length + movingItems.folders.length} items`);
      setMoveModalOpen(false);
      setMovingItems({files: [], folders: []});
      setMoveDestination(null);
      setSelectedItems(new Set());
      loadFolderContents(currentFolderId);
      loadAllFolders();
    } catch (error) {
      console.error('Error moving items:', error);
      toastError('Failed to move items');
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedItems(new Set());
  };

  const handleFolderDoubleClick = (folder: Folder) => {
    navigateToFolder(folder.id);
  };

  const handleItemSelect = (itemId: string, type: 'file' | 'folder') => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(`${type}:${itemId}`)) {
      newSelected.delete(`${type}:${itemId}`);
    } else {
      newSelected.add(`${type}:${itemId}`);
    }
    setSelectedItems(newSelected);
  };

  const getSelectedFiles = () => {
    return Array.from(selectedItems)
      .filter(item => item.startsWith('file:'))
      .map(item => item.replace('file:', ''));
  };

  const getSelectedFolders = () => {
    return Array.from(selectedItems)
      .filter(item => item.startsWith('folder:'))
      .map(item => item.replace('folder:', ''));
  };

  const getFileIcon = (type: string) => {
    const iconClass = "h-6 w-6 text-gray-600";
    
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
        return <Image className={iconClass} />;
      case 'mp3':
      case 'wav':
        return <Music className={iconClass} />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className={iconClass} />;
      case 'zip':
      case 'rar':
        return <Archive className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getFolderPath = (folder: Folder): string => {
    const path: string[] = [];
    let current = folder;
    
    while (current) {
      path.unshift(current.name);
      current = allFolders.find(f => f.id === current.parent_id) as Folder;
    }
    
    return path.join(' / ') || folder.name;
  };

  // File Operations
  // Import the improved file utilities at the top of the component
  // This will be replaced by the import statement

  const handleDownloadFile = async (file: FileItem) => {
    const success = await downloadFile(file.path, file.name);
    if (!success) {
      toastError('Failed to download file');
    }
  };

  const handleEditFile = (file: FileItem) => {
    setSelectedFile({
      id: file.id,
      name: file.name,
      description: file.description,
      path: file.path,
      student_id: studentId,
      type: file.type,
      uploaded_at: file.uploaded_at,
      folder_id: file.folder_id,
      uploader: file.uploader
    });
    setEditFileModalOpen(true);
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      console.log('Starting file deletion process for fileId:', fileId);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      console.log('User authenticated:', user.user.id);
      console.log('Moving file to trash with original_folder_id:', currentFolderId);

      // Soft delete the file (move to trash)
      const { error: dbError } = await supabase
        .from('files')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.user.id,
          original_folder_id: currentFolderId
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Database error during soft delete:', dbError);
        throw dbError;
      }

      console.log('File successfully moved to trash');
      toastSuccess('File moved to trash');
      
      // Refresh the folder contents to remove the deleted file from view
      console.log('Refreshing folder contents...');
      await loadFolderContents(currentFolderId);
      console.log('Folder contents refreshed');
    } catch (error) {
      console.error('Error deleting file:', error);
      toastError('Failed to delete file');
    }
  };

  // Drag and Drop functionality
  const handleDragStart = (e: React.DragEvent, itemId: string, itemType: 'file' | 'folder') => {
    setDraggedItem({id: itemId, type: itemType});
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({id: itemId, type: itemType}));
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (!draggedItem) return;
    
    // Don't allow dropping on itself
    if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) {
      return;
    }
    
    // Don't allow dropping a folder into its own subfolder (prevent infinite loops)
    if (draggedItem.type === 'folder' && targetFolderId) {
      const isSubfolder = await checkIfSubfolder(draggedItem.id, targetFolderId);
      if (isSubfolder) {
        toastError('Cannot move folder into its own subfolder');
        return;
      }
    }

    try {
      if (draggedItem.type === 'file') {
        const { error } = await supabase
          .from('files')
          .update({ folder_id: targetFolderId })
          .eq('id', draggedItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('folders')
          .update({ parent_id: targetFolderId })
          .eq('id', draggedItem.id);
        
        if (error) throw error;
      }
      
      toastSuccess(`${draggedItem.type === 'file' ? 'File' : 'Folder'} moved successfully`);
      loadFolderContents(currentFolderId);
      loadAllFolders();
    } catch (error) {
      console.error('Error moving item:', error);
      toastError('Failed to move item');
    }
    
    setDraggedItem(null);
  };

  // Check if target folder is a subfolder of source folder (prevent infinite loops)
  const checkIfSubfolder = async (sourceFolderId: string, targetFolderId: string): Promise<boolean> => {
    try {
      let currentId = targetFolderId;
      
      while (currentId) {
        if (currentId === sourceFolderId) {
          return true; // Target is a subfolder of source
        }
        
        const { data } = await supabase
          .from('folders')
          .select('parent_id')
          .eq('id', currentId)
          .single();
        
        currentId = data?.parent_id || null;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking subfolder:', error);
      return false;
    }
  };

  // File Content Preview Component
  const FileContentPreview = ({ file }: { file: FileItem }) => {
    const [fileUrl, setFileUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [textContent, setTextContent] = useState<string>('');

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

    useEffect(() => {
      const loadFile = async () => {
        setLoading(true);
        setError(false);
        setErrorMessage('');
        
        console.log('[FileContentPreview] Loading file:', file.name, 'type:', file.type);
        
        const result = await getFileUrl(file.path);
        
        console.log('[FileContentPreview] getFileUrl result:', result);
        
        if (!result.success || !result.url) {
          setError(true);
          setErrorMessage(result.error || 'Unknown error');
          setLoading(false);
          console.log('[FileContentPreview] Failed to get file URL:', result.error);
          return;
        }
        
        setFileUrl(result.url);
        
        const category = getFileCategory(file.type);
        console.log('[FileContentPreview] File category determined:', category, 'for type:', file.type);
        
        if (category === 'text') {
          await loadTextContent(result.url);
        }
        
        setLoading(false);
      };
      
      loadFile();
    }, [file]);

    const category = getFileCategory(file.type);
    console.log('[FileContentPreview] Final category for rendering:', category);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Unable to preview this file
            <br />
            <span className="text-sm">{errorMessage || 'Error loading file. You can still download it.'}</span>
          </p>
        </div>
      );
    }

    console.log('[FileContentPreview] About to render with category:', category, 'fileUrl:', fileUrl ? 'present' : 'missing');

    switch (category) {
      case 'image':
        console.log('[FileContentPreview] Rendering image preview for:', file.name);
        return (
          <div className="flex justify-center bg-muted rounded-lg p-4 relative group">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-64 object-contain rounded"
              onLoad={() => console.log('[FileContentPreview] Image loaded successfully:', file.name)}
              onError={(e) => {
                console.error('[FileContentPreview] Image failed to load:', file.name, 'URL:', fileUrl);
                console.error('[FileContentPreview] Image error event:', e);
                setError(true);
                setErrorMessage('Failed to load image');
              }}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 shadow-lg"
                    title="Expand image"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                      <span className="truncate">{file.name}</span>
                      <span className="text-sm font-normal text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                        {file.type}
                      </span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-auto">
                    <ExpandedFilePreview file={file} />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')} by {file.uploader?.name || 'Unknown'}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadFile(file)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg">
            <video
              controls
              className="w-full max-h-64 rounded-lg"
              onError={() => setError(true)}
            >
              <source src={fileUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-32 bg-muted rounded-lg">
            <Music className="h-12 w-12 text-primary mb-2" />
            <audio
              controls
              className="w-full max-w-md"
              onError={() => setError(true)}
            >
              <source src={fileUrl} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-64 border rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={file.name}
              onError={() => setError(true)}
            />
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-64 bg-muted rounded-lg p-4 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {textContent || 'Loading text content...'}
            </pre>
          </div>
        );

      case 'office':
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
        return (
          <div className="w-full h-64 border rounded-lg overflow-hidden">
            <iframe
              src={officeViewerUrl}
              className="w-full h-full"
              title={file.name}
              onError={() => setError(true)}
              allow="fullscreen"
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            {getFileIcon(file.type)}
            <p className="text-muted-foreground mt-4 text-center">
              Preview not available for this file type
              <br />
              <span className="text-sm">Use the download button to view this file</span>
            </p>
          </div>
        );
    }
  };

  // Expanded File Preview Component for fullscreen view
  const ExpandedFilePreview = ({ file }: { file: FileItem }) => {
    const [fileUrl, setFileUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [textContent, setTextContent] = useState<string>('');

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

    useEffect(() => {
      const loadFile = async () => {
        setLoading(true);
        setError(false);
        setErrorMessage('');
        
        console.log('[ExpandedFilePreview] Loading file:', file.name, 'type:', file.type);
        
        const result = await getFileUrl(file.path);
        
        if (!result.success || !result.url) {
          setError(true);
          setErrorMessage(result.error || 'Unknown error');
          setLoading(false);
          return;
        }
        
        setFileUrl(result.url);
        
        const category = getFileCategory(file.type);
        
        if (category === 'text') {
          await loadTextContent(result.url);
        }
        
        setLoading(false);
      };
      
      loadFile();
    }, [file]);

    const category = getFileCategory(file.type);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
          <File className="h-24 w-24 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center text-lg">
            Unable to preview this file
            <br />
            <span className="text-sm">{errorMessage || 'Error loading file. You can still download it.'}</span>
          </p>
        </div>
      );
    }

    switch (category) {
      case 'image':
        return (
          <div className="flex justify-center bg-muted rounded-lg p-6 min-h-[60vh]">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded shadow-lg"
              onLoad={() => console.log('[ExpandedFilePreview] Image loaded successfully:', file.name)}
              onError={(e) => {
                console.error('[ExpandedFilePreview] Image failed to load:', file.name);
                setError(true);
                setErrorMessage('Failed to load image');
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg min-h-[60vh] flex items-center justify-center">
            <video
              controls
              className="max-w-full max-h-full rounded-lg"
              onError={() => setError(true)}
            >
              <source src={fileUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            <Music className="h-24 w-24 text-primary mb-6" />
            <audio
              controls
              className="w-full max-w-2xl"
              onError={() => setError(true)}
            >
              <source src={fileUrl} />
              Your browser does not support the audio tag.
            </audio>
            <p className="text-lg font-medium mt-4">{file.name}</p>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[80vh] border rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={file.name}
              onError={() => setError(true)}
            />
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-[70vh] bg-muted rounded-lg p-6 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {textContent || 'Loading text content...'}
            </pre>
          </div>
        );

      case 'office':
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
        return (
          <div className="w-full h-[80vh] border rounded-lg overflow-hidden">
            <iframe
              src={officeViewerUrl}
              className="w-full h-full"
              title={file.name}
              onError={() => setError(true)}
              allow="fullscreen"
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            {getFileIcon(file.type)}
            <p className="text-muted-foreground mt-6 text-center text-lg">
              Preview not available for this file type
              <br />
              <span className="text-sm">Use the download button to view this file</span>
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="p-6">Loading files and folders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0D5C4B] mb-2">
            {studentName ? `${studentName}'s Files & Folders` : 'File Explorer'}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {loading && <span className="text-blue-600">Loading...</span>}
            {selectedItems.size > 0 && (
              <span className="text-primary font-medium">
                {selectedItems.size} selected
              </span>
            )}
          </div>
          {isAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-xs text-gray-500">Tip: Drag and drop files/folders to organize them</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrashModalOpen(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="View deleted items in trash"
            >
              <Trash2 className="h-4 w-4" />
              Trash
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant="outline"
          onClick={() => setCreateFolderModalOpen(true)}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        {isAdmin && (
          <>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </>
        )}
        {selectedItems.size > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setMovingItems({
                files: getSelectedFiles(),
                folders: getSelectedFolders()
              });
              setMoveModalOpen(true);
            }}
          >
            <Move className="h-4 w-4 mr-2" />
            Move ({selectedItems.size})
          </Button>
        )}
      </div>

      {/* Breadcrumb navigation */}
      <div 
        className={cn(
          "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
          dragOverFolder === 'root' && "ring-2 ring-blue-400 bg-blue-100"
        )}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToFolder(null)}
            className="flex items-center space-x-1"
          >
            <Home className="h-4 w-4" />
            <span>Root</span>
          </Button>
          
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToFolder(folder.id)}
                className={cn(
                  "flex items-center space-x-1",
                  index === breadcrumbs.length - 1 && "font-medium text-primary"
                )}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <Folder className="h-4 w-4" />
                <span>{folder.name}</span>
              </Button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          
          {currentFolderId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const parentId = breadcrumbs.length > 0 
                  ? breadcrumbs[breadcrumbs.length - 2]?.id || null
                  : null;
                navigateToFolder(parentId);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        
        {dragOverFolder === null && draggedItem && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-100 px-2 py-1 rounded text-xs text-blue-700">
              Drop in root folder
            </div>
          </div>
        )}
      </div>

      {/* Folder and file grid/list */}
      <Card>
        <CardContent 
          className={cn(
            "p-6",
            dragOverFolder === 'current' && folders.length === 0 && files.length === 0 && "ring-2 ring-blue-400 bg-blue-50"
          )}
          onDragOver={(e) => folders.length === 0 && files.length === 0 ? handleDragOver(e, currentFolderId) : undefined}
          onDragLeave={folders.length === 0 && files.length === 0 ? handleDragLeave : undefined}
          onDrop={(e) => folders.length === 0 && files.length === 0 ? handleDrop(e, currentFolderId) : undefined}
        >
          {folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12 relative">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
              <p className="text-gray-600">Create a new folder or {isAdmin ? 'upload files' : 'drag files here'} to get started.</p>
              
              {dragOverFolder === currentFolderId && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-100 px-2 py-1 rounded text-xs text-blue-700">
                    Drop here
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "space-y-2"
            )}>
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={cn(
                    "group relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer",
                    selectedItems.has(`folder:${folder.id}`) && "ring-2 ring-primary bg-primary/5",
                    viewMode === 'list' && "flex items-center space-x-3",
                    dragOverFolder === folder.id && "ring-2 ring-blue-400 bg-blue-50",
                    draggedItem?.id === folder.id && "opacity-50"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onClick={() => handleItemSelect(folder.id, 'folder')}
                  onDoubleClick={() => handleFolderDoubleClick(folder)}
                >
                  <div className={cn(
                    "flex items-center",
                    viewMode === 'grid' ? "flex-col space-y-2" : "space-x-3 flex-1"
                  )}>
                    <Folder className="h-8 w-8 text-blue-500" />
                    <span className="text-sm font-medium truncate">{folder.name}</span>
                    {viewMode === 'list' && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {format(new Date(folder.created_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  {dragOverFolder === folder.id && (
                    <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-100 px-2 py-1 rounded text-xs text-blue-700">
                        Drop here
                      </div>
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setRenamingFolder(folder);
                        setRenameFolderName(folder.name);
                        setRenameModalOpen(true);
                      }}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteFolder(folder.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "group relative border rounded-lg hover:shadow-md transition-all cursor-pointer",
                    selectedItems.has(`file:${file.id}`) && "ring-2 ring-primary bg-primary/5",
                    viewMode === 'list' && "flex items-center space-x-3 p-4",
                    viewMode === 'grid' && "p-3 pb-16", // Extra bottom padding for grid view
                    draggedItem?.id === file.id && "opacity-50"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file.id, 'file')}
                  onClick={() => handleItemSelect(file.id, 'file')}
                >
                  <div className={cn(
                    "flex items-center",
                    viewMode === 'grid' ? "flex-col space-y-3" : "space-x-3 flex-1"
                  )}>
                    {getFileIcon(file.type)}
                    <div className={cn(
                      viewMode === 'grid' ? "text-center w-full" : "flex-1 min-w-0"
                    )}>
                      <span className={cn(
                        "text-sm font-medium block",
                        viewMode === 'grid' ? "truncate max-w-full px-1" : "truncate"
                      )}>
                        {file.name}
                      </span>
                      {file.description && viewMode === 'list' && (
                        <span className="text-xs text-gray-500 truncate block">
                          {file.description}
                        </span>
                      )}
                      {viewMode === 'list' && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <span>Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}</span>
                          {file.uploader && (
                            <span className="block">By {file.uploader.name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons - show on hover or for selected items */}
                  <div className={cn(
                    "absolute flex space-x-1 bg-white rounded shadow-sm border",
                    viewMode === 'grid' ? "top-2 right-2" : "right-2 top-1/2 transform -translate-y-1/2",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}>
                    {/* Preview - Available for all users */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            console.log('Preview button clicked for file:', file.name);
                            e.stopPropagation();
                          }}
                          title="Preview file"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-semibold">
                            File Preview
                          </DialogTitle>
                          <DialogDescription>
                            Details and information about the selected file
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">

                          {/* File Content Preview */}
                          <FileContentPreview file={file} />

                          {/* File Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div>
                                <label className="text-sm font-medium text-gray-700">File Name</label>
                                <p className="mt-1 text-sm text-gray-900">{file.name}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-700">File Type</label>
                                <p className="mt-1 text-sm text-gray-900 uppercase">{file.type}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Date Uploaded</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {format(new Date(file.uploaded_at), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-700">Uploaded By</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {file.uploader?.name || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {file.description && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Description</label>
                              <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-900">{file.description}</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Expand View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-sm font-normal text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                                      {file.type}
                                    </span>
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="flex-1 overflow-auto">
                                  <ExpandedFilePreview file={file} />
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t">
                                  <div className="text-sm text-muted-foreground">
                                    Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')} by {file.uploader?.name || 'Unknown'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(file);
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            {isAdmin && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFile(file);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Download - Available for all users */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      title="Download file"
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {/* Edit and Delete - Admin only */}
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFile(file);
                          }}
                          title="Edit file details or replace content"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{file.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFile(file.id, file.path)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                  
                  {/* File details for grid view - positioned at bottom */}
                  {viewMode === 'grid' && (
                    <div className="absolute bottom-2 left-2 right-2 text-xs text-gray-500 text-center">
                      <div className="truncate">Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}</div>
                      {file.uploader && (
                        <div className="truncate">By {file.uploader.name}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Modal */}
      <Dialog open={createFolderModalOpen} onOpenChange={setCreateFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCreateFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder}>
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Modal */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="renameFolderName">Folder Name</Label>
              <Input
                id="renameFolderName"
                placeholder="Enter new folder name"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && renameFolder()}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={renameFolder}>
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Items Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
            <DialogDescription>
              Select a destination folder for the selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="moveDestination">Destination Folder</Label>
              <Select value={moveDestination || 'root'} onValueChange={(value) => setMoveDestination(value === 'root' ? null : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">📁 Root Folder</SelectItem>
                  {allFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      📁 {getFolderPath(folder)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={moveItems}>
              Move Items
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal - Only for Admins */}
      {isAdmin && (
        <AdvancedUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          studentId={studentId}
          onFilesUploaded={() => loadFolderContents(currentFolderId)}
          currentFolderId={currentFolderId}
        />
      )}

      {/* Edit File Modal - Only for Admins */}
      {isAdmin && selectedFile && (
        <EditFileModal
          open={editFileModalOpen}
          onOpenChange={setEditFileModalOpen}
          file={selectedFile}
          onFileUpdated={() => {
            loadFolderContents(currentFolderId);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Trash Modal - Only for Admins */}
      {isAdmin && (
        <Dialog open={trashModalOpen} onOpenChange={setTrashModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-6 w-6" />
                Trash Management
              </DialogTitle>
              <DialogDescription>
                View and manage deleted files and folders. Restore items to their original locations or permanently delete them and Items are automatically removed after 30 days..
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              <TrashManager 
                isAdmin={true} 
                onItemRestored={() => {
                  // Refresh the current folder view when items are restored
                  loadFolderContents(currentFolderId);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FolderExplorer; 