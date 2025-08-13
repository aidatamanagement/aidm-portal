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

  const goToNextLesson = () => {
    const nextLesson = allLessons?.[currentLessonIndex + 1];
    if (nextLesson) {
      setSelectedLessonId(nextLesson.id);
    }
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

            {/* PDF Viewer */}
            {currentLesson && (
              <Card>
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

            {/* Go to next module button */}
            <div className="flex justify-center mt-8">
              <div
                onClick={goToNextLesson}
                className="bg-primary box-border content-stretch flex flex-row gap-3 h-10 items-center justify-center px-3 py-2 rounded-[40px] cursor-pointer"
              >
                <div className="font-['SF_Pro_Text:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-white text-[14px] text-nowrap text-right tracking-[-0.42px]">
                  <p className="block leading-[normal] whitespace-pre">Go to next module</p>
                </div>
                <div className="bg-white box-border content-stretch flex flex-row gap-2.5 items-center justify-center p-[6px] relative rounded-[50px] shrink-0 size-5">
                  <ChevronRight className="h-3 w-3 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Overview Sidebar - Right Side */}
        <div className="w-80 bg-background border-l p-4 space-y-6">
                     {/* Current Module Status Card */}
           {currentLesson && (
             <Card className={`${currentLessonProgress?.completed ? 'bg-primary' : 'bg-primary'} text-primary-foreground`}>
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

                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{currentLessonProgress?.completed ? 'Completed' : 'In Progress'}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className="h-2 bg-[#4E917B] [&>div]:bg-white rounded-full [&>div]:rounded-full" 
                  />
                </div>
                
                                                 <div className="flex flex-row gap-2 items-start justify-start w-full">
                  <div
                    onClick={markComplete}
                    className={`box-border content-stretch flex flex-row gap-1.5 items-center justify-center p-[10px] relative rounded-[52px] shrink-0 w-full cursor-pointer ${
                      currentLessonProgress?.completed 
                        ? 'bg-[#f0f0f0] text-[#242424]' 
                        : 'bg-[#f0f0f0] text-[#242424]'
                    }`}
                  >
                    <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[14px] text-left text-nowrap">
                      <p className="block leading-[20px] whitespace-pre">
                        {markCompleteMutation.isPending ? 'Marking...' : 
                         currentLessonProgress?.completed ? 'Completed ✓' : 'Mark Complete'}
                      </p>
                    </div>
                    {!currentLessonProgress?.completed && (
                      <div className="relative shrink-0 size-5">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>
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
                    className={`h-[87px] rounded-xl border cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-[#242424] border-[rgba(25,25,25,0.2)]' 
                        : 'bg-white border-[#d1d1d1] hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedLessonId(moduleLesson.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between h-full px-4 py-[21px]">
                      <div className="flex items-center space-x-[11px]">
                        <div className={`rounded-full p-[11.429px] size-11 ${
                          isCurrent ? 'bg-white' : 'bg-[#242424]'
                        }`}>
                          {isLocked ? (
                            <Lock className={`h-5 w-5 ${isCurrent ? 'text-[#242424]' : 'text-white'}`} />
                          ) : isCompleted ? (
                            <CheckCircle className={`h-5 w-5 ${isCurrent ? 'text-[#242424]' : 'text-white'}`} />
                          ) : (
                            <Play className={`h-5 w-5 ${isCurrent ? 'text-[#242424]' : 'text-white'}`} />
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <h4 className={`font-semibold text-[16px] leading-[normal] ${
                            isCurrent ? 'text-white' : 'text-[#242424]'
                          }`}>
                            {moduleLesson.title}
                          </h4>
                          <div className="flex items-center space-x-[5px]">
                            <Clock className={`h-4 w-4 ${
                              isCurrent ? 'text-[#bababa]' : 'text-[#696969]'
                            }`} />
                            <span className={`text-[14px] leading-[10px] ${
                              isCurrent ? 'text-[#bababa]' : 'text-[#696969]'
                            }`}>
                              08 min, 27 Sec
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Download 
                          className={`h-6 w-6 cursor-pointer ${
                            isCurrent ? 'text-white' : 'text-[#696969]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (moduleLesson.pdf_url) {
                              window.open(moduleLesson.pdf_url, '_blank');
                            }
                          }}
                        />
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
