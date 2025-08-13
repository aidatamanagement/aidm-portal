import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
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

      setCourse(courseData);
      setLessons(lessonsData || []);
      setUserProgress(progressData || []);
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

              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                      <Button variant="outline" size="sm">
                        {isCompleted ? 'Review' : 'Start'}
                      </Button>
                    </Link>
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
