
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ProgressCircle from '@/components/ProgressCircle';
import ChatSupport from '@/components/ChatSupport';
import { PlayCircle, FileText, Heart, Clock, BookOpen, Award } from 'lucide-react';

const Dashboard = () => {
  // Mock data - would come from Supabase in real implementation
  const studentName = "John";
  const overallProgress = 68;
  const enrolledCourses = [
    { id: 1, title: "AI Leadership Fundamentals", progress: 75, lessons: 12, completedLessons: 9, status: "active" },
    { id: 2, title: "Strategic Decision Making", progress: 45, lessons: 8, completedLessons: 4, status: "active" },
    { id: 3, title: "Advanced Communication", progress: 0, lessons: 10, completedLessons: 0, status: "locked" },
  ];

  const recentFiles = [
    { id: 1, name: "Leadership Framework Guide.pdf", date: "2024-01-15", type: "pdf" },
    { id: 2, name: "Strategy Session Recording.mp4", date: "2024-01-14", type: "video" },
    { id: 3, name: "Communication Templates.pdf", date: "2024-01-12", type: "pdf" },
  ];

  const dailyPrompt = {
    title: "Reflect on Leadership Challenges",
    content: "Describe a recent situation where you had to make a difficult decision as a leader. What factors did you consider, and how did you ensure your team was aligned with your choice?",
    isFavorited: false
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-8 shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {studentName}! 👋
        </h1>
        <p className="text-gray-600">Ready to continue your leadership journey?</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Overall Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <ProgressCircle progress={overallProgress} />
            <Button className="w-full bg-primary hover:bg-primary/90">
              Resume Learning
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Enrolled Courses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <span className="text-sm text-gray-500">
                    {course.completedLessons}/{course.lessons} lessons
                  </span>
                </div>
                <div className="mb-3">
                  <Progress value={course.progress} className="h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{course.progress}% complete</span>
                  <Button 
                    variant={course.status === 'locked' ? 'outline' : 'default'}
                    size="sm"
                    disabled={course.status === 'locked'}
                    className={course.status !== 'locked' ? 'bg-primary hover:bg-primary/90' : ''}
                  >
                    {course.status === 'locked' ? 'Locked' : 'Continue'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Recent Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                <div className="p-2 bg-primary/10 rounded-md">
                  {file.type === 'pdf' ? (
                    <FileText className="h-4 w-4 text-primary" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.date}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View All Files
            </Button>
          </CardContent>
        </Card>

        {/* Daily Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Daily Prompt</span>
              </div>
              <Button variant="ghost" size="icon">
                <Heart className={`h-4 w-4 ${dailyPrompt.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-gray-900 mb-2">{dailyPrompt.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{dailyPrompt.content}</p>
            <Button variant="outline" className="w-full">
              Start Writing
            </Button>
          </CardContent>
        </Card>
      </div>

      <ChatSupport />
    </div>
  );
};

export default Dashboard;
