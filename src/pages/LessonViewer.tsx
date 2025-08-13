import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ArrowRight, CheckCircle, Lock, AlertTriangle, ChevronLeft, ChevronRight, Eye, EyeOff, Download, MoreVertical, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import '@/components/RichTextStyles.css';

const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(-1);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLessonLocked, setIsLessonLocked] = useState(false);
  const [lessonLocks, setLessonLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (courseId && lessonId && user) {
      fetchLessonData();
    }
  }, [courseId, lessonId, user]);

  // Monitor for Google service errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('google') || 
          event.message?.includes('gstatic') || 
          event.message?.toLowerCase().includes('script error')) {
        console.warn('Potential Google service issue detected:', event.message);
        // Don't automatically set PDF error here, let iframe handle it
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const fetchLessonData = async () => {
    try {
      setLoading(true);

      // Fetch all lessons in the course (ordered)
      const { data: allLessonsData } = await supabase
        .from('lessons')
        .select('id, title, order, description')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      // Fetch current lesson details
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      // Find current lesson index
      const lessonIndex = allLessonsData?.findIndex(l => l.id === lessonId) ?? -1;

      // Fetch all lesson locks for this user
      const { data: lockData } = await supabase
        .from('user_lesson_locks')
        .select('lesson_id, locked')
        .eq('user_id', user?.id)
        .eq('locked', true);

      // Check if current lesson is locked
      const currentLessonLock = lockData?.find(lock => lock.lesson_id === lessonId);
      const locked = currentLessonLock?.locked || false;

      // If lesson is locked, don't fetch other data
      if (locked) {
        setIsLessonLocked(true);
        setLesson(lessonData);
        setAllLessons(allLessonsData || []);
        setCurrentLessonIndex(lessonIndex);
        setLoading(false);
        return;
      }

      // Fetch user progress for this lesson
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user?.id)
        .maybeSingle();

      // Debug logging
      console.log('Lesson navigation debug:', {
        lessonId,
        lessonIndex,
        allLessonsCount: allLessonsData?.length,
        allLessonsData: allLessonsData?.map(l => ({ id: l.id, title: l.title, order: l.order })),
        progressData,
        isCompleted: progressData?.completed,
        lockData: lockData?.length
      });

      setLesson(lessonData);
      setAllLessons(allLessonsData || []);
      setCurrentLessonIndex(lessonIndex);
      setUserProgress(progressData);
      setLessonLocks(lockData || []);
      setIsLessonLocked(false);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast.error('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    try {
      console.log('Marking lesson complete:', {
        lessonId,
        courseId,
        userId: user?.id,
        existingProgress: userProgress
      });

      if (userProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('user_progress')
          .update({ completed: true, pdf_viewed: true })
          .eq('id', userProgress.id)
          .select();
        
        console.log('Updated progress:', { data, error });
        if (error) throw error;
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            course_id: courseId,
            lesson_id: lessonId,
            completed: true,
            pdf_viewed: true
          })
          .select();
        
        console.log('Created progress:', { data, error });
        if (error) throw error;
      }
      
      toast.success('Lesson marked as complete!');
      // Refresh data
      fetchLessonData();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  const navigateToLesson = async (targetLessonId: string, direction: 'next' | 'previous') => {
    try {
      setNavigating(true);
      
      // Add smooth transition effect
      const content = document.querySelector('.lesson-content');
      if (content) {
        content.classList.add('opacity-50', 'transition-opacity', 'duration-300');
      }

      // Navigate to the lesson
      navigate(`/courses/${courseId}/lessons/${targetLessonId}`);
      
      // Show direction feedback
      toast.success(`Moving to ${direction} lesson...`);
    } catch (error) {
      console.error('Error navigating to lesson:', error);
      toast.error('Failed to navigate to lesson');
    } finally {
      setTimeout(() => setNavigating(false), 300);
    }
  };

  const goToPreviousLesson = () => {
    const previousLesson = allLessons[currentLessonIndex - 1];
    if (previousLesson) {
      navigateToLesson(previousLesson.id, 'previous');
    }
  };

  const goToNextLesson = () => {
    console.log('goToNextLesson called:', {
      currentLessonIndex,
      allLessonsLength: allLessons.length,
      currentLesson: allLessons[currentLessonIndex],
      nextLessonIndex: currentLessonIndex + 1,
      nextLesson: allLessons[currentLessonIndex + 1]
    });
    
    const nextLesson = allLessons[currentLessonIndex + 1];
    if (nextLesson) {
      console.log('Navigating to next lesson:', nextLesson);
      navigateToLesson(nextLesson.id, 'next');
    } else {
      console.log('No next lesson found');
    }
  };

  const goBackToCourse = () => {
    navigate(`/courses/${courseId}`);
  };

  const isLessonLockedForUser = (lessonId: string) => {
    return lessonLocks.some(lock => lock.lesson_id === lessonId);
  };

  const getPreviousLesson = () => {
    return currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  };

  const getNextLesson = () => {
    return currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  };

  const isNextLessonLocked = () => {
    // Removed sequential lock restrictions - only check admin locks
    const nextLesson = getNextLesson();
    return nextLesson ? isLessonLockedForUser(nextLesson.id) : false;
  };

  const isLastLesson = () => {
    return currentLessonIndex === allLessons.length - 1;
  };

  const downloadPDF = () => {
    if (lesson?.pdf_url) {
      const link = document.createElement('a');
      link.href = lesson.pdf_url;
      link.download = `${lesson.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF download started');
    } else {
      toast.error('PDF not available for download');
    }
  };

  const openPDFInNewTab = () => {
    if (lesson?.pdf_url) {
      window.open(lesson.pdf_url, '_blank');
      toast.success('PDF opened in new tab');
    }
  };

  const refreshPDF = () => {
    setPdfError(false);
    // Force iframe reload by adding timestamp
    const iframe = document.querySelector('iframe[title="Lesson PDF"]') as HTMLIFrameElement;
    if (iframe && lesson?.pdf_url) {
      iframe.src = lesson.pdf_url + '?refresh=' + Date.now();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Lesson not found</p>
            <Button onClick={goBackToCourse} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If lesson is locked, show access denied page
  if (isLessonLocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-800 dark:text-red-200">Lesson Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{lesson.title}</h3>
              <Badge variant="destructive" className="text-xs">
                🔒 Restricted by Admin
              </Badge>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-center text-red-700 dark:text-red-300 mb-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Access Denied</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                This lesson has been restricted by admin. Please contact them for access or check back later.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={goBackToCourse}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();
  const nextLessonLocked = isNextLessonLocked();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToCourse}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Course</span>
              <span className="sm:hidden">Course</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-card-foreground">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground">
                Lesson {currentLessonIndex + 1} of {allLessons.length} 
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {userProgress?.completed && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm hidden sm:inline">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6 lesson-content">
          {/* PDF Viewer */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-card-foreground">Lesson Content</CardTitle>
              <div className="flex items-center space-x-2">
                {/* Download PDF Button */}
                {lesson.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </Button>
                )}
                
                {/* Options Dropdown */}
                {lesson.instructor_notes && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                                         <DropdownMenuContent align="end">
                       <DropdownMenuItem
                         onClick={() => setShowNotes(!showNotes)}
                         className="flex items-center space-x-2"
                       >
                         {showNotes ? (
                           <>
                             <EyeOff className="h-4 w-4" />
                             <span>Hide Instructor Notes</span>
                           </>
                         ) : (
                           <>
                             <Eye className="h-4 w-4" />
                             <span>Show Instructor Notes</span>
                           </>
                         )}
                       </DropdownMenuItem>
                       {lesson.pdf_url && (
                         <>
                           <DropdownMenuItem
                             onClick={openPDFInNewTab}
                             className="flex items-center space-x-2"
                           >
                             <ExternalLink className="h-4 w-4" />
                             <span>Open PDF in New Tab</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem
                             onClick={refreshPDF}
                             className="flex items-center space-x-2"
                           >
                             <RefreshCw className="h-4 w-4" />
                             <span>Refresh PDF</span>
                           </DropdownMenuItem>
                         </>
                       )}
                     </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] sm:h-[600px] border rounded-lg">
                {lesson.pdf_url ? (
                  pdfError ? (
                    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg space-y-4">
                      <AlertTriangle className="h-12 w-12 text-yellow-500" />
                      <div className="text-center">
                        <p className="text-foreground font-medium mb-2">PDF loading issue detected</p>
                        <p className="text-muted-foreground text-sm mb-4">
                          This may be due to Google services or browser restrictions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={refreshPDF}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry Loading</span>
                          </Button>
                          <Button
                            onClick={openPDFInNewTab}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open in New Tab</span>
                          </Button>
                          <Button
                            onClick={downloadPDF}
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download PDF</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <iframe
                    src={lesson.pdf_url}
                    className="w-full h-full rounded-lg"
                    title="Lesson PDF"
                      onError={() => setPdfError(true)}
                      onLoad={() => setPdfError(false)}
                  />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                    <p className="text-muted-foreground">No PDF content available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructor Notes */}
          {lesson.instructor_notes && showNotes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-card-foreground">Instructor Notes</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(false)}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
                >
                  <EyeOff className="h-4 w-4" />
                  <span className="text-xs">Hide</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div 
                    className="text-foreground prose prose-sm max-w-none dark:prose-invert ql-editor"
                    style={{
                      lineHeight: '1.6',
                      fontSize: '14px'
                    }}
                    dangerouslySetInnerHTML={{ __html: lesson.instructor_notes }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Notes Button (when hidden) */}
          {lesson.instructor_notes && !showNotes && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowNotes(true)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Show Instructor Notes</span>
              </Button>
            </div>
          )}

          {/* Completion Status */}
          {userProgress?.completed && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Lesson Complete!</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-card border-t px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          {/* Completion Action */}
            {!userProgress?.completed && (
            <div className="flex justify-center mb-4">
              <Button onClick={markComplete} size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </div>
            )}
            
          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Previous Lesson */}
            <div className="flex-1 w-full sm:w-auto">
              {previousLesson ? (
                <Button
                  variant="outline"
                  onClick={goToPreviousLesson}
                  disabled={navigating}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Previous</div>
                    <div className="text-sm font-medium truncate max-w-[200px]">
                      {previousLesson.title}
                    </div>
                  </div>
                </Button>
              ) : (
                <div className="w-full sm:w-auto" /> // Spacer
              )}
            </div>

            {/* Progress Indicator */}
            <div className="text-center px-4">
              <div className="text-sm text-muted-foreground">
                {currentLessonIndex + 1} / {allLessons.length}
              </div>
              <div className="w-32 bg-muted rounded-full h-2 mt-1">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentLessonIndex + 1) / allLessons.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Next Lesson */}
            <div className="flex-1 w-full sm:w-auto flex justify-end">
              {nextLesson ? (
                nextLessonLocked ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full sm:w-auto opacity-50"
                  >
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked by Admin
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      console.log('Next button clicked:', {
                        nextLesson,
                        userProgress,
                        isCompleted: userProgress?.completed,
                        navigating,
                        buttonDisabled: navigating
                      });
                      goToNextLesson();
                    }}
                    disabled={navigating}
                    className="w-full sm:w-auto"
                  >
                    <div className="text-right">
                      <div className="text-xs text-primary-foreground/80">Next</div>
                      <div className="text-sm font-medium truncate max-w-[200px]">
                        {nextLesson.title}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ) : isLastLesson() ? (
                <div className="text-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Course Complete!</div>
                  <div className="text-xs">You've finished all lessons</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Helper Text - Removed completion requirement */}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
