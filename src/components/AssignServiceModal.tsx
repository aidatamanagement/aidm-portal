
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

  const assignServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('user_services')
        .insert({
          user_id: studentId,
          service_id: serviceId,
          status: 'active'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service assigned successfully');
      onOpenChange(false);
      setSelectedServiceId('');
      queryClient.invalidateQueries({ queryKey: ['admin-student-services', studentId] });
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
