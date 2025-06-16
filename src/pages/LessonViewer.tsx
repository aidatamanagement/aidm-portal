
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && lessonId && user) {
      fetchLessonData();
    }
  }, [courseId, lessonId, user]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson details
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      // Fetch next lesson
      const { data: nextLessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .gt('order', lessonData?.order || 0)
        .order('order')
        .limit(1)
        .single();

      // Fetch user progress for this lesson
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user?.id)
        .single();

      setLesson(lessonData);
      setNextLesson(nextLessonData);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    try {
      if (userProgress) {
        // Update existing progress
        await supabase
          .from('user_progress')
          .update({ completed: true, pdf_viewed: true })
          .eq('id', userProgress.id);
      } else {
        // Create new progress record
        await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            course_id: courseId,
            lesson_id: lessonId,
            completed: true,
            pdf_viewed: true
          });
      }
      
      // Refresh data
      fetchLessonData();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="p-6">Lesson not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <h1 className="text-xl font-semibold">{lesson.title}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {userProgress?.completed && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{lesson.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* PDF Viewer */}
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">PDF Content Viewer</p>
                <p className="text-sm text-gray-500">
                  PDF URL: {lesson.pdf_url}
                </p>
                {/* In a real implementation, you'd embed a PDF viewer here */}
              </div>

              {/* Instructor Notes */}
              {lesson.instructor_notes && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Instructor Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700">{lesson.instructor_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div />
          
          <div className="flex items-center space-x-3">
            {!userProgress?.completed && (
              <Button onClick={markComplete}>
                Mark Complete
              </Button>
            )}
            
            {nextLesson && userProgress?.completed && (
              <Button
                onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
              >
                Next Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
