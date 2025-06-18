
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Users, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AdminFilesList from '@/components/AdminFilesList';
import UploadFileModal from '@/components/UploadFileModal';

const AdminFiles = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch all students for selection
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Filter students based on search term
  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedStudentData = students?.find(s => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0D5C4B]">File Management</h1>
        <p className="text-muted-foreground">Share and manage files with students</p>
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#0D5C4B]" />
              <CardTitle>Select Student</CardTitle>
            </div>
            {selectedStudent && (
              <Button 
                onClick={() => setUploadModalOpen(true)}
                className="bg-[#0D5C4B] hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            )}
          </div>
          <CardDescription>Choose a student to view and manage their files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-80">
              <Label htmlFor="student">Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsLoading ? (
                    <SelectItem value="loading" disabled>Loading students...</SelectItem>
                  ) : filteredStudents.length === 0 ? (
                    <SelectItem value="no-results" disabled>No students found</SelectItem>
                  ) : (
                    filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {selectedStudent ? (
        <AdminFilesList 
          studentId={selectedStudent} 
          studentName={selectedStudentData?.name}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
            <p className="text-gray-600">
              Choose a student from the dropdown above to view and manage their files.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {selectedStudent && (
        <UploadFileModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          studentId={selectedStudent}
          onFileUploaded={() => {
            // Refresh the files list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default AdminFiles;
