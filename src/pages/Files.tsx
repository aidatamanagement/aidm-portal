
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Download, Search, Filter, File, Image, Music, Video, Archive } from 'lucide-react';
import { format } from 'date-fns';
import FilePreview from '@/components/FilePreview';

const Files = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, selectedType]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('student_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Process files to extract proper file type from name if type is not set correctly
      const processedFiles = (data || []).map(file => {
        let fileType = file.type;
        
        // If type is a full MIME type, extract just the extension
        if (fileType && fileType.includes('/')) {
          const mimeToExt = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'text/plain': 'txt',
            'video/mp4': 'mp4',
            'video/avi': 'avi',
            'video/mov': 'mov',
            'audio/mp3': 'mp3',
            'audio/wav': 'wav',
            'application/zip': 'zip',
            'application/x-rar-compressed': 'rar'
          };
          
          fileType = mimeToExt[fileType] || fileType.split('/')[1] || 'file';
        }
        
        // If still no proper type, try to extract from filename
        if (!fileType || fileType === 'file') {
          const extension = file.name.split('.').pop()?.toLowerCase();
          fileType = extension || 'file';
        }
        
        return {
          ...file,
          type: fileType
        };
      });
      
      setFiles(processedFiles);
      console.log('Fetched and processed files:', processedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
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

  const handleDownload = async (file: any) => {
    try {
      // Extract storage path
      let storagePath = file.path;
      
      if (storagePath.startsWith('http')) {
        // Extract path from URL
        const url = new URL(storagePath);
        storagePath = url.pathname.split('/').pop() || '';
      }
      
      // Clean up the path
      storagePath = storagePath.replace(/^\/+/, '');
      if (storagePath.startsWith('student-files/')) {
        storagePath = storagePath.replace('student-files/', '');
      }
      if (!storagePath.startsWith('student_files/')) {
        storagePath = `student_files/${storagePath}`;
      }

      console.log('Downloading from storage path:', storagePath);

      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('student-files')
        .createSignedUrl(storagePath, 60); // 1 minute for download

      if (error) {
        console.error('Error creating download URL:', error);
        return;
      }

      // Download the file
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download failed:', error);
    }
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
        <h1 className="text-2xl font-bold">My Files</h1>
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
              {files.length === 0 ? "You don't have any files yet." : "Try adjusting your search or filters."}
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
                    <p className="text-xs text-gray-400 mt-2">
                      Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <FilePreview file={file} />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Files;
