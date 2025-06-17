
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, MessageCircle, Send } from 'lucide-react';

const ChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const faqItems = [
    { question: "How do I access my course materials?", answer: "Navigate to the Courses section and click on any enrolled course." },
    { question: "Can I download my files?", answer: "Yes, visit the Files section and use the download button on any file." },
    { question: "How do I favorite a prompt?", answer: "Click the heart icon on any prompt card to add it to your favorites." },
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl border-0 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-white rounded-t-lg">
        <CardTitle className="text-sm font-medium">Support Chat</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="text-sm text-gray-600 mb-4">
            Hi! How can we help you today? Here are some common questions:
          </div>
          {faqItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
              <div className="text-sm font-medium text-gray-900 mb-1">{item.question}</div>
              <div className="text-xs text-gray-600">{item.answer}</div>
            </div>
          ))}
        </div>
        <div className="flex mt-4 space-x-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSupport;
