
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useRealtimeDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchDashboardData = async () => {
    if (!user?.id) return null;

    console.log('Fetching dashboard data for user:', user.id);

    // Fetch user's enrolled courses and progress in parallel
    const [
      assignmentsResult,
      progressResult,
      filesResult,
      favoritesResult,
      allPromptsResult,
      userServicesResult
    ] = await Promise.all([
      supabase
        .from('user_course_assignments')
        .select(`
          course_id,
          courses (id, title, description)
        `)
        .eq('user_id', user.id),
      
      supabase
        .from('user_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user.id),
      
      supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),
      
      supabase
        .from('favorites')
        .select(`
          prompt_id,
          prompts (id, title, context, task)
        `)
        .eq('user_id', user.id)
        .limit(3),
      
      supabase
        .from('prompts')
        .select('id, title, context, task')
        .limit(3),
      
      supabase
        .from('user_services')
        .select(`
          service_id,
          status,
          services (id, title, description, type)
        `)
        .eq('user_id', user.id)
    ]);

    // Get all lessons from enrolled courses
    const enrolledCourseIds = assignmentsResult.data?.map(a => a.course_id) || [];
    let totalLessonsCount = 0;
    
    if (enrolledCourseIds.length > 0) {
      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('course_id', enrolledCourseIds);
      
      totalLessonsCount = lessonsCount || 0;
    }

    const completedLessonsCount = progressResult.data?.filter(p => p.completed).length || 0;
    const totalCourses = assignmentsResult.data?.length || 0;
    const hasEnrolledCourses = totalCourses > 0;

    const stats = {
      totalCourses,
      completedCourses: 0, // We'll calculate this properly if needed
      totalFiles: filesResult.count || 0,
      favoritePrompts: favoritesResult.data || [],
      allPrompts: allPromptsResult.data || [],
      enrolledServices: userServicesResult.data || [],
      hasEnrolledCourses,
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount
    };

    console.log('Dashboard stats:', stats);
    return stats;
  };

  // Use React Query for caching and background refetching
  const query = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to changes in user_progress
    const progressChannel = supabase
      .channel('user_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Progress change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    // Subscribe to changes in user_course_assignments
    const assignmentsChannel = supabase
      .channel('assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_assignments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Assignments change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    // Subscribe to changes in files
    const filesChannel = supabase
      .channel('files_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Files change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    // Subscribe to changes in favorites
    const favoritesChannel = supabase
      .channel('favorites_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Favorites change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    // Subscribe to changes in user_services
    const servicesChannel = supabase
      .channel('user_services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(favoritesChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [user?.id, queryClient]);

  return query;
};
