
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock, ArrowLeft, Target, Users, Award, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import ScrollJourney from '@/components/ScrollJourney';

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
      {/* Back to Services Button */}
      <div className="flex items-center justify-between">
          <Button
          variant="outline" 
            onClick={() => navigate('/services')}
          className="flex items-center space-x-2"
          >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
          </Button>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Executive AI Leadership Training</h1>
            <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              Empowering Leaders to Drive AI-Powered Transformation
            </p>
            <p className="text-white/80 max-w-4xl mx-auto">
              Artificial intelligence isn't just technology—it's the future of leadership. AIDM's Executive AI Leadership Training 
              equips executives, directors, and senior leaders with practical knowledge and strategic insights to confidently 
              navigate, adopt, and leverage AI in their organizations.
            </p>
          </div>
        </div>
      </div>

      {/* Program Overview & Key Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Key Outcomes You'll Achieve</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Confidently articulate and champion AI-driven initiatives</p>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Implement customized AI solutions to automate and enhance decision-making processes</p>
            </div>
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Dramatically reduce operational inefficiencies through effective AI integration</p>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Establish clear AI governance frameworks to ensure compliance and security</p>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">Foster a culture of AI literacy and innovation throughout their organization</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Ideal Audience</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">This program is specifically designed for:</p>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2 mb-2">C-suite Executives (CEO, CIO, CTO, CFO)</Badge>
              <Badge variant="outline" className="mr-2 mb-2">Senior Leaders and Directors</Badge>
              <Badge variant="outline" className="mr-2 mb-2">Heads of HR, Operations, Finance</Badge>
              <Badge variant="outline" className="mr-2 mb-2">Compliance Officers</Badge>
              <Badge variant="outline" className="mr-2 mb-2">Strategic Innovation Leaders</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Access Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Your Course Access</h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
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
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
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
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isLocked ? 'bg-gray-100' : 'bg-primary/10'
                      }`}>
                        <BookOpen className={`h-6 w-6 ${
                          isLocked ? 'text-gray-400' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl leading-6 mb-1">{course.title}</CardTitle>
                        {getStatusBadge(status, progress)}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isLocked && (
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-3">
                        <span>Course Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Self-paced learning</span>
                    </div>
                    {getActionButton(course, status, progress)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>

      {/* Interactive Training Journey */}
      <ScrollJourney 
        type="weeks"
        title="Your 10-Week Learning Journey"
        subtitle="Track your progress through executive AI leadership training"
        carStartPosition={48}
        carEndPosition={1450}
      />

      {/* Why Choose AIDM Section */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AIDM?</h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Executive-Focused Curriculum</h3>
                  <p className="text-muted-foreground">Tailored, personalized training designed specifically for senior leadership.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Hands-On, Applied Learning</h3>
                  <p className="text-muted-foreground">Real-world scenarios and actionable insights—not just theoretical concepts.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Structured, Scalable Framework</h3>
                  <p className="text-muted-foreground">Proven methodologies that ensure measurable outcomes and ROI.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Expert Support</h3>
                  <p className="text-muted-foreground">Continuous guidance from experienced AI consultants throughout and after the training.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Courses;
