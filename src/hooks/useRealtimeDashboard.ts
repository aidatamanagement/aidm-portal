
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealtimeDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchDashboardData = async () => {
    if (!user) throw new Error('User not authenticated');

    console.log('Fetching dashboard data for user:', user.id);

    const [
      enrolledServicesResult,
      coursesResult,
      filesResult,
      promptsResult,
      favoritesResult,
      enrolledCoursesResult,
      progressResult
    ] = await Promise.all([
      // Fix the enrolled services query with proper join
      supabase
        .from('user_services')
        .select(`
          *,
          services!user_services_service_id_fkey(
            id,
            title,
            description,
            type,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active'),
      
      supabase
        .from('user_course_assignments')
        .select('course_id')
        .eq('user_id', user.id),
      
      supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),
      
      supabase
        .from('prompts')
        .select('*')
        .limit(5),
      
      supabase
        .from('favorites')
        .select(`
          *,
          prompts(*)
        `)
        .eq('user_id', user.id),
      
      supabase
        .from('user_course_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
    ]);

    console.log('Enrolled services result:', enrolledServicesResult);
    console.log('User services data:', enrolledServicesResult.data);

    const totalLessons = progressResult.data?.length || 0;
    const completedLessons = progressResult.data?.filter(p => p.completed).length || 0;

    return {
      enrolledServices: enrolledServicesResult.data || [],
      hasEnrolledCourses: (enrolledCoursesResult.count || 0) > 0,
      totalFiles: filesResult.count || 0,
      allPrompts: promptsResult.data || [],
      favoritePrompts: favoritesResult.data || [],
      totalLessons,
      completedLessons
    };
  };

  const query = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for dashboard');

    const userServicesChannel = supabase
      .channel('user-services-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time user services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    const progressChannel = supabase
      .channel('progress-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time progress change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    const favoritesChannel = supabase
      .channel('favorites-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time favorites change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['dashboard-data', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up dashboard real-time subscriptions');
      supabase.removeChannel(userServicesChannel);
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(favoritesChannel);
    };
  }, [user, queryClient]);

  return query;
};
