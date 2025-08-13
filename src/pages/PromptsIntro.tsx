import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Users,
  CheckCircle,
  Play
} from 'lucide-react';

function PromptsIntro() {
  const navigate = useNavigate();

  const goToPrompts = () => {
    navigate('/prompts');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Header content removed */}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-cover bg-center bg-no-repeat text-white py-20 mx-4 rounded-2xl" style={{ backgroundImage: 'url(/images/PromptBuilder.png)' }}>
        <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            AIDM Prompt Builder: Free AI Tools for Leaders
          </h1>
          <p className="max-w-4xl mx-auto mb-8" style={{ color: '#FFF', textAlign: 'center', fontFamily: '"SF Pro Text"', fontSize: '16px', fontStyle: 'normal', fontWeight: 500, lineHeight: '121.525%', letterSpacing: '-0.48px' }}>
            Welcome to AIDM's comprehensive Prompt Builder - your free gateway to mastering AI communication. 
            Access hundreds of expertly crafted prompts designed specifically for business leaders, executives, 
            and teams ready to harness AI's full potential.
          </p>
          <Button 
            onClick={goToPrompts}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
          >
            Start Building Now
            <Play className="h-4 w-4 ml-2 bg-white text-primary rounded-full p-0.5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* What is the AIDM Prompt Builder? */}
            <section id="introduction">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '40px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-1.2px' }}>
                What is the AIDM Prompt Builder?
              </h2>
              <p className="leading-relaxed" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                The AIDM Prompt Builder is our free, comprehensive library of business-focused AI prompts that help leaders
                communicate effectively with AI tools like ChatGPT, Claude, and other language models. No registration
                barriers, no paywalls - just immediate access to professional-grade prompts.
              </p>
            </section>

            {/* Why Prompt Building Matters */}
            <section id="why-matters">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                Why Prompt Building Matters
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                Effective prompt building is the difference between generic AI outputs and strategic business intelligence. 
                In today's AI-driven landscape, your ability to communicate with AI tools directly impacts your competitive advantage.
              </p>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
                <h3 className="mb-4" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>The Business Impact</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Time Efficiency:</span>
                    <span style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>Well-crafted prompts deliver better results faster</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Quality Outputs:</span>
                    <span style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>Strategic prompting produces executive-ready content</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Consistency:</span>
                    <span style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>Standardized prompts ensure reliable, professional results</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Scalability:</span>
                    <span style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>Effective prompts can be shared across teams and departments</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>ROI Maximization:</span>
                    <span style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>Better prompts mean better AI tool investment returns</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={goToPrompts}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
              >
                Start Building Now
                <Play className="h-4 w-4 ml-2 bg-white text-primary rounded-full p-0.5" />
              </Button>

              <p className="mt-8 leading-relaxed" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                Most leaders struggle with AI because they treat it like a search engine rather than a strategic partner. 
                Generic prompts like "analyze this data" produce generic results. Strategic prompting requires understanding 
                AI's capabilities and optimal communication patterns.
              </p>
            </section>

            {/* The Executive Challenge */}
            <section id="executive-challenge">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                The Executive Challenge
              </h2>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="leading-relaxed" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                  Unlike traditional automation tools, Lindy's Auto mode sees everything — form submissions, API responses,
                  search results, and more. It's like having an assistant who remembers every detail.
                </p>
              </div>
            </section>

            {/* Core Concepts */}
            <section id="core-concepts">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                Core Concepts
              </h2>
              <p className="mb-8" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                AIDM's proven methodology for executive-level AI communication:
              </p>

              <div className="space-y-8">
                <div className="flex space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="mb-2" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>The PTCF Framework</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>P - Purpose</h4>
                        <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                          Define your <span style={{ textDecoration: 'underline', textDecorationColor: '#026242', fontWeight: 600 }}>specific objective</span> clearly and measurably.
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                          <li>What business outcome do you need?</li>
                          <li>How will you measure success?</li>
                          <li>What decision will this output inform?</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>T - Task</h4>
                    <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      Structure your request with <span style={{ textDecoration: 'underline', textDecorationColor: '#026242', fontWeight: 600 }}>clear deliverables</span> and scope.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      <li>What specific work should AI perform?</li>
                      <li>What format do you need for the output?</li>
                      <li>What level of detail is required?</li>
                    </ul>
                  </div>
                </div>

                <div className="flex space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>C - Context</h4>
                    <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      <span style={{ textDecoration: 'underline', textDecorationColor: '#026242', fontWeight: 600 }}>Provide relevant background</span> information and constraints.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      <li>What's the business situation?</li>
                      <li>What factors should AI consider?</li>
                      <li>What limitations or requirements exist?</li>
                    </ul>
                  </div>
                </div>

                <div className="flex space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <h4 style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>F - Format</h4>
                    <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      <span style={{ textDecoration: 'underline', textDecorationColor: '#026242', fontWeight: 600 }}>Specify exactly</span> how you want the output structured.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                      <li>What format serves your needs best?</li>
                      <li>Who is the intended audience?</li>
                      <li>How will this output be used?</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Common Pitfalls */}
            <section id="advanced">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                Common Pitfalls
              </h2>
              <div className="space-y-6">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="mb-3" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Generic Requests</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px', fontStyle: 'italic' }}>"Analyze my marketing data and give me insights"</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>"Analyze Q4 marketing data to identify the top 3 underperforming campaigns and recommend 2 specific optimization strategies for each"</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <h3 className="mb-3" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Missing Business Context</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px', fontStyle: 'italic' }}>"Asking for strategy without explaining market position or constraints"</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>"Our B2B SaaS faces 15% churn rate and budget constraints limiting us to digital channels only"</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <h3 className="mb-3" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Undefined Success Criteria</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px', fontStyle: 'italic' }}>"Create a plan"</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>"Create a 90-day implementation plan with weekly milestones, resource requirements, and success metrics"</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <h3 className="mb-3" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Wrong Output Format</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px', fontStyle: 'italic' }}>"Getting technical deep-dive when you need executive summary"</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>"Format as executive summary (3 bullet points) for board presentation"</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Prompt Categories */}
            <section id="categories">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                Prompt Categories
              </h2>
              <p className="mb-8" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                Transform complex business challenges into clear AI conversations.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="mb-4" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>1. Strategic Planning & Analysis</h3>
                  <div className="bg-muted/50 rounded-lg p-6 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <Badge className="bg-primary text-white">Market Analysis Generator</Badge>
                        <Badge className="bg-primary text-white">SWOT Analysis Creator</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-card border rounded-lg p-4 font-mono text-sm" style={{ color: '#242424', fontFamily: '"Fira Code"', fontSize: '16px', fontWeight: 400, lineHeight: '141%', letterSpacing: '-0.48px' }}>
                      Analyze [industry] market trends over the past 18 months and identify three strategic opportunities for
                      growth, considering current economic conditions, competitive landscape, and emerging technologies. Format as
                      executive briefing with risk assessment and resource requirements for each opportunity.
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>2. Leadership & Management</h3>
                  <p className="mb-4" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                    Enhance leadership effectiveness with AI-powered insights.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <Badge className="bg-primary text-white">Decision-Making Framework</Badge>
                        <Badge className="bg-primary text-white">Team Performance Review</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-card border rounded-lg p-4 font-mono text-sm" style={{ color: '#242424', fontFamily: '"Fira Code"', fontSize: '16px', fontWeight: 400, lineHeight: '141%', letterSpacing: '-0.48px' }}>
                      Analyze this business decision using a structured approach: 1) Financial impact and ROI projections, 2)
                      Strategic alignment with company objectives, 3) Resource requirements and timeline, 4) Risk assessment and
                      mitigation strategies, 5) Success metrics and monitoring plan. Provide clear recommendation with rationale.
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>3. Data Analysis & Reporting</h3>
                  <p className="mb-4" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                    Transform raw data into executive-ready insights.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <Badge className="bg-primary text-white">Executive Dashboard Creator</Badge>
                        <Badge className="bg-primary text-white">Competitive Intelligence Brief</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-card border rounded-lg p-4 font-mono text-sm" style={{ color: '#242424', fontFamily: '"Fira Code"', fontSize: '16px', fontWeight: 400, lineHeight: '141%', letterSpacing: '-0.48px' }}>
                      Analyze this dataset and identify the 5 most critical KPIs that executives should monitor daily. For each KPI:
                      define the metric, explain business impact, set benchmark targets, identify data sources, and suggest alert
                      thresholds for immediate attention.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started">
              <h2 className="mb-6" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '25px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.75px' }}>
                Getting Started
              </h2>
              <div>
                <h3 className="mb-4" style={{ color: '#242424', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 600 }}>Quick Start Guide</h3>
                <ol className="list-decimal list-inside space-y-3" style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '16px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.48px' }}>
                  <li>
                    <span style={{ color: '#242424', fontWeight: 600 }}>Browse Categories: </span>
                    Navigate business-focused prompt collections
                  </li>
                  <li>
                    <span style={{ color: '#242424', fontWeight: 600 }}>Select Template: </span>
                    Choose prompts matching your needs
                  </li>
                  <li>
                    <span style={{ color: '#242424', fontWeight: 600 }}>Customize Context: </span>
                    Adapt with your specific situation and requirements
                  </li>
                  <li>
                    <span style={{ color: '#242424', fontWeight: 600 }}>Copy & Apply: </span>
                    Use immediately in ChatGPT, Claude, or preferred AI tool
                  </li>
                  <li>
                    <span style={{ color: '#242424', fontWeight: 600 }}>Iterate & Improve: </span>
                    Refine based on results and feedback
                  </li>
                </ol>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="rounded-[10px] border border-[#D9D9D9] bg-[#F9F9F9] p-6">
                <h3 className="mb-4" style={{ color: '#242424', fontFamily: 'Helvetica', fontSize: '16px', fontWeight: 700, lineHeight: '121.525%', letterSpacing: '-0.48px' }}>On this Page</h3>
                <nav className="space-y-2">
                  <button 
                    onClick={() => scrollToSection('introduction')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Introduction
                  </button>
                  <button 
                    onClick={() => scrollToSection('why-matters')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Why Prompt Building Matters
                  </button>
                  <button 
                    onClick={() => scrollToSection('core-concepts')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Core Concepts
                  </button>
                  <button 
                    onClick={() => scrollToSection('categories')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Prompt Categories
                  </button>
                  <button 
                    onClick={() => scrollToSection('advanced')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Advanced Techniques
                  </button>
                  <button 
                    onClick={() => scrollToSection('getting-started')}
                    className="block text-sm hover:text-foreground transition-colors text-left w-full"
                    style={{ color: '#706F6F', fontFamily: '"SF Pro Text"', fontSize: '14px', fontWeight: 400, lineHeight: '100%', letterSpacing: '-0.42px' }}
                  >
                    Getting Started
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
            Ready to Master AI Leadership?
          </h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8">
            You've learned the fundamentals - now take it further. Access our complete prompt library, 
            join the AI Leadership Mastery Series, and transform how you lead with AI.
          </p>
          <Button 
            onClick={goToPrompts}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
          >
            Access the Prompt Builder
            <Play className="h-4 w-4 ml-2 bg-white text-primary rounded-full p-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PromptsIntro;
