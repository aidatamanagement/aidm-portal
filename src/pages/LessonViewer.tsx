
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
        .maybeSingle();

      // Fetch user progress for this lesson
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user?.id)
        .maybeSingle();

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

  const goToNextLesson = () => {
    if (nextLesson) {
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  };

  // Helper function to render plain text from HTML
  const renderTextContent = (htmlContent: string) => {
    if (!htmlContent) return '';
    // Strip HTML tags and decode HTML entities
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
    return textContent;
  };

  if (loading) {
    return <div className="p-6 text-foreground">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="p-6 text-foreground">Lesson not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
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
            <h1 className="text-xl font-semibold text-card-foreground">{lesson.title}</h1>
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
        <div className="max-w-5xl mx-auto space-y-6">
          {/* PDF Viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground">Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] border rounded-lg">
                {lesson.pdf_url ? (
                  <iframe
                    src={lesson.pdf_url}
                    className="w-full h-full rounded-lg"
                    title="Lesson PDF"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                    <p className="text-muted-foreground">No PDF content available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructor Notes */}
          {lesson.instructor_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Instructor Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div 
                    className="text-foreground prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.instructor_notes }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Lesson Card - Shows after completion */}
          {userProgress?.completed && nextLesson && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Lesson Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 dark:text-green-300 mb-2">
                      Great job! You've completed this lesson.
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Ready for the next lesson: <strong>{nextLesson.title}</strong>
                    </p>
                  </div>
                  <Button onClick={goToNextLesson} className="bg-green-600 hover:bg-green-700">
                    Next Lesson
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-card border-t px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div />
          
          <div className="flex items-center space-x-3">
            {!userProgress?.completed && (
              <Button onClick={markComplete}>
                Mark Complete
              </Button>
            )}
            
            {!nextLesson && userProgress?.completed && (
              <div className="text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Course Complete! New lessons coming soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
