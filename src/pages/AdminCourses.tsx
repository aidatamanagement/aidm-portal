import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Users, Lock, Unlock, Plus, Edit, Trash2, FileText } from 'lucide-react';
import CourseForm from '@/components/CourseForm';
import LessonForm from '@/components/LessonForm';
import DeleteLessonDialog from '@/components/DeleteLessonDialog';

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [deleteLessonOpen, setDeleteLessonOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Set up real-time subscription for course assignments
  useEffect(() => {
    const channel = supabase
      .channel('course-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_assignments'
        },
        (payload) => {
          console.log('Real-time course assignment change:', payload);
          // Invalidate and refetch course assignments data
          queryClient.invalidateQueries({ queryKey: ['admin-course-assignments'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_lesson_locks'
        },
        (payload) => {
          console.log('Real-time lesson lock change:', payload);
          // Invalidate and refetch lesson locks data
          queryClient.invalidateQueries({ queryKey: ['admin-lesson-locks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const isLessonLocked = (lessonId: string, studentId: string) => {
    return lessonLocks?.some(lock => 
      lock.lesson_id === lessonId && 
      lock.user_id === studentId && 
      lock.locked
    );
  };

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lesson deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setDeleteLessonOpen(false);
      setSelectedLesson(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete lesson: ${error.message}`);
    },
  });

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setFormMode('add');
    setCourseFormOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setFormMode('edit');
    setCourseFormOpen(true);
  };

  const handleAddLesson = (courseId: string) => {
    setSelectedCourse({ id: courseId });
    setSelectedLesson(null);
    setFormMode('add');
    setLessonFormOpen(true);
  };

  const handleEditLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setFormMode('edit');
    setLessonFormOpen(true);
  };

  const handleDeleteLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setDeleteLessonOpen(true);
  };

  const confirmDeleteLesson = () => {
    if (selectedLesson) {
      deleteLessonMutation.mutate(selectedLesson.id);
    }
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
      {/* Header with Add Course Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0D5C4B]">Course Management</h1>
          <p className="text-muted-foreground">Manage courses and lesson access</p>
        </div>
        <Button onClick={handleAddCourse}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Courses Overview with Enhanced Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => {
          const assignedCount = courseAssignments?.filter(ca => ca.course_id === course.id).length || 0;
          const lessonCount = course.lessons?.length || 0;
          
          return (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-[#0D5C4B]" />
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCourse(course)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLesson(course.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Lesson Management */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Management</CardTitle>
          <CardDescription>Edit lessons and manage individual lesson access for students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses?.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{course.title}</h3>
                <div className="space-y-2">
                  {course.lessons?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No lessons yet. Click "Add Lesson" above to create the first lesson.</p>
                  ) : (
                    course.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLesson(lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CourseForm
        isOpen={courseFormOpen}
        onClose={() => setCourseFormOpen(false)}
        course={selectedCourse}
        mode={formMode}
      />

      <LessonForm
        isOpen={lessonFormOpen}
        onClose={() => setLessonFormOpen(false)}
        courseId={selectedCourse?.id}
        lesson={selectedLesson}
        mode={formMode}
      />

      <DeleteLessonDialog
        isOpen={deleteLessonOpen}
        onClose={() => setDeleteLessonOpen(false)}
        onConfirm={confirmDeleteLesson}
        lessonTitle={selectedLesson?.title || ''}
        isDeleting={deleteLessonMutation.isPending}
      />
    </div>
  );
};

export default AdminCourses;
