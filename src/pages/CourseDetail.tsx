import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Download, 
  Lock, 
  CheckCircle, 
  ChevronRight,
  FileText,
  MessageSquare,
  BookOpen,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('about');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Fetch course details
  const { data: course } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch all lessons for the course
  const { data: allLessons } = useQuery({
    queryKey: ['course-lessons', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch user progress for the course
  const { data: allUserProgress } = useQuery({
    queryKey: ['user-progress-course', user?.id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .eq('course_id', id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!id,
  });

  // Set first lesson as selected by default
  useEffect(() => {
    if (allLessons && allLessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(allLessons[0].id);
    }
  }, [allLessons, selectedLessonId]);

  // Get current selected lesson
  const currentLesson = allLessons?.find(l => l.id === selectedLessonId);
  const currentLessonIndex = allLessons?.findIndex(l => l.id === selectedLessonId) ?? -1;

  // Get user progress for current lesson
  const currentLessonProgress = allUserProgress?.find(p => p.lesson_id === selectedLessonId);

  // Mark lesson complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user?.id,
          lesson_id: selectedLessonId,
          course_id: id,
          completed: true,
          time_spent: 0,
          quiz_attempts: 0,
          quiz_score: null,
          pdf_viewed: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lesson marked as complete!');
      queryClient.invalidateQueries({ queryKey: ['user-progress-course', user?.id, id] });
    },
    onError: (error) => {
      toast.error('Failed to mark lesson as complete');
      console.error('Mark complete error:', error);
    },
  });

  const completedLessons = allUserProgress?.filter(p => p.completed)?.length ?? 0;
  const totalLessons = allLessons?.length ?? 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const goBackToCourses = () => {
    navigate('/courses');
  };

  const markComplete = () => {
    markCompleteMutation.mutate();
  };

  const downloadPDF = () => {
    if (currentLesson?.pdf_url) {
      window.open(currentLesson.pdf_url, '_blank');
    }
  };

  const openPDFInNewTab = () => {
    if (currentLesson?.pdf_url) {
      window.open(currentLesson.pdf_url, '_blank');
    }
  };

  const refreshPDF = () => {
    window.location.reload();
  };

  const isLessonCompleted = (lessonId: string) => {
    return allUserProgress?.some(p => p.lesson_id === lessonId && p.completed) ?? false;
  };

  const isLessonLocked = (lessonIndex: number) => {
    // For now, no lessons are locked
    return false;
  };

  if (!course || !allLessons) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumbs */}
      <div className="bg-card border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToCourses}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Service</span>
              <span className="sm:hidden">Courses</span>
            </Button>
            <div className="text-sm text-muted-foreground">
              Home / Courses
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content Area - Left Side */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Course Header */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {course.description}
              </p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{completedLessons} of {totalLessons} lessons</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* PDF Viewer */}
            {currentLesson && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-card-foreground">Lesson Content</CardTitle>
                    {currentLessonProgress?.completed && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentLesson.pdf_url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadPDF}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openPDFInNewTab}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="hidden sm:inline">Open</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshPDF}
                          className="flex items-center space-x-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden sm:inline">Refresh</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentLesson.pdf_url ? (
                    <div className="w-full h-[500px] border rounded-lg overflow-hidden">
                      <iframe
                        src={currentLesson.pdf_url}
                        className="w-full h-full"
                        title={currentLesson.title}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No content available for this lesson.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            {currentLesson && (
              <Card>
                <CardContent className="pt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="instructor-notes">Instructor Notes</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                      <TabsTrigger value="discussions">Discussions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Module {currentLessonIndex + 1}: {currentLesson.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {currentLesson.description || "This comprehensive session provides participants with a deep dive into the foundational concepts, exploring how this revolutionary technology is reshaping both individual productivity and enterprise-level workflows across industries."}
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="instructor-notes" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Instructor Notes</h3>
                        {currentLesson.instructor_notes ? (
                          <div className="prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.instructor_notes }} />
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No instructor notes available for this lesson.</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="resources" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Additional Resources</h3>
                        <p className="text-muted-foreground">Resources and materials will be available here.</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="discussions" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Discussions</h3>
                        <p className="text-muted-foreground">Discussion forum will be available here.</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Course Overview Sidebar - Right Side */}
        <div className="w-80 bg-background border-l p-4 space-y-6">
          {/* Current Module Status Card */}
          {currentLesson && (
            <Card className={`${currentLessonProgress?.completed ? 'bg-green-600' : 'bg-primary'} text-primary-foreground`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-white/20 rounded-full p-2">
                    {currentLessonProgress?.completed ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Module : {currentLessonIndex + 1}</h3>
                    <p className="text-white/70 text-sm">{currentLesson.title}</p>
                    {currentLessonProgress?.completed && (
                      <p className="text-white/90 text-xs mt-1">✓ Completed</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{currentLessonProgress?.completed ? 'Completed' : 'In Progress'}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                <Button 
                  onClick={markComplete}
                  disabled={markCompleteMutation.isPending || currentLessonProgress?.completed}
                  className={`w-full ${
                    currentLessonProgress?.completed 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-white text-primary hover:bg-white/90'
                  }`}
                  size="sm"
                >
                  {markCompleteMutation.isPending ? 'Marking...' : 
                   currentLessonProgress?.completed ? 'Completed ✓' : 'Mark Complete'}
                  {!currentLessonProgress?.completed && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Course Overview */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Course Lessons</h3>
              <span className="text-sm text-muted-foreground">{totalLessons} Modules</span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allLessons?.map((moduleLesson, index) => {
                const isCurrent = moduleLesson.id === selectedLessonId;
                const isCompleted = isLessonCompleted(moduleLesson.id);
                const isLocked = isLessonLocked(index);
                
                return (
                  <div
                    key={moduleLesson.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedLessonId(moduleLesson.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`rounded-full p-2 ${
                          isCurrent ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          {isLocked ? (
                            <Lock className={`h-5 w-5 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                          ) : (
                            <Play className={`h-5 w-5 ${isCurrent ? 'text-white' : 'text-gray-900'}`} />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-semibold text-sm ${
                            isCurrent ? 'text-white' : 'text-gray-900'
                          }`}>
                            {moduleLesson.title}
                          </h4>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={`text-xs ${
                              isCurrent ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              08 min, 27 Sec
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <Download className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
