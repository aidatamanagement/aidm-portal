
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Plus, Edit } from 'lucide-react';

interface CourseOverviewCardsProps {
  courses: any[];
  courseAssignments: any[];
  onEditCourse: (course: any) => void;
  onAddLesson: (courseId: string) => void;
}

const CourseOverviewCards: React.FC<CourseOverviewCardsProps> = ({
  courses,
  courseAssignments,
  onEditCourse,
  onAddLesson
}) => {
  const getAssignedStudentCount = (courseId: string) => {
    return courseAssignments?.filter(assignment => assignment.course_id === courseId).length || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses?.map((course) => {
        const assignedCount = getAssignedStudentCount(course.id);
        const lessonCount = course.lessons?.length || 0;
        
        return (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-[#0D5C4B]" />
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditCourse(course)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lessons:</span>
                  <span className="font-medium">{lessonCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Assigned Students:</span>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-[#0D5C4B]">{assignedCount}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddLesson(course.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseOverviewCards;
