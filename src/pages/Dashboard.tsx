
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProgressCircle from '@/components/ProgressCircle';
import SplitText from '@/components/SplitText';
import CountUp from '@/components/CountUp';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Zap, Heart, Copy, TrendingUp, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error, isFetching } = useRealtimeDashboard();
  const [profile, setProfile] = useState<any>(null);
  const [nextLessonInfo, setNextLessonInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user && stats?.hasEnrolledCourses) {
      findNextLesson();
    }
  }, [user, stats]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const findNextLesson = async () => {
    try {
      console.log('Finding next lesson for user:', user?.id);
      
      // Get user's enrolled courses
      const { data: enrolledCourses } = await supabase
        .from('user_course_assignments')
        .select(`
          course_id,
          courses (id, title)
        `)
        .eq('user_id', user?.id);

      console.log('Enrolled courses:', enrolledCourses);

      if (!enrolledCourses || enrolledCourses.length === 0) {
        setNextLessonInfo(null);
        return;
      }

      // For each course, find the next incomplete lesson
      for (const enrollment of enrolledCourses) {
        const courseId = enrollment.course_id;
        console.log('Processing course:', courseId);

        // Get all lessons for this course ordered by order
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, order, course_id')
          .eq('course_id', courseId)
          .order('order');

        console.log('Lessons for course:', lessons);

        if (!lessons || lessons.length === 0) continue;

        // Get user progress for this course
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user?.id)
          .eq('course_id', courseId);

        console.log('User progress for course:', progress);

        const completedLessonIds = progress?.filter(p => p.completed).map(p => p.lesson_id) || [];
        console.log('Completed lesson IDs:', completedLessonIds);

        // Find first incomplete lesson
        const nextLesson = lessons.find(lesson => !completedLessonIds.includes(lesson.id));
        console.log('Next incomplete lesson:', nextLesson);

        if (nextLesson) {
          const lessonInfo = {
            courseId,
            courseName: enrollment.courses.title,
            lessonId: nextLesson.id,
            lessonTitle: nextLesson.title,
            allLessonsCompleted: false
          };
          console.log('Setting next lesson info:', lessonInfo);
          setNextLessonInfo(lessonInfo);
          return;
        } else {
          // All lessons completed for this course
          const completedInfo = {
            courseId,
            courseName: enrollment.courses.title,
            lessonId: null,
            lessonTitle: null,
            allLessonsCompleted: true
          };
          console.log('All lessons completed, setting info:', completedInfo);
          setNextLessonInfo(completedInfo);
          return;
        }
      }
    } catch (error) {
      console.error('Error finding next lesson:', error);
    }
  };

  const progressPercentage = stats?.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  const copyPrompt = (prompt: any) => {
    const promptText = `${prompt.context} ${prompt.task}`;
    navigator.clipboard.writeText(promptText);
    toast.success('Prompt copied to clipboard!');
  };

  const promptsToShow = stats?.favoritePrompts.length > 0 
    ? stats.favoritePrompts.map(f => f.prompts).filter(Boolean)
    : stats?.allPrompts || [];

  const handleWelcomeAnimationComplete = () => {
    console.log('Welcome animation completed!');
  };

  const handleNameAnimationComplete = () => {
    console.log('Name animation completed!');
  };

  const userName = profile?.name || user?.user_metadata?.name || 'Valued Client';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const getTrainingMaterialsLink = () => {
    console.log('Getting training materials link, nextLessonInfo:', nextLessonInfo);
    
    if (!nextLessonInfo) return '/courses';
    
    // Always link to the course page instead of individual lessons
    return `/courses/${nextLessonInfo.courseId}`;
  };

  const getTrainingMaterialsText = () => {
    console.log('Getting training materials text, nextLessonInfo:', nextLessonInfo);
    
    if (!nextLessonInfo) return 'Access Training Materials';
    
    if (nextLessonInfo.allLessonsCompleted) {
      return 'Review Course';
    } else {
      return 'Continue Learning';
    }
  };

  const getTrainingDescription = () => {
    if (!stats?.hasEnrolledCourses) {
      return 'Contact us to get enrolled in exclusive AI leadership training courses.';
    }
    
    if (!nextLessonInfo) {
      return 'Loading your course progress...';
    }
    
    if (nextLessonInfo.allLessonsCompleted) {
      return 'Congratulations! You\'ve completed all lessons. Review your courses or explore new content.';
    } else {
      return `Continue with your next lesson: ${nextLessonInfo.lessonTitle}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Real-time indicator */}
      {isFetching && (
        <div className="fixed top-20 right-4 z-50 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
          Updating...
        </div>
      )}

      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <SplitText
            text={`Welcome, ${userName}`}
            className="text-3xl font-bold mb-2"
            delay={50}
            duration={0.8}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 50, rotationX: -90 }}
            to={{ opacity: 1, y: 0, rotationX: 0 }}
            threshold={0.1}
            rootMargin="-50px"
            textAlign="left"
            onLetterAnimationComplete={handleWelcomeAnimationComplete}
          />
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
                    <p className="text-xs text-muted-foreground">
                      <CountUp to={stats?.completedLessons || 0} duration={1.2} className="font-medium" /> of <CountUp to={stats?.totalLessons || 0} duration={1.2} className="font-medium" /> lessons
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
                <p className="text-2xl font-bold">
                  <CountUp to={stats?.enrolledServices.length || 0} duration={1.5} className="text-2xl font-bold" />
                </p>
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
                <p className="text-2xl font-bold">
                  <CountUp to={stats?.totalFiles || 0} duration={1.8} separator="," className="text-2xl font-bold" />
                </p>
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
                <p className="text-2xl font-bold">
                  <CountUp to={stats?.favoritePrompts.length || 0} duration={2} className="text-2xl font-bold" />
                </p>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Leadership Training */}
        <Card className="relative overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 border-2 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">AI Leadership Training</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">Advance your AI leadership skills</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="p-4 bg-card/50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2 text-foreground">Ready to Lead the AI Revolution?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {getTrainingDescription()}
                </p>
                {stats?.hasEnrolledCourses ? (
                  <Link to={getTrainingMaterialsLink()} className="block w-full">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground relative z-20">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {getTrainingMaterialsText()}
                    </Button>
                  </Link>
                ) : (
                  <Link to="/support" className="block w-full">
                    <Button variant="outline" className="w-full relative z-20">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support for Enrollment
                    </Button>
                  </Link>
                )}
              </div>
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
        
        {/* Prompts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>
                  {stats?.favoritePrompts.length > 0 ? 'Favorite Prompts' : 'Prompts'}
                </CardTitle>
              </div>
              <Link to="/prompts">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>
              {stats?.favoritePrompts.length > 0 
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
              {(!stats?.enrolledServices || stats.enrolledServices.length === 0) ? (
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
      </div>
    </div>
  );
};

export default Dashboard;
