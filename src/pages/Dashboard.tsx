import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProgressCircle from '@/components/ProgressCircle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Zap, Heart, Lock, Copy, TrendingUp, Users, Award } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalFiles: 0,
    favoritePrompts: [],
    allPrompts: [],
    enrolledServices: [],
    hasEnrolledCourses: false,
    totalLessons: 0,
    completedLessons: 0
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

      // Get all lessons from enrolled courses
      const enrolledCourseIds = assignments?.map(a => a.course_id) || [];
      let totalLessonsCount = 0;
      
      if (enrolledCourseIds.length > 0) {
        const { count: lessonsCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .in('course_id', enrolledCourseIds);
        
        totalLessonsCount = lessonsCount || 0;
      }

      // Fetch user progress for completed lessons
      const { data: progress } = await supabase
        .from('user_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user?.id)
        .eq('completed', true);

      const completedLessonsCount = progress?.length || 0;

      // Fetch user progress for completed courses
      const { data: courseProgress } = await supabase
        .from('user_progress')
        .select('course_id, completed')
        .eq('user_id', user?.id)
        .eq('completed', true);

      // Get unique completed courses
      const completedCourseIds = new Set(courseProgress?.map(p => p.course_id) || []);
      const uniqueCompletedCourses = Array.from(completedCourseIds).length;

      // Fetch total files count
      const { count: filesCount } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user?.id);

      // Fetch favorite prompts
      const { data: favorites } = await supabase
        .from('favorites')
        .select(`
          prompt_id,
          prompts (id, title, context, task)
        `)
        .eq('user_id', user?.id)
        .limit(3);

      // Fetch all prompts if no favorites
      const { data: allPrompts } = await supabase
        .from('prompts')
        .select('id, title, context, task')
        .limit(3);

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
      const hasEnrolledCourses = totalCourses > 0;

      setStats({
        totalCourses,
        completedCourses: uniqueCompletedCourses,
        totalFiles: filesCount || 0,
        favoritePrompts: favorites || [],
        allPrompts: allPrompts || [],
        enrolledServices: userServices || [],
        hasEnrolledCourses,
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  const copyPrompt = (prompt: any) => {
    const promptText = `${prompt.context} ${prompt.task}`;
    navigator.clipboard.writeText(promptText);
    toast.success('Prompt copied to clipboard!');
  };

  const promptsToShow = stats.favoritePrompts.length > 0 
    ? stats.favoritePrompts.map(f => f.prompts).filter(Boolean)
    : stats.allPrompts;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.user_metadata?.name || 'Valued Client'}!
          </h1>
          <p className="text-white/90 text-lg max-w-2xl">
            Explore AI innovations, access cutting-edge data management solutions, and connect with our expert services. 
            Your journey into intelligent business transformation starts here.
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-32 h-32 rounded-full border-4 border-white/30"></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Progress</p>
                <div className="flex items-center space-x-3 mt-2">
                  <ProgressCircle progress={progressPercentage} size={60} strokeWidth={4} />
                  <div>
                    <p className="text-2xl font-bold">{progressPercentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedLessons} of {stats.totalLessons} lessons
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold">{stats.enrolledServices.length}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Files</p>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favorite Prompts</p>
                <p className="text-2xl font-bold">{stats.favoritePrompts.length}</p>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Leadership Training */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>AI Leadership Training</CardTitle>
            </div>
            <CardDescription>Advance your AI leadership skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-card/50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">Ready to Lead the AI Revolution?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {stats.hasEnrolledCourses 
                    ? 'Continue your learning journey with your enrolled courses.'
                    : 'Contact us to get enrolled in exclusive AI leadership training courses.'
                  }
                </p>
                {stats.hasEnrolledCourses ? (
                  <Link to="/courses">
                    <Button className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Access Training Materials
                    </Button>
                  </Link>
                ) : (
                  <Link to="/support">
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support for Enrollment
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>My Services</CardTitle>
              </div>
              <Link to="/services">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Active and available services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.enrolledServices.length === 0 ? (
                <div className="text-center py-6">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No active services</p>
                  <Link to="/services">
                    <Button variant="outline" size="sm">Explore Services</Button>
                  </Link>
                </div>
              ) : (
                stats.enrolledServices.slice(0, 3).map((userService: any) => (
                  <div key={userService.service_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        userService.status === 'active' ? 'bg-green-500' : 
                        userService.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">{userService.services.title}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {userService.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prompts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>
                  {stats.favoritePrompts.length > 0 ? 'Favorite Prompts' : 'Prompts'}
                </CardTitle>
              </div>
              <Link to="/prompts">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>
              {stats.favoritePrompts.length > 0 
                ? 'Your bookmarked prompts' 
                : 'Discover powerful AI prompts'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {promptsToShow.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No prompts available</p>
                </div>
              ) : (
                promptsToShow.slice(0, 2).map((prompt: any) => (
                  <div key={prompt.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-1">{prompt.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPrompt(prompt)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{prompt.context}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
            <CardDescription>Access your most-used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/files">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Browse Files</span>
                </Button>
              </Link>
              <Link to="/prompts">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs">Explore Prompts</span>
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Zap className="h-5 w-5" />
                  <span className="text-xs">View Services</span>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">My Profile</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
