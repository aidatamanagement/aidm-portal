
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
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
    },
  });
};
