
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CourseManagementHeader from '@/components/admin/CourseManagementHeader';
import CourseOverviewCards from '@/components/admin/CourseOverviewCards';
import LessonManagement from '@/components/admin/LessonManagement';
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

  const handleToggleLessonLock = (lessonId: string, studentId: string, locked: boolean) => {
    toggleLessonLockMutation.mutate({ lessonId, studentId, locked });
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
      <CourseManagementHeader onAddCourse={handleAddCourse} />

      <CourseOverviewCards
        courses={courses || []}
        courseAssignments={courseAssignments || []}
        onEditCourse={handleEditCourse}
        onAddLesson={handleAddLesson}
      />

      <LessonManagement
        courses={courses || []}
        students={students || []}
        courseAssignments={courseAssignments || []}
        lessonLocks={lessonLocks || []}
        isLessonLocked={isLessonLocked}
        onToggleLessonLock={handleToggleLessonLock}
        onEditLesson={handleEditLesson}
        onDeleteLesson={handleDeleteLesson}
        onAddLesson={handleAddLesson}
      />

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
