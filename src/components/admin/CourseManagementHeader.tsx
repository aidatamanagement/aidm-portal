
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CourseManagementHeaderProps {
  onAddCourse: () => void;
}

const CourseManagementHeader: React.FC<CourseManagementHeaderProps> = ({ onAddCourse }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[#0D5C4B]">Course Management</h1>
        <p className="text-muted-foreground">Manage courses and lesson access</p>
      </div>
      <Button onClick={onAddCourse}>
        <Plus className="h-4 w-4 mr-2" />
        Add Course
      </Button>
    </div>
  );
};

export default CourseManagementHeader;
