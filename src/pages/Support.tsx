
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, HelpCircle } from 'lucide-react';
import LiveChat from '@/components/LiveChat';

const Support = () => {
  const faqs = [
    {
      question: "How do I access my courses?",
      answer: "Navigate to the Courses page from the main menu. You'll see all available courses and your progress."
    },
    {
      question: "How do I mark a lesson as complete?",
      answer: "Open any lesson and click the 'Mark Complete' button at the bottom of the lesson viewer."
    },
    {
      question: "Where can I find my files?",
      answer: "All your files are available in the Files section. You can search and filter by file type."
    },
    {
      question: "How do I favorite writing prompts?",
      answer: "Click the heart icon on any prompt card to add it to your favorites."
    }
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-gray-600">We're here to help you succeed in your learning journey</p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="text-center pt-6">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">Get instant help from our support team</p>
              <p className="text-xs text-green-600 font-medium">Click the chat button below!</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center pt-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-4">Send us an email and we'll respond within 24 hours</p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center pt-6">
              <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-4">Call us during business hours</p>
              <Button variant="outline" className="w-full">
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">User Guide</div>
                  <div className="text-sm text-gray-600">Complete guide to using the platform</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Video Tutorials</div>
                  <div className="text-sm text-gray-600">Step-by-step video guides</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">System Status</div>
                  <div className="text-sm text-gray-600">Check platform availability</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Feature Requests</div>
                  <div className="text-sm text-gray-600">Suggest new features</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat Component */}
      <LiveChat />
    </>
  );
};

export default Support;
