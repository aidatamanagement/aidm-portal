
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock, ArrowLeft, Target, Users, Award, TrendingUp, Shield, Lightbulb, Play, ArrowRight } from 'lucide-react';
import ScrollJourney from '@/components/ScrollJourney';

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // Module data for the carousel
  const modules = [
    {
      id: 1,
      title: "Introduction to Generative AI: Part 1",
      description: "Exploring the basics and everyday applications",
      image: "/images/Introduction-to-Generative-AI-Part-1.png"
    },
    {
      id: 2,
      title: "Introduction to Generative AI: Part 2",
      description: "Advanced concepts and practical implementation",
      image: "/images/Introduction-to-Generative-AI-Part-2.png"
    },
    {
      id: 3,
      title: "Generative AI: Using AI to Build Tools",
      description: "Building comprehensive AI roadmaps",
      image: "/images/Generative-AI-Using-AI-to-Build-Tools.png"
    },
    {
      id: 4,
      title: "Building Your Own Custom GPT",
      description: "Leading organizational transformation",
      image: "/images/Building-Your-Own-Custom-GPT.png"
    }
  ];

  useEffect(() => {
    if (user) {
      fetchCoursesData();
    }
  }, [user]);

  // Auto-scroll effect for modules carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModuleIndex((prev) => (prev + 1) % modules.length);
    }, 3000); // Change module every 3 seconds

    return () => clearInterval(interval);
  }, [modules.length]);

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

  const nextModule = () => {
    setCurrentModuleIndex((prev) => (prev + 1) % modules.length);
  };

  const prevModule = () => {
    setCurrentModuleIndex((prev) => (prev - 1 + modules.length) % modules.length);
  };

  const handleModuleClick = (moduleIndex: number) => {
    // Navigate to the course detail page with the specific lesson
    if (courses.length > 0) {
      const courseId = courses[0].id;
      navigate(`/courses/${courseId}?lesson=${moduleIndex + 1}`);
    }
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="p-6">Loading courses...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline" 
              onClick={() => navigate('/services')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Services</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-cover bg-center bg-no-repeat text-white py-20 mx-4 rounded-2xl" style={{ backgroundImage: 'url(/images/aileadershipseries.png)' }}>
        <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Executive AI Leadership Training
          </h1>
          <p className="max-w-4xl mx-auto mb-8" style={{ color: '#FFF', textAlign: 'center', fontFamily: '"SF Pro Text"', fontSize: '16px', fontStyle: 'normal', fontWeight: 500, lineHeight: '121.525%', letterSpacing: '-0.48px' }}>
            Empowering Leaders to Drive AI-Powered Transformation
          </p>
          <p className="max-w-4xl mx-auto mb-8" style={{ color: '#FFF', textAlign: 'center', fontFamily: '"SF Pro Text"', fontSize: '16px', fontStyle: 'normal', fontWeight: 400, lineHeight: '121.525%', letterSpacing: '-0.48px' }}>
            Artificial intelligence isn't just technology—it's the future of leadership. AIDM's Executive AI Leadership Training 
            equips executives, directors, and senior leaders with practical knowledge and strategic insights to confidently 
            navigate, adopt, and leverage AI in their organizations.
          </p>
          <Button 
            onClick={() => {
              if (courses.length > 0) {
                const firstCourse = courses[0];
                const status = getCourseStatus(firstCourse.id);
                if (status !== 'locked') {
                  navigate(`/courses/${firstCourse.id}`);
                } else {
                  scrollToSection('course-access');
                }
              } else {
                scrollToSection('course-access');
              }
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
          >
            Start Learning Now
            <Play className="h-4 w-4 ml-2 bg-white text-primary rounded-full p-0.5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Course Overview Section - Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left Side - Course Overview Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '40px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-1.2px' }}>
              Course Overview: Leadership Series - Implementing AI in Your Business
              </h2>
            <h3 className="text-xl font-semibold" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
              Transform Your Organization Through Strategic AI Implementation
            </h3>
              <p className="leading-relaxed" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
              This comprehensive leadership series empowers executives and senior managers to successfully navigate AI adoption across their organizations. Through nine strategic episodes, you'll master the essential frameworks, decision-making processes, and leadership principles needed to drive meaningful AI transformation.
            </p>
            
            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button 
                onClick={() => {
                  if (courses.length > 0) {
                    const firstCourse = courses[0];
                    const status = getCourseStatus(firstCourse.id);
                    if (status !== 'locked') {
                      navigate(`/courses/${firstCourse.id}`);
                    } else {
                      scrollToSection('course-access');
                    }
                  } else {
                    scrollToSection('course-access');
                  }
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Learning Now
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50"
              >
                View FAQs
              </Button>
            </div>
          </div>

          {/* Right Side - Course Overview Card */}
          <div>
            <div 
              className="rounded-[10px] p-6"
              style={{
                width: '100%',
                height: '100%',
                background: '#F9F9F9',
                borderRadius: 10,
                border: '1px #D9D9D9 solid'
              }}
            >
              <h3 className="text-xl font-semibold mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '20px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.6px' }}>
                Course Overview
              </h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400 }}>9 comprehensive episodes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400 }}>Interactive exercises and real-world case studies</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400 }}>Executive-level AI prompt library</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium mb-2" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 600 }}>Perfect For:</p>
                  <p className="text-sm" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '140%' }}>
                    C-suite executives, department heads, and senior managers ready to lead their organizations into the AI-powered future with confidence and strategic clarity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <section className="mt-16">
          <div className="relative">
                          {/* Background Container */}
              <div 
                className="w-full h-[593px] rounded-[10px] relative"
                style={{
                  background: '#FAFAFA',
                  borderRadius: 10,
                  boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
                  border: '1px solid #D4D4D8'
                }}
              >
                {/* Modules Title and Description */}
                <div className="absolute inset-0 p-4">
                {/* Modules Title */}
                <div 
                  className="text-2xl font-bold text-black mb-4"
                  style={{ 
                    fontFamily: 'Helvetica', 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    lineHeight: '32px',
                    width: '240px',
                    height: '20px'
                  }}
                >
                  Modules
                </div>
                
                {/* Modules Description */}
                <div 
                  className="text-base text-stone-500 mb-8"
                  style={{ 
                    fontFamily: '"SF Pro Text"', 
                    fontSize: '16px', 
                    fontWeight: 400, 
                    lineHeight: '20px',
                    width: '948px',
                    height: '44px'
                  }}
                >
                  This comprehensive leadership series empowers executives and senior managers to successfully navigate AI adoption across their organizations. Through nine strategic episodes, you'll master the essential frameworks, decision-making processes, and leadership principles needed to drive meaningful AI transformation.
                </div>
                
                {/* Modules Cards */}
                <div className="mt-8 relative">
                  <div className="flex space-x-4 overflow-hidden">
                    {/* First Module Card */}
                    <div 
                      className="flex-shrink-0 w-[420px] bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleModuleClick(currentModuleIndex)}
                    >
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          className="w-full h-full object-cover"
                          src={modules[currentModuleIndex]?.image}
                          alt={modules[currentModuleIndex]?.title}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-1 leading-tight">
                          {modules[currentModuleIndex]?.title}
                        </h3>
                        <p className="text-xs text-[#555] leading-relaxed">
                          {modules[currentModuleIndex]?.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Second Module Card */}
                    <div 
                      className="flex-shrink-0 w-[420px] bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleModuleClick((currentModuleIndex + 1) % modules.length)}
                    >
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          className="w-full h-full object-cover"
                          src={modules[(currentModuleIndex + 1) % modules.length]?.image}
                          alt={modules[(currentModuleIndex + 1) % modules.length]?.title}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-1 leading-tight">
                          {modules[(currentModuleIndex + 1) % modules.length]?.title}
                        </h3>
                        <p className="text-xs text-[#555] leading-relaxed">
                          {modules[(currentModuleIndex + 1) % modules.length]?.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Third Module Card */}
                    <div 
                      className="flex-shrink-0 w-[420px] bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleModuleClick((currentModuleIndex + 2) % modules.length)}
                    >
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          className="w-full h-full object-cover"
                          src={modules[(currentModuleIndex + 2) % modules.length]?.image}
                          alt={modules[(currentModuleIndex + 2) % modules.length]?.title}
                        />
                    </div>
                      <div className="p-3">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-1 leading-tight">
                          {modules[(currentModuleIndex + 2) % modules.length]?.title}
                        </h3>
                        <p className="text-xs text-[#555] leading-relaxed">
                          {modules[(currentModuleIndex + 2) % modules.length]?.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Fourth Module Card */}
                    <div 
                      className="flex-shrink-0 w-[420px] bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleModuleClick((currentModuleIndex + 3) % modules.length)}
                    >
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          className="w-full h-full object-cover"
                          src={modules[(currentModuleIndex + 3) % modules.length]?.image}
                          alt={modules[(currentModuleIndex + 3) % modules.length]?.title}
                        />
                  </div>
                      <div className="p-3">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-1 leading-tight">
                          {modules[(currentModuleIndex + 3) % modules.length]?.title}
                  </h3>
                        <p className="text-xs text-[#555] leading-relaxed">
                          {modules[(currentModuleIndex + 3) % modules.length]?.description}
                  </p>
                </div>
                    </div>
                  </div>
                  
                  {/* Navigation Arrows - Outside Card Row */}
                  <div className="flex justify-end mt-3 space-x-3">
                    {/* Left Arrow Circle */}
                    <button 
                      onClick={prevModule}
                      className="w-12 h-12 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    {/* Right Arrow Circle */}
                    <button 
                      onClick={nextModule}
                      className="w-12 h-12 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
                </div>
              </div>
            </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Course Access Section */}
            <section id="course-access">
              {courses.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                    <p className="text-gray-600">Check back later for new courses.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
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
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="rounded-[10px] border border-[#D9D9D9] bg-[#F9F9F9] p-6">
                <h3 className="mb-4" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '16px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.48px' }}>On this Page</h3>
                <nav className="space-y-2">
                  <button 
                    onClick={() => scrollToSection('key-outcomes')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Key Outcomes
                  </button>
                  <button 
                    onClick={() => scrollToSection('ideal-audience')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Ideal Audience
                  </button>
                  <button 
                    onClick={() => scrollToSection('course-access')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Start Learning
                  </button>
                  <button 
                    onClick={() => scrollToSection('training-journey')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Training Journey
                  </button>
                  <button 
                    onClick={() => scrollToSection('why-choose-aidm')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Why Choose AIDM
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 mx-4 rounded-2xl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Leadership?
          </h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8">
            Join the AI Leadership Mastery Series and equip yourself with the knowledge, skills, and confidence 
            to drive AI-powered transformation in your organization.
          </p>
          <Button 
            onClick={() => {
              if (courses.length > 0) {
                const firstCourse = courses[0];
                const status = getCourseStatus(firstCourse.id);
                if (status !== 'locked') {
                  navigate(`/courses/${firstCourse.id}`);
                } else {
                  scrollToSection('course-access');
                }
              } else {
                scrollToSection('course-access');
              }
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
          >
            Start Learning Now
            <Play className="h-4 w-4 ml-2 bg-white text-primary rounded-full p-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Courses;
