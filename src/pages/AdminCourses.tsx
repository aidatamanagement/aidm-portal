import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Plus, Users, Lock, Unlock, X } from 'lucide-react';

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ['admin-students-list'],
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

  const { data: courseAssignments } = useQuery({
    queryKey: ['admin-course-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_assignments')
        .select(`
          *,
          profiles (name, email),
          courses (title)
        `);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: lessonLocks } = useQuery({
    queryKey: ['admin-lesson-locks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_lesson_locks')
        .select(`
          *,
          profiles (name),
          lessons (title)
        `);

      if (error) throw error;
      return data || [];
    },
  });

  const assignCourseMutation = useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const { error } = await supabase
        .from('user_course_assignments')
        .insert({
          course_id: courseId,
          user_id: studentId,
          locked: false
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-course-assignments'] });
      setAssignDialogOpen(false);
      setSelectedCourse('');
      setSelectedStudent('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign course: ${error.message}`);
    },
  });

  const removeCourseAssignmentMutation = useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const { error } = await supabase
        .from('user_course_assignments')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course assignment removed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-course-assignments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove course assignment: ${error.message}`);
    },
  });

  const toggleLessonLockMutation = useMutation({
    mutationFn: async ({ lessonId, studentId, locked }: { lessonId: string; studentId: string; locked: boolean }) => {
      if (locked) {
        // Create lock
        const { error } = await supabase
          .from('user_lesson_locks')
          .insert({
            lesson_id: lessonId,
            user_id: studentId,
            course_id: courses?.find(c => c.lessons?.some(l => l.id === lessonId))?.id,
            locked: true
          });
        if (error) throw error;
      } else {
        // Remove lock
        const { error } = await supabase
          .from('user_lesson_locks')
          .delete()
          .eq('lesson_id', lessonId)
          .eq('user_id', studentId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Lesson lock updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-lesson-locks'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update lesson lock: ${error.message}`);
    },
  });

  const handleAssignCourse = () => {
    if (!selectedCourse || !selectedStudent) {
      toast.error('Please select both a course and a student');
      return;
    }

    assignCourseMutation.mutate({
      courseId: selectedCourse,
      studentId: selectedStudent
    });
  };

  const isLessonLocked = (lessonId: string, studentId: string) => {
    return lessonLocks?.some(lock => 
      lock.lesson_id === lessonId && 
      lock.user_id === studentId && 
      lock.locked
    );
  };

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C4B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0D5C4B]">Course Management</h1>
          <p className="text-muted-foreground">Manage courses, assignments, and lesson access</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0D5C4B] hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Assign Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Course to Student</DialogTitle>
              <DialogDescription>
                Select a course and student to create a new assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAssignCourse}
                  disabled={assignCourseMutation.isPending}
                  className="bg-[#0D5C4B] hover:bg-green-700"
                >
                  {assignCourseMutation.isPending ? 'Assigning...' : 'Assign Course'}
                </Button>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Assignments</CardTitle>
          <CardDescription>Manage which students are assigned to which courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseAssignments?.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.profiles?.name}</p>
                      <p className="text-sm text-muted-foreground">{assignment.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{assignment.courses?.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.locked ? "destructive" : "default"}>
                      {assignment.locked ? 'Locked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCourseAssignmentMutation.mutate({
                        courseId: assignment.course_id,
                        studentId: assignment.user_id
                      })}
                      disabled={removeCourseAssignmentMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!courseAssignments?.length && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No course assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => {
          const assignedCount = courseAssignments?.filter(ca => ca.course_id === course.id).length || 0;
          const lessonCount = course.lessons?.length || 0;
          
          return (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-[#0D5C4B]" />
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </div>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lessons:</span>
                    <span className="font-medium">{lessonCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assigned Students:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{assignedCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lesson Locks Management */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Access Control</CardTitle>
          <CardDescription>Manage individual lesson access for students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses?.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{course.title}</h3>
                <div className="space-y-2">
                  {course.lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                      <div className="space-y-2">
                        {students?.map((student) => {
                          const isAssigned = courseAssignments?.some(ca => 
                            ca.course_id === course.id && ca.user_id === student.id
                          );
                          
                          if (!isAssigned) return null;

                          const locked = isLessonLocked(lesson.id, student.id);
                          
                          return (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{student.name}</span>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`lock-${lesson.id}-${student.id}`} className="text-xs">
                                  {locked ? 'Locked' : 'Unlocked'}
                                </Label>
                                <Switch
                                  id={`lock-${lesson.id}-${student.id}`}
                                  checked={locked}
                                  onCheckedChange={(checked) => 
                                    toggleLessonLockMutation.mutate({
                                      lessonId: lesson.id,
                                      studentId: student.id,
                                      locked: checked
                                    })
                                  }
                                />
                                {locked ? (
                                  <Lock className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Unlock className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourses;
