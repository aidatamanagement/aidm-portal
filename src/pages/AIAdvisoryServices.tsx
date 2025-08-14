import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, CheckCircle, Clock, MessageSquare, BookOpen, Shield, TrendingUp, Lightbulb, Award } from 'lucide-react';

const AIAdvisoryServices = () => {
  const navigate = useNavigate();

  const flexibleServices = [
    {
      title: "Short-term Strategic Advisory",
      description: "Targeted expert advice for immediate business needs and opportunities.",
      icon: <Target className="h-5 w-5 text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Project-based AI Implementation Guidance",
      description: "Dedicated consulting for specific AI projects, ensuring successful integration and measurable ROI.",
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Custom AI Training Workshops",
      description: "Tailored sessions to upskill your team in AI fundamentals, advanced applications, and strategic implementation.",
      icon: <BookOpen className="h-5 w-5 text-orange-600" />,
      color: "bg-orange-50 border-orange-200"
    },
    {
      title: "Executive Coaching for AI Adoption",
      description: "Personalized coaching designed to prepare executives to confidently lead AI transformation.",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Specialized AI Compliance Consulting",
      description: "Expert guidance to maintain compliance with critical standards such as GDPR, HIPAA, and SOC 2.",
      icon: <Shield className="h-5 w-5 text-red-600" />,
      color: "bg-red-50 border-red-200"
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Initial Free Consultation",
      description: "We start with a complimentary consultation to clearly understand your organization's unique challenges, current landscape, and strategic goals.",
      icon: <MessageSquare className="h-6 w-6 text-primary" />
    },
    {
      step: "2", 
      title: "Tailored Proposal with Transparent Pricing",
      description: "Next, we develop a customized proposal outlining recommended services, clear objectives, deliverables, timelines, and transparent pricing—giving you complete clarity before you commit.",
      icon: <Target className="h-6 w-6 text-primary" />
    },
    {
      step: "3",
      title: "Flexible, Scalable Engagement",
      description: "Once engaged, our expert CTO deliver flexible, scalable support that can adjust as your needs evolve, ensuring you receive precisely the expertise and resources required for success.",
      icon: <TrendingUp className="h-6 w-6 text-primary" />
    }
  ];

  const popularServices = [
    {
      title: "Executive AI Literacy Workshops",
      description: "Equip leadership teams with the critical knowledge and skills to confidently drive AI initiatives.",
      icon: <Award className="h-5 w-5 text-blue-600" />
    },
    {
      title: "AI-Driven Workflow Analysis", 
      description: "Identify and prioritize opportunities for workflow automation, efficiency gains, and productivity improvements.",
      icon: <TrendingUp className="h-5 w-5 text-green-600" />
    },
    {
      title: "AI Agent Pilot Programs",
      description: "Launch and test custom AI agents within targeted business units to validate effectiveness and measure potential ROI.",
      icon: <Lightbulb className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Enterprise Data Optimization Sessions",
      description: "Strengthen your data foundation, enhance compliance, and prepare your organization for effective AI implementation.",
      icon: <Shield className="h-5 w-5 text-purple-600" />
    }
  ];

  const idealClients = [
    "Need specialized expertise for targeted projects or pressing challenges.",
    "Prefer flexible, customized engagements over fixed, structured frameworks.", 
    "Are exploring AI opportunities but not yet ready to commit to a comprehensive adoption program."
  ];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline" 
          disabled
          className="flex items-center space-x-2 bg-gray-100 text-gray-400 cursor-not-allowed"
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
              AI Advisory & CTO
            </Badge>
            <h1 className="text-4xl font-bold mb-4">AI Advisory & CTO Services</h1>
            <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              Personalized, flexible AI advisory and CTO service designed to meet your unique business objectives—no matter where you are on your AI journey.
            </p>
          </div>
        </div>
      </div>

      {/* Flexible AI Advisory Solutions */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Flexible AI Advisory Solutions</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            AIDM's À la Carte Advisory & CTO Services offer targeted, customized expertise precisely when and how you need it. Rather than a one-size-fits-all approach, we provide flexible, bespoke engagements designed to address your organization's specific AI challenges and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flexibleServices.map((service, index) => (
            <Card key={index} className={`hover:shadow-lg transition-shadow ${service.color}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    {service.icon}
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ideal Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Ideal for Clients Who:</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {idealClients.map((client, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{client}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Ready to Explore AI's Full Potential?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Discover how prepared your organization is for AI implementation and identify the right custom AI agent solution for your business.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How We Create Customized Offers */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How We Create Customized Offers</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            At AIDM, we ensure each CTO engagement perfectly matches your organizational needs:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                  {step.step}
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Popular À la Carte Services */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Popular À la Carte Services</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our clients frequently choose the following high-value advisory engagements:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {popularServices.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Take the first step towards AI transformation with our expert advisory services. 
            Schedule your complimentary consultation today.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAdvisoryServices; 