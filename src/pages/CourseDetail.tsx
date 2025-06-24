import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Video, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [lessonLocks, setLessonLocks] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchCourseData();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      // Fetch lessons for this course
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order');

      // Fetch user progress for this course
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user?.id);

      // Fetch lesson locks for this user
      const { data: locksData } = await supabase
        .from('user_lesson_locks')
        .select('lesson_id, locked')
        .eq('user_id', user?.id)
        .eq('course_id', id);

      // Convert locks to a map for easy lookup
      const locksMap: { [key: string]: boolean } = {};
      locksData?.forEach(lock => {
        locksMap[lock.lesson_id] = lock.locked;
      });

      setCourse(courseData);
      setLessons(lessonsData || []);
      setUserProgress(progressData || []);
      setLessonLocks(locksMap);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-6">Course not found</div>;
  }

  const completedLessons = userProgress.filter(p => p.completed).length;
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back to Courses Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline" 
          onClick={() => navigate('/courses')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Button>
      </div>

      {/* Course Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{course.title}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedLessons} of {lessons.length} lessons</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Course Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id);
              const isCompleted = lessonProgress?.completed || false;
              const isAdminLocked = lessonLocks[lesson.id] || false;
              const isSequentiallyLocked = index > 0 && !userProgress.find(p => p.lesson_id === lessons[index - 1].id)?.completed;
              const isLocked = isAdminLocked || isSequentiallyLocked;

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isLocked ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{lesson.title}</h3>
                        {isAdminLocked && (
                          <Badge variant="destructive" className="text-xs">
                            🔒 Restricted
                          </Badge>
                        )}
                        {isSequentiallyLocked && !isAdminLocked && (
                          <Badge variant="outline" className="text-xs">
                            Complete previous lesson
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                      {isAdminLocked && (
                        <div className="flex items-center mt-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span>This lesson has been restricted by Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {!isLocked ? (
                      <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                        <Button variant="outline" size="sm">
                          {isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        {isAdminLocked ? 'Restricted' : 'Locked'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseDetail;
