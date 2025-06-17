
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText, Edit, Trash2, Lock, Unlock, Plus } from 'lucide-react';

interface LessonManagementProps {
  courses: any[];
  students: any[];
  courseAssignments: any[];
  lessonLocks: any[];
  isLessonLocked: (lessonId: string, studentId: string) => boolean;
  onToggleLessonLock: (lessonId: string, studentId: string, locked: boolean) => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lesson: any) => void;
  onAddLesson: (courseId: string) => void;
}

const LessonManagement: React.FC<LessonManagementProps> = ({
  courses,
  students,
  courseAssignments,
  lessonLocks,
  isLessonLocked,
  onToggleLessonLock,
  onEditLesson,
  onDeleteLesson,
  onAddLesson
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Management</CardTitle>
        <CardDescription>Edit lessons and manage individual lesson access for students</CardDescription>
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
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{lesson.title}</span>
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
                      <div className="space-y-2">
                        {students?.map((student) => {
                          const isAssigned = courseAssignments?.some(ca => 
                            ca.course_id === course.id && ca.user_id === student.id
                          );
                          
                          if (!isAssigned) return null;

                          const locked = isLessonLocked(lesson.id, student.id);
                          
                          return (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{student.name}</span>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`lock-${lesson.id}-${student.id}`} className="text-xs">
                                  {locked ? 'Locked' : 'Unlocked'}
                                </Label>
                                <Switch
                                  id={`lock-${lesson.id}-${student.id}`}
                                  checked={locked}
                                  onCheckedChange={(checked) => 
                                    onToggleLessonLock(lesson.id, student.id, checked)
                                  }
                                />
                                {locked ? (
                                  <Lock className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Unlock className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
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
