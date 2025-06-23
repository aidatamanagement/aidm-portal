import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Trash2 } from 'lucide-react';

interface LessonManagementProps {
  courses: any[];
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lesson: any) => void;
  onAddLesson: (courseId: string) => void;
}

const LessonManagement: React.FC<LessonManagementProps> = ({
  courses,
  onEditLesson,
  onDeleteLesson,
  onAddLesson
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Management</CardTitle>
        <CardDescription>Edit and manage course lessons</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courses?.map((course) => (
            <div key={course.id} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{course.title}</h3>
              <div className="space-y-2">
                {course.lessons?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No lessons yet. Click "Add Lesson" above to create the first lesson.</p>
                ) : (
                  course.lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="border rounded p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                          <span className="font-medium">{lesson.title}</span>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditLesson(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteLesson(lesson)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonManagement;
