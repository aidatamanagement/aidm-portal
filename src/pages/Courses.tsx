
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock, ArrowLeft, Target, Users, Award, TrendingUp, Shield, Lightbulb, Play, ArrowRight, ChevronRight } from 'lucide-react';
import ScrollJourney from '@/components/ScrollJourney';

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number>(0); // 0 = first FAQ item is open by default

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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? -1 : index); // Close if already open, otherwise open the clicked one
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
    <div className="space-y-6">


      {/* Hero Section */}
      <div className="relative bg-cover bg-center bg-no-repeat text-white py-20 mx-4 rounded-2xl" style={{ backgroundImage: 'url(/images/aileadershipseries.png)' }}>
        <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
        
        {/* Breadcrumb Navigation - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="text-[14px] text-white/80 tracking-[-0.084px] hover:text-white transition-colors"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              Dashboard
            </Link>
            <ChevronRight className="h-5 w-5 text-white/80" />
            <span 
              className="text-[14px] text-white font-semibold tracking-[-0.084px]"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              AI Leadership Training
            </span>
          </div>
        </div>
        
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
      </div>

      {/* What You'll Learn Section */}
      <div className="mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - What You'll Learn Overview */}
          <div>
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ 
                color: '#242424', 
                fontFamily: 'Helvetica', 
                fontSize: '25px', 
                fontWeight: 700, 
                lineHeight: '121.525%', 
                letterSpacing: '-0.75px' 
              }}
            >
              What You'll Learn
              </h2>
            <p 
              className="text-base"
              style={{ 
                color: '#706F6F', 
                fontFamily: '"SF Pro Text"', 
                fontSize: '16px', 
                fontWeight: 400, 
                lineHeight: '0%', 
                letterSpacing: '-0.48px' 
              }}
            >
              Discover foundational concepts, advanced strategies, and practical applications.
            </p>
          </div>

          {/* Right Column - Learning Categories */}
          <div className="space-y-4">
            {/* The Foundations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-gray-600" />
                  </div>
                <div>
                  <h3 
                    className="font-bold mb-2"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '25px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.75px' 
                    }}
                  >
                    The Foundations
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '0%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    Grasp the basic principles and terminologies.
                  </p>
                </div>
              </div>
                </div>

            {/* Advanced Strategies */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-gray-600" />
                  </div>
                <div>
                  <h3 
                    className="font-bold mb-2"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '25px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.75px' 
                    }}
                  >
                    Advanced Strategies
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '0%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    Delve into advanced techniques and methodologies.
                  </p>
                </div>
              </div>
                </div>

            {/* Real-world Applications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                  </div>
                <div>
                  <h3 
                    className="font-bold mb-2"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '25px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.75px' 
                    }}
                  >
                    Real-world Applications
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '0%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    Practical assignments and real-world case studies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions & FAQ Section */}
      <div className="mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Questions */}
          <div>
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ 
                color: '#242424', 
                fontFamily: 'Helvetica', 
                fontSize: '25px', 
                fontWeight: 700, 
                lineHeight: '121.525%', 
                letterSpacing: '-0.75px' 
              }}
            >
              You seem either very interested, or have questions.
              </h2>
            <p 
              className="text-base"
              style={{ 
                color: '#706F6F', 
                fontFamily: '"SF Pro Text"', 
                fontSize: '16px', 
                fontWeight: 400, 
                lineHeight: '0%', 
                letterSpacing: '-0.48px' 
              }}
            >
              Here are a few answers.
            </p>
          </div>

          {/* Right Column - FAQ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <div className="border-b border-gray-200 pb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFAQ(0)}
                >
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    Who can benefit from AIDM's services?
                  </h3>
                  <span className="text-gray-500">{openFAQ === 0 ? '−' : '+'}</span>
                </div>
                {openFAQ === 0 && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '140%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    AIDM is designed for organizations across industries that are looking to leverage Artificial Intelligence (AI) for business transformation. Whether you're a small team just beginning your AI journey or a large enterprise scaling AI initiatives, AIDM's frameworks, consulting, and automation tools help align AI adoption with business outcomes.
                  </p>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="border-b border-gray-200 pb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFAQ(1)}
                >
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    What does AIDM help companies achieve?
                  </h3>
                  <span className="text-gray-500">{openFAQ === 1 ? '−' : '+'}</span>
                </div>
                {openFAQ === 1 && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '140%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    AIDM empowers organizations to assess, plan, and execute their AI strategy. Our services include the AI Readiness Framework, AI Maturity Assessment, 12-Month AI Adoption Plan, and access to tools and consultants to integrate AI into operations, marketing, sales, HR, and customer service workflows. The ultimate goal is to drive measurable ROI through intelligent automation.
                  </p>
                )}
          </div>

              {/* FAQ Item 3 */}
              <div className="border-b border-gray-200 pb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFAQ(2)}
                >
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    How does AIDM support clients with limited technical expertise?
                  </h3>
                  <span className="text-gray-500">{openFAQ === 2 ? '−' : '+'}</span>
                </div>
                {openFAQ === 2 && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '140%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    You don't need a technical background to start. AIDM provides guided onboarding, use-case discovery, and prebuilt frameworks that help non-technical business leaders understand how AI applies to their work. We offer strategic sessions, templates, and expert support to bridge the gap between business goals and AI solutions.
                  </p>
                )}
              </div>

              {/* FAQ Item 4 */}
              <div className="border-b border-gray-200 pb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFAQ(3)}
                >
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    What types of solutions does AIDM implement?
                  </h3>
                  <span className="text-gray-500">{openFAQ === 3 ? '−' : '+'}</span>
                </div>
                {openFAQ === 3 && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '140%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    AIDM assists in designing and deploying AI agents, data workflows, and no-code automation tools. Solutions include intelligent customer support bots, lead scoring automation, sales enablement tools, content generation systems, and more—all customized to your industry and team's needs.
                  </p>
                )}
              </div>

              {/* FAQ Item 5 */}
              <div className="border-b border-gray-200 pb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFAQ(4)}
                >
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: '#242424', 
                      fontFamily: 'Helvetica', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      lineHeight: '121.525%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    What is the first step to getting started with AIDM?
                  </h3>
                  <span className="text-gray-500">{openFAQ === 4 ? '−' : '+'}</span>
                </div>
                {openFAQ === 4 && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ 
                      color: '#706F6F', 
                      fontFamily: '"SF Pro Text"', 
                      fontSize: '16px', 
                      fontWeight: 400, 
                      lineHeight: '140%', 
                      letterSpacing: '-0.48px' 
                    }}
                  >
                    Begin by filling out our AI Readiness Assessment Form on our website. From there, one of our consultants will schedule an intro call to understand your goals. Based on that, we'll build a personalized roadmap that may include onboarding, training, and solution deployment using AIDM's proven 12-month transformation framework.
                  </p>
                )}
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
