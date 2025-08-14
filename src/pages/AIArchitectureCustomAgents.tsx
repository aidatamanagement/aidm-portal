import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Users, DollarSign, HeadphonesIcon, Target, CheckCircle, TrendingUp, Shield, Lightbulb, BarChart3, Zap, Clock, Award } from 'lucide-react';

const AIArchitectureCustomAgents = () => {
  const navigate = useNavigate();

  const customAgentApplications = [
    {
      title: "HR Assistant",
      description: "Automating recruitment processes, resume screening, and employee onboarding.",
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "Onboarding Guide",
      description: "Delivering personalized training and compliance tracking for new hires.",
      icon: <Target className="h-6 w-6 text-green-600" />,
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Finance Assistant",
      description: "Streamlining invoicing, financial reporting, and expense management.",
      icon: <DollarSign className="h-6 w-6 text-orange-600" />,
      color: "bg-orange-50 border-orange-200"
    },
    {
      title: "Customer Support Agent",
      description: "Automatically handling common customer queries, troubleshooting, and enhancing engagement.",
      icon: <HeadphonesIcon className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-200"
    }
  ];

  const approachSteps = [
    {
      step: "1",
      title: "Needs Assessment & Workflow Analysis",
      description: "We start by thoroughly understanding your organization's specific needs, current challenges, and existing workflows. This critical phase ensures that the AI agent we build addresses your real-world problems effectively.",
      icon: <Target className="h-6 w-6 text-primary" />
    },
    {
      step: "2",
      title: "AI Agent Design & Integration",
      description: "Next, our AI specialists design your AI agent, customizing its capabilities to match your unique workflows. We integrate the agent smoothly into your existing technology infrastructure, minimizing disruption and maximizing usability from day one.",
      icon: <Bot className="h-6 w-6 text-primary" />
    },
    {
      step: "3",
      title: "Pilot Testing, Feedback, and Continuous Optimization",
      description: "We rigorously pilot test your AI agent in real-world scenarios, gather user feedback, and continuously refine its performance. This ongoing optimization ensures your AI agent remains accurate, compliant, and highly effective as your organization evolves.",
      icon: <BarChart3 className="h-6 w-6 text-primary" />
    }
  ];

  const benefits = [
    {
      title: "Increased Operational Efficiency",
      description: "Automate routine tasks, reducing operational bottlenecks and significantly increasing productivity.",
      icon: <Zap className="h-5 w-5 text-blue-600" />
    },
    {
      title: "Reduction of Manual Tasks & Errors",
      description: "Minimize human error and free your workforce to focus on strategic, high-value tasks.",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    },
    {
      title: "Enhanced Employee Productivity",
      description: "Empower employees with AI-powered support, helping them achieve more in less time.",
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />
    },
    {
      title: "Consistent Compliance & Data Security",
      description: "AI agents proactively manage compliance, ensuring adherence to standards like GDPR and HIPAA, and safeguarding sensitive data.",
      icon: <Shield className="h-5 w-5 text-purple-600" />
    }
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
              AI Architecture & Custom Agents
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Unlock Your Business Potential with Custom AI Agents</h1>
            <p className="text-xl text-white/90 mb-6 max-w-4xl mx-auto">
              Tailored, AI-powered assistants designed specifically to streamline your operations, automate workflows, and drive strategic decision-making.
            </p>
          </div>
        </div>
      </div>

      {/* What is AI Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <span>What is AI Architecture?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AI Architecture is the foundational structure behind any AI system—much like the blueprint of a building. It defines how data flows, how the AI learns and processes information, and how users interact with the AI solution. A well-designed AI architecture ensures your AI systems perform reliably, adapt effectively to your unique needs, and scale smoothly as your organization grows.
          </p>
        </CardContent>
      </Card>

      {/* What Are Custom AI Agents */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">What Are Custom AI Agents?</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Custom AI Agents are personalized digital assistants powered by artificial intelligence, specifically tailored to perform tasks relevant to your organization's workflows and processes. Unlike generic AI tools, custom AI agents deeply understand your unique operations, integrate seamlessly into your existing systems, and actively automate routine tasks.
            </p>
            <p className="text-lg font-medium text-foreground">
              Common applications of Custom AI Agents include:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customAgentApplications.map((application, index) => (
            <Card key={index} className={`hover:shadow-lg transition-shadow ${application.color}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    {application.icon}
                  </div>
                  <CardTitle className="text-lg">{application.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{application.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Approach */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Approach to Custom AI Agents</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            At AIDM, we take a structured, collaborative approach to building and deploying your custom AI agents:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {approachSteps.map((step, index) => (
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

      {/* Benefits */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Benefits of Implementing Custom AI Agents</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Deploying tailored AI agents into your operations delivers immediate and long-term measurable results, including:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Explore AI's Full Potential?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Discover how prepared your organization is for AI implementation and identify the right custom AI agent solution for your business.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIArchitectureCustomAgents; 