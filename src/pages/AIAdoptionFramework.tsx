import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, TrendingUp, Shield, Lightbulb, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollJourney from '@/components/ScrollJourney';

const AIAdoptionFramework = () => {
  const navigate = useNavigate();

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

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Your Roadmap to Strategic AI Adoption</h1>
            <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              Strategic AI Integration Framework
            </p>
            <p className="text-white/80 max-w-4xl mx-auto">
              Transform your operations, streamline workflows, and build competitive advantage with our structured, phased AI adoption framework. 
              Our comprehensive 12-month plan guides organizations seamlessly through digital transformation and AI integration.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Overview Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">AI Adoption Framework</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          </div>
          
          <Card className="mb-8">
            <CardContent className="p-8">
              <p className="text-lg leading-relaxed text-muted-foreground">
                The AI Adoption Framework from AI Data Management (AIDM) is a structured 12-month plan designed to guide organizations seamlessly through digital transformation and AI integration. Our phased approach ensures efficiency, measurable ROI, and long-term success without overwhelming your resources.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Journey Visualization */}
        <ScrollJourney 
          type="phases"
          title="The 4 Phases of AI Adoption"
          subtitle="Experience your 12-month progression through our interactive roadmap"
          carStartPosition={48}
          carEndPosition={1300}
        />

        {/* Outcomes Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Outcomes You Can Expect</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Operational Efficiency</h3>
                <p className="text-sm text-muted-foreground">Achieve significant reduction in manual processes, freeing your team for strategic tasks.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Improved Decision-Making</h3>
                <p className="text-sm text-muted-foreground">Leverage real-time analytics and predictive insights for smarter, faster decisions.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Enhanced Compliance</h3>
                <p className="text-sm text-muted-foreground">Maintain rigorous compliance with GDPR, HIPAA, and industry-specific regulations through automated monitoring.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Competitive Advantage</h3>
                <p className="text-sm text-muted-foreground">Stay ahead by strategically adopting AI solutions tailored specifically for your business.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Book a Call to Unlock These Outcomes</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Ready to transform your organization with strategic AI adoption? Schedule your consultation today and discover how our framework can drive measurable results for your business.
              </p>
            </CardContent>
          </Card>
        </div>

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
                    <h3 className="font-semibold text-foreground mb-2">Proven Methodology</h3>
                    <p className="text-muted-foreground">Structured, phased framework proven to deliver measurable ROI.</p>
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
                    <h3 className="font-semibold text-foreground mb-2">Tailored Solutions</h3>
                    <p className="text-muted-foreground">Customized AI strategy aligning with your unique operational needs and business goals.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Expert Guidance</h3>
                    <p className="text-muted-foreground">Experienced consultants providing hands-on support throughout every stage.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Ethical & Secure</h3>
                    <p className="text-muted-foreground">Compliance-first approach prioritizing data security and regulatory adherence.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdoptionFramework; 