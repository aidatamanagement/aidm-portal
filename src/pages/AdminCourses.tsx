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
    console.log('Setting up real-time subscriptions for AdminCourses');
    
    const courseAssignmentsChannel = supabase
      .channel('admin-course-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_assignments'
        },
        (payload) => {
          console.log('Real-time course assignment change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-course-assignments'] });
          queryClient.invalidateQueries({ queryKey: ['admin-course-assignment-counts'] });
        }
      )
      .subscribe();

    const coursesChannel = supabase
      .channel('admin-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload) => {
          console.log('Real-time courses change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up AdminCourses real-time subscriptions');
      supabase.removeChannel(courseAssignmentsChannel);
      supabase.removeChannel(coursesChannel);
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

  const { data: courseAssignments } = useQuery({
    queryKey: ['admin-course-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_assignments')
        .select(`
          *,
          profiles:fk_user_course_assignments_user_id(name, email),
          courses:user_course_assignments_course_id_fkey(title)
        `);

      if (error) throw error;
      return data || [];
    },
  });

  // Get assignment counts for each course
  const { data: assignmentCounts } = useQuery({
    queryKey: ['admin-course-assignment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_assignments')
        .select('course_id');

      if (error) throw error;
      
      // Count assignments per course
      const counts: { [key: string]: number } = {};
      data?.forEach((assignment) => {
        const courseId = assignment.course_id;
        counts[courseId] = (counts[courseId] || 0) + 1;
      });
      
      return counts;
    },
  });

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
      <CourseManagementHeader onAddCourse={handleAddCourse} />

      <CourseOverviewCards
        courses={courses || []}
        courseAssignments={courseAssignments || []}
        assignmentCounts={assignmentCounts || {}}
        onEditCourse={handleEditCourse}
        onAddLesson={handleAddLesson}
      />

      <LessonManagement
        courses={courses || []}
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
