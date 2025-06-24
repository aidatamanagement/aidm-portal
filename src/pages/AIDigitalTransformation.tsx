import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Search, Share2, User, Bot, Target, CheckCircle, TrendingUp, Users, Award, Lightbulb, BarChart3 } from 'lucide-react';
import ScrollJourney from '@/components/ScrollJourney';

const AIDigitalTransformation = () => {
  const navigate = useNavigate();

  // ScrollJourney phases for the detailed breakdown
  const transformationPhases = [
    {
      id: '1',
      title: 'Website & Brand Optimization',
      subtitle: 'Phase 1',
      description: 'Comprehensive audit and UX-driven redesign for enhanced user experience and brand messaging.',
      items: [
        'Comprehensive audit of existing website structure and content',
        'UX-driven redesign for enhanced user experience',
        'Refined brand messaging to clearly articulate your unique value proposition',
        'Conversion-optimized landing pages aligned with your strategic goals'
      ],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <Globe className="h-5 w-5 text-blue-600" />
    },
    {
      id: '2',
      title: 'AI-Driven Content & SEO Strategy',
      subtitle: 'Phase 2',
      description: 'Tailored AI content generation with advanced SEO optimization for improved organic visibility.',
      items: [
        'Tailored AI content generation for blogs, white papers, and marketing collateral',
        'Advanced SEO optimization to improve organic visibility and audience reach',
        'Automated keyword planning and content scheduling for consistent engagement'
      ],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <Search className="h-5 w-5 text-green-600" />
    },
    {
      id: '3',
      title: 'Social Media Automation & Strategy',
      subtitle: 'Phase 3',
      description: 'AI-driven social media content calendar with automated scheduling and performance analytics.',
      items: [
        'Development of a structured, AI-driven social media content calendar',
        'Automated scheduling, publishing, and performance analytics',
        'Enhanced brand consistency and audience interaction across all platforms'
      ],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: <Share2 className="h-5 w-5 text-purple-600" />
    },
    {
      id: '4',
      title: 'Executive LinkedIn Profile Enhancement',
      subtitle: 'Phase 4',
      description: 'Strategic optimization of executive profiles to boost visibility and thought leadership.',
      items: [
        'Comprehensive review and optimization of executive team LinkedIn profiles',
        'Strategic recommendations to boost individual visibility, credibility, and thought leadership',
        'Customized, AI-supported content plans to position executives as industry leaders'
      ],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <User className="h-5 w-5 text-orange-600" />
    },
    {
      id: '5',
      title: 'AI Chatbot & Content Assistant Integration',
      subtitle: 'Phase 5',
      description: 'AI-powered chatbot for visitor engagement and content assistant for marketing automation.',
      items: [
        'AI-powered chatbot for website visitor engagement and FAQs',
        'AI-driven content assistant for seamless generation of marketing and social media content',
        'Integration testing and optimization for maximum effectiveness'
      ],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      icon: <Bot className="h-5 w-5 text-indigo-600" />
    }
  ];

  const keyComponents = [
    {
      title: "Website & Brand Optimization",
      description: "Comprehensive audit and UX-driven redesign for enhanced user experience and brand messaging.",
      icon: <Globe className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "AI-Driven Content & SEO Strategy",
      description: "Tailored AI content generation with advanced SEO optimization for improved organic visibility.",
      icon: <Search className="h-6 w-6 text-green-600" />,
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Social Media Automation & Strategy",
      description: "AI-driven social media content calendar with automated scheduling and performance analytics.",
      icon: <Share2 className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Executive LinkedIn Profile Enhancement",
      description: "Strategic optimization of executive profiles to boost visibility and thought leadership.",
      icon: <User className="h-6 w-6 text-orange-600" />,
      color: "bg-orange-50 border-orange-200"
    },
    {
      title: "Optional AI Chatbot & Content Assistant",
      description: "AI-powered chatbot for visitor engagement and content assistant for marketing automation.",
      icon: <Bot className="h-6 w-6 text-indigo-600" />,
      color: "bg-indigo-50 border-indigo-200"
    }
  ];



  const outcomes = [
    {
      title: "Dramatically increase your online visibility and brand credibility",
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />
    },
    {
      title: "Establish your leadership team as trusted thought leaders within your industry",
      icon: <Award className="h-5 w-5 text-green-600" />
    },
    {
      title: "Improve lead generation and audience engagement through targeted AI-enhanced content",
      icon: <Target className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Automate repetitive marketing tasks, freeing your team for strategic initiatives",
      icon: <Bot className="h-5 w-5 text-purple-600" />
    },
    {
      title: "Lay a solid digital foundation that accelerates successful AI adoption",
      icon: <Lightbulb className="h-5 w-5 text-indigo-600" />
    }
  ];

  const idealFor = [
    "Organizations beginning or accelerating their digital and AI transformation journey",
    "Companies needing to modernize their digital presence and align it with strategic business objectives",
    "Executives aiming to enhance their industry influence and visibility online"
  ];

  const whyChooseAIDM = [
    {
      title: "Strategically Aligned Solutions",
      description: "Digital transformation tailored explicitly to your strategic AI adoption goals.",
      icon: <Target className="h-5 w-5 text-blue-600" />
    },
    {
      title: "AI-Powered Automation",
      description: "Cutting-edge generative AI tools integrated into every aspect of your digital strategy.",
      icon: <Bot className="h-5 w-5 text-green-600" />
    },
    {
      title: "Executive Visibility & Thought Leadership",
      description: "Proven methods for positioning leaders prominently within their industries.",
      icon: <Award className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Measurable ROI",
      description: "Transparent metrics tracking, ensuring your investment delivers clear, sustainable results.",
      icon: <BarChart3 className="h-5 w-5 text-purple-600" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Back Button */}
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

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              AI Digital Transformation
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Redefine Your Digital Presence—Accelerate Your AI Journey</h1>
            <p className="text-xl text-white/90 mb-6 max-w-4xl mx-auto">
              In today's digital-first landscape, having an optimized, AI-enhanced digital presence is no longer optional—it's essential. AIDM's comprehensive Digital Transformation Package strategically aligns your online identity, marketing automation, content strategy, and leadership visibility with your broader AI adoption objectives.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            We combine advanced AI tools and expert strategy to boost your brand visibility, improve audience engagement, and position your leadership as industry thought leaders—ensuring your organization is ready for sustainable AI-driven growth.
          </p>
        </CardContent>
      </Card>

      {/* Key Components */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Key Components</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our structured Digital Transformation approach covers every critical aspect of your digital presence, including:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyComponents.map((component, index) => (
            <Card key={index} className={`hover:shadow-lg transition-shadow ${component.color}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    {component.icon}
                  </div>
                  <CardTitle className="text-lg">{component.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{component.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Transformation Journey */}
      <ScrollJourney 
        type="phases"
        title="Your Digital Transformation Journey"
        subtitle="Watch your progress through our comprehensive 5-phase digital transformation process"
        phases={transformationPhases}
        carStartPosition={70}
        carEndPosition={1900}
      />

      {/* Outcomes & Ideal For */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Outcomes You Can Expect</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">
              By choosing our Digital Transformation Package, your organization will:
            </p>
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex items-start space-x-3">
                {outcome.icon}
                <p className="text-sm text-muted-foreground">{outcome.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Ideal for:</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {idealFor.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Why Choose AIDM */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AIDM?</h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {whyChooseAIDM.map((reason, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {reason.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
                    <p className="text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Transform Your Digital Presence?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Take the first step towards comprehensive digital transformation with our expert team. 
            Schedule your discovery session today and see how AI can revolutionize your digital strategy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDigitalTransformation; 