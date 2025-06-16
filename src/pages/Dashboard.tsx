
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProgressCircle from '@/components/ProgressCircle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Zap, Heart, Lock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    recentFiles: [],
    dailyPrompt: null,
    enrolledServices: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's enrolled courses and progress
      const { data: assignments } = await supabase
        .from('user_course_assignments')
        .select(`
          course_id,
          courses (id, title, description)
        `)
        .eq('user_id', user?.id);

      // Fetch user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('course_id, completed')
        .eq('user_id', user?.id);

      // Fetch recent files
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('student_id', user?.id)
        .order('uploaded_at', { ascending: false })
        .limit(3);

      // Fetch a random daily prompt
      const { data: prompts } = await supabase
        .from('prompts')
        .select('*')
        .limit(1);

      // Fetch enrolled services
      const { data: userServices } = await supabase
        .from('user_services')
        .select(`
          service_id,
          status,
          services (id, title, description, type)
        `)
        .eq('user_id', user?.id);

      const totalCourses = assignments?.length || 0;
      const completedCourses = progress?.filter(p => p.completed)?.length || 0;

      setStats({
        totalCourses,
        completedCourses,
        recentFiles: files || [],
        dailyPrompt: prompts?.[0] || null,
        enrolledServices: userServices || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = stats.totalCourses > 0 
    ? Math.round((stats.completedCourses / stats.totalCourses) * 100) 
    : 0;

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.name || 'Student'}!
        </h1>
        <p className="text-gray-600">Ready to continue your learning journey?</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Course Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
              </div>
              <ProgressCircle progress={progressPercentage} size={48} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Files</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentFiles.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Ready to learn?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explore your available courses and continue your progress.
                </p>
                <Link to="/courses">
                  <Button>View Courses</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Services */}
        <Card>
          <CardHeader>
            <CardTitle>My Services</CardTitle>
            <CardDescription>Active and pending services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.enrolledServices.length === 0 ? (
                <div className="text-center py-4">
                  <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No services enrolled yet</p>
                  <Link to="/services" className="mt-2 inline-block">
                    <Button variant="outline" size="sm">Browse Services</Button>
                  </Link>
                </div>
              ) : (
                stats.enrolledServices.slice(0, 3).map((userService: any) => (
                  <div key={userService.service_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {userService.status === 'active' ? (
                        <Zap className="h-5 w-5 text-green-600" />
                      ) : userService.status === 'pending' ? (
                        <div className="h-5 w-5 rounded-full bg-yellow-200 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
                        </div>
                      ) : (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{userService.services.title}</p>
                        <p className="text-xs text-gray-600 capitalize">{userService.status}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>Your latest uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentFiles.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No files uploaded yet</p>
                </div>
              ) : (
                stats.recentFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-600">{file.type.toUpperCase()}</p>
                    </div>
                  </div>
                ))
              )}
              {stats.recentFiles.length > 0 && (
                <Link to="/files">
                  <Button variant="outline" size="sm" className="w-full">View All Files</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Writing Prompt</CardTitle>
            <CardDescription>Get inspired with today's prompt</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.dailyPrompt ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{stats.dailyPrompt.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{stats.dailyPrompt.context}</p>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorite
                    </Button>
                    <Link to="/prompts">
                      <Button variant="outline" size="sm">View All Prompts</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No prompts available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
