
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeAdminStats = () => {
  const queryClient = useQueryClient();

  const fetchAdminStats = async () => {
    // Get total students
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Get active services
    const { count: activeServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total courses
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Get total files
    const { count: totalFiles } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true });

    // Get recent enrollments
    const { data: recentEnrollments } = await supabase
      .from('user_services')
      .select(`
        *,
        profiles(name, email),
        services(title)
      `)
      .order('assigned_at', { ascending: false })
      .limit(5);

    // Get course completion stats
    const { data: completionStats } = await supabase
      .from('user_progress')
      .select('completed, course_id')
      .eq('completed', true);

    // Calculate completion rate
    const { count: totalProgress } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true });

    const completionRate = totalProgress > 0 
      ? Math.round((completionStats?.length || 0) / totalProgress * 100)
      : 0;

    return {
      totalStudents: totalStudents || 0,
      activeServices: activeServices || 0,
      totalCourses: totalCourses || 0,
      totalFiles: totalFiles || 0,
      recentEnrollments: recentEnrollments || [],
      completionRate,
      completedLessons: completionStats?.length || 0
    };
  };

  const query = useQuery({
    queryKey: ['realtime-admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 5000, // Refetch every 5 seconds as backup
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for admin stats');

    // Subscribe to user_services changes
    const userServicesChannel = supabase
      .channel('user_services_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services'
        },
        (payload) => {
          console.log('User services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to user_course_assignments changes
    const courseAssignmentsChannel = supabase
      .channel('course_assignments_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_assignments'
        },
        (payload) => {
          console.log('Course assignments change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to user_progress changes
    const progressChannel = supabase
      .channel('progress_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        (payload) => {
          console.log('Progress change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('profiles_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to services changes
    const servicesChannel = supabase
      .channel('services_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to courses changes
    const coursesChannel = supabase
      .channel('courses_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload) => {
          console.log('Courses change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to files changes
    const filesChannel = supabase
      .channel('files_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files'
        },
        (payload) => {
          console.log('Files change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['realtime-admin-stats'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin real-time subscriptions');
      supabase.removeChannel(userServicesChannel);
      supabase.removeChannel(courseAssignmentsChannel);
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(filesChannel);
    };
  }, [queryClient]);

  return query;
};
