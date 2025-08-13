
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AssignServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  assignedServiceIds: string[];
}

const AssignServiceModal = ({ open, onOpenChange, studentId, assignedServiceIds }: AssignServiceModalProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: availableServices } = useQuery({
    queryKey: ['available-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      return data || [];
    },
  });

  // Get the AI Leadership course ID
  const { data: aiLeadershipCourse } = useQuery({
    queryKey: ['ai-leadership-course'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .ilike('title', '%leadership%')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const assignServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      // First, assign the service
      const { error: serviceError } = await supabase
        .from('user_services')
        .insert({
          user_id: studentId,
          service_id: serviceId,
          status: 'active'
        });
      
      if (serviceError) throw serviceError;

      // Check if this is the AI Leadership service and automatically assign the course
      const selectedService = availableServices?.find(service => service.id === serviceId);
      if (selectedService && aiLeadershipCourse) {
        const isLeadershipService = selectedService.title.toLowerCase().includes('leadership') || 
                                   selectedService.title.toLowerCase().includes('training');
        
        if (isLeadershipService) {
          // Check if user is already assigned to this course
          const { data: existingAssignment } = await supabase
            .from('user_course_assignments')
            .select('id')
            .eq('user_id', studentId)
            .eq('course_id', aiLeadershipCourse.id);

          // Only assign if not already assigned
          if (!existingAssignment || existingAssignment.length === 0) {
            const { error: courseError } = await supabase
              .from('user_course_assignments')
              .insert({
                user_id: studentId,
                course_id: aiLeadershipCourse.id,
                locked: false
              });

            if (courseError) {
              console.error('Failed to auto-assign AI Leadership course:', courseError);
              // Don't throw error here as service assignment was successful
            }
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Service assigned successfully');
      onOpenChange(false);
      setSelectedServiceId('');
      queryClient.invalidateQueries({ queryKey: ['admin-student-services', studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-courses', studentId] });
    },
    onError: (error) => {
      toast.error('Failed to assign service');
      console.error('Assign service error:', error);
    },
  });

  const handleAssign = () => {
    if (!selectedServiceId) {
      toast.error('Please select a service');
      return;
    }
    assignServiceMutation.mutate(selectedServiceId);
  };

  const unassignedServices = availableServices?.filter(
    service => !assignedServiceIds.includes(service.id)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Service</DialogTitle>
          <DialogDescription>
            Select a service to assign to this student.
            {aiLeadershipCourse && (
              <span className="block mt-2 text-sm text-muted-foreground">
                Note: AI Leadership services will automatically assign the "{aiLeadershipCourse.title}" course.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="service">Service</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {unassignedServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title} - {service.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={assignServiceMutation.isPending || !selectedServiceId}
          >
            {assignServiceMutation.isPending ? 'Assigning...' : 'Assign Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignServiceModal;
