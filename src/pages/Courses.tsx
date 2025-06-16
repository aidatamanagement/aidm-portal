
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, PlayCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Courses = () => {
  const courses = [
    {
      id: 1,
      title: "AI Leadership Fundamentals",
      description: "Master the core principles of leading in an AI-driven world. Learn to navigate technological change and guide your team through digital transformation.",
      lessonCount: 12,
      duration: "6 weeks",
      progress: 75,
      status: "enrolled",
      level: "Beginner",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Strategic Decision Making",
      description: "Develop advanced decision-making frameworks using data analytics and AI insights to drive strategic business outcomes.",
      lessonCount: 8,
      duration: "4 weeks", 
      progress: 45,
      status: "enrolled",
      level: "Intermediate",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Advanced Communication",
      description: "Enhance your communication skills for the digital age. Learn to engage stakeholders and lead virtual teams effectively.",
      lessonCount: 10,
      duration: "5 weeks",
      progress: 0,
      status: "locked",
      level: "Advanced",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 4,
      title: "Innovation Leadership",
      description: "Foster innovation culture and lead breakthrough initiatives. Create environments where creativity and technology converge.",
      lessonCount: 15,
      duration: "8 weeks",
      progress: 0,
      status: "available",
      level: "Advanced",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 5,
      title: "Ethics in AI Leadership",
      description: "Navigate the ethical complexities of AI implementation. Build responsible AI governance frameworks for your organization.",
      lessonCount: 6,
      duration: "3 weeks",
      progress: 0,
      status: "available",
      level: "Intermediate",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 6,
      title: "Global Leadership Dynamics",
      description: "Lead diverse, distributed teams across cultures and time zones. Master cross-cultural communication and global strategy execution.",
      lessonCount: 14,
      duration: "7 weeks",
      progress: 0,
      status: "locked",
      level: "Advanced",
      thumbnail: "/placeholder.svg"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-primary text-white">Enrolled</Badge>;
      case 'available':
        return <Badge variant="outline" className="border-primary text-primary">Available</Badge>;
      case 'locked':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Locked</Badge>;
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-green-600 bg-green-50';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-50';
      case 'Advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg p-8 shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
        <p className="text-gray-600">Explore our comprehensive AI leadership curriculum designed to accelerate your growth.</p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Course Image */}
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg font-semibold leading-tight">{course.title}</CardTitle>
                {course.status === 'locked' && <Lock className="h-4 w-4 text-gray-400 mt-1" />}
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                {getStatusBadge(course.status)}
                <Badge variant="outline" className={`text-xs ${getLevelColor(course.level)}`}>
                  {course.level}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <PlayCircle className="h-4 w-4" />
                  <span>{course.lessonCount} lessons</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
              </div>

              {course.status === 'enrolled' && course.progress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}

              <div className="flex space-x-2">
                {course.status === 'enrolled' ? (
                  <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                    <Link to={`/courses/${course.id}`}>
                      {course.progress > 0 ? 'Continue' : 'Start Course'}
                    </Link>
                  </Button>
                ) : course.status === 'available' ? (
                  <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-white">
                    Enroll Now
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="flex-1">
                    Locked
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Courses;
