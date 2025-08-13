import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, FileText, MessageSquare, Zap, Users, Award, Lightbulb, Settings, Mic, Wrench, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, error, isFetching } = useRealtimeDashboard();
  const [profile, setProfile] = useState<any>(null);
  const [userServices, setUserServices] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserServices();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, profile_image')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserServices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_services')
        .select(`
          *,
          services!user_services_service_id_fkey(
            id,
            title,
            description,
            type,
            status
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserServices(data || []);
    } catch (error) {
      console.error('Error fetching user services:', error);
    }
  };

  const getUserServiceStatus = (serviceTitle: string) => {
    const userService = userServices.find(us => 
      us.services?.title?.toLowerCase().includes(serviceTitle.toLowerCase())
    );
    return userService?.status || 'locked';
  };

  const handleServiceClick = (serviceType: string, status: string) => {
    if (status === 'locked') {
      toast.error('This service is not available. Contact support for access.');
      return;
    }
    
    switch (serviceType) {
      case 'ai-insights':
        navigate('/services');
        break;
      case 'capabilities':
        navigate('/services');
        break;
      case 'gpt-builder':
        navigate('/services');
        break;
      case 'podcast':
        navigate('/services');
        break;
      case 'prompt-builder':
        navigate('/prompts-intro');
        break;
      case 'leadership-training':
        navigate('/courses');
        break;
      case 'support':
        navigate('/support');
        break;
      default:
        navigate('/services');
    }
  };

  const userName = profile?.name || user?.user_metadata?.name || 'Valued Client';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Check service access
  const aiInsightsStatus = getUserServiceStatus('insights');
  const capabilitiesStatus = getUserServiceStatus('capabilities');
  const gptBuilderStatus = getUserServiceStatus('gpt builder');
  const podcastStatus = getUserServiceStatus('podcast');
  const promptBuilderStatus = getUserServiceStatus('prompt builder');
  const leadershipTrainingStatus = getUserServiceStatus('leadership');

  return (
    <div className="space-y-8">
      {/* Real-time indicator */}
      {isFetching && (
        <div className="fixed top-20 right-4 z-50 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
          Updating...
        </div>
      )}

      {/* Welcome Section and Hero Banner - Side by Side */}
      <div className="flex items-start justify-between space-x-8">
        {/* Welcome Section - Left Side */}
        <div className="flex items-start space-x-4 flex-shrink-0">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              {profile?.profile_image ? (
                <img 
                  src={profile.profile_image} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <Users className="h-8 w-8 text-gray-500" />
              )}
            </div>
          </div>
          
          {/* Welcome Text */}
          <div>
            <h1 
              className="text-[30px] font-bold text-[#000000] tracking-[-0.9px] leading-[99.99%]"
              style={{ fontFamily: 'Helvetica, sans-serif' }}
            >
              Hello, {userName}
            </h1>
            <p 
              className="text-[16px] text-[#242424] tracking-[-0.48px] leading-[1.215] mt-2"
              style={{ fontFamily: '"SF Pro Text", sans-serif' }}
            >
              Welcome back!
            </p>
          </div>
        </div>

        {/* Hero Banner - Right Side */}
        <div 
          className="flex-shrink-0 relative overflow-hidden bg-white"
          style={{
            width: '744px',
            height: '280px',
            borderRadius: '17px',
            border: '1px solid #D9D9D9'
          }}
        >
          <div className="flex h-full">
            {/* Left Half - Image */}
            <div className="w-1/2 h-full">
              <img 
                src="/images/transformleadership.png" 
                alt="Transform Leadership" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right Half - Text */}
            <div className="w-1/2 h-full flex items-center p-8">
              <div className="w-full">
                <h2 
                  className="text-[30px] font-bold text-[#242424] tracking-[-0.9px] leading-[1.215] mb-4"
                  style={{ fontFamily: 'Helvetica, sans-serif' }}
                >
                  Transform Leadership through AI Mastery
                </h2>
                <p 
                  className="text-[16px] text-[#706f6f] tracking-[-0.48px] leading-[1.215] mb-6"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Master the AI Leadership Series that's reshaping how executives think, decide, and lead in the data-driven era.
                </p>
                <Button 
                  className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                  onClick={() => handleServiceClick('leadership-training', leadershipTrainingStatus)}
                  disabled={leadershipTrainingStatus === 'locked'}
                >
                  <span 
                    className="text-[14px] font-medium tracking-[-0.56px] mr-3"
                    style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  >
                    Start Learning Now
                  </span>
                  <div className="bg-white rounded-[50px] p-[6px] w-5 h-5 flex items-center justify-center">
                    <Play className="h-3 w-3 text-[#026242]" />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Two rows of cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Row - AI Insights and Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Insights Card */}
            <Card className="rounded-[10px] border-[#d9d9d9] overflow-hidden">
              <CardContent className="p-6">
                <h3 
                  className="text-[25px] font-bold text-[#242424] tracking-[-0.75px] leading-[1.215] mb-4"
                  style={{ fontFamily: 'Helvetica, sans-serif' }}
                >
                  AI Insights
                </h3>
                <p 
                  className="text-[16px] text-[#7e7e7e] tracking-[-0.48px] leading-[1.215] mb-6"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Curated intelligence delivered to you. Industry trends, leadership strategies, and AI breakthroughs that matter to executives like you.
                </p>
                <Button 
                  className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                  onClick={() => handleServiceClick('ai-insights', aiInsightsStatus)}
                  disabled={aiInsightsStatus === 'locked'}
                >
                  <span 
                    className="text-[14px] font-medium tracking-[-0.56px]"
                    style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  >
                    Read More
                  </span>
                </Button>
                <div className="mt-4 -mx-6 -mb-6 h-[280px] overflow-hidden">
                  <img 
                    src="/images/aiinsights.png" 
                    alt="AI Insights" 
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      position: 'relative',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Capabilities Card */}
            <Card className="rounded-[10px] border-[#d9d9d9] overflow-hidden">
              <CardContent className="p-6">
                <h3 
                  className="text-[25px] font-bold text-[#242424] tracking-[-0.75px] leading-[1.215] mb-4"
                  style={{ fontFamily: 'Helvetica, sans-serif' }}
                >
                  Capabilities
                </h3>
                <p 
                  className="text-[16px] text-[#7e7e7e] tracking-[-0.48px] leading-[1.215] mb-6"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Transform possibilities into results. Explore our comprehensive capabilities through client case studies, interactive demos, and real-world examples of AI-powered business transformation.
                </p>
                <Button 
                  className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                  onClick={() => handleServiceClick('capabilities', capabilitiesStatus)}
                  disabled={capabilitiesStatus === 'locked'}
                >
                  <span 
                    className="text-[14px] font-medium tracking-[-0.56px]"
                    style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  >
                    Read More
                  </span>
                </Button>
                <div className="mt-4 -mx-6 -mb-6 h-[280px] overflow-hidden">
                  <img 
                    src="/images/capabilities.png" 
                    alt="Capabilities" 
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      position: 'relative',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Podcast and AIDM Prompt Builder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Podcast Card */}
            <Card className="rounded-[10px] border-[#d9d9d9] overflow-hidden">
              <CardContent className="p-6">
                <h3 
                  className="text-[25px] font-bold text-[#242424] tracking-[-0.75px] leading-[1.215] mb-4"
                  style={{ fontFamily: 'Helvetica, sans-serif' }}
                >
                  Podcast
                </h3>
                <p 
                  className="text-[16px] text-[#7e7e7e] tracking-[-0.48px] leading-[1.215] mb-6"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Weekly strategic conversations with leaders driving AI transformation. Real implementation stories, breakthrough insights, and the executive decisions that reshape industries.
                </p>
                <Button 
                  className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                  onClick={() => handleServiceClick('podcast', podcastStatus)}
                  disabled={podcastStatus === 'locked'}
                >
                  <span 
                    className="text-[14px] font-medium tracking-[-0.56px]"
                    style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  >
                    Listen Now
                  </span>
                </Button>
                <div className="mt-4 -mx-6 -mb-6 h-[280px] overflow-hidden">
                  <img 
                    src="/images/podcast.png" 
                    alt="Podcast" 
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      position: 'relative',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AIDM Prompt Builder Card */}
            <Card className="rounded-[10px] border-[#d9d9d9] overflow-hidden bg-[#eeeeee]">
              <CardContent className="p-6">
                <h3 
                  className="text-[25px] font-bold text-[#242424] tracking-[-0.75px] leading-[1.215] mb-4"
                  style={{ fontFamily: 'Helvetica, sans-serif' }}
                >
                  AIDM Prompt Builder
                </h3>
                <p 
                  className="text-[16px] text-[#656565] tracking-[-0.48px] leading-[1.215] mb-6"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Access hundreds of expertly crafted prompts designed specifically for business leaders, executives, and teams ready to harness AI's full potential.
                </p>
                <Button 
                  className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                  onClick={() => handleServiceClick('prompt-builder', promptBuilderStatus)}
                  disabled={promptBuilderStatus === 'locked'}
                >
                  <span 
                    className="text-[14px] font-medium tracking-[-0.56px]"
                    style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  >
                    Read More
                  </span>
                </Button>
                <div className="mt-4 -mx-6 -mb-6 h-[280px] overflow-hidden">
                  <img 
                    src="/images/promptbuilderdash.png" 
                    alt="AIDM Prompt Builder" 
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      position: 'relative',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      height: '280px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - GPT Builder Card */}
        <div className="lg:col-span-1">
          {/* The GPT Builder Card (Dark Background) */}
          <Card className="rounded-[10px] border-[#d9d9d9] overflow-hidden bg-black text-white" style={{ height: 'calc(100% - 24px)' }}>
            <CardContent className="p-6">
              <h3 
                className="text-[25px] font-bold text-white tracking-[-0.75px] leading-[1.215] mb-4"
                style={{ fontFamily: 'Helvetica, sans-serif' }}
              >
                The GPT Builder.
              </h3>
              <p 
                className="text-[16px] text-[#eef0f3] tracking-[-0.48px] leading-[1.215] mb-6"
                style={{ fontFamily: '"SF Pro Text", sans-serif' }}
              >
                Transform your organizational knowledge into powerful AI assistants with our comprehensive GPT Builder service. We guide you through document auditing, organization, and custom GPT training, including file optimization and bundling strategies to maximize AI performance. More than just implementation, GPT Builder opens the door to advanced automation opportunities and positions your organization for intelligent business transformation.
              </p>
              <Button 
                className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
                onClick={() => handleServiceClick('gpt-builder', gptBuilderStatus)}
                disabled={gptBuilderStatus === 'locked'}
              >
                <span 
                  className="text-[14px] font-medium tracking-[-0.56px]"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Read More
                </span>
              </Button>
                              <div className="mt-4 -mx-6 -mb-6 flex-1 overflow-hidden">
                  <img 
                    src="/images/gptbuilder.png" 
                    alt="GPT Builder" 
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      position: 'relative',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      objectFit: 'cover'
                    }}
                  />
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative bg-black rounded-[17px] p-8 text-white overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <h2 
              className="text-[40px] font-bold text-white tracking-[-1.2px] leading-[1.215] mb-4"
              style={{ fontFamily: 'Helvetica, sans-serif' }}
            >
              Let's work together.
            </h2>
            <p 
              className="text-[16px] text-white tracking-[-0.48px] leading-[1.215] mb-6"
              style={{ fontFamily: '"SF Pro Text", sans-serif' }}
            >
              Join our subscription service and get your dream website designed and launched by experts. Start today, scale tomorrow!
            </p>
            <Button 
              className="bg-[#026242] hover:bg-[#026242]/90 text-white px-3 py-2 rounded-[40px] h-10"
              onClick={() => handleServiceClick('support', 'active')}
            >
              <span 
                className="text-[14px] font-medium tracking-[-0.56px] mr-3"
                style={{ fontFamily: '"SF Pro Text", sans-serif' }}
              >
                Schedule an appointment
              </span>
              <div className="bg-white rounded-[50px] p-[6px] w-5 h-5 flex items-center justify-center">
                <ArrowRight className="h-3 w-3 text-[#026242]" />
              </div>
            </Button>
          </div>
          <div className="hidden lg:block">
            {/* Placeholder for decorative elements */}
            <div className="w-32 h-32 bg-gray-800 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
