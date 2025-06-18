
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeAdminStats = () => {
  const queryClient = useQueryClient();

  const fetchAdminStats = async () => {
    const [
      studentsResult,
      servicesResult,
      coursesResult,
      filesResult,
      enrollmentsResult,
      progressResult
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),
      
      supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('files')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('user_services')
        .select(`
          *,
          profiles!user_services_user_id_fkey(name, email),
          services!user_services_service_id_fkey(title)
        `)
        .order('assigned_at', { ascending: false }),
      
      supabase
        .from('user_progress')
        .select('*')
        .eq('completed', true)
    ]);

    // Calculate completion rate
    const totalProgressResult = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true });

    const completedLessons = progressResult.data?.length || 0;
    const totalLessons = totalProgressResult.count || 0;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      totalStudents: studentsResult.count || 0,
      activeServices: servicesResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalFiles: filesResult.count || 0,
      recentEnrollments: enrollmentsResult.data || [],
      completedLessons,
      completionRate
    };
  };

  const query = useQuery({
    queryKey: ['admin-stats-realtime'],
    queryFn: fetchAdminStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for admin stats');

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-stats-realtime'] });
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-stats-realtime'] });
        }
      )
      .subscribe();

    const userServicesChannel = supabase
      .channel('user-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services'
        },
        (payload) => {
          console.log('User services change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-stats-realtime'] });
        }
      )
      .subscribe();

    const progressChannel = supabase
      .channel('progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        (payload) => {
          console.log('Progress change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-stats-realtime'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin real-time subscriptions');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(userServicesChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [queryClient]);

  return query;
};
