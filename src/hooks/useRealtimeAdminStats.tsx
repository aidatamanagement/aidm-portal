import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeAdminStats = () => {
  const queryClient = useQueryClient();

  const fetchAdminStats = async () => {
    console.log('Starting admin stats fetch...');

    try {
      // First, let's check what data exists in the tables
      const [
        studentsResult,
        servicesResult,
        coursesResult,
        filesResult,
        userServicesCheck,
        userCoursesCheck,
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
        
        // Check if user_services table has any data
        supabase
          .from('user_services')
          .select('*')
          .limit(10),

        // Check if user_course_assignments table has any data  
        supabase
          .from('user_course_assignments')
          .select('*')
          .limit(10),

        supabase
          .from('user_progress')
          .select('*')
          .eq('completed', true)
      ]);

      console.log('Raw data check:');
      console.log('Students count:', studentsResult.count);
      console.log('Services count:', servicesResult.count);
      console.log('Courses count:', coursesResult.count);
      console.log('Files count:', filesResult.count);
      console.log('User services raw:', userServicesCheck.data);
      console.log('User courses raw:', userCoursesCheck.data);
      console.log('User services error:', userServicesCheck.error);
      console.log('User courses error:', userCoursesCheck.error);

      // Now get the detailed assigned services and courses
      const [assignedServicesResult, assignedCoursesResult, recentStudentsResult] = await Promise.all([
        // Get assigned services with user and service details
        supabase
          .from('user_services')
          .select(`
            *,
            profiles:fk_user_services_user_id(id, name, email),
            services:user_services_service_id_fkey(id, title, description, type, status)
          `)
          .eq('status', 'active')
          .order('assigned_at', { ascending: false }),

        // Get assigned courses with user and course details
        supabase
          .from('user_course_assignments')
          .select(`
            *,
            profiles:fk_user_course_assignments_user_id(id, name, email),
            courses:user_course_assignments_course_id_fkey(id, title, description)
          `)
          .order('created_at', { ascending: false }),

        // Get recent student enrollments (profiles with role 'student')
        supabase
          .from('profiles')
          .select('id, name, email, created_at, role')
          .eq('role', 'student')
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      console.log('Detailed queries:');
      console.log('Assigned services result:', assignedServicesResult);
      console.log('Assigned courses result:', assignedCoursesResult);
      console.log('Recent students result:', recentStudentsResult);

      // Calculate completion rate
      const totalProgressResult = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true });

      const completedLessons = progressResult.data?.length || 0;
      const totalLessons = totalProgressResult.count || 0;
      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const result = {
        totalStudents: studentsResult.count || 0,
        activeServices: servicesResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalFiles: filesResult.count || 0,
        recentEnrollments: assignedServicesResult.data || [],
        recentStudents: recentStudentsResult.data || [],
        completedLessons,
        completionRate,
        assignedServices: assignedServicesResult.data || [],
        assignedCourses: assignedCoursesResult.data || []
      };

      console.log('Final admin stats result:', result);
      return result;

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  };

  const query = useQuery({
    queryKey: ['admin-stats-realtime'],
    queryFn: fetchAdminStats,
    // refetchInterval: 5000, // Refetch every 5 seconds
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

    const userCoursesChannel = supabase
      .channel('user-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_course_assignments'
        },
        (payload) => {
          console.log('User course assignments change detected:', payload);
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
      supabase.removeChannel(userCoursesChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [queryClient]);

  return query;
};
