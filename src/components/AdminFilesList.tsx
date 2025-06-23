import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Search, Upload, File, Image, Music, Video, Archive, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import FilePreview from '@/components/FilePreview';
import UploadFileModal from '@/components/UploadFileModal';
import EditFileModal from '@/components/EditFileModal';
import { toast } from 'sonner';
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

interface AdminFilesListProps {
  studentId: string;
  studentName?: string;
}

const AdminFilesList = ({ studentId, studentName }: AdminFilesListProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    fetchFiles();
  }, [studentId]);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, selectedType]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:profiles!files_uploader_id_fkey(name)
        `)
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Process and normalize file types
      const processedFiles = (data || []).map(file => ({
        ...file,
        type: normalizeFileType(file.type, file.name)
      }));
      
      console.log('Fetched and processed files:', processedFiles);
      setFiles(processedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeFileType = (fileType: string, fileName: string) => {
    // If type is already normalized (no slashes), return as is
    if (!fileType.includes('/')) {
      return fileType.toLowerCase();
    }
    
    // Extract file extension from name as fallback
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Normalize common MIME types to simple extensions
    const mimeTypeMap: { [key: string]: string } = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/msword': 'doc',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.ms-powerpoint': 'ppt',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav'
    };
    
    return mimeTypeMap[fileType] || extension || fileType.split('/')[1] || 'unknown';
  };

  const filterFiles = () => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.type === selectedType);
    }

    setFilteredFiles(filtered);
  };

  const extractStoragePath = (filePath: string) => {
    console.log('Original file path:', filePath);
    
    if (!filePath.startsWith('http')) {
      return filePath;
    }
    
    try {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      
      const bucketIndex = pathParts.indexOf('student-files');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const storagePath = pathParts.slice(bucketIndex + 1).join('/');
        console.log('Extracted storage path:', storagePath);
        return decodeURIComponent(storagePath);
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      console.log('Fallback storage path:', lastPart);
      return decodeURIComponent(lastPart);
    } catch (error) {
      console.error('Error parsing file path:', error);
      return filePath;
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const storagePath = extractStoragePath(file.path);
      console.log('Downloading from storage path:', storagePath);

      const { data, error } = await supabase.storage
        .from('student-files')
        .createSignedUrl(storagePath, 300);

      if (error) {
        console.error('Error creating download URL:', error);
        const { data: publicData } = supabase.storage
          .from('student-files')
          .getPublicUrl(storagePath);
        
        if (publicData.publicUrl) {
          const a = document.createElement('a');
          a.href = publicData.publicUrl;
          a.download = file.name;
          a.style.display = 'none';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => document.body.removeChild(a), 100);
          return;
        }
        return;
      }

      try {
        const response = await fetch(data.signedUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('Download completed successfully');
      } catch (fetchError) {
        console.error('Fetch failed, trying direct link:', fetchError);
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      const storagePath = extractStoragePath(filePath);

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('student-files')
          .remove([storagePath]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleEditFile = (file: any) => {
    setSelectedFile({
      id: file.id,
      name: file.name,
      description: file.description,
      path: file.path,
      student_id: file.student_id,
      type: file.type
    });
    setEditModalOpen(true);
  };

  const getFileIcon = (type: string) => {
    const iconClass = "h-8 w-8 text-primary";
    
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
      case 'flac':
        return <Music className={iconClass} />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className={iconClass} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className={iconClass} />;
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return <FileText className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const uniqueTypes = ['all', ...new Set(files.map(file => file.type))];

  if (loading) {
    return <div className="p-6">Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Files {studentName && `for ${studentName}`}
        </h2>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {files.length === 0 ? "No files uploaded yet." : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{file.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      <p>Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}</p>
                      {file.uploader && (
                        <p>By {file.uploader.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <FilePreview file={file} />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDownload(file)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditFile(file)}
                    title="Edit file details or replace file content"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadFileModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        studentId={studentId}
        onFileUploaded={fetchFiles}
      />

      {selectedFile && (
        <EditFileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          file={selectedFile}
          onFileUpdated={fetchFiles}
        />
      )}
    </div>
  );
};

export default AdminFilesList;
