
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCoursesData();
    }
  }, [user]);

  const fetchCoursesData = async () => {
    try {
      // Fetch all courses
      const { data: allCourses } = await supabase
        .from('courses')
        .select('*')
        .order('title');

      // Fetch user's enrolled courses
      const { data: assignments } = await supabase
        .from('user_course_assignments')
        .select('course_id, locked')
        .eq('user_id', user?.id);

      // Fetch user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      setCourses(allCourses || []);
      setEnrolledCourses(assignments || []);
      setUserProgress(progress || []);
    } catch (error) {
      console.error('Error fetching courses data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseStatus = (courseId: string) => {
    const enrollment = enrolledCourses.find(e => e.course_id === courseId);
    if (!enrollment) return 'locked';
    if (enrollment.locked) return 'locked';
    return 'enrolled';
  };

  const getCourseProgress = (courseId: string) => {
    const courseProgress = userProgress.filter(p => p.course_id === courseId);
    const completedLessons = courseProgress.filter(p => p.completed).length;
    const totalProgress = courseProgress.length;
    
    return totalProgress > 0 ? Math.round((completedLessons / totalProgress) * 100) : 0;
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'locked') {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Locked</Badge>;
    }
    if (progress === 100) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (progress > 0) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const getActionButton = (course: any, status: string, progress: number) => {
    if (status === 'locked') {
      return (
        <Button variant="outline" disabled>
          <Lock className="h-4 w-4 mr-2" />
          Locked
        </Button>
      );
    }
    
    if (progress === 100) {
      return (
        <Link to={`/courses/${course.id}`}>
          <Button variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Review
          </Button>
        </Link>
      );
    }
    
    if (progress > 0) {
      return (
        <Link to={`/courses/${course.id}`}>
          <Button>Continue</Button>
        </Link>
      );
    }
    
    return (
      <Link to={`/courses/${course.id}`}>
        <Button>Start Course</Button>
      </Link>
    );
  };

  if (loading) {
    return <div className="p-6">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/services')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          <h1 className="text-2xl font-bold">AI Leadership Training</h1>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back later for new courses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const status = getCourseStatus(course.id);
            const progress = getCourseProgress(course.id);
            const isLocked = status === 'locked';

            return (
              <Card 
                key={course.id} 
                className={`hover:shadow-lg transition-shadow ${
                  isLocked ? 'opacity-75' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <BookOpen className={`h-6 w-6 flex-shrink-0 ${
                      isLocked ? 'text-gray-400' : 'text-primary'
                    }`} />
                    {getStatusBadge(status, progress)}
                  </div>
                  <CardTitle className="text-lg leading-6">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isLocked && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Self-paced</span>
                    </div>
                  </div>

                  {getActionButton(course, status, progress)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;
